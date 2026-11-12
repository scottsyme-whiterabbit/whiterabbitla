// Personal replies Scott writes on the original "Booking Inquiry" Gmail thread.
// Pure helpers only (no imports) so the browser, the edge function and tests
// all share the exact same templates and safety checks.

export type ReplyType = "voicemail" | "schedule_call" | "date_open" | "booked" | "proposal_followup";

export const REPLY_TYPES: { key: ReplyType; label: string }[] = [
  { key: "voicemail", label: "Left a voicemail" },
  { key: "schedule_call", label: "Ask to schedule a call" },
  { key: "date_open", label: "Date is open" },
  { key: "booked", label: "I'm booked that night" },
  { key: "proposal_followup", label: "Proposal follow-up" },
];

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
  }
}

/** Problems that block sending. Empty array means the body is safe to send. */
export function replyBodyProblems(body: string): string[] {
  const out: string[] = [];
  const b = body || "";
  if (!b.trim()) out.push("The message is empty.");
  if (/[—–]/.test(b)) out.push("Remove the long dash. Use a comma or a full stop instead.");
  if (/\$\s?\d|\b\d[\d,.]*\s?(?:k|dollars|usd)\b/i.test(b)) out.push("Remove the price. Personal replies never include pricing.");
  if (/office telephone|\(650\)\s*678-9428|email:\s*scott\.syme@/i.test(b)) out.push("Remove the signature from the message. It is added once, automatically, when you send.");
  if (/\{[^}]*\}|\[(?:first|event|location|date)\]/i.test(b)) out.push("Fill in or remove the blank in brackets.");
  return out;
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
