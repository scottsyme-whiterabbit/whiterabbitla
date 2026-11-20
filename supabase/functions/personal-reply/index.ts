// Personal-reply helper for the CRM. Scott picks a reply type, edits the draft,
// and sends it himself on the original "Booking Inquiry" Gmail thread.
// Nothing here sends on its own: "send" only runs when Scott presses Send.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { createOpenAI } from "npm:@ai-sdk/openai@4";
import { streamText } from "npm:ai@7";
import { isAdminRequest } from "../_shared/require-admin.ts";
import { formatEventDate, parseEventDate, todayPacific } from "../_shared/event-date.ts";
import {
  assembleSmartDraft, buildReplyBody, dateOpenCheck, detailIsGrounded, eventPhrase, freeMessage, isReplyType, locationPhrase,
  pickAlertMessage, proposalCheckinCheck, quietReengageCheck, replyFirstName, replySubject, replyTypeLabel, sendProblems,
  SMART_DRAFT_ACTIVITY_TYPES, SMART_DRAFT_INSTRUCTIONS, smartDraftContext, smartDraftProblems, smartDraftPrompt,
  type AlertMessage, type ReplyFacts, type ReplyType,
} from "../_shared/personal-reply.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-password",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json" },
});

const GATEWAY = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD") || "";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") || "";
const GOOGLE_MAIL_API_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY") || "";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NEEDS_REPLY_DAYS = 14;
const STALE_CLAIM_MS = 10 * 60 * 1000;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;

async function gmail(path: string, params: [string, string][] = []) {
  const qs = params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
  const r = await fetch(`${GATEWAY}${path}${qs ? `?${qs}` : ""}`, {
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "X-Connection-Api-Key": GOOGLE_MAIL_API_KEY },
  });
  if (!r.ok) throw new Error(`Gmail ${r.status}`);
  return r.json();
}
const hdr = (headers: Row[] | undefined, name: string) =>
  (headers || []).find((h) => String(h.name).toLowerCase() === name.toLowerCase())?.value || "";

/** The inquiry behind a deal: the one that created it, else the newest by email. */
async function loadDealAndInquiry(dealId: string) {
  const { data: deal, error } = await supabase.from("deals")
    .select("id,contact_email,contact_name,company,event_type,event_date,location,stage,source_id,created_at,last_inbound_at,notes")
    .eq("id", dealId).maybeSingle();
  if (error) throw error;
  if (!deal) return { deal: null, inquiry: null };
  let inquiry: Row | null = null;
  if (deal.source_id) {
    const { data } = await supabase.from("contact_inquiries")
      .select("id,name,email,event_type,date,location,message,created_at").eq("id", deal.source_id).maybeSingle();
    inquiry = data;
  }
  if (!inquiry && deal.contact_email) {
    const like = String(deal.contact_email).trim().replace(/[\\%_]/g, (c) => `\\${c}`);
    const { data } = await supabase.from("contact_inquiries")
      .select("id,name,email,event_type,date,location,message,created_at").ilike("email", like)
      .order("created_at", { ascending: false }).limit(1);
    inquiry = data?.[0] || null;
  }
  return { deal, inquiry };
}

