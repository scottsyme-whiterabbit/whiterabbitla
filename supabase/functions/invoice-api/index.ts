import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";
import {
  type Invoice, balanceCents, depositCents, invoiceEmail, money, sendEmail,
} from "../_shared/invoice-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-password",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);
const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD") || "";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const isAdmin = (req: Request, body?: any) =>
  ADMIN_PASSWORD.length > 0 &&
  (req.headers.get("x-admin-password") === ADMIN_PASSWORD || body?.adminPassword === ADMIN_PASSWORD);

const publicView = (inv: Invoice) => ({
  pay_token: inv.pay_token,
  client_name: inv.client_name,
  event_type: inv.event_type,
  event_date: inv.event_date,
  venue: inv.venue,
  tier_name: inv.tier_name,
  total_cents: inv.total_cents,
  deposit_percent: inv.deposit_percent,
  deposit_cents: depositCents(inv),
  balance_cents: balanceCents(inv),
  amount_paid_cents: inv.amount_paid_cents,
  status: inv.status,
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "";
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};

    // PUBLIC: load an invoice by its pay token
    if (action === "get") {
      const token = url.searchParams.get("token") || body?.token;
      if (!token) return json({ error: "Missing token" }, 400);
      const { data } = await supabase.from("event_invoices").select("*").eq("pay_token", token).maybeSingle();
      if (!data) return json({ error: "Invoice not found" }, 404);
      return json({ invoice: publicView(data as Invoice) });
    }

    // PUBLIC: start an embedded checkout session for this invoice
    if (action === "checkout" && req.method === "POST") {
      const { token, option, environment, returnUrl } = body || {};
      if (!token) return json({ error: "Missing token" }, 400);
      if (environment !== "sandbox" && environment !== "live") {
        return json({ error: "Invalid environment" }, 400);
      }
      const env = environment as StripeEnv;

      const { data } = await supabase.from("event_invoices").select("*").eq("pay_token", token).maybeSingle();
      if (!data) return json({ error: "Invoice not found" }, 404);
      const inv = data as Invoice;
      if (inv.status === "paid") return json({ error: "This invoice is already paid in full." }, 400);

      const kind: "deposit" | "full" | "balance" =
        inv.amount_paid_cents > 0 ? "balance" : option === "full" ? "full" : "deposit";
      const amount =
        kind === "balance" ? balanceCents(inv) : kind === "full" ? inv.total_cents : depositCents(inv);
      if (amount < 50) return json({ error: "Nothing left to pay." }, 400);

      const label =
        kind === "balance"
          ? `Remaining balance — ${inv.tier_name || "White Rabbit LA"}`
          : kind === "full"
            ? `${inv.tier_name || "White Rabbit LA"} — paid in full`
            : `${inv.tier_name || "White Rabbit LA"} — ${inv.deposit_percent}% deposit`;

      const stripe = createStripeClient(env);
      const session = await stripe.checkout.sessions.create({
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: {
              name: label,
              description: [inv.event_type, inv.event_date, inv.venue].filter(Boolean).join(" · ") || undefined,
            },
            unit_amount: amount,
          },
          quantity: 1,
        }],
        mode: "payment",
        // ACH bank transfer first, card as the fallback.
        payment_method_types: ["us_bank_account", "card"],
        ui_mode: "embedded_page",
        return_url: returnUrl || `https://whiterabbitla.com/pay/${inv.pay_token}?session_id={CHECKOUT_SESSION_ID}`,
        ...(inv.client_email ? { customer_email: inv.client_email } : {}),
        payment_intent_data: { description: label },
        metadata: { invoice_id: inv.id, kind, amount_cents: String(amount) },
      });

      return json({ clientSecret: session.client_secret });
    }

    // ---- ADMIN ----
    if (!isAdmin(req, body)) return json({ error: "Unauthorized" }, 401);

    if (action === "list") {
      const { data, error } = await supabase
        .from("event_invoices").select("*").order("created_at", { ascending: false }).limit(300);
      if (error) return json({ error: error.message }, 500);
      return json({ invoices: data || [] });
    }

    if (action === "create" && req.method === "POST") {
      const {
        agreement_id, deal_id, client_name, client_email, event_type, event_date,
        venue, tier_name, total_cents, deposit_percent, send = true,
      } = body || {};
      if (!total_cents || total_cents < 100) return json({ error: "total_cents required" }, 400);

      const token = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
      const { data, error } = await supabase.from("event_invoices").insert({
        agreement_id: agreement_id || null,
        deal_id: deal_id || null,
        pay_token: token,
        client_name: client_name || null,
        client_email: client_email || null,
        event_type: event_type || null,
        event_date: event_date || null,
        venue: venue || null,
        tier_name: tier_name || null,
        total_cents,
        deposit_percent: deposit_percent ?? 50,
      }).select().single();
      if (error) return json({ error: error.message }, 500);

      const inv = data as Invoice;
      if (send && inv.client_email) {
        const { subject, html } = invoiceEmail(inv);
        await sendEmail(inv.client_email, subject, html);
      }
      return json({ ok: true, invoice: inv });
    }

    if (action === "resend" && req.method === "POST") {
      const { id } = body || {};
      const { data } = await supabase.from("event_invoices").select("*").eq("id", id).maybeSingle();
      if (!data) return json({ error: "Not found" }, 404);
      const inv = data as Invoice;
      if (!inv.client_email) return json({ error: "No client email on this invoice" }, 400);
      const { subject, html } = invoiceEmail(inv);
      await sendEmail(inv.client_email, subject, html);
      return json({ ok: true });
    }

    if (action === "cancel" && req.method === "POST") {
      const { id } = body || {};
      const { error } = await supabase.from("event_invoices").update({ status: "canceled" }).eq("id", id);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === "mark_paid" && req.method === "POST") {
      const { id } = body || {};
      const { data } = await supabase.from("event_invoices").select("*").eq("id", id).maybeSingle();
      if (!data) return json({ error: "Not found" }, 404);
      const inv = data as Invoice;
      const { error } = await supabase.from("event_invoices").update({
        status: "paid",
        amount_paid_cents: inv.total_cents,
        paid_in_full_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true, note: `Marked ${money(inv.total_cents)} paid.` });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("invoice-api error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
