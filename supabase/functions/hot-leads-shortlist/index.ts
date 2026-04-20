import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FUNCTION_NAME = "hot-leads-shortlist";

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

// ---- Observability helpers (metadata only, no PII) ----
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
  // Keep only safe operational params; values are non-PII (tier/category/limit/flags)
  const allow = ["tier", "category", "limit", "exclude_sent_manual"];
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
  // Fire-and-forget; never block or throw
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

  // ---- Kill switch ----
  if ((Deno.env.get("EDGE_FUNCTIONS_DISABLED") || "").toLowerCase() === "true") {
    return finalize(json(503, { error: "temporarily_disabled" }), "kill_switch");
  }

  if (req.method !== "GET") {
    return finalize(json(405, { error: "method_not_allowed" }), "valid");
  }

  // ---- Auth: token-only ----
  const importToken = req.headers.get("x-bulk-import-token") || "";
  const expectedImport = Deno.env.get("BULK_IMPORT_TOKEN") || "";
  if (!importToken) {
    return finalize(json(401, { error: "auth_failed" }), "missing_token");
  }
  if (!expectedImport || importToken !== expectedImport) {
    return finalize(json(401, { error: "auth_failed" }), "invalid_token");
  }

  // ---- Parse params ----
  const tierRaw = url.searchParams.get("tier");
  const category = url.searchParams.get("category") || null;
  const limitRaw = url.searchParams.get("limit");
  const excludeSentRaw = url.searchParams.get("exclude_sent_manual");

  const tier = tierRaw ? Number.parseInt(tierRaw, 10) : NaN;
  if (![1, 2, 3, 4].includes(tier)) {
    return finalize(
      json(400, { error: "invalid_tier", message: "tier must be 1, 2, 3, or 4" }),
      "valid"
    );
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

    q = q
      .order("last_email_sent_at", { ascending: false, nullsFirst: false })
      .order("current_step", { ascending: false })
      .limit(overFetch);

    const { data: rows, error } = await q;
    if (error) throw error;
    let candidates = rows || [];

    if (tier === 2 && candidates.length) {
      const emails = candidates.map((r) => r.email.toLowerCase());
      const { data: suppressed } = await supabase
        .from("email_suppression_list")
        .select("email")
        .in("email", emails);
      const suppressedSet = new Set((suppressed || []).map((s) => s.email.toLowerCase()));
      candidates = candidates.filter((r) => !suppressedSet.has(r.email.toLowerCase()));
    }

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

    if (excludeSentManual && candidates.length) {
      const emails = candidates.map((r) => r.email.toLowerCase());
      const { data: sent } = await supabase
        .from("manual_outreach_log")
        .select("email")
        .in("email", emails);
      const sentSet = new Set((sent || []).map((s) => s.email.toLowerCase()));
      candidates = candidates.filter((r) => !sentSet.has(r.email.toLowerCase()));
    }

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

    return finalize(
      json(200, { tier, category, count: contacts.length, contacts }),
      "valid"
    );
  } catch (err) {
    console.error("hot-leads-shortlist error:", err);
    return finalize(
      json(500, {
        error: "internal_error",
        message: err instanceof Error ? err.message : "unknown",
      }),
      "valid"
    );
  }
});
