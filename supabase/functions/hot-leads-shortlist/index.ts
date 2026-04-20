import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-bulk-import-token",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "GET") {
    return json(405, { error: "method_not_allowed" });
  }

  // ---- Auth ----
  const authHeader = req.headers.get("authorization") || "";
  const bearer = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  const importToken = req.headers.get("x-bulk-import-token") || "";

  const expectedAnon = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const expectedImport = Deno.env.get("BULK_IMPORT_TOKEN") || "";

  if (
    !bearer ||
    !expectedAnon ||
    bearer !== expectedAnon ||
    !importToken ||
    !expectedImport ||
    importToken !== expectedImport
  ) {
    return json(401, { error: "auth_failed" });
  }

  // ---- Parse params ----
  const url = new URL(req.url);
  const tierRaw = url.searchParams.get("tier");
  const category = url.searchParams.get("category") || null;
  const limitRaw = url.searchParams.get("limit");
  const excludeSentRaw = url.searchParams.get("exclude_sent_manual");

  const tier = tierRaw ? Number.parseInt(tierRaw, 10) : NaN;
  if (![1, 2, 3, 4].includes(tier)) {
    return json(400, { error: "invalid_tier", message: "tier must be 1, 2, 3, or 4" });
  }

  let limit = limitRaw ? Number.parseInt(limitRaw, 10) : 10;
  if (!Number.isFinite(limit) || limit <= 0) limit = 10;
  if (limit > 50) limit = 50;

  const excludeSentManual =
    excludeSentRaw === null ? true : excludeSentRaw.toLowerCase() !== "false";

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // ---- Build base query per tier ----
    // We oversample by 3x to allow post-filter exclusion without extra round trips.
    const overFetch = Math.min(limit * 3, 200);

    let q = supabase
      .from("cold_email_campaigns")
      .select(
        "email, name, company, title, phone, city, state, linkedin_url, notes, current_step, last_email_sent_at, started_at, status, campaign_category, hot_tag, engagement_clicks, engagement_opens"
      );

    if (category) q = q.eq("campaign_category", category);

    if (tier === 1) {
      q = q.eq("status", "active").gte("current_step", 2).gt("engagement_clicks", 0);
    } else if (tier === 2) {
      q = q.eq("status", "completed").eq("current_step", 4);
    } else if (tier === 4) {
      q = q.eq("hot_tag", true);
    }
    // Tier 3 has no extra cold_email_campaigns filter; intersection done below.

    q = q
      .order("last_email_sent_at", { ascending: false, nullsFirst: false })
      .order("current_step", { ascending: false })
      .limit(overFetch);

    const { data: rows, error } = await q;
    if (error) throw error;
    let candidates = rows || [];

    // ---- Tier 2: exclude suppression list ----
    if (tier === 2 && candidates.length) {
      const emails = candidates.map((r) => r.email.toLowerCase());
      const { data: suppressed } = await supabase
        .from("email_suppression_list")
        .select("email")
        .in("email", emails);
      const suppressedSet = new Set((suppressed || []).map((s) => s.email.toLowerCase()));
      candidates = candidates.filter((r) => !suppressedSet.has(r.email.toLowerCase()));
    }

    // ---- Tier 3: intersect with newsletter_contacts (subscribed) ----
    if (tier === 3 && candidates.length) {
      const emails = candidates.map((r) => r.email.toLowerCase());
      const { data: subs } = await supabase
        .from("newsletter_contacts")
        .select("email")
        .eq("subscribed", true)
        .in("email", emails);
      const subsSet = new Set((subs || []).map((s) => s.email.toLowerCase()));
      candidates = candidates.filter((r) => subsSet.has(r.email.toLowerCase()));
    }

    // ---- Exclude already-sent manual outreach ----
    if (excludeSentManual && candidates.length) {
      const emails = candidates.map((r) => r.email.toLowerCase());
      const { data: sent } = await supabase
        .from("manual_outreach_log")
        .select("email")
        .in("email", emails);
      const sentSet = new Set((sent || []).map((s) => s.email.toLowerCase()));
      candidates = candidates.filter((r) => !sentSet.has(r.email.toLowerCase()));
    }

    // ---- Final sort + trim ----
    candidates.sort((a, b) => {
      const ta = a.last_email_sent_at ? new Date(a.last_email_sent_at).getTime() : -Infinity;
      const tb = b.last_email_sent_at ? new Date(b.last_email_sent_at).getTime() : -Infinity;
      if (tb !== ta) return tb - ta;
      return (b.current_step || 0) - (a.current_step || 0);
    });
    const trimmed = candidates.slice(0, limit);

    const contacts = trimmed.map((r) => ({
      email: r.email,
      name: r.name,
      company: r.company,
      title: r.title,
      phone: r.phone,
      city: r.city,
      state: r.state,
      linkedin_url: r.linkedin_url,
      notes: r.notes,
      current_step: r.current_step,
      last_activity_at: r.last_email_sent_at,
    }));

    return json(200, {
      tier,
      category,
      count: contacts.length,
      contacts,
    });
  } catch (err) {
    console.error("hot-leads-shortlist error:", err);
    return json(500, {
      error: "internal_error",
      message: err instanceof Error ? err.message : "unknown",
    });
  }
});
