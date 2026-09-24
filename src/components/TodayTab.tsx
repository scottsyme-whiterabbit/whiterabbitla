import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Phone, Check, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface CallRow { id: string; name: string | null; email: string; phone: string | null; event_type: string | null; date: string | null; message: string | null; created_at: string; }
interface WaitRow { id: string; slug: string; first_name: string; last_name: string; event_type: string; event_date: string; sent_at: string; hold_until: string | null; followup_step: number; followup_paused: boolean; }
interface MoneyRow { id: string; client_name: string | null; total_cents: number; amount_paid_cents: number; status: string; event_date: string | null; created_at: string; }
interface DealRow { id: string; contact_name: string | null; contact_email: string; event_type: string | null; event_date: string; location: string | null; }

const ago = (iso: string) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)} minute${mins === 1 ? "" : "s"} ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
};
const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
const fmtDay = (ymd: string) => {
  const d = new Date(`${ymd}T12:00:00`);
  if (isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
};
const money = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

const Block = ({ title, count, loud, empty, children }: { title: string; count: number; loud?: boolean; empty: string; children: React.ReactNode }) => (
  <section className={`border ${loud ? "border-accent bg-accent/5" : "border-border"} p-4 md:p-5`}>
    <h2 className={`font-sans uppercase tracking-[0.2em] mb-3 flex items-center gap-2 ${loud ? "text-accent text-base" : "text-foreground text-sm"}`}>
      {title}
      <span className={`inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full text-xs ${count > 0 && loud ? "bg-accent text-accent-foreground" : "bg-muted/40 text-muted-foreground"}`}>{count}</span>
    </h2>
    {count === 0 ? <p className="font-sans text-sm text-muted-foreground">{empty}</p> : <div className="space-y-3">{children}</div>}
  </section>
);

const TodayTab = ({ storedPassword, onOpenMoney }: { storedPassword: string; onOpenMoney: () => void }) => {
  const [loading, setLoading] = useState(true);
  const [call, setCall] = useState<CallRow[]>([]);
  const [waiting, setWaiting] = useState<WaitRow[]>([]);
  const [owed, setOwed] = useState<MoneyRow[]>([]);
  const [upcoming, setUpcoming] = useState<DealRow[]>([]);
  const [today, setToday] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [undo, setUndo] = useState<CallRow | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const api = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/newsletter-admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({ action, adminPassword: storedPassword, ...payload }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "Request failed");
    return j;
  }, [storedPassword]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const j = await api("get_today");
      setCall(j.call || []); setWaiting(j.waiting || []); setOwed(j.money || []); setUpcoming(j.upcoming || []); setToday(j.today || "");
    } catch (e) { toast.error((e as Error).message); }
    setLoading(false);
  }, [api]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => () => { if (undoTimer.current) clearTimeout(undoTimer.current); }, []);

  const markCalled = async (row: CallRow) => {
    setCall((s) => s.filter((r) => r.id !== row.id));
    try {
      await api("mark_called", { id: row.id });
      setUndo(row);
      if (undoTimer.current) clearTimeout(undoTimer.current);
      undoTimer.current = setTimeout(() => setUndo(null), 10000);
    } catch (e) {
      toast.error((e as Error).message);
      setCall((s) => [row, ...s].sort((a, b) => b.created_at.localeCompare(a.created_at)));
    }
  };

  const undoCalled = async () => {
    const row = undo; if (!row) return;
    setUndo(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    try {
      await api("mark_called", { id: row.id, undo: true });
      setCall((s) => [row, ...s].sort((a, b) => b.created_at.localeCompare(a.created_at)));
    } catch (e) { toast.error((e as Error).message); }
  };

  const toggle = (id: string) => setOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const followLabel = (p: WaitRow) => p.followup_paused ? "Paused" : p.followup_step >= 3 ? "Follow-up complete" : `Follow-up ${p.followup_step} of 3`;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl text-foreground">Today</h2>
        <button onClick={load} disabled={loading} aria-label="Refresh" className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground">
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {undo && (
        <div className="flex items-center justify-between gap-3 border border-border bg-muted/20 px-4 py-3">
          <span className="font-sans text-sm text-foreground">Marked {undo.name || undo.email} as called.</span>
          <button onClick={undoCalled} className="font-sans text-xs tracking-[0.15em] uppercase text-accent min-h-[44px] px-3">Undo</button>
        </div>
      )}

      <Block title="Call these" count={call.length} loud empty="Nobody waiting on a call.">
        {call.map((r) => (
          <div key={r.id} className="border border-border bg-background p-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div className="min-w-0">
                <p className="font-sans text-base text-foreground">{r.name || r.email}</p>
                <p className="font-sans text-xs text-muted-foreground mt-0.5">
                  {[r.event_type, r.date].filter(Boolean).join(" · ") || "No event details"} · {ago(r.created_at)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {r.phone ? (
                <a href={`tel:${r.phone.replace(/[^\d+]/g, "")}`} className="flex items-center justify-center gap-2 bg-accent text-accent-foreground min-h-[48px] px-3 font-sans text-sm">
                  <Phone size={16} /> {r.phone}
                </a>
              ) : (
                <a href={`mailto:${r.email}`} className="flex items-center justify-center border border-border text-muted-foreground min-h-[48px] px-3 font-sans text-xs truncate">No phone · email</a>
              )}
              <button onClick={() => markCalled(r)} className="flex items-center justify-center gap-2 border border-accent text-accent min-h-[48px] px-3 font-sans text-sm tracking-wider uppercase">
                <Check size={16} /> Mark called
              </button>
            </div>
            {r.message && (
              <div className="mt-2">
                <button onClick={() => toggle(r.id)} className="flex items-center gap-1 font-sans text-xs text-muted-foreground hover:text-foreground min-h-[40px]">
                  {open.has(r.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Read what they wrote
                </button>
                {open.has(r.id) && <p className="font-sans text-sm text-foreground whitespace-pre-wrap break-words">{r.message}</p>}
              </div>
            )}
          </div>
        ))}
      </Block>

      <Block title="Waiting on them" count={waiting.length} empty="No unsigned proposals out.">
        {waiting.map((p) => {
          const expired = p.hold_until && today && p.hold_until < today;
          return (
            <a key={p.id} href={`/admin/proposals?edit=${encodeURIComponent(p.slug)}`} className="block border border-border p-4 hover:border-accent transition-colors min-h-[48px]">
              <p className="font-sans text-base text-foreground">{p.first_name} {p.last_name}</p>
              <p className="font-sans text-xs text-muted-foreground mt-0.5">{[p.event_type, p.event_date].filter(Boolean).join(" · ")}</p>
              <p className="font-sans text-xs mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                <span className="text-muted-foreground">Sent {plural(daysSince(p.sent_at), "day")} ago</span>
                <span className="text-muted-foreground">{followLabel(p)}</span>
                {p.hold_until && (expired
                  ? <span className="text-destructive/70">Hold expired</span>
                  : <span className="text-foreground">Hold expires {fmtDay(p.hold_until)}</span>)}
              </p>
            </a>
          );
        })}
      </Block>

      <Block title="Money out" count={owed.length} empty="Nothing outstanding.">
        {owed.map((i) => (
          <button key={i.id} onClick={onOpenMoney} className="w-full text-left block border border-border p-4 hover:border-accent transition-colors">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-sans text-base text-foreground truncate">{i.client_name || "Unnamed client"}</p>
              <p className="font-sans text-base text-accent whitespace-nowrap">{money(Math.max(0, i.total_cents - i.amount_paid_cents))}</p>
            </div>
            <p className="font-sans text-xs text-muted-foreground mt-1">
              {i.status === "deposit_paid" ? "Deposit paid, balance due" : "Nothing paid yet"}
              {i.event_date ? ` · Event ${fmtDay(i.event_date)}` : ""} · Invoiced {plural(daysSince(i.created_at), "day")} ago
            </p>
          </button>
        ))}
      </Block>

      <Block title="Coming up" count={upcoming.length} empty="Nothing in the next two weeks.">
        {upcoming.map((d) => (
          <div key={d.id} className="border border-border p-4">
            <p className="font-sans text-base text-foreground">{d.contact_name || d.contact_email}</p>
            <p className="font-sans text-xs text-muted-foreground mt-0.5">
              {fmtDay(d.event_date)}{d.event_type ? ` · ${d.event_type}` : ""}{d.location ? ` · ${d.location}` : ""}
            </p>
          </div>
        ))}
      </Block>
    </div>
  );
};

export default TodayTab;
