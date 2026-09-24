import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft, Mail, RefreshCw, Send, Loader2, BadgeDollarSign, BellOff, FileText, ExternalLink, Copy,
  CalendarClock, FileSignature, Phone, Plus, History,
} from "lucide-react";
import { getAdminPassword } from "@/lib/adminAuth";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const INVOICE_FN = `${SUPABASE_URL}/functions/v1/invoice-api`;

/* Mirrors the senders' rules (proposal-followup, invoice-reminders). Read-only. */
const FOLLOWUP_OFFSETS = [2, 5, 7];
const MAX_INITIAL_REMINDERS = 4;
const BALANCE_DAYS_OUT = [7, 3, 0];
const MIN_HOURS_BETWEEN = 20;

export interface ContextDeal {
  id: string;
  contact_email: string;
  contact_name: string | null;
  company: string | null;
  stage: string;
  event_type: string | null;
  event_date: string | null;
  location: string | null;
  phone?: string | null;
  gmail_thread_id?: string | null;
}

export interface ClientTarget {
  email: string;
  name?: string | null;
  dealId?: string | null;
  /** Folder to open first (e.g. from the Today screen). */
  folder?: "payments" | "email" | "documents" | "correspondence" | "proposal" | null;
}

interface ThreadMessage {
  id: string; direction: string; from_email: string | null; to_email: string | null;
  subject: string | null; snippet: string | null; body_text: string | null; sent_at: string;
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
  stripe_payment_intent_id: string | null;
  deposit_paid_at: string | null;
  paid_in_full_at: string | null;
  sent_at: string | null;
  initial_reminders_sent: number | null;
  last_reminder_at: string | null;
  balance_reminders_sent: number | null;
  last_balance_reminder_at: string | null;
  created_at: string;
}

interface Proposal {
  id: string; slug: string; first_name: string | null; last_name: string | null;
  recipient_email: string | null; event_type: string | null; event_date: string | null; venue: string | null;
  sent_at: string | null; created_at: string; view_count: number; last_viewed_at: string | null;
  followup_step: number | null; last_followup_at: string | null; followup_paused: boolean | null; hold_until: string | null;
}

interface Agreement {
  id: string; proposal_id: string | null; proposal_slug: string | null; tier_name: string; tier_price: string | null;
  client_name: string; agreement_text: string; signed_at: string; signer_ip: string | null;
}

interface Inquiry {
  id: string; name: string | null; phone: string | null; event_type: string | null; date?: string | null;
  event_date?: string | null; location?: string | null; message?: string | null; description?: string | null; created_at: string;
}

interface LogRow { id: string; campaign_id: string; campaign_subject: string | null; sent_at: string; status: string }

interface ClientFile {
  deal: ContextDeal | null;
  inquiries: Inquiry[];
  consultations: Inquiry[];
  known: { name: string | null; phone: string | null; company: string | null };
  invoices: Invoice[];
  proposals: Proposal[];
  agreements: Agreement[];
  emailLog: LogRow[];
}

const METHODS = [
  { value: "cash", label: "Cash" }, { value: "check", label: "Check" }, { value: "venmo", label: "Venmo" },
  { value: "zelle", label: "Zelle" }, { value: "wire", label: "Wire" }, { value: "other", label: "Other" },
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

const toDate = (d: string) => new Date(d.length <= 10 ? `${d}T12:00:00` : d);
const fmtDate = (d: string | null) =>
  d ? toDate(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;
const fmtDay = (d: Date) => d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
const ymd = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (iso: string, days: number) => new Date(new Date(iso).getTime() + days * 864e5);
const parseEvent = (s: string | null) => {
  if (!s) return null;
  const d = toDate(s);
  return isNaN(d.getTime()) ? null : d;
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Turn a send-log campaign id into plain words. */
const campaignLabel = (r: LogRow) => {
  if (r.campaign_subject) return `Newsletter: “${r.campaign_subject}”`;
  const id = r.campaign_id;
  let m = id.match(/^([a-z]+)20\d\d-/i);
  if (m) return `${cap(m[1])} campaign`;
  m = id.match(/^inquiry-followup-(\d+)$/);
  if (m) return `Inquiry follow-up ${Number(m[1]) + 1} of 3`;
  m = id.match(/^inquiry-nurture-(\d+)$/);
  if (m) return `Inquiry nurture email ${Number(m[1]) + 1}`;
  m = id.match(/^post-show-(\d+)$/);
  if (m) return `After-show email ${Number(m[1]) + 1} of 4`;
  m = id.match(/^(?:(.+)-)?pulse-(\d+)$/);
  if (m) return `${m[1] ? `${cap(m[1])} ` : ""}newsletter ${m[2]}`;
  m = id.match(/^(.+)-step-(\d+)$/);
  if (m) return `${cap(m[1].replace(/[-_]/g, " "))} series, email ${Number(m[2]) + 1}`;
  return cap(id.replace(/[-_]/g, " "));
};

type TabKey = "payments" | "email" | "documents" | "correspondence" | "proposal";

interface Props {
  /** Pipeline passes the deal it already has; everywhere else passes a target by email. */
  deal?: ContextDeal | null;
  target?: ClientTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditDeal?: (deal: ContextDeal) => void;
  /** @deprecated auth now comes from the shared admin session. */
  adminPassword?: string;
}

const folderBtn = "flex items-center justify-center sm:justify-start gap-1.5 px-3 min-h-[44px] font-sans text-[11px] tracking-[0.12em] uppercase border transition-colors";
const smallBtn = "inline-flex items-center gap-1.5 min-h-[40px] font-sans text-[11px] tracking-[0.1em] uppercase transition-colors";

const ClientContextPanel = ({ deal: dealProp, target, open, onOpenChange, onEditDeal }: Props) => {
  const email = (dealProp?.contact_email || target?.email || "").toLowerCase().trim();
  const [file, setFile] = useState<ClientFile | null>(null);
  const [createdDeal, setCreatedDeal] = useState<ContextDeal | null>(null);
  const [tab, setTab] = useState<TabKey | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
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
  const [pdfBusy, setPdfBusy] = useState<string | null>(null);

  const deal: ContextDeal | null = dealProp || createdDeal || file?.deal || null;
  const invoices = file?.invoices || [];
  const proposals = file?.proposals || [];
  const agreements = file?.agreements || [];

  const callAdmin = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/newsletter-admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({ action, adminPassword: getAdminPassword(), ...payload }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }, []);

  const callInvoice = useCallback(async (action: string, body: Record<string, unknown>) => {
    const pw = getAdminPassword();
    const res = await fetch(`${INVOICE_FN}?action=${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(pw ? { "x-admin-password": pw } : {}) },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }, []);

  const loadFile = useCallback(async () => {
    if (!email) return null;
    const res = (await callAdmin("get_client_file", { email })) as ClientFile;
    setFile(res);
    return res;
  }, [callAdmin, email]);

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
    if (!open || !email) return;
    let cancelled = false;
    setLoading(true);
    setTab(target?.folder ?? null);
    setFile(null);
    setCreatedDeal(null);
    setMessages([]);
    setExpanded({});
    setReply("");
    setOpenForm(null);
    (async () => {
      try {
        const f = await loadFile();
        const d = dealProp || f?.deal;
        if (d && !cancelled) {
          const msgs = await loadThread(d.id);
          // Never show a blank conversation for a client who may have real history.
          if (!cancelled && msgs.length === 0) await syncGmail(d.id, true);
        }
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : "Failed to load client file");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, email, dealProp?.id]);

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
      await callInvoice("mark_paid", { id: inv.id, amount_cents: Math.round(dollars * 100), method, note: note || undefined });
      toast.success("Payment recorded");
      setOpenForm(null);
      await loadFile();
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
      await loadFile();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update");
    } finally {
      setBusy(false);
    }
  };

  const createDeal = async () => {
    if (!file) return;
    const inq = file.inquiries[0] || file.consultations[0];
    setBusy(true);
    try {
      const res = await callAdmin("create_deal", {
        deal: {
          contact_email: email,
          contact_name: target?.name || file.known.name || inq?.name || null,
          company: file.known.company || null,
          phone: file.known.phone || inq?.phone || null,
          event_type: inq?.event_type || null,
          event_date: inq?.event_date || null,
          location: inq?.location || null,
          stage: "new",
          source: "client_file",
        },
      });
      setCreatedDeal(res.deal);
      toast.success("Deal created");
      await loadFile();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create deal");
    } finally {
      setBusy(false);
    }
  };

  const downloadPdf = async (a: Agreement) => {
    setPdfBusy(a.id);
    try {
      const res = await callAdmin("agreement_pdf", { agreement_id: a.id });
      const bin = atob(res.pdf_base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = res.filename || "agreement.pdf";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not build the PDF");
    } finally {
      setPdfBusy(null);
    }
  };

  /* ---------- Email activity: sent + scheduled ---------- */
  const emailActivity = useMemo(() => {
    const sent: { key: string; at: string | null; label: string }[] = [];
    for (const r of file?.emailLog || []) {
      sent.push({ key: `log-${r.id}`, at: r.sent_at, label: campaignLabel(r) + (r.status && r.status !== "sent" ? ` (${r.status})` : "") });
    }
    for (const p of proposals) {
      const step = p.followup_step || 0;
      const which = proposals.length > 1 && p.sent_at ? ` (proposal sent ${fmtDate(p.sent_at)})` : "";
      if (step > 0 && !p.last_followup_at) {
        // Marked complete when the follow-up system launched; nothing was actually sent.
        sent.push({ key: `pf-${p.id}-none`, at: p.sent_at, label: `No proposal follow-ups sent${which}: this proposal went out before automatic follow-ups began` });
        continue;
      }
      for (let i = 1; i <= Math.min(step, 3); i++) {
        sent.push({
          key: `pf-${p.id}-${i}`,
          at: i === step ? p.last_followup_at : null,
          label: `Proposal follow-up ${i} of 3${which}`,
        });
      }
    }
    for (const inv of invoices) {
      const n = inv.initial_reminders_sent || 0;
      for (let i = 1; i <= n; i++) sent.push({ key: `ir-${inv.id}-${i}`, at: i === n ? inv.last_reminder_at : null, label: `Invoice reminder ${i}` });
      const b = inv.balance_reminders_sent || 0;
      for (let i = 1; i <= b; i++) sent.push({ key: `br-${inv.id}-${i}`, at: i === b ? inv.last_balance_reminder_at : null, label: `Balance reminder ${i} of 3` });
    }
    sent.sort((a, b) => {
      if (a.at && b.at) return b.at.localeCompare(a.at);
      if (a.at) return -1;
      if (b.at) return 1;
      return b.label.localeCompare(a.label);
    });

    const next: { key: string; label: string; due: Date | null; note?: string }[] = [];
    const now = new Date();
    const today = ymd(now);
    const signedIds = new Set(agreements.map((a) => a.proposal_id).filter(Boolean));
    const signedSlugs = new Set(agreements.map((a) => a.proposal_slug).filter(Boolean));
    for (const p of proposals) {
      const step = p.followup_step || 0;
      if (!p.sent_at || step >= 3) continue;
      if (signedIds.has(p.id) || signedSlugs.has(p.slug)) continue;
      const ev = parseEvent(p.event_date);
      if (ev && ev.getTime() < now.getTime()) continue;
      if (p.followup_paused) { next.push({ key: `pf-${p.id}`, label: `Proposal follow-up ${step + 1} of 3`, due: null, note: "Paused for this proposal" }); continue; }
      let due: Date;
      if (step === 2 && p.hold_until) due = toDate(p.hold_until);
      else due = addDays(p.sent_at, FOLLOWUP_OFFSETS[step]);
      if (p.last_followup_at) {
        const gap = new Date(new Date(p.last_followup_at).getTime() + MIN_HOURS_BETWEEN * 36e5);
        if (gap > due) due = gap;
      }
      if (ymd(due) < today) due = now;
      next.push({ key: `pf-${p.id}`, label: `Proposal follow-up ${step + 1} of 3`, due });
    }
    for (const inv of invoices) {
      if (inv.client_emails_paused) continue;
      if (inv.status === "open" && !inv.pending_session_id) {
        const n = inv.initial_reminders_sent || 0;
        const anchor = inv.last_reminder_at || inv.sent_at;
        if (n < MAX_INITIAL_REMINDERS && anchor) {
          let due = new Date(new Date(anchor).getTime() + MIN_HOURS_BETWEEN * 36e5);
          if (due < now) due = now;
          next.push({ key: `ir-${inv.id}`, label: `Invoice reminder ${n + 1}`, due });
        }
      }
      if (inv.status === "deposit_paid" && inv.event_date) {
        const b = inv.balance_reminders_sent || 0;
        const ev = toDate(inv.event_date);
        if (b < BALANCE_DAYS_OUT.length && ymd(ev) >= today) {
          let due = new Date(ev.getTime() - BALANCE_DAYS_OUT[b] * 864e5);
          if (inv.last_balance_reminder_at) {
            const gap = new Date(new Date(inv.last_balance_reminder_at).getTime() + MIN_HOURS_BETWEEN * 36e5);
            if (gap > due) due = gap;
          }
          if (due < now) due = now;
          next.push({ key: `br-${inv.id}`, label: `Balance reminder ${b + 1} of 3`, due });
        }
      }
    }
    next.sort((a, b) => (a.due?.getTime() ?? Infinity) - (b.due?.getTime() ?? Infinity));
    return { sent, next };
  }, [file, proposals, invoices, agreements]);

  if (!email) return null;

  const pausedInvoices = invoices.filter((i) => i.client_emails_paused);
  const inquiry = file?.inquiries[0] || file?.consultations[0] || null;
  const displayName = deal?.contact_name || target?.name || file?.known.name || inquiry?.name || email;
  const phone = deal?.phone || file?.known.phone || inquiry?.phone || null;

  const TABS: { key: TabKey; label: string; icon: typeof Mail; count?: number }[] = [
    { key: "payments", label: "Payments", icon: BadgeDollarSign, count: invoices.length },
    { key: "email", label: "Email activity", icon: CalendarClock, count: emailActivity.sent.length },
    { key: "documents", label: "Documents", icon: FileSignature, count: agreements.length },
    ...(deal ? [{ key: "correspondence" as TabKey, label: "Correspondence", icon: Mail, count: messages.length }] : []),
    { key: "proposal", label: "Proposal", icon: FileText, count: proposals.length },
  ];

  const pauseToggle = (inv: Invoice) => (
    <label className="flex items-center gap-2 min-h-[40px] text-xs text-muted-foreground cursor-pointer">
      <input type="checkbox" checked={!!inv.client_emails_paused} disabled={busy} onChange={() => togglePause(inv)} className="h-4 w-4 accent-current" />
      Pause client emails{invoices.length > 1 ? ` (${inv.tier_name || "invoice"})` : ""}
    </label>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-3xl bg-background border-border h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[92vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6 gap-4">
        <DialogHeader className="text-left space-y-1 min-w-0">
          <button
            onClick={() => onOpenChange(false)}
            className="self-start flex items-center gap-1.5 min-h-[40px] font-sans text-[11px] tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <DialogTitle className="font-serif text-xl break-words pr-8">{displayName}</DialogTitle>
          <p className="text-xs text-muted-foreground break-words">
            {[email, deal?.company || file?.known.company, deal ? deal.stage : "No deal yet"].filter(Boolean).join(" · ")}
          </p>
        </DialogHeader>

        {loading && !file ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Loading client file...</p>
        ) : (
          <>
            {pausedInvoices.length > 0 && (
              <section className="border border-accent bg-accent/10 p-3 space-y-1">
                <p className="font-sans text-sm text-accent flex items-center gap-2"><BellOff size={16} /> Automated emails paused for this client</p>
                {pausedInvoices.map((inv) => <div key={inv.id}>{pauseToggle(inv)}</div>)}
              </section>
            )}

            {/* CLIENT DETAILS */}
            <section className="border border-border p-4 space-y-2">
              <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-accent mb-1">Client details</p>
              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-y-2 gap-x-4 text-sm">
                {(deal
                  ? [
                      ["Name", deal.contact_name || "-"], ["Email", deal.contact_email], ["Phone", phone || "-"],
                      ["Company", deal.company || "-"], ["Stage", deal.stage], ["Event", deal.event_type || "-"],
                      ["Date", fmtDate(deal.event_date) || "-"], ["Location", deal.location || "-"],
                    ]
                  : [
                      ["Name", displayName], ["Email", email], ["Phone", phone || "-"],
                      ["Event", inquiry?.event_type || "-"], ["Date", inquiry?.date || fmtDate(inquiry?.event_date || null) || "-"],
                      ["Location", inquiry?.location || "-"],
                    ]
                ).map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <p className="text-[9px] tracking-[0.1em] uppercase text-muted-foreground">{label}</p>
                    <p className="text-foreground break-words">{value}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-x-5">
                <button onClick={() => { navigator.clipboard.writeText(email); toast.success("Email copied"); }} className={`${smallBtn} text-muted-foreground hover:text-foreground`}>
                  <Copy size={13} /> Copy email
                </button>
                {phone && (
                  <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className={`${smallBtn} text-accent`}><Phone size={13} /> Call</a>
                )}
              </div>
              {!deal && inquiry && (inquiry.message || inquiry.description) && (
                <div className="border-t border-border pt-2">
                  <p className="text-[9px] tracking-[0.1em] uppercase text-muted-foreground">What they wrote · {fmtDate(inquiry.created_at)}</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap break-words mt-1">{inquiry.message || inquiry.description}</p>
                </div>
              )}
            </section>

            {deal ? (
              onEditDeal && (
                <button
                  onClick={() => { onOpenChange(false); onEditDeal(deal); }}
                  className="w-full border border-border min-h-[44px] font-sans text-[11px] tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors"
                >
                  Edit deal details
                </button>
              )
            ) : (
              <button
                onClick={createDeal}
                disabled={busy || !file}
                className="w-full flex items-center justify-center gap-2 bg-accent text-accent-foreground min-h-[48px] font-sans text-xs tracking-[0.15em] uppercase hover:bg-accent/80 disabled:opacity-50 transition-colors"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create deal
              </button>
            )}

            {/* FOLDERS */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(active ? null : t.key)}
                    className={`${folderBtn} ${active ? "border-accent text-accent bg-accent/5" : "border-border text-muted-foreground hover:text-foreground"}`}
                  >
                    <Icon size={14} /> <span className="truncate">{t.label}</span>
                    {t.count ? <span className="text-[10px] opacity-70">({t.count})</span> : null}
                  </button>
                );
              })}
            </div>

            {/* PAYMENTS */}
            {tab === "payments" && (
              <section className="space-y-3">
                <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-accent flex items-center gap-1.5"><BadgeDollarSign size={12} /> Payments</p>
                {invoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No invoice raised for this client yet.</p>
                ) : invoices.map((inv) => {
                  const remaining = Math.max(inv.total_cents - inv.amount_paid_cents, 0);
                  const settled = inv.status === "paid";
                  const isStripe = !inv.payment_method || inv.payment_method === "stripe";
                  const stripeUrl = isStripe && inv.stripe_payment_intent_id ? `https://dashboard.stripe.com/payments/${inv.stripe_payment_intent_id}` : null;
                  const depositAmt = Math.round(inv.total_cents * (inv.deposit_percent || 0) / 100);
                  const history: { at: string; text: string }[] = [
                    { at: inv.created_at, text: `Invoice created for ${money(inv.total_cents)}` },
                  ];
                  if (inv.sent_at) history.push({ at: inv.sent_at, text: "Invoice sent to the client" });
                  if (inv.deposit_paid_at) history.push({ at: inv.deposit_paid_at, text: `Deposit received: ${money(inv.paid_in_full_at ? depositAmt : inv.amount_paid_cents)} by ${methodLabel(inv.payment_method)}` });
                  if (inv.paid_in_full_at) history.push({ at: inv.paid_in_full_at, text: `Paid in full: ${money(inv.deposit_paid_at ? Math.max(inv.total_cents - depositAmt, 0) : inv.total_cents)} by ${methodLabel(inv.payment_method)}` });
                  history.sort((a, b) => b.at.localeCompare(a.at));
                  return (
                    <div key={inv.id} className="border border-border p-3 space-y-3">
                      <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-sans text-sm text-foreground break-words">{inv.tier_name || "White Rabbit LA"}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{money(inv.total_cents)} total · {money(inv.amount_paid_cents)} paid</p>
                          {inv.external_note && <p className="text-xs text-muted-foreground mt-0.5 break-words">Note: {inv.external_note}</p>}
                        </div>
                        <span className={`font-sans text-[10px] tracking-[0.1em] uppercase shrink-0 ${settled ? "text-primary" : "text-accent"}`}>{statusLabel(inv)}</span>
                      </div>

                      <p className={`text-sm ${remaining > 0 && inv.status !== "canceled" ? "text-foreground" : "text-muted-foreground"}`}>
                        {inv.status === "canceled" ? "This invoice was canceled." : remaining > 0 ? `Still owed: ${money(remaining)}` : "Nothing left to pay."}
                      </p>

                      <div className="border-t border-border pt-2">
                        <p className="text-[9px] tracking-[0.1em] uppercase text-muted-foreground mb-1 flex items-center gap-1"><History size={10} /> Payment history</p>
                        <ul className="space-y-1.5">
                          {history.map((h, i) => (
                            <li key={i} className="text-sm flex flex-col min-[420px]:flex-row min-[420px]:gap-3">
                              <span className="text-muted-foreground text-xs min-[420px]:w-28 shrink-0">{fmtDate(h.at)}</span>
                              <span className="text-foreground break-words">{h.text}</span>
                            </li>
                          ))}
                        </ul>
                        {stripeUrl && (
                          <a href={stripeUrl} target="_blank" rel="noreferrer" className={`${smallBtn} text-accent`}><ExternalLink size={13} /> View in Stripe</a>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-5">
                        {!settled && inv.status !== "canceled" && (
                          <button onClick={() => (openForm === inv.id ? setOpenForm(null) : startMarkPaid(inv))} className={`${smallBtn} text-accent hover:text-accent/80`}>
                            Mark paid outside Stripe
                          </button>
                        )}
                        {pauseToggle(inv)}
                      </div>

                      {openForm === inv.id && (
                        <div className="border-t border-border pt-3 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] tracking-[0.1em] uppercase text-muted-foreground mb-1">Amount</label>
                              <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className="w-full bg-background border border-border px-2 min-h-[44px] text-base focus:outline-none focus:border-accent" />
                            </div>
                            <div>
                              <label className="block text-[9px] tracking-[0.1em] uppercase text-muted-foreground mb-1">Method</label>
                              <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full bg-background border border-border px-2 min-h-[44px] text-base focus:outline-none focus:border-accent">
                                {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[9px] tracking-[0.1em] uppercase text-muted-foreground mb-1">Note</label>
                            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional, for example a check number" className="w-full bg-background border border-border px-2 min-h-[44px] text-base focus:outline-none focus:border-accent" />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => submitMarkPaid(inv)} disabled={busy} className="flex items-center gap-1.5 bg-accent text-accent-foreground px-4 min-h-[44px] font-sans text-[11px] tracking-[0.15em] uppercase hover:bg-accent/80 disabled:opacity-50 transition-colors">
                              {busy && <Loader2 size={12} className="animate-spin" />} Record payment
                            </button>
                            <button onClick={() => setOpenForm(null)} className="border border-border px-4 min-h-[44px] font-sans text-[11px] tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>
            )}

            {/* EMAIL ACTIVITY */}
            {tab === "email" && (
              <section className="space-y-4">
                <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-accent flex items-center gap-1.5"><CalendarClock size={12} /> Email activity</p>

                <div className="border border-border p-3">
                  <p className="text-[9px] tracking-[0.1em] uppercase text-muted-foreground mb-2">Scheduled next</p>
                  {pausedInvoices.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm text-accent flex items-center gap-2"><BellOff size={14} /> Automated emails paused for this client</p>
                      {pausedInvoices.map((inv) => <div key={inv.id}>{pauseToggle(inv)}</div>)}
                    </div>
                  )}
                  {emailActivity.next.length === 0 ? (
                    <p className="text-sm text-foreground">Nothing scheduled</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {emailActivity.next.map((n) => (
                        <li key={n.key} className="text-sm text-foreground break-words">
                          Next: {n.label.charAt(0).toLowerCase() + n.label.slice(1)}
                          {n.due ? `, due ${fmtDay(n.due)}` : ""}
                          {n.note ? <span className="text-muted-foreground"> · {n.note}</span> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <p className="text-[9px] tracking-[0.1em] uppercase text-muted-foreground mb-2">Already sent</p>
                  {emailActivity.sent.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No automated emails sent to this address yet.</p>
                  ) : (
                    <ul className="divide-y divide-border border border-border">
                      {emailActivity.sent.map((s) => (
                        <li key={s.key} className="px-3 py-2.5 flex flex-col min-[420px]:flex-row min-[420px]:gap-3 text-sm">
                          <span className="text-muted-foreground text-xs min-[420px]:w-28 shrink-0">{s.at ? fmtDate(s.at) : "Earlier"}</span>
                          <span className="text-foreground break-words">{s.label}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            )}

            {/* DOCUMENTS */}
            {tab === "documents" && (
              <section className="space-y-3">
                <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-accent flex items-center gap-1.5"><FileSignature size={12} /> Documents</p>
                {agreements.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No signed agreement yet.</p>
                ) : agreements.map((a) => (
                  <div key={a.id} className="border border-border p-3 space-y-2">
                    <p className="font-sans text-sm text-foreground break-words">Signed agreement · {a.tier_name}{a.tier_price ? ` · ${a.tier_price}` : ""}</p>
                    <p className="text-xs text-muted-foreground break-words">
                      Signed {new Date(a.signed_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })} by {a.client_name}
                      {a.signer_ip ? ` · IP ${a.signer_ip}` : ""}
                    </p>
                    <div className="flex flex-wrap gap-x-5">
                      <button onClick={() => downloadPdf(a)} disabled={pdfBusy === a.id} className={`${smallBtn} text-accent disabled:opacity-50`}>
                        {pdfBusy === a.id ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />} Download agreement as PDF
                      </button>
                      {a.proposal_slug && (
                        <a href={`/proposal/${a.proposal_slug}`} target="_blank" rel="noreferrer" className={`${smallBtn} text-muted-foreground hover:text-foreground`}>
                          <ExternalLink size={13} /> Open proposal
                        </a>
                      )}
                    </div>
                    <div className="max-h-[50vh] overflow-y-auto border border-border bg-muted/10 p-3">
                      <p className="text-sm text-foreground whitespace-pre-wrap break-words leading-relaxed">{a.agreement_text}</p>
                    </div>
                  </div>
                ))}
                {agreements.length === 0 && proposals[0] && (
                  <a href={`/proposal/${proposals[0].slug}`} target="_blank" rel="noreferrer" className={`${smallBtn} text-accent`}><ExternalLink size={13} /> Open proposal</a>
                )}
              </section>
            )}

            {/* CORRESPONDENCE */}
            {tab === "correspondence" && deal && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-accent flex items-center gap-1.5"><Mail size={12} /> Conversation</p>
                  <button onClick={() => syncGmail(deal.id)} disabled={syncing} className={`${smallBtn} text-muted-foreground hover:text-foreground disabled:opacity-50`}>
                    <RefreshCw size={13} className={syncing ? "animate-spin" : ""} /> {syncing ? "Syncing" : "Sync now"}
                  </button>
                </div>
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading conversation...</p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No email history with this client in the last 90 days.</p>
                ) : (
                  <div className="space-y-3">
                    {messages.map((m) => {
                      const isOpen = !!expanded[m.id];
                      const full = m.body_text || m.snippet || "";
                      return (
                        <div key={m.id} className={`border-l-2 pl-3 py-1 min-w-0 ${m.direction === "inbound" ? "border-accent" : "border-muted"}`}>
                          <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-center justify-between gap-1">
                            <span className="text-[10px] tracking-wider uppercase text-muted-foreground break-all">
                              {m.direction === "inbound" ? `In · ${m.from_email}` : `Out · ${m.to_email}`}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{new Date(m.sent_at).toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-foreground mt-1 font-medium break-words">{m.subject}</p>
                          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap break-words">
                            {isOpen || full.length <= 600 ? full : `${full.slice(0, 600).trimEnd()}…`}
                          </p>
                          {full.length > 600 && (
                            <button onClick={() => setExpanded((p) => ({ ...p, [m.id]: !isOpen }))} className="text-xs text-accent hover:text-accent/80 min-h-[36px] transition-colors">
                              {isOpen ? "Show less" : "Show full message"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="border-t border-border mt-4 pt-3">
                  <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} placeholder="Write a reply, sent from scott.syme@whiterabbitla.com via Gmail" className="w-full bg-background border border-border px-3 py-2 text-base resize-none focus:outline-none focus:border-accent" />
                  <div className="flex justify-end mt-2">
                    <button onClick={sendReply} disabled={sending || !reply.trim()} className="flex items-center gap-1.5 bg-accent text-accent-foreground px-4 min-h-[44px] font-sans text-[11px] tracking-[0.15em] uppercase hover:bg-accent/80 disabled:opacity-50 transition-colors">
                      <Send size={13} /> {sending ? "Sending" : "Send from Gmail"}
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* PROPOSAL */}
            {tab === "proposal" && (
              <section className="space-y-3">
                {proposals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No proposal built for this client yet.</p>
                ) : proposals.map((p) => {
                  const signed = agreements.find((a) => a.proposal_id === p.id || a.proposal_slug === p.slug);
                  const url = `${window.location.origin}/proposal/${p.slug}`;
                  return (
                    <div key={p.id} className="border border-border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-sans text-sm text-foreground break-words">{[p.first_name, p.last_name].filter(Boolean).join(" ") || p.slug}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 break-words">{[p.event_type, p.event_date, p.venue].filter(Boolean).join(" · ")}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {p.sent_at ? `Sent ${fmtDate(p.sent_at)}` : "Not sent yet"} · {p.view_count} view{p.view_count === 1 ? "" : "s"}
                            {p.last_viewed_at ? ` · last ${fmtDate(p.last_viewed_at)}` : ""}
                          </p>
                        </div>
                        <span className={`font-sans text-[10px] tracking-[0.1em] uppercase shrink-0 ${signed ? "text-primary" : "text-accent"}`}>{signed ? "Signed" : p.sent_at ? "Sent" : "Draft"}</span>
                      </div>
                      {signed && (
                        <p className="text-xs text-muted-foreground mt-2 break-words">
                          {signed.tier_name}{signed.tier_price ? ` · ${signed.tier_price}` : ""} · signed {fmtDate(signed.signed_at)} by {signed.client_name}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-5 mt-1">
                        <a href={url} target="_blank" rel="noreferrer" className={`${smallBtn} text-accent hover:text-accent/80`}><ExternalLink size={13} /> Open proposal</a>
                        <button onClick={() => { navigator.clipboard.writeText(url); toast.success("Proposal link copied"); }} className={`${smallBtn} text-muted-foreground hover:text-foreground`}><Copy size={13} /> Copy link</button>
                      </div>
                      <div className="border-t border-border mt-3 pt-3">
                        <iframe src={url} title={`Proposal ${p.slug}`} className="w-full h-[60vh] sm:h-[480px] border border-border bg-background" loading="lazy" />
                      </div>
                    </div>
                  );
                })}
              </section>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ClientContextPanel;
