import { describe, expect, it } from "vitest";
import { priceTextToCents, proposalValueCents, shouldFillDealValue } from "../../supabase/functions/proposals-api/deal-value";

describe("proposal deal value", () => {
  it("parses price text to cents", () => {
    expect(priceTextToCents("$2,500")).toBe(250000);
    expect(priceTextToCents("From $5,000")).toBe(500000);
    expect(priceTextToCents("$1,500.99")).toBe(150000);
    expect(priceTextToCents("")).toBeNull();
    expect(priceTextToCents("Call")).toBeNull();
  });
  it("uses recommended tier, else first", () => {
    expect(proposalValueCents([{ price: "$2,000" }, { price: "$3,000", recommended: true }])).toBe(300000);
    expect(proposalValueCents([{ price: "$2,000" }, { price: "$3,000" }])).toBe(200000);
    expect(proposalValueCents([])).toBeNull();
  });
  it("never overwrites a set value", () => {
    expect(shouldFillDealValue(150000, 300000)).toBe(false);
    expect(shouldFillDealValue(null, 300000)).toBe(true);
    expect(shouldFillDealValue(0, 300000)).toBe(true);
    expect(shouldFillDealValue(null, null)).toBe(false);
  });
});

describe("recommended stored as string", () => {
  it("picks the tier whose recommended is \"true\"", () => {
    expect(proposalValueCents([{ price: "$2,000" }, { price: "$3,500", recommended: "true" }])).toBe(350000);
  });
});
