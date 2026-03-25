/**
 * Maps city slugs to 3 curated blog article slugs for the "Insights & Guides" section.
 * Each expanded city gets a unique rotation; "default" covers all other cities.
 */
export const cityArticleLinks: Record<string, [string, string, string]> = {
  chicago: [
    "corporate-entertainment-trends-2026",
    "why-cocktail-hour-entertainment-matters",
    "why-your-event-needs-mc-not-just-entertainment",
  ],
  miami: [
    "magic-spirits-tastings-cigar-nights",
    "planning-private-party-los-angeles",
    "surprise-clients-entertainment-they-didnt-know-they-wanted",
  ],
  "new-york": [
    "best-magic-shows-new-york",
    "how-to-choose-entertainment-for-luxury-event",
    "new-york-christmas-party-magician",
  ],
  "las-vegas": [
    "best-magic-shows-las-vegas",
    "casino-night-entertainment-magic",
    "las-vegas-corporate-event-magician",
  ],
  "san-francisco": [
    "best-magic-shows-san-francisco",
    "entertainment-gap-planners-dont-know",
    "how-to-vet-magician-high-end-event",
  ],
  dallas: [
    "golf-tournament-entertainment-ideas",
    "not-kids-birthday-party-modern-magic",
    "why-event-planners-adding-magician-vendor-list",
  ],
  houston: [
    "houston-corporate-event-magician",
    "corporate-entertainment-trends-2026",
    "wedding-entertainment-beyond-the-dj",
  ],
  atlanta: [
    "atlanta-corporate-event-magician",
    "why-cocktail-hour-entertainment-matters",
    "entertainment-gap-planners-dont-know",
  ],
  nashville: [
    "wedding-entertainment-beyond-the-dj",
    "surprise-clients-entertainment-they-didnt-know-they-wanted",
    "magic-spirits-tastings-cigar-nights",
  ],
  scottsdale: [
    "golf-tournament-entertainment-ideas",
    "how-to-choose-entertainment-for-luxury-event",
    "why-dmcs-adding-magician-incentive-trips",
  ],
  malibu: [
    "malibu-private-party-magician",
    "best-magic-experiences-los-angeles",
    "planning-private-party-los-angeles",
  ],
  "beverly-hills": [
    "red-carpet-entertainment-hollywood-premieres",
    "entertainment-for-wrap-parties-studio-events",
    "best-magic-experiences-los-angeles",
  ],
  default: [
    "why-event-planners-adding-magician-vendor-list",
    "how-to-choose-entertainment-for-luxury-event",
    "why-cocktail-hour-entertainment-matters",
  ],
};

export function getArticleSlugsForCity(citySlug: string): [string, string, string] {
  return cityArticleLinks[citySlug] ?? cityArticleLinks.default;
}
