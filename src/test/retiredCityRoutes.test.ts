import { describe, expect, it } from "vitest";
import { retiredCityPaths, retiredCityRoutes } from "../data/retiredCityRoutes";
import { seoPages, getSeoPageBySlug } from "../data/seoPages";
import { serviceAreas, getAreasByRegion } from "../data/serviceAreas";
import { blogArticles, getBlogArticleBySlug } from "../data/blogArticles";

describe("approved exact city retirements", () => {
  it("contains 184 unique paths and no retired redirect destinations", () => {
    expect(retiredCityRoutes).toHaveLength(184);
    expect(retiredCityPaths.size).toBe(184);
    for (const route of retiredCityRoutes) expect(retiredCityPaths.has(route.to)).toBe(false);
  });

  it.each(retiredCityRoutes)("excludes $from from generated pages", ({ from }) => {
    const generatedPaths = [...seoPages.map((p) => `/blog/${p.slug}`), ...serviceAreas.map((a) => `/areas/${a.slug}`)];
    expect(generatedPaths).not.toContain(from);
  });

  it("keeps Las Vegas, Aspen and all Southern California areas", () => {
    expect(serviceAreas.map((a) => a.slug)).toEqual(expect.arrayContaining(["las-vegas", "aspen"]));
    expect(getAreasByRegion()["Southern California"]).toHaveLength(30);
    expect(Object.keys(getAreasByRegion())).toEqual(["Southern California", "Mountain & Resort"]);
  });

  it.each([
    "burbank-wedding-magician", "santa-barbara-wedding-magician",
    "palm-springs-private-party-magician", "the-hamptons-private-party-magician",
    "pasadena-close-up-magician", "san-francisco-private-magic-show",
    "west-hollywood-private-magic-show",
  ])("keeps approved service city page %s", (slug) => {
    expect(getSeoPageBySlug(slug)?.slug).toBe(slug);
    expect(retiredCityPaths.has(`/blog/${slug}`)).toBe(false);
  });

  it("uses exact paths, not city tokens, and retains editorial Las Vegas", () => {
    expect(retiredCityPaths.has("/blog/best-magic-shows-las-vegas")).toBe(false);
    expect(retiredCityPaths.has("/blog/las-vegas-corporate-event-magician")).toBe(false);
    expect(getSeoPageBySlug("las-vegas-corporate-event-magician")?.slug).toBe("las-vegas-corporate-event-magician");
    expect(getBlogArticleBySlug("best-magic-shows-las-vegas")?.slug).toBe("best-magic-shows-las-vegas");
    expect(blogArticles.filter((a) => retiredCityPaths.has(`/blog/${a.slug}`))).toHaveLength(0);
  });
});