import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy, Loader2, Shuffle } from "lucide-react";
import { ClientName } from "@/components/admin/ClientFileContext";
import { OCCASION_OPTIONS, TIMING_OPTIONS } from "@/lib/findTheLadyPopup";
import { drawablePoolSize, quarterEnded, recentQuarters } from "@/lib/findTheLadyAdmin";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export interface LadyClaim {
  id: string;
  code: string;
  email: string;
  first_name: string;
  event_type: string | null;
  event_timing: string | null;
  found_queen: boolean;
  marketing_opt_in: boolean;
  expires_on: string;
  status: string;
  redeemed_at: string | null;
  drawing_entry: boolean;
  drawing_quarter: string | null;
  welcome_email_status: string | null;
  deal_id: string | null;
  inquiry_id: string | null;
  source: string | null;
  created_at: string;
}
export interface AltEntry { id: string; quarter: string; first_name: string; email: string; received_on: string; note: string | null }
export interface Drawing { id: string; quarter: string; winner_kind: string; winner_name: string; winner_email: string; entry_count: number; picked_at: string }

interface ListData {
  claims: LadyClaim[];
  alternates: AltEntry[];
  drawings: Drawing[];
  counts: Record<string, number>;
  currentQuarter: string;
}

const occasion = (v: string | null) => OCCASION_OPTIONS.find((o) => o.id === v)?.label ?? (v || "");
const timing = (v: string | null) => TIMING_OPTIONS.find((t) => t.id === v)?.label ?? (v || "");
const day = (iso: string | null) => (iso ? new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso).toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", year: "numeric" }) : "");
const smallBtn = "inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 text-xs uppercase tracking-[0.1em] border border-border hover:border-accent hover:text-foreground transition-colors disabled:opacity-50";
const field = "w-full bg-background border border-border px-3 min-h-[44px] text-sm text-foreground focus:outline-none focus:border-accent";

const COUNT_TILES: [string, string][] = [
  ["view", "Pop-up views"], ["play", "Games played"], ["found", "Queens found"],
  ["answered", "Question answered"], ["claimed", "Email claimed"], ["reserve_click", "Reserve my date"],
];

