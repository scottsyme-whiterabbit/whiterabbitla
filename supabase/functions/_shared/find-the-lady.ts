// Find the Queen booking credit (the pop-up game, formerly Find the Lady):
// pure rules plus the claim flow, with the database, the welcome email and the
// Telegram alert injected so the whole flow is testable.

export const QUEEN_SOURCE = "find-the-queen-popup";
export const CREDIT_CENTS = 50000;
/** Carried over from the approved Find the Lady terms until Scott says otherwise. */
export const MIN_PACKAGE_CENTS = 250000;
export const DRAWING_PRIZE_DOLLARS = 2500;
export const CODE_PREFIX = "WR500-";
/** No 0/O or 1/I, so a code read aloud on the phone cannot be misheard. */
export const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export const SITE = "https://whiterabbitla.com";

/** Today's date in Los Angeles as YYYY-MM-DD. */
export function pacificToday(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const v = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${v("year")}-${v("month")}-${v("day")}`;
}

/** Same calendar day twelve months later (Feb 29 becomes Feb 28). */
export function addTwelveMonths(isoDay: string): string {
  const [y, m, d] = isoDay.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y + 1, m, 0)).getUTCDate();
  const day = Math.min(d, lastDay);
  return `${y + 1}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Valid for 12 months from today, Los Angeles time. */
export function creditExpiry(now: Date): string {
  return addTwelveMonths(pacificToday(now));
}

/** The calendar quarter of the drawing, Los Angeles time, e.g. "2026 Q4". */
export function drawingQuarter(now: Date): string {
  const [y, m] = pacificToday(now).split("-").map(Number);
  return `${y} Q${Math.floor((m - 1) / 3) + 1}`;
}

export function generateCreditCode(randomBytes: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n))): string {
  const bytes = randomBytes(4);
  let out = "";
  for (let i = 0; i < 4; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return CODE_PREFIX + out;
}

export function isCreditCode(v: unknown): boolean {
  return typeof v === "string" && new RegExp(`^${CODE_PREFIX}[${CODE_ALPHABET}]{4}$`).test(v);
}

/** "November 16, 2027" for a YYYY-MM-DD day. */
export function formatDay(isoDay: string): string {
  const [y, m, d] = isoDay.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" });
}

export interface QueenClaim {
  firstName: string;
  email: string;
}

export type ClaimValidation = { ok: true; value: QueenClaim } | { ok: false; error: string } | { ok: false; bot: true };

const EMAIL_RE = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[a-z]{2,}$/i;

export function validateClaim(body: unknown): ClaimValidation {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  // Hidden field that people never see; anything in it means a script filled the form.
  if (typeof b.website === "string" && b.website.trim() !== "") return { ok: false, bot: true };

  const firstName = typeof b.firstName === "string" ? b.firstName.trim().replace(/\s+/g, " ") : "";
  if (!firstName) return { ok: false, error: "Please add your first name." };
  if (firstName.length > 60 || /[<>{}\\/@]|https?:/i.test(firstName)) return { ok: false, error: "Please use just your first name." };

  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  if (!email || email.length > 255 || !EMAIL_RE.test(email)) return { ok: false, error: "Please check your email address." };

  return { ok: true, value: { firstName, email } };
}

export interface StoredCredit {
  id: string;
  code: string;
  expires_on: string;
  deal_id: string | null;
}

export interface CreditRow {
  code: string;
  email: string;
  first_name: string;
  event_type: null;
  approx_event_date: null;
  found_queen: false;
  /** The form's fine print says the house will write now and then; submitting accepts it. */
  marketing_opt_in: true;
  credit_cents: number;
  min_package_cents: number;
  expires_on: string;
  source: typeof QUEEN_SOURCE;
  drawing_entry: true;
  drawing_quarter: string;
}

export interface QueenDealRow {
  contact_email: string;
  contact_name: string;
  event_type: null;
  event_date: null;
  stage: "new";
  source: typeof QUEEN_SOURCE;
  notes: string;
}

export interface ClaimStore {
  findActiveCredit(email: string): Promise<StoredCredit | null>;
  expireCredit(id: string): Promise<void>;
  insertCredit(row: CreditRow): Promise<{ status: "ok"; credit: StoredCredit } | { status: "duplicate_email" } | { status: "duplicate_code" }>;
  findOpenDeal(email: string): Promise<{ id: string } | null>;
  createDeal(row: QueenDealRow): Promise<{ id: string }>;
  attachDeal(creditId: string, dealId: string): Promise<void>;
  logActivity(dealId: string, title: string, body: string, metadata: Record<string, unknown>): Promise<void>;
}

export interface NewCredit {
  creditId: string;
  code: string;
  expiresOn: string;
  firstName: string;
  email: string;
  quarter: string;
  dealId: string | null;
}

export interface ClaimDeps {
  store: ClaimStore;
  now: Date;
  randomBytes?: (n: number) => Uint8Array;
  /** Starts the welcome email and the Telegram alert for a newly issued credit. Must not throw. */
  followUp: (credit: NewCredit) => unknown;
}

export interface ClaimResult {
  code: string;
  expiresOn: string;
  dealId: string | null;
  /** True when this email already held a credit and it was handed back. */
  existing: boolean;
}

export function dealNotes(code: string, expiresOn: string, quarter: string): string {
  return [
    `Find the Queen credit ${code}: $500 toward a White Rabbit show of $2,500 or more. Valid until ${formatDay(expiresOn)}.`,
    `Entered in the ${quarter} drawing for a complimentary show (valued at $2,500).`,
    "Came from the Find the Queen pop-up on the website.",
  ].join("\n");
}

/**
 * Claim flow. The credit row is written first, so a double submit or a second
 * visit with the same email returns the same code and never creates a second
 * lead, a second email or a second alert.
 */
export async function claimQueenCredit(claim: QueenClaim, deps: ClaimDeps): Promise<ClaimResult> {
  const { store, now } = deps;
  const today = pacificToday(now);

  const current = await store.findActiveCredit(claim.email);
  if (current && current.expires_on >= today) {
    return { code: current.code, expiresOn: current.expires_on, dealId: current.deal_id, existing: true };
  }
  if (current) await store.expireCredit(current.id);

  const expiresOn = creditExpiry(now);
  const quarter = drawingQuarter(now);
  let credit: StoredCredit | null = null;
  for (let attempt = 0; attempt < 6 && !credit; attempt++) {
    const res = await store.insertCredit({
      code: generateCreditCode(deps.randomBytes),
      email: claim.email,
      first_name: claim.firstName,
      event_type: null,
      approx_event_date: null,
      found_queen: false,
      marketing_opt_in: true,
      credit_cents: CREDIT_CENTS,
      min_package_cents: MIN_PACKAGE_CENTS,
      expires_on: expiresOn,
      source: QUEEN_SOURCE,
      drawing_entry: true,
      drawing_quarter: quarter,
    });
    if (res.status === "ok") credit = res.credit;
    else if (res.status === "duplicate_email") {
      // A second submit landed at the same moment: hand back the code it created.
      const raced = await store.findActiveCredit(claim.email);
      if (raced) return { code: raced.code, expiresOn: raced.expires_on, dealId: raced.deal_id, existing: true };
    }
  }
  if (!credit) throw new Error("Could not issue a unique credit code");

  const notes = dealNotes(credit.code, expiresOn, quarter);
  let dealId: string | null = null;
  try {
    const open = await store.findOpenDeal(claim.email);
    dealId = open ? open.id : (await store.createDeal({
      contact_email: claim.email,
      contact_name: claim.firstName,
      event_type: null,
      event_date: null,
      stage: "new",
      source: QUEEN_SOURCE,
      notes,
    })).id;
    await store.attachDeal(credit.id, dealId);
    await store.logActivity(dealId, `Find the Queen credit ${credit.code}`, notes, {
      source: QUEEN_SOURCE, code: credit.code, expires_on: expiresOn, drawing_entry: true,
      drawing_quarter: quarter, existing_deal: Boolean(open),
    });
  } catch (err) {
    // The credit is saved either way; the visitor still gets their code.
    console.error("Find the Queen lead step failed:", err instanceof Error ? err.message : err);
  }

  deps.followUp({ creditId: credit.id, code: credit.code, expiresOn, firstName: claim.firstName, email: claim.email, quarter, dealId });

  return { code: credit.code, expiresOn, dealId, existing: false };
}

// ── Welcome email ───────────────────────────────────────────────────────────

export interface WelcomeEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  unsubscribeUrl: string;
}

