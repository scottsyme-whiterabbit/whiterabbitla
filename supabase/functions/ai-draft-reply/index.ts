// Generate humanized, on-brand follow-up email variants.
// Pulls Gmail thread context (if any), engagement signals, and lead/deal record.
// Inserts 3 variants into public.email_drafts as status='draft', returns them.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const GOOGLE_MAIL_API_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY")!;
const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const GMAIL = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";

function decodeB64Url(s: string) {
  try {
    const pad = s.replace(/-/g, "+").replace(/_/g, "/");
    return decodeURIComponent(escape(atob(pad + "===".slice((pad.length + 3) % 4))));
  } catch { return ""; }
}

function extractPlainBody(payload: any): string {
  if (!payload) return "";
  if (payload.body?.data) {
    if (payload.mimeType === "text/plain" || !payload.mimeType?.startsWith("multipart")) {
      return decodeB64Url(payload.body.data);
    }
  }
  if (payload.parts) {
    for (const p of payload.parts) {
      if (p.mimeType === "text/plain" && p.body?.data) return decodeB64Url(p.body.data);
    }
    for (const p of payload.parts) {
      const nested = extractPlainBody(p);
      if (nested) return nested;
    }
  }
  return "";
}

async function fetchThreadContext(threadId: string) {
  try {
    const r = await fetch(`${GMAIL}/users/me/threads/${threadId}?format=full`, {
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_MAIL_API_KEY,
      },
    });
    if (!r.ok) return { messages: [], lastMessageId: null };
    const data = await r.json();
    const messages = (data.messages || []).slice(-6).map((m: any) => {
      const headers = m.payload?.headers || [];
      const h = (n: string) => headers.find((x: any) => x.name.toLowerCase() === n.toLowerCase())?.value || "";
      const from = h("From");
      const isFromScott = from.toLowerCase().includes("scott.syme");
      const body = extractPlainBody(m.payload).slice(0, 2000);
      return {
        from,
        date: h("Date"),
        subject: h("Subject"),
        messageId: h("Message-ID"),
        direction: isFromScott ? "OUT" : "IN",
        body,
      };
    });
    const lastIn = [...messages].reverse().find((m: any) => m.direction === "IN");
    return { messages, lastInMessageId: lastIn?.messageId || null, lastSubject: messages[messages.length - 1]?.subject || "" };
  } catch (e) {
    console.error("Thread fetch failed", e);
    return { messages: [], lastInMessageId: null, lastSubject: "" };
  }
}

const BRAND_SYSTEM = `You are drafting a follow-up email AS Scott Syme of White Rabbit LA — a luxury private magic and entertainment company serving high-end planners, corporate clients, country clubs, and spirits brands.

BRAND VOICE — non-negotiable:
- North star: Psalm 16:11 "In your presence there is fullness of joy." Magic as hospitality, no ego, the audience is the subject.
- Ritz-Carlton ten-foot standard. Sophisticated, warm, confident, never salesy.
- NEVER use these phrases: "thank you so much for reaching out", "just checking in", "circling back", "touching base", "synergy", "elevate", "transform", "world-class", "best-in-class", "I hope this email finds you well", em-dashes used like punctuation crutches, exclamation points.
- NEVER mention "Hand and the Eye" by name.
- One key idea per email. ONE soft, specific qualifying question (or one concrete next step) — never two.
- Write like a human who lives in these rooms. Short paragraphs (1-3 sentences). Lowercase greetings ("Hi {firstName},") are fine. No corporate jargon, no AI tells.
- A touch of edge / quiet confidence. Make them feel like missing this would be the wrong call — without ever saying that.
- Sign-off: "— Scott" (no full signature block; the platform appends it).

OUTPUT FORMAT — strict:
Return ONLY a JSON object: {"variants": [{"angle": "...", "subject": "...", "body": "..."}, {...}, {...}]}
- Exactly 3 variants. Different angles (e.g. "soft re-engage", "value-forward / specific hook", "direct & confident").
- Subject lines: under 55 chars, no emoji, no clickbait, lowercase or sentence case.
- Body: plain text only (no HTML, no markdown bold). Use \\n\\n for paragraph breaks. 60-140 words. End with "— Scott".
- If replying to an existing thread, write a reply (don't restate everything; reference one specific thing they said or did).
- If this is a first-touch follow-up to engagement (opens/clicks with no thread), open with a specific observation about why you're writing.`;

