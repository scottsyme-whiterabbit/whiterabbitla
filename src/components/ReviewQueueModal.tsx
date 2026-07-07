import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Send, SkipForward, RefreshCw, X, Loader2, AlertTriangle, Sparkles, CheckCircle2 } from "lucide-react";
import type { AIDraftContext } from "./AIDraftModal";
import { FRESH_DRAFT_WINDOW_MS } from "./AIDraftModal";

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
  generation_id?: string | null;
  contact_email: string;
}

export interface QueueContact extends AIDraftContext {
  priorityScore: number;
  priorityLabel: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  adminPassword: string;
  contacts: QueueContact[]; // pre-filtered: contacts that have fresh drafts
  onFinished?: () => void;
}

const callFn = async (adminPassword: string, fn: string, payload: any) => {
  const r = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    body: JSON.stringify({ adminPassword, ...payload }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
  return data;
};

export default function ReviewQueueModal({ open, onClose, adminPassword, contacts, onFinished }: Props) {
  const ordered = useMemo(() => [...contacts].sort((a, b) => b.priorityScore - a.priorityScore), [contacts]);
  const [idx, setIdx] = useState(0);
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [steer, setSteer] = useState("");
  const [sentCount, setSentCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [flaggedEmails, setFlaggedEmails] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const contact = ordered[idx];
  const current = drafts[active];
  const needsTouch = !!current?.ai_meta?.needs_personal_touch;

  const loadFresh = async (email: string): Promise<DraftRow[]> => {
    const since = new Date(Date.now() - FRESH_DRAFT_WINDOW_MS).toISOString();
    const data = await callFn(adminPassword, "drafts-admin", {
      action: "list", status: ["draft"], contact_email: email.toLowerCase(), since,
    });
    const rows: DraftRow[] = (data.drafts || []).filter((d: any) => d.status === "draft");
    if (rows.length === 0) return [];
    const latestGen = rows[0].generation_id ?? null;
    const same = latestGen ? rows.filter((r: any) => r.generation_id === latestGen) : rows;
    return same.sort((a: any, b: any) => (a.variant_index ?? 0) - (b.variant_index ?? 0));
  };

  useEffect(() => {
    if (!open || !contact) return;
    let cancelled = false;
    (async () => {
      setLoading(true); setDrafts([]); setActive(0); setSteer("");
      try {
        const rows = await loadFresh(contact.contact_email);
        if (cancelled) return;
        if (rows.length === 0) {
          // Contact was supposed to have fresh drafts but doesn't — skip
          setSkippedCount(c => c + 1);
          advance();
          return;
        }
        setDrafts(rows);
        if (rows.some(r => r.ai_meta?.needs_personal_touch)) {
          setFlaggedEmails(prev => prev.includes(contact.contact_email) ? prev : [...prev, contact.contact_email]);
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Load failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, idx, contact?.contact_email]);

  useEffect(() => {
    if (!open) {
      setIdx(0); setDrafts([]); setActive(0); setSteer("");
      setSentCount(0); setSkippedCount(0); setFlaggedEmails([]); setDone(false);
    }
  }, [open]);

  const advance = () => {
    if (idx + 1 >= ordered.length) {
      setDone(true);
    } else {
      setIdx(i => i + 1);
    }
  };

  const updateField = (field: "subject" | "body", value: string) => {
    setDrafts(prev => prev.map((d, i) => i === active ? { ...d, [field]: value } : d));
  };

  const saveEdits = async () => {
    if (!current) return;
    try {
      await callFn(adminPassword, "drafts-admin", { action: "update", id: current.id, subject: current.subject, body: current.body });
    } catch { /* silent */ }
  };

  const sendAndNext = async () => {
    if (!current) return;
    setSending(true);
    try {
      await callFn(adminPassword, "drafts-admin", {
        action: "send", id: current.id, subject: current.subject, body: current.body,
      });
      setSentCount(c => c + 1);
      toast.success(`Sent to ${contact.contact_email}`);
      advance();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  const skip = () => {
    setSkippedCount(c => c + 1);
    advance();
  };

  const regenerate = async () => {
    if (!contact) return;
    setLoading(true);
    try {
      const data = await callFn(adminPassword, "ai-draft-reply", { ...contact, user_hint: steer || undefined });
      const rows = (data.drafts || []).sort((a: any, b: any) => (a.variant_index ?? 0) - (b.variant_index ?? 0));
      setDrafts(rows);
      setActive(0);
      setSteer("");
      if (rows.some((r: any) => r.ai_meta?.needs_personal_touch)) {
        setFlaggedEmails(prev => prev.includes(contact.contact_email) ? prev : [...prev, contact.contact_email]);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Regenerate failed");
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    onClose();
    if (sentCount > 0) onFinished?.();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="max-w-4xl bg-background border-border max-h-[90vh] overflow-y-auto">
        {done ? (
          <div className="py-10 text-center space-y-4">
            <CheckCircle2 size={40} className="mx-auto text-emerald-400" />
            <h2 className="font-serif text-2xl">Review Queue Complete</h2>
            <div className="flex justify-center gap-8 text-sm">
              <div><p className="text-emerald-400 font-serif text-3xl">{sentCount}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sent</p></div>
              <div><p className="text-muted-foreground font-serif text-3xl">{skippedCount}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Skipped</p></div>
              <div><p className="text-amber-400 font-serif text-3xl">{flaggedEmails.length}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Flagged</p></div>
            </div>
            {flaggedEmails.length > 0 && (
              <div className="text-left max-w-md mx-auto border border-amber-500/30 bg-amber-500/5 p-3 text-[11px]">
                <p className="text-amber-300 uppercase tracking-wider text-[10px] mb-1">Needs personal touch:</p>
                {flaggedEmails.map(e => <p key={e} className="text-muted-foreground">{e}</p>)}
              </div>
            )}
            <button onClick={close} className="mt-4 px-6 py-2 bg-accent text-accent-foreground text-xs tracking-[0.2em] uppercase">Close</button>
          </div>
        ) : !contact ? (
          <div className="py-10 text-center text-muted-foreground text-sm">No contacts with fresh drafts.</div>
        ) : (
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={16} className="text-accent" />
                  <span className="font-serif text-xl">{contact.contact_name || contact.contact_email}</span>
                  <span className="text-[10px] px-2 py-0.5 border border-border tracking-wider uppercase text-muted-foreground">{contact.priorityLabel}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {contact.contact_email}{contact.company ? ` · ${contact.company}` : ""}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-serif text-2xl text-foreground">{idx + 1} <span className="text-muted-foreground text-lg">of {ordered.length}</span></p>
                <p className="text-[10px] uppercase tracking-wider text-emerald-400">{sentCount} sent · {skippedCount} skipped</p>
              </div>
            </div>

            {needsTouch && (
              <div className="flex items-start gap-2 border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-300">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span><span className="font-semibold uppercase tracking-wider">Needs personal touch</span> — AI lacked a strong hook. Edit before sending or skip.</span>
              </div>
            )}

            {loading ? (
              <div className="py-16 text-center">
                <Loader2 className="animate-spin mx-auto mb-3 text-accent" size={28} />
                <p className="text-sm text-muted-foreground">Loading drafts…</p>
              </div>
            ) : drafts.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground text-sm">No drafts available.</div>
            ) : (
              <>
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
                      <textarea value={current.body} onChange={e => updateField("body", e.target.value)} onBlur={saveEdits} rows={10}
                        className="w-full bg-muted/20 border border-border px-3 py-2 text-sm font-sans leading-relaxed focus:outline-none focus:border-accent resize-y" />
                    </div>
                  </>
                )}

                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Steer regenerate (optional)</label>
                    <input value={steer} onChange={e => setSteer(e.target.value)} placeholder="e.g. shorter, mention their venue"
                      className="w-full bg-muted/20 border border-border px-3 py-2 text-xs focus:outline-none focus:border-accent" />
                  </div>
                  <button onClick={regenerate} disabled={loading || sending}
                    className="px-3 py-2 bg-muted/30 text-foreground border border-border text-[10px] uppercase tracking-wider hover:bg-muted/50 disabled:opacity-50 flex items-center gap-1">
                    <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Regenerate
                  </button>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-3 border-t border-border">
              <button onClick={sendAndNext} disabled={sending || loading || !current}
                className="flex-1 bg-accent text-accent-foreground py-3 text-xs tracking-[0.2em] uppercase hover:bg-accent/80 disabled:opacity-50 flex items-center justify-center gap-2">
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send & Next
              </button>
              <button onClick={skip} disabled={sending}
                className="flex-1 bg-muted/30 text-foreground border border-border py-3 text-xs tracking-[0.2em] uppercase hover:bg-muted/50 disabled:opacity-50 flex items-center justify-center gap-2">
                <SkipForward size={14} /> Skip
              </button>
              <button onClick={close} className="px-4 py-3 text-muted-foreground hover:text-foreground text-xs uppercase tracking-wider" title="Close queue">
                <X size={14} />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">Sends from scott.syme@whiterabbitla.com — threaded & logged to the deal.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
