import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, RefreshCw, Send, Loader2, BadgeDollarSign, BellOff, FileText, User, ExternalLink, Copy } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const INVOICE_FN = `${SUPABASE_URL}/functions/v1/invoice-api`;

export interface ContextDeal {
  id: string;
  contact_email: string;
  contact_name: string | null;
  company: string | null;
  stage: string;
  event_type: string | null;
  event_date: string | null;
  location: string | null;
  gmail_thread_id?: string | null;
}

interface ThreadMessage {
  id: string;
  direction: string;
  from_email: string | null;
  to_email: string | null;
  subject: string | null;
  snippet: string | null;
  body_text: string | null;
  sent_at: string;
}

interface Invoice {
  id: string;
  pay_token: string;
  tier_name: string | null;
  event_date: string | null;
  total_cents: number;
  amount_paid_cents: number;
  deposit_percent: number;
  status: string;
  payment_method: string | null;
  external_note: string | null;
  client_emails_paused: boolean | null;
  pending_session_id: string | null;
  created_at: string;
}

interface Proposal {
  id: string;
  slug: string;
  first_name: string | null;
  last_name: string | null;
  recipient_email: string | null;
  event_type: string | null;
  event_date: string | null;
  venue: string | null;
  tiers: unknown;
  sent_at: string | null;
  created_at: string;
  view_count: number;
  last_viewed_at: string | null;
}

