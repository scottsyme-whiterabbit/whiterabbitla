import { describe, expect, it } from "vitest";
import { PRICING_TIER_SETS, pricingTiersForEventType, pricingTierSetForEventType, tiersHaveContent } from "@/data/pricingTierSets";
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
  it.each(["Wedding", "Corporate", "General"] as const)("uses the exact three-step %s ladder with only the premium tier recommended", set => {
    expect(PRICING_TIER_SETS[set].map(t => t.price)).toEqual(["$2,000", "$3,000", "From $5,000"]);
    expect(PRICING_TIER_SETS[set].map(t => Boolean(t.recommended))).toEqual([false, false, true]);
  });
  it("Wedding preset drops the lines replaced by the wedding standard lines", () => {
    expect(PRICING_TIER_SETS.Wedding.map(t => t.name)).toEqual(["The Cocktail Hour", "The Cocktail Hour and The Parlor", "The White Rabbit Wedding"]);
    const items = PRICING_TIER_SETS.Wedding.flatMap(t => t.items);
    expect(PRICING_TIER_SETS.Wedding.map(t => t.items.length)).toEqual([5, 4, 3]);
    expect(items.some(i => i.startsWith("Your choice of one") || i.includes("for the seated moment") || i.startsWith("A seated show at the rehearsal") || i.startsWith("A private speakeasy"))).toBe(false);
    expect(PRICING_TIER_SETS.Wedding[2].items).not.toContain("Up to 90 minutes of close-up magic during cocktail hour");
  });
  it("Corporate uses its event-adapted tier names", () => {
    expect(PRICING_TIER_SETS.Corporate.map(t => t.name)).toEqual(["The Cocktail Hour", "The Cocktail Hour and The Parlor", "The White Rabbit Evening"]);
  });
  it("General replaces the extra production tier with host-focused Cocktail Hour", () => {
    expect(PRICING_TIER_SETS.General.map(t => t.name)).toEqual(["The Cocktail Hour", "The Parlor", "The White Rabbit Evening"]);
    expect(PRICING_TIER_SETS.General[0].items).toContain("Pre-event call with the host");
  });
  it.each([["Wedding", "Wedding"], ["Corporate Event", "Corporate"], ["Private Event", "General"], ["Fundraiser", "Corporate"], ["Birthday", "General"], ["Holiday Party", "Corporate"], ["Other", "General"]] as const)("maps %s to %s", (event, set) => {
    expect(pricingTierSetForEventType(event)).toBe(set);
    expect(pricingTiersForEventType(event)).toEqual(PRICING_TIER_SETS[set]);
  });
  it("returns editable copies without changing future presets", () => {
    const tiers = pricingTiersForEventType("Wedding");
    tiers[0].price = "$1,200";
    tiers[0].name = "Custom";
    tiers[0].items.push("Custom detail");
    expect(pricingTiersForEventType("Wedding")[0].price).toBe("$2,000");
    expect(PRICING_TIER_SETS.Wedding[0].items).not.toContain("Custom detail");
  });
  it("recognizes populated tiers and handles null and empty arrays", () => {
    expect(tiersHaveContent(null)).toBe(false);
    expect(tiersHaveContent([])).toBe(false);
    expect(tiersHaveContent(PRICING_TIER_SETS.General)).toBe(true);
  });
});