// Public endpoint for the Find the Queen pop-up claim form. Validates the claim,
// issues one $500 credit per email with a quarterly drawing entry, files the
// lead in the CRM, then in the background sends the welcome email with the
// code (claimed on the credit row, rolled back on failure) followed by one
// Telegram alert to Scott.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { claimQueenCredit, validateClaim, welcomeThenAlert, type ClaimStore, type WelcomeStore } from "../_shared/find-the-lady.ts";
import { notifyLadyTelegram, type AlertStore } from "../_shared/telegram-inquiry.ts";
import { gatedResendFetch } from "../_shared/send-gate.ts";
import { safeErrorPayload } from "../_shared/safe-error.ts";

const PROJECT_REF = "pgjyzayvkyrftcksvncj";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const requestId = crypto.randomUUID();

  try {
    const body = await req.json().catch(() => null);
    const now = new Date();
    const checked = validateClaim(body);
    if (!checked.ok) {
      // A filled hidden field gets a quiet success that saves nothing.
      if ("bot" in checked) return json({ ok: true, code: null });
      return json({ error: checked.error }, 400);
    }

    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) throw new Error("Database configuration is missing");
    const db = createClient(url, key);

    const store: ClaimStore = {
      findActiveCredit: async (email) => {
        const { data, error } = await db.from("find_the_lady_credits")
          .select("id, code, expires_on, deal_id").ilike("email", email.replace(/[\\%_]/g, (c) => `\\${c}`))
          .eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (error) throw new Error(`credit lookup failed: ${error.message}`);
        return data;
      },
      expireCredit: async (id) => {
        const { error } = await db.from("find_the_lady_credits").update({ status: "expired" }).eq("id", id).eq("status", "active");
        if (error) throw new Error(`credit expire failed: ${error.message}`);
      },
      insertCredit: async (row) => {
        const { data, error } = await db.from("find_the_lady_credits").insert(row).select("id, code, expires_on, deal_id").single();
        if (!error && data) return { status: "ok", credit: data };
        if (error?.code === "23505") {
          return { status: /one_active_per_email/.test(error.message) ? "duplicate_email" : "duplicate_code" };
        }
        throw new Error(`credit insert failed: ${error?.message}`);
      },
      findOpenDeal: async (email) => {
        const { data, error } = await db.from("deals").select("id")
          .ilike("contact_email", email.replace(/[\\%_]/g, (c) => `\\${c}`))
          .not("stage", "in", "(lost,completed)").order("updated_at", { ascending: false }).limit(1).maybeSingle();
        if (error) throw new Error(`deal lookup failed: ${error.message}`);
        return data;
      },
      createDeal: async (row) => {
        const { data, error } = await db.from("deals").insert(row).select("id").single();
        if (error || !data) throw new Error(`deal insert failed: ${error?.message}`);
        return data;
      },
      attachDeal: async (creditId, dealId) => {
        const { error } = await db.from("find_the_lady_credits").update({ deal_id: dealId }).eq("id", creditId);
        if (error) throw new Error(`credit link failed: ${error.message}`);
      },
      logActivity: async (dealId, title, text, metadata) => {
        const { error } = await db.from("deal_activity").insert({ deal_id: dealId, type: "find_the_lady", title, body: text, metadata });
        if (error) console.error("Find the Queen activity insert failed:", error.message);
      },
    };

    const alertStore = (dealId: string | null): AlertStore => ({
      claim: async (k) => {
        const { error } = await db.from("telegram_inquiry_alerts").insert({ dedupe_key: k, deal_id: dealId });
        if (!error) return "claimed";
        if (error.code === "23505") return "duplicate";
        console.error("Find the Queen alert claim failed:", error.message);
        return "error";
      },
      finish: async (k, status, messageId) => {
        await db.from("telegram_inquiry_alerts").update({ status, telegram_message_id: messageId, sent_at: status === "sent" ? new Date().toISOString() : null }).eq("dedupe_key", k);
      },
      release: async (k) => {
        await db.from("telegram_inquiry_alerts").delete().eq("dedupe_key", k).eq("status", "sending");
      },
    });

    const welcomeStore: WelcomeStore = {
      claimWelcome: async (id) => {
        const { data, error } = await db.from("find_the_lady_credits").update({ welcome_email_status: "sending" })
          .eq("id", id).is("welcome_email_status", null).select("id");
        if (error) throw new Error(`welcome claim failed: ${error.message}`);
        return (data || []).length === 1;
      },
      markWelcomeSent: async (id) => {
        const { error } = await db.from("find_the_lady_credits").update({ welcome_email_status: "sent", welcome_email_sent_at: new Date().toISOString() }).eq("id", id);
        if (error) console.error("Find the Queen welcome mark failed:", error.message);
      },
      releaseWelcome: async (id) => {
        const { error } = await db.from("find_the_lady_credits").update({ welcome_email_status: null }).eq("id", id).eq("welcome_email_status", "sending");
        if (error) console.error("Find the Queen welcome release failed:", error.message);
      },
    };

    const resendKey = Deno.env.get("RESEND_API_KEY");
    let pending = null as Promise<unknown> | null;
    const result = await claimQueenCredit(checked.value, {
      store,
      now,
      followUp: (credit) => {
        pending = welcomeThenAlert(credit, {
          store: welcomeStore,
          send: async (mail) => {
            if (!resendKey) return { sent: false, reason: "email_not_configured" };
            const oneClick = `https://${PROJECT_REF}.supabase.co/functions/v1/unsubscribe-oneclick?email=${encodeURIComponent(mail.to)}`;
            const res = await gatedResendFetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                from: "Scott Syme <scott.syme@whiterabbitla.com>",
                reply_to: "scott.syme@whiterabbitla.com",
                to: [mail.to],
                subject: mail.subject,
                html: mail.html,
                text: mail.text,
                headers: {
                  "List-Unsubscribe": `<mailto:unsubscribe@whiterabbitla.com?subject=unsubscribe>, <${oneClick}>`,
                  "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
                },
              }),
            }, "find-the-queen-welcome");
            if (res.ok) return { sent: true };
            const info = await res.json().catch(() => ({}));
            return { sent: false, reason: info?.reason || `status_${res.status}` };
          },
          notify: (c, welcome) => notifyLadyTelegram(
            { creditId: c.creditId, code: c.code, expiresOn: c.expiresOn, firstName: c.firstName, quarter: c.quarter, welcome, dealId: c.dealId },
            { token: Deno.env.get("TELEGRAM_BOT_TOKEN"), chatId: Deno.env.get("TELEGRAM_CHAT_ID"), store: alertStore(c.dealId) },
          ),
        }).catch(() => {});
      },
    });
    if (pending) {
      // deno-lint-ignore no-explicit-any
      const runtime = (globalThis as any).EdgeRuntime;
      if (runtime?.waitUntil) runtime.waitUntil(pending);
      else await pending;
    }

    return json({ ok: true, code: result.code, expiresOn: result.expiresOn, existing: result.existing });
  } catch (err) {
    return json(safeErrorPayload(err, requestId), 500);
  }
});
