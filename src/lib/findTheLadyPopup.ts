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

/** Pick a card: whatever is chosen is not the Queen; she is under one of the other two. */
export function dealFaces(picked: number, rand: () => number = Math.random): ("queen" | "spades" | "clubs")[] {
  const others = [0, 1, 2].filter((i) => i !== picked);
  const queenAt = others[rand() < 0.5 ? 0 : 1];
  const aces: ("spades" | "clubs")[] = rand() < 0.5 ? ["spades", "clubs"] : ["clubs", "spades"];
  const faces: ("queen" | "spades" | "clubs")[] = ["spades", "spades", "spades"];
  faces[queenAt] = "queen";
  faces[picked] = aces[0];
  faces[others.find((i) => i !== queenAt)!] = aces[1];
  return faces;
}
