/**
 * Generates sitemap.xml from actual app data sources — no hardcoded slugs.
 * Run: npx tsx scripts/generate-sitemap.ts
 */
import { writeFileSync } from "fs";
import { blogArticles } from "../src/data/blogArticles";
import { seoPages } from "../src/data/seoPages";
import { serviceAreas } from "../src/data/serviceAreas";
import { retiredCityPaths } from "../src/data/retiredCityRoutes";

const BASE = "https://whiterabbitla.com";

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

// lastmod only when the page has its own reliable date (article publishDate);
// otherwise omitted so reruns never stamp unchanged pages with today's date.
function url(path: string, lastmod?: string): string {
  if (!lastmod) return `  <url><loc>${BASE}${path}</loc></url>`;
  return `  <url><loc>${BASE}${path}</loc><lastmod>${lastmod}</lastmod></url>`;
}

const lines: string[] = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  '  <!-- Core Pages -->',
  url("/"),
  url("/experience"),
  url("/about"),
  url("/reviews"),
  url("/contact"),
  url("/blog"),
  url("/areas"),
  url("/quiz"),
  url("/deck"),
  url("/services"),
  url("/planners"),
  url("/guide"),
  url("/refer"),
  url("/privacy"),
  url("/terms"),
  "",
  '  <!-- Dedicated Service Pages -->',
];

for (const slug of validServiceSlugs) {
  lines.push(url(`/services/${slug}`));
}

lines.push("");
lines.push('  <!-- Service Area Pages -->');
for (const area of serviceAreas) {
  if (retiredCityPaths.has(`/areas/${area.slug}`)) continue;
  lines.push(url(`/areas/${area.slug}`));
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
  if (retiredCityPaths.has(`/blog/${page.slug}`)) continue;
  lines.push(url(`/blog/${page.slug}`));
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
  if (retiredCityPaths.has(`/blog/${article.slug}`)) continue;
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
