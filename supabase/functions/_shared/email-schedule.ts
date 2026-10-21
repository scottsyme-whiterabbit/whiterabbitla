// Pure scheduling rules shared by the sending cron functions and the admin
// email schedule preview. No Deno, network or database access here, so the
// preview and the cron jobs make identical decisions from identical inputs.

export const DAY_MS = 864e5;
export const HOUR_MS = 36e5;

/** Daily run time (UTC hour) of the invoice, proposal follow-up and post-show jobs. */
export const DAILY_RUN_UTC_HOUR = 16;

export const hoursSince = (ts: string | null | undefined, now: number) =>
  ts ? (now - new Date(ts).getTime()) / HOUR_MS : Infinity;

export const daysSince = (ts: string | null | undefined, now: number) =>
  ts ? (now - new Date(ts).getTime()) / DAY_MS : 0;

/** Whole days until a YYYY-MM-DD date, measured to noon UTC of that date. */
export const daysUntil = (date: string | null | undefined, now: number) => {
  if (!date) return null;
  const d = new Date(`${date}T12:00:00Z`).getTime();
  if (!isFinite(d)) return null;
  return Math.ceil((d - now) / DAY_MS);
};

/** YYYY-MM-DD for `now + offsetDays` in Pacific time. */
export const pacificYmd = (now: number, offsetDays = 0) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(now + offsetDays * DAY_MS));

/** Thanksgiving (4th Thursday of November), Christmas Day, New Year's Day. */
export const isShiftHoliday = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  if (m === 12 && d === 25) return true;
  if (m === 1 && d === 1) return true;
  if (m === 11) {
    const firstDow = new Date(Date.UTC(y, 10, 1)).getUTCDay();
    const firstThu = 1 + ((4 - firstDow + 7) % 7);
    return d === firstThu + 21;
  }
  return false;
};

/* ------------------------------ invoices ------------------------------ */

export const MAX_INITIAL_REMINDERS = 4;
export const BALANCE_DAYS_OUT = [7, 2, 0];
export const MIN_HOURS_BETWEEN = 20;
export const ANTICIPATION_FAR = 1;
export const ANTICIPATION_NEAR = 2;

export type ScheduleInvoice = {
  id?: string;
  status: string;
  client_email: string | null;
  client_emails_paused?: boolean | null;
  event_date: string | null;
  pending_session_id?: string | null;
  sent_at?: string | null;
  initial_reminders_sent?: number | null;
  last_reminder_at?: string | null;
  balance_reminders_sent?: number | null;
  last_balance_reminder_at?: string | null;
  anticipation_sent?: number | null;
  last_anticipation_at?: string | null;
};

export type InvoiceDecision =
  | { kind: "initial"; n: number }
  | { kind: "anticipation"; bit: number; days: number }
  | { kind: "balance"; threshold: number; nextCount: number; days: number };

/**
 * Client emails the invoice-reminders run would send for one invoice right
 * now, in order. The run executes them in this order: a failed "initial"
 * stops that invoice; a failed "anticipation" still lets "balance" run.
 */
export function invoiceDecisions(inv: ScheduleInvoice, now: number, holidayTomorrow: boolean): InvoiceDecision[] {
  if (inv.client_emails_paused) return [];
  if (!inv.client_email) return [];
  const out: InvoiceDecision[] = [];

  if (inv.status === "open") {
    if (inv.pending_session_id) return [];
    const sent = inv.initial_reminders_sent || 0;
    if (sent >= MAX_INITIAL_REMINDERS) return [];
    const anchor = inv.last_reminder_at || inv.sent_at || null;
    if (hoursSince(anchor, now) < MIN_HOURS_BETWEEN) return [];
    return [{ kind: "initial", n: sent + 1 }];
  }

  if (inv.status === "deposit_paid" || inv.status === "paid") {
    const days = daysUntil(inv.event_date, now);
    if (days !== null && days >= 0 && hoursSince(inv.last_anticipation_at, now) >= MIN_HOURS_BETWEEN) {
      const sent = inv.anticipation_sent || 0;
      let bit = 0;
      const eff = holidayTomorrow ? days - 1 : days;
      if (!(sent & ANTICIPATION_FAR) && eff >= 8 && eff <= 14) bit = ANTICIPATION_FAR;
      else if (!(sent & ANTICIPATION_NEAR) && days <= 1) bit = ANTICIPATION_NEAR;
      if (bit) out.push({ kind: "anticipation", bit, days });
    }
  }

  if (inv.status === "deposit_paid") {
    const days = daysUntil(inv.event_date, now);
    if (days === null || days < 0) return out;
    const sentCount = inv.balance_reminders_sent || 0;
    if (sentCount >= BALANCE_DAYS_OUT.length) return out;
    const nextThreshold = BALANCE_DAYS_OUT[sentCount];
    const effDays = holidayTomorrow && nextThreshold > 0 ? days - 1 : days;
    if (effDays > nextThreshold) return out;
    if (hoursSince(inv.last_balance_reminder_at, now) < MIN_HOURS_BETWEEN) return out;
    out.push({ kind: "balance", threshold: nextThreshold, nextCount: sentCount + 1, days });
  }
  return out;
}

export type UpcomingEmail = {
  type: string;
  label: string;
  planned_at: string; // ISO
  planned_date_pt: string; // YYYY-MM-DD Pacific
  recipient: string;
  source: string;
  source_id?: string;
  tentative?: boolean;
  note?: string;
};

const runTimes = (now: number, horizonDays: number) => {
  const out: number[] = [];
  const start = new Date(now);
  const first = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate(), DAILY_RUN_UTC_HOUR);
  for (let i = 0; i <= horizonDays + 1; i++) {
    const t = first + i * DAY_MS;
    if (t > now && t <= now + horizonDays * DAY_MS) out.push(t);
  }
  return out;
};

const upcoming = (type: string, label: string, t: number, recipient: string, source: string, source_id?: string, extra: Partial<UpcomingEmail> = {}): UpcomingEmail => ({
  type, label, planned_at: new Date(t).toISOString(), planned_date_pt: pacificYmd(t), recipient, source, source_id, ...extra,
});

export function anticipationType(bit: number) {
  return bit === ANTICIPATION_FAR ? ["two_weeks_out", "Two weeks to go"] : ["see_you_tomorrow", "See you tomorrow"];
}

/** Replays future daily runs, assuming each send succeeds and nothing else changes. */
export function simulateInvoice(inv: ScheduleInvoice, now: number, horizonDays = 30): UpcomingEmail[] {
  const s: ScheduleInvoice = { ...inv };
  const out: UpcomingEmail[] = [];
  const to = (s.client_email || "").toLowerCase();
  for (const t of runTimes(now, horizonDays)) {
    const holidayTomorrow = isShiftHoliday(pacificYmd(t, 1));
    for (const d of invoiceDecisions(s, t, holidayTomorrow)) {
      const at = new Date(t).toISOString();
      if (d.kind === "initial") {
        out.push(upcoming(`invoice_reminder_${d.n}`, `Unpaid invoice reminder ${d.n} of ${MAX_INITIAL_REMINDERS}`, t, to, "invoice", s.id));
        s.initial_reminders_sent = d.n; s.last_reminder_at = at;
      } else if (d.kind === "anticipation") {
        const [type, label] = anticipationType(d.bit);
        out.push(upcoming(type, label, t, to, "invoice", s.id));
        s.anticipation_sent = (s.anticipation_sent || 0) | d.bit; s.last_anticipation_at = at;
      } else {
        out.push(upcoming(`balance_reminder_${d.threshold}d`, d.threshold === 0 ? "Show day balance reminder" : `Balance reminder, ${d.threshold} days out`, t, to, "invoice", s.id));
        s.balance_reminders_sent = d.nextCount; s.last_balance_reminder_at = at;
      }
    }
  }
  return out;
}

/* -------------------------- proposal follow-ups -------------------------- */

export const FOLLOWUP_OFFSETS = [2, 5, 7];

export type ScheduleProposal = {
  id?: string;
  recipient_email: string | null;
  sent_at: string | null;
  followup_step: number | null;
  last_followup_at: string | null;
  followup_paused?: boolean | null;
  hold_until: string | null;
  /** End of the Pacific event day in ms, or null when the date is unusable. */
  event_end_ms: number | null;
};

/**
 * Next follow-up step the proposal-followup run would send now, or null.
 * Signed, suppressed and recently viewed checks are applied by the caller.
 */
export function proposalFollowupDue(p: ScheduleProposal, now: number): 1 | 2 | 3 | null {
  if (!p.sent_at || !p.recipient_email || p.followup_paused) return null;
  if ((p.followup_step || 0) >= 3) return null;
  if (hoursSince(p.last_followup_at, now) < MIN_HOURS_BETWEEN) return null;
  if (p.event_end_ms !== null && p.event_end_ms < now) return null;
  const step = p.followup_step || 0;
  const offset = FOLLOWUP_OFFSETS[step];
  if (offset === undefined) return null;
  if (step === 2 && p.hold_until) {
    const today = new Date(now).toISOString().slice(0, 10);
    if (p.hold_until > today) return null;
  } else if (daysSince(p.sent_at, now) < offset - 0.25) return null;
  return (step + 1) as 1 | 2 | 3;
}

export function simulateProposal(p: ScheduleProposal, now: number, horizonDays = 30): UpcomingEmail[] {
  const s = { ...p };
  const out: UpcomingEmail[] = [];
  for (const t of runTimes(now, horizonDays)) {
    const next = proposalFollowupDue(s, t);
    if (!next) continue;
    out.push(upcoming(`proposal_followup_${next}`, `Proposal follow-up ${next} of 3`, t, (s.recipient_email || "").toLowerCase(), "proposal", s.id));
    s.followup_step = next; s.last_followup_at = new Date(t).toISOString();
  }
  return out;
}

/* ------------------------------ post-show ------------------------------ */

export const POST_SHOW_SCHEDULE = [1, 21];

export type SchedulePostShow = {
  id?: string;
  contact_email: string | null;
  stage: string;
  event_date: string | null;
  post_show_step: number | null;
  post_show_started_at: string | null;
  post_show_last_sent_at: string | null;
};

/** Whether the post-show run would send the current core step now. */
export function postShowDue(d: SchedulePostShow, now: number): boolean {
  const step = d.post_show_step || 0;
  if (step >= POST_SHOW_SCHEDULE.length) return false;
  const startedAt = d.post_show_started_at ? new Date(d.post_show_started_at).getTime() : now;
  const anchor = step === 0 ? startedAt : (d.post_show_last_sent_at ? new Date(d.post_show_last_sent_at).getTime() : startedAt);
  return (now - anchor) / DAY_MS >= POST_SHOW_SCHEDULE[step];
}

const POST_SHOW_TYPES = [["post_show_thank_you", "Thank you for having me"], ["post_show_referral", "Your evening still comes up"]];

/**
 * Completed deals: exact replay. Booked deals: tentative, assuming Scott marks
 * the show completed on the show day, so the first run after it starts the clock.
 */
export function simulatePostShow(d: SchedulePostShow, now: number, horizonDays = 30): UpcomingEmail[] {
  const to = (d.contact_email || "").toLowerCase();
  if (!to) return [];
  const s = { ...d };
  let tentative = false;
  let from = now;
  if (s.stage !== "completed") {
    if (s.stage !== "booked" || !s.event_date) return [];
    tentative = true;
    s.post_show_step = 0; s.post_show_started_at = null; s.post_show_last_sent_at = null;
    // Marked completed during the show day evening, Pacific.
    from = new Date(`${s.event_date}T23:00:00-08:00`).getTime();
    if (from < now) from = now;
  }
  const out: UpcomingEmail[] = [];
  for (const t of runTimes(from, horizonDays + Math.ceil((from - now) / DAY_MS))) {
    if (t > now + horizonDays * DAY_MS) break;
    const step = s.post_show_step || 0;
    if (step >= POST_SHOW_SCHEDULE.length) break;
    if (!s.post_show_started_at) { s.post_show_started_at = new Date(t).toISOString(); if (!postShowDue(s, t)) continue; }
    if (!postShowDue(s, t)) continue;
    const [type, label] = POST_SHOW_TYPES[step];
    out.push(upcoming(type, label, t, to, "post_show", s.id, tentative ? { tentative: true, note: "Once the show is marked completed" } : {}));
    s.post_show_step = step + 1; s.post_show_last_sent_at = new Date(t).toISOString();
  }
  return out;
}

/* ------------------------------ sent log ------------------------------ */

/** Email type from the send label and subject, for the admin timeline. */
export function classifyEmail(label: string, subject: string): string {
  const s = subject.toLowerCase();
  if (s === "two weeks to go") return "two_weeks_out";
  if (s === "see you tomorrow") return "see_you_tomorrow";
  if (s.startsWith("invoice for")) return "invoice";
  if (s.startsWith("paid in full")) return "paid_in_full_receipt";
  if (s.startsWith("deposit received")) return "deposit_receipt";
  if (s.includes("payment did not go through")) return "payment_failed";
  if (s.includes("agreement & reservation invoice")) return "agreement_invoice";
  if (s.startsWith("your white rabbit la agreement")) return "agreement_copy";
  if (s.startsWith("thank you for having me")) return "post_show_thank_you";
  if (s.includes("your evening still comes up")) return "post_show_referral";
  if (s.includes("your date is held through")) return "proposal_sent";
  if (label === "proposal-followup") return "proposal_followup";
  if (label === "invoice-email" && s.includes("balance")) return "balance_reminder";
  if (label === "invoice-email") return "invoice_reminder";
  return label || "other";
}

/** Same recipient, same type, within ten minutes: likely a duplicate send. */
export function markDuplicates<T extends { recipient: string; email_type: string; sent_at: string }>(rows: T[]): (T & { possible_duplicate: boolean })[] {
  const sorted = [...rows].sort((a, b) => a.sent_at.localeCompare(b.sent_at));
  return sorted.map((r, i) => {
    const t = new Date(r.sent_at).getTime();
    const dup = sorted.some((o, j) => j !== i && o.recipient === r.recipient && o.email_type === r.email_type && Math.abs(new Date(o.sent_at).getTime() - t) < 10 * 60e3);
    return { ...r, possible_duplicate: dup };
  });
}
