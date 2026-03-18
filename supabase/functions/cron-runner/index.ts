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

    // Send window guard: only send on Tue/Wed/Thu Pacific
    const pacificDay = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", weekday: "short" }).format(new Date());
    if (!["Tue", "Wed", "Thu"].includes(pacificDay)) {
      return new Response(JSON.stringify({ success: true, skipped: true, message: `Skipped: ${pacificDay} is outside the Tue-Thu send window` }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${anonKey}`,
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

    // Run nurture-drip
    const r4 = await fetch(`${FUNCTIONS_BASE}/nurture-drip`, {
      method: "POST",
      headers,
      body: "{}",
    });
    results["nurture-drip"] = { status: r4.status, body: await r4.json().catch(() => r4.statusText) };

    return new Response(JSON.stringify({ success: true, results }), {
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
