/** Rules for when the site-wide Find the Queen pop-up may open. Pure, so they can be tested. */

export const QUEEN_CLAIMED_KEY = "wr-find-the-queen-claimed";
export const QUEEN_CLOSED_KEY = "wr-find-the-queen-closed-at";

/** After a visitor closes the pop-up without claiming, it stays away this long. */
export const SNOOZE_DAYS = 14;
/** Share of the page a visitor must scroll before the pop-up opens. */
export const SCROLL_TRIGGER_PERCENT = 50;
/** Exit intent (computers only) counts after the visitor has been on the page this long. */
export const EXIT_ARM_DELAY_MS = 5000;
/** Phones and tablets: open after this long on a page, if scrolling has not opened it first. */
export const MOBILE_TIMER_MS = 40000;

/** Pages with their own job (forms, booking, rules, admin) where the pop-up never opens. */
export const EXCLUDED_PATHS = ["/contact", "/quiz", "/guide", "/admin", "/review", "/refer", "/unsubscribe", "/official-rules"];

const DAY_MS = 24 * 60 * 60 * 1000;

export function isPopupPage(path: string): boolean {
  const p = path.replace(/\/+$/, "") || "/";
  return !EXCLUDED_PATHS.some((x) => p === x || p.startsWith(`${x}/`));
}

export function isSnoozed(closedAt: string | null, now: number): boolean {
  if (!closedAt) return false;
  const t = Date.parse(closedAt);
  if (Number.isNaN(t)) return false;
  return now - t < SNOOZE_DAYS * DAY_MS;
}

export function canShowLadyPopup(opts: { path: string; closedAt: string | null; claimed: boolean; now: number }): boolean {
  if (opts.claimed) return false;
  if (!isPopupPage(opts.path)) return false;
  return !isSnoozed(opts.closedAt, opts.now);
}

/** The small "Find the Queen" corner tab: shown once the pop-up was closed, until the credit is claimed. */
export function showCornerTab(opts: { path: string; closedAt: string | null; claimed: boolean; open: boolean }): boolean {
  return !opts.open && !opts.claimed && !!opts.closedAt && isPopupPage(opts.path);
}

export function reachedScrollTrigger(scrollY: number, scrollHeight: number, viewportHeight: number): boolean {
  const scrollable = scrollHeight - viewportHeight;
  if (scrollable <= 0) return false;
  return (scrollY / scrollable) * 100 >= SCROLL_TRIGGER_PERCENT;
}

// ── The five card game ──────────────────────────────────────────────────────
// Fair by design: the Queen is placed at random, every swap really moves the
// cards, and the card the guest taps shows its real face. Nothing steers the pick.

export type GameCard = "queen" | "spades" | "clubs" | "kingSpades" | "jackClubs";
export const GAME_CARDS: GameCard[] = ["queen", "spades", "clubs", "kingSpades", "jackClubs"];
export const SLOT_COUNT = 5;
export const MIN_SWAPS = 7;
export const MAX_SWAPS = 9;

/** Which card starts in each of the five slots; the Queen lands at random. */
export function dealCards(rand: () => number = Math.random): GameCard[] {
  const deck = [...GAME_CARDS];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/** Seven to nine swaps of two different slots, never the same pair twice in a row. */
export function planSwaps(rand: () => number = Math.random): [number, number][] {
  const count = MIN_SWAPS + Math.floor(rand() * (MAX_SWAPS - MIN_SWAPS + 1));
  const out: [number, number][] = [];
  let last = "";
  while (out.length < count) {
    const a = Math.floor(rand() * SLOT_COUNT);
    const b = (a + 1 + Math.floor(rand() * (SLOT_COUNT - 1))) % SLOT_COUNT;
    const key = [a, b].sort().join("");
    if (key === last) continue;
    last = key;
    out.push([a, b]);
  }
  return out;
}

/** Applies swaps to a slot layout (slot index to card) and returns the new layout. */
export function applySwaps<T>(layout: T[], swaps: [number, number][]): T[] {
  const next = [...layout];
  for (const [a, b] of swaps) [next[a], next[b]] = [next[b], next[a]];
  return next;
}

// ── After the game ──────────────────────────────────────────────────────────

export const OCCASION_OPTIONS = [
  { id: "wedding", label: "Wedding" },
  { id: "corporate", label: "Corporate event" },
  { id: "private_party", label: "Private party" },
  { id: "holiday_party", label: "Holiday party" },
  { id: "other", label: "Something else" },
] as const;
export type OccasionId = (typeof OCCASION_OPTIONS)[number]["id"];

export const TIMING_OPTIONS = [
  { id: "this_month", label: "This month" },
  { id: "next_3_months", label: "Next 3 months" },
  { id: "later_this_year", label: "Later this year" },
  { id: "still_deciding", label: "Still deciding" },
] as const;
export type TimingId = (typeof TIMING_OPTIONS)[number]["id"];

/** Booking quiz answers to fill in from the pop-up, with the code attached. */
export function quizPrefill(occasion: OccasionId, timing: TimingId, code: string) {
  const event: Record<OccasionId, { eventType: string; eventLabel: string }> = {
    wedding: { eventType: "wedding", eventLabel: "Wedding" },
    corporate: { eventType: "corporate", eventLabel: "Corporate Event" },
    private_party: { eventType: "private", eventLabel: "Private Party" },
    holiday_party: { eventType: "private", eventLabel: "Private Party" },
    other: { eventType: "other", eventLabel: "Something Else" },
  };
  const date = TIMING_OPTIONS.find((t) => t.id === timing)?.label ?? "";
  return { ...event[occasion], date, queenCode: code };
}
