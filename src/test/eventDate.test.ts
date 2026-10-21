import { describe, it, expect } from "vitest";
import {
  parseEventDate,
  formatEventDate,
  eventDateForAlert,
  eventDateForClient,
} from "../../supabase/functions/_shared/event-date";

const NOW = new Date("2026-10-21T17:00:00Z");
const dec5 = { year: 2026, month: 12, day: 5 };

describe("parseEventDate", () => {
  it("reads ISO as a Pacific calendar date, not UTC midnight", () => {
    const d = parseEventDate("2026-12-05", NOW)!;
    expect(d).toEqual(dec5);
    expect(formatEventDate(d)).toBe("Saturday, December 5");
  });
  it("reads MMDDYYYY", () => expect(parseEventDate("12052026", NOW)).toEqual(dec5));
  it("reads MM/DD/YYYY", () => expect(parseEventDate("12/05/2026", NOW)).toEqual(dec5));
  it("reads M/D/YY", () => expect(parseEventDate("12/5/26", NOW)).toEqual(dec5));
  it("reads 'December 5, 2026'", () => expect(parseEventDate("December 5, 2026", NOW)).toEqual(dec5));
  it("reads 'Dec 5 2026'", () => expect(parseEventDate("Dec 5 2026", NOW)).toEqual(dec5));
  it("reads 'Saturday, December 5th' as the next occurrence", () =>
    expect(parseEventDate("Saturday, December 5th", NOW)).toEqual(dec5));
  it("rolls a past month/day without a year into next year", () =>
    expect(parseEventDate("March 3", NOW)).toEqual({ year: 2027, month: 3, day: 3 }));
  it("returns null for junk and impossible dates", () => {
    for (const raw of ["june", "Sept 19 or 26", "2926-01-01", "20216", "02/30/2026", "", "TBD"]) {
      expect(parseEventDate(raw, NOW)).toBeNull();
    }
  });
});

describe("event date output", () => {
  it("Scott-facing alerts say 'date unclear' when unparseable", () => {
    expect(eventDateForAlert("sometime in june")).toBe("date unclear");
  });
  it("client-facing output is empty when unparseable, never 'Invalid Date'", () => {
    expect(eventDateForClient("sometime in june")).toBe("");
    expect(eventDateForClient(null)).toBe("");
  });
  it("formats 2026-12-05 as Saturday, December 5", () => {
    expect(eventDateForAlert("2026-12-05")).toBe("Saturday, December 5");
  });
});
