/**
 * Generates sitemap.xml from seoPages data + static routes.
 * Run: npx tsx scripts/generate-sitemap.ts
 */
import { writeFileSync } from "fs";

const BASE = "https://whiterabbitla.com";

const locations = [
  "Los Angeles", "Beverly Hills", "Hollywood", "Santa Monica", "Malibu",
  "West Hollywood", "Bel Air", "Pasadena", "Orange County", "San Diego",
  "Las Vegas", "Calabasas", "Miami", "New York", "Austin", "Chicago",
  "Dallas", "San Francisco", "Scottsdale", "Nashville", "Aspen", "Houston",
  "Seattle", "Denver", "Atlanta", "Boston", "Washington DC", "Philadelphia",
  "Portland", "Napa Valley", "Palm Springs", "The Hamptons", "Greenwich",
  "Park City", "Hillsborough", "San Mateo", "Burlingame", "Atherton",
  "Palo Alto", "Woodside", "Los Altos", "Menlo Park", "Saratoga",
  "Los Gatos", "Tiburon", "Mill Valley", "Palm Beach", "Naples",
  "Montecito", "Newport Beach", "Coronado", "Nantucket", "Martha's Vineyard",
  "Jupiter", "Sarasota", "Vail", "Jackson Hole", "Sun Valley", "Lake Tahoe",
  "Telluride", "Coral Gables", "Highland Park", "River Oaks", "Buckhead",
  "Winnetka", "Short Hills", "Potomac", "Paradise Valley", "Sonoma",
  "Carmel-by-the-Sea", "Santa Barbara",
];

const serviceKeys = [
  "corporate-event-magician", "private-party-magician", "wedding-magician",
  "close-up-magician", "private-magic-show", "golf-tournament-magician",
  "charity-gala-magician", "holiday-party-magician", "trade-show-magician",
  "rehearsal-dinner-magician", "halloween-party-magician", "christmas-party-magician",
  "dmc-entertainment", "resident-event-magician",
];

const editorialArticles = [
  "why-event-planners-adding-magician-vendor-list",
  "not-kids-birthday-party-modern-magic",
  "entertainment-gap-planners-dont-know",
  "surprise-clients-entertainment-they-didnt-know-they-wanted",
  "how-to-vet-magician-high-end-event",
  "how-to-choose-entertainment-for-luxury-event",
  "why-cocktail-hour-entertainment-matters",
  "corporate-entertainment-trends-2026",
  "planning-private-party-los-angeles",
  "wedding-entertainment-beyond-the-dj",
  "best-magic-shows-las-vegas",
  "best-magic-shows-new-york",
  "best-magic-experiences-los-angeles",
  "best-magic-venues-america",
  "best-magic-shows-san-francisco",
  "magic-monday-studio-city",
  "golf-tournament-entertainment-ideas",
  "why-your-event-needs-mc-not-just-entertainment",
  "why-dmcs-adding-magician-incentive-trips",
  "why-resident-events-need-more-than-wine-and-cheese",
  "easiest-vendor-decision-property-manager",
  "how-one-magic-show-changed-resident-engagement",
  "resident-event-ideas-that-actually-get-rsvps",
];

function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function url(path: string, freq: string, priority: string): string {
  return `  <url><loc>${BASE}${path}</loc><changefreq>${freq}</changefreq><priority>${priority}</priority></url>`;
}

const lines: string[] = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  '  <!-- Core Pages -->',
  url("/", "weekly", "1.0"),
  url("/experience", "monthly", "0.9"),
  url("/about", "monthly", "0.8"),
  url("/reviews", "monthly", "0.8"),
  url("/contact", "monthly", "0.9"),
  url("/blog", "weekly", "0.8"),
  "",
  '  <!-- Dedicated Service Pages -->',
  url("/services/corporate-magician", "monthly", "0.9"),
  url("/services/wedding-magician", "monthly", "0.9"),
  url("/services/private-party-magician", "monthly", "0.9"),
  url("/services/close-up-magician", "monthly", "0.9"),
  url("/services/private-magic-show", "monthly", "0.9"),
  "",
  '  <!-- SEO Landing Pages -->',
];

for (const loc of locations) {
  for (const key of serviceKeys) {
    lines.push(url(`/blog/${slugify(loc)}-${key}`, "monthly", "0.7"));
  }
}

lines.push("");
lines.push('  <!-- Editorial Blog Articles -->');
for (const slug of editorialArticles) {
  lines.push(url(`/blog/${slug}`, "monthly", "0.8"));
}

lines.push("</urlset>");

writeFileSync("public/sitemap.xml", lines.join("\n"));
console.log(`Sitemap generated with ${lines.length} lines`);
