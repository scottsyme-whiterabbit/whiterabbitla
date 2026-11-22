// Package-aware calendar timing. Pure functions only, shared by the
// newsletter-admin calendar sync and by the vitest suite, so the rules the
// tests check are the rules that place events on the calendar.

export const SHOW_SETUP_MINUTES = 40;
export const WALKAROUND_SETUP_MINUTES = 20;
export const DEFAULT_BLOCK_MINUTES = 120;

export type PackageTimingTier = { name?: string; tagline?: string; items?: string[] };

export type PackageTiming = {
  kind: "show" | "walkaround";
  performanceMinutes: number | null;
  setupMinutes: number;
  source: "text" | "name" | "unknown";
};

// Lowercase, hyphens and dashes become spaces, whitespace collapsed.
// "forty-five-minute close-up" becomes "forty five minute close up".
const normalize = (s: unknown): string =>
  typeof s === "string"
    ? s.toLowerCase().replace(/[\u2010-\u2015-]/g, " ").replace(/\s+/g, " ").trim()
    : "";

const SHOW_RE =
  /\b(parlou?r|seated show|stage|full (build|production|parlou?r)|production|white rabbit (wedding|evening))\b/;

// Lines about setup, notice or the optional Afterglow never describe the
// length of the performance itself.
const IGNORE_LINE_RE = /\b(before|setup|set up|install\w*|early|prior|arrive\w*|call\w*|notice)\b|afterglow|after the show/;

const CLOSEUP_RE = /\b(close up|closeup|cocktail\w*|strolling|walk around|walkaround|roving|mingl\w*)\b/;
const PARLOR_RE = /\b(parlou?r|seated show|show)\b/;

const UNITS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19,
};
const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};
const UNIT_WORDS = Object.keys(UNITS).sort((a, b) => b.length - a.length).join("|");
const TEN_WORDS = Object.keys(TENS).join("|");
const NUM = `(?:\\d+(?:\\.\\d+)?|(?:${TEN_WORDS})(?: (?:${UNIT_WORDS}))?|${UNIT_WORDS})`;

function parseNumber(word: string): number | null {
  if (/^\d/.test(word)) {
    const n = parseFloat(word);
    return Number.isFinite(n) ? n : null;
  }
  const parts = word.split(" ");
  if (parts.length === 2) return (TENS[parts[0]] ?? 0) + (UNITS[parts[1]] ?? 0) || null;
  return TENS[word] ?? UNITS[word] ?? null;
}

const DURATION_RE = new RegExp(
  [
    `\\b(${NUM}) and a half hours?\\b`,
    `\\b(?:an|one) hour and a half\\b`,
    `\\b(?:half an hour|a half hour)\\b`,
    `\\b(${NUM}) (hours?|hrs?|minutes?|mins?)\\b`,
    `\\b(?:an|one) hour\\b`,
  ].join("|"),
  "g",
);

type Found = { minutes: number; index: number; length: number };

function durationsIn(line: string): Found[] {
  const out: Found[] = [];
  for (const m of line.matchAll(DURATION_RE)) {
    const text = m[0];
    let minutes: number | null = null;
    if (m[1]) {
      const n = parseNumber(m[1]);
      minutes = n === null ? null : n * 60 + 30;
    } else if (/hour and a half/.test(text)) {
      minutes = 90;
    } else if (/half/.test(text)) {
      minutes = 30;
    } else if (m[2]) {
      const n = parseNumber(m[2]);
      minutes = n === null ? null : /^h/.test(m[3]) ? n * 60 : n;
    } else {
      minutes = 60;
    }
    if (minutes !== null && minutes >= 5 && minutes <= 12 * 60) {
      out.push({ minutes: Math.round(minutes), index: m.index ?? 0, length: text.length });
    }
  }
  return out;
}

type DurationClass = "closeup" | "parlor" | "other";

