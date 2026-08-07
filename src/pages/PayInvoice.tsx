import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getStripeEnvironment } from "@/lib/stripe";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";


const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

type InvoiceView = {
  pay_token: string;
  client_name: string | null;
  event_type: string | null;
  event_date: string | null;
  venue: string | null;
  tier_name: string | null;
  total_cents: number;
  deposit_percent: number;
  deposit_cents: number;
  balance_cents: number;
  amount_paid_cents: number;
  status: string;
  is_processing?: boolean;
};

const money = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

export default function PayInvoice() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const [invoice, setInvoice] = useState<InvoiceView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [option, setOption] = useState<"deposit" | "full" | null>(null);

  const returnedFromCheckout = Boolean(searchParams.get("session_id"));

  const loadInvoice = useCallback(async () => {
    const r = await fetch(
      `${FUNCTIONS_BASE}/invoice-api?action=get&token=${encodeURIComponent(token || "")}`,
    );
    const d = await r.json();
    if (d.error) setError(d.error);
    else {
      setError(null);
      setInvoice(d.invoice);
    }
  }, [token]);

  useEffect(() => {
    document.title = "Invoice · White Rabbit LA";
    let cancelled = false;
    loadInvoice().catch(() => !cancelled && setError("Could not load this invoice."));
    return () => { cancelled = true; };
  }, [loadInvoice]);

  const startCheckout = useCallback(async (choice: "deposit" | "full") => {
    setOption(choice);
    setNotice(null);
    try {
      const res = await fetch(`${FUNCTIONS_BASE}/invoice-api?action=checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          option: choice,
          environment: getStripeEnvironment(),
          origin: window.location.origin,
        }),
      });
      const data = await res.json();
      if (res.status === 409 && data.processing) {
        setOption(null);
        setNotice("A payment is already processing for this invoice. Nothing more is needed from you.");
        await loadInvoice().catch(() => undefined);
        return;
      }
      if (!data.url) throw new Error(data.error || "Could not start checkout.");
      window.location.href = data.url as string;
    } catch (e) {
      setError((e as Error).message);
      setOption(null);
    }
  }, [token, loadInvoice]);



  const paidInFull = invoice?.status === "paid";
  const hasDeposit = (invoice?.amount_paid_cents || 0) > 0 && !paidInFull;

  return (
    <div className="min-h-screen bg-[#F8F5F0] text-[#223D34]">
      <PaymentTestModeBanner />
      <main className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-center text-[11px] uppercase tracking-[0.3em] text-gold">White Rabbit LA</p>
        <h1 className="mt-6 text-center font-serif text-3xl">
          {paidInFull ? "Paid in full" : hasDeposit ? "Remaining balance" : "Your invoice"}
        </h1>

        {error && <p className="mt-10 text-center text-sm">{error}</p>}
        {!invoice && !error && <p className="mt-10 text-center text-sm opacity-70">Loading…</p>}

        {invoice && (
          <>
            <div className="mt-10 border border-[#e3ddd3] bg-white p-6 text-sm leading-8">
              {invoice.tier_name && <div><strong>Experience:</strong> {invoice.tier_name}</div>}
              {invoice.event_type && <div><strong>Occasion:</strong> {invoice.event_type}</div>}
              {invoice.event_date && <div><strong>Date:</strong> {invoice.event_date}</div>}
              {invoice.venue && <div><strong>Venue:</strong> {invoice.venue}</div>}
              <div><strong>Total:</strong> {money(invoice.total_cents)}</div>
              {invoice.amount_paid_cents > 0 && (
                <div><strong>Paid to date:</strong> {money(invoice.amount_paid_cents)}</div>
              )}
            </div>

            {paidInFull ? (
              <p className="mt-8 text-center text-sm">
                Thank you. Nothing further is due. I'll be in touch closer to the evening.
              </p>
            ) : returnedFromCheckout && !option ? (
              <p className="mt-8 text-center text-sm">
                Payment submitted. A receipt is on its way, and this page updates once it clears.
              </p>
            ) : !option ? (
              <div className="mt-8 space-y-3">
                {hasDeposit ? (
                  <button
                    onClick={() => startCheckout("full")}
                    className="w-full bg-[#C9A3A8] px-6 py-4 text-xs uppercase tracking-[0.16em] text-[#223D34]"
                  >
                    Pay remaining balance · {money(invoice.balance_cents)}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => startCheckout("deposit")}
                      className="w-full bg-[#C9A3A8] px-6 py-4 text-xs uppercase tracking-[0.16em] text-[#223D34]"
                    >
                      Pay {invoice.deposit_percent}% deposit · {money(invoice.deposit_cents)}
                    </button>
                    <button
                      onClick={() => startCheckout("full")}
                      className="w-full border border-[#223D34] px-6 py-4 text-xs uppercase tracking-[0.16em]"
                    >
                      Pay in full · {money(invoice.total_cents)}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <p className="mt-8 text-center text-sm opacity-70">Redirecting to secure checkout…</p>
            )}


            <p className="mt-10 text-center text-xs opacity-70">
              Questions? Reply to the invoice email or call (424) 394-1850.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
