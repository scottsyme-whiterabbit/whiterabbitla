import { describe, it, expect, vi } from "vitest";
vi.mock("../../supabase/functions/_shared/send-gate.ts", () => ({ gatedSend: vi.fn() }));
import {
  anticipationEmail, clockArrival, isCityOnlyVenue, twoWeeksLogisticsText,
} from "../../supabase/functions/_shared/invoice-email";

const inv = {
  id: "i", pay_token: "t", client_name: "Ana Lopez", client_email: "a@example.com",
  event_type: "wedding", event_date: "2026-12-12", venue: "Los Angeles, CA",
  tier_name: null, total_cents: 0, deposit_percent: 50, amount_paid_cents: 0, status: "paid",
};

describe("clock arrival", () => {
  it("formats real clock times", () => {
    expect(clockArrival("17:45:00")).toBe("5:45 PM");
    expect(clockArrival("09:05")).toBe("9:05 AM");
    expect(clockArrival("5:45 pm")).toBe("5:45 PM");
  });
  it("treats placeholders as unknown", () => {
    for (const v of ["", "TBA", "tbd", "30 minutes before show time", null]) expect(clockArrival(v)).toBeNull();
  });
});

describe("city only venues", () => {
  it("flags cities", () => {
    for (const v of ["", "Los Angeles", "Portland, OR", "Santa Monica, California", "TBD"]) expect(isCityOnlyVenue(v)).toBe(true);
  });
  it("keeps addresses and named venues", () => {
    for (const v of ["123 Main St, Portland, OR", "The Evergreen - Portland, OR", "Henry's Ocean View Dining", "Lucky Tiki West Hollywood", "Loews Coronado Bay Resort, Coronado, CA"]) expect(isCityOnlyVenue(v)).toBe(false);
  });
});

describe("two weeks to go body", () => {
  it("confirms everything when all known", () => {
    expect(twoWeeksLogisticsText({
      arrival_time: "17:45:00", on_site_contact_name: "Maria", on_site_contact_phone: "310-555-0100",
      venue_address: "123 Main St, Los Angeles", parking_access: "the loading dock on 2nd St",
    })).toBe("I'll plan to arrive at 5:45 PM. Maria will be my contact on site, and I have 310-555-0100 if I need to reach them. I'll head to 123 Main St, Los Angeles. For parking and load-in, I'll use the loading dock on 2nd St. Please reply only if anything has changed.");
  });
  it("address only asks for the rest", () => {
    expect(twoWeeksLogisticsText({ venue_address: "123 Main St, Los Angeles" })).toBe(
      "I'll head to 123 Main St, Los Angeles. Could you send me what time I should arrive, and who my contact on site will be that evening (name and phone)? Any notes on parking or load-in would also help.");
  });
  it("named venue only", () => {
    expect(twoWeeksLogisticsText({ venueName: "Henry's Ocean View Dining" })).toBe(
      "I'll head to Henry's Ocean View Dining. Could you send me what time I should arrive, who my contact on site will be that evening (name and phone), and any notes on parking or load-in?");
  });
  it("city only venue shows date alone and asks for everything", () => {
    const { subject, html } = anticipationEmail(inv, 13, { venueName: "Los Angeles, CA" });
    expect(subject).toBe("Two weeks to go");
    expect(html).toContain("Hi Ana,");
    expect(html).toContain("the full venue address");
    expect(html).not.toContain("Los Angeles, CA");
    expect(html).toContain("Please let me know if there is anything I can do for you.");
    expect((html.replace(/<!/g, "").match(/!/g) || []).length).toBe(1);
    expect(html).not.toMatch(/—|–/);
  });
});