function classify(text: string): DurationClass | null {
  if (CLOSEUP_RE.test(text)) return "closeup";
  if (PARLOR_RE.test(text)) return "parlor";
  return null;
}

export function packageTiming(tier: PackageTimingTier | null | undefined): PackageTiming {
  const name = normalize(tier?.name);
  const tagline = normalize(tier?.tagline);
  const items = Array.isArray(tier?.items) ? tier!.items.map(normalize) : [];
  const all = [name, tagline, ...items].join(" ");

  const kind: PackageTiming["kind"] = SHOW_RE.test(all) ? "show" : "walkaround";
  const setupMinutes = kind === "show" ? SHOW_SETUP_MINUTES : WALKAROUND_SETUP_MINUTES;

  // 1. Lengths written in the tier's own text.
  const largest: Record<DurationClass, number> = { closeup: 0, parlor: 0, other: 0 };
  let found = false;
  for (const line of [tagline, ...items]) {
    if (!line || IGNORE_LINE_RE.test(line)) continue;
    const durations = durationsIn(line);
    durations.forEach((d, i) => {
      // Classify by the words that follow this duration, up to the next one,
      // then by the whole line.
      const end = i + 1 < durations.length ? durations[i + 1].index : line.length;
      const segment = line.slice(d.index, end);
      const cls = classify(segment) ?? classify(line) ?? "other";
      largest[cls] = Math.max(largest[cls], d.minutes);
      found = true;
    });
  }
  if (found) {
    return {
      kind,
      performanceMinutes: largest.closeup + largest.parlor + largest.other,
      setupMinutes,
      source: "text",
    };
  }

  // 2. Package name defaults.
  const hasCocktailHour = /\bcocktail hour\b/.test(name);
  const hasParlor = /\bparlou?r\b/.test(name);
  if (hasCocktailHour && hasParlor) return { kind, performanceMinutes: 90 + 45, setupMinutes, source: "name" };
  if (hasCocktailHour) return { kind, performanceMinutes: 90, setupMinutes, source: "name" };
  if (hasParlor) return { kind, performanceMinutes: 45, setupMinutes, source: "name" };

  // 3. No stated length.
  return { kind, performanceMinutes: null, setupMinutes, source: "unknown" };
}

export const START_TIME_RE = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

// "19:30" (or "19:30:00") becomes "7:30 PM". Anything else returns null.
export function formatStartTime12h(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const hhmm = value.trim().slice(0, 5);
  if (!START_TIME_RE.test(hhmm)) return null;
  const [h, m] = hhmm.split(":").map(Number);
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

const pad = (n: number) => String(n).padStart(2, "0");

// Wall-clock arithmetic on a date and HH:MM, with no time zone involved, so
// crossing midnight moves the date correctly. Returns "YYYY-MM-DDTHH:MM:00".
export function shiftWallClock(eventDate: string, hhmm: string, deltaMinutes: number): string | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})/.exec(eventDate || "");
  const t = /^(\d{2}):(\d{2})/.exec(hhmm || "");
  if (!d || !t) return null;
  const base = Date.UTC(+d[1], +d[2] - 1, +d[3], +t[1], +t[2]);
  if (!Number.isFinite(base)) return null;
  const x = new Date(base + deltaMinutes * 60000);
  return `${x.getUTCFullYear()}-${pad(x.getUTCMonth() + 1)}-${pad(x.getUTCDate())}T${pad(x.getUTCHours())}:${pad(x.getUTCMinutes())}:00`;
}

// Calendar window for a signed package: setup before the client's start time,
// then the package length (or the default block when the package states none).
export function packageEventWindow(eventDate: string, clientStart: string, timing: PackageTiming) {
  const start = shiftWallClock(eventDate, clientStart, -timing.setupMinutes);
  const end = shiftWallClock(eventDate, clientStart, timing.performanceMinutes ?? DEFAULT_BLOCK_MINUTES);
  if (!start || !end) return null;
  return { start, end };
}
