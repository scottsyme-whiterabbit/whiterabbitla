type StoredTier = { name: string; price: string };

/** Resolve the browser's identifier, never its price, against the stored proposal. */
export function resolveSelectedTier(tiers: unknown, submittedName: unknown):
  | { status: 200; tier: StoredTier }
  | { status: 400; error: string } {
  const tier = Array.isArray(tiers) && typeof submittedName === "string"
    ? tiers.find((candidate) => candidate && typeof candidate.name === "string"
      && candidate.name === submittedName && typeof candidate.price === "string")
    : undefined;
  if (!tier) return { status: 400, error: "The selected pricing tier was not found in this proposal. Please reload the proposal and select a listed tier." };
  return { status: 200, tier: { name: tier.name, price: tier.price } };
}