// Invoices in these states are dead: no reminders, no checkout, no payment
// emails, and they never count as paid or as revenue. Both spellings of
// cancelled are accepted because the admin cancel action writes "canceled".
export const INACTIVE_INVOICE_STATUSES = ["void", "cancelled", "canceled"] as const;
export const INACTIVE_INVOICE_STATUS_FILTER = `(${INACTIVE_INVOICE_STATUSES.map((s) => `"${s}"`).join(",")})`;
export function isInactiveInvoice(status: unknown): boolean {
  return typeof status === "string" && (INACTIVE_INVOICE_STATUSES as readonly string[]).includes(status);
}