const FindTheLadyTab = ({ adminPassword }: { adminPassword: string }) => {
  const [data, setData] = useState<ListData | null>(null);
  const [error, setError] = useState(false);
  const [moving, setMoving] = useState<string | null>(null);
  const [quarter, setQuarter] = useState<string>("");
  const [picking, setPicking] = useState(false);
  const [alt, setAlt] = useState({ firstName: "", email: "", receivedOn: "", note: "" });
  const [savingAlt, setSavingAlt] = useState(false);

  const call = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/newsletter-admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({ action, adminPassword, ...payload }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body?.error || "Request failed");
    return body;
  }, [adminPassword]);

  const load = useCallback(async () => {
    try {
      const d = (await call("lady_list")) as ListData;
      setData(d);
      setQuarter((q) => q || recentQuarters(d.currentQuarter, 2)[1]);
    } catch { setError(true); }
  }, [call]);
  useEffect(() => { load(); }, [load]);

  const quarters = useMemo(() => (data ? recentQuarters(data.currentQuarter, 6) : []), [data]);
  const drawing = data?.drawings.find((d) => d.quarter === quarter) || null;
  const poolSize = data ? drawablePoolSize(data.claims, data.alternates, quarter) : 0;
  const ended = data ? quarterEnded(quarter, data.currentQuarter) : false;

  const moveToPipeline = async (c: LadyClaim) => {
    setMoving(c.id);
    try {
      const r = await call("lady_move_to_pipeline", { creditId: c.id });
      toast.success(r.existing ? "Linked to their open deal" : "Added to the pipeline as New");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not move this claim");
    } finally { setMoving(null); }
  };

  const pickWinner = async () => {
    if (!window.confirm(`Pick the ${quarter} winner at random from ${poolSize} ${poolSize === 1 ? "entry" : "entries"}? This can only be done once.`)) return;
    setPicking(true);
    try {
      const r = await call("lady_pick_winner", { quarter });
      toast.success(`Winner picked: ${r.drawing?.winner_name}`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not pick a winner");
    } finally { setPicking(false); }
  };

  const addAlt = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAlt(true);
    try {
      await call("lady_add_alt_entry", alt);
      toast.success("Free entry added");
      setAlt({ firstName: "", email: "", receivedOn: "", note: "" });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add the entry");
    } finally { setSavingAlt(false); }
  };

  if (error) return <p className="text-sm text-muted-foreground">The Find the Lady list could not load.</p>;
  if (!data) return <p className="text-sm text-muted-foreground">Loading Find the Lady...</p>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl text-foreground">Find the Lady</h2>
        <p className="text-sm text-muted-foreground">Everyone who claimed a code from the Find the Queen pop-up. Claims stay here and out of the pipeline until you move them.</p>
      </div>

      <section aria-label="Last 30 days">
        <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">Last 30 days</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {COUNT_TILES.map(([key, label]) => (
            <div key={key} className="border border-border p-3">
              <p className="font-serif text-2xl text-foreground">{(data.counts[key] ?? 0).toLocaleString("en-US")}</p>
              <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border border-border p-4 space-y-4" aria-label="Quarterly drawing">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="lady-quarter" className="block text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1">Drawing quarter</label>
            <select id="lady-quarter" value={quarter} onChange={(e) => setQuarter(e.target.value)} className={`${field} w-auto`}>
              {quarters.map((q) => <option key={q} value={q}>{q}{q === data.currentQuarter ? " (current)" : ""}</option>)}
            </select>
          </div>
          <p className="text-sm text-muted-foreground min-h-[44px] flex items-center">{poolSize} {poolSize === 1 ? "entry" : "entries"}</p>
        </div>
        {drawing ? (
          <p className="text-sm text-foreground">
            Winner for {drawing.quarter}: <ClientName email={drawing.winner_email} name={drawing.winner_name} className="underline underline-offset-2" />
            {" "}({drawing.winner_email}), {drawing.winner_kind === "alternate" ? "free entry" : "found the Queen"}. Picked {day(drawing.picked_at)} from {drawing.entry_count} {drawing.entry_count === 1 ? "entry" : "entries"}.
          </p>
        ) : (
          <div className="space-y-1">
            <button type="button" onClick={pickWinner} disabled={!ended || poolSize === 0 || picking} className={`${smallBtn} text-accent border-accent/50`}>
              {picking ? <Loader2 size={14} className="animate-spin" /> : <Shuffle size={14} />} Pick this quarter's winner
            </button>
            {!ended && <p className="text-xs text-muted-foreground">The {quarter} drawing opens once the quarter ends, as the Official Rules say.</p>}
            {ended && poolSize === 0 && <p className="text-xs text-muted-foreground">No entries for {quarter}.</p>}
          </div>
        )}

        <details className="border-t border-border pt-3">
          <summary className="cursor-pointer text-sm text-foreground min-h-[44px] flex items-center">Add a free entry (emailed in, no game)</summary>
          <form onSubmit={addAlt} className="grid gap-3 sm:grid-cols-2 mt-2">
            <input aria-label="First name" placeholder="First name" className={field} value={alt.firstName} onChange={(e) => setAlt({ ...alt, firstName: e.target.value })} />
            <input aria-label="Email" type="email" placeholder="Email" className={field} value={alt.email} onChange={(e) => setAlt({ ...alt, email: e.target.value })} />
            <label className="text-xs text-muted-foreground">Day the email arrived
              <input type="date" className={`${field} mt-1`} value={alt.receivedOn} onChange={(e) => setAlt({ ...alt, receivedOn: e.target.value })} />
            </label>
            <input aria-label="Note" placeholder="Note (optional)" className={`${field} self-end`} value={alt.note} onChange={(e) => setAlt({ ...alt, note: e.target.value })} />
            <button type="submit" disabled={savingAlt} className={`${smallBtn} sm:col-span-2 justify-self-start`}>
              {savingAlt && <Loader2 size={14} className="animate-spin" />} Add free entry
            </button>
          </form>
          {data.alternates.length > 0 && (
            <ul className="mt-3 text-xs text-muted-foreground space-y-1">
              {data.alternates.slice(0, 20).map((a) => <li key={a.id} className="break-words">{a.quarter}: {a.first_name}, {a.email}, received {day(a.received_on)}</li>)}
            </ul>
          )}
        </details>
      </section>

      <section aria-label="Claims">
        <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">{data.claims.length} {data.claims.length === 1 ? "claim" : "claims"}</p>
        {data.claims.length === 0 ? <p className="text-sm text-muted-foreground">No claims yet.</p> : (
          <>
            <ul className="lg:hidden divide-y divide-border border border-border">
              {data.claims.map((c) => (
                <li key={c.id} className="p-3 space-y-1 text-sm min-w-0">
                  <div className="flex flex-wrap justify-between gap-2">
                    <ClientName email={c.email} name={c.first_name} dealId={c.deal_id} className="text-foreground underline underline-offset-2" />
                    <span className="text-xs text-muted-foreground">{day(c.created_at)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground break-all">{c.email}</p>
                  <p className="text-xs text-muted-foreground break-words">{[occasion(c.event_type), timing(c.event_timing)].filter(Boolean).join(" · ")}</p>
                  <p className="text-xs text-muted-foreground break-words">
                    <span className="font-mono text-foreground">{c.code}</span> · valid until {day(c.expires_on)} · {c.found_queen ? `found the Queen${c.drawing_quarter ? `, ${c.drawing_quarter} drawing` : ""}` : "missed"} · {c.marketing_opt_in ? "opted in" : "no opt-in"} · {c.redeemed_at || c.status === "redeemed" ? "redeemed" : "not redeemed"}
                  </p>
                  <ClaimActions c={c} moving={moving === c.id} onMove={() => moveToPipeline(c)} />
                </li>
              ))}
            </ul>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm border border-border">
                <thead><tr className="text-left text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                  <th className="p-2">Name</th><th className="p-2">Email</th><th className="p-2">Occasion</th><th className="p-2">Timing</th><th className="p-2">Code</th><th className="p-2">Expires</th><th className="p-2">Opt-in</th><th className="p-2">Found</th><th className="p-2">Drawing</th><th className="p-2">Claimed</th><th className="p-2">Redeemed</th><th className="p-2">Pipeline</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {data.claims.map((c) => (
                    <tr key={c.id} className="align-top">
                      <td className="p-2"><ClientName email={c.email} name={c.first_name} dealId={c.deal_id} className="text-foreground underline underline-offset-2" /></td>
                      <td className="p-2 break-all">{c.email}</td>
                      <td className="p-2">{occasion(c.event_type)}</td>
                      <td className="p-2">{timing(c.event_timing)}</td>
                      <td className="p-2 font-mono whitespace-nowrap">{c.code}</td>
                      <td className="p-2 whitespace-nowrap">{day(c.expires_on)}</td>
                      <td className="p-2">{c.marketing_opt_in ? "Yes" : "No"}</td>
                      <td className="p-2">{c.found_queen ? "Yes" : "No"}</td>
                      <td className="p-2 whitespace-nowrap">{c.drawing_entry ? c.drawing_quarter : ""}</td>
                      <td className="p-2 whitespace-nowrap">{day(c.created_at)}</td>
                      <td className="p-2">{c.redeemed_at || c.status === "redeemed" ? "Yes" : "No"}</td>
                      <td className="p-2"><ClaimActions c={c} moving={moving === c.id} onMove={() => moveToPipeline(c)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

const ClaimActions = ({ c, moving, onMove }: { c: LadyClaim; moving: boolean; onMove: () => void }) => (
  <div className="flex flex-wrap gap-2 items-center">
    {c.deal_id
      ? <span className="text-xs text-muted-foreground">{c.inquiry_id ? "Booked via quiz" : "In pipeline"}</span>
      : (
        <button type="button" onClick={onMove} disabled={moving} className={smallBtn}>
          {moving && <Loader2 size={14} className="animate-spin" />} Move to pipeline
        </button>
      )}
    <button type="button" onClick={() => { navigator.clipboard.writeText(c.code); toast.success("Code copied"); }} className={`${smallBtn} border-transparent text-muted-foreground`} aria-label={`Copy ${c.code}`}>
      <Copy size={13} />
    </button>
  </div>
);

export default FindTheLadyTab;
