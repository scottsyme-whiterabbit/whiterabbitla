import { writeFileSync } from "fs";
import type { Plugin } from "vite";

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
  "Carmel-by-the-Sea", "Santa Barbara", "Pacific Palisades", "Brentwood",
  "Manhattan Beach", "Laguna Beach", "Downtown LA", "Studio City",
  "Encino", "Long Beach", "Burbank", "Westlake Village",
  "Thousand Oaks", "Rancho Palos Verdes", "Silver Lake", "Los Feliz",
  "Fort Worth", "San Antonio", "Charleston", "Minneapolis",
];

const serviceKeys = [
  "corporate-event-magician", "private-party-magician", "wedding-magician",
  "close-up-magician", "private-magic-show", "golf-tournament-magician",
  "charity-gala-magician", "holiday-party-magician", "trade-show-magician",
  "rehearsal-dinner-magician", "halloween-party-magician", "christmas-party-magician",
  "premiere-red-carpet-magician", "dmc-entertainment", "resident-event-magician",
];

const premiereLocations = new Set([
  "Los Angeles", "Beverly Hills", "Hollywood", "Santa Monica", "Malibu",
  "West Hollywood", "Bel Air", "Pasadena", "Calabasas", "Pacific Palisades",
  "Brentwood", "Manhattan Beach", "Downtown LA", "Studio City", "Burbank",
  "Long Beach", "Silver Lake", "Los Feliz",
]);

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

const serviceAreaCities = [
  "los-angeles", "beverly-hills", "hollywood", "santa-monica", "malibu",
  "west-hollywood", "calabasas", "pasadena", "orange-county", "san-diego",
  "palm-springs", "montecito", "newport-beach", "coronado", "santa-barbara",
  "pacific-palisades", "brentwood", "manhattan-beach", "encino", "downtown-la",
  "laguna-beach", "long-beach", "burbank", "studio-city", "westlake-village",
  "thousand-oaks", "rancho-palos-verdes", "silver-lake", "los-feliz",
  "bel-air",
  "san-francisco", "palo-alto", "atherton", "hillsborough", "san-mateo",
  "burlingame", "woodside", "los-altos", "menlo-park", "saratoga",
  "los-gatos", "tiburon", "mill-valley", "napa-valley", "sonoma",
  "carmel-by-the-sea", "seattle", "portland",
  "aspen", "vail", "park-city", "jackson-hole", "sun-valley",
  "lake-tahoe", "telluride", "scottsdale", "paradise-valley",
  "dallas", "highland-park", "houston", "river-oaks", "austin",
  "fort-worth", "san-antonio",
  "atlanta", "buckhead", "miami", "coral-gables", "palm-beach",
  "naples", "jupiter", "sarasota", "nashville", "charleston",
  "new-york", "the-hamptons", "greenwich", "nantucket", "marthas-vineyard",
  "short-hills", "boston", "washington-dc", "potomac", "philadelphia",
  "chicago", "winnetka", "denver", "las-vegas", "minneapolis",
];

function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function url(path: string, freq: string, priority: string): string {
  return `  <url><loc>${BASE}${path}</loc><changefreq>${freq}</changefreq><priority>${priority}</priority></url>`;
}

export function generateSitemap(): Plugin {
  return {
    name: "generate-sitemap",
    buildStart() {
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
        url("/areas", "monthly", "0.7"),
        url("/quiz", "monthly", "0.7"),
        url("/deck", "monthly", "0.6"),
        "",
        '  <!-- Dedicated Service Pages -->',
        url("/services/corporate-magician", "monthly", "0.9"),
        url("/services/wedding-magician", "monthly", "0.9"),
        url("/services/private-party-magician", "monthly", "0.9"),
        url("/services/close-up-magician", "monthly", "0.9"),
        url("/services/private-magic-show", "monthly", "0.9"),
        "",
        '  <!-- Service Area Pages -->',
      ];

      for (const city of serviceAreaCities) {
        lines.push(url(`/areas/${city}`, "monthly", "0.6"));
      }

      lines.push("");
      lines.push('  <!-- SEO Landing Pages -->');

      for (const loc of locations) {
        for (const key of serviceKeys) {
          if (key === "premiere-red-carpet-magician" && !premiereLocations.has(loc)) continue;
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
      console.log(`[sitemap] Generated sitemap.xml`);
    },
  };
}
