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
    let password = "";
    if (req.method === "GET") {
      const url = new URL(req.url);
      password = url.searchParams.get("key") || "";
    } else {
      const body = await req.json().catch(() => ({}));
      password = body.adminPassword || "";
    }

    if (password !== Deno.env.get("ADMIN_PASSWORD")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
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
