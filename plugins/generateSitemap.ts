import { writeFileSync } from "fs";
import type { Plugin } from "vite";
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

function url(path: string, lastmod: string): string {
  return `  <url><loc>${BASE}${path}</loc><lastmod>${lastmod}</lastmod></url>`;
}

export function generateSitemap(): Plugin {
  return {
    name: "generate-sitemap",
    buildStart() {
      const TODAY = new Date().toISOString().slice(0, 10);

      const latestBlogDate = blogArticles.reduce(
        (latest, a) => (a.publishDate > latest ? a.publishDate : latest),
        blogArticles[0]?.publishDate ?? TODAY
      );

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
        "trade-show-magician",
        "rehearsal-dinner-magician",
        "halloween-party-magician",
        "christmas-party-magician",
        "premiere-red-carpet-magician",
        "dmc-entertainment",
        "resident-event-magician",
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
      for (const article of blogArticles) {
        lines.push(url(`/blog/${article.slug}`, article.publishDate));
      }

      lines.push("</urlset>");

      writeFileSync("public/sitemap.xml", lines.join("\n"));
      console.log(
        `[sitemap] Generated: ${seoPages.length} SEO + ${blogArticles.length} articles + ${serviceAreas.length} areas`
      );
    },
  };
}
