import { describe, it, expect } from "vitest";
import { isManualGmail, sentTitle, emailTypeLabel, type SentEmail } from "@/lib/emailTimeline";

const row = (o: Partial<SentEmail> = {}): SentEmail => ({
  id: "1", sent_at: "2026-10-20T16:00:00Z", recipient: "guest@x.com", subject: null,
  email_type: "crm_gmail", provider: "gmail", status: "sent", block_reason: null,
  delivery_status: null, backfilled: false, approximate_time: false, source: "live", ...o,
});

describe("sent row titles", () => {
  it("titles a manual Gmail send by its subject line", () => {
    const e = row({ subject: "Re: Veronica, just wanted to make sure this found you" });
    expect(isManualGmail(e)).toBe(true);
    expect(sentTitle(e)).toBe("Re: Veronica, just wanted to make sure this found you");
  });

  it("falls back to Gmail when a manual send has no subject", () => {
    expect(sentTitle(row({ subject: "   " }))).toBe("Gmail");
    expect(sentTitle(row({ subject: null }))).toBe("Gmail");
  });

  it("treats a gmail/manual type as a manual send", () => {
    expect(sentTitle(row({ email_type: "gmail/manual", subject: "Quick note" }))).toBe("Quick note");
  });

  it("keeps other types titled by their type label", () => {
    expect(sentTitle(row({ email_type: "two_weeks_out", provider: "resend", subject: "Two weeks to go" }))).toBe("Two weeks to go");
    expect(sentTitle(row({ email_type: "see_you_tomorrow", provider: "resend", subject: "See you tomorrow" }))).toBe("See you tomorrow");
    expect(sentTitle(row({ email_type: "post_show_thank_you", provider: "resend", subject: "Thank you for having me, Xanthe" }))).toBe("Thank you");
    expect(sentTitle(row({ email_type: "instant_reply", provider: "gmail", subject: "Your magic show question" }))).toBe("Inquiry instant reply");
    expect(sentTitle(row({ email_type: "crm_gmail", provider: "resend", subject: "Not gmail" }))).toBe(emailTypeLabel("crm_gmail"));
  });
});