/** Finds the "Booking Inquiry" alert thread in Scott's Gmail and what a reply on it needs. */
async function findBookingThread(inquiry: Row | null, email: string) {
  if (!inquiry) return { ok: false as const, reason: "This client has no website inquiry, so there is no Booking Inquiry email to reply on." };
  const name = String(inquiry.name || "").replace(/["\\]/g, "").trim();
  if (!name) return { ok: false as const, reason: "The inquiry has no name, so its Booking Inquiry email cannot be found." };
  const after = Math.floor(new Date(inquiry.created_at).getTime() / 1000) - 3600;
  const list = await gmail("/users/me/messages", [["q", `subject:"Booking Inquiry: ${name}" after:${after}`], ["maxResults", "10"]]);
  const metas: AlertMessage[] = [];
  for (const m of (list.messages || []) as Row[]) {
    const full = await gmail(`/users/me/messages/${m.id}`, [["format", "metadata"], ["metadataHeaders", "Subject"], ["metadataHeaders", "Reply-To"]]);
    metas.push({
      id: full.id, threadId: full.threadId, subject: hdr(full.payload?.headers, "Subject"),
      replyTo: hdr(full.payload?.headers, "Reply-To"), internalDate: Number(full.internalDate || 0),
    });
  }
  const alert = pickAlertMessage(metas, { name: inquiry.name, eventType: inquiry.event_type, email });
  if (!alert) return { ok: false as const, reason: "I could not find the Booking Inquiry email for this client in your Gmail, so nothing can be sent from here." };
  const thread = await gmail(`/users/me/threads/${alert.threadId}`, [["format", "metadata"], ["metadataHeaders", "Message-ID"], ["metadataHeaders", "Message-Id"]]);
  const ids = ((thread.messages || []) as Row[]).map((m) => hdr(m.payload?.headers, "Message-ID")).filter(Boolean);
  if (!ids.length) return { ok: false as const, reason: "The Booking Inquiry email could not be read. Try again in a minute." };
  return {
    ok: true as const,
    threadId: alert.threadId,
    subject: replySubject(alert.subject),
    inReplyTo: ids[ids.length - 1],
    references: ids.slice(-10).join(" "),
  };
}

async function dateCheckFor(deal: Row, inquiry: Row | null) {
  const parsed = parseEventDate(deal.event_date) || parseEventDate(inquiry?.date);
  let booked = 0;
  if (parsed) {
    const iso = `${parsed.year}-${String(parsed.month).padStart(2, "0")}-${String(parsed.day).padStart(2, "0")}`;
    const { count, error } = await supabase.from("deals").select("id", { count: "exact", head: true })
      .eq("event_date", iso).in("stage", ["booked", "completed"]).neq("id", deal.id);
    if (error) throw error;
    booked = count || 0;
  }
  return dateOpenCheck({ date: parsed, today: todayPacific(), bookedOnDate: booked, formatted: parsed ? formatEventDate(parsed) : "" });
}

/** Scott's last personal email to this client: a sent personal reply, or any outbound Gmail message that was not automated. */
async function lastOutboundAt(deal: Row): Promise<string | null> {
  const [{ data: pr, error: prErr }, { data: outbound, error: obErr }] = await Promise.all([
    supabase.from("personal_replies").select("sent_at").eq("deal_id", deal.id).eq("status", "sent")
      .not("sent_at", "is", null).order("sent_at", { ascending: false }).limit(1),
    supabase.from("deal_email_messages").select("gmail_message_id,sent_at").eq("deal_id", deal.id)
      .eq("direction", "outbound").order("sent_at", { ascending: false }).limit(50),
  ]);
  if (prErr) throw prErr;
  if (obErr) throw obErr;
  let latest: string | null = pr?.[0]?.sent_at || null;
  const ids = (outbound || []).map((m: Row) => m.gmail_message_id).filter(Boolean);
  let autoSet = new Set<string>();
  if (ids.length) {
    const { data: auto, error } = await supabase.from("automated_gmail_sends").select("gmail_message_id").in("gmail_message_id", ids);
    if (error) throw error;
    autoSet = new Set((auto || []).map((a: Row) => a.gmail_message_id));
  }
  const manual = (outbound || []).find((m: Row) => m.sent_at && !autoSet.has(m.gmail_message_id));
  if (manual && (!latest || new Date(manual.sent_at) > new Date(latest))) latest = manual.sent_at;
  return latest;
}

/** The client's last message: the deal's last inbound time, or the newest inbound Gmail message. */
async function lastInboundAt(deal: Row): Promise<string | null> {
  const { data, error } = await supabase.from("deal_email_messages").select("sent_at").eq("deal_id", deal.id)
    .eq("direction", "inbound").order("sent_at", { ascending: false }).limit(1);
  if (error) throw error;
  const fromMsgs: string | null = data?.[0]?.sent_at || null;
  const fromDeal: string | null = deal.last_inbound_at || null;
  if (!fromMsgs) return fromDeal;
  if (!fromDeal) return fromMsgs;
  return new Date(fromMsgs) > new Date(fromDeal) ? fromMsgs : fromDeal;
}

/** The latest proposal actually sent for this deal, with its view count (venue pitch views excluded). */
async function proposalCheckFor(deal: Row) {
  const { data, error } = await supabase.from("proposals").select("id,sent_at,hold_until").eq("deal_id", deal.id)
    .not("sent_at", "is", null).order("sent_at", { ascending: false }).limit(1);
  if (error) throw error;
  const proposal = data?.[0] || null;
  let views = 0;
  if (proposal) {
    const { count, error: vErr } = await supabase.from("proposal_views").select("id", { count: "exact", head: true })
      .eq("proposal_id", proposal.id).is("venue_pitch_id", null);
    if (vErr) throw vErr;
    views = count || 0;
  }
  return proposalCheckinCheck({ proposal, viewCount: views, today: todayPacific() });
}

/** Guard for the replies that only make sense in a certain situation. Runs before drafting and again before sending. */
async function guardFor(type: ReplyType, deal: Row, inquiry: Row | null):
  Promise<{ ok: true; date: string; holdUntil: string } | { ok: false; reason: string }> {
  if (type === "date_open" || type === "date_still_open") {
    const check = await dateCheckFor(deal, inquiry);
    if (!check.ok) return { ok: false, reason: check.reason };
    return { ok: true, date: check.text, holdUntil: "" };
  }
  if (type === "quiet_reengage") {
    const [out, inb] = await Promise.all([lastOutboundAt(deal), lastInboundAt(deal)]);
    const check = quietReengageCheck({ lastOutboundAt: out, lastInboundAt: inb, now: new Date() });
    if (!check.ok) return check;
  }
  if (type === "proposal_checkin") {
    const check = await proposalCheckFor(deal);
    if (!check.ok) return check;
    return { ok: true, date: "", holdUntil: check.holdUntil };
  }
  return { ok: true, date: "", holdUntil: "" };
}

/** Resends the gateway-issued run id on follow-up calls in the same request. */
function createLovableAiGatewayRunIdFetch(initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  return {
    getRunId: () => runId,
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has("X-Lovable-AIG-Run-ID")) headers.set("X-Lovable-AIG-Run-ID", runId);
      const response = await fetch(input, { ...init, headers });
      runId ??= response.headers.get("X-Lovable-AIG-Run-ID")?.trim() || undefined;
      return response;
    },
  };
}

