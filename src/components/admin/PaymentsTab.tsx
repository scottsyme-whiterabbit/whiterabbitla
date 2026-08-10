import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RefreshCw, Loader2, Send, XCircle, BadgeDollarSign } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const FN = `${SUPABASE_URL}/functions/v1/invoice-api`;

interface Invoice {
  id: string;
  pay_token: string;
  client_name: string | null;
  client_email: string | null;
  event_type: string | null;
  event_date: string | null;
  venue: string | null;
  tier_name: string | null;
  total_cents: number;
  deposit_percent: number;
  amount_paid_cents: number;
  status: string;
  payment_method: string | null;
  external_note: string | null;
  client_emails_paused: boolean | null;
  pending_session_id: string | null;
  created_at: string;
}

const METHODS = [
  { value: "cash", label: "Cash" },
  { value: "check", label: "Check" },
  { value: "venmo", label: "Venmo" },
  { value: "zelle", label: "Zelle" },
  { value: "wire", label: "Wire" },
  { value: "other", label: "Other" },
];

const money = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

const methodLabel = (m: string | null) => {
  if (!m || m === "stripe") return "Stripe";
  const found = METHODS.find((x) => x.value === m);
  return found ? found.label : m.charAt(0).toUpperCase() + m.slice(1);
};

const PaymentsTab = ({ password }: { password: string }) => {
  const [items, setItems] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [openForm, setOpenForm] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("check");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const post = async (action: string, body: Record<string, unknown>) => {
    const res = await fetch(`${FN}?action=${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify(body),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "Request failed");
    return j;
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${FN}?action=list`, { headers: { "x-admin-password": password } });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to load");
      setItems(j.invoices || []);
    } catch (e) {
      toast.error((e as Error).message);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startSettle = (inv: Invoice) => {
    const remaining = Math.max(inv.total_cents - (inv.amount_paid_cents || 0), 0);
    setAmount((remaining / 100).toFixed(2));
    setMethod("check");
    setNote("");
    setOpenForm(inv.id);
  };

  const submitSettle = async (inv: Invoice) => {
    const dollars = parseFloat(amount);
    if (!isFinite(dollars) || dollars <= 0) {
      toast.error("Enter an amount greater than zero.");
      return;
    }
    setBusy(true);
    try {
      const j = await post("mark_paid", {
        id: inv.id,
        amount_cents: Math.round(dollars * 100),
        method,
        note: note || undefined,
      });
      toast.success(j.fully_paid ? "Marked paid in full" : "Partial payment recorded");
      setOpenForm(null);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusy(false);
  };

  const togglePause = async (inv: Invoice) => {
    const paused = !inv.client_emails_paused;
    setItems((s) => s.map((i) => (i.id === inv.id ? { ...i, client_emails_paused: paused } : i)));
    try {
      await post("set_email_pause", { id: inv.id, paused });
      toast.success(paused ? "Client emails paused" : "Client emails resumed");
    } catch (e) {
      toast.error((e as Error).message);
      load();
    }
  };

  const resend = async (inv: Invoice) => {
    try {
      await post("resend", { id: inv.id });
      toast.success("Invoice email resent");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const cancel = async (inv: Invoice) => {
    if (!confirm("Cancel this invoice?")) return;
    try {
      await post("cancel", { id: inv.id });
      toast.success("Invoice canceled");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <p className="text-sm text-forest-dark/60">
          Every invoice. Settle payments received outside Stripe and pause client emails when you are handling it directly.
        </p>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 text-sm border border-forest-dark/20 px-3 py-2 hover:bg-white"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-forest-dark/60">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-forest-dark/10 p-10 text-center text-forest-dark/60">
          No invoices yet.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((inv) => {
            const paid = inv.amount_paid_cents || 0;
            const remaining = Math.max(inv.total_cents - paid, 0);
            const fullyPaid = inv.status === "paid" || remaining === 0;
            const formOpen = openForm === inv.id;
            return (
              <div key={inv.id} className="bg-white border border-forest-dark/10 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-[240px]">
                    <div className="font-serif text-lg text-forest-dark">
                      {inv.client_name || "Client"}{" "}
                      <span className="text-forest-dark/50 text-sm font-sans">
                        · {money(inv.total_cents)}
                        {inv.tier_name ? ` · ${inv.tier_name}` : ""}
                      </span>
                    </div>
                    <div className="text-sm text-forest-dark/60 mt-1">
                      {inv.event_type || "Event"}
                      {inv.event_date ? ` · ${inv.event_date}` : ""}
                      {inv.venue ? ` · ${inv.venue}` : ""}
                    </div>
                    <div className="text-xs text-forest-dark/40 mt-1 flex flex-wrap gap-x-3 gap-y-1 items-center">
                      {inv.client_email && <span>{inv.client_email}</span>}
                      {fullyPaid ? (
                        <span className="text-emerald-700">Paid · {methodLabel(inv.payment_method)}</span>
                      ) : paid > 0 ? (
                        <span className="text-emerald-700">
                          {money(paid)} received · {methodLabel(inv.payment_method)} · {money(remaining)} remaining
                        </span>
                      ) : (
                        <span>Unpaid · {money(remaining)} due</span>
                      )}
                      {inv.pending_session_id && (
                        <span className="text-amber-700">Payment processing</span>
                      )}
                      {inv.status === "canceled" && <span className="text-red-700">Canceled</span>}
                      {inv.client_emails_paused && (
                        <span className="bg-forest-dark/10 text-forest-dark px-2 py-0.5 rounded-sm">
                          Emails paused
                        </span>
                      )}
                      {inv.external_note && <span>Note: {inv.external_note}</span>}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                    {!fullyPaid && inv.status !== "canceled" && (
                      <button
                        onClick={() => (formOpen ? setOpenForm(null) : startSettle(inv))}
                        className="inline-flex items-center gap-2 bg-forest-dark text-cream px-4 py-2 text-xs tracking-wider uppercase hover:opacity-90"
                      >
                        <BadgeDollarSign className="w-4 h-4" />
                        {formOpen ? "Close" : "Mark paid outside Stripe"}
                      </button>
                    )}
                    <button
                      onClick={() => resend(inv)}
                      className="inline-flex items-center gap-2 border border-forest-dark/25 px-4 py-2 text-xs tracking-wider uppercase hover:bg-cream"
                    >
                      <Send className="w-4 h-4" /> Resend
                    </button>
                    {inv.status !== "canceled" && !fullyPaid && (
                      <button
                        onClick={() => cancel(inv)}
                        className="inline-flex items-center gap-2 border border-forest-dark/25 px-4 py-2 text-xs tracking-wider uppercase hover:bg-cream"
                      >
                        <XCircle className="w-4 h-4" /> Cancel
                      </button>
                    )}
                    <label className="inline-flex items-center gap-2 text-xs text-forest-dark/70 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!!inv.client_emails_paused}
                        onChange={() => togglePause(inv)}
                        className="accent-forest-dark w-4 h-4"
                      />
                      Pause client emails
                    </label>
                  </div>
                </div>

                {formOpen && (
                  <div className="mt-4 border-t border-forest-dark/10 pt-4 grid gap-3 sm:grid-cols-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-forest-dark/50 mb-1">
                        Amount received
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full border border-forest-dark/20 px-3 py-2 text-sm bg-cream/40"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-forest-dark/50 mb-1">
                        Method
                      </label>
                      <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                        className="w-full border border-forest-dark/20 px-3 py-2 text-sm bg-cream/40"
                      >
                        {METHODS.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-forest-dark/50 mb-1">
                        Note (optional)
                      </label>
                      <input
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Check 1042"
                        className="w-full border border-forest-dark/20 px-3 py-2 text-sm bg-cream/40"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        disabled={busy}
                        onClick={() => submitSettle(inv)}
                        className="w-full bg-forest-dark text-cream px-4 py-2 text-xs tracking-wider uppercase hover:opacity-90 disabled:opacity-50"
                      >
                        {busy ? "Saving" : "Record payment"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PaymentsTab;
