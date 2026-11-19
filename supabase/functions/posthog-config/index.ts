// Hands the PostHog project token to the public website at runtime.
// A PostHog project token (phc_...) is public by design: every browser that
// loads PostHog sees it. Anything else stored under that name (for example a
// personal phx_ key) is refused so it can never reach a browser.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const token = (Deno.env.get("POSTHOG_PROJECT_TOKEN") ?? "").trim();
  if (!token.startsWith("phc_")) {
    console.error("posthog-config: POSTHOG_PROJECT_TOKEN is missing or is not a public project token");
    return new Response(JSON.stringify({ error: "Analytics is not configured." }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ token }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" },
  });
});
