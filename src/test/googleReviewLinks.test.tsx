import { beforeAll, describe, expect, it } from "vitest";
import { act, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import GoogleReviewsBadge from "../components/GoogleReviewsBadge";

const GOOGLE_REVIEWS = "https://g.page/r/CXLCQWnGrGWrEAE";
const GOOGLE_LEAVE_REVIEW = "https://g.page/r/CXLCQWnGrGWrEAE/review";
const BROKEN_SHORT_LINK = "https://g.co/kgs/MbQh3xN";

const ROOT = resolve(process.cwd());
const read = (p: string) => readFileSync(resolve(ROOT, p), "utf8");

beforeAll(() => {
  (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

function renderBadge(): HTMLElement {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const el: ReactElement = <GoogleReviewsBadge variant="dark" />;
  act(() => root.render(<MemoryRouter>{el}</MemoryRouter>));
  return container;
}

describe("Google review links", () => {
  it("points the Google reviews badge at the working g.page address in a new tab", () => {
    const container = renderBadge();
    const a = container.querySelector<HTMLAnchorElement>('a[aria-label="5.0 stars on Google Reviews"]');
    expect(a).not.toBeNull();
    expect(a?.getAttribute("href")).toBe(GOOGLE_REVIEWS);
    expect(a?.getAttribute("target")).toBe("_blank");
    expect(a?.getAttribute("rel")).toContain("noopener");
    expect(a?.getAttribute("rel")).toContain("noreferrer");
  });

  it("links the hero proof line 5.0 on Google to the working g.page address in a new tab", () => {
    const hero = read("src/pages/Index.tsx");
    const anchor = hero.match(/<a href="([^"]+)"[^>]*>5\.0 on Google<\/a>/);
    expect(anchor).not.toBeNull();
    expect(anchor?.[1]).toBe(GOOGLE_REVIEWS);
    expect(anchor?.[0]).toContain('target="_blank"');
    expect(anchor?.[0]).toContain('rel="noopener noreferrer"');
  });

  it("links the hero proof line review count to the internal reviews page", () => {
    const hero = read("src/pages/Index.tsx");
    const link = hero.match(/<Link to="(\/[^"]*)"[^>]*>45\+ five-star reviews<\/Link>/);
    expect(link).not.toBeNull();
    expect(link?.[1]).toBe("/reviews");
    expect(hero).not.toContain('<a href="https://g.page/r/CXLCQWnGrGWrEAE" target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:text-cream hover:underline transition-colors">45+ five-star reviews</a>');
  });

  it("leaves the leave a review link untouched", () => {
    expect(read("src/pages/ReviewGate.tsx")).toContain(GOOGLE_LEAVE_REVIEW);
  });

  it("keeps the broken g.co short link out of the site source", () => {
    const files = [
      "src/pages/Index.tsx",
      "src/components/GoogleReviewsBadge.tsx",
      "src/pages/ReviewGate.tsx",
      "src/components/TestimonialCarousel.tsx",
      "src/pages/Contact.tsx",
      "index.html",
    ];
    for (const f of files) expect(`${f}:${read(f)}`).not.toContain(BROKEN_SHORT_LINK);
  });
});
