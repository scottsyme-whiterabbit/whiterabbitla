// Personal replies Scott writes on the original "Booking Inquiry" Gmail thread.
// Pure helpers only (no imports) so the browser, the edge function and tests
// all share the exact same templates and safety checks.

export type ReplyType =
  | "voicemail" | "schedule_call" | "date_open" | "booked" | "proposal_followup"
  | "quiet_reengage" | "proposal_checkin" | "date_still_open" | "castle_invite" | "smart_draft";

/** "reply" is the original first-reply group; "followup" holds the follow-up and re-engagement replies. */
export type ReplyGroup = "reply" | "followup";

export const REPLY_TYPES: { key: ReplyType; label: string; group: ReplyGroup }[] = [
  { key: "voicemail", label: "Left a voicemail", group: "reply" },
  { key: "schedule_call", label: "Ask to schedule a call", group: "reply" },
  { key: "date_open", label: "Date is open", group: "reply" },
  { key: "booked", label: "I'm booked that night", group: "reply" },
  { key: "proposal_followup", label: "Proposal follow-up", group: "reply" },
  { key: "quiet_reengage", label: "Re-engage quiet lead", group: "followup" },
  { key: "proposal_checkin", label: "Proposal check-in", group: "followup" },
  { key: "date_still_open", label: "Date still open nudge", group: "followup" },
  { key: "castle_invite", label: "Stay in touch / Magic Castle invite", group: "followup" },
  { key: "smart_draft", label: "Smart AI draft", group: "followup" },
];

export const FOLLOWUP_GROUP_LABEL = "Follow-up & re-engagement";

/** The newer replies also follow the stricter copy rules (banned phrases, no links, no "not X, but Y"). */
export const isFollowUpType = (t: string): boolean => REPLY_TYPES.some((r) => r.key === t && r.group === "followup");

export const replyTypeLabel = (t: string): string => REPLY_TYPES.find((r) => r.key === t)?.label || "";
export const isReplyType = (t: unknown): t is ReplyType => typeof t === "string" && REPLY_TYPES.some((r) => r.key === t);

export interface ReplyFacts {
  firstName: string;
  /** Short event noun, e.g. "wedding". Empty when unknown. */
  event: string;
  /** Location as the client typed it, e.g. "Hollywood". Empty when unknown. */
  location: string;
  /** A more specific phrase taken from the client's own message. Replaces "{event} in {location}". */
  detail: string;
  /** Formatted, already checked date for "Date is open", e.g. "Saturday, November 21". */
  date: string;
  /** Proposal check-in only: formatted hold end date, set only while the hold is still active. */
  holdUntil?: string;
}

const clean = (s: string | null | undefined) => (s || "").replace(/\s+/g, " ").trim();

export function replyFirstName(name: string | null | undefined): string {
  const n = clean(name);
  if (!n || n.includes("@")) return "";
  if (/\s(?:and|&)\s/i.test(n)) return n;
  const first = n.split(" ")[0];
  return first.charAt(0).toUpperCase() + first.slice(1);
}

const EVENT_WORDS: Record<string, string> = {
  "corporate event": "corporate event",
  corporate: "corporate event",
  wedding: "wedding",
  "private party": "private party",
  private: "private event",
  "private magic show": "private show",
  "parlor show": "parlor show",
  "something else": "",
  other: "",
  event: "",
};

/** "Private Party (Corporate)" -> "private party". Empty when it says nothing useful. */
export function eventPhrase(eventType: string | null | undefined): string {
  const base = clean((eventType || "").split("(")[0]).replace(/[—–]/g, " ").trim();
  if (!base) return "";
  const key = base.toLowerCase();
  if (key in EVENT_WORDS) return EVENT_WORDS[key];
  // Keep their words; lowercase everything except acronyms.
  return base.split(" ").map((w) => (/^[A-Z]{2,}$/.test(w) ? w : w.toLowerCase())).join(" ");
}

/** "Hollywood, CA" -> "Hollywood". Keeps what they typed otherwise. */
export function locationPhrase(location: string | null | undefined): string {
  return clean(location).replace(/[—–]/g, " ").replace(/(?:,\s*|\s+)(?:CA|Calif\.?|California|california)\.?$/, "").replace(/[.,;]+$/, "").trim();
}

/** The client's own words from the inquiry message, without the form fields (budget, how they found us...). */
export function freeMessage(message: string | null | undefined): string {
  const lines = (message || "").split(/\r?\n/);
  const kept = lines.filter((l) => {
    const t = l.trim();
    if (!t) return true;
    if (/^(client type|guest count|budget|how they found us|recommended|event date \(raw\)|referral source|source)\s*:/i.test(t)) return false;
    if (/^no additional message/i.test(t)) return false;
    return true;
  });
  return kept.join("\n").trim();
}

const STOP = new Set(["a", "an", "the", "at", "in", "on", "of", "for", "and", "with", "our", "your", "my", "their", "to", "by", "near", "&"]);
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const words = (s: string) => norm(s).match(/[a-z']+/g) || [];

/**
 * A detail phrase is only usable when every meaningful word in it appears in
 * what the client actually wrote (or the event type / location). This keeps the
 * draft from inventing a venue, a theme or anything else.
 */
export function detailIsGrounded(detail: string, sources: string[]): boolean {
  const d = clean(detail);
  if (!d || d.length > 90) return false;
  if (/\d|\$|[—–]/.test(d)) return false;
  const have = new Set(sources.flatMap(words).map((w) => w.replace(/'s$/, "")));
  const need = words(d).map((w) => w.replace(/'s$/, "")).filter((w) => !STOP.has(w));
  if (!need.length) return false;
  return need.every((w) => have.has(w));
}

const article = (p: string) => (/^[aeiou]/i.test(p) && !/^(uni|use|eu|one)/i.test(p) ? "an" : "a");

/** "{event} in {location}" with missing parts omitted, or the detail phrase. Empty when nothing is known. */
export function occasionPhrase(f: Pick<ReplyFacts, "event" | "location" | "detail">): string {
  if (clean(f.detail)) return clean(f.detail);
  const ev = clean(f.event);
  const loc = clean(f.location);
  if (ev && loc) return `${ev} in ${loc}`;
  if (ev) return ev;
  if (loc) return `event in ${loc}`;
  return "";
}

const greet = (word: string, first: string) => (first ? `${word} ${first},` : `${word},`);

/** Scott's approved templates, filled from the inquiry. Missing details are left out, never guessed. */
export function buildReplyBody(type: ReplyType, f: ReplyFacts): string {
  const first = clean(f.firstName);
  const occasion = occasionPhrase(f);
  const ev = clean(f.event) || "event";
  switch (type) {
    case "voicemail":
      return [
        greet("Hello", first),
        "",
        `Thank you for sending in your reservation request today, sounds very exciting of having magic at your ${occasion || "event"}.`,
        "",
        `I just left you a voice message, I would love to talk to you about details of the ${ev} and see where we can collaborate. Let me know of a good time coming up that can work for you to connect. After our call I can put together an official proposal presentation.`,
        "",
        "Talk soon,",
        "-Scott",
      ].join("\n");
    case "schedule_call":
      return [
        greet("Hi", first),
        "",
        `Thank you so much for reaching out, this sounds like a lovely time${occasion ? `, ${article(occasion)} ${occasion}` : ""}. I would enjoy planning a time to speak on the phone and hear some more details from you. Let me know some good times for you to connect.`,
        "",
        "Thanks so much, talk soon,",
        "-Scott",
      ].join("\n");
    case "date_open":
      if (!clean(f.date)) throw new Error("A checked date is required for this reply");
      return [
        greet("Hello", first),
        "",
        `Thank you so much for the inquiry, ${clean(f.date)} is open and available for me. I just left you a message, would love to talk with you about the details of your upcoming event. Let me know some good times that work for you.`,
        "",
        "Talk soon,",
        "-Scott",
      ].join("\n");
    case "booked":
      return [
        greet("Hello", first),
        "",
        "Thank you so much for reaching out, I was happy to receive your inquiry today. Unfortunately I am booked with a prior reservation that night, so I will not be able to make an appearance at your event, which sounds like a really lovely time.",
        "",
        "If there's anything I can do for you in the future, please let me know. I would love to stay in touch. I can help by making a few suggestions of other magicians if you like.",
        "",
        "Best,",
        "-Scott",
      ].join("\n");
    case "proposal_followup":
      return [
        greet("Hello", first),
        "",
        "Just checking to see if there are any questions in the proposal booking system. Happy to help!",
        "",
        "Best,",
        "-Scott",
      ].join("\n");
    case "quiet_reengage":
      return [
        greet("Hello", first),
        "",
        `Checking in here to see if there is anything I can do for you. Have you found a magician yet${occasion ? ` for your ${occasion}` : ""}? I would still like to be considered.`,
        "",
        "Best,",
        "-Scott",
      ].join("\n");
    case "proposal_checkin": {
      const hold = clean(f.holdUntil);
      return [
        greet("Hello", first),
        "",
        `I wanted to check in on the proposal I sent over${occasion ? ` for your ${occasion}` : ""}.${hold ? ` Your date is currently held for you through ${hold}.` : ""} I am happy to answer any questions or adjust any details.`,
        "",
        CLOSING_LINE,
        "",
        "Best,",
        "-Scott",
      ].join("\n");
    }
    case "date_still_open":
      if (!clean(f.date)) throw new Error("A checked date is required for this reply");
      return [
        greet("Hello", first),
        "",
        `${clean(f.date)} is still open and available for me. I would love to talk with you about the details of your upcoming event. Let me know some good times that work for you.`,
        "",
        CLOSING_LINE,
        "",
        "Talk soon,",
        "-Scott",
      ].join("\n");
    case "castle_invite":
      return [
        greet("Hello", first),
        "",
        "I would love to stay in touch. If you are ever interested, I would be happy to invite you to the Magic Castle in Hollywood sometime, with up to 5 guests on my guest list.",
        "",
        CLOSING_LINE,
        "",
        "Best,",
        "-Scott",
      ].join("\n");
    case "smart_draft":
      throw new Error("Smart AI drafts are written by the AI, not from a template");
  }
}

export const CLOSING_LINE = "Please let me know if there is anything I can do for you.";
export const SMART_DRAFT_ENDING = `${CLOSING_LINE}\n\nBest,\n-Scott`;

/** Problems that block sending. Empty array means the body is safe to send. */
export function replyBodyProblems(body: string): string[] {
  const out: string[] = [];
  const b = body || "";
  if (!b.trim()) out.push("The message is empty.");
  if (/[—–]/.test(b)) out.push("Remove the long dash. Use a comma or a full stop instead.");
  if (/\$\s?\d|\b\d[\d,.]*\s?(?:k|dollars|usd)\b/i.test(b)) out.push("Remove the price. Personal replies never include pricing.");
  if (/office telephone|\(650\)\s*678-9428|email:\s*scott\.syme@/i.test(b)) out.push("Remove the signature from the message. It is added once, automatically, when you send.");
  if (/\{[^}]*\}|\[(?:first|event|location|date)\]/i.test(b)) out.push("Fill in or remove the blank in brackets.");
  // A hyphen used as punctuation (" - ", "word- ", "--"). Hyphenated words and the "-Scott" sign off are fine.
  const withoutSignoff = b.split("\n").filter((l) => !/^\s*-\s?Scott\s*$/.test(l)).join("\n");
  if (/(?:^|\s)-|-(?:\s|$)|--/m.test(withoutSignoff)) out.push("Remove the dash. Use a comma or a full stop instead.");
  return out;
}

/** Extra copy rules for the follow-up replies, on top of replyBodyProblems. */
export function copyRuleProblems(body: string): string[] {
  const out: string[] = [];
  const b = norm(body || "").replace(/[\u2018\u2019]/g, "'");
  if (/thank you so much for reaching out|thanks? (?:you )?for reaching out|just checking in/.test(b)) {
    out.push('Remove "thanks for reaching out" or "just checking in". Say it in your own words instead.');
  }
  if (/\bnot\b[^.!?\n]{1,60},\s*but\b/.test(b)) out.push('Rephrase the "not this, but that" sentence. Say what it is plainly.');
  if (/https?:\/\/|\bwww\./.test(b)) out.push("Remove the link. These replies stay link free.");
  return out;
}

/** Everything that blocks sending a reply of this type. */
export function sendProblems(type: ReplyType, body: string): string[] {
  return [...replyBodyProblems(body), ...(isFollowUpType(type) ? copyRuleProblems(body) : [])];
}

const DAY_MS = 864e5;
export const QUIET_DAYS = 7;
const pacificDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", month: "long", day: "numeric" });

export type GuardCheck = { ok: true } | { ok: false; reason: string };

/**
 * "Re-engage quiet lead" needs: Scott wrote to them, that was at least 7 days ago,
 * and the client has not written back since.
 */
export function quietReengageCheck(i: { lastOutboundAt: string | null; lastInboundAt: string | null; now: Date }): GuardCheck {
  const out = i.lastOutboundAt ? new Date(i.lastOutboundAt).getTime() : NaN;
  if (!Number.isFinite(out)) {
    return { ok: false, reason: "You have not written to this client yet, so there is nothing to follow up on. Use one of the first replies instead." };
  }
  const inb = i.lastInboundAt ? new Date(i.lastInboundAt).getTime() : NaN;
  if (Number.isFinite(inb) && inb > out) {
    return { ok: false, reason: `The client wrote back on ${pacificDay(i.lastInboundAt!)}, after your last email, so this lead is not quiet. Answer their message instead.` };
  }
  const days = Math.floor((i.now.getTime() - out) / DAY_MS);
  if (days < QUIET_DAYS) {
    const ready = new Date(out + QUIET_DAYS * DAY_MS).toISOString();
    return { ok: false, reason: `Your last email went out ${days === 0 ? "today" : days === 1 ? "1 day ago" : `${days} days ago`}. Re-engaging is available after 7 days, on ${pacificDay(ready)}.` };
  }
  return { ok: true };
}

type Ymd = { year: number; month: number; day: number };
const ymdIso = (d: Ymd) => `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
/** "2026-12-05" -> "Saturday, December 5". Empty for anything unreadable. */
export function formatIsoDay(iso: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  if (!m) return "";
  const at = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12));
  return at.toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", weekday: "long", month: "long", day: "numeric" });
}

export type ProposalCheck =
  | { ok: true; holdUntil: string; viewCount: number; sentOn: string }
  | { ok: false; reason: string };

/**
 * "Proposal check-in" needs a proposal that was actually sent. The hold is only
 * mentioned while it is still active (through today, Pacific time).
 */
export function proposalCheckinCheck(i: {
  proposal: { sent_at: string | null; hold_until: string | null } | null;
  viewCount: number;
  today: Ymd;
}): ProposalCheck {
  if (!i.proposal || !i.proposal.sent_at) {
    return { ok: false, reason: "No proposal has been sent to this client yet, so there is nothing to check in on. Send the proposal first." };
  }
  const hold = /^\d{4}-\d{2}-\d{2}/.test(i.proposal.hold_until || "") ? String(i.proposal.hold_until).slice(0, 10) : "";
  const active = !!hold && hold >= ymdIso(i.today);
  return { ok: true, holdUntil: active ? formatIsoDay(hold) : "", viewCount: Math.max(0, i.viewCount || 0), sentOn: pacificDay(i.proposal.sent_at) };
}

// ---------- Smart AI draft ----------

/** Strips form fields, prices, guest counts, emails and phone numbers before anything reaches the AI. */
export function redactForAi(text: string | null | undefined, max = 600): string {
  return freeMessage(text)
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[email removed]")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, "[phone removed]")
    .replace(/\$\s?\d[\d,.]*\s?k?|\b\d[\d,.]*\s?(?:k|dollars|usd)\b/gi, "[price removed]")
    .replace(/\b\d+\s*(?:to|-)?\s*\d*\s*(?:guests?|people|attendees|pax|persons)\b/gi, "[guest count removed]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export interface SmartDraftInput {
  firstName: string;
  stage: string | null;
  notes: string | null;
  activities: { type: string; title: string | null; body: string | null; occurred_at: string }[];
  proposal: { sentOn: string; holdUntil: string; viewCount: number } | null;
  inquiry: { name: string | null; eventType: string | null; location: string | null; message: string | null } | null;
}

export const SMART_DRAFT_ACTIVITY_TYPES = ["call", "note", "personal_reply", "email_out"];

/** The only facts the AI may use. Budget, guest count and how they found us never appear. */
export function smartDraftContext(i: SmartDraftInput): string {
  const lines: string[] = [];
  lines.push(`Client first name: ${clean(i.firstName) || "unknown"}`);
  if (clean(i.stage)) lines.push(`Deal stage: ${clean(i.stage)}`);
  if (i.inquiry) {
    const ev = eventPhrase(i.inquiry.eventType);
    const loc = locationPhrase(i.inquiry.location);
    if (ev) lines.push(`Event type from their inquiry: ${ev}`);
    if (loc) lines.push(`Location from their inquiry: ${loc}`);
    const msg = redactForAi(i.inquiry.message);
    if (msg) lines.push(`Their own words in the inquiry: ${msg}`);
  }
  const notes = redactForAi(i.notes);
  if (notes) lines.push(`Scott's notes on this client: ${notes}`);
  const acts = i.activities.filter((a) => SMART_DRAFT_ACTIVITY_TYPES.includes(a.type)).slice(0, 8);
  if (acts.length) {
    lines.push("Recent history, newest first:");
    for (const a of acts) {
      const what = [clean(a.title), redactForAi(a.body, 300)].filter(Boolean).join(". ");
      lines.push(`  ${pacificDay(a.occurred_at)}, ${a.type.replace(/_/g, " ")}: ${what || "(no details)"}`);
    }
  }
  if (i.proposal) {
    lines.push(`Proposal: sent on ${i.proposal.sentOn}. ${i.proposal.holdUntil ? `Their date is held through ${i.proposal.holdUntil}.` : "No date hold is active, so do not mention a hold."}`);
  } else {
    lines.push("Proposal: none sent yet. Do not mention a proposal.");
  }
  return lines.join("\n");
}

export const SMART_DRAFT_INSTRUCTIONS = [
  "You write a short personal email reply for Scott Syme, a Los Angeles magician, to a client who inquired about booking him.",
  "His voice is warm, gracious and hospitable, like a host welcoming a guest. Plain, simple sentences.",
  "Write ONLY the middle of the email: 2 to 4 sentences. No greeting line, no sign off, no signature. Those are added for you.",
  "Use only facts that appear in the context. Never invent venues, dates, times, numbers, prices, guest counts, names, availability or promises.",
  "Never mention prices, budgets, how they found him or guest counts. Never include links.",
  "Never use em dashes, en dashes or hyphens as punctuation. Never use the phrases \"just checking in\", \"thanks for reaching out\" or \"thank you so much for reaching out\". Never write a \"not this, but that\" sentence.",
  "Never say Scott performs while guests are eating. Do not scold the client for not replying or not opening anything.",
].join(" ");

export function smartDraftPrompt(context: string): string {
  return `Context about this client:\n${context}\n\nWrite the 2 to 4 middle sentences of Scott's reply now, picking up naturally from where things stand.`;
}

/** Puts Scott's fixed opening and ending around the AI's middle sentences. */
export function assembleSmartDraft(aiText: string, firstName: string): string {
  let mid = (aiText || "").replace(/\r\n/g, "\n").trim().replace(/^["']|["']$/g, "");
  mid = mid.replace(/^(?:hi|hello|dear)\b[^\n]{0,40},\s*\n+/i, "");
  mid = mid.replace(/\n+(?:best|warmly|talk soon|thanks|cheers)[^\n]{0,20},?\s*\n+\s*-?\s*scott\s*$/i, "");
  mid = mid.replace(/\s*please let me know if there is anything i can do for you\.?\s*$/i, "");
  mid = mid.replace(/[ \t]+/g, " ").replace(/\n{2,}/g, "\n\n").trim();
  return `${greet("Hi", clean(firstName))}\n\n${mid}\n\n${SMART_DRAFT_ENDING}`;
}

const MONTHS_DAYS = /\b(january|february|march|april|may|june|july|august|september|october|november|december|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi;

/** Every reason the AI draft is not safe to show. Empty array means it passed. */
export function smartDraftProblems(body: string, o: { firstName: string; context: string }): string[] {
  const out = [...replyBodyProblems(body), ...copyRuleProblems(body)];
  const first = clean(o.firstName);
  const lines = (body || "").split("\n");
  const opening = first ? [`Hi ${first},`, `Hello ${first},`] : ["Hi,", "Hello,"];
  if (!opening.includes(lines[0]?.trim() || "")) out.push(`The draft must open with "${opening[0]}".`);
  if (!(body || "").trimEnd().endsWith(SMART_DRAFT_ENDING)) out.push("The draft must end with the standard closing.");
  const mid = (body || "").split("\n").slice(1).join("\n").replace(SMART_DRAFT_ENDING, "").trim();
  const sentences = mid.split(/(?<=[.!?])\s+/).filter((x) => /\w/.test(x));
  if (sentences.length < 2 || sentences.length > 4) out.push("The draft must be 2 to 4 sentences.");
  const ctx = norm(o.context || "");
  for (const n of mid.match(/\d+/g) || []) if (!ctx.includes(n)) { out.push("The draft mentions a number that is not in the client record."); break; }
  for (const w of mid.match(MONTHS_DAYS) || []) if (!ctx.includes(w.toLowerCase())) { out.push("The draft mentions a date that is not in the client record."); break; }
  // Capitalised words in the middle of a sentence are names; each must come from the record.
  const allowed = new Set(["i", "scott", norm(first)]);
  for (const sentence of sentences) {
    const ws = sentence.match(/[A-Za-z\u00C0-\u024F'\u2019]+/g) || [];
    for (const w of ws.slice(1)) {
      if (!/^[A-Z\u00C0-\u00DE]/.test(w)) continue;
      const base = norm(w).replace(/['\u2019](?:s|d|ll|m|re|ve)$/, "");
      if (allowed.has(base) || ctx.includes(base)) continue;
      out.push(`The draft names "${w}", which is not in the client record.`);
      break;
    }
  }
  return Array.from(new Set(out));
}

export type DateCheck = { ok: true; iso: string; text: string } | { ok: false; reason: string };

/**
 * "Date is open" may only be offered for a readable, future date that has no
 * booked show already on it.
 */
export function dateOpenCheck(input: {
  date: { year: number; month: number; day: number } | null;
  today: { year: number; month: number; day: number };
  bookedOnDate: number;
  formatted: string;
}): DateCheck {
  const d = input.date;
  if (!d) return { ok: false, reason: "The event date could not be read. Set the event date on this deal first, then try again." };
  const iso = `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
  const t = input.today;
  const today = `${t.year}-${String(t.month).padStart(2, "0")}-${String(t.day).padStart(2, "0")}`;
  if (iso < today) return { ok: false, reason: `${input.formatted} has already passed.` };
  if (input.bookedOnDate > 0) return { ok: false, reason: `You already have a booked show on ${input.formatted}. Use "I'm booked that night" instead.` };
  return { ok: true, iso, text: input.formatted };
}

export interface AlertMessage { id: string; threadId: string; subject: string; replyTo: string; internalDate: number }

/** The Resend alert Scott received for this inquiry. Its subject is "Booking Inquiry: {name} ({event type})". */
export function pickAlertMessage(msgs: AlertMessage[], inq: { name: string | null; eventType: string | null; email: string }): AlertMessage | null {
  const expected = `Booking Inquiry: ${clean(inq.name)} (${clean(inq.eventType)})`.toLowerCase();
  const email = inq.email.toLowerCase().trim();
  const subj = (m: AlertMessage) => clean(m.subject).toLowerCase();
  const toClient = (m: AlertMessage) => !!email && m.replyTo.toLowerCase().includes(email);
  const byOldest = [...msgs].sort((a, b) => a.internalDate - b.internalDate);
  return byOldest.find((m) => subj(m) === expected && toClient(m))
    || byOldest.find((m) => subj(m).startsWith("booking inquiry:") && toClient(m))
    || byOldest.find((m) => subj(m) === expected)
    || null;
}

export const replySubject = (subject: string) => `Re: ${clean(subject).replace(/^(?:re:\s*)+/i, "")}`;

export const DEFAULT_INSTAGRAM_URL = "https://www.instagram.com/whiterabbit.la";

/** Plain text copy of Scott's Gmail signature, used for the text part of the email. */
export function signatureText(instagramUrl: string = DEFAULT_INSTAGRAM_URL): string {
  return [
    "Scott Syme",
    "Magician",
    "White Rabbit LA",
    "Office Telephone: (424) 394-1850",
    "Mobile: (650) 678-9428",
    "Website: www.whiterabbitla.com",
    "Email: scott.syme@whiterabbitla.com",
    `Instagram: ${instagramUrl}`,
  ].join("\n");
}

/** The Instagram link inside his real Gmail signature, if it has one. */
export function instagramFromSignature(html: string): string {
  const m = (html || "").match(/https?:\/\/(?:www\.)?instagram\.com\/[^"'\s<>]+/i);
  return m ? m[0] : DEFAULT_INSTAGRAM_URL;
}