function buildUserPrompt(args: any) {
  const { contact_name, company, vertical, source, engagement_summary, deal, thread, user_hint, notes } = args;
  const firstName = (contact_name || "").split(" ")[0] || "there";
  const parts: string[] = [];
  parts.push(`CONTACT: ${contact_name || "(no name)"} <${args.contact_email}>`);
  if (company) parts.push(`COMPANY: ${company}`);
  if (vertical) parts.push(`VERTICAL: ${vertical}`);
  if (source) parts.push(`SOURCE: ${source}`);
  if (engagement_summary) parts.push(`ENGAGEMENT: ${engagement_summary}`);
  if (deal) {
    const d: string[] = [];
    if (deal.event_type) d.push(`event: ${deal.event_type}`);
    if (deal.event_date) d.push(`date: ${deal.event_date}`);
    if (deal.notes) d.push(`notes: ${deal.notes}`);
    if (d.length) parts.push(`DEAL: ${d.join(" | ")}`);
  }
  if (notes) parts.push(`INTERNAL NOTES: ${notes}`);
  if (thread?.messages?.length) {
    parts.push(`\nEXISTING THREAD (most recent last):`);
    for (const m of thread.messages) {
      parts.push(`[${m.direction} ${m.date}] ${m.from}\nSubject: ${m.subject}\n${m.body}\n---`);
    }
    parts.push(`\nWrite a REPLY in this thread. Reference one specific thing from their last inbound message.`);
  } else {
    parts.push(`\nThis is a fresh outbound follow-up (no prior thread). Open with a specific reason for writing.`);
  }
  if (user_hint) parts.push(`\nSCOTT'S STEER FOR THIS DRAFT: ${user_hint}`);
  parts.push(`\nFirst name to use in greeting: ${firstName}`);
  parts.push(`\nReturn 3 humanized, on-brand variants per the system spec. JSON only.`);
  return parts.join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    if (body.adminPassword !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const {
      contact_email, contact_name, company, vertical, source,
      deal_id, gmail_thread_id, engagement_summary, notes, user_hint,
    } = body;
    if (!contact_email) {
      return new Response(JSON.stringify({ error: "Missing contact_email" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Pull deal record
    let deal: any = null;
    let resolvedThreadId = gmail_thread_id;
    if (deal_id) {
      const { data: d } = await supabase.from("deals").select("id, contact_email, contact_name, company, event_type, event_date, notes, gmail_thread_id, stage").eq("id", deal_id).maybeSingle();
      deal = d;
      if (!resolvedThreadId && d?.gmail_thread_id) resolvedThreadId = d.gmail_thread_id;
    }

    // Pull engagement signals from cold_email_campaigns
    let engagement = engagement_summary || "";
    if (!engagement) {
      const { data: c } = await supabase.from("cold_email_campaigns").select("engagement_opens, engagement_clicks, campaign_category, title").eq("email", contact_email).maybeSingle();
      if (c) {
        const bits = [];
        if (c.engagement_opens) bits.push(`${c.engagement_opens} opens`);
        if (c.engagement_clicks) bits.push(`${c.engagement_clicks} clicks`);
        if (c.title) bits.push(`title: ${c.title}`);
        if (c.campaign_category && !vertical) bits.push(`vertical: ${c.campaign_category}`);
        engagement = bits.join(", ");
      }
    }

    // Fetch Gmail thread context if available
    let thread = { messages: [] as any[], lastInMessageId: null as any, lastSubject: "" };
    if (resolvedThreadId) {
      thread = await fetchThreadContext(resolvedThreadId) as any;
    }

    const userPrompt = buildUserPrompt({
      contact_email, contact_name, company,
      vertical: vertical || deal?.event_type || "",
      source, engagement_summary: engagement, deal, thread, user_hint, notes,
    });

    // Call Lovable AI
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Lovable-API-Key": LOVABLE_API_KEY,
        "Content-Type": "application/json",
        "X-Lovable-AIG-SDK": "vercel-ai-sdk",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: BRAND_SYSTEM },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (aiRes.status === 429) return new Response(JSON.stringify({ error: "Rate limit — try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (aiRes.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in workspace billing." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!aiRes.ok) {
      const txt = await aiRes.text();
      throw new Error(`AI ${aiRes.status}: ${txt}`);
    }
    const aiData = await aiRes.json();
    let raw = aiData.choices?.[0]?.message?.content || "{}";
    // Strip code fences if any
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    let parsed: any;
    try { parsed = JSON.parse(raw); } catch { parsed = { variants: [] }; }
    const variants = Array.isArray(parsed.variants) ? parsed.variants.slice(0, 3) : [];
    if (variants.length === 0) throw new Error("AI returned no variants");

    // Insert drafts
    const generation_id = crypto.randomUUID();
    const rows = variants.map((v: any, i: number) => ({
      contact_email,
      contact_name: contact_name || null,
      company: company || null,
      vertical: vertical || null,
      source: source || null,
      deal_id: deal_id || null,
      gmail_thread_id: resolvedThreadId || null,
      in_reply_to: thread.lastInMessageId || null,
      variant_index: i,
      angle: v.angle || null,
      subject: String(v.subject || "(no subject)").slice(0, 200),
      body: String(v.body || "").trim(),
      status: "draft",
      user_hint: user_hint || null,
      generation_id,
      ai_meta: { thread_messages: thread.messages.length, engagement },
    }));
    const { data: inserted, error } = await supabase.from("email_drafts").insert(rows).select("*");
    if (error) throw error;

    return new Response(JSON.stringify({ success: true, generation_id, drafts: inserted, thread_context: { messageCount: thread.messages.length, hadPriorThread: !!resolvedThreadId } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-draft-reply error", e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
