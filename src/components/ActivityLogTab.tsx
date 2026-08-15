import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Activity, RefreshCw, Sparkles, Send, CheckCircle2, X, Edit3, Eye, MousePointerClick, MessageSquare, Mail, User, ChevronLeft, ListPlus } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import AIDraftModal, { type AIDraftContext } from "@/components/AIDraftModal";

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
  const [view, setView] = useState<"timeline" | "by_contact">("by_contact");
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [draftCtx, setDraftCtx] = useState<AIDraftContext | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/drafts-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ adminPassword, action: "log_list", action_type: filter || undefined, limit: 500 }),
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

  const filtered = useMemo(() => {
    let list = entries;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(e =>
        (e.contact_email || "").toLowerCase().includes(s) ||
        (e.contact_name || "").toLowerCase().includes(s) ||
        (e.subject || "").toLowerCase().includes(s));
    }
    if (selectedContact) list = list.filter(e => e.contact_email === selectedContact);
    return list;
  }, [entries, search, selectedContact]);

  // Group by contact for the bucket view
  const contactGroups = useMemo(() => {
    const map = new Map<string, { email: string; name: string | null; deal_id: string | null; entries: LogEntry[]; lastAt: string; counts: Record<string, number> }>();
    for (const e of filtered) {
      if (!e.contact_email) continue;
      const g = map.get(e.contact_email) || { email: e.contact_email, name: e.contact_name, deal_id: e.deal_id, entries: [], lastAt: e.occurred_at, counts: {} };
      g.entries.push(e);
      if (e.contact_name && !g.name) g.name = e.contact_name;
      if (e.deal_id && !g.deal_id) g.deal_id = e.deal_id;
      if (e.occurred_at > g.lastAt) g.lastAt = e.occurred_at;
      g.counts[e.action_type] = (g.counts[e.action_type] || 0) + 1;
      map.set(e.contact_email, g);
    }
    return Array.from(map.values()).sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  }, [filtered]);

  const openDraftFor = (g: { email: string; name: string | null; deal_id: string | null; entries: LogEntry[] }) => {
    const lastReply = g.entries.find(e => e.action_type === "reply_received");
    const opens = g.entries.filter(e => e.action_type === "email_opened").length;
    const clicks = g.entries.filter(e => e.action_type === "email_clicked").length;
    setDraftCtx({
      contact_email: g.email,
      contact_name: g.name,
      deal_id: g.deal_id,
      engagement_summary: `${opens} open${opens === 1 ? "" : "s"}, ${clicks} click${clicks === 1 ? "" : "s"}${lastReply ? `, replied ${formatDistanceToNow(new Date(lastReply.occurred_at), { addSuffix: true })}` : ""}`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-serif text-2xl text-foreground flex items-center gap-2">
            <Activity className="text-accent" size={20} /> Activity Log
          </h2>
          <p className="text-xs text-muted-foreground">
            Every action you take, plus every open, click, and reply, organized per contact.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex border border-border">
            <button onClick={() => { setView("by_contact"); setSelectedContact(null); }}
              className={`px-3 py-2 text-[10px] uppercase tracking-wider ${view === "by_contact" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              By Contact
            </button>
            <button onClick={() => { setView("timeline"); setSelectedContact(null); }}
              className={`px-3 py-2 text-[10px] uppercase tracking-wider ${view === "timeline" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              Timeline
            </button>
          </div>
          <button onClick={load}
            className="px-3 py-2 border border-border text-[10px] uppercase tracking-wider hover:bg-muted/20 flex items-center gap-1">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
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

      {/* Per-contact selected timeline */}
      {selectedContact && (
        <button onClick={() => setSelectedContact(null)}
          className="flex items-center gap-1 text-xs text-accent hover:underline">
          <ChevronLeft size={14} /> Back to all contacts
        </button>
      )}

      {loading ? (
        <div className="p-12 text-center text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center border border-border bg-muted/10">
          <Activity className="mx-auto text-muted-foreground mb-2" size={28} />
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        </div>
      ) : view === "by_contact" && !selectedContact ? (
        // Contact bucket view
        <div className="space-y-2">
          {contactGroups.map(g => {
            const opens = g.counts.email_opened || 0;
            const clicks = g.counts.email_clicked || 0;
            const sent = (g.counts.email_sent || 0) + (g.counts.email_sent_gmail || 0);
            const replies = g.counts.reply_received || 0;
            const drafts = g.counts.draft_generated || 0;
            return (
              <div key={g.email} className="border border-border bg-background hover:border-accent/30 transition-colors">
                <div className="p-3 flex items-start sm:items-center gap-3 flex-wrap">
                  <div className="shrink-0 w-9 h-9 bg-muted/30 border border-border flex items-center justify-center">
                    <User size={14} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{g.name || g.email.split("@")[0]}</p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(g.lastAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{g.email}</p>
                    <div className="flex gap-1 flex-wrap text-[10px] mt-1.5">
                      {sent > 0 && <span className="px-2 py-0.5 border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">{sent} sent</span>}
                      {opens > 0 && <span className="px-2 py-0.5 border border-sky-500/30 bg-sky-500/10 text-sky-300">{opens} open{opens === 1 ? "" : "s"}</span>}
                      {clicks > 0 && <span className="px-2 py-0.5 border border-rose-500/30 bg-rose-500/10 text-rose-300">{clicks} click{clicks === 1 ? "" : "s"}</span>}
                      {replies > 0 && <span className="px-2 py-0.5 border border-orange-500/30 bg-orange-500/10 text-orange-300">{replies} repl{replies === 1 ? "y" : "ies"}</span>}
                      {drafts > 0 && <span className="px-2 py-0.5 border border-purple-500/30 bg-purple-500/10 text-purple-300">{drafts} draft{drafts === 1 ? "" : "s"}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 w-full sm:w-auto">
                    <button onClick={() => openDraftFor(g)}
                      className="flex-1 sm:flex-none min-h-[40px] px-3 py-2 bg-accent text-accent-foreground text-[10px] uppercase tracking-wider hover:bg-accent/80 flex items-center justify-center gap-1">
                      <Sparkles size={12} /> Draft
                    </button>
                    <button onClick={() => setSelectedContact(g.email)}
                      className="flex-1 sm:flex-none min-h-[40px] px-3 py-2 border border-border text-[10px] uppercase tracking-wider hover:bg-muted/20 flex items-center justify-center gap-1">
                      <ListPlus size={12} /> View
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Flat timeline (either "timeline" view OR a per-contact drill-in)
        <div className="border border-border">
          {selectedContact && (() => {
            const g = contactGroups[0];
            if (!g) return null;
            return (
              <div className="p-3 border-b border-border bg-muted/10 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-sm font-medium">{g.name || g.email.split("@")[0]}</p>
                  <p className="text-[10px] text-muted-foreground">{g.email} · {g.entries.length} events</p>
                </div>
                <button onClick={() => openDraftFor(g)}
                  className="px-3 py-1.5 bg-accent text-accent-foreground text-[10px] uppercase tracking-wider hover:bg-accent/80 flex items-center gap-1">
                  <Sparkles size={10} /> Draft Follow-Up
                </button>
              </div>
            );
          })()}
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
                      <button onClick={() => { setView("by_contact"); setSelectedContact(e.contact_email!); }}
                        className="text-xs text-foreground truncate hover:text-accent text-left">
                        {e.contact_name ? `${e.contact_name} · ` : ""}{e.contact_email}
                      </button>
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

      <AIDraftModal
        open={!!draftCtx}
        onClose={() => { setDraftCtx(null); load(); }}
        adminPassword={adminPassword}
        context={draftCtx}
      />
    </div>
  );
}
