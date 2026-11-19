import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { FIND_THE_QUEEN_ENABLED, findTheQueenClosed } from "../../supabase/functions/_shared/feature-flags";
import { FIND_THE_QUEEN_ENABLED as SITE_FLAG } from "@/lib/featureFlags";

describe("Find the Queen off switch", () => {
  it("is turned off", () => {
    expect(FIND_THE_QUEEN_ENABLED).toBe(false);
  });

  it("the website reads the same switch as the backend", () => {
    expect(SITE_FLAG).toBe(FIND_THE_QUEEN_ENABLED);
  });

  it("claims are refused with an error while off", () => {
    const closed = findTheQueenClosed(false);
    expect(closed?.status).toBe(503);
    expect(closed?.body.code).toBe("find_the_queen_disabled");
  });

  it("claims go through again once the switch is turned back on", () => {
    expect(findTheQueenClosed(true)).toBeNull();
  });

  it("the claim handler refuses before it reads the request or touches the database", () => {
    const src = readFileSync("supabase/functions/find-the-lady-claim/index.ts", "utf8");
    const refusal = src.indexOf("findTheQueenClosed()");
    expect(refusal).toBeGreaterThan(-1);
    expect(refusal).toBeLessThan(src.indexOf("req.json()"));
    expect(refusal).toBeLessThan(src.indexOf("createClient(url"));
  });

  it("the sitemap never lists the game or its rules", () => {
    expect(readFileSync("public/sitemap.xml", "utf8")).not.toMatch(/find-the-lady|official-rules/);
  });
});
