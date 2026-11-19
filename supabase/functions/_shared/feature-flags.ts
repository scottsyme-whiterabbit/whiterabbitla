// Site feature switches. This file is the one place to turn features on or off.
// Both the website and the backend functions read it, so a switch can never be
// on in one place and off in the other.

/**
 * Find the Queen pop-up (called Find the Lady in the CRM and Telegram).
 * false: the pop-up, its corner tab and every trigger (exit intent, scroll,
 * timer) are not mounted, /official-rules shows the normal 404 page,
 * /find-the-lady goes home, and find-the-lady-claim refuses every claim before
 * it reads the request, so no code, deal, welcome email or Telegram alert is
 * created. All components, tables and functions are kept for a later return.
 */
export const FIND_THE_QUEEN_ENABLED = false;

/** The refusal find-the-lady-claim sends while the feature is off, or null when on. */
export function findTheQueenClosed(enabled: boolean = FIND_THE_QUEEN_ENABLED): { status: number; body: { error: string; code: string } } | null {
  if (enabled) return null;
  return { status: 503, body: { error: "This offer is not available right now.", code: "find_the_queen_disabled" } };
}
