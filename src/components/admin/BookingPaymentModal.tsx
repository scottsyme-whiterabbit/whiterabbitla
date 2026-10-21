import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { normalizeBookingPayment, type BookingPayment } from "@/lib/manualBooking";

type BookingDeal = { id?: string; stage?: string; deal_value?: number | null };
type AdminCall = (action: string, payload?: Record<string, unknown>) => Promise<any>;

/** Cancel resolves null before the caller saves a stage or outreach change. */
export function useBookingPayment(callAdmin: AdminCall) {
  const [open, setOpen] = useState(false);
  const [total, setTotal] = useState(0);
  const [mode, setMode] = useState<BookingPayment["mode"]>("log_only");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<NonNullable<BookingPayment["method"]>>("other");
  const [emails, setEmails] = useState(false);
  const [error, setError] = useState("");
  const resolver = useRef<((value: BookingPayment | null) => void) | null>(null);
  const finish = (value: BookingPayment | null) => {
    resolver.current?.(value);
    resolver.current = null;
    setOpen(false);
  };
  useEffect(() => () => { resolver.current?.(null); }, []);
  const requestBookingPayment = async (deal: BookingDeal): Promise<BookingPayment | null> => {
    if (deal.stage === "booked") return { mode: "log_only" };
    if (deal.id) {
      const context = await callAdmin("get_booking_payment_context", { dealId: deal.id });
      if (context.has_signed_agreement || context.has_active_invoice) return { mode: "log_only" };
    }
    setTotal(deal.deal_value ?? 0);
    setMode("log_only"); setAmount(""); setMethod("other"); setEmails(false); setError("");
    return new Promise(resolve => {
      resolver.current?.(null);
      resolver.current = resolve;
      setOpen(true);
    });
  };
  const confirm = () => {
    try {
      const payment = normalizeBookingPayment({ mode, amount_paid: amount.trim() ? Math.round(Number(amount) * 100) : null, method, send_client_emails: emails }, total);
      finish(payment);
    } catch (e) { setError(e instanceof Error ? e.message : "Check the payment details."); }
  };
  const bookingModal = <Dialog open={open} onOpenChange={next => { if (!next) finish(null); }}>
    <DialogContent className="w-[calc(100%-2rem)] max-w-sm max-h-[85dvh] overflow-y-auto overscroll-contain bg-background border-border">
      <DialogHeader><DialogTitle className="font-serif">How was this booked?</DialogTitle></DialogHeader>
      <div className="space-y-4 font-sans">
        <Select value={mode} onValueChange={value => { const next = value as BookingPayment["mode"]; setMode(next); setAmount(next === "paid" && total > 0 ? String(total / 100) : ""); setError(""); if (next === "log_only") setEmails(false); }}>
          <SelectTrigger aria-label="Booking payment" className="min-h-11 text-base"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="paid" className="min-h-11">Paid in full</SelectItem><SelectItem value="deposit" className="min-h-11">Deposit paid</SelectItem><SelectItem value="unpaid" className="min-h-11">Not paid yet</SelectItem><SelectItem value="log_only" className="min-h-11">Just log it</SelectItem></SelectContent>
        </Select>
        {(mode === "paid" || mode === "deposit") && <label className="block text-sm text-muted-foreground">Amount paid ($)<Input type="number" inputMode="decimal" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 min-h-12 text-base" /></label>}
        {mode !== "log_only" && <>
          <Select value={method} onValueChange={value => setMethod(value as NonNullable<BookingPayment["method"]>)}>
            <SelectTrigger aria-label="Payment method" className="min-h-11 text-base"><SelectValue /></SelectTrigger>
            <SelectContent>{["venmo", "check", "cash", "zelle", "stripe", "other"].map(value => <SelectItem key={value} value={value} className="min-h-11">{value.charAt(0).toUpperCase() + value.slice(1)}</SelectItem>)}</SelectContent>
          </Select>
          <label className="flex items-start gap-3 text-sm text-foreground min-h-12"><Checkbox checked={emails} onCheckedChange={value => setEmails(value === true)} className="mt-1" />Send pre-event and balance emails to client</label>
        </>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2"><Button variant="outline" className="min-h-11" onClick={() => finish(null)}>Cancel</Button><Button className="min-h-11" onClick={confirm}>Confirm</Button></div>
      </div>
    </DialogContent>
  </Dialog>;
  return { requestBookingPayment, bookingModal };
}