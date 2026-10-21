// Manual booking API amounts are integer cents, matching deals.deal_value.
export type BookingPayment = {
  mode: "paid" | "deposit" | "unpaid" | "log_only";
  amount_paid?: number | null;
  method?: "venmo" | "check" | "cash" | "zelle" | "stripe" | "other";
  send_client_emails?: boolean;
};

export class BookingPaymentError extends Error {}

export function normalizeBookingPayment(input: unknown, total: number): Required<BookingPayment> {
  const value = input === undefined ? { mode: "log_only" } : input;
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new BookingPaymentError("Payment must be an object.");
  const p = value as Record<string, unknown>;
  if (!["paid", "deposit", "unpaid", "log_only"].includes(String(p.mode))) throw new BookingPaymentError("Choose a valid booking payment mode.");
  if (p.send_client_emails !== undefined && typeof p.send_client_emails !== "boolean") throw new BookingPaymentError("Client emails must be on or off.");
  const mode = p.mode as BookingPayment["mode"];
  if (mode === "log_only") return { mode, amount_paid: 0, method: "other", send_client_emails: false };
  if (!Number.isSafeInteger(total) || total <= 0) throw new BookingPaymentError("A positive deal value in cents is required to log an invoice.");
  if (!["venmo", "check", "cash", "zelle", "stripe", "other"].includes(String(p.method))) throw new BookingPaymentError("Choose a valid payment method.");
  const amount = mode === "unpaid" ? 0 : p.amount_paid == null && mode === "paid" ? total : p.amount_paid;
  if (mode !== "unpaid" && (typeof amount !== "number" || !Number.isSafeInteger(amount) || amount <= 0 || amount > total)) throw new BookingPaymentError("Amount paid must be integer cents greater than zero and no more than the deal value.");
  return { mode, amount_paid: amount as number, method: p.method as Required<BookingPayment>["method"], send_client_emails: p.send_client_emails === true };
}

export function manualInvoiceFields(payment: Required<BookingPayment>, total: number, now: string) {
  if (payment.mode === "log_only") return null;
  const amount = payment.amount_paid ?? 0;
  return {
    total_cents: total,
    amount_paid_cents: amount,
    deposit_percent: payment.mode === "deposit" ? Math.round(amount / total * 100) : 0,
    status: payment.mode === "paid" ? "paid" : payment.mode === "deposit" ? "deposit_paid" : "open",
    environment: "live",
    payment_method: payment.method,
    external_note: "Logged manually",
    client_emails_paused: !payment.send_client_emails,
    paid_in_full_at: payment.mode === "paid" ? now : null,
    deposit_paid_at: payment.mode === "deposit" ? now : null,
    sent_at: now,
  };
}