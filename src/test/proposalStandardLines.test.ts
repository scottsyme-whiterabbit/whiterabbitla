import { describe, expect, it } from "vitest";
import { STANDARD_TIER_LINES, standardLinesForEventType, tierLinesForProposal } from "@/data/proposalAssets";
import { PRICING_TIER_SETS, pricingTiersForEventType } from "@/data/pricingTierSets";

const ALL_EVENTS = ["Wedding", "Corporate Event", "Private Event", "Fundraiser", "Birthday", "Holiday Party", "Other"];

describe("proposal standard line rules", () => {
  it.each(ALL_EVENTS)("preselects no description lines for new %s proposals", event => {
    const tiers = tierLinesForProposal(pricingTiersForEventType(event), event, true);
    expect(tiers).toHaveLength(3);
    for (const tier of tiers) expect(tier.items).toEqual([]);
  });

  it("keeps the full grouped standard-line catalog available in the dropdown", () => {
    expect(STANDARD_TIER_LINES.length).toBeGreaterThan(30);
    const groups = new Set(STANDARD_TIER_LINES.map(line => line.group));
    for (const group of ["Planning", "The Magic", "Close-up vs Parlor", "Presentation", "Setting: Close-up setup", "Setting: Parlor half build", "Setting: Full build", "Travel", "Wedding", "Signature Touches"]) {
      expect(groups.has(group)).toBe(true);
    }
    expect(STANDARD_TIER_LINES.filter(line => line.optional)).toHaveLength(6);
    expect(STANDARD_TIER_LINES.map(entry => entry.text)).toContain("A certificate of insurance for your venue, on request.");
  });

  it("keeps event-type filtering in the dropdown", () => {
    expect(standardLinesForEventType("Wedding").filter(line => line.eventTypes).map(line => line.eventTypes)).toEqual(Array(5).fill(["wedding"]));
    for (const event of ["Corporate", "Corporate Event", "Fundraiser", "Holiday Party"]) {
      expect(standardLinesForEventType(event).filter(line => line.eventTypes).map(line => line.eventTypes)).toEqual([["corporate"], ["corporate"]]);
    }
    expect(standardLinesForEventType("Private Event").filter(line => line.eventTypes)).toEqual([]);
  });

  it("preserves all preset metadata while returning editable new defaults", () => {
    const before = structuredClone(PRICING_TIER_SETS);
    const tiers = tierLinesForProposal(PRICING_TIER_SETS.Corporate, "Corporate Event", true);
    expect(tiers).toEqual(before.Corporate);
    tiers[0].items.push("Custom editable detail");
    expect(PRICING_TIER_SETS).toEqual(before);
  });

  it("does not apply new defaults to saved proposals or mutate their items", () => {
    const saved = [{ name: "Custom", price: "$2,123", items: ["My existing custom line", "An existing keepsake promise"] }];
    const result = tierLinesForProposal(saved, "Corporate Event", false);
    expect(result).toEqual(saved);
    result[0].items.push("Editable");
    expect(saved[0].items).toEqual(["My existing custom line", "An existing keepsake promise"]);
  });
});
