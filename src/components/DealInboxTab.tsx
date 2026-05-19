import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Mail, Flame, RefreshCw, Send, Calendar as CalIcon, CheckCircle2, XCircle, ChevronRight } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface Props {
  storedPassword: string;
}

interface Deal {
  id: string;
  contact_name: string | null;
  contact_email: string;
  company: string | null;
  stage: string;
  event_type: string | null;
  event_date: string | null;
  last_inbound_at: string | null;
  hot_signal: boolean;
  hot_reason: string | null;
  gmail_thread_id: string | null;
  calendar_event_id: string | null;
  deal_value: number | null;
  source: string | null;
}

interface Thread {
  id: string;
  gmail_thread_id: string;
  subject: string;
  snippet: string;
  last_message_at: string;
  last_inbound_at: string | null;
  message_count: number;
}

interface Msg {
  id: string;
  thread_id: string;
  direction: "inbound" | "outbound";
  from_email: string;
  to_email: string;
  subject: string;
  snippet: string;
  body_text: string;
  sent_at: string;
}

interface Activity {
  id: string;
  type: string;
  title: string;
  body: string | null;
  occurred_at: string;
}

const DealInboxTab = ({ storedPassword }: Props) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [calSyncing, setCalSyncing] = useState(false);
  const [filter, setFilter] = useState<"all" | "hot" | "replies">("hot");
  const [selected, setSelected] = useState<Deal | null>(null);
  const [threadData, setThreadData] = useState<{ threads: Thread[]; messages: Msg[]; activity: Activity[] } | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [availDate, setAvailDate] = useState("");
  const [availResult, setAvailResult] = useState<{ available: boolean; busy: any[] } | null>(null);

  const call = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/newsletter-admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({ action, adminPassword: storedPassword, ...payload }),
    });
    if (!r.ok) throw new Error("Request failed");
    return r.json();
  }, [storedPassword]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await call("get_deal_inbox");
      setDeals(res.deals || []);
    } catch {
      toast.error("Failed to load inbox");
    } finally {
      setLoading(false);
    }
  }, [call]);

  useEffect(() => { load(); }, [load]);

  const openDeal = async (d: Deal) => {
    setSelected(d);
    setThreadData(null);
    setReply("");
    try {
      const res = await call("get_deal_threads", { deal_id: d.id });
      setThreadData({ threads: res.threads, messages: res.messages, activity: res.activity });
    } catch {
      toast.error("Failed to load thread");
    }
  };

  const syncGmail = async () => {
    setSyncing(true);
    try {
      const res = await call("trigger_gmail_sync", selected ? { deal_id: selected.id } : {});
      toast.success(`Synced ${res.synced || 0} deals`);
      await load();
      if (selected) await openDeal(selected);
    } catch {
      toast.error("Gmail sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const syncCalendar = async () => {
    setCalSyncing(true);
    try {
      const res = await call("trigger_calendar_sync");
      toast.success(`Calendar: ${res.linked || 0} linked · ${res.created || 0} new · ${res.postShowQueued || 0} post-show queued`);
      await load();
    } catch {
      toast.error("Calendar sync failed");
    } finally {
      setCalSyncing(false);
    }
  };

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    const latestThread = threadData?.threads?.[0];
    setSending(true);
    try {
      const res = await call("send_gmail_reply", {
        deal_id: selected.id,
        to: selected.contact_email,
        subject: latestThread?.subject ? `Re: ${latestThread.subject.replace(/^Re:\s*/i, "")}` : `Following up`,
        body_text: reply,
        gmail_thread_id: latestThread?.gmail_thread_id || selected.gmail_thread_id || undefined,
      });
      if (res.error) throw new Error(res.error);
      toast.success("Sent via Gmail");
      setReply("");
      await openDeal(selected);
      await load();
    } catch (e) {
      toast.error(`Send failed: ${e}`);
    } finally {
      setSending(false);
    }
  };

  const checkAvail = async () => {
    if (!availDate) return;
    try {
      const res = await call("check_availability", { date: availDate });
      setAvailResult(res);
    } catch {
      toast.error("Availability check failed");
    }
  };

  const filtered = deals.filter(d => {
    if (filter === "hot") return d.hot_signal || d.last_inbound_at;
    if (filter === "replies") return !!d.last_inbound_at;
    return true;
  });

  const hotCount = deals.filter(d => d.hot_signal || d.last_inbound_at).length;
  const replyCount = deals.filter(d => d.last_inbound_at).length;

  return (
    <div className="space-y-6">
      {/* Header + sync */}
      <div className="flex flex-wrap items-center justify-between gap-3 border border-border p-4">
        <div>
          <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-accent">Deal Inbox · Gmail + Calendar</h3>
          <p className="text-[10px] text-muted-foreground mt-1">{hotCount} hot · {replyCount} with replies · {deals.length} total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={syncGmail} disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-accent-foreground text-xs tracking-wider uppercase rounded hover:bg-accent/90 disabled:opacity-50">
            <RefreshCw size={12} className={syncing ? "animate-spin" : ""} /> Sync Gmail
          </button>
          <button onClick={syncCalendar} disabled={calSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-xs tracking-wider uppercase rounded hover:bg-muted/20 disabled:opacity-50">
            <CalIcon size={12} className={calSyncing ? "animate-spin" : ""} /> Sync Calendar
          </button>
        </div>
      </div>

      {/* Availability mini-widget */}
      <div className="border border-border p-4">
        <h4 className="font-sans text-xs tracking-[0.2em] uppercase text-accent mb-3">Availability Check</h4>
        <div className="flex flex-wrap gap-2 items-center">
          <input type="date" value={availDate} onChange={e => { setAvailDate(e.target.value); setAvailResult(null); }}
            className="bg-background border border-border px-3 py-1.5 text-sm rounded" />
          <button onClick={checkAvail} disabled={!availDate}
            className="px-3 py-1.5 bg-accent text-accent-foreground text-xs uppercase tracking-wider rounded disabled:opacity-50">Check</button>
          {availResult && (
            <div className={`flex items-center gap-1.5 text-sm ${availResult.available ? "text-emerald-500" : "text-rose-500"}`}>
              {availResult.available ? <><CheckCircle2 size={14}/> Free all day</> : <><XCircle size={14}/> {availResult.busy.length} conflict(s)</>}
            </div>
          )}
        </div>
        {availResult && !availResult.available && (
          <ul className="mt-2 text-xs text-muted-foreground space-y-1">
            {availResult.busy.map((b, i) => (
              <li key={i}>· {new Date(b.start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} – {new Date(b.end).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {(["hot", "replies", "all"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 text-[11px] tracking-wider uppercase rounded border ${filter === f ? "border-accent text-accent bg-accent/10" : "border-border text-muted-foreground"}`}>
            {f === "hot" ? `🔥 Hot (${hotCount})` : f === "replies" ? `📬 Replied (${replyCount})` : `All (${deals.length})`}
          </button>
        ))}
      </div>

      {/* Two-pane layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* List */}
        <div className="border border-border max-h-[600px] overflow-y-auto">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-xs">No deals match this filter.</p>
          ) : (
            filtered.map(d => (
              <button key={d.id} onClick={() => openDeal(d)}
                className={`w-full text-left p-3 border-b border-border hover:bg-muted/10 transition-colors ${selected?.id === d.id ? "bg-muted/20" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {d.hot_signal && <Flame size={12} className="text-rose-500 shrink-0" />}
                      <span className="text-sm text-foreground truncate">{d.contact_name || d.contact_email}</span>
                      {d.calendar_event_id && <CalIcon size={11} className="text-emerald-500 shrink-0" />}
                      {d.gmail_thread_id && <Mail size={11} className="text-accent shrink-0" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{d.contact_email}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {d.stage} · {d.event_type || "—"}{d.event_date ? ` · ${d.event_date}` : ""}
                    </p>
                    {d.hot_reason && <p className="text-[10px] text-rose-400 mt-0.5">{d.hot_reason}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    {d.last_inbound_at && (
                      <p className="text-[10px] text-accent">↩ {new Date(d.last_inbound_at).toLocaleDateString()}</p>
                    )}
                    <ChevronRight size={12} className="text-muted-foreground inline" />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Thread view */}
        <div className="border border-border p-4 max-h-[600px] overflow-y-auto">
          {!selected ? (
            <p className="text-center text-muted-foreground py-12 text-xs">Select a deal to view email thread + activity.</p>
          ) : !threadData ? (
            <p className="text-center text-muted-foreground py-8 text-xs">Loading thread…</p>
          ) : (
            <div className="space-y-4">
              <div>
                <h4 className="font-serif text-lg text-foreground">{selected.contact_name || selected.contact_email}</h4>
                <p className="text-xs text-muted-foreground">{selected.contact_email} · {selected.stage}</p>
              </div>

              {threadData.messages.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No email history with this contact yet. Click "Sync Gmail" above to pull messages.</p>
              ) : (
                <div className="space-y-3">
                  {threadData.messages.slice().reverse().map(m => (
                    <div key={m.id} className={`border-l-2 pl-3 py-1 ${m.direction === "inbound" ? "border-accent" : "border-muted"}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] tracking-wider uppercase text-muted-foreground">
                          {m.direction === "inbound" ? `← ${m.from_email}` : `→ ${m.to_email}`}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{new Date(m.sent_at).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-foreground mt-1 font-medium">{m.subject}</p>
                      <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-6">{m.body_text || m.snippet}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply box */}
              <div className="border-t border-border pt-3">
                <textarea value={reply} onChange={e => setReply(e.target.value)}
                  rows={4} placeholder="Write a reply (sent from scott.syme@whiterabbitla.com via Gmail)…"
                  className="w-full bg-background border border-border px-3 py-2 text-sm rounded resize-none focus:outline-none focus:border-accent" />
                <div className="flex justify-end mt-2">
                  <button onClick={sendReply} disabled={sending || !reply.trim()}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-accent text-accent-foreground text-xs tracking-wider uppercase rounded hover:bg-accent/90 disabled:opacity-50">
                    <Send size={12} /> {sending ? "Sending…" : "Send from Gmail"}
                  </button>
                </div>
              </div>

              {/* Activity */}
              {threadData.activity.length > 0 && (
                <div className="border-t border-border pt-3">
                  <h5 className="font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">Activity</h5>
                  <ul className="space-y-1">
                    {threadData.activity.map(a => (
                      <li key={a.id} className="text-[11px] text-muted-foreground flex justify-between gap-2">
                        <span className="truncate">{a.title}</span>
                        <span className="shrink-0">{new Date(a.occurred_at).toLocaleDateString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DealInboxTab;
