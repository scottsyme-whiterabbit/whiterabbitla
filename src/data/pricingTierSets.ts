// Pre-built pricing tier sets for the admin proposal builder.
// Each set mirrors the tier shape used by PROPOSAL_TEMPLATES. Loading a set
// replaces the proposal's current tiers; every tier stays fully editable.
// href is always empty: tier links come from the proposal's Square invoice URL
// or are set by hand afterwards.
// Items always start empty: Scott adds description lines himself from the
// standard-lines dropdown in the editor.
import type { Tier } from "@/pages/ProposalTemplate";

export type PricingTierSetName = "Wedding" | "Corporate" | "General";

export const PRICING_TIER_SETS: Record<PricingTierSetName, Tier[]> = {
  Wedding: [
    {
      name: "The Cocktail Hour",
      price: "$2,000",
      cta: "Reserve The Cocktail Hour",
      href: "",
      tagline: "Every guest gets their own moment. Close-up magic, in their hands, as the evening begins.",
      items: [],
    },
    {
      name: "The Cocktail Hour and The Parlor",
      price: "$3,000",
      cta: "Reserve The Cocktail Hour and The Parlor",
      href: "",
      tagline: "Cocktail hour for every guest, plus one more moment you choose: the rehearsal dinner or a private speakeasy show.",
      items: [],
    },
    {
      name: "The White Rabbit Wedding",
      price: "From $5,000",
      recommended: true,
      cta: "Reserve The White Rabbit Wedding",
      href: "",
      tagline: "The whole weekend, hosted: the rehearsal dinner show, cocktail hour, and a private speakeasy for your inner circle.",
      items: [],
    },
  ],
  Corporate: [
    {
      name: "The Cocktail Hour",
      price: "$2,000",
      cta: "Reserve The Cocktail Hour",
      href: "",
      tagline: "Every guest gets their own moment. About ninety minutes of close-up magic, in their hands, while the room fills.",
      items: [],
    },
    {
      name: "The Cocktail Hour and The Parlor",
      price: "$3,000",
      cta: "Reserve The Cocktail Hour and The Parlor",
      href: "",
      tagline: "Strolling close-up for the whole room, then a seated show for the guests who matter most.",
      items: [],
    },
    {
      name: "The White Rabbit Evening",
      price: "From $5,000",
      recommended: true,
      cta: "Reserve The White Rabbit Evening",
      href: "",
      tagline: "The room is transformed before guests walk in, with a moment built for your honoree or brand and a keepsake to take home.",
      items: [],
    },
  ],
  General: [
    {
      name: "The Cocktail Hour",
      price: "$2,000",
      cta: "Reserve The Cocktail Hour",
      href: "",
      tagline: "Every guest gets their own moment. About ninety minutes of close-up magic, in their hands, as your evening begins.",
      items: [],
    },
    {
      name: "The Parlor",
      price: "$3,000",
      cta: "Reserve The Parlor",
      href: "",
      tagline: "An intimate seated show in your space, with music and light to set the mood. Close enough to see every move, and still impossible to explain.",
      items: [],
    },
    {
      name: "The White Rabbit Evening",
      price: "From $5,000",
      recommended: true,
      cta: "Reserve The White Rabbit Evening",
      href: "",
      tagline: "Your living room becomes a private theater. Emerald drapes, warm stage light, and a soundtrack greet your guests at the door.",
      items: [],
    },
  ],
};

// One mapping for buttons, event selectors, templates and preview defaults.
export function pricingTierSetForEventType(eventType: string): PricingTierSetName {
  const type = eventType.trim().toLowerCase();
  if (type === "wedding") return "Wedding";
  if (["corporate", "corporate event", "fundraiser", "holiday party"].includes(type)) return "Corporate";
  return "General";
}

export function pricingTiersForEventType(eventType: string): Tier[] {
  return PRICING_TIER_SETS[pricingTierSetForEventType(eventType)].map(tier => ({ ...tier, items: [...tier.items] }));
}

// True when at least one tier already carries anything worth keeping.
export const tiersHaveContent = (tiers: Tier[] | null | undefined): boolean =>
  (tiers || []).some(
    (t) =>
      (t.name || "").trim() !== "" ||
      (t.tagline || "").trim() !== "" ||
      (t.items || []).length > 0 ||
      (t.price || "").trim() !== "" ||
      (t.cta || "").trim() !== "Reserve"
  );
