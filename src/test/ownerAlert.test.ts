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

import { readFileSync } from "node:fs";
describe("owner alert call sites", () => {
  const read = (p: string) => readFileSync(`supabase/functions/${p}`, "utf8");
  it("only owner-addressed calls pass internalAlert", () => {
    expect(read("send-inquiry/index.ts").match(/internalAlert: true/g)?.length).toBe(2);
    expect(read("proposals-api/index.ts").match(/"resend", true\)/g)?.length).toBe(2);
    for (const f of ["gmail-send/index.ts", "proposal-followup/index.ts", "post-show-sequence/index.ts", "inquiry-followup/index.ts", "_shared/invoice-email.ts"]) {
      expect(read(f)).not.toMatch(/internalAlert|"resend", true\)/);
    }
  });
  it("gatedResendFetch applies the owner override per recipient", () => {
    expect(read("_shared/send-gate.ts")).toMatch(/ownerAlertOverride\(bareEmail\(addr\), why, internalAlert\)/);
  });
});
