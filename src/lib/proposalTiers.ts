import type { Tier } from "@/pages/ProposalTemplate";

/** Dropdown additions inherit upward without mutating tiers or their metadata. */
export function addLineCascading<T extends { items: string[] }>(tiers: T[], tierIndex: number, line: string): T[] {
  const key = (text: string) => text.trim().toLowerCase();
  if (!key(line) || !Number.isInteger(tierIndex) || tierIndex < 0 || tierIndex >= tiers.length) return tiers;

  const lowerLines = new Set<string>();
  return tiers.map((tier, index) => {
    let next = tier;
    if (index >= tierIndex && !tier.items.some(item => key(item) === key(line))) {
      let insertionIndex = tier.items.length;
      if (index > tierIndex) {
        insertionIndex = 0;
        tier.items.forEach((item, itemIndex) => {
          if (key(item) && lowerLines.has(key(item))) insertionIndex = itemIndex + 1;
        });
      }
      const items = [...tier.items];
      items.splice(insertionIndex, 0, line);
      next = { ...tier, items };
    }
    next.items.forEach(item => { if (key(item)) lowerLines.add(key(item)); });
    return next;
  });
}

/** Preserve intentionally empty tiers while making legacy null fields safe to edit/render. */
export const normalizeTiers = (value: unknown): Tier[] =>
  Array.isArray(value) ? value.filter((t): t is Record<string, unknown> => Boolean(t) && typeof t === "object").map(t => ({
    name: typeof t.name === "string" ? t.name : "",
    tagline: typeof t.tagline === "string" ? t.tagline : "",
    price: typeof t.price === "string" ? t.price : "",
    href: typeof t.href === "string" ? t.href : "",
    cta: typeof t.cta === "string" ? t.cta : "",
    recommended: t.recommended === true,
    items: Array.isArray(t.items) ? t.items.filter((item): item is string => typeof item === "string") : [],
  })) : [];