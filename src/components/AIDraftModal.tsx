import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Send, ListPlus, RefreshCw, X, Loader2, AlertTriangle } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface DraftRow {
  id: string;
  variant_index: number;
  angle: string | null;
  subject: string;
  body: string;
  status: string;
  ai_meta?: any;
}

export interface AIDraftContext {
  contact_email: string;
  contact_name?: string | null;
  company?: string | null;
  vertical?: string | null;
  source?: string | null;
  deal_id?: string | null;
  gmail_thread_id?: string | null;
  engagement_summary?: string | null;
  notes?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  adminPassword: string;
  context: AIDraftContext | null;
  onSent?: () => void;
}

// 7-day freshness window used by both modal and review queue.
export const FRESH_DRAFT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export default function AIDraftModal({ open, onClose, adminPassword, context, onSent }: Props) {
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [active, setActive] = useState(0);
  const [steer, setSteer] = useState("");
  const [hadThread, setHadThread] = useState<boolean | null>(null);
  const [loadedFresh, setLoadedFresh] = useState(false);

  const callFn = async (fn: string, payload: any) => {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({ adminPassword, ...payload }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
    return data;
  };

  const loadFreshDrafts = async (): Promise<DraftRow[]> => {
    if (!context?.contact_email) return [];
    const since = new Date(Date.now() - FRESH_DRAFT_WINDOW_MS).toISOString();
    try {
      const data = await callFn("drafts-admin", {
        action: "list",
        status: ["draft"],
        contact_email: context.contact_email.toLowerCase(),
        since,
      });
      const rows: DraftRow[] = (data.drafts || []).filter((d: any) => d.status === "draft");
      // Keep only the latest generation
      if (rows.length === 0) return [];
      const latestGen = rows[0].generation_id ?? null;
      const same = latestGen ? rows.filter((r: any) => r.generation_id === latestGen) : rows;
      return same.sort((a: any, b: any) => (a.variant_index ?? 0) - (b.variant_index ?? 0));
    } catch {
      return [];
    }
  };

  const generate = async (extraHint?: string) => {
    if (!context) return;
    setLoading(true);
    try {
      const data = await callFn("ai-draft-reply", { ...context, user_hint: extraHint || steer || undefined });
      setDrafts(data.drafts || []);
      setActive(0);
      setLoadedFresh(false);
      setHadThread(!!data.thread_context?.hadPriorThread);
      toast.success(`Generated ${data.drafts?.length || 0} variants${data.thread_context?.hadPriorThread ? " (with thread context)" : ""}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  // On open: load existing fresh drafts first; only auto-generate if none exist.
  useEffect(() => {
    if (!open || !context) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const existing = await loadFreshDrafts();
      if (cancelled) return;
      if (existing.length > 0) {
        setDrafts(existing);
        setActive(0);
        setLoadedFresh(true);
        setHadThread(null);
        setLoading(false);
      } else {
        setLoading(false);
        await generate();
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, context?.contact_email]);

  const current = drafts[active];
  const needsTouch = !!current?.ai_meta?.needs_personal_touch;

  const updateField = (field: "subject" | "body", value: string) => {
    setDrafts(prev => prev.map((d, i) => i === active ? { ...d, [field]: value } : d));
  };

  const saveEdits = async () => {
    if (!current) return;
    try {
      await callFn("drafts-admin", { action: "update", id: current.id, subject: current.subject, body: current.body });
    } catch (e) {
      toast.error("Save failed");
    }
  };

  const sendNow = async () => {
    if (!current) return;
    if (!confirm(`Send this email to ${context?.contact_email} from scott.syme@whiterabbitla.com?\n\nSubject: ${current.subject}`)) return;
    setLoading(true);
    try {
      await callFn("drafts-admin", { action: "send", id: current.id, subject: current.subject, body: current.body });
      toast.success("Sent ✓ (your edits were used)");
      onSent?.();
      onClose();
      setDrafts([]); setSteer("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed");
    } finally {
      setLoading(false);
    }
  };

  const approveQueue = async () => {
    if (!current) return;
    setLoading(true);
    try {
      await callFn("drafts-admin", { action: "update", id: current.id, subject: current.subject, body: current.body });
      await callFn("drafts-admin", { action: "approve", id: current.id });
      toast.success("Queued in Follow-Ups");
      onClose();
      setDrafts([]); setSteer("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Queue failed");
    } finally {
      setLoading(false);
    }
  };

  const close = () => { onClose(); setDrafts([]); setSteer(""); setActive(0); setLoadedFresh(false); };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="max-w-3xl bg-background border-border">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl flex items-center gap-2">
            <Sparkles size={18} className="text-accent" />
            AI Follow-Up Draft
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            To {context?.contact_name || context?.contact_email}{context?.company ? ` · ${context.company}` : ""}
            {hadThread !== null && <span className="ml-2 text-accent/80">{hadThread ? "· thread context loaded" : "· first-touch"}</span>}
            {loadedFresh && <span className="ml-2 text-emerald-400/80">· loaded existing fresh drafts</span>}
          </p>
        </DialogHeader>

        {loading && drafts.length === 0 ? (
          <div className="py-16 text-center">
            <Loader2 className="animate-spin mx-auto mb-3 text-accent" size={28} />
            <p className="text-sm text-muted-foreground">Loading drafts…</p>
          </div>
        ) : drafts.length === 0 ? (
          <div className="py-12 text-center">
            <button onClick={() => generate()} className="px-4 py-2 bg-accent text-accent-foreground text-sm uppercase tracking-wider">Generate Drafts</button>
          </div>
        ) : (
          <div className="space-y-3">
            {needsTouch && (
              <div className="flex items-start gap-2 border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-300">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span><span className="font-semibold uppercase tracking-wider">Needs personal touch</span> — the AI had no strong specific hook. Review and add a real detail before sending.</span>
              </div>
            )}

            {/* Variant tabs */}
            <div className="flex gap-1 border-b border-border">
              {drafts.map((d, i) => (
                <button key={d.id} onClick={() => setActive(i)}
                  className={`px-3 py-2 text-[11px] uppercase tracking-wider transition-colors ${i === active ? "bg-accent/20 text-accent border-b-2 border-accent" : "text-muted-foreground hover:text-foreground"}`}>
                  V{i + 1} {d.angle ? `· ${d.angle}` : ""}
                </button>
              ))}
            </div>

            {current && (
              <>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Subject</label>
                  <input value={current.subject} onChange={e => updateField("subject", e.target.value)} onBlur={saveEdits}
                    className="w-full bg-muted/20 border border-border px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Body — editable</label>
                  <textarea value={current.body} onChange={e => updateField("body", e.target.value)} onBlur={saveEdits} rows={12}
                    className="w-full bg-muted/20 border border-border px-3 py-2 text-sm font-sans leading-relaxed focus:outline-none focus:border-accent resize-y" />
                </div>
              </>
            )}

            {/* Steer + regenerate */}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Steer the regenerate (optional)</label>
                <input value={steer} onChange={e => setSteer(e.target.value)} placeholder="e.g. shorter, more direct, reference Gravitas, push the calendar link"
                  className="w-full bg-muted/20 border border-border px-3 py-2 text-xs focus:outline-none focus:border-accent" />
              </div>
              <button onClick={() => generate()} disabled={loading}
                className="px-3 py-2 bg-muted/30 text-foreground border border-border text-[10px] uppercase tracking-wider hover:bg-muted/50 disabled:opacity-50 flex items-center gap-1">
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Regenerate
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-border">
              <button onClick={sendNow} disabled={loading || !current}
                className="flex-1 bg-accent text-accent-foreground py-3 text-xs tracking-[0.2em] uppercase hover:bg-accent/80 disabled:opacity-50 flex items-center justify-center gap-2">
                <Send size={14} /> Send Now
              </button>
              <button onClick={approveQueue} disabled={loading || !current}
                className="flex-1 bg-muted/30 text-foreground border border-border py-3 text-xs tracking-[0.2em] uppercase hover:bg-muted/50 disabled:opacity-50 flex items-center justify-center gap-2">
                <ListPlus size={14} /> Queue for Approval
              </button>
              <button onClick={close} className="px-4 py-3 text-muted-foreground hover:text-foreground text-xs uppercase tracking-wider"><X size={14} /></button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">Sends from scott.syme@whiterabbitla.com via your Gmail — threaded & logged to the deal.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
