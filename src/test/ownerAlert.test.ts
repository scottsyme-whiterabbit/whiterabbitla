import { describe, it, expect } from "vitest";
import { ownerAlertOverride } from "../../supabase/functions/_shared/owner-alert";

const OWNER = "scott.syme@whiterabbitla.com";

describe("owner inbox alert override", () => {
  it("sends an internal alert to the owner even when unsubscribed", () => {
    expect(ownerAlertOverride(OWNER, "unsubscribed", true)).toBe(true);
  });
  it("still blocks the unsubscribed owner without internalAlert", () => {
    expect(ownerAlertOverride(OWNER, "unsubscribed", undefined)).toBe(false);
  });
  it("still blocks an unsubscribed client address with internalAlert", () => {
    expect(ownerAlertOverride("client@example.com", "unsubscribed", true)).toBe(false);
  });
  it("still blocks a hard-bounced owner with internalAlert", () => {
    expect(ownerAlertOverride(OWNER, "hard_bounced", true)).toBe(false);
  });
});
