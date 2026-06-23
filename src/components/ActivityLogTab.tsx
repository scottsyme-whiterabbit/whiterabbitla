import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Activity, RefreshCw, Sparkles, Send, CheckCircle2, X, Edit3, Eye, MousePointerClick, MessageSquare, Mail } from "lucide-react";
import { format } from "date-fns";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface LogEntry {
  id: string;
  occurred_at: string;
  action_type: string;
  actor: string;
  contact_email: string | null;
  contact_name: string | null;
  deal_id: string | null;
  draft_id: string | null;
  subject: string | null;
  summary: string | null;
  metadata: any;
}

interface Props { adminPassword: string }

const TYPE_META: Record<string, { label: string; icon: any; color: string }> = {
  draft_generated:   { label: "AI Drafted",      icon: Sparkles,         color: "text-purple-300 border-purple-500/30 bg-purple-500/10" },
  draft_edited:      { label: "Draft Edited",    icon: Edit3,            color: "text-amber-300 border-amber-500/30 bg-amber-500/10" },
  draft_approved:    { label: "Approved",        icon: CheckCircle2,     color: "text-blue-300 border-blue-500/30 bg-blue-500/10" },
  draft_dismissed:   { label: "Dismissed",       icon: X,                color: "text-muted-foreground border-border bg-muted/10" },
  email_sent:        { label: "Email Sent",      icon: Send,             color: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10" },
  email_sent_gmail:  { label: "Sent via Gmail",  icon: Mail,             color: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10" },
  email_opened:      { label: "Opened",          icon: Eye,              color: "text-sky-300 border-sky-500/30 bg-sky-500/10" },
  email_clicked:     { label: "Clicked",         icon: MousePointerClick,color: "text-rose-300 border-rose-500/30 bg-rose-500/10" },
  reply_received:    { label: "Reply Received",  icon: MessageSquare,    color: "text-orange-300 border-orange-500/30 bg-orange-500/10" },
};

const FILTERS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "draft_generated", label: "Drafted" },
  { value: "draft_edited", label: "Edited" },
  { value: "draft_approved", label: "Approved" },
  { value: "email_sent", label: "Sent" },
  { value: "email_opened", label: "Opens" },
  { value: "email_clicked", label: "Clicks" },
  { value: "reply_received", label: "Replies" },
];

export default function ActivityLogTab({ adminPassword }: Props) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/drafts-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ adminPassword, action: "log_list", action_type: filter || undefined, limit: 300 }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed to load log");
      setEntries(data.entries || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [adminPassword, filter]);

  useEffect(() => { load(); }, [load]);

  const filtered = search
    ? entries.filter(e =>
        (e.contact_email || "").toLowerCase().includes(search.toLowerCase()) ||
        (e.contact_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (e.subject || "").toLowerCase().includes(search.toLowerCase()))
    : entries;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-serif text-2xl text-foreground flex items-center gap-2">
            <Activity className="text-accent" size={20} /> Activity Log
          </h2>
          <p className="text-xs text-muted-foreground">
            Every AI draft, edit, send, open, click, and reply — all in one timeline.
          </p>
        </div>
        <button onClick={load}
          className="px-3 py-2 border border-border text-[10px] uppercase tracking-wider hover:bg-muted/20 flex items-center gap-1">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex flex-wrap gap-1 border border-border">
          {FILTERS.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-wider transition-colors ${
                filter === f.value ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search email, name, subject…"
          className="bg-muted/20 border border-border px-3 py-1.5 text-xs focus:outline-none focus:border-accent flex-1 min-w-[200px]"
        />
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center border border-border bg-muted/10">
          <Activity className="mx-auto text-muted-foreground mb-2" size={28} />
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        </div>
      ) : (
        <div className="border border-border">
          {filtered.map(e => {
            const meta = TYPE_META[e.action_type] || { label: e.action_type, icon: Activity, color: "text-muted-foreground border-border bg-muted/10" };
            const Icon = meta.icon;
            return (
              <div key={e.id} className="flex gap-3 p-3 border-b border-border last:border-b-0 hover:bg-muted/5">
                <div className={`shrink-0 w-8 h-8 border ${meta.color} flex items-center justify-center`}>
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 border text-[9px] uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
                    {e.contact_email && (
                      <span className="text-xs text-foreground truncate">
                        {e.contact_name ? `${e.contact_name} · ` : ""}{e.contact_email}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground ml-auto whitespace-nowrap">
                      {format(new Date(e.occurred_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                  {e.subject && <p className="text-xs text-muted-foreground mt-0.5 truncate">{e.subject}</p>}
                  {e.summary && <p className="text-[11px] text-muted-foreground/80 mt-0.5">{e.summary}</p>}
                  {e.metadata?.link && (
                    <p className="text-[10px] text-rose-300/80 mt-0.5 truncate">→ {e.metadata.link}</p>
                  )}
                  {e.metadata?.snippet && (
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5 italic line-clamp-2">"{e.metadata.snippet}"</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
