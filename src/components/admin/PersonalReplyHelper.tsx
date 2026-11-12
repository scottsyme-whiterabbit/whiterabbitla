import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Send, X } from "lucide-react";
import { REPLY_TYPES, replyBodyProblems, type ReplyType } from "@/lib/personalReply";
import { getAdminPassword } from "@/lib/adminAuth";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const PERSONAL_REPLY_SENT_EVENT = "wr:personal-reply-sent";

export async function callPersonalReply(action: string, payload: Record<string, unknown> = {}) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/personal-reply`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}` },
    body: JSON.stringify({ action, adminPassword: getAdminPassword(), ...payload }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

interface Draft {
  to: string;
  reply_type: ReplyType;
  body: string;
  thread: { found: true; subject: string } | { found: false; reason: string };
  signature_html: string;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Same layout gmail-send uses: the body, a blank line, then the Gmail signature once. */
const previewDoc = (body: string, signature: string) => `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;padding:12px;background:#ffffff;}</style></head><body><div style="font-family:Arial,Helvetica,sans-serif;color:#222;font-size:14px;line-height:1.55;">${esc(body.replace(/\s+$/, "")).replace(/\n/g, "<br>")}</div><br><div>${signature}</div></body></html>`;

const label = "font-sans text-[10px] tracking-[0.15em] uppercase";

export default function PersonalReplyHelper({ dealId, onClose, onSent }: { dealId: string; onClose: () => void; onSent: () => void }) {
  const [type, setType] = useState<ReplyType | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const requestId = useRef<string>(crypto.randomUUID());
  const frame = useRef<HTMLIFrameElement>(null);
  const [frameH, setFrameH] = useState(320);

  const problems = useMemo(() => (draft ? replyBodyProblems(body) : []), [draft, body]);
  const doc = useMemo(() => (draft ? previewDoc(body, draft.signature_html) : ""), [draft, body]);

  useEffect(() => { setConfirming(false); }, [body]);

  const choose = async (t: ReplyType) => {
    if (sending) return;
    if (draft && body !== draft.body && !window.confirm("Replace your edits with a new draft?")) return;
    setType(t); setDraft(null); setError(null); setConfirming(false); setLoading(true);
    requestId.current = crypto.randomUUID();
    try {
      const d = (await callPersonalReply("draft", { deal_id: dealId, reply_type: t })) as Draft;
      setDraft(d); setBody(d.body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not write the draft");
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    if (!draft || !type || problems.length || !draft.thread.found) return;
    setSending(true);
    try {
      await callPersonalReply("send", { deal_id: dealId, reply_type: type, body, request_id: requestId.current });
      toast.success(`Sent to ${draft.to} on the Booking Inquiry thread`);
      window.dispatchEvent(new CustomEvent(PERSONAL_REPLY_SENT_EVENT, { detail: { dealId } }));
      onSent();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Not sent");
      setConfirming(false);
    } finally {
      setSending(false);
    }
  };

  const fitFrame = () => {
    const d = frame.current?.contentDocument;
    if (!d?.body) return;
    // Wide Gmail signatures are scaled down to fit a phone, the way mail apps do.
    const over = d.documentElement.scrollWidth / Math.max(d.documentElement.clientWidth, 1);
    if (over > 1.01) (d.body.style as CSSStyleDeclaration & { zoom: string }).zoom = String(1 / over);
    const h = d.body.getBoundingClientRect().height;
    if (h) setFrameH(Math.min(Math.max(Math.ceil(h) + 32, 160), 900));
  };

  return (
    <section className="border border-accent/60 p-4 space-y-4" aria-label="Personal reply">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`${label} text-accent`}>Personal reply</p>
          <p className="text-xs text-muted-foreground mt-1">Choose a reply. You will see the whole email before anything is sent.</p>
        </div>
        <button onClick={onClose} disabled={sending} aria-label="Close personal reply" className="shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground">
          <X size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2">
        {REPLY_TYPES.map((r) => (
          <button
            key={r.key}
            onClick={() => choose(r.key)}
            disabled={loading || sending}
            aria-pressed={type === r.key}
            className={`border px-3 min-h-[48px] text-left font-sans text-sm transition-colors disabled:opacity-60 ${type === r.key ? "border-accent text-accent bg-accent/5" : "border-border text-foreground hover:border-accent"}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Writing the draft...</p>}
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

      {draft && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="min-w-0">
              <p className="text-[9px] tracking-[0.1em] uppercase text-muted-foreground">To</p>
              <p className="text-foreground break-all">{draft.to}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[9px] tracking-[0.1em] uppercase text-muted-foreground">Subject</p>
              {draft.thread.found
                ? <p className="text-foreground break-words">{draft.thread.subject}</p>
                : <p className="text-destructive break-words" role="alert">{"reason" in draft.thread ? draft.thread.reason : ""}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="personal-reply-body" className="block text-[9px] tracking-[0.1em] uppercase text-muted-foreground mb-1">Message (edit freely)</label>
            <textarea
              id="personal-reply-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              className="w-full bg-background border border-border px-3 py-2 text-base leading-relaxed focus:outline-none focus:border-accent min-h-[260px]"
            />
            {problems.length > 0 && (
              <ul className="mt-1 space-y-0.5" role="alert">
                {problems.map((p) => <li key={p} className="text-xs text-destructive">{p}</li>)}
              </ul>
            )}
          </div>

          <div>
            <p className="text-[9px] tracking-[0.1em] uppercase text-muted-foreground mb-1">What they will receive, with your Gmail signature</p>
            <iframe
              ref={frame}
              title="Email preview"
              srcDoc={doc}
              sandbox="allow-same-origin"
              onLoad={fitFrame}
              style={{ height: frameH }}
              className="w-full border border-border"
            />
          </div>

          {!confirming ? (
            <div className="flex flex-col-reverse min-[420px]:flex-row gap-2 min-[420px]:justify-end">
              <button onClick={onClose} disabled={sending} className="border border-border px-4 min-h-[48px] font-sans text-[11px] tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground">Discard</button>
              <button
                onClick={() => setConfirming(true)}
                disabled={!draft.thread.found || problems.length > 0 || sending}
                className="flex items-center justify-center gap-1.5 bg-accent text-accent-foreground px-4 min-h-[48px] font-sans text-[11px] tracking-[0.15em] uppercase hover:bg-accent/80 disabled:opacity-50"
              >
                <Send size={13} /> Send from Gmail
              </button>
            </div>
          ) : (
            <div className="border border-accent bg-accent/5 p-3 space-y-3">
              <p className="text-sm text-foreground break-words">Send this to {draft.to} on the Booking Inquiry thread?</p>
              <div className="flex flex-col-reverse min-[420px]:flex-row gap-2 min-[420px]:justify-end">
                <button onClick={() => setConfirming(false)} disabled={sending} className="border border-border px-4 min-h-[48px] font-sans text-[11px] tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground">Keep editing</button>
                <button onClick={send} disabled={sending} className="flex items-center justify-center gap-1.5 bg-accent text-accent-foreground px-4 min-h-[48px] font-sans text-[11px] tracking-[0.15em] uppercase hover:bg-accent/80 disabled:opacity-50">
                  {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} {sending ? "Sending" : "Yes, send it"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
