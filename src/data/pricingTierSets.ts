// Pre-built pricing tier sets for the admin proposal builder.
// Each set mirrors the tier shape used by PROPOSAL_TEMPLATES. Loading a set
// replaces the proposal's current tiers; every tier stays fully editable.
// href is always empty: tier links come from the proposal's Square invoice URL
// or are set by hand afterwards.
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
      items: [
        "Up to 90 minutes of close-up magic during cocktail hour",
        "Pre-event call with the couple and/or planner",
        "Mind reading, mentalism, sleight of hand card magic, and magic with borrowed phones and rings",
        "Scott weaves through guests, performing up close for small groups",
        "Scott Syme in elegant evening attire, his signature green suit, or a tuxedo on request",
      ],
    },
    {
      name: "Choose Two",
      price: "$3,500",
      cta: "Reserve Choose Two",
      href: "",
      recommended: true,
      tagline: "Cocktail hour for every guest, plus one more moment you choose: the rehearsal dinner or a private speakeasy show.",
      items: [
        "Up to 90 minutes of close-up magic during cocktail hour",
        "Your choice of one: a seated show at the rehearsal dinner, or a private speakeasy show for the couple and inner circle during the reception",
        "Music and sound through a Bose S1 Pro+ speaker, and a Neewer key light, for the seated moment",
        "Full pre-event consultation with the couple and planner",
        "Mind reading, mentalism, sleight of hand card magic, and magic with borrowed phones and rings",
        "Scott Syme in elegant evening attire, his signature green suit, or a tuxedo on request",
      ],
    },
    {
      name: "The White Rabbit Wedding",
      price: "From $5,000",
      cta: "Reserve The White Rabbit Wedding",
      href: "",
      tagline: "The whole weekend, hosted: the rehearsal dinner show, cocktail hour, and a private speakeasy for your inner circle.",
      items: [
        "A seated show at the rehearsal dinner, with music and a warm key light",
        "Up to 90 minutes of close-up magic during cocktail hour",
        "A private speakeasy show for the couple and inner circle during the reception",
        "Full pre-event consultation with the couple and planner",
        "Mind reading, mentalism, sleight of hand card magic, and magic with borrowed phones and rings",
        "Scott Syme in elegant evening attire, his signature green suit, or a tuxedo on request",
      ],
    },
  ],
  Corporate: [
    {
      name: "The Cocktail Hour",
      price: "$2,000",
      cta: "Reserve The Cocktail Hour",
      href: "",
      tagline: "Every guest gets their own moment. About ninety minutes of close-up magic, in their hands, while the room fills.",
      items: [
        "About 90 minutes of strolling close-up magic during the reception",
        "Pre-event call with the host or planner",
        "Mind reading, mentalism, sleight of hand card magic, and magic with borrowed phones and rings",
        "Scott weaves through guests, performing up close for small groups",
        "Scott Syme in elegant evening attire, his signature green suit, or a tuxedo on request",
      ],
    },
    {
      name: "The Cocktail Hour and The Parlor",
      price: "$3,500",
      cta: "Reserve The Cocktail Hour and The Parlor",
      href: "",
      recommended: true,
      tagline: "Strolling close-up for the whole room, then a seated show for the guests who matter most.",
      items: [
        "About 90 minutes of strolling close-up magic for all guests",
        "A seated Parlor show for an inner circle chosen by the client",
        "Music and sound through a Bose S1 Pro+ speaker, and a Neewer key light",
        "Full pre-event consultation with the host or planner",
        "Mind reading, mentalism, sleight of hand card magic, and magic with borrowed phones and rings",
        "Scott Syme in elegant evening attire, his signature green suit, or a tuxedo on request",
      ],
    },
    {
      name: "The White Rabbit Evening",
      price: "From $5,000",
      cta: "Reserve The White Rabbit Evening",
      href: "",
      tagline: "The room is transformed before guests walk in, with a moment built for your honoree or brand and a keepsake to take home.",
      items: [
        "Full production build: emerald pipe-and-drape curtains (six velvet panels), Neewer stage lights and uplights, and a Bose S1 Pro+ soundtrack for arrival",
        "About 90 minutes of strolling close-up magic for all guests",
        "A seated show inside the full build",
        "A custom moment built for the honoree or brand, designed after a short pre-event interview",
        "A keepsake for guests to take home: a signed card, a sealed prediction, or a scroll wrapped in green ribbon",
        "A handwritten note to the host",
        "Full pre-event consultation with the host, planner and/or executive sponsor",
      ],
    },
  ],
  General: [
    {
      name: "The Parlor",
      price: "$3,000",
      cta: "Reserve The Parlor",
      href: "",
      tagline: "An intimate seated show in your space, with music and light to set the mood. Close enough to see every move, and still impossible to explain.",
      items: [
        "A seated Parlor show in your home",
        "The Afterglow: about 30 minutes of intimate close-up magic after the show, a few guests at a time",
        "Music and sound through a Bose S1 Pro+ speaker, and a Neewer key light",
        "Pre-event call with the host",
        "Mind reading, mentalism, sleight of hand card magic, and magic with borrowed phones and rings",
        "Scott Syme in elegant evening attire, his signature green suit, or a tuxedo on request",
      ],
    },
    {
      name: "The Parlor with Full Production",
      price: "$3,500",
      cta: "Reserve The Parlor with Full Production",
      href: "",
      recommended: true,
      tagline: "The Parlor, with your room transformed: emerald drapes, stage light, and a soundtrack that greets guests at the door.",
      items: [
        "Full production build: emerald pipe-and-drape curtains (six velvet panels), Neewer stage lights and uplights, and a Bose S1 Pro+ soundtrack for arrival",
        "A seated Parlor show inside the build",
        "The Afterglow: about 30 minutes of intimate close-up magic after the show, a few guests at a time",
        "Pre-event call with the host",
        "Mind reading, mentalism, sleight of hand card magic, and magic with borrowed phones and rings",
        "Scott Syme in elegant evening attire, his signature green suit, or a tuxedo on request",
      ],
    },
    {
      name: "The White Rabbit Evening",
      price: "From $5,000",
      cta: "Reserve The White Rabbit Evening",
      href: "",
      tagline: "Your living room becomes a private theater. Emerald drapes, warm stage light, and a soundtrack greet your guests at the door.",
      items: [
        "Full production build: emerald pipe-and-drape curtains (six velvet panels), Neewer stage lights and uplights, and a Bose S1 Pro+ soundtrack for arrival",
        "A seated show inside the build, with a custom moment for the honoree, designed after a short pre-event interview",
        "The Afterglow: about 30 minutes of intimate close-up magic after the show, a few guests at a time",
        "A keepsake for guests to take home: a signed card, a sealed prediction, or a scroll wrapped in green ribbon",
        "A handwritten note to the host",
        "Pre-event consultation with the host",
        "Scott Syme in elegant evening attire, his signature green suit, or a tuxedo on request",
      ],
    },
  ],
};

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
