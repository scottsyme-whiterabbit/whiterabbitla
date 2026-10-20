import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LOST_REASONS, lostReasonError } from "@/lib/lostReason";

export function LostReasonField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const standard = LOST_REASONS.some((reason) => reason === value);
  const selected = standard ? value : value ? "Other" : "";
  const detail = value.startsWith("Other:") ? value.slice(6).trimStart() : standard ? "" : value;
  return <div className="space-y-2">
    <label className="block text-xs text-muted-foreground">Lost reason
      <select aria-label="Lost reason" value={selected} onChange={(e) => onChange(e.target.value === "Other" ? "Other: " : e.target.value)} className="w-full min-h-[44px] bg-background border border-border px-3 text-foreground">
        <option value="">Select a reason</option>
        {LOST_REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
      </select>
    </label>
    {selected === "Other" && <label className="block text-xs text-muted-foreground">Other details
      <input aria-label="Other details" required maxLength={240} value={detail} onChange={(e) => onChange(`Other: ${e.target.value}`)} className="w-full min-h-[44px] bg-background border border-border px-3 text-foreground" />
    </label>}
  </div>;
}

/** Resolves only after selection; cancellation never invokes the caller's save. */
export function useLostReasonPicker() {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const resolveRef = useRef<((reason: string | null) => void) | null>(null);
  const finish = (result: string | null) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setOpen(false);
  };
  useEffect(() => () => { resolveRef.current?.(null); }, []);
  const requestLostReason = (current = "") => new Promise<string | null>((resolve) => {
    resolveRef.current?.(null);
    resolveRef.current = resolve;
    setReason(current);
    setOpen(true);
  });
  const picker = <Dialog open={open} onOpenChange={(next) => { if (!next) finish(null); }}>
    <DialogContent className="max-w-sm">
      <DialogHeader><DialogTitle>Lost reason</DialogTitle></DialogHeader>
      <LostReasonField value={reason} onChange={setReason} />
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => finish(null)}>Cancel</Button>
        <Button disabled={Boolean(lostReasonError("lost", reason))} onClick={() => finish(reason.trim())}>Confirm</Button>
      </div>
    </DialogContent>
  </Dialog>;
  return { requestLostReason, picker };
}