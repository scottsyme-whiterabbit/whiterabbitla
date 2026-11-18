/** Pure helpers for the CRM Find the Lady tab. */

const QUARTER_RE = /^(\d{4}) Q([1-4])$/;

/** The current quarter and the ones before it, newest first: "2026 Q4", "2026 Q3", ... */
export function recentQuarters(current: string, count: number): string[] {
  const m = current.match(QUARTER_RE);
  if (!m) return [];
  let y = Number(m[1]);
  let q = Number(m[2]);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(`${y} Q${q}`);
    q -= 1;
    if (q === 0) { q = 4; y -= 1; }
  }
  return out;
}

/** A quarter can be drawn only once it is over. */
export function quarterEnded(quarter: string, current: string): boolean {
  const a = quarter.match(QUARTER_RE);
  const b = current.match(QUARTER_RE);
  if (!a || !b) return false;
  return Number(a[1]) * 4 + Number(a[2]) < Number(b[1]) * 4 + Number(b[2]);
}

/** Entries for a quarter: Queen finders plus free entries, one per email. */
export function drawablePoolSize(
  claims: { email: string; drawing_entry: boolean; drawing_quarter: string | null; status: string }[],
  alternates: { email: string; quarter: string }[],
  quarter: string,
): number {
  const seen = new Set<string>();
  for (const c of claims) if (c.drawing_entry && c.drawing_quarter === quarter && c.status !== "void") seen.add(c.email.trim().toLowerCase());
  for (const a of alternates) if (a.quarter === quarter) seen.add(a.email.trim().toLowerCase());
  return seen.size;
}
