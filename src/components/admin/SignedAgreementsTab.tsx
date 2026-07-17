import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, CheckCircle2, RefreshCw, Loader2 } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const FN = `${SUPABASE_URL}/functions/v1/proposals-api`;

interface SignedAgreement {
  id: string;
  proposal_id: string | null;
  proposal_slug: string | null;
  tier_name: string;
  tier_price: string | null;
  client_name: string;
  client_email: string | null;
  event_type: string | null;
  event_date: string | null;
  venue: string | null;
  agreement_text: string;
  signed_at: string;
  invoice_sent_at: string | null;
}

const SignedAgreementsTab = ({ password }: { password: string }) => {
  const [items, setItems] = useState<SignedAgreement[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${FN}?action=list_signed`, {
        headers: { "x-admin-password": password },
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to load");
      setItems(j.agreements || []);
    } catch (e) {
      toast.error((e as Error).message);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Agreement copied — paste into the Square invoice notes.");
  };

  const markInvoiced = async (id: string) => {
    try {
      const res = await fetch(`${FN}?action=mark_invoiced`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify({ id }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      toast.success("Marked as invoiced");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-forest-dark/60">
          Signed proposals. Click Copy Agreement, then paste into your Square invoice notes.
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
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-forest-dark/10 p-10 text-center text-forest-dark/60">
          No signed agreements yet.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => {
            const open = !!expanded[a.id];
            return (
              <div key={a.id} className="bg-white border border-forest-dark/10 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-[240px]">
                    <div className="font-serif text-lg text-forest-dark">
                      {a.client_name}{" "}
                      <span className="text-forest-dark/50 text-sm font-sans">
                        · {a.tier_name}
                        {a.tier_price ? ` · ${a.tier_price}` : ""}
                      </span>
                    </div>
                    <div className="text-sm text-forest-dark/60 mt-1">
                      {a.event_type || "Event"}
                      {a.event_date ? ` · ${a.event_date}` : ""}
                      {a.venue ? ` · ${a.venue}` : ""}
                    </div>
                    <div className="text-xs text-forest-dark/40 mt-1 flex flex-wrap gap-x-3">
                      {a.client_email && <span>{a.client_email}</span>}
                      <span>Signed {new Date(a.signed_at).toLocaleString()}</span>
                      {a.invoice_sent_at && (
                        <span className="text-emerald-700">
                          · Invoice sent {new Date(a.invoice_sent_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => copy(a.agreement_text)}
                      className="inline-flex items-center gap-2 bg-forest-dark text-cream px-4 py-2 text-xs tracking-wider uppercase hover:opacity-90"
                    >
                      <Copy className="w-4 h-4" /> Copy Agreement
                    </button>
                    {!a.invoice_sent_at && (
                      <button
                        onClick={() => markInvoiced(a.id)}
                        className="inline-flex items-center gap-2 border border-forest-dark/25 px-4 py-2 text-xs tracking-wider uppercase hover:bg-white"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Mark Invoiced
                      </button>
                    )}
                    <button
                      onClick={() => setExpanded((s) => ({ ...s, [a.id]: !open }))}
                      className="border border-forest-dark/20 px-3 py-2 text-xs tracking-wider uppercase hover:bg-white"
                    >
                      {open ? "Hide" : "View"}
                    </button>
                  </div>
                </div>
                {open && (
                  <pre className="mt-4 border border-forest-dark/10 bg-cream/60 p-4 max-h-96 overflow-y-auto font-sans text-[13px] leading-[1.7] whitespace-pre-wrap text-forest-dark/90">
                    {a.agreement_text}
                  </pre>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SignedAgreementsTab;
