import { describe, expect, it } from "vitest";
import { manualInvoiceFields, normalizeBookingPayment } from "../../supabase/functions/newsletter-admin/manual-booking";

const now = "2026-10-21T18:40:00Z";
describe("manual booking payments", () => {
  it("missing input logs only and creates no invoice", () => {
    const payment = normalizeBookingPayment(undefined, 500000);
    expect(payment).toEqual({ mode: "log_only", amount_paid: 0, method: "other", send_client_emails: false });
    expect(manualInvoiceFields(payment, 500000, now)).toBeNull();
  });
  it("paid defaults blank amount to full value in cents and pauses emails", () => {
    const invoice = manualInvoiceFields(normalizeBookingPayment({ mode: "paid", method: "venmo" }, 500000), 500000, now);
    expect(invoice).toMatchObject({ amount_paid_cents: 500000, total_cents: 500000, status: "paid", deposit_percent: 0, paid_in_full_at: now, environment: "live", external_note: "Logged manually", sent_at: now, client_emails_paused: true, payment_method: "venmo" });
  });
  it("paid respects an entered amount instead of assuming full collection", () => {
    expect(manualInvoiceFields(normalizeBookingPayment({ mode: "paid", amount_paid: 400000, method: "check" }, 500000), 500000, now)?.amount_paid_cents).toBe(400000);
  });
  it("deposit records entered cents, rounded percentage and timestamp", () => {
    expect(manualInvoiceFields(normalizeBookingPayment({ mode: "deposit", amount_paid: 166667, method: "cash" }, 500000), 500000, now)).toMatchObject({ status: "deposit_paid", amount_paid_cents: 166667, deposit_percent: 33, deposit_paid_at: now, paid_in_full_at: null });
  });
  it("unpaid records zero and a sent timestamp with emails off by default", () => {
    expect(manualInvoiceFields(normalizeBookingPayment({ mode: "unpaid", method: "zelle" }, 500000), 500000, now)).toMatchObject({ status: "open", amount_paid_cents: 0, sent_at: now, client_emails_paused: true });
  });
  it("only an explicit true enables scheduled client emails", () => {
    expect(manualInvoiceFields(normalizeBookingPayment({ mode: "deposit", amount_paid: 250000, method: "stripe", send_client_emails: true }, 500000), 500000, now)?.client_emails_paused).toBe(false);
    expect(normalizeBookingPayment({ mode: "log_only", send_client_emails: true }, 500000).send_client_emails).toBe(false);
  });
  it.each([0, -1, 500001, 1.5, null])("rejects invalid deposit cents %s", amount_paid => {
    expect(() => normalizeBookingPayment({ mode: "deposit", amount_paid, method: "other" }, 500000)).toThrow(/integer cents/);
  });
  it("rejects unsupported method, mode and nonboolean emails", () => {
    expect(() => normalizeBookingPayment({ mode: "paid", method: "external" }, 500000)).toThrow(/method/);
    expect(() => normalizeBookingPayment({ mode: "settled" }, 500000)).toThrow(/mode/);
    expect(() => normalizeBookingPayment({ mode: "paid", method: "cash", send_client_emails: "true" }, 500000)).toThrow(/on or off/);
  });
  it("requires positive integer total for an invoice but not log only", () => {
    expect(() => normalizeBookingPayment({ mode: "unpaid", method: "other" }, 0)).toThrow(/positive deal value/);
    expect(normalizeBookingPayment(undefined, 0).mode).toBe("log_only");
  });
});