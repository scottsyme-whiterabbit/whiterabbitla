// This plugin generates static HTML share pages at build time
// for proper OG tag rendering in iMessage/WhatsApp link previews.

import { Plugin } from "vite";
import path from "path";
import fs from "fs";

const BASE_URL = "https://whiterabbitla.com";

const OG_IMAGES: Record<string, string> = {
  "Magic Destinations": `${BASE_URL}/og/magic-destinations.jpg`,
  "For Planners": `${BASE_URL}/og/corporate.jpg`,
  "Private Events": `${BASE_URL}/og/private.jpg`,
  "Corporate Events": `${BASE_URL}/og/corporate.jpg`,
  "Behind the Craft": `${BASE_URL}/og/behind-the-craft.jpg`,
};
const DEFAULT_OG = `${BASE_URL}/og-image.jpg`;

interface SharePage {
  slug: string;
  title: string;
  description: string;
  path: string;
  image: string;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function makeHtml(page: SharePage): string {
  const targetUrl = `${BASE_URL}${page.path}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:image" content="${esc(page.image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${esc(targetUrl)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="White Rabbit Los Angeles">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(page.title)}">
<meta name="twitter:description" content="${esc(page.description)}">
<meta name="twitter:image" content="${esc(page.image)}">
<meta http-equiv="refresh" content="0;url=${esc(targetUrl)}">
</head>
<body>
<p>Redirecting…</p>
<script>window.location.replace("${targetUrl}");</script>
</body>
</html>`;
}

export function generateSharePages(): Plugin {
  return {
    name: "generate-share-pages",
    writeBundle(options) {
      const outDir = options.dir || "dist";
      const shareDir = path.join(outDir, "share");
      if (!fs.existsSync(shareDir)) {
        fs.mkdirSync(shareDir, { recursive: true });
      }

      // We read the source data file to extract articles at build time
      const dataPath = path.resolve("src/data/blogArticles.ts");
      const content = fs.readFileSync(dataPath, "utf-8");

      // Extract articles using regex (simpler than compiling TS)
      const articles: SharePage[] = [];
      const slugRegex = /slug:\s*"([^"]+)"/g;
      const titleRegex = /metaTitle:\s*"([^"]+)"/g;
      const descRegex = /metaDescription:\s*"([^"]+)"/g;
      const catRegex = /category:\s*"([^"]+)"/g;

      const slugs = [...content.matchAll(slugRegex)].map((m) => m[1]);
      const titles = [...content.matchAll(titleRegex)].map((m) => m[1]);
      const descs = [...content.matchAll(descRegex)].map((m) => m[1]);
      const cats = [...content.matchAll(catRegex)].map((m) => m[1]);

      for (let i = 0; i < slugs.length; i++) {
        articles.push({
          slug: slugs[i],
          title: titles[i] || slugs[i],
          description: descs[i] || "",
          path: `/blog/${slugs[i]}`,
          image: OG_IMAGES[cats[i]] || DEFAULT_OG,
        });
      }

      // Static pages
      const staticPages: SharePage[] = [
        { slug: "home", title: "White Rabbit LA | Luxury Magic Entertainment", description: "Bespoke magical experiences for Fortune 500 events, private celebrations, and luxury gatherings across Los Angeles and beyond.", path: "/", image: DEFAULT_OG },
        { slug: "about", title: "About Scott Syme | White Rabbit Magic", description: "Meet Scott Syme, the magician behind White Rabbit. A Magic Castle® member who has performed for Netflix, Disney, and Morgan Stanley.", path: "/about", image: `${BASE_URL}/og/about.jpg` },
        { slug: "experience", title: "Our Services | White Rabbit Magic", description: "Explore luxury magic experiences: close-up magic, parlor shows, corporate entertainment, and private event performances.", path: "/experience", image: `${BASE_URL}/og/experience.jpg` },
        { slug: "reviews", title: "Client Reviews | White Rabbit Magic", description: "Read 50+ five-star reviews from corporate planners, brides, and private event hosts.", path: "/reviews", image: `${BASE_URL}/og/reviews.jpg` },
        { slug: "contact", title: "Contact & Booking | White Rabbit Magic", description: "Book Scott Syme for your next corporate event, wedding, or private celebration.", path: "/contact", image: `${BASE_URL}/og/contact.jpg` },
      ];

      const allPages = [...articles, ...staticPages];

      for (const page of allPages) {
        const html = makeHtml(page);
        const filePath = path.join(shareDir, `${page.slug}.html`);
        fs.writeFileSync(filePath, html, "utf-8");
      }

      console.log(`[share-pages] Generated ${allPages.length} share pages in /share/`);
    },
  };
}
