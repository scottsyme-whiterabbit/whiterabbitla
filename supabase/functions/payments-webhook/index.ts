import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { type StripeEnv, stripeEnvironment, verifyWebhook } from "../_shared/stripe.ts";
import { type Invoice, receiptEmail, sendEmail } from "../_shared/invoice-email.ts";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _supabase;
}

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  const invoiceId = session.metadata?.invoice_id;
  if (!invoiceId) {
    console.warn("checkout session without metadata.invoice_id", session.id);
    return;
  }

  const supabase = getSupabase();
  const { data, error: readError } = await supabase
    .from("event_invoices").select("*").eq("id", invoiceId).maybeSingle();
  if (readError) {
    console.error("event_invoices read failed", invoiceId, readError);
    throw new Error(`Invoice read failed: ${readError.message}`);
  }
  if (!data) {
    console.warn("no event_invoices row for", invoiceId);
    return;
  }
  const inv = data as unknown as Invoice & { deposit_paid_at?: string | null };

  const paid = Number(session.amount_total ?? session.metadata?.amount_cents ?? 0);
  const alreadyPaid = inv.amount_paid_cents || 0;
  // Idempotency: the same session must never be counted twice.
  if ((data as any).stripe_session_id === session.id) return;

  const newPaid = Math.min(alreadyPaid + paid, inv.total_cents);
  const fullyPaid = newPaid >= inv.total_cents;
  const now = new Date().toISOString();

  const { error: updateError } = await supabase.from("event_invoices").update({
    amount_paid_cents: newPaid,
    status: fullyPaid ? "paid" : "deposit_paid",
    environment: env,
    stripe_session_id: session.id,
    stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
    ...(fullyPaid ? { paid_in_full_at: now } : { deposit_paid_at: inv.deposit_paid_at || now }),
  }).eq("id", inv.id);

  if (updateError) {
    // Surface the failure so Stripe retries instead of us silently 200-ing.
    console.error("event_invoices update failed", inv.id, updateError);
    throw new Error(`Invoice update failed: ${updateError.message}`);
  }

  const updated: Invoice = { ...inv, amount_paid_cents: newPaid };
  if (inv.client_email) {
    const { subject, html } = receiptEmail(updated, paid, fullyPaid);
    await sendEmail(inv.client_email, subject, html);
  }
  const { subject, html } = receiptEmail(updated, paid, fullyPaid);
  await sendEmail("scott.syme@whiterabbitla.com", `[Payment] ${inv.client_name || "Client"}: ${subject}`, html);

  // Best-effort calendar safety net: a paid invoice (deposit or full) guarantees
  // the linked deal is booked and synced to Google Calendar. Never throws.
  try {
    const dealId = (data as any).deal_id as string | null;
    if (dealId) {
      const { data: deal } = await supabase
        .from("deals")
        .select("event_date, location, event_type, stage")
        .eq("id", dealId)
        .maybeSingle();

      if (deal) {
        const backfill: Record<string, unknown> = {};
        if (!deal.event_date && (inv as any).event_date) backfill.event_date = (inv as any).event_date;
        if (!deal.location && (inv as any).venue) backfill.location = (inv as any).venue;
        if (!deal.event_type && (inv as any).event_type) backfill.event_type = (inv as any).event_type;
        if (Object.keys(backfill).length > 0) {
          const { error: backfillError } = await supabase.from("deals").update(backfill).eq("id", dealId);
          if (backfillError) console.error("deal backfill failed", dealId, backfillError);
        }

        const targetStage = deal.stage === "completed" ? "completed" : "booked";
        const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/newsletter-admin`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "update_deal_stage",
            adminPassword: Deno.env.get("ADMIN_PASSWORD"),
            dealId,
            stage: targetStage,
          }),
        });
        if (!res.ok) {
          console.error(`calendar safety net failed for deal ${dealId} [${res.status}]: ${(await res.text()).slice(0, 300)}`);
        } else {
          console.log(`calendar safety net: deal ${dealId} set to ${targetStage} and synced after payment`);
        }
      }
    }
  } catch (e) {
    console.error("calendar safety net error (ignored):", e);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  // In BYOK mode there is a single account key, so the environment is derived
  // from the secret key prefix. The `?env=` query param still overrides it
  // (the Stripe dashboard webhook URL can omit it entirely).
  const rawEnv = new URL(req.url).searchParams.get("env");
  const env: StripeEnv = rawEnv === "live" ? "live" : rawEnv === "sandbox" ? "sandbox" : stripeEnvironment();

  let event: any;
  try {
    event = await verifyWebhook(req, env);
  } catch (e) {
    // Signature/parse failure: never retryable.
    console.error("Webhook signature verification failed:", e);
    return new Response("Webhook error", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.payment_status !== "unpaid") await handleCheckoutCompleted(session, env);
        break;
      }
      case "checkout.session.async_payment_succeeded":
        await handleCheckoutCompleted(event.data.object, env);
        break;
      default:
        console.log("Unhandled event:", event.type);
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    // Processing failure: return 500 so Stripe retries the delivery.
    console.error("Webhook processing error:", event?.id, e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