interface Agreement {
  id: string;
  proposal_slug: string | null;
  tier_name: string;
  tier_price: string | null;
  client_name: string;
  signed_at: string;
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

const statusLabel = (inv: Invoice) => {
  if (inv.status === "paid") return `Paid · ${methodLabel(inv.payment_method)}`;
  if (inv.status === "deposit_paid") return `Deposit received · ${methodLabel(inv.payment_method)}`;
  if (inv.status === "canceled") return "Canceled";
  if (inv.pending_session_id) return "Payment processing";
  return "Unpaid";
};

const fmtDate = (d: string | null) =>
  d ? new Date(d.length <= 10 ? `${d}T12:00:00` : d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;

type TabKey = "payments" | "correspondence" | "proposal";

interface Props {
  deal: ContextDeal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminPassword: string;
  onEditDeal: (deal: ContextDeal) => void;
}

const ClientContextPanel = ({ deal, open, onOpenChange, adminPassword, onEditDeal }: Props) => {
  const [tab, setTab] = useState<TabKey | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [openForm, setOpenForm] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("check");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const callAdmin = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/newsletter-admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({ action, adminPassword, ...payload }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }, [adminPassword]);

  const callInvoice = useCallback(async (action: string, body: Record<string, unknown>) => {
    const res = await fetch(`${INVOICE_FN}?action=${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": adminPassword },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }, [adminPassword]);

  const loadInvoices = useCallback(async (dealId: string) => {
    try {
      const res = await callAdmin("get_deal_invoices", { deal_id: dealId });
      setInvoices(res.invoices || []);
    } catch {
      setInvoices([]);
    }
  }, [callAdmin]);

  const loadProposals = useCallback(async (dealId: string) => {
    try {
      const res = await callAdmin("get_deal_proposals", { deal_id: dealId });
      setProposals(res.proposals || []);
      setAgreements(res.agreements || []);
    } catch {
      setProposals([]);
      setAgreements([]);
    }
  }, [callAdmin]);

  const loadThread = useCallback(async (dealId: string) => {
    const res = await callAdmin("get_deal_threads", { deal_id: dealId });
    const msgs: ThreadMessage[] = res.messages || [];
    setMessages(msgs);
    const threads = res.threads || [];
    setThreadId(threads.length ? threads[0].gmail_thread_id : null);
    return msgs;
  }, [callAdmin]);

  const syncGmail = useCallback(async (dealId: string, quiet = false) => {
    setSyncing(true);
    try {
      await callAdmin("trigger_gmail_sync", { deal_id: dealId });
      await loadThread(dealId);
      if (!quiet) toast.success("Gmail synced");
    } catch (e) {
      if (!quiet) toast.error(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }, [callAdmin, loadThread]);

  useEffect(() => {
    if (!open || !deal) return;
    let cancelled = false;
    setLoading(true);
    setTab(null);
    setMessages([]);
    setInvoices([]);
    setProposals([]);
    setAgreements([]);
    setExpanded({});
    setReply("");
    setOpenForm(null);
    (async () => {
      try {
        const [msgs] = await Promise.all([loadThread(deal.id), loadInvoices(deal.id), loadProposals(deal.id)]);
        // Never show a blank conversation for a client who may have real history.
        if (!cancelled && msgs.length === 0) await syncGmail(deal.id, true);
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : "Failed to load client context");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, deal, loadThread, loadInvoices, loadProposals, syncGmail]);

  const sendReply = async () => {
    if (!deal || !reply.trim()) return;
    setSending(true);
    try {
      const lastSubject = messages.length ? messages[messages.length - 1].subject : null;
      await callAdmin("send_gmail_reply", {
        deal_id: deal.id,
        to: deal.contact_email,
        subject: lastSubject ? (lastSubject.startsWith("Re:") ? lastSubject : `Re: ${lastSubject}`) : "Following up",
        body_text: reply,
        gmail_thread_id: threadId || deal.gmail_thread_id || undefined,
      });
      setReply("");
      toast.success("Sent from Gmail");
      await loadThread(deal.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  const startMarkPaid = (inv: Invoice) => {
    setOpenForm(inv.id);
    setAmount(((Math.max(inv.total_cents - inv.amount_paid_cents, 0)) / 100).toFixed(2));
    setMethod("check");
    setNote("");
  };

  const submitMarkPaid = async (inv: Invoice) => {
    const dollars = parseFloat(amount);
    if (!isFinite(dollars) || dollars <= 0) { toast.error("Enter an amount"); return; }
    setBusy(true);
    try {
      await callInvoice("mark_paid", {
        id: inv.id,
        amount_cents: Math.round(dollars * 100),
        method,
        note: note || undefined,
      });
      toast.success("Payment recorded");
      setOpenForm(null);
      if (deal) await loadInvoices(deal.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not record payment");
    } finally {
      setBusy(false);
    }
  };

  const togglePause = async (inv: Invoice) => {
    const next = !inv.client_emails_paused;
    setBusy(true);
    try {
      await callInvoice("set_email_pause", { id: inv.id, paused: next });
      toast.success(next ? "Client emails paused" : "Client emails resumed");
      if (deal) await loadInvoices(deal.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update");
    } finally {
      setBusy(false);
    }
  };

  if (!deal) return null;

  const TABS: { key: TabKey; label: string; icon: typeof User; count?: number }[] = [
    { key: "payments", label: "Payments", icon: BadgeDollarSign, count: invoices.length },
    { key: "correspondence", label: "Correspondence", icon: Mail, count: messages.length },
    { key: "proposal", label: "Proposal", icon: FileText, count: proposals.length },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-background border-border max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {deal.contact_name || deal.contact_email}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            {[deal.contact_email, deal.company, deal.stage].filter(Boolean).join(" · ")}
          </p>
        </DialogHeader>

        {/* DEAL DETAILS - always first */}
        <div className="space-y-4">
          <section className="border border-border p-4 space-y-2">

              <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-accent mb-1">Client details</p>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                {[
                  ["Name", deal.contact_name || "-"],
                  ["Email", deal.contact_email],
                  ["Company", deal.company || "-"],
                  ["Stage", deal.stage],
                  ["Event", deal.event_type || "-"],
                  ["Date", fmtDate(deal.event_date) || "-"],
                  ["Location", deal.location || "-"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[9px] tracking-[0.1em] uppercase text-muted-foreground">{label}</p>
                    <p className="text-foreground break-words">{value}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(deal.contact_email); toast.success("Email copied"); }}
                className="flex items-center gap-1.5 font-sans text-[10px] tracking-[0.1em] uppercase text-muted-foreground hover:text-foreground transition-colors pt-1"
              >
                <Copy size={11} /> Copy email
              </button>
            </section>

            {/* Payments */}
            <section className="border-t border-border pt-4">
              <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-accent mb-3 flex items-center gap-1.5">
                <BadgeDollarSign size={12} /> Payments
              </p>
              {invoices.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No invoice raised for this client yet.</p>
              ) : (
                <div className="space-y-3">
                  {invoices.map((inv) => {
                    const remaining = Math.max(inv.total_cents - inv.amount_paid_cents, 0);
                    const settled = inv.status === "paid";
                    return (
                      <div key={inv.id} className="border border-border p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-sans text-xs text-foreground">{inv.tier_name || "White Rabbit LA"}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {money(inv.total_cents)} total · {money(inv.amount_paid_cents)} paid · {money(remaining)} remaining
                            </p>
                            {inv.external_note && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">Note: {inv.external_note}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className={`font-sans text-[9px] tracking-[0.1em] uppercase ${settled ? "text-emerald-500" : "text-accent"}`}>
                              {statusLabel(inv)}
                            </span>
                            {inv.client_emails_paused && (
                              <span className="font-sans text-[9px] tracking-[0.1em] uppercase text-muted-foreground flex items-center gap-1">
                                <BellOff size={9} /> Emails paused
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mt-2.5">
                          {!settled && (
                            <button
                              onClick={() => (openForm === inv.id ? setOpenForm(null) : startMarkPaid(inv))}
                              className="font-sans text-[10px] tracking-[0.1em] uppercase text-accent hover:text-accent/80 transition-colors"
                            >
                              Mark paid outside Stripe
                            </button>
                          )}
                          <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!inv.client_emails_paused}
                              disabled={busy}
                              onChange={() => togglePause(inv)}
                              className="accent-current"
                            />
                            Pause client emails
                          </label>
                        </div>

                        {openForm === inv.id && (
                          <div className="mt-3 border-t border-border pt-3 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[9px] tracking-[0.1em] uppercase text-muted-foreground mb-1">Amount</label>
                                <input
                                  value={amount}
                                  onChange={(e) => setAmount(e.target.value)}
                                  inputMode="decimal"
                                  className="w-full bg-background border border-border px-2 py-1.5 text-xs focus:outline-none focus:border-accent"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] tracking-[0.1em] uppercase text-muted-foreground mb-1">Method</label>
                                <select
                                  value={method}
                                  onChange={(e) => setMethod(e.target.value)}
                                  className="w-full bg-background border border-border px-2 py-1.5 text-xs focus:outline-none focus:border-accent"
                                >
                                  {METHODS.map((m) => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="block text-[9px] tracking-[0.1em] uppercase text-muted-foreground mb-1">Note</label>
                              <input
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Optional, for example a check number"
                                className="w-full bg-background border border-border px-2 py-1.5 text-xs focus:outline-none focus:border-accent"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => submitMarkPaid(inv)}
                                disabled={busy}
                                className="flex items-center gap-1.5 bg-accent text-accent-foreground px-3 py-1.5 font-sans text-[10px] tracking-[0.15em] uppercase hover:bg-accent/80 disabled:opacity-50 transition-colors"
                              >
                                {busy && <Loader2 size={11} className="animate-spin" />} Record payment
                              </button>
                              <button
                                onClick={() => setOpenForm(null)}
                                className="border border-border px-3 py-1.5 font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <button
              onClick={() => { onOpenChange(false); onEditDeal(deal); }}
              className="w-full border border-border py-2 font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              Edit deal details
            </button>
          </div>
        )}

        {/* CORRESPONDENCE */}
        {tab === "correspondence" && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-accent flex items-center gap-1.5">
                <Mail size={12} /> Conversation
              </p>
              <button
                onClick={() => syncGmail(deal.id)}
                disabled={syncing}
                className="flex items-center gap-1.5 font-sans text-[10px] tracking-[0.1em] uppercase text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
              >
                <RefreshCw size={11} className={syncing ? "animate-spin" : ""} /> {syncing ? "Syncing" : "Sync now"}
              </button>
            </div>

            {loading ? (
              <p className="text-xs text-muted-foreground">Loading conversation...</p>
            ) : messages.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No email history with this client in the last 90 days.</p>
            ) : (
              <div className="space-y-3">
                {messages.map((m) => {
                  const isOpen = !!expanded[m.id];
                  const full = m.body_text || m.snippet || "";
                  return (
                    <div
                      key={m.id}
                      className={`border-l-2 pl-3 py-1 ${m.direction === "inbound" ? "border-accent" : "border-muted"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] tracking-wider uppercase text-muted-foreground">
                          {m.direction === "inbound" ? `In · ${m.from_email}` : `Out · ${m.to_email}`}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{new Date(m.sent_at).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-foreground mt-1 font-medium">{m.subject}</p>
                      <p className={`text-xs text-muted-foreground mt-1 whitespace-pre-wrap ${isOpen ? "" : "line-clamp-3"}`}>
                        {full}
                      </p>
                      {full.length > 200 && (
                        <button
                          onClick={() => setExpanded((p) => ({ ...p, [m.id]: !isOpen }))}
                          className="text-[10px] text-accent hover:text-accent/80 mt-1 transition-colors"
                        >
                          {isOpen ? "Show less" : "Show more"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="border-t border-border mt-4 pt-3">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={4}
                placeholder="Write a reply, sent from scott.syme@whiterabbitla.com via Gmail"
                className="w-full bg-background border border-border px-3 py-2 text-sm resize-none focus:outline-none focus:border-accent"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={sendReply}
                  disabled={sending || !reply.trim()}
                  className="flex items-center gap-1.5 bg-accent text-accent-foreground px-4 py-1.5 font-sans text-[10px] tracking-[0.15em] uppercase hover:bg-accent/80 disabled:opacity-50 transition-colors"
                >
                  <Send size={12} /> {sending ? "Sending" : "Send from Gmail"}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* PROPOSAL */}
        {tab === "proposal" && (
          <section className="space-y-3">
            {loading ? (
              <p className="text-xs text-muted-foreground">Loading proposal...</p>
            ) : proposals.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No proposal built for this client yet.</p>
            ) : (
              proposals.map((p) => {
                const signed = agreements.find((a) => a.proposal_slug === p.slug);
                const url = `${window.location.origin}/proposal/${p.slug}`;
                return (
                  <div key={p.id} className="border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-sans text-xs text-foreground">
                          {[p.first_name, p.last_name].filter(Boolean).join(" ") || p.slug}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {[p.event_type, p.event_date, p.venue].filter(Boolean).join(" · ")}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {p.sent_at ? `Sent ${fmtDate(p.sent_at)}` : "Not sent yet"} · {p.view_count} view{p.view_count === 1 ? "" : "s"}
                          {p.last_viewed_at ? ` · last ${fmtDate(p.last_viewed_at)}` : ""}
                        </p>
                      </div>
                      <span className={`font-sans text-[9px] tracking-[0.1em] uppercase shrink-0 ${signed ? "text-emerald-500" : "text-accent"}`}>
                        {signed ? "Signed" : p.sent_at ? "Sent" : "Draft"}
                      </span>
                    </div>

                    {signed && (
                      <p className="text-[10px] text-muted-foreground mt-2">
                        {signed.tier_name}{signed.tier_price ? ` · ${signed.tier_price}` : ""} · signed {fmtDate(signed.signed_at)} by {signed.client_name}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-2.5">
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 font-sans text-[10px] tracking-[0.1em] uppercase text-accent hover:text-accent/80 transition-colors"
                      >
                        <ExternalLink size={11} /> Open proposal
                      </a>
                      <button
                        onClick={() => { navigator.clipboard.writeText(url); toast.success("Proposal link copied"); }}
                        className="flex items-center gap-1.5 font-sans text-[10px] tracking-[0.1em] uppercase text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Copy size={11} /> Copy link
                      </button>
                    </div>

                    <div className="border-t border-border mt-3 pt-3">
                      <iframe
                        src={url}
                        title={`Proposal ${p.slug}`}
                        className="w-full h-[480px] border border-border bg-background"
                        loading="lazy"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </section>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ClientContextPanel;