const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

export const WELCOME_SUBJECT = "Your $500 White Rabbit credit";
export const SIGNATURE = ["Scott Syme", "Magician", "(424) 394-1850", "whiterabbitla.com"];
export const MAILING_ADDRESS = "7393 W. Manchester Ave #209, Los Angeles, CA 90045";

export function welcomeParagraphs(c: Pick<NewCredit, "firstName" | "code" | "expiresOn">): string[] {
  return [
    `Hi ${c.firstName},`,
    "The Queen slipped away, but the house keeps its promises. Here is your credit.",
    `Your code: ${c.code}`,
    `It is worth $500 toward your next White Rabbit show and is good until ${formatDay(c.expiresOn)}.`,
    "When you are ready, reply to this email or plan a show at whiterabbitla.com/contact, and mention your code.",
    `You are also entered in this quarter's drawing for a complimentary White Rabbit show, valued at $${DRAWING_PRIZE_DOLLARS.toLocaleString("en-US")}. If your name is drawn, I will write to you at this address.`,
  ];
}

export function buildWelcomeEmail(c: Pick<NewCredit, "firstName" | "code" | "expiresOn" | "email">): WelcomeEmail {
  const unsubscribeUrl = `${SITE}/unsubscribe?email=${encodeURIComponent(c.email)}`;
  const paras = welcomeParagraphs(c);
  const footer = [
    `Credit terms: ${SITE}/official-rules#credit-terms`,
    `Official Rules: ${SITE}/official-rules`,
    `Unsubscribe: ${unsubscribeUrl}`,
    `White Rabbit LA, ${MAILING_ADDRESS}`,
  ];
  const text = [...paras, SIGNATURE.join("\n"), footer.join("\n")].join("\n\n");

  const p = (s: string) => `<p style="margin:0 0 18px;font-family:Georgia,serif;font-size:16px;line-height:1.65;color:#223D34;">${s}</p>`;
  const body = paras.map((s, i) => {
    if (i === 2) return `<p style="margin:0 0 18px;font-family:Georgia,serif;font-size:22px;letter-spacing:2px;color:#223D34;">${esc(c.code)}</p>`;
    if (i === 4) return p(`When you are ready, reply to this email or <a href="${SITE}/contact" style="color:#223D34;">plan a show</a>, and mention your code.`);
    return p(esc(s));
  }).join("");
  const sig = `<p style="margin:24px 0 0;font-family:Georgia,serif;font-size:15px;line-height:1.5;color:#223D34;">${SIGNATURE.slice(0, 3).map(esc).join("<br>")}<br><a href="${SITE}" style="color:#223D34;">whiterabbitla.com</a></p>`;
  const foot = `<p style="margin:32px 0 0;font-family:Arial,sans-serif;font-size:11px;line-height:1.6;color:#6b7a73;"><a href="${SITE}/official-rules#credit-terms" style="color:#6b7a73;">Credit terms</a> &middot; <a href="${SITE}/official-rules" style="color:#6b7a73;">Official Rules</a> &middot; <a href="${esc(unsubscribeUrl)}" style="color:#6b7a73;">Unsubscribe</a><br>White Rabbit LA, ${esc(MAILING_ADDRESS)}</p>`;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background:#F8F5F0;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F5F0;padding:32px 16px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;"><tr><td style="padding:8px 4px;">${body}${sig}${foot}</td></tr></table></td></tr></table></body></html>`;

  return { to: c.email, subject: WELCOME_SUBJECT, html, text, unsubscribeUrl };
}

