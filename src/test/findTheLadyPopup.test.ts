import { describe, expect, it } from "vitest";
import { canShowLadyPopup, dealCards, planSwaps, applySwaps, quizPrefill, MIN_SWAPS, MAX_SWAPS, isPopupPage, isSnoozed, reachedScrollTrigger, showCornerTab, MOBILE_TIMER_MS } from "@/lib/findTheLadyPopup";

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
  it("deals five cards with exactly one Queen", () => {
    const cards = dealCards();
    expect(cards).toHaveLength(5);
    expect(cards.filter((c) => c === "queen")).toHaveLength(1);
    expect(new Set(cards).size).toBe(5);
  });

  it("places the Queen at random, so she can start in any of the five spots", () => {
    const spots = new Set<number>();
    for (let i = 0; i < 400; i++) spots.add(dealCards().indexOf("queen"));
    expect([...spots].sort()).toEqual([0, 1, 2, 3, 4]);
  });

  it("shuffles with 7 to 9 swaps, never the same pair twice in a row", () => {
    expect([MIN_SWAPS, MAX_SWAPS]).toEqual([7, 9]);
    const counts = new Set<number>();
    for (let i = 0; i < 300; i++) {
      const swaps = planSwaps();
      counts.add(swaps.length);
      for (let j = 0; j < swaps.length; j++) {
        const [a, b] = swaps[j];
        expect(a).not.toBe(b);
        expect(a >= 0 && a < 5 && b >= 0 && b < 5).toBe(true);
        if (j > 0) expect([a, b].sort().join()).not.toBe([...swaps[j - 1]].sort().join());
      }
    }
    expect([...counts].sort()).toEqual([7, 8, 9]);
  });

  it("keeps the Queen honest: following the swaps always finds her", () => {
    for (let i = 0; i < 200; i++) {
      const cards = dealCards();
      const swaps = planSwaps();
      let queenSlot = cards.indexOf("queen");
      for (const [a, b] of swaps) queenSlot = queenSlot === a ? b : queenSlot === b ? a : queenSlot;
      expect(applySwaps(cards, swaps)[queenSlot]).toBe("queen");
    }
  });
});

describe("Reserve my date", () => {
  it("fills the booking quiz occasion and timing and attaches the code", () => {
    expect(quizPrefill("wedding", "next_3_months", "LIGHTS-UP-0427")).toEqual({ eventType: "wedding", eventLabel: "Wedding", date: "Next 3 months", queenCode: "LIGHTS-UP-0427" });
    expect(quizPrefill("holiday_party", "this_month", "LIGHTS-UP-1111")).toMatchObject({ eventType: "private", date: "This month" });
    expect(quizPrefill("corporate", "still_deciding", "LIGHTS-UP-2222")).toMatchObject({ eventType: "corporate", eventLabel: "Corporate Event" });
  });
});
