// Auto-detect STOP/UNSUBSCRIBE replies and suppress those contacts.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD");
const CRON_SECRET = Deno.env.get("CRON_SECRET");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const STOP_PATTERNS: { name: string; re: RegExp }[] = [
  { name: "STOP", re: /\bSTOP\b/i },
  { name: "UNSUBSCRIBE", re: /\bUNSUBSCRIBE\b/i },
  { name: "REMOVE ME", re: /\bREMOVE\s+ME\b/i },
  { name: "OPT-OUT", re: /\bOPT[\s-]?OUT\b/i },
  { name: "TAKE ME OFF", re: /\bTAKE\s+ME\s+OFF\b/i },
  { name: "DO NOT CONTACT", re: /\bDO\s+NOT\s+CONTACT\b/i },
  { name: "DON'T EMAIL", re: /\bDON'?T\s+EMAIL\b/i },
];

const AUTO_REPLY_RE = /\b(auto[-\s]?reply|automatic\s+reply|out\s+of\s+office|ooo|on\s+vacation|away\s+from)\b/i;

// Strip quoted/forwarded content. Cut at first common quote marker.
function stripQuoted(text: string): string {
  if (!text) return "";
  const markers = [
    /\n>\s/,
    /\nOn\s.+wrote:/i,
    /\n-{2,}\s*Original Message\s*-{2,}/i,
    /\nFrom:\s.+\n/i,
    /\nSent from my /i,
    /\n_{5,}/,
  ];
  let cut = text.length;
  for (const m of markers) {
    const match = text.match(m);
    if (match && match.index !== undefined && match.index < cut) cut = match.index;
  }
  return text.slice(0, cut);
}

function matchStop(text: string): string | null {
  const head = stripQuoted(text || "").slice(0, 500);
  for (const p of STOP_PATTERNS) if (p.re.test(head)) return p.name;
  return null;
}

async function suppressEmail(email: string, pattern: string, threadId: string | null, gmailMsgId: string | null, replyFrom: string | null) {
  const lc = email.toLowerCase().trim();
  if (!lc || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lc)) return { skipped: "invalid" };

  const { data: existing } = await supabase
    .from("email_suppression_list").select("id").eq("email", lc).maybeSingle();
  if (existing) return { skipped: "already_suppressed" };

  await supabase.from("email_suppression_list").insert({
    email: lc, reason: "unsubscribe", notes: `auto_reply_parser: ${pattern}`,
  });
  await supabase.from("email_unsubscribes").insert({
    email: lc, source: "auto_reply_parser",
  });
  await supabase.from("cold_email_campaigns")
    .update({ status: "unsubscribed" })
    .ilike("email", lc).eq("status", "active");
  await supabase.from("newsletter_contacts")
    .update({ subscribed: false, engagement_status: "unsubscribed_reply" })
    .ilike("email", lc);
  await supabase.from("auto_unsubscribe_log").insert({
    email: lc, matched_pattern: pattern,
    source_thread_id: threadId, source_message_id: gmailMsgId, reply_from_email: replyFrom,
  });
  return { suppressed: true };
}

async function processMessages(messages: any[]) {
  const stats = { processed: 0, suppressed: 0, skipped_already_suppressed: 0, skipped_quoted_text: 0, skipped_auto_reply: 0, errors: [] as string[] };
  for (const m of messages) {
    stats.processed++;
    try {
      if (m.subject && AUTO_REPLY_RE.test(m.subject)) { stats.skipped_auto_reply++; continue; }
      const pattern = matchStop(m.body_text || m.snippet || "");
      if (!pattern) {
        // Check if STOP was present in raw body but only in quoted text
        const raw = (m.body_text || m.snippet || "");
        const hadStopAnywhere = STOP_PATTERNS.some((p) => p.re.test(raw));
        if (hadStopAnywhere) stats.skipped_quoted_text++;
        continue;
      }
      const replyFrom = (m.from_email || "").toLowerCase();
      const emailsToSuppress = new Set<string>();
      if (replyFrom) emailsToSuppress.add(replyFrom);

      // Trace original recipient via thread → most recent outbound to_email
      if (m.thread_id) {
        const { data: outbound } = await supabase
          .from("deal_email_messages")
          .select("to_email")
          .eq("thread_id", m.thread_id)
          .eq("direction", "outbound")
          .order("sent_at", { ascending: false })
          .limit(1);
        if (outbound && outbound[0]?.to_email) emailsToSuppress.add(outbound[0].to_email.toLowerCase());
      }

      for (const e of emailsToSuppress) {
        const r = await suppressEmail(e, pattern, m.thread_id || null, m.gmail_message_id || null, replyFrom || null);
        if (r.suppressed) stats.suppressed++;
        else if (r.skipped === "already_suppressed") stats.skipped_already_suppressed++;
      }
    } catch (e) {
      stats.errors.push(String(e));
    }
  }
  return stats;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    let mode: "incremental" | "backfill" | "digest" = "incremental";
    let backfillDays = 90;

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const authed =
        (body.adminPassword && body.adminPassword === ADMIN_PASSWORD) ||
        (body.cron_secret && body.cron_secret === CRON_SECRET) ||
        req.headers.get("x-cron-secret") === CRON_SECRET;
      if (!authed) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
      if (body.mode === "backfill") { mode = "backfill"; backfillDays = body.days || 90; }
      else if (body.mode === "digest") { mode = "digest"; }
    } else {
      // GET: cron with ?key=
      const url = new URL(req.url);
      const key = url.searchParams.get("key") || "";
      if (key !== CRON_SECRET) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
      if (url.searchParams.get("mode") === "digest") mode = "digest";
      else if (url.searchParams.get("mode") === "backfill") { mode = "backfill"; backfillDays = parseInt(url.searchParams.get("days") || "90"); }
    }

    if (mode === "digest") {
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { data: rows } = await supabase
        .from("auto_unsubscribe_log")
        .select("email, matched_pattern, processed_at")
        .gte("processed_at", since)
        .order("processed_at", { ascending: false });
      if (!rows || rows.length === 0) {
        return new Response(JSON.stringify({ sent: false, count: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const list = rows.map((r) => `<li>${r.email} — <em>${r.matched_pattern}</em></li>`).join("");
      const html = `<p>${rows.length} contacts were auto-suppressed in the last 24h:</p><ul>${list}</ul>`;
      if (RESEND_API_KEY) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "White Rabbit LA <notify@whiterabbitla.com>",
            to: ["scott.syme@whiterabbitla.com"],
            subject: `[Auto-Suppress] ${rows.length} STOP replies cleaned today`,
            html,
          }),
        });
      }
      return new Response(JSON.stringify({ sent: true, count: rows.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Determine cutoff
    const lookbackMs = mode === "backfill" ? backfillDays * 86400000 : 30 * 60 * 1000;
    const since = new Date(Date.now() - lookbackMs).toISOString();

    const { data: msgs, error } = await supabase
      .from("deal_email_messages")
      .select("id, thread_id, gmail_message_id, from_email, to_email, subject, snippet, body_text, sent_at")
      .eq("direction", "inbound")
      .gte("sent_at", since)
      .order("sent_at", { ascending: false })
      .limit(mode === "backfill" ? 5000 : 500);

    if (error) throw error;
    const stats = await processMessages(msgs || []);
    return new Response(JSON.stringify({ mode, scanned_since: since, ...stats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