/** A more specific phrase from the client's own message, or "" (never invented). */
async function extractDetail(message: string, event: string, location: string, rawEvent: string): Promise<string> {
  if (!message || !LOVABLE_API_KEY) return "";
  try {
    const runIdFetch = createLovableAiGatewayRunIdFetch();
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey: LOVABLE_API_KEY,
      headers: { "Lovable-API-Key": LOVABLE_API_KEY, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: runIdFetch.fetch,
    });
    const result = streamText({
      model: provider.responses("openai/gpt-6-astra"),
      instructions: "You pull one short phrase out of a client's event inquiry. You never invent anything. Reply with the phrase only, or NONE.",
      messages: [{
        role: "user",
        content: `Event type: ${event || "unknown"}\nLocation: ${location || "unknown"}\nClient message:\n${message.slice(0, 1500)}\n\nWrite a short noun phrase, at most 12 words, that completes the sentence "having magic at your ___." It should describe their event more specifically than "${event || "event"}${location ? ` in ${location}` : ""}", for example "wedding cocktail hour at Vibiana" or "wedding in Hollywood". Use only words that appear in the client message, the event type or the location. Do not start with "a", "an" or "the". Never include dates, numbers, guest counts, prices, budgets or how they found us. No dashes. If the message adds nothing more specific, reply NONE.`,
      }],
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });
    const text = (await result.text).replace(/\s+/g, " ").trim().replace(/^["']|["']$/g, "");
    if (!text || /^none\.?$/i.test(text)) return "";
    const phrase = text.replace(/^(?:a|an|the)\s+/i, "").replace(/[.,;:!]+$/, "");
    if (!detailIsGrounded(phrase, [message, event, location, rawEvent])) return "";
    // Lowercase a leading common word ("Wedding cocktail hour" -> "wedding cocktail hour").
    const firstWord = phrase.split(" ")[0];
    if (event.toLowerCase().split(" ").includes(firstWord.toLowerCase())) return firstWord.toLowerCase() + phrase.slice(firstWord.length);
    return phrase;
  } catch (e) {
    console.warn("[personal-reply] detail extraction skipped", e instanceof Error ? e.message : e);
    return "";
  }
}

type SmartResult = { ok: true; body: string } | { ok: false; status: number; error: string };

/** Smart AI draft: the AI writes 2 to 4 sentences from the client record only; anything unsafe is refused, never patched. */
async function writeSmartDraft(deal: Row, inquiry: Row | null, firstName: string, signal: AbortSignal): Promise<SmartResult> {
  if (!LOVABLE_API_KEY) return { ok: false, status: 503, error: "Smart AI draft is not set up on the server, so no draft was written. Use one of the other replies." };
  const [{ data: acts, error: aErr }, proposal] = await Promise.all([
    supabase.from("deal_activity").select("type,title,body,occurred_at").eq("deal_id", deal.id)
      .in("type", SMART_DRAFT_ACTIVITY_TYPES).order("occurred_at", { ascending: false }).limit(8),
    proposalCheckFor(deal),
  ]);
  if (aErr) throw aErr;
  // Date is shown for context only; availability is never checked or claimed here.
  const parsedDate = parseEventDate(deal.event_date) || parseEventDate(inquiry?.date);
  const eventDate = parsedDate ? formatEventDate(parsedDate) : "";
  const context = smartDraftContext({
    firstName,
    stage: deal.stage,
    notes: deal.notes,
    activities: (acts || []) as SmartDraftActivity[],
    proposal: proposal.ok ? { sentOn: proposal.sentOn, holdUntil: proposal.holdUntil, viewCount: proposal.viewCount } : null,
    inquiry: inquiry ? { name: inquiry.name, eventType: inquiry.event_type, location: inquiry.location, message: inquiry.message } : null,
    company: deal.company,
    eventDate,
  });

  let failStatus = 0;
  let failMessage = "";
  let streamError: unknown = null;
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey: LOVABLE_API_KEY,
    headers: { "Lovable-API-Key": LOVABLE_API_KEY, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const r = await runIdFetch.fetch(input, init);
      if (!r.ok) {
        failStatus = r.status;
        try {
          const j = await r.clone().json();
          failMessage = String(j?.error?.message || j?.message || "").slice(0, 300);
        } catch { /* not JSON */ }
      }
      return r;
    },
  });
  let text = "";
  try {
    const result = streamText({
      model: provider.responses("openai/gpt-6-astra"),
      instructions: SMART_DRAFT_INSTRUCTIONS,
      messages: [{ role: "user", content: smartDraftPrompt(context) }],
      abortSignal: signal,
      onError: ({ error }) => { streamError = error; },
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });
    text = (await result.text).trim();
  } catch (e) {
    streamError = streamError || e;
  }
  if (!text) {
    if (streamError) console.error("[personal-reply] smart draft failed", failStatus, streamError instanceof Error ? streamError.message : streamError);
    if (failStatus === 402) return { ok: false, status: 402, error: failMessage || "Your AI credits have run out, so the Smart AI draft could not be written. Use one of the other replies." };
    if (failStatus === 429) return { ok: false, status: 429, error: "The AI is busy right now. Wait a minute, then press Smart AI draft again." };
    if (failStatus === 403) return { ok: false, status: 403, error: failMessage || "The AI service refused this request, so no draft was written." };
    if (failStatus === 401) return { ok: false, status: 503, error: "Smart AI draft is not set up correctly on the server, so no draft was written." };
    if (streamError || failStatus) return { ok: false, status: 502, error: "The AI could not be reached, so no draft was written. Try again in a minute or use one of the other replies." };
    return { ok: false, status: 502, error: "The AI returned an empty draft, so nothing was written. Try again or use one of the other replies." };
  }
  const body = assembleSmartDraft(text, firstName);
  const problems = smartDraftProblems(body, { firstName, context });
  if (problems.length) {
    console.warn("[personal-reply] smart draft rejected", problems);
    return { ok: false, status: 422, error: `The AI draft did not pass the safety checks (${problems[0]}), so it was not shown. Press Smart AI draft again or use one of the other replies.` };
  }
  return { ok: true, body };
}

