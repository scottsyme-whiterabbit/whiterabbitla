import { describe, expect, it } from "vitest";
import { resolveSelectedTier } from "../../supabase/functions/proposals-api/selected-tier";

describe("authoritative agreement tier", () => {
  const tiers = [{ name: "Private Evening", price: "From $5,000" }];
  it("uses the stored price when the browser submits a different price", () => {
    const submission = { tier_name: "Private Evening", tier_price: "$1" };
    const result = resolveSelectedTier(tiers, submission.tier_name);
    expect(result.status).toBe(200);
    if (result.status !== 200) throw new Error(result.error);
    expect(result.tier).toEqual({ name: "Private Evening", price: "From $5,000" });
    expect(result.tier.price).not.toBe(submission.tier_price);
  });
  it("rejects an unknown tier with HTTP 400", () => {
    const result = resolveSelectedTier(tiers, "Unknown tier");
    expect(result.status).toBe(400);
    if (result.status !== 400) throw new Error("Unknown tier was accepted");
    expect(result.error).toContain("not found in this proposal");
  });
});