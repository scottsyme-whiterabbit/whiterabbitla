import { describe, it, expect } from "vitest";
import { computeRevenueStats, dealsToAutoBook } from "../../supabase/functions/newsletter-admin/revenue-stats";
import { eventDateRangeError } from "../../supabase/functions/newsletter-admin/event-date-range";

const NOW = new Date("2026-10-21T18:00:00Z"); // Oct 21 2026 in LA
const deal = (o: Partial<any>) => ({ id: "x", contact_name: "C", stage: "new", event_date: null, deal_value: null, source: null, ...o });

describe("get_revenue_stats", () => {
  it("delivered uses net paid on invoices, ignoring void/canceled, minus refunds", () => {
    const s = computeRevenueStats(
      [deal({ id: "a", stage: "completed", event_date: "2026-05-10", deal_value: 500000 })],
      [
        { deal_id: "a", status: "paid", amount_paid_cents: 400000, refunded_cents: 50000 },
        { deal_id: "a", status: "void", amount_paid_cents: 500000 },
        { deal_id: "a", status: "canceled", amount_paid_cents: 500000 },
      ],
      [], NOW,
    );
    expect(s.delivered.cents).toBe(350000);
    expect(s.monthly[4].delivered).toBe(350000);
  });
  it("delivered falls back to deal_value when there is no live invoice", () => {
    const s = computeRevenueStats([deal({ id: "a", stage: "completed", event_date: "2026-03-01", deal_value: 200000 })], [], [], NOW);
    expect(s.delivered.cents).toBe(200000);
  });
  it("booked ahead is full value, with paid and remaining; total this year excludes next year", () => {
    const s = computeRevenueStats(
      [
        deal({ id: "b", stage: "booked", event_date: "2026-12-05", deal_value: 600000 }),
        deal({ id: "c", stage: "booked", event_date: "2027-02-01", deal_value: 300000 }),
        deal({ id: "d", stage: "completed", event_date: "2026-01-10", deal_value: 100000 }),
      ],
      [{ deal_id: "b", status: "deposit_paid", amount_paid_cents: 300000 }],
      [], NOW,
    );
    expect(s.bookedAhead.cents).toBe(600000);
    expect(s.bookedAhead.allYearsCents).toBe(900000);
    expect(s.bookedAhead.paidCents).toBe(300000);
    expect(s.bookedAhead.remainingCents).toBe(600000);
    expect(s.totalThisYear).toBe(700000);
  });
  it("Square Import with no value is history; with a value it counts", () => {
    const s = computeRevenueStats(
      [
        deal({ id: "s1", source: "Square Import", stage: "completed", event_date: "2026-02-01", deal_value: 0 }),
        deal({ id: "s2", source: "Square Import", stage: "completed", event_date: "2026-02-01", deal_value: 150000 }),
      ],
      [], [], NOW,
    );
    expect(s.squareHistoryCount).toBe(1);
    expect(s.delivered.cents).toBe(150000);
    expect(s.countedDeals).toBe(1);
  });
  it("flags each review reason", () => {
    const s = computeRevenueStats(
      [
        deal({ id: "1", stage: "proposal_sent", event_date: "2026-09-01" }),
        deal({ id: "2", stage: "on_hold", event_date: "2026-09-01" }),
        deal({ id: "3", stage: "booked", event_date: "2026-09-01" }),
        deal({ id: "4", stage: "on_hold", event_date: "2026-12-01" }),
      ],
      [], [{ deal_id: "4" }], NOW,
    );
    const reasons = s.flags.map(f => `${f.id}:${f.reason}`).sort();
    expect(reasons).toEqual(["1:event_passed_open", "2:on_hold_past", "3:booked_past", "4:paid_not_booked"]);
  });
  it("conversion is booked+completed over counted deals", () => {
    const s = computeRevenueStats([deal({ id: "a", stage: "booked" }), deal({ id: "b", stage: "lost" })], [], [], NOW);
    expect(s.conversionRate).toBe(0.5);
  });
});

describe("auto-book", () => {
  it("books open deals with a signed agreement or net paid, never on_hold or past-booked", () => {
    const ids = dealsToAutoBook(
      [deal({ id: "a", stage: "contacted" }), deal({ id: "b", stage: "negotiating" }), deal({ id: "c", stage: "on_hold" }), deal({ id: "d", stage: "new" })],
      [{ deal_id: "b", status: "paid", amount_paid_cents: 100 }, { deal_id: "d", status: "void", amount_paid_cents: 100 }],
      [{ deal_id: "a" }, { deal_id: "c" }],
    );
    expect(ids.sort()).toEqual(["a", "b"]);
  });
});

describe("event date range", () => {
  it("rejects dates before 2020 and more than 3 years out", () => {
    expect(eventDateRangeError("2019-12-31", NOW)).toMatch(/2020/);
    expect(eventDateRangeError("2029-10-22", NOW)).toMatch(/3 years/);
    expect(eventDateRangeError("2029-10-21", NOW)).toBeNull();
    expect(eventDateRangeError("2020-01-01", NOW)).toBeNull();
    expect(eventDateRangeError(null, NOW)).toBeNull();
  });
});
