import { describe, expect, it } from "vitest";
import {
  DEFAULT_BLOCK_MINUTES,
  SHOW_SETUP_MINUTES,
  WALKAROUND_SETUP_MINUTES,
  formatStartTime12h,
  packageEventWindow,
  packageTiming,
} from "../../supabase/functions/_shared/package-timing";
import { PRICING_TIER_SETS } from "@/data/pricingTierSets";

describe("packageTiming", () => {
  it("uses the agreed setup constants", () => {
    expect(SHOW_SETUP_MINUTES).toBe(40);
    expect(WALKAROUND_SETUP_MINUTES).toBe(20);
    expect(DEFAULT_BLOCK_MINUTES).toBe(120);
  });

  it("The Cocktail Hour with no text is a 90 minute walk-around with 20 minutes setup", () => {
    expect(packageTiming({ name: "The Cocktail Hour", tagline: "", items: [] })).toEqual({
      kind: "walkaround", performanceMinutes: 90, setupMinutes: 20, source: "name",
    });
  });

  it("The Cocktail Hour with 'Up to two hours of close-up magic' is 120 minutes", () => {
    const t = packageTiming({ name: "The Cocktail Hour", tagline: "", items: ["Up to two hours of close-up magic"] });
    expect(t).toEqual({ kind: "walkaround", performanceMinutes: 120, setupMinutes: 20, source: "text" });
  });

  it("The Cocktail Hour with three hours written is 180 minutes", () => {
    expect(packageTiming({ name: "The Cocktail Hour", items: ["Three hours of close-up magic among your guests."] }).performanceMinutes).toBe(180);
    expect(packageTiming({ name: "The Cocktail Hour", items: ["Up to 3 hours of strolling magic."] }).performanceMinutes).toBe(180);
  });

  it("The Parlor is a 45 minute show with 40 minutes setup", () => {
    expect(packageTiming({ name: "The Parlor", tagline: "", items: [] })).toEqual({
      kind: "show", performanceMinutes: 45, setupMinutes: 40, source: "name",
    });
  });

  it("'The Cocktail Hour and The Parlor' is a 135 minute show", () => {
    expect(packageTiming({ name: "The Cocktail Hour and The Parlor", items: [] })).toEqual({
      kind: "show", performanceMinutes: 135, setupMinutes: 40, source: "name",
    });
  });

  it("adds close-up and parlor lengths from the standard lines", () => {
    const t = packageTiming({
      name: "The Cocktail Hour and The Parlor",
      items: [
        "Up to ninety minutes of close-up magic, performed among your guests during cocktails.",
        "A forty-five-minute parlor show, performed for your guests together, as one audience.",
      ],
    });
    expect(t).toEqual({ kind: "show", performanceMinutes: 135, setupMinutes: 40, source: "text" });
  });

  it("The White Rabbit Evening with no stated length is a show with no length", () => {
    expect(packageTiming({ name: "The White Rabbit Evening", tagline: "", items: [] })).toEqual({
      kind: "show", performanceMinutes: null, setupMinutes: 40, source: "unknown",
    });
    expect(packageTiming({ name: "The White Rabbit Wedding", items: [] }).performanceMinutes).toBeNull();
  });

  it("ignores the install line and the Afterglow line", () => {
    const t = packageTiming({
      name: "The Parlor",
      items: [
        "A full parlor production, installed in your space about forty minutes before the show.",
        "The Afterglow: thirty minutes of close-up magic after the show, for the guests who stay.",
        "The Afterglow: thirty unhurried minutes of close-up magic after the show, for the guests who stay.",
      ],
    });
    expect(t).toEqual({ kind: "show", performanceMinutes: 45, setupMinutes: 40, source: "name" });
  });

  it("reads other written forms", () => {
    expect(packageTiming({ name: "X", items: ["90 minutes of close-up"] }).performanceMinutes).toBe(90);
    expect(packageTiming({ name: "X", items: ["2 hours of roving magic"] }).performanceMinutes).toBe(120);
    expect(packageTiming({ name: "X", items: ["An hour and a half of close-up"] }).performanceMinutes).toBe(90);
    expect(packageTiming({ name: "X", items: ["Two and a half hours of strolling magic"] }).performanceMinutes).toBe(150);
  });

  it("maps every default package", () => {
    const map = Object.fromEntries(
      Object.entries(PRICING_TIER_SETS).flatMap(([set, tiers]) =>
        tiers.map((t) => {
          const r = packageTiming(t);
          return [`${set}: ${t.name}`, [r.kind, r.setupMinutes, r.performanceMinutes]];
        }),
      ),
    );
    expect(map).toEqual({
      "Wedding: The Cocktail Hour": ["walkaround", 20, 90],
      "Wedding: The Cocktail Hour and The Parlor": ["show", 40, 135],
      "Wedding: The White Rabbit Wedding": ["show", 40, null],
      "Corporate: The Cocktail Hour": ["walkaround", 20, 90],
      "Corporate: The Cocktail Hour and The Parlor": ["show", 40, 135],
      "Corporate: The White Rabbit Evening": ["show", 40, null],
      "General: The Cocktail Hour": ["walkaround", 20, 90],
      "General: The Parlor": ["show", 40, 45],
      "General: The White Rabbit Evening": ["show", 40, null],
    });
  });
});

describe("start time and calendar window", () => {
  it("formats 24 hour times in 12 hour form", () => {
    expect(formatStartTime12h("19:30")).toBe("7:30 PM");
    expect(formatStartTime12h("19:00:00")).toBe("7:00 PM");
    expect(formatStartTime12h("00:15")).toBe("12:15 AM");
    expect(formatStartTime12h("12:00")).toBe("12:00 PM");
    expect(formatStartTime12h("25:00")).toBeNull();
    expect(formatStartTime12h("")).toBeNull();
  });

  it("starts the event at setup and ends after the package length", () => {
    const walk = packageTiming({ name: "The Cocktail Hour" });
    expect(packageEventWindow("2027-06-12", "19:30", walk)).toEqual({
      start: "2027-06-12T19:10:00", end: "2027-06-12T21:00:00",
    });
    const evening = packageTiming({ name: "The White Rabbit Evening" });
    expect(packageEventWindow("2027-06-12", "19:00", evening)).toEqual({
      start: "2027-06-12T18:20:00", end: "2027-06-12T21:00:00",
    });
  });

  it("crosses midnight by date arithmetic", () => {
    const parlor = packageTiming({ name: "The Parlor" });
    expect(packageEventWindow("2027-12-31", "23:30", parlor)).toEqual({
      start: "2027-12-31T22:50:00", end: "2028-01-01T00:15:00",
    });
    expect(packageEventWindow("2027-06-12", "00:10", parlor)?.start).toBe("2027-06-11T23:30:00");
  });
});
