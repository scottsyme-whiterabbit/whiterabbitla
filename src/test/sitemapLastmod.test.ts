import { describe, it, expect, vi, afterEach } from "vitest";
import { buildSitemapXml } from "../../plugins/generateSitemap";
import { blogArticles } from "@/data/blogArticles";

function entries(xml: string) {
  return [...xml.matchAll(/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?<\/url>/g)].map(
    (m) => ({ loc: m[1], lastmod: m[2] as string | undefined })
  );
}

describe("sitemap lastmod", () => {
  afterEach(() => vi.useRealTimers());

  it("does not stamp any page with the build date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2031-07-19T12:00:00Z"));
    const { xml } = buildSitemapXml();
    expect(xml).not.toContain("2031-07-19");
  });

  it("produces identical output on two builds on different days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-01T12:00:00Z"));
    const first = buildSitemapXml().xml;
    vi.setSystemTime(new Date("2030-03-15T12:00:00Z"));
    expect(buildSitemapXml().xml).toBe(first);
  });

  it("keeps each blog article's own publish date", () => {
    const list = entries(buildSitemapXml().xml);
    const article = blogArticles.find((a) => list.some((e) => e.loc.endsWith(`/blog/${a.slug}`)))!;
    const entry = list.find((e) => e.loc.endsWith(`/blog/${article.slug}`))!;
    expect(entry.lastmod).toBe(article.publishDate);
  });

  it("omits lastmod for pages without their own date", () => {
    const list = entries(buildSitemapXml().xml);
    for (const loc of [
      "https://whiterabbitla.com/",
      "https://whiterabbitla.com/reviews",
      "https://whiterabbitla.com/services/wedding-magician",
      "https://whiterabbitla.com/areas/boston",
    ]) {
      const e = list.find((x) => x.loc === loc);
      expect(e, loc).toBeDefined();
      expect(e!.lastmod, loc).toBeUndefined();
    }
  });
});