export interface WelcomeStore {
  /** Atomically marks the credit's welcome email as sending; false if it was already claimed. */
  claimWelcome(creditId: string): Promise<boolean>;
  markWelcomeSent(creditId: string): Promise<void>;
  /** Rolls the claim back so a later retry can send it. */
  releaseWelcome(creditId: string): Promise<void>;
}

export type WelcomeStatus = "sent" | "already_sent" | `not_sent:${string}`;

/** Welcome email first (claimed, rolled back on failure), then the single Telegram alert. */
export async function welcomeThenAlert(
  credit: NewCredit,
  deps: {
    store: WelcomeStore;
    send: (email: WelcomeEmail) => Promise<{ sent: boolean; reason?: string }>;
    notify: (credit: NewCredit, welcome: WelcomeStatus) => Promise<unknown>;
  },
): Promise<WelcomeStatus> {
  let status: WelcomeStatus;
  try {
    if (!(await deps.store.claimWelcome(credit.creditId))) status = "already_sent";
    else {
      let result: { sent: boolean; reason?: string };
      try {
        result = await deps.send(buildWelcomeEmail(credit));
      } catch (err) {
        result = { sent: false, reason: err instanceof Error ? err.message : "send_exception" };
      }
      if (result.sent) {
        await deps.store.markWelcomeSent(credit.creditId);
        status = "sent";
      } else {
        await deps.store.releaseWelcome(credit.creditId);
        status = `not_sent:${result.reason || "unknown"}`;
      }
    }
  } catch (err) {
    status = `not_sent:${err instanceof Error ? err.message : "claim_failed"}`;
  }
  try {
    await deps.notify(credit, status);
  } catch { /* the alert never blocks anything */ }
  return status;
}
