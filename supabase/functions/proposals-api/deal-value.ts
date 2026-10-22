// Pure helpers for filling deals.deal_value (cents) from a proposal's tiers.
// Mirrors the database parse_price_cents rule: digits before any decimal point, dollars x 100.

export function priceTextToCents(p: unknown): number | null {
  if (typeof p !== "string") return null;
  const digits = p.split(".")[0].replace(/[^0-9]/g, "");
  if (!digits || digits.length > 7) return null;
  const cents = Number(digits) * 100;
  return cents > 0 ? cents : null;
}

/** Recommended tier price, else the first tier, in cents. */
export function proposalValueCents(tiers: unknown): number | null {
  if (!Array.isArray(tiers) || tiers.length === 0) return null;
  const rec = tiers.find((t) => t && typeof t === "object" && ((t as any).recommended === true || (t as any).recommended === "true"));
  return priceTextToCents(((rec ?? tiers[0]) as any)?.price);
}

/** Never overwrite a value Scott already set. */
export function shouldFillDealValue(current: number | null | undefined, proposed: number | null): boolean {
  return !!proposed && proposed > 0 && !(current && current > 0);
}
