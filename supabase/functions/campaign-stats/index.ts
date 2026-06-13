import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FUNCTION_NAME = "campaign-stats";
const CACHE_TTL_SECONDS = 300; // 5 min

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-bulk-import-token, x-import-token",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// ---- Observability helpers ----
async function hashIp(ip: string): Promise<string | null> {
  if (!ip) return null;
  const salt = Deno.env.get("IP_HASH_SALT") || "";
  const data = new TextEncoder().encode(`${ip}:${salt}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") || "";
  return xff.split(",")[0].trim() || req.headers.get("x-real-ip") || "";
}

function summarizeQuery(url: URL): string {
  const allow = ["category", "since"];
  const parts: string[] = [];
  for (const k of allow) {
    const v = url.searchParams.get(k);
    if (v !== null) parts.push(`${k}=${v}`);
  }
  return parts.join("&");
}

function logRequest(params: {
  ip: string;
  authResult: "valid" | "missing_token" | "invalid_token" | "kill_switch";
  statusCode: number;
  path: string;
  querySummary: string;
  durationMs: number;
}) {
  (async () => {
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const ip_hash = await hashIp(params.ip);
      await supabase.from("edge_function_requests").insert({
        function_name: FUNCTION_NAME,
        ip_hash,
        auth_result: params.authResult,
        status_code: params.statusCode,
        path: params.path,
        query_summary: params.querySummary,
        duration_ms: params.durationMs,
      });
    } catch (_e) {
      // swallow
    }
  })();
}

// ---- Simple in-memory rate limiter (per warm instance) ----
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ipHash: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ipHash);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(ipHash, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (bucket.count >= 120) return false;
  bucket.count++;
  return true;
}

// ---- Health flags ----
function computeHealthFlags(perf: {
  emails_sent: number;
  bounce_rate_pct: number;
  open_rate_pct: number;
  replies: number;
}): string[] {
  const flags: string[] = [];
  if (perf.bounce_rate_pct > 5.0) flags.push("BOUNCE_RATE_CRITICAL");
  else if (perf.bounce_rate_pct > 2.0) flags.push("BOUNCE_RATE_HIGH");
  if (perf.emails_sent > 0 && perf.open_rate_pct < 10) flags.push("OPEN_RATE_LOW");
  if (perf.emails_sent > 50 && perf.replies === 0) flags.push("REPLY_RATE_ZERO");
  if (flags.length === 0) flags.push("OK");
  return flags;
}

const pct = (num: number, denom: number) =>
  denom > 0 ? Math.round((num / denom) * 10000) / 100 : 0;

// ---- Aggregate stats for a single category (or all if category===null) ----
async function computeCategoryStats(
  supabase: any,
  category: string,
  sinceISO: string
) {
  // 1. Contact totals from cold_email_campaigns
  const { data: contacts, error: cErr } = await supabase
    .from("cold_email_campaigns")
    .select("email, status, current_step, last_email_sent_at")
    .eq("campaign_category", category);
  if (cErr) throw cErr;
  const all = (contacts || []) as Array<{
    email: string;
    status: string;
    current_step: number | null;
    last_email_sent_at: string | null;
  }>;

  const totals = {
    contacts: all.length,
    active: all.filter((c) => c.status === "active").length,
    paused: all.filter((c) => c.status === "paused").length,
    completed: all.filter((c) => c.status === "completed").length,
    bounced: all.filter((c) => c.status === "bounced").length,
  };

  const emails = all.map((c) => c.email.toLowerCase()).filter(Boolean);

  // 2. Map emails -> newsletter_contacts ids (for opens/clicks)
  const contactIds = new Set<string>();
  for (let i = 0; i < emails.length; i += 100) {
    const batch = emails.slice(i, i + 100);
    const { data: nc } = await supabase
      .from("newsletter_contacts")
      .select("id, email")
      .in("email", batch);
    if (nc) nc.forEach((r: any) => contactIds.add(r.id));
  }
  const idArr = Array.from(contactIds);

  // 3. Bounces (since)
  let bounces = 0;
  for (let i = 0; i < emails.length; i += 100) {
    const batch = emails.slice(i, i + 100);
    const { count } = await supabase
      .from("email_bounces")
      .select("*", { count: "exact", head: true })
      .in("email", batch)
      .gte("created_at", sinceISO);
    bounces += count || 0;
  }

  // 4. Opens (since)
  let opens = 0;
  for (let i = 0; i < idArr.length; i += 100) {
    const batch = idArr.slice(i, i + 100);
    const { count } = await supabase
      .from("newsletter_opens")
      .select("*", { count: "exact", head: true })
      .in("contact_id", batch)
      .gte("opened_at", sinceISO);
    opens += count || 0;
  }

  // 5. Clicks (since)
  let clicks = 0;
  for (let i = 0; i < idArr.length; i += 100) {
    const batch = idArr.slice(i, i + 100);
    const { count } = await supabase
      .from("newsletter_clicks")
      .select("*", { count: "exact", head: true })
      .in("contact_id", batch)
      .gte("clicked_at", sinceISO);
    clicks += count || 0;
  }

  // 6. Best-effort emails_sent: contacts who advanced past step 0 and were last_email_sent_at >= since
  // Plus historical-but-unknown sends fallback to current_step sum if no last_email_sent_at
  const sinceMs = new Date(sinceISO).getTime();
  let emails_sent = 0;
  for (const c of all) {
    if (c.last_email_sent_at && new Date(c.last_email_sent_at).getTime() >= sinceMs) {
      // count distinct steps reached during window — best-effort: assume 1 per contact in window
      // approximate: each contact in window counts current_step (capped at 4) sends
      emails_sent += Math.min(c.current_step || 1, 4);
    }
  }

  // 7. Unsubs (suppression list with reason=unsubscribe added since)
  let unsubs = 0;
  for (let i = 0; i < emails.length; i += 100) {
    const batch = emails.slice(i, i + 100);
    const { count } = await supabase
      .from("email_suppression_list")
      .select("*", { count: "exact", head: true })
      .in("email", batch)
      .eq("reason", "unsubscribe")
      .gte("suppressed_at", sinceISO);
    unsubs += count || 0;
  }

  // 8. Replies (status='replied')
  const replies = all.filter((c: any) => c.status === "replied").length;

  const delivered = Math.max(0, emails_sent - bounces);
  const bounce_rate_pct = pct(bounces, emails_sent);
  const open_rate_pct = pct(opens, delivered);
  const click_rate_pct = pct(clicks, delivered);

  const drip_performance = {
    emails_sent,
    delivered,
    bounces,
    bounce_rate_pct,
    opens,
    open_rate_pct,
    clicks,
    click_rate_pct,
    unsubs,
    replies,
  };

  const health_flags = computeHealthFlags({
    emails_sent,
    bounce_rate_pct,
    open_rate_pct,
    replies,
  });

  return {
    category,
    totals,
    drip_performance,
    health_flags,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const start = Date.now();
  const url = new URL(req.url);
  const ip = getClientIp(req);
  const path = url.pathname;
  const querySummary = summarizeQuery(url);

  const finalize = (
    res: Response,
    authResult: "valid" | "missing_token" | "invalid_token" | "kill_switch"
  ) => {
    logRequest({
      ip,
      authResult,
      statusCode: res.status,
      path,
      querySummary,
      durationMs: Date.now() - start,
    });
    return res;
  };

  // Kill switch
  if ((Deno.env.get("EDGE_FUNCTIONS_DISABLED") || "").toLowerCase() === "true") {
    return finalize(json(503, { error: "temporarily_disabled" }), "kill_switch");
  }

  if (req.method !== "GET") {
    return finalize(json(405, { error: "method_not_allowed" }), "valid");
  }

  // Auth: token-only
  const importToken = req.headers.get("x-bulk-import-token") || "";
  const expectedImport = Deno.env.get("BULK_IMPORT_TOKEN") || "";
  if (!importToken) {
    return finalize(json(401, { error: "auth_failed" }), "missing_token");
  }
  if (!expectedImport || importToken !== expectedImport) {
    return finalize(json(401, { error: "auth_failed" }), "invalid_token");
  }

  // Rate limit (per IP, per warm instance)
  const ipHash = (await hashIp(ip)) || "anon";
  if (!checkRateLimit(ipHash)) {
    return finalize(json(429, { error: "rate_limit_exceeded" }), "valid");
  }

  // Params
  const category = url.searchParams.get("category");
  const sinceParam = url.searchParams.get("since");
  const sinceDate = sinceParam
    ? new Date(sinceParam)
    : new Date(Date.now() - 30 * 86400000);
  if (isNaN(sinceDate.getTime())) {
    return finalize(json(400, { error: "invalid_since" }), "valid");
  }
  const sinceISO = sinceDate.toISOString();
  const sinceDay = sinceISO.slice(0, 10);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Cache lookup
    const cacheKey = `campaign-stats:${category || "ALL"}:${sinceDay}`;
    const { data: cached } = await supabase
      .from("stats_cache")
      .select("payload, expires_at")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    if (cached && new Date(cached.expires_at).getTime() > Date.now()) {
      return finalize(json(200, cached.payload), "valid");
    }

    // Compute
    let payload: any;

    if (category) {
      const stats = await computeCategoryStats(supabase, category, sinceISO);
      payload = {
        ...stats,
        since: sinceDay,
        note: "event_tracking_partial",
      };
    } else {
      // All categories: discover distinct categories
      const { data: catRows, error: catErr } = await supabase
        .from("cold_email_campaigns")
        .select("campaign_category");
      if (catErr) throw catErr;
      const categories = Array.from(
        new Set((catRows || []).map((r: any) => r.campaign_category).filter(Boolean))
      );

      const perCategory = [];
      for (const c of categories) {
        perCategory.push(await computeCategoryStats(supabase, c, sinceISO));
      }

      const totalContacts = perCategory.reduce((s, c) => s + c.totals.contacts, 0);
      const totalSent = perCategory.reduce(
        (s, c) => s + c.drip_performance.emails_sent,
        0
      );
      const totalDelivered = perCategory.reduce(
        (s, c) => s + c.drip_performance.delivered,
        0
      );
      const totalBounces = perCategory.reduce(
        (s, c) => s + c.drip_performance.bounces,
        0
      );
      const totalOpens = perCategory.reduce(
        (s, c) => s + c.drip_performance.opens,
        0
      );
      const totalClicks = perCategory.reduce(
        (s, c) => s + c.drip_performance.clicks,
        0
      );

      // Best/worst by open_rate (only categories with >= 20 sends)
      const ranked = perCategory.filter(
        (c) => c.drip_performance.emails_sent >= 20
      );
      ranked.sort(
        (a, b) => b.drip_performance.open_rate_pct - a.drip_performance.open_rate_pct
      );
      const highest = ranked[0]?.category || null;
      const lowest = ranked[ranked.length - 1]?.category || null;

      payload = {
        since: sinceDay,
        categories: perCategory.map((c) => ({ ...c, since: sinceDay })),
        summary: {
          total_contacts: totalContacts,
          overall_bounce_rate_pct: pct(totalBounces, totalSent),
          overall_open_rate_pct: pct(totalOpens, totalDelivered),
          overall_click_rate_pct: pct(totalClicks, totalDelivered),
          highest_performing_category: highest,
          lowest_performing_category: lowest,
        },
        note: "event_tracking_partial",
      };
    }

    // Store in cache
    const expiresAt = new Date(Date.now() + CACHE_TTL_SECONDS * 1000).toISOString();
    await supabase
      .from("stats_cache")
      .upsert(
        { cache_key: cacheKey, payload, expires_at: expiresAt, created_at: new Date().toISOString() },
        { onConflict: "cache_key" }
      );

    return finalize(json(200, payload), "valid");
  } catch (err) {
    console.error("campaign-stats error:", err);
    return finalize(
      json(500, {
        error: "internal_error",
        message: err instanceof Error ? err.message : "unknown",
      }),
      "valid"
    );
  }
});
