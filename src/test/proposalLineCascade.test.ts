import { describe, expect, it } from "vitest";
import { addLineCascading } from "@/lib/proposalTiers";

const emptyTiers = (count = 3) => Array.from({ length: count }, (_, index) => ({ name: `Tier ${index + 1}`, price: "$3,000", items: [] as string[] }));

describe("proposal dropdown line cascade", () => {
  it("cascades tier 1 additions into every tier", () => {
    expect(addLineCascading(emptyTiers(), 0, "Planning").map(t => t.items)).toEqual([["Planning"], ["Planning"], ["Planning"]]);
  });
  it("cascades tier 2 additions only into tiers 2 and 3", () => {
    expect(addLineCascading(emptyTiers(), 1, "Planning").map(t => t.items)).toEqual([[], ["Planning"], ["Planning"]]);
  });
  it("adds tier 3 lines only to tier 3", () => {
    expect(addLineCascading(emptyTiers(), 2, "Planning").map(t => t.items)).toEqual([[], [], ["Planning"]]);
  });
  it("skips trimmed case-insensitive duplicates without stopping inheritance", () => {
    const tiers = [{ items: [" planning "] }, { items: ["PLANNING", "Extra"] }, { items: ["Extra"] }];
    expect(addLineCascading(tiers, 0, "Planning").map(t => t.items)).toEqual([[" planning "], ["PLANNING", "Extra"], ["Planning", "Extra"]]);
  });
  it("inserts after the last line shared with any lower tier and before extras", () => {
    const tiers = [{ items: ["First", "Second"] }, { items: [" first ", "SECOND", "Middle extra"] }, { items: ["First", "Second", "Middle extra", "Top extra"] }];
    expect(addLineCascading(tiers, 0, "New").map(t => t.items)).toEqual([
      ["First", "Second", "New"], [" first ", "SECOND", "New", "Middle extra"], ["First", "Second", "Middle extra", "New", "Top extra"],
    ]);
  });
  it("inserts at the start when there are no shared lines", () => {
    expect(addLineCascading([{ items: [] }, { items: ["Extra"] }], 0, "New").map(t => t.items)).toEqual([["New"], ["New", "Extra"]]);
  });
  it("keeps inherited arrays independent for tier-local removal", () => {
    const original = emptyTiers();
    const result = addLineCascading(original, 0, "Planning");
    // The editor's local removeItem update replaces only this tier's items.
    result[1] = { ...result[1], items: result[1].items.filter((_, index) => index !== 0) };
    expect(result.map(t => t.items)).toEqual([["Planning"], [], ["Planning"]]);
    expect(original).toEqual(emptyTiers());
    expect(result.map(t => t.price)).toEqual(["$3,000", "$3,000", "$3,000"]);
  });
  it("generalizes to more than three tiers", () => {
    expect(addLineCascading(emptyTiers(5), 1, "New").map(t => t.items)).toEqual([[], ["New"], ["New"], ["New"], ["New"]]);
  });
  it("ignores blank lines and invalid indexes", () => {
    const tiers = emptyTiers();
    for (const index of [-1, 3, 0.5]) expect(addLineCascading(tiers, index, "New")).toBe(tiers);
    expect(addLineCascading(tiers, 0, "  ")).toBe(tiers);
  });
});