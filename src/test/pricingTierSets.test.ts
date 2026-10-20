import { describe, expect, it } from "vitest";
import { PRICING_TIER_SETS, tiersHaveContent } from "@/data/pricingTierSets";
import { parsePriceToCents, depositCents } from "../../supabase/functions/_shared/invoice-email";
import { normalizeTiers } from "@/lib/proposalTiers";

describe("pricing tier sets", () => {
  it("handles null tier rows and item arrays without inventing tiers", () => {
    expect(normalizeTiers(null)).toEqual([]);
    expect(normalizeTiers([])).toEqual([]);
    expect(normalizeTiers([null, { name: "The Parlor", items: null }])).toEqual([{ name: "The Parlor", items: [], tagline: "", price: "", href: "", cta: "", recommended: false }]);
  });
  it.each(["Wedding", "Corporate", "General"] as const)("loads three editable %s tiers with no checkout links", set => {
    expect(PRICING_TIER_SETS[set]).toHaveLength(3);
    expect(PRICING_TIER_SETS[set].map(t => t.href)).toEqual(["", "", ""]);
  });
  it("recognizes populated tiers and handles null and empty arrays", () => {
    expect(tiersHaveContent(null)).toBe(false);
    expect(tiersHaveContent([])).toBe(false);
    expect(tiersHaveContent(PRICING_TIER_SETS.General)).toBe(true);
  });
  it("existing invoice parser resolves From $5,000 to 500000 cents", () => {
    expect(parsePriceToCents("From $5,000")).toBe(500000);
    expect(depositCents({ total_cents: 500000, deposit_percent: 50 } as Parameters<typeof depositCents>[0])).toBe(250000);
  });
});