// Dependency-free so it can be unit tested. The business's own inbox: a
// marketing unsubscribe (or a gate lookup outage) must never silence internal
// alerts. Hard bounces, suppression and invalid addresses still block.
export const OWNER_INBOXES = new Set(["scott.syme@whiterabbitla.com"]);

export function ownerAlertOverride(bareTo: string, blocked: string | null, internalAlert?: boolean): boolean {
  return internalAlert === true
    && OWNER_INBOXES.has(bareTo)
    && (blocked === "unsubscribed" || blocked === "gate_unavailable");
}
