import { useCallback, useEffect, useMemo, useState } from "react";
import { ClientName } from "@/components/admin/ClientFileContext";
import { toast } from "sonner";
import { RefreshCw, Send, Mail, X } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const BATCH_CAP = 40;

interface Candidate {
  id: string;
  name: string | null;
  email: string;
  event_type: string | null;
  created_at: string;
}

interface SendResult {
  id: string;
  email: string;
  status: string;
  reason?: string;
}

const daysAgo = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);

const agoLabel = (iso: string) => {
  const d = daysAgo(iso);
  if (d < 60) return `${d} days ago`;
  const m = Math.round(d / 30);
  return m < 18 ? `${m} months ago` : `${(d / 365).toFixed(1)} years ago`;
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const ReengageTab = ({ storedPassword }: { storedPassword: string }) => {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [rows, setRows] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [preview, setPreview] = useState<{ subject: string; html: string; to: string } | null>(null);
  const [results, setResults] = useState<SendResult[] | null>(null);

  const call = useCallback(
    async (action: string, payload: Record<string, unknown> = {}) => {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/newsletter-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ action, adminPassword: storedPassword, ...payload }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Request failed");
      return j;
    },
    [storedPassword],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const j = await call("get_reengage_candidates");
      setRows(j.candidates || []);
      setSelected(new Set());
    } catch (e) {
      toast.error((e as Error).message);
    }
    setLoading(false);
  }, [call]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedRows = useMemo(() => rows.filter((r) => selected.has(r.id)), [rows, selected]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openConfirm = async () => {
    if (selectedRows.length === 0) return;
    setPreview(null);
    setResults(null);
    setConfirmOpen(true);
    try {
      const j = await call("preview_reengage", { id: selectedRows[0].id });
      setPreview({ subject: j.subject, html: j.html, to: j.to });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const doSend = async () => {
    setSending(true);
    try {
      const j = await call("send_reengage", { ids: selectedRows.slice(0, BATCH_CAP).map((r) => r.id) });
      setResults(j.results || []);
      toast.success(`${j.sent} sent, ${j.skipped} skipped, ${j.failed} failed`);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    }
    setSending(false);
  };

  const sendTest = async () => {
    setSending(true);
    try {
      await call("send_reengage", { testEmail: "scott.syme@whiterabbitla.com" });
      toast.success("Test sent to scott.syme@whiterabbitla.com. Nobody was marked.");
    } catch (e) {
      toast.error((e as Error).message);
    }
    setSending(false);
  };

  const overCap = selectedRows.length > BATCH_CAP;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-serif text-foreground">Re-engage</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Old inquiries that never received a proposal. Nothing sends until you confirm.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs uppercase tracking-wider border border-border rounded min-h-[44px]"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            onClick={() => void sendTest()}
            disabled={sending}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs uppercase tracking-wider border border-border rounded min-h-[44px] disabled:opacity-50"
          >
            <Mail className="w-3.5 h-3.5" /> Send test to me
          </button>
          <button
            onClick={() => void openConfirm()}
            disabled={selectedRows.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs uppercase tracking-wider bg-accent text-accent-foreground rounded min-h-[44px] disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" /> Send to {selectedRows.length} selected
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3 text-xs">
        <button onClick={() => setSelected(new Set(rows.map((r) => r.id)))} className="underline text-muted-foreground">
          Select all
        </button>
        <button onClick={() => setSelected(new Set())} className="underline text-muted-foreground">
          Clear
        </button>
        <span className="text-muted-foreground">
          {selectedRows.length} of {rows.length} selected
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nobody is waiting. Everyone eligible has already been contacted.</p>
      ) : (
        <div className="border border-border rounded divide-y divide-border">
          {rows.map((r) => (
            <label key={r.id} className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/20">
              <input
                type="checkbox"
                checked={selected.has(r.id)}
                onChange={() => toggle(r.id)}
                className="mt-1 w-5 h-5 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <ClientName email={r.email} name={r.name} className="text-sm text-foreground font-medium">{r.name || "No name"}</ClientName>
                  <span className="text-xs text-muted-foreground break-all">{r.email}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {r.event_type || "Event type not given"} · inquired {fmtDate(r.created_at)} · {agoLabel(r.created_at)}
                </div>
              </div>
            </label>
          ))}
        </div>
      )}

      {confirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-background border border-border rounded max-w-2xl w-full my-8">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-serif text-lg text-foreground">
                Send to {Math.min(selectedRows.length, BATCH_CAP)} {selectedRows.length === 1 ? "person" : "people"}
              </h3>
              <button onClick={() => setConfirmOpen(false)} className="p-2">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {overCap && (
                <p className="text-sm text-destructive">
                  You selected {selectedRows.length}. A single batch is capped at {BATCH_CAP}, so only the first{" "}
                  {BATCH_CAP} will be sent. Run it again for the rest.
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                First few: {selectedRows.slice(0, 5).map((r) => r.name || r.email).join(", ")}
                {selectedRows.length > 5 ? `, and ${selectedRows.length - 5} more` : ""}
              </p>

              {results ? (
                <div className="text-xs space-y-1 max-h-64 overflow-y-auto">
                  {results.map((r) => (
                    <div key={r.id} className="flex justify-between gap-2">
                      <span className="break-all text-muted-foreground">{r.email}</span>
                      <span className={r.status === "sent" ? "text-accent" : "text-destructive"}>
                        {r.status}
                        {r.reason ? ` · ${r.reason}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              ) : preview ? (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    As {preview.to} would receive it · <span className="text-foreground">{preview.subject}</span>
                  </p>
                  <iframe
                    title="Email preview"
                    srcDoc={preview.html}
                    className="w-full h-80 border border-border rounded bg-white"
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Rendering preview…</p>
              )}
            </div>

            <div className="flex justify-end gap-2 p-4 border-t border-border">
              <button onClick={() => setConfirmOpen(false)} className="px-4 py-2 text-xs uppercase tracking-wider border border-border rounded min-h-[44px]">
                {results ? "Close" : "Cancel"}
              </button>
              {!results && (
                <button
                  onClick={() => void doSend()}
                  disabled={sending || !preview}
                  className="px-4 py-2 text-xs uppercase tracking-wider bg-accent text-accent-foreground rounded min-h-[44px] disabled:opacity-40"
                >
                  {sending ? "Sending…" : `Yes, send ${Math.min(selectedRows.length, BATCH_CAP)}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReengageTab;
