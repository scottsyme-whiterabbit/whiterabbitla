import type { Tier } from "@/pages/ProposalTemplate";

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