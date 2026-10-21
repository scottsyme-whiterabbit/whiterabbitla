// Display helpers for the admin email timeline.
export type SentEmail = {
  id: string; sent_at: string; recipient: string; subject: string | null; email_type: string;
  provider: string; status: string; block_reason: string | null; delivery_status: string | null;
  backfilled: boolean; approximate_time: boolean; source: string; possible_duplicate?: boolean;
};
export type ScheduledEmail = {
  type: string; label: string; planned_at: string; planned_date_pt: string; recipient: string;
  source: string; deal_id: string | null; contact_name: string | null; tentative?: boolean; note?: string; blocked_reason?: string | null;
};

const TYPE_LABELS: Record<string, string> = {
  two_weeks_out: "Two weeks to go", see_you_tomorrow: "See you tomorrow", invoice: "Invoice",
  deposit_receipt: "Deposit receipt", paid_in_full_receipt: "Paid in full receipt", payment_failed: "Payment failed",
  agreement_invoice: "Signing confirmation and invoice", agreement_copy: "Agreement copy",
  post_show_thank_you: "Thank you", post_show_referral: "Referral note", post_show_holiday: "Holiday note",
  proposal_sent: "Proposal sent", crm_gmail: "Gmail", instant_reply: "Inquiry instant reply",
  followup_1: "Inquiry follow-up 1", followup_2: "Inquiry follow-up 2",
};
export function emailTypeLabel(type: string): string {
  if (TYPE_LABELS[type]) return TYPE_LABELS[type];
  let m = type.match(/^balance_reminder_(\d+)d$/);
  if (m) return m[1] === "0" ? "Show day balance reminder" : `Balance reminder, ${m[1]} days out`;
  m = type.match(/^invoice_reminder_(\d)$/);
  if (m) return `Unpaid invoice reminder ${m[1]}`;
  m = type.match(/^proposal_followup_(\d)$/);
  if (m) return `Proposal follow-up ${m[1]}`;
  return type.replace(/_/g, " ");
}

/** Manual Gmail messages have no fixed type name, so their subject line is the title. */
export const isManualGmail = (e: Pick<SentEmail, "email_type" | "provider">) =>
  e.provider === "gmail" &&
  (e.email_type === "crm_gmail" || e.email_type.startsWith("gmail/") || e.email_type.startsWith("manual"));

/** Title of a sent row: subject for manual Gmail, otherwise the type label. */
export function sentTitle(e: SentEmail): string {
  const subject = (e.subject || "").trim();
  if (isManualGmail(e) && subject) return subject;
  return emailTypeLabel(e.email_type);
}

/** Status shown on a sent row: blocked and failed win over delivery events. */
export function sentStatus(e: Pick<SentEmail, "status" | "block_reason" | "delivery_status">): string {
  if (e.status === "blocked") return `Blocked: ${(e.block_reason || "send gate").replace(/_/g, " ")}`;
  if (e.status === "failed") return "Failed";
  return e.delivery_status ? e.delivery_status[0].toUpperCase() + e.delivery_status.slice(1) : "Sent";
}

export const fmtPacific = (iso: string, withTime = true) =>
  new Date(iso).toLocaleString("en-US", {
    timeZone: "America/Los_Angeles", weekday: "short", month: "short", day: "numeric", year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }) + (withTime ? " PT" : "");

export const sortSchedule = (rows: ScheduledEmail[], dir: "asc" | "desc") =>
  [...rows].sort((a, b) => (dir === "asc" ? 1 : -1) * a.planned_at.localeCompare(b.planned_at));