type SmartDraftActivity = { type: string; title: string | null; body: string | null; occurred_at: string };

async function signatureHtml(): Promise<string> {
  const r = await fetch(`${SUPABASE_URL}/functions/v1/gmail-send`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    body: JSON.stringify({ signature_only: true, adminPassword: ADMIN_PASSWORD }),
  });
  const j = await r.json().catch(() => ({}));
  return typeof j.signature_html === "string" ? j.signature_html : "";
}

/** Inquiries from the last two weeks that Scott has not personally answered yet. */
async function needsReply() {
  const since = new Date(Date.now() - NEEDS_REPLY_DAYS * 864e5).toISOString();
  const { data: inquiries, error } = await supabase.from("contact_inquiries")
    .select("id,name,email,event_type,date,location,created_at").gte("created_at", since)
    .order("created_at", { ascending: false }).limit(60);
  if (error) throw error;
  const out: Row[] = [];
  const seen = new Set<string>();
  for (const inq of inquiries || []) {
    const email = String(inq.email || "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || seen.has(email)) continue;
    seen.add(email);
    const like = email.replace(/[\\%_]/g, (c) => `\\${c}`);
    const { data: deals } = await supabase.from("deals")
      .select("id,stage,reply_dismissed_at,source_id,contact_name,event_type,event_date,location")
      .ilike("contact_email", like).order("created_at", { ascending: false }).limit(5);
    const deal = (deals || []).find((d: Row) => d.source_id === inq.id) || (deals || [])[0];
    if (!deal || !["new", "contacted"].includes(deal.stage) || deal.reply_dismissed_at) continue;
    const { count: personal } = await supabase.from("personal_replies").select("id", { count: "exact", head: true })
      .eq("deal_id", deal.id).eq("status", "sent");
    if ((personal || 0) > 0) continue;
    // Any outbound Gmail message after the inquiry that is not one of the automated inquiry emails.
    const { data: outbound } = await supabase.from("deal_email_messages").select("gmail_message_id")
      .eq("direction", "outbound").ilike("to_email", `%${like}%`).gt("sent_at", inq.created_at).limit(200);
    const ids = (outbound || []).map((m: Row) => m.gmail_message_id).filter(Boolean);
    if (ids.length) {
      const { data: auto } = await supabase.from("automated_gmail_sends").select("gmail_message_id").in("gmail_message_id", ids);
      const autoSet = new Set((auto || []).map((a: Row) => a.gmail_message_id));
      if (ids.some((id: string) => !autoSet.has(id))) continue;
    }
    out.push({
      deal_id: deal.id, inquiry_id: inq.id, name: inq.name || deal.contact_name, email,
      event_type: inq.event_type, date: inq.date, location: inq.location, created_at: inq.created_at, stage: deal.stage,
    });
  }
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    if (!(await isAdminRequest(req, body))) return json({ error: "Unauthorized" }, 401);
    const action = String(body.action || "");

    if (action === "list") {
      const items = await needsReply();
      return json({ count: items.length, items: items.slice(0, 10) });
    }

    const dealId = typeof body.deal_id === "string" ? body.deal_id : "";
    if (!UUID.test(dealId)) return json({ error: "deal_id is required" }, 400);
    if (!isReplyType(body.reply_type)) return json({ error: "Choose a reply type" }, 400);
    const type = body.reply_type as ReplyType;

    const { deal, inquiry } = await loadDealAndInquiry(dealId);
    if (!deal) return json({ error: "Deal not found" }, 404);
    const to = String(deal.contact_email || "").trim().toLowerCase();
    if (!to.includes("@")) return json({ error: "This deal has no client email" }, 400);

    if (action === "draft") {
      const guard = await guardFor(type, deal, inquiry);
      if (!guard.ok) return json({ error: guard.reason }, 409);
      const event = eventPhrase(inquiry?.event_type || deal.event_type);
      const location = locationPhrase(inquiry?.location || deal.location);
      const detail = ["voicemail", "schedule_call", "quiet_reengage", "proposal_checkin", "date_still_open"].includes(type)
        ? await extractDetail(freeMessage(inquiry?.message), event, location, String(inquiry?.event_type || ""))
        : "";
      const facts: ReplyFacts = {
        firstName: replyFirstName(inquiry?.name || deal.contact_name), event, location, detail, date: guard.date, holdUntil: guard.holdUntil,
      };
      let draftBody = "";
      if (type === "smart_draft") {
        const smart = await writeSmartDraft(deal, inquiry, facts.firstName, req.signal);
        if (!smart.ok) return json({ error: smart.error }, smart.status);
        draftBody = smart.body;
      } else {
        draftBody = buildReplyBody(type, facts);
      }
      const [thread, signature] = await Promise.all([
        findBookingThread(inquiry, to).catch(() => ({ ok: false as const, reason: "Gmail could not be reached. Try again in a minute." })),
        signatureHtml().catch(() => ""),
      ]);
      return json({
        to,
        reply_type: type,
        body: draftBody,
        facts,
        thread: thread.ok ? { found: true, subject: thread.subject } : { found: false, reason: thread.reason },
        signature_html: signature,
      });
    }

    if (action === "send") {
      const text = typeof body.body === "string" ? body.body.replace(/\r\n/g, "\n").slice(0, 8000) : "";
      const problems = sendProblems(type, text);
      if (problems.length) return json({ error: problems[0] }, 400);
      const requestId = typeof body.request_id === "string" ? body.request_id : "";
      if (!UUID.test(requestId)) return json({ error: "request_id is required" }, 400);
      const guard = await guardFor(type, deal, inquiry);
      if (!guard.ok) return json({ error: guard.reason }, 409);
      const thread = await findBookingThread(inquiry, to);
      if (!thread.ok) return json({ error: thread.reason }, 404);

      // Claim before sending. A crashed send older than 10 minutes no longer blocks this deal.
      await supabase.from("personal_replies").delete().eq("deal_id", deal.id).eq("status", "sending")
        .lt("created_at", new Date(Date.now() - STALE_CLAIM_MS).toISOString());
      const { data: claim, error: claimErr } = await supabase.from("personal_replies").insert({
        request_id: requestId, deal_id: deal.id, inquiry_id: inquiry?.id || null, reply_type: type,
        to_email: to, subject: thread.subject, body: text, status: "sending",
      }).select("id").single();
      if (claimErr) {
        if (claimErr.code === "23505") {
          const { data: prior } = await supabase.from("personal_replies").select("status").eq("request_id", requestId).maybeSingle();
          if (prior?.status === "sent") return json({ sent: true, already: true });
          return json({ error: "This reply is already being sent." }, 409);
        }
        throw claimErr;
      }

      let sendData: Row = {};
      let ok = false;
      try {
        const r = await fetch(`${SUPABASE_URL}/functions/v1/gmail-send`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
          body: JSON.stringify({
            adminPassword: ADMIN_PASSWORD, deal_id: deal.id, to, subject: thread.subject, body_text: text,
            gmail_thread_id: thread.threadId, in_reply_to: thread.inReplyTo, references: thread.references,
            personal_reply: replyTypeLabel(type),
          }),
        });
        sendData = await r.json().catch(() => ({}));
        ok = r.ok && !!sendData.message_id;
      } catch (e) {
        console.error("[personal-reply] send failed", e);
      }
      if (!ok) {
        await supabase.from("personal_replies").delete().eq("id", claim.id);
        const reason = sendData.reason ? `Not sent (${String(sendData.reason).replace(/_/g, " ")}).` : "Gmail did not accept the message. Nothing was sent.";
        return json({ error: reason }, 502);
      }
      await supabase.from("personal_replies").update({
        status: "sent", sent_at: new Date().toISOString(), gmail_message_id: sendData.message_id, gmail_thread_id: sendData.thread_id || thread.threadId,
      }).eq("id", claim.id);
      return json({ sent: true, message_id: sendData.message_id, subject: thread.subject });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    const id = crypto.randomUUID();
    console.error(`[personal-reply] ${id}`, e);
    return json({ error: "Something went wrong. Nothing was sent.", request_id: id }, 500);
  }
});
