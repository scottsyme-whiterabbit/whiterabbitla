// Pure opt-out matcher for inbound replies. A reply counts as an opt-out only
// when what the person actually typed (quoted text, forwards, signatures and
// legal footers removed) is short and is essentially an unsubscribe request.

export const MAX_OPT_OUT_WORDS = 15;

const CUT_LINE: RegExp[] = [
  /^>/,
  /^On\s.+wrote:\s*$/i,
  /^-{2,}\s*(Original|Forwarded)\s+Message/i,
  /^Begin forwarded message/i,
  /^(From|Sent|To|Subject|Date):\s/i,
  /^--\s*$/,
  /^_{5,}\s*$/,
  /^Sent from my\b/i,
  /^Get Outlook for\b/i,
  /^(CONFIDENTIALITY|CONFIDENTIAL|DISCLAIMER|NOTICE|PRIVILEGED)\b/i,
  /^This (e-?mail|message|communication)\b.*\b(confidential|intended|privileged)\b/i,
];

/** The part of the reply the sender wrote, before any quote/signature/footer. */
export function cleanReply(text: string): string {
  const lines = (text || "").replace(/\r\n?/g, "\n").split("\n");
  const kept: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (CUT_LINE.some((re) => re.test(line))) break;
    // "On Tue, Oct 21, 2026 at 9:00 AM Scott Syme <...>" wrapped onto two lines
    if (/^On\s/i.test(line) && /wrote:\s*$/i.test(`${line} ${(lines[i + 1] || "").trim()}`)) break;
    kept.push(line);
  }
  return kept.join(" ").replace(/\s+/g, " ").trim();
}

const OPT_OUT_PHRASES: { name: string; re: RegExp }[] = [
  { name: "UNSUBSCRIBE", re: /\bunsubscribe\b/ },
  { name: "REMOVE ME", re: /\bremove (me|my email|this email)\b/ },
  { name: "TAKE ME OFF", re: /\btake me off\b/ },
  { name: "OPT-OUT", re: /\bopt(ing)? ?out\b/ },
  { name: "DO NOT CONTACT", re: /\b(do not|dont) (contact|email|e mail|message) me\b/ },
  { name: "NO MORE EMAILS", re: /\bno more (emails|messages)\b/ },
  { name: "STOP", re: /\bstop (emailing|contacting|messaging|sending)\b/ },
  // A bare "stop", optionally with please/thanks, and nothing else.
  { name: "STOP", re: /^(please )?stop( please| thanks| thank you)?$/ },
];

/** Returns the matched pattern name, or null when the reply is not an opt-out. */
export function matchOptOut(text: string): string | null {
  const norm = cleanReply(text)
    .toLowerCase()
    .replace(/[\u2018\u2019']/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!norm) return null;
  if (norm.split(" ").length >= MAX_OPT_OUT_WORDS) return null;
  for (const p of OPT_OUT_PHRASES) if (p.re.test(norm)) return p.name;
  return null;
}
