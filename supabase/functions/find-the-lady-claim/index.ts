// Public endpoint for the /find-the-lady claim form. Validates the claim,
// issues one $250 credit per email, files the lead in the CRM and starts one
// Telegram alert to Scott in the background. Sends no email to anyone.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { claimLadyCredit, validateClaim, type ClaimStore } from "../_shared/find-the-lady.ts";
import { notifyLadyTelegram, type AlertStore } from "../_shared/telegram-inquiry.ts";
import { safeErrorPayload } from "../_shared/safe-error.ts";

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
    const checked = validateClaim(body, now);
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
        if (error) console.error("Find the Lady activity insert failed:", error.message);
      },
    };

    const alertStore = (dealId: string | null): AlertStore => ({
      claim: async (k) => {
        const { error } = await db.from("telegram_inquiry_alerts").insert({ dedupe_key: k, deal_id: dealId });
        if (!error) return "claimed";
        if (error.code === "23505") return "duplicate";
        console.error("Find the Lady alert claim failed:", error.message);
        return "error";
      },
      finish: async (k, status, messageId) => {
        await db.from("telegram_inquiry_alerts").update({ status, telegram_message_id: messageId, sent_at: status === "sent" ? new Date().toISOString() : null }).eq("dedupe_key", k);
      },
      release: async (k) => {
        await db.from("telegram_inquiry_alerts").delete().eq("dedupe_key", k).eq("status", "sending");
      },
    });

    let pending = null as Promise<unknown> | null;
    const result = await claimLadyCredit(checked.value, {
      store,
      now,
      notify: (alert) => {
        pending = notifyLadyTelegram(alert, {
          token: Deno.env.get("TELEGRAM_BOT_TOKEN"), chatId: Deno.env.get("TELEGRAM_CHAT_ID"), store: alertStore(alert.dealId),
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
