// Visible badge for Stripe refunds and disputes on a deal's invoice.
export type MoneyFlagInvoice = { status?: string | null; refunded_cents?: number | null; dispute_status?: string | null; dispute_amount_cents?: number | null };
const usd = (c: number) => (c / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

export function invoiceMoneyFlags(inv: MoneyFlagInvoice): string[] {
  const flags: string[] = [];
  const refunded = inv.refunded_cents || 0;
  if (inv.status === "refunded") flags.push(`Refunded ${usd(refunded)}`);
  else if (inv.status === "partially_refunded" || refunded > 0) flags.push(`Partially refunded ${usd(refunded)}`);
  if (inv.dispute_status === "disputed") flags.push("Disputed");
  if (inv.dispute_status === "dispute_lost") flags.push("Dispute lost");
  if (inv.dispute_status === "dispute_won") flags.push("Dispute won");
  return flags;
}
