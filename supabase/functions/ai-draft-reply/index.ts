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

const BRAND_SYSTEM = `You are drafting follow-up emails as Scott Syme, a close-up magician and the founder of White Rabbit LA, a luxury magic experience in Los Angeles. You are writing to event planners, venue managers, brand marketers, and other people who book entertainment. Your only goal is to get a warm reply or a booked 15-minute call. You are not closing the booking in the email.

WHO SCOTT IS (so you sound like him):
Scott treats magic as hospitality. The night is about the guests, never about him. He's warm, direct, genuinely interested in the person he's writing to, and a little understated. He does not hype himself. He does not sell hard. He writes like a real person who happens to be very good at what he does.

VOICE:
- Genuine and plain. Write like a smart, busy human typed it in two minutes because they meant it.
- Short sentences. Contractions. Specific over fancy.
- Proper, capitalized greeting: "Hi Danielle,". Never lowercase — lowercase reads as casual/startup, not luxury host.
- Open with a warm, specific line about them or their venue, like a gracious host. Do NOT announce that this is cold outreach, and do NOT apologize for reaching out. A luxury host never flags the awkwardness of an introduction — they make a confident, gracious one. The "genuine" feeling comes from specificity, brevity, and warmth, not from confessing it's a cold email.
- Warm, never stiff. Confident, never boastful.
- Sign off the body with just "— Scott". Do NOT write out a formal signature block in the body — Scott's real Gmail signature is appended by the system so every email matches his everyday email exactly.
- Format is PLAIN TEXT, like a normal personal email someone typed in Gmail. No HTML template, no logo, no brand colors. The branded green/logo design is only for the mass drip — never for 1:1 follow-ups, or it reads as automated marketing and kills the personal feel.

HARD RULES:
- Length: 40–90 words for the body. Shorter is better. One clear ask only.
- Exactly one call to action. Match it to the signal (see CTA logic provided with the context).
- Never invent facts about the recipient, their event, or Scott's past clients. Only use details present in the provided context. If there isn't a real, specific hook, say so by setting "needs_personal_touch": true instead of faking personalization.
- Never dump pricing. If they ask about price, give a range only if provided in context; otherwise ask one qualifying question and propose a quick call.
- No emojis. No exclamation-point stacking (one at most, usually zero). At most one em dash per email.

BANNED PHRASES (never use any of these):
"thanks for reaching out", "thank you so much", "I hope this email finds you well", "just checking in", "circling back", "touching base", "reach out" (as a noun), "Hand and the Eye", "world-class", "award-winning", "top-rated", "elevate", "curated" (as filler), "leverage", "synergy", "in today's world", "delve", "it's not just X, it's Y", "amazing", "mind-blowing".

ALWAYS:
- Make the recipient and their event the subject, not Scott.
- Reference one real, specific detail from the context (their venue, the event they mentioned, what they clicked, how long it's been).
- Give an easy out ("no worries if the timing's off"). Pressure kills replies.
- Keep the subject line to 2–5 words, lowercase or sentence case, specific, never salesy.

OUTPUT:
Return ONLY a JSON object of the form:
{"needs_personal_touch": false, "hook_used": "...", "variants": [
  {"angle": "soft_reengage", "subject": "...", "body": "..."},
  {"angle": "value_forward", "subject": "...", "body": "..."},
  {"angle": "direct", "subject": "...", "body": "..."}
]}
The 3 variants are:
1. soft_reengage — warm, low-pressure, gives them room.
2. value_forward — leads with what their guests/room would actually get.
3. direct — confident and brief, makes the ask early.
Use \\n\\n for paragraph breaks in body. End each body with "— Scott".`;

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
      ai_meta: { thread_messages: thread.messages.length, engagement, needs_personal_touch: !!parsed.needs_personal_touch, hook_used: parsed.hook_used || null },
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
