// Gmail sync: for each open deal, fetch recent Gmail messages to/from contact,
// store threads + messages, detect inbound replies → halt drips, advance stage, log activity.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";
const OWNER_EMAIL = "scott.syme@whiterabbitla.com";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const GOOGLE_MAIL_API_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD");

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function gmail(path: string, query: Record<string, string> = {}) {
  const qs = new URLSearchParams(query).toString();
  const url = `${GATEWAY}${path}${qs ? `?${qs}` : ""}`;
  const r = await fetch(url, {
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GOOGLE_MAIL_API_KEY!,
    },
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Gmail ${path} ${r.status}: ${t.slice(0, 200)}`);
  }
  return r.json();
}

function header(headers: any[], name: string): string {
  const h = headers?.find((x) => x.name.toLowerCase() === name.toLowerCase());
  return h?.value || "";
}

function parseAddress(s: string): string {
  const m = s.match(/<([^>]+)>/);
  return (m ? m[1] : s).trim().toLowerCase();
}

function decodeB64Url(s: string): string {
  try {
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
    return new TextDecoder().decode(Uint8Array.from(atob(b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=")), (c) => c.charCodeAt(0)));
  } catch {
    return "";
  }
}

function extractBody(payload: any): string {
  if (!payload) return "";
  if (payload.body?.data) return decodeB64Url(payload.body.data);
  if (Array.isArray(payload.parts)) {
    for (const p of payload.parts) {
      if (p.mimeType === "text/plain" && p.body?.data) return decodeB64Url(p.body.data);
    }
    for (const p of payload.parts) {
      const nested = extractBody(p);
      if (nested) return nested;
    }
  }
  return "";
}

async function syncDeal(deal: any) {
  if (!deal.contact_email) return { skipped: true };
  const email = deal.contact_email.toLowerCase();
  // Search Gmail for messages with this address (last 90 days)
  const q = `(from:${email} OR to:${email}) newer_than:90d`;
  let list: any;
  try {
    list = await gmail("/users/me/messages", { q, maxResults: "20" });
  } catch (e) {
    console.error(`list failed for ${email}:`, e);
    return { error: String(e) };
  }
  const messages = list.messages || [];
  let newInbound = 0;
  let newOutbound = 0;
  let latestInboundAt: string | null = null;
  let primaryThreadId: string | null = null;

  for (const m of messages) {
    // Skip if already stored
    const { data: existing } = await supabase
      .from("deal_email_messages")
      .select("id")
      .eq("gmail_message_id", m.id)
      .maybeSingle();
    if (existing) continue;

    let full: any;
    try {
      full = await gmail(`/users/me/messages/${m.id}`, { format: "full" });
    } catch (e) {
      console.error(`get failed ${m.id}:`, e);
      continue;
    }
    const headers = full.payload?.headers || [];
    const from = parseAddress(header(headers, "From"));
    const to = parseAddress(header(headers, "To"));
    const subject = header(headers, "Subject");
    const dateStr = header(headers, "Date");
    const sentAt = dateStr ? new Date(dateStr).toISOString() : new Date(parseInt(full.internalDate || `${Date.now()}`)).toISOString();
    const direction = from === OWNER_EMAIL.toLowerCase() ? "outbound" : (from === email ? "inbound" : (to === OWNER_EMAIL.toLowerCase() ? "inbound" : "outbound"));
    const bodyText = extractBody(full.payload).slice(0, 20000);
    const snippet = (full.snippet || "").slice(0, 500);
    const threadId = full.threadId;
    primaryThreadId = primaryThreadId || threadId;

    // Upsert thread
    const { data: thread } = await supabase
      .from("deal_email_threads")
      .upsert({
        deal_id: deal.id,
        gmail_thread_id: threadId,
        subject,
        snippet,
        last_message_at: sentAt,
      }, { onConflict: "deal_id,gmail_thread_id" })
      .select()
      .single();

    if (!thread) continue;

    await supabase.from("deal_email_messages").insert({
      deal_id: deal.id,
      thread_id: thread.id,
      gmail_message_id: m.id,
      direction,
      from_email: from,
      to_email: to,
      subject,
      snippet,
      body_text: bodyText,
      sent_at: sentAt,
    });

    await supabase.from("deal_activity").insert({
      deal_id: deal.id,
      type: direction === "inbound" ? "email_in" : "email_out",
      title: direction === "inbound" ? `Reply from ${from}` : `Sent to ${to}`,
      body: snippet,
      metadata: { gmail_message_id: m.id, subject },
      occurred_at: sentAt,
    });

    if (direction === "inbound") {
      newInbound++;
      if (!latestInboundAt || sentAt > latestInboundAt) latestInboundAt = sentAt;
    } else {
      newOutbound++;
    }
  }

  // Update thread message counts + inbound/outbound timestamps
  if (primaryThreadId) {
    const { data: agg } = await supabase
      .from("deal_email_messages")
      .select("direction,sent_at")
      .eq("deal_id", deal.id);
    if (agg && agg.length) {
      const inbound = agg.filter((x) => x.direction === "inbound").map((x) => x.sent_at).sort();
      const outbound = agg.filter((x) => x.direction === "outbound").map((x) => x.sent_at).sort();
      await supabase
        .from("deal_email_threads")
        .update({
          message_count: agg.length,
          last_inbound_at: inbound.length ? inbound[inbound.length - 1] : null,
          last_outbound_at: outbound.length ? outbound[outbound.length - 1] : null,
          updated_at: new Date().toISOString(),
        })
        .eq("deal_id", deal.id);
    }
  }

  // Update deal — if new inbound reply, halt drips + advance stage + hot signal
  const updates: any = { last_gmail_sync_at: new Date().toISOString() };
  if (primaryThreadId && !deal.gmail_thread_id) updates.gmail_thread_id = primaryThreadId;
  if (latestInboundAt) {
    updates.last_inbound_at = latestInboundAt;
    updates.hot_signal = true;
    updates.hot_reason = "Replied via Gmail";
    if (deal.stage === "new") updates.stage = "contacted";
    // Halt any drip campaigns by marking newsletter contact reply_detected
    if (deal.contact_email) {
      await supabase
        .from("newsletter_contacts")
        .update({ reply_detected: true, engagement_status: "hot" })
        .eq("email", email);
      await supabase
        .from("cold_email_campaigns")
        .update({ status: "replied", nurture_status: "halted" })
        .eq("email", email);
    }
    await supabase.from("deal_activity").insert({
      deal_id: deal.id,
      type: "stage_change",
      title: deal.stage === "new" ? "Auto-advanced: New → Contacted (reply detected)" : "Reply detected — drips halted",
      occurred_at: new Date().toISOString(),
    });
  }
  await supabase.from("deals").update(updates).eq("id", deal.id);

  return { newInbound, newOutbound, threadId: primaryThreadId };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!GOOGLE_MAIL_API_KEY) throw new Error("GOOGLE_MAIL_API_KEY not configured");

    let dealId: string | null = null;
    let isManual = false;
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (body.adminPassword && body.adminPassword === ADMIN_PASSWORD) isManual = true;
      else if (body.cron_secret && body.cron_secret === Deno.env.get("CRON_SECRET")) isManual = false;
      dealId = body.deal_id || null;
    }

    let dealsQuery = supabase
      .from("deals")
      .select("id, contact_email, stage, gmail_thread_id, last_gmail_sync_at")
      .not("contact_email", "is", null)
      .not("stage", "in", "(completed,lost)")
      .order("updated_at", { ascending: false });
    if (dealId) dealsQuery = dealsQuery.eq("id", dealId);
    else dealsQuery = dealsQuery.limit(isManual ? 100 : 40);

    const { data: deals, error } = await dealsQuery;
    if (error) throw error;

    const results: any[] = [];
    for (const d of deals || []) {
      try {
        const r = await syncDeal(d);
        results.push({ deal_id: d.id, email: d.contact_email, ...r });
      } catch (e) {
        results.push({ deal_id: d.id, error: String(e) });
      }
    }
    return new Response(JSON.stringify({ success: true, synced: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
