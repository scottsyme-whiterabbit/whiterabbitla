import { describe, expect, it } from "vitest";
import { STANDARD_TIER_LINES, standardLinesForEventType, tierLinesForProposal } from "@/data/proposalAssets";
import { PRICING_TIER_SETS, pricingTiersForEventType } from "@/data/pricingTierSets";

describe("proposal standard line rules", () => {
  it.each(["Wedding", "Corporate Event", "Private Event", "Fundraiser", "Birthday", "Holiday Party"])("never preselects optional touches for new %s proposals", event => {
    const tiers = tierLinesForProposal(pricingTiersForEventType(event), event, true);
    const optional = STANDARD_TIER_LINES.filter(line => line.optional).map(line => line.text);
    expect(optional).toHaveLength(6);
    for (const tier of tiers) expect(tier.items.filter(item => optional.includes(item))).toEqual([]);
  });

  it.each(["Wedding", "Private Event", "Corporate Event"])("uses the three performance and production defaults for %s", event => {
    const tiers = tierLinesForProposal(pricingTiersForEventType(event), event, true);
    const groups = ["Setting: Close-up setup", "Setting: Parlor half build", "Setting: Full build"];
    expect(groups.map(group => STANDARD_TIER_LINES.filter(line => line.group === group).length)).toEqual([1, 5, 6]);
    tiers.forEach((tier, index) => {
      const expected = STANDARD_TIER_LINES.filter(line => groups.includes(line.group) && line.group === groups[index]).map(line => line.text);
      const other = STANDARD_TIER_LINES.filter(line => groups.includes(line.group) && !expected.includes(line.text)).map(line => line.text);
      expect(tier.items.filter(item => expected.includes(item))).toEqual(expected);
      expect(tier.items.filter(item => other.includes(item))).toEqual([]);
    });
    const performance = STANDARD_TIER_LINES.filter(line => line.group === "Close-up vs Parlor").map(line => line.text);
    expect(tiers.map(tier => tier.items.filter(item => performance.includes(item)))).toEqual([[performance[0]], [performance[1]], performance]);
    expect(tiers.map(tier => tier.items.some(item => item.startsWith("The Afterglow:")))).toEqual([false, false, true]);
    expect(tiers.map(tier => tier.items.filter(item => item.startsWith("Anywhere in Los Angeles County")).length)).toEqual([1, 1, 1]);
    expect(tiers.flatMap(tier => tier.items)).not.toContain("Travel and lodging beyond Los Angeles are included.");
  });

  it.each(["Corporate", "Corporate Event", "Fundraiser", "Holiday Party"])("allows corporate-only options and planning defaults for %s", event => {
    const restricted = standardLinesForEventType(event).filter(line => line.eventTypes);
    expect(restricted.map(line => line.eventTypes)).toEqual([["corporate"], ["corporate"]]);
    expect(tierLinesForProposal(pricingTiersForEventType(event), event, true).map(tier => tier.items.includes("A planning call with your planner and executive sponsor."))).toEqual([true, true, true]);
  });

  it("restricts wedding touches to weddings and excludes corporate planning", () => {
    expect(standardLinesForEventType("Wedding").filter(line => line.eventTypes).map(line => line.eventTypes)).toEqual([["wedding"]]);
    expect(standardLinesForEventType("Private Event").filter(line => line.eventTypes)).toEqual([]);
    expect(tierLinesForProposal(PRICING_TIER_SETS.Wedding, "Wedding", true).flatMap(tier => tier.items)).not.toContain("A planning call with your planner and executive sponsor.");
  });

  it("preserves all preset metadata and source items while returning editable new defaults", () => {
    const before = structuredClone(PRICING_TIER_SETS);
    const tiers = tierLinesForProposal(PRICING_TIER_SETS.Corporate, "Corporate Event", true);
    expect(tiers.map(({ items, ...metadata }) => metadata)).toEqual(before.Corporate.map(({ items, ...metadata }) => metadata));
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