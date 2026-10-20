import { describe, expect, it, vi } from "vitest";
import { publicProposal, publicSignResponse } from "../../supabase/functions/proposals-api/public-response";
import { safeErrorPayload } from "../../supabase/functions/_shared/safe-error";

describe("public proposal response boundaries", () => {
  it("keeps displayed and signing fields but excludes internal proposal values", () => {
    const result = publicProposal({
      id: "proposal-1", slug: "public-slug", first_name: "Host", recipient_email: "host@party.test",
      hero_image: "private", special_terms: "Agreed terms", omit_photography: true,
      deal_id: "private-deal", followup_step: 2, notes: "Internal", recipient_phone: "Private",
      tiers: [{ name: "Evening", price: "$5,000", href: "", items: ["Show"], internal_value: 500000 }],
      reviews: [{ text: "Wonderful", name: "Guest", role: "Host", email: "private@party.test" }],
    });
    expect(result).toEqual({
      id: "proposal-1", slug: "public-slug", first_name: "Host", recipient_email: "host@party.test",
      hero_image: "private", special_terms: "Agreed terms", omit_photography: true,
      tiers: [{ name: "Evening", price: "$5,000", href: "", items: ["Show"] }],
      reviews: [{ text: "Wonderful", name: "Guest", role: "Host" }],
    });
  });
  it("returns only payment fields after signing, not the agreement or signer metadata", () => {
    expect(publicSignResponse({
      ok: true, agreement: { signer_ip: "private", deal_id: "private" },
      pay_token: "public-payment-token", total_cents: 500000, deposit_cents: 250000, pay_url: "/pay/token",
    })).toEqual({ pay_token: "public-payment-token", total_cents: 500000, deposit_cents: 250000, pay_url: "/pay/token" });
    expect(publicSignResponse({ ok: true, already_signed: true })).toEqual({});
  });
});

describe("safe infrastructure errors", () => {
  it("logs real details with a request ID but never returns them", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const error = new Error("relation signed_agreements does not exist: secret stack trace");
      expect(safeErrorPayload(error, "abcd1234")).toEqual({ error: "Something went wrong. Please try again.", request_id: "abcd1234" });
      expect(log).toHaveBeenCalledWith("[request abcd1234]", error);
    } finally {
      log.mockRestore();
    }
  });
});