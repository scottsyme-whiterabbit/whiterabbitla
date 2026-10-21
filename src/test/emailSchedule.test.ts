import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { invoiceDecisions, simulateInvoice, simulateProposal, simulatePostShow, isShiftHoliday, markDuplicates, classifyEmail, proposalFollowupDue } from "../../supabase/functions/_shared/email-schedule";
import { sentStatus } from "@/lib/emailTimeline";

const NOW = Date.parse("2026-10-21T20:00:00Z");
const inv = (o: any = {}) => ({ id: "i", status: "deposit_paid", client_email: "c@x.com", event_date: "2026-11-30", balance_reminders_sent: 0, anticipation_sent: 0, ...o });

describe("email schedule rules", () => {
  it("balance reminders fall 7, 2 and 0 days out with the Thanksgiving shift on the 7 day step", () => {
    const out = simulateInvoice(inv(), NOW, 60).filter(e => e.type.startsWith("balance"));
    // Nov 23 (7 out) would be after Thanksgiving Nov 26? 7 out of Nov 30 is Nov 23, no shift.
    expect(out.map(e => [e.type, e.planned_date_pt])).toEqual([["balance_reminder_7d", "2026-11-23"], ["balance_reminder_2d", "2026-11-28"], ["balance_reminder_0d", "2026-11-30"]]);
  });
  it("shifts a step one day early when it would land on a holiday", () => {
    expect(isShiftHoliday("2026-11-26")).toBe(true);
    const out = simulateInvoice(inv({ event_date: "2026-11-28" }), NOW, 60).filter(e => e.type === "balance_reminder_2d");
    expect(out[0].planned_date_pt).toBe("2026-11-25");
  });
  it("paused, paid-in-full and missing-email invoices get no balance reminders", () => {
    expect(simulateInvoice(inv({ client_emails_paused: true }), NOW)).toEqual([]);
    expect(simulateInvoice(inv({ status: "paid", event_date: "2026-11-03", anticipation_sent: 1 }), NOW).map(e => e.type)).toEqual(["see_you_tomorrow"]);
    expect(invoiceDecisions(inv({ client_email: null }), NOW, false)).toEqual([]);
  });
  it("two weeks out sends once in the 8 to 14 day window", () => {
    const out = simulateInvoice(inv({ status: "paid", event_date: "2026-11-15" }), NOW, 30);
    expect(out.map(e => [e.type, e.planned_date_pt])).toEqual([["two_weeks_out", "2026-11-01"], ["see_you_tomorrow", "2026-11-14"]]);
  });
  it("proposal follow ups go out on day 2, 5 and 7", () => {
    const out = simulateProposal({ recipient_email: "p@x.com", sent_at: "2026-10-21T17:00:00Z", followup_step: 0, last_followup_at: null, hold_until: null, event_end_ms: null }, NOW, 30);
    expect(out.map(e => e.planned_date_pt)).toEqual(["2026-10-23", "2026-10-26", "2026-10-28"]);
    expect(proposalFollowupDue({ recipient_email: "p@x.com", sent_at: "2026-10-01T00:00:00Z", followup_step: 0, last_followup_at: null, hold_until: null, event_end_ms: NOW - 1 }, NOW)).toBeNull();
  });
  it("post-show thank you and referral follow 1 and 21 days", () => {
    const out = simulatePostShow({ contact_email: "c@x.com", stage: "completed", event_date: "2026-10-20", post_show_step: 0, post_show_started_at: "2026-10-21T16:00:00Z", post_show_last_sent_at: null }, NOW, 40);
    expect(out.map(e => [e.type, e.planned_date_pt])).toEqual([["post_show_thank_you", "2026-10-22"], ["post_show_referral", "2026-11-12"]]);
  });
  it("flags two sends of the same email within ten minutes as a possible duplicate", () => {
    const rows = markDuplicates([{ recipient: "a", email_type: "two_weeks_out", sent_at: "2026-10-20T16:00:10.117Z" }, { recipient: "a", email_type: "two_weeks_out", sent_at: "2026-10-20T16:00:10.801Z" }]);
    expect(rows.every(r => r.possible_duplicate)).toBe(true);
  });
  it("classifies and shows blocked sends", () => {
    expect(classifyEmail("invoice-email", "Two weeks to go")).toBe("two_weeks_out");
    expect(sentStatus({ status: "blocked", block_reason: "suppressed", delivery_status: null })).toBe("Blocked: suppressed");
  });
  it("email logging never throws and the cron jobs use the shared rules", () => {
    const gate = readFileSync("supabase/functions/_shared/send-gate.ts", "utf8");
    const logFn = gate.slice(gate.indexOf("export async function logEmail"), gate.indexOf("export type GateResult"));
    expect(logFn).toMatch(/try \{[\s\S]*\} catch/);
    expect(readFileSync("supabase/functions/invoice-reminders/index.ts", "utf8")).toContain("invoiceDecisions(");
    expect(readFileSync("supabase/functions/proposal-followup/index.ts", "utf8")).toContain("proposalFollowupDue(");
    expect(readFileSync("supabase/functions/post-show-sequence/index.ts", "utf8")).toContain("postShowDue(");
    const tl = readFileSync("supabase/functions/newsletter-admin/email-timeline.ts", "utf8");
    expect(tl).not.toMatch(/gatedSend|gatedResendFetch|sendEmail|\.insert\(|\.update\(/);
  });
});
