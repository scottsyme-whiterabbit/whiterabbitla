import { describe, expect, it } from "vitest";
import { publicReservation } from "../../supabase/functions/proposals-api/public-response";

const agreement = {
  id: "a1", tier_name: "The Parlor", event_start_time: "19:30",
  client_email: "x@y.com", signer_ip: "1.2.3.4", agreement_text: "secret",
};

describe("publicReservation", () => {
  it("is null when the proposal has no signed agreement", () => {
    expect(publicReservation(null, [])).toBeNull();
  });

  it("returns exactly tier_name, start_time and deposit_paid", () => {
    const r = publicReservation(agreement, [{ status: "open", pay_token: "tok", total_cents: 300000 }]);
    expect(r).toEqual({ tier_name: "The Parlor", start_time: "19:30", deposit_paid: false });
    expect(Object.keys(r!).sort()).toEqual(["deposit_paid", "start_time", "tier_name"]);
  });

  it("is deposit paid for deposit_paid, paid, or a deposit date", () => {
    expect(publicReservation(agreement, [{ status: "deposit_paid" }])!.deposit_paid).toBe(true);
    expect(publicReservation(agreement, [{ status: "paid" }])!.deposit_paid).toBe(true);
    expect(publicReservation(agreement, [{ status: "open", deposit_paid_at: "2026-11-01T00:00:00Z" }])!.deposit_paid).toBe(true);
  });

  it("is not paid with no invoice, an open invoice, or only a void one", () => {
    expect(publicReservation(agreement, [])!.deposit_paid).toBe(false);
    expect(publicReservation(agreement, [{ status: "open" }])!.deposit_paid).toBe(false);
    expect(publicReservation(agreement, [{ status: "void", deposit_paid_at: "2026-11-01T00:00:00Z" }])!.deposit_paid).toBe(false);
  });

  it("has a null start time for older signings", () => {
    expect(publicReservation({ tier_name: "The Parlor", event_start_time: null }, [])!.start_time).toBeNull();
  });
});
