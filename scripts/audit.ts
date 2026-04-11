import { seoPages } from "../src/data/seoPages.js";
import { blogArticles } from "../src/data/blogArticles.js";
import { serviceAreas } from "../src/data/serviceAreas.js";
import { readFileSync } from "fs";

const sitemap = readFileSync("public/sitemap.xml", "utf-8");
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
const BASE = "https://whiterabbitla.com";

const validRoutes = new Set<string>();
["/", "/experience", "/about", "/reviews", "/contact", "/blog", "/areas", "/quiz", "/deck"].forEach(p => validRoutes.add(BASE + p));
["corporate-magician", "wedding-magician", "private-party-magician", "close-up-magician", "private-magic-show"].forEach(s => validRoutes.add(`${BASE}/services/${s}`));
serviceAreas.forEach(a => validRoutes.add(`${BASE}/areas/${a.slug}`));
blogArticles.forEach(a => validRoutes.add(`${BASE}/blog/${a.slug}`));
seoPages.forEach(p => validRoutes.add(`${BASE}/blog/${p.slug}`));

const zombies = urls.filter(u => !validRoutes.has(u));
console.log(`Total sitemap URLs: ${urls.length}`);
console.log(`Zombie URLs: ${zombies.length}`);
zombies.forEach(z => console.log(`  ZOMBIE: ${z}`));

console.log("\n--- Reported zombie check ---");
console.log("dallas-resident in sitemap:", urls.some(u => u.includes("dallas-resident")));
console.log("napa-valley-resident in sitemap:", urls.some(u => u.includes("napa-valley-resident")));
console.log("dallas-resident in seoPages:", seoPages.some(p => p.slug === "dallas-resident-event-magician"));
console.log("napa-valley-resident in seoPages:", seoPages.some(p => p.slug === "napa-valley-resident-event-magician"));
