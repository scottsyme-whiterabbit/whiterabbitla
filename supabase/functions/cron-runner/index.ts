import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FUNCTIONS_BASE = `https://pgjyzayvkyrftcksvncj.supabase.co/functions/v1`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let authorized = false;
    if (req.method === "GET") {
      const url = new URL(req.url);
      const key = url.searchParams.get("key") || "";
      authorized = key === "wr-cron-2026-xK9mP4vL";
    } else {
      const body = await req.json().catch(() => ({}));
      const password = body.adminPassword || "";
      authorized = password === Deno.env.get("ADMIN_PASSWORD");
    }

    if (!authorized) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send window guard: only send on Tue/Wed/Thu Pacific.
    // The bounce-threshold guardrail still runs daily below.
    const pacificDay = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", weekday: "short" }).format(new Date());
    const inSendWindow = ["Tue", "Wed", "Thu"].includes(pacificDay);

    // Always run bounce-threshold-check (daily guardrail, auto-pauses hot buckets)
    const cronSecretEnv = Deno.env.get("CRON_SECRET") || "";
    const bounceCheck = await fetch(`${FUNCTIONS_BASE}/bounce-threshold-check`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-cron-secret": cronSecretEnv },
      body: "{}",
    });
    const bounceResults = { status: bounceCheck.status, body: await bounceCheck.json().catch(() => bounceCheck.statusText) };

    // Invoice reminders run DAILY (not limited to the Tue-Thu send window):
    // unpaid invoices get 4 daily nudges, deposit-paid ones get 3 pre-event
    // balance reminders.
    const invoiceRun = await fetch(`${FUNCTIONS_BASE}/invoice-reminders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-cron-secret": cronSecretEnv },
      body: "{}",
    });
    const invoiceResults = { status: invoiceRun.status, body: await invoiceRun.json().catch(() => invoiceRun.statusText) };

    if (!inSendWindow) {
      return new Response(JSON.stringify({ success: true, skipped: true, message: `Skipped sends: ${pacificDay} outside Tue-Thu window`, "bounce-threshold-check": bounceResults, "invoice-reminders": invoiceResults }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const importToken = Deno.env.get("EXTERNAL_IMPORT_TOKEN") ?? "";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${anonKey}`,
      // cold-drip (and other token-gated drips) require x-import-token for any
      // non-preview action. Pass it here so the cron run is authorized.
      "x-import-token": importToken,
    };

    const results: Record<string, unknown> = {};

    // Run inquiry-followup
    const r1 = await fetch(`${FUNCTIONS_BASE}/inquiry-followup`, {
      method: "POST",
      headers,
      body: "{}",
    });
    results["inquiry-followup"] = { status: r1.status, body: await r1.json().catch(() => r1.statusText) };

    // Run post-show-sequence
    const r2 = await fetch(`${FUNCTIONS_BASE}/post-show-sequence`, {
      method: "POST",
      headers,
      body: "{}",
    });
    results["post-show-sequence"] = { status: r2.status, body: await r2.json().catch(() => r2.statusText) };

    // Run cold-drip
    const r3 = await fetch(`${FUNCTIONS_BASE}/cold-drip`, {
      method: "POST",
      headers,
      body: "{}",
    });
    results["cold-drip"] = { status: r3.status, body: await r3.json().catch(() => r3.statusText) };

    // Run planner-drip
    const r5 = await fetch(`${FUNCTIONS_BASE}/planner-drip`, {
      method: "POST",
      headers,
      body: "{}",
    });
    results["planner-drip"] = { status: r5.status, body: await r5.json().catch(() => r5.statusText) };

    // Run resident-drip
    const r6 = await fetch(`${FUNCTIONS_BASE}/resident-drip`, {
      method: "POST",
      headers,
      body: "{}",
    });
    results["resident-drip"] = { status: r6.status, body: await r6.json().catch(() => r6.statusText) };

    // Run nurture-drip
    const r4 = await fetch(`${FUNCTIONS_BASE}/nurture-drip`, {
      method: "POST",
      headers,
      body: "{}",
    });
    results["nurture-drip"] = { status: r4.status, body: await r4.json().catch(() => r4.statusText) };

    // Run inquiry-nurture (general "stay in the loop" sequence after inquiry-followup completes)
    const r7 = await fetch(`${FUNCTIONS_BASE}/inquiry-nurture`, {
      method: "POST",
      headers,
      body: "{}",
    });
    results["inquiry-nurture"] = { status: r7.status, body: await r7.json().catch(() => r7.statusText) };

    // Run seasonal-campaign-process for the currently active seasonal key.
    // Copy-only change: rotate SEASONAL_CAMPAIGN_KEY (env) to switch campaigns.
    const seasonalKey = Deno.env.get("SEASONAL_CAMPAIGN_KEY") || "holiday_2026";
    const r8 = await fetch(`${FUNCTIONS_BASE}/seasonal-campaign-process`, {
      method: "POST",
      headers,
      body: JSON.stringify({ campaign_key: seasonalKey }),
    });
    results["seasonal-campaign-process"] = { status: r8.status, body: await r8.json().catch(() => r8.statusText) };

    return new Response(JSON.stringify({ success: true, "bounce-threshold-check": bounceResults, "invoice-reminders": invoiceResults, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
