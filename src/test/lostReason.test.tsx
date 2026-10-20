import { describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach } from "vitest";
import { LOST_REASONS, lostReasonError } from "@/lib/lostReason";
import { useLostReasonPicker } from "@/components/admin/LostReasonPicker";

afterEach(cleanup);
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
  function Harness({ save }: { save: (reason: string) => void }) {
    const { picker, requestLostReason } = useLostReasonPicker();
    return <><button onClick={async () => { const reason = await requestLostReason(); if (reason !== null) save(reason); }}>Move to Lost</button>{picker}</>;
  }
  it("cancel does not save a stage change", async () => {
    const save = vi.fn(); render(<Harness save={save} />);
    fireEvent.click(screen.getByText("Move to Lost"));
    fireEvent.click(screen.getByText("Cancel"));
    await Promise.resolve(); expect(save).not.toHaveBeenCalled();
  });
  it("saves Other with its required prefix", async () => {
    const save = vi.fn(); render(<Harness save={save} />);
    fireEvent.click(screen.getByText("Move to Lost"));
    fireEvent.change(screen.getByLabelText("Lost reason"), { target: { value: "Other" } });
    expect(screen.getByText("Confirm")).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Other details"), { target: { value: "Host cancelled" } });
    fireEvent.click(screen.getByText("Confirm"));
    await Promise.resolve(); expect(save).toHaveBeenCalledWith("Other: Host cancelled");
  });
});