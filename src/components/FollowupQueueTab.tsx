import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Sparkles, Send, X, Edit3, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { format } from "date-fns";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface Draft {
  id: string;
  contact_email: string;
  contact_name: string | null;
  company: string | null;
  vertical: string | null;
  angle: string | null;
  subject: string;
  body: string;
  status: string;
  variant_index: number;
  generation_id: string | null;
  gmail_thread_id: string | null;
  created_at: string;
  sent_at: string | null;
}

interface Props {
  adminPassword: string;
}

export default function FollowupQueueTab({ adminPassword }: Props) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "draft" | "approved" | "sent">("all");
  const [editing, setEditing] = useState<Draft | null>(null);
  const [editForm, setEditForm] = useState({ subject: "", body: "" });
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [batchSending, setBatchSending] = useState(false);

  const callFn = useCallback(async (action: string, payload: any = {}) => {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/drafts-admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({ adminPassword, action, ...payload }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Request failed");
    return data;
  }, [adminPassword]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const status = filter === "all" ? ["draft", "approved", "sent"] : [filter];
      const data = await callFn("list", { status });
      setDrafts(data.drafts || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [callFn, filter]);

  useEffect(() => { load(); }, [load]);

  const send = async (d: Draft) => {
    if (!confirm(`Send to ${d.contact_email}?`)) return;
    setSendingId(d.id);
    try {
      await callFn("send", { id: d.id });
      toast.success("Sent ✓");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSendingId(null);
    }
  };

  const dismiss = async (d: Draft) => {
    if (!confirm("Dismiss this draft?")) return;
    try { await callFn("dismiss", { id: d.id }); load(); } catch (e) { toast.error(String(e)); }
  };

  const approve = async (d: Draft) => {
    try { await callFn("approve", { id: d.id }); toast.success("Approved"); load(); } catch (e) { toast.error(String(e)); }
  };

  const sendAllApproved = async () => {
    const approved = drafts.filter(d => d.status === "approved");
    if (approved.length === 0) { toast.info("No approved drafts to send"); return; }
    if (!confirm(`Send ${approved.length} approved emails now?`)) return;
    setBatchSending(true);
    try {
      const res = await callFn("send_batch", { ids: approved.map(d => d.id) });
      const okCount = res.results.filter((r: any) => r.ok).length;
      toast.success(`Sent ${okCount} of ${approved.length}`);
      load();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setBatchSending(false);
    }
  };

  const openEdit = (d: Draft) => { setEditing(d); setEditForm({ subject: d.subject, body: d.body }); };
  const saveEdit = async () => {
    if (!editing) return;
    try {
      await callFn("update", { id: editing.id, subject: editForm.subject, body: editForm.body });
      toast.success("Saved");
      setEditing(null);
      load();
    } catch (e) { toast.error(String(e)); }
  };

  // Group drafts by generation (multi-variant) but show as flat list of contacts
  const grouped = (() => {
    const byContact = new Map<string, Draft[]>();
    drafts.forEach(d => {
      const key = `${d.contact_email}|${d.generation_id || d.id}`;
      if (!byContact.has(key)) byContact.set(key, []);
      byContact.get(key)!.push(d);
    });
    return Array.from(byContact.values()).sort((a, b) =>
      new Date(b[0].created_at).getTime() - new Date(a[0].created_at).getTime()
    );
  })();

  const statusColors: Record<string, string> = {
    draft: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    approved: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    sent: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    dismissed: "bg-muted/30 text-muted-foreground border-border",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-serif text-2xl text-foreground flex items-center gap-2"><Sparkles className="text-accent" size={20} /> AI Follow-Ups</h2>
          <p className="text-xs text-muted-foreground">AI-drafted, on-brand replies — edit, approve, send from scott.syme@whiterabbitla.com</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-2 border border-border text-[10px] uppercase tracking-wider hover:bg-muted/20 flex items-center gap-1">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={sendAllApproved} disabled={batchSending} className="px-3 py-2 bg-accent text-accent-foreground text-[10px] uppercase tracking-wider hover:bg-accent/80 disabled:opacity-50 flex items-center gap-1">
            {batchSending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} Send All Approved
          </button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        {(["all", "draft", "approved", "sent"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-2 text-[10px] uppercase tracking-wider transition-colors ${filter === f ? "bg-accent/20 text-accent border-b-2 border-accent" : "text-muted-foreground hover:text-foreground"}`}>
            {f} {f !== "all" && `(${drafts.filter(d => d.status === f).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted-foreground">Loading…</div>
      ) : grouped.length === 0 ? (
        <div className="p-12 text-center border border-border bg-muted/10">
          <Sparkles className="mx-auto text-muted-foreground mb-2" size={28} />
          <p className="text-sm text-muted-foreground">No drafts yet. Open the Action List and click <span className="text-accent">✨ AI Draft</span> on any contact.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map(group => {
            const first = group[0];
            return (
              <div key={first.id} className="border border-border bg-background">
                <div className="px-4 py-2 bg-muted/10 border-b border-border flex items-center justify-between flex-wrap gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{first.contact_name || first.contact_email.split("@")[0]}</p>
                    <p className="text-[10px] text-muted-foreground">{first.contact_email}{first.company ? ` · ${first.company}` : ""}{first.vertical ? ` · ${first.vertical}` : ""}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{format(new Date(first.created_at), "MMM d, h:mm a")}</p>
                </div>
                <div className="divide-y divide-border">
                  {group.map(d => (
                    <div key={d.id} className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 border text-[9px] uppercase tracking-wider ${statusColors[d.status] || ""}`}>{d.status}</span>
                          <span className="text-[10px] text-muted-foreground">V{d.variant_index + 1}{d.angle ? ` · ${d.angle}` : ""}</span>
                        </div>
                        <div className="flex gap-1">
                          {d.status !== "sent" && (
                            <button onClick={() => openEdit(d)} className="px-2 py-1 text-[10px] uppercase border border-border hover:bg-muted/30 flex items-center gap-1"><Edit3 size={10} /> Edit</button>
                          )}
                          {d.status === "draft" && (
                            <button onClick={() => approve(d)} className="px-2 py-1 text-[10px] uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 flex items-center gap-1"><CheckCircle2 size={10} /> Approve</button>
                          )}
                          {(d.status === "draft" || d.status === "approved") && (
                            <button onClick={() => send(d)} disabled={sendingId === d.id} className="px-2 py-1 text-[10px] uppercase bg-accent text-accent-foreground hover:bg-accent/80 disabled:opacity-50 flex items-center gap-1">
                              {sendingId === d.id ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />} Send
                            </button>
                          )}
                          {d.status !== "sent" && d.status !== "dismissed" && (
                            <button onClick={() => dismiss(d)} className="px-2 py-1 text-[10px] uppercase border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex items-center gap-1"><X size={10} /></button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm font-medium text-foreground">{d.subject}</p>
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">{d.body}</pre>
                      {d.sent_at && <p className="text-[10px] text-emerald-400">Sent {format(new Date(d.sent_at), "MMM d, h:mm a")}</p>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-background border border-border max-w-2xl w-full p-6 space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="font-serif text-xl">Edit Draft</h3>
            <input value={editForm.subject} onChange={e => setEditForm(f => ({ ...f, subject: e.target.value }))}
              className="w-full bg-muted/20 border border-border px-3 py-2 text-sm focus:outline-none focus:border-accent" />
            <textarea value={editForm.body} onChange={e => setEditForm(f => ({ ...f, body: e.target.value }))} rows={14}
              className="w-full bg-muted/20 border border-border px-3 py-2 text-sm focus:outline-none focus:border-accent resize-y" />
            <div className="flex gap-2">
              <button onClick={saveEdit} className="flex-1 bg-accent text-accent-foreground py-2 text-xs uppercase tracking-wider">Save</button>
              <button onClick={() => setEditing(null)} className="px-4 py-2 border border-border text-xs uppercase">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
