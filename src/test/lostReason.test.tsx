import { describe, expect, it } from "vitest";
import { LOST_REASONS, lostReasonError } from "@/lib/lostReason";
describe("lost reasons", () => {
  it("offers the seven required reasons in order", () => {
    expect([...LOST_REASONS]).toEqual(["Ghosted / no response", "Pricing / budget", "Date conflict", "Decision delayed", "Went with another vendor", "Wrong fit (entertainment style)", "Other"]);
  });
  it.each([undefined, null, "", "   "])("rejects a blank reason %s for Lost", reason => {
    expect(lostReasonError("lost", reason)).toBe("A lost reason is required before moving a deal to Lost.");
  });
  it("requires Other details", () => {
    expect(lostReasonError("lost", "Other: ")).toBe("Enter a short explanation for Other.");
    expect(lostReasonError("lost", "Other: Host cancelled")).toBeNull();
  });
  it("does not require a reason for other stages", () => {
    expect(lostReasonError("booked", "")).toBeNull();
  });
  it("preserves existing free-text reasons", () => {
    expect(lostReasonError("lost", "Event cancelled / postponed")).toBeNull();
  });
});