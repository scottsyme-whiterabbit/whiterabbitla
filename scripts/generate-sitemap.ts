/**
 * Generates sitemap.xml from actual app data sources — no hardcoded slugs.
 * Run: npx tsx scripts/generate-sitemap.ts
 */
import { writeFileSync } from "fs";
import { blogArticles } from "../src/data/blogArticles";
import { seoPages } from "../src/data/seoPages";
import { serviceAreas } from "../src/data/serviceAreas";

const BASE = "https://whiterabbitla.com";
const TODAY = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

// Valid /services/:slug keys (must match ServicePage.tsx servicePages record)
const validServiceSlugs = [
  "corporate-magician",
  "wedding-magician",
  "private-party-magician",
  "close-up-magician",
  "private-magic-show",
  "holiday-party-magician",
  "charity-gala-magician",
  "trade-show-magician",
  "golf-tournament-magician",
  "dmc-entertainment",
  "resident-event-magician",
];

// Find the most recent blog publish date for area pages fallback
const latestBlogDate = blogArticles.reduce(
  (latest, a) => (a.publishDate > latest ? a.publishDate : latest),
  blogArticles[0]?.publishDate ?? TODAY
);

function url(path: string, lastmod: string): string {
  return `  <url><loc>${BASE}${path}</loc><lastmod>${lastmod}</lastmod></url>`;
}

const lines: string[] = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  '  <!-- Core Pages -->',
  url("/", TODAY),
  url("/experience", TODAY),
  url("/about", TODAY),
  url("/reviews", TODAY),
  url("/contact", TODAY),
  url("/blog", TODAY),
  url("/areas", TODAY),
  url("/quiz", TODAY),
  url("/deck", TODAY),
  url("/services", TODAY),
  url("/planners", TODAY),
  url("/guide", TODAY),
  url("/refer", TODAY),
  url("/privacy", TODAY),
  url("/terms", TODAY),
  "",
  '  <!-- Dedicated Service Pages -->',
];

for (const slug of validServiceSlugs) {
  lines.push(url(`/services/${slug}`, TODAY));
}

lines.push("");
lines.push('  <!-- Service Area Pages -->');
for (const area of serviceAreas) {
  lines.push(url(`/areas/${area.slug}`, latestBlogDate));
}

const soft404Suffixes = [
  "rehearsal-dinner-magician",
  "halloween-party-magician",
  "christmas-party-magician",
  "premiere-red-carpet-magician",
  "red-carpet-magician",
  "dmc-entertainment",
  "resident-event-magician",
  "trade-show-magician",
  "holiday-party-magician",
  "charity-gala-magician",
  "golf-tournament-magician",
];

const filteredSeoPages = seoPages.filter(
  (page) => !soft404Suffixes.some((s) => page.slug.endsWith(s))
);

lines.push("");
lines.push('  <!-- SEO Landing Pages -->');
for (const page of filteredSeoPages) {
  lines.push(url(`/blog/${page.slug}`, TODAY));
}

lines.push("");
lines.push('  <!-- Editorial Blog Articles -->');
// Exclude blog articles tied to pruned city markets — de-risk pass keeps only kept-list cities.
const removedCityTokens = [
  "seattle","portland","denver","vail","telluride","park-city","jackson-hole","sun-valley","lake-tahoe",
  "napa-valley","sonoma","carmel","hillsborough","san-mateo","burlingame","atherton","palo-alto","woodside",
  "los-altos","menlo-park","saratoga","los-gatos","tiburon","mill-valley","austin","dallas","houston",
  "san-antonio","fort-worth","highland-park","river-oaks","nashville","atlanta","buckhead","charleston",
  "naples","coral-gables","jupiter","sarasota","nantucket","marthas-vineyard","greenwich","washington-dc",
  "philadelphia","short-hills","potomac","chicago","minneapolis","winnetka","paradise-valley",
];
for (const article of blogArticles) {
  if (removedCityTokens.some((t) => article.slug.startsWith(`${t}-`) || article.slug.includes(`-${t}-`) || article.slug.endsWith(`-${t}`))) continue;
  lines.push(url(`/blog/${article.slug}`, article.publishDate));
}


lines.push("</urlset>");

// Deduplicate URLs (some blog article slugs collide with programmatic SEO slugs)
const seen = new Set<string>();
const deduped = lines.filter((line) => {
  const m = line.match(/<loc>([^<]+)<\/loc>/);
  if (!m) return true;
  if (seen.has(m[1])) return false;
  seen.add(m[1]);
  return true;
});

writeFileSync("public/sitemap.xml", deduped.join("\n"));
console.log(
  `Sitemap generated: ${seen.size} unique URLs (${seoPages.length} SEO + ${blogArticles.length} articles + ${serviceAreas.length} areas + ${validServiceSlugs.length} services + core)`
);
