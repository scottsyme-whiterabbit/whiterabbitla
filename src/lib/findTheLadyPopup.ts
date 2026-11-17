/** Rules for when the site-wide Find the Lady pop-up may open. Pure, so they can be tested. */

export const LADY_CLAIM_KEY = "wr-find-the-lady-claim";
export const LADY_DISMISS_KEY = "wr-lady-popup-dismissed-at";

/** After a visitor closes the pop-up without claiming, it stays away this long. */
export const SNOOZE_DAYS = 30;
/** Share of the page a visitor must scroll before the pop-up opens. */
export const SCROLL_TRIGGER_PERCENT = 50;
/** Exit intent only counts after the visitor has been on the page this long. */
export const EXIT_ARM_DELAY_MS = 5000;

/** Pages with their own job (forms, booking, admin) where the pop-up never opens. */
export const EXCLUDED_PATHS = ["/contact", "/quiz", "/guide", "/admin", "/review", "/refer", "/unsubscribe"];

const DAY_MS = 24 * 60 * 60 * 1000;

export function isPopupPage(path: string): boolean {
  const p = path.replace(/\/+$/, "") || "/";
  return !EXCLUDED_PATHS.some((x) => p === x || p.startsWith(`${x}/`));
}

export function isSnoozed(dismissedAt: string | null, now: number): boolean {
  if (!dismissedAt) return false;
  const t = Date.parse(dismissedAt);
  if (Number.isNaN(t)) return false;
  return now - t < SNOOZE_DAYS * DAY_MS;
}

export function canShowLadyPopup(opts: { path: string; dismissedAt: string | null; hasClaim: boolean; now: number }): boolean {
  if (opts.hasClaim) return false;
  if (!isPopupPage(opts.path)) return false;
  return !isSnoozed(opts.dismissedAt, opts.now);
}

export function reachedScrollTrigger(scrollY: number, scrollHeight: number, viewportHeight: number): boolean {
  const scrollable = scrollHeight - viewportHeight;
  if (scrollable <= 0) return false;
  return (scrollY / scrollable) * 100 >= SCROLL_TRIGGER_PERCENT;
}
