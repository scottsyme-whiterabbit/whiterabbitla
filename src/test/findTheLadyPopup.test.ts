import { describe, expect, it } from "vitest";
import { canShowLadyPopup, isPopupPage, isSnoozed, reachedScrollTrigger } from "@/lib/findTheLadyPopup";

const NOW = Date.parse("2026-11-17T00:00:00Z");
const daysAgo = (d: number) => new Date(NOW - d * 86_400_000).toISOString();

describe("Find the Lady pop-up pages", () => {
  it("opens on public pages such as the homepage, blog posts and services", () => {
    for (const p of ["/", "/blog/best-magic-experiences-los-angeles", "/services/wedding-magician", "/areas/miami", "/reviews", "/about"]) {
      expect(isPopupPage(p)).toBe(true);
    }
  });
  it("never opens on contact, booking, review gate or admin pages", () => {
    for (const p of ["/contact", "/quiz", "/guide", "/admin/newsletter", "/review", "/review/", "/refer", "/unsubscribe"]) {
      expect(isPopupPage(p)).toBe(false);
    }
  });
});

describe("Find the Lady pop-up timing", () => {
  it("stays away for 30 days after it is closed", () => {
    expect(isSnoozed(daysAgo(29), NOW)).toBe(true);
    expect(isSnoozed(daysAgo(30), NOW)).toBe(false);
    expect(canShowLadyPopup({ path: "/", dismissedAt: daysAgo(10), hasClaim: false, now: NOW })).toBe(false);
    expect(canShowLadyPopup({ path: "/", dismissedAt: daysAgo(31), hasClaim: false, now: NOW })).toBe(true);
  });
  it("never opens again once the credit is claimed", () => {
    expect(canShowLadyPopup({ path: "/", dismissedAt: null, hasClaim: true, now: NOW })).toBe(false);
  });
  it("opens at half way down the page, not before", () => {
    // 3000px page, 1000px window: 2000px of scrolling, half is 1000px.
    expect(reachedScrollTrigger(999, 3000, 1000)).toBe(false);
    expect(reachedScrollTrigger(1000, 3000, 1000)).toBe(true);
    expect(reachedScrollTrigger(0, 800, 1000)).toBe(false);
  });
});
