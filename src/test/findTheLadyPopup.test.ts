import { describe, expect, it } from "vitest";
import { canShowLadyPopup, dealFaces, isPopupPage, isSnoozed, reachedScrollTrigger, showCornerTab, MOBILE_TIMER_MS } from "@/lib/findTheLadyPopup";

const NOW = Date.parse("2026-11-17T00:00:00Z");
const daysAgo = (d: number) => new Date(NOW - d * 86_400_000).toISOString();

describe("Find the Queen pop-up pages", () => {
  it("opens on public pages such as the homepage, blog posts and services", () => {
    for (const p of ["/", "/blog/best-magic-experiences-los-angeles", "/services/wedding-magician", "/areas/miami", "/reviews", "/about"]) {
      expect(isPopupPage(p)).toBe(true);
    }
  });
  it("never opens on contact, booking, rules, review gate or admin pages", () => {
    for (const p of ["/contact", "/quiz", "/guide", "/admin/newsletter", "/review", "/review/", "/refer", "/unsubscribe", "/official-rules"]) {
      expect(isPopupPage(p)).toBe(false);
    }
  });
});

describe("Find the Queen pop-up timing", () => {
  it("stays away for 14 days after it is closed", () => {
    expect(isSnoozed(daysAgo(13), NOW)).toBe(true);
    expect(isSnoozed(daysAgo(14), NOW)).toBe(false);
    expect(canShowLadyPopup({ path: "/", closedAt: daysAgo(10), claimed: false, now: NOW })).toBe(false);
    expect(canShowLadyPopup({ path: "/", closedAt: daysAgo(15), claimed: false, now: NOW })).toBe(true);
  });
  it("never opens again once someone submits", () => {
    expect(canShowLadyPopup({ path: "/", closedAt: null, claimed: true, now: NOW })).toBe(false);
  });
  it("opens at half way down the page, not before", () => {
    expect(reachedScrollTrigger(999, 3000, 1000)).toBe(false);
    expect(reachedScrollTrigger(1000, 3000, 1000)).toBe(true);
    expect(reachedScrollTrigger(0, 800, 1000)).toBe(false);
  });
  it("opens on phones after 40 seconds on a page", () => {
    expect(MOBILE_TIMER_MS).toBe(40000);
  });
});

describe("Find the Queen corner tab", () => {
  it("appears after closing, and disappears once the credit is claimed", () => {
    expect(showCornerTab({ path: "/", closedAt: null, claimed: false, open: false })).toBe(false);
    expect(showCornerTab({ path: "/", closedAt: daysAgo(1), claimed: false, open: false })).toBe(true);
    expect(showCornerTab({ path: "/", closedAt: daysAgo(1), claimed: false, open: true })).toBe(false);
    expect(showCornerTab({ path: "/", closedAt: daysAgo(1), claimed: true, open: false })).toBe(false);
    expect(showCornerTab({ path: "/contact", closedAt: daysAgo(1), claimed: false, open: false })).toBe(false);
  });
});

describe("Find the Queen cards", () => {
  it("the chosen card is never the Queen, and she is under one of the other two", () => {
    for (let picked = 0; picked < 3; picked++) {
      for (const r of [0, 0.3, 0.6, 0.99]) {
        const faces = dealFaces(picked, () => r);
        expect(faces[picked]).not.toBe("queen");
        expect(faces.filter((f) => f === "queen")).toHaveLength(1);
        expect(new Set(faces).size).toBe(3);
      }
    }
  });
});
