import { describe, it, expect } from "vitest";
import { matchOptOut } from "../../supabase/functions/process-stop-replies/stop-matcher";

describe("opt-out reply matcher", () => {
  it("does not match 'stop by'", () => {
    expect(matchOptOut("Happy to stop by Tuesday")).toBeNull();
  });
  it("does not match a legal footer mentioning opt out", () => {
    const body =
      "Sounds great, see you Saturday.\n\nCONFIDENTIALITY NOTICE: This email is intended only for the recipient. To opt out of marketing messages from our firm, reply OPT OUT.";
    expect(matchOptOut(body)).toBeNull();
  });
  it("does not match opt-out wording only in quoted text", () => {
    expect(matchOptOut("Yes please, send it over.\n\nOn Tue, Oct 21, 2026 Scott wrote:\n> reply STOP to unsubscribe")).toBeNull();
  });
  it("matches a bare STOP", () => {
    expect(matchOptOut("STOP")).toBe("STOP");
  });
  it("matches 'please unsubscribe me'", () => {
    expect(matchOptOut("please unsubscribe me")).toBe("UNSUBSCRIBE");
  });
  it("matches 'please take me off your list' with a signature", () => {
    expect(matchOptOut("Please take me off your list.\n--\nJane Doe")).toBe("TAKE ME OFF");
  });
});
