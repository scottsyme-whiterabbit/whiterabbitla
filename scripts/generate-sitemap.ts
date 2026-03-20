/**
 * Generates sitemap.xml from actual app data sources — no hardcoded slugs.
 * Run: npx tsx scripts/generate-sitemap.ts
 */
import { writeFileSync } from "fs";
import { blogArticles } from "../src/data/blogArticles";
import { seoPages } from "../src/data/seoPages";
import { serviceAreas } from "../src/data/serviceAreas";

const BASE = "https://whiterabbitla.com";

// Valid /services/:slug keys (must match ServicePage.tsx servicePages record)
const validServiceSlugs = [
  "corporate-magician",
  "wedding-magician",
  "private-party-magician",
  "close-up-magician",
  "private-magic-show",
];

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
  url("/areas", "monthly", "0.7"),
  url("/quiz", "monthly", "0.7"),
  url("/deck", "monthly", "0.6"),
  "",
  '  <!-- Dedicated Service Pages -->',
];

for (const slug of validServiceSlugs) {
  lines.push(url(`/services/${slug}`, "monthly", "0.9"));
}

lines.push("");
lines.push('  <!-- Service Area Pages -->');
for (const area of serviceAreas) {
  lines.push(url(`/areas/${area.slug}`, "monthly", "0.6"));
}

lines.push("");
lines.push('  <!-- SEO Landing Pages -->');
for (const page of seoPages) {
  lines.push(url(`/blog/${page.slug}`, "monthly", "0.7"));
}

lines.push("");
lines.push('  <!-- Editorial Blog Articles -->');
for (const article of blogArticles) {
  lines.push(url(`/blog/${article.slug}`, "monthly", "0.8"));
}

lines.push("</urlset>");

writeFileSync("public/sitemap.xml", lines.join("\n"));
console.log(
  `Sitemap generated: ${seoPages.length} SEO pages + ${blogArticles.length} articles + ${serviceAreas.length} area pages + ${validServiceSlugs.length} service pages + 9 core`
);
