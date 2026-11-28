import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { blogArticles } from "@/data/blogArticles";

const slug = "corporate-holiday-party-magician";
const article = blogArticles.find((a) => a.slug === slug)!;

describe("corporate holiday party article", () => {
  it("exists with approved metadata", () => {
    expect(article).toBeDefined();
    expect(article.publishDate).toBe("2026-11-28");
    expect(article.metaTitle).toBe("Corporate Holiday Party Ideas: Adding a Magician");
    expect(article.metaDescription.length).toBe(136);
  });
  it("has 5 FAQ paragraphs", () => {
    expect(article.content.filter((p) => /^<strong>(.+?\?)<\/strong>\s*(.+)/.test(p)).length).toBe(5);
  });
  it("has no dashes or aggregateRating", () => {
    const text = JSON.stringify(article);
    expect(text).not.toMatch(/[\u2014\u2013]/);
    expect(text).not.toContain("aggregateRating");
  });
  it("CTA links to /contact", () => {
    expect(article.content.join(" ")).toContain("<a href='/contact'>");
  });
  it("is in the sitemap once", () => {
    const xml = readFileSync("public/sitemap.xml", "utf8");
    expect(xml.split(`https://whiterabbitla.com/blog/${slug}<`).length - 1).toBe(1);
  });
  it.each([
    "best-entertainment-ideas-company-holiday-party",
    "why-event-planners-adding-magician-vendor-list",
    "what-happens-when-you-hire-white-rabbit-la",
  ])("%s links to the new article", (s) => {
    const a = blogArticles.find((x) => x.slug === s)!;
    expect(a.content.join(" ")).toContain(`/blog/${slug}'`);
  });
});
