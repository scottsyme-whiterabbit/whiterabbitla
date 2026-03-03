import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Phone, PhoneOutgoing, Mail, ChevronDown, ChevronUp, Search, Flame, Clock, CheckCircle, TrendingUp, ClipboardList } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Google Voice dialer — opens GV app on mobile, web dialer on desktop
const gvCallUrl = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  const num = digits.length === 10 ? `+1${digits}` : `+${digits}`;
  return `https://voice.google.com/u/0/calls?a=nc,${encodeURIComponent(num)}`;
};

interface Deal {
  id: string;
  contact_email: string;
  contact_name: string | null;
  company: string | null;
  event_type: string | null;
  event_date: string | null;
  location: string | null;
  guest_count: string | null;
  deal_value: number | null;
  stage: string;
  notes: string | null;
  next_follow_up: string | null;
  source: string | null;
  created_at: string;
  outreach_status: string | null;
  last_outreach_date: string | null;
  outreach_notes: string | null;
  priority_score: number | null;
  phone: string | null;
}

interface HotWarmContact {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  source: string | null;
  drip_campaign: string;
  engagement_status: string;
  created_at: string;
  phone: string | null;
}

interface OutreachLog {
  id: string;
  contact_email: string;
  contact_name: string | null;
  action_type: string;
  notes: string | null;
  outcome: string | null;
  created_at: string;
}

interface ActionItem {
  type: "deal" | "contact";
  email: string;
  name: string | null;
  company: string | null;
  source: string;
  engagement: string;
  priority: "hot" | "warm" | "follow_up" | "new";
  priorityScore: number;
  phone?: string | null;
  deal?: Deal;
  contact?: HotWarmContact;
  lastOutreach?: OutreachLog;
  outreachStatus: string;
}

interface ActionListTabProps {
  adminPassword: string;
  onBadgeCount?: (count: number) => void;
}

const FILTERS = ["all", "hot", "new_inquiries", "follow_ups", "warm", "completed"] as const;
const FILTER_LABELS: Record<string, string> = {
  all: "ALL", hot: "🔥 HOT", new_inquiries: "📋 NEW INQUIRIES", follow_ups: "🔵 FOLLOW-UPS", warm: "🟡 WARM", completed: "✅ COMPLETED"
};

const OUTCOMES = ["connected", "left_voicemail", "no_answer", "sent", "booked", "not_interested", "follow_up"];
const ACTION_TYPES = ["call", "email", "text", "voicemail", "meeting"];

const STATUS_LABELS: Record<string, string> = {
  not_contacted: "Not Contacted",
  attempted: "Attempted",
  left_voicemail: "Left Voicemail",
  connected: "Connected",
  follow_up_scheduled: "Follow-Up Scheduled",
  booked: "Booked ✅",
  not_interested: "Not Interested ❌",
};

const formatCurrency = (cents: number | null) => {
  if (!cents) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(cents / 100);
};

const ActionListTab = ({ adminPassword, onBadgeCount }: ActionListTabProps) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [hotWarmContacts, setHotWarmContacts] = useState<HotWarmContact[]>([]);
  const [outreachLogs, setOutreachLogs] = useState<OutreachLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"priority" | "newest" | "follow_up" | "value">("priority");
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [logModal, setLogModal] = useState<{ email: string; name: string | null; dealId?: string; actionType: string } | null>(null);
  const [logForm, setLogForm] = useState({ action_type: "call", outcome: "", notes: "", follow_up_date: "" });
  const [saving, setSaving] = useState(false);

  const callAdmin = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/newsletter-admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({ action, adminPassword, ...payload }),
    });
    if (!res.ok) throw new Error((await res.json()).error || "Request failed");
    return res.json();
  }, [adminPassword]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await callAdmin("get_action_list_data");
      setDeals(res.deals || []);
      setHotWarmContacts(res.hotWarmContacts || []);
      setOutreachLogs(res.outreachLogs || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [callAdmin]);

  useEffect(() => { loadData(); }, [loadData]);

  const today = new Date().toISOString().slice(0, 10);

  const actionItems = useMemo((): ActionItem[] => {
    const dealEmails = new Set(deals.map(d => d.contact_email.toLowerCase()));
    const items: ActionItem[] = [];

    // From deals
    for (const deal of deals) {
      const email = deal.contact_email.toLowerCase();
      const lastLog = outreachLogs.find(l => l.contact_email.toLowerCase() === email);
      const isOverdue = deal.next_follow_up && deal.next_follow_up < today;
      const isToday = deal.next_follow_up === today;
      const isNew = (Date.now() - new Date(deal.created_at).getTime()) < 48 * 60 * 60 * 1000;
      const status = deal.outreach_status || "not_contacted";

      let priority: ActionItem["priority"] = "new";
      let priorityScore = 40;
      if (isOverdue || isToday) { priority = "follow_up"; priorityScore = isOverdue ? 110 : 105; }
      else if (deal.source === "contact_form" && isNew) { priority = "hot"; priorityScore = 80; }
      else if (deal.source === "contact_form") { priority = "warm"; priorityScore = 60; }

      let engagement = deal.event_type ? `${deal.event_type}` : "";
      if (deal.guest_count) engagement += `, ${deal.guest_count} guests`;
      if (deal.location) engagement += `, ${deal.location}`;
      if (deal.event_date) engagement += `, ${format(new Date(deal.event_date + "T00:00:00"), "MMM d")}`;

      items.push({
        type: "deal", email, name: deal.contact_name, company: deal.company,
        source: deal.source || "Manual", engagement, priority, priorityScore,
        phone: deal.phone,
        deal, lastOutreach: lastLog, outreachStatus: status,
      });
    }

    // From hot/warm contacts NOT in deals
    for (const c of hotWarmContacts) {
      if (dealEmails.has(c.email.toLowerCase())) continue;
      const email = c.email.toLowerCase();
      const lastLog = outreachLogs.find(l => l.contact_email.toLowerCase() === email);
      const isHot = c.engagement_status === "hot";
      items.push({
        type: "contact", email, name: c.name, company: c.company,
        source: c.drip_campaign === "planner" ? "Planner Drip" : c.drip_campaign === "resident" ? "Apartment Drip" : c.source || "Drip",
        engagement: isHot ? "Highly engaged (3+ interactions)" : "Warm (1-2 interactions)",
        priority: isHot ? "hot" : "warm",
        priorityScore: isHot ? 100 : 60,
        phone: c.phone,
        contact: c, lastOutreach: lastLog,
        outreachStatus: lastLog ? "attempted" : "not_contacted",
      });
    }

    return items;
  }, [deals, hotWarmContacts, outreachLogs, today]);

  // Badge count
  useEffect(() => {
    const needsAction = actionItems.filter(i => i.outreachStatus === "not_contacted" || i.priority === "follow_up").length;
    onBadgeCount?.(needsAction);
  }, [actionItems, onBadgeCount]);

  const filtered = useMemo(() => {
    let items = [...actionItems];
    if (filter === "hot") items = items.filter(i => i.priority === "hot");
    else if (filter === "new_inquiries") items = items.filter(i => i.outreachStatus === "not_contacted");
    else if (filter === "follow_ups") items = items.filter(i => i.priority === "follow_up");
    else if (filter === "warm") items = items.filter(i => i.priority === "warm");
    else if (filter === "completed") items = items.filter(i => i.outreachStatus === "booked" || i.outreachStatus === "not_interested");

    if (search) {
      const q = search.toLowerCase();
      items = items.filter(i => i.email.includes(q) || i.name?.toLowerCase().includes(q) || i.company?.toLowerCase().includes(q));
    }

    // Sort
    items.sort((a, b) => {
      // Always push completed/not_interested to bottom
      const aCompleted = a.outreachStatus === "booked" || a.outreachStatus === "not_interested";
      const bCompleted = b.outreachStatus === "booked" || b.outreachStatus === "not_interested";
      if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;

      if (sortBy === "priority") return b.priorityScore - a.priorityScore;
      if (sortBy === "newest") return new Date(b.deal?.created_at || b.contact?.created_at || "").getTime() - new Date(a.deal?.created_at || a.contact?.created_at || "").getTime();
      if (sortBy === "follow_up") {
        const aFu = a.deal?.next_follow_up || "9999";
        const bFu = b.deal?.next_follow_up || "9999";
        return aFu.localeCompare(bFu);
      }
      if (sortBy === "value") return (b.deal?.deal_value || 0) - (a.deal?.deal_value || 0);
      return 0;
    });
    return items;
  }, [actionItems, filter, search, sortBy]);

  const hotCount = actionItems.filter(i => i.priority === "hot").length;
  const todayCalls = actionItems.filter(i => i.priority === "follow_up").length;
  const reachedToday = outreachLogs.filter(l => l.created_at.slice(0, 10) === today).length;
  const thisWeekLogs = outreachLogs.filter(l => {
    const d = new Date(l.created_at);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo;
  }).length;

  const openLogModal = (item: ActionItem, actionType: string) => {
    setLogModal({ email: item.email, name: item.name, dealId: item.deal?.id, actionType });
    setLogForm({ action_type: actionType, outcome: "", notes: "", follow_up_date: "" });
  };

  const handleSaveLog = async () => {
    if (!logModal || !logForm.outcome) { toast.error("Select an outcome"); return; }
    setSaving(true);
    try {
      await callAdmin("log_outreach", {
        entry: {
          contact_email: logModal.email,
          contact_name: logModal.name,
          action_type: logForm.action_type,
          outcome: logForm.outcome,
          notes: logForm.notes,
          deal_id: logModal.dealId,
          follow_up_date: logForm.follow_up_date || null,
        }
      });
      toast.success("Outreach logged");

      // Sync pipeline stage
      if (logForm.outcome === "booked" && logModal.dealId) {
        if (confirm("Mark this deal as 'Booked' in the pipeline too?")) {
          await callAdmin("update_deal_stage", { dealId: logModal.dealId, stage: "booked" });
        }
      } else if (logForm.outcome === "not_interested" && logModal.dealId) {
        if (confirm("Mark this deal as 'Lost' in the pipeline?")) {
          await callAdmin("update_deal_stage", { dealId: logModal.dealId, stage: "lost" });
        }
      }

      setLogModal(null);
      loadData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const priorityBadge = (p: ActionItem["priority"]) => {
    const styles: Record<string, string> = {
      hot: "bg-red-500/20 text-red-400 border-red-500/30",
      warm: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      follow_up: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      new: "bg-muted text-muted-foreground border-border",
    };
    const labels: Record<string, string> = { hot: "🔴 HOT", warm: "🟡 WARM", follow_up: "🔵 FOLLOW-UP", new: "⚪ NEW" };
    return <span className={`text-[10px] px-2 py-0.5 border ${styles[p]} font-sans tracking-wider uppercase`}>{labels[p]}</span>;
  };

  const contactLogs = (email: string) => outreachLogs.filter(l => l.contact_email.toLowerCase() === email.toLowerCase());

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Flame, label: "Hot Leads", value: hotCount, color: "text-red-400" },
          { icon: Clock, label: "Today's Calls", value: todayCalls, color: "text-blue-400" },
          { icon: CheckCircle, label: "Reached Today", value: reachedToday, color: "text-emerald-400" },
          { icon: TrendingUp, label: "This Week", value: thisWeekLogs, color: "text-accent" },
        ].map(stat => (
          <div key={stat.label} className="border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <stat.icon size={14} className={stat.color} />
              <span className="font-sans text-[10px] tracking-[0.15em] uppercase">{stat.label}</span>
            </div>
            <p className="font-serif text-xl text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 items-center">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-[10px] font-sans tracking-[0.15em] uppercase border transition-colors ${filter === f ? "border-accent text-accent bg-accent/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
            {FILTER_LABELS[f]}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-7 pr-3 py-1.5 text-sm bg-muted/20 border border-border text-foreground focus:outline-none focus:border-accent w-48" />
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} className="px-2 py-1.5 text-[10px] font-sans tracking-wider uppercase bg-muted/20 border border-border text-foreground focus:outline-none">
          <option value="priority">Priority</option>
          <option value="newest">Newest</option>
          <option value="follow_up">Follow-up Date</option>
          <option value="value">Deal Value</option>
        </select>
      </div>

      {/* Table - Desktop */}
      <div className="hidden md:block border border-border">
        <div className="grid grid-cols-[90px_1.2fr_100px_1fr_160px_150px_130px] gap-3 bg-muted/30 border-b border-border px-4 py-2">
          {["Priority", "Contact", "Source", "Engagement", "Status", "Action", "Last Contact"].map(h => (
            <span key={h} className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">{h}</span>
          ))}
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No items match your filters</div>
        ) : (
          filtered.map(item => {
            const isExpanded = expandedEmail === item.email;
            const isBooked = item.outreachStatus === "booked";
            const isNotInterested = item.outreachStatus === "not_interested";
            const rowBg = isBooked ? "bg-emerald-500/5" : isNotInterested ? "bg-muted/30 opacity-60" : "bg-background hover:bg-muted/10";

            return (
              <div key={item.email}>
                <div className={`grid grid-cols-[90px_1.2fr_100px_1fr_160px_150px_130px] gap-3 px-4 py-3 border-b border-border items-center transition-colors ${rowBg}`}>
                  <div>{priorityBadge(item.priority)}</div>
                  <div className="min-w-0">
                    <button onClick={() => setExpandedEmail(isExpanded ? null : item.email)} className="text-left flex items-center gap-1">
                      <span className="font-sans text-sm text-foreground font-medium truncate">{item.name || item.email.split("@")[0]}</span>
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    <p className="text-[11px] text-muted-foreground truncate">{item.email}</p>
                    {item.company && <p className="text-[10px] text-muted-foreground">{item.company}</p>}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{item.source}</div>
                  <div className="text-[11px] text-muted-foreground truncate pr-2">{item.engagement}</div>
                  <div className="relative group">
                    <select
                      value={item.outreachStatus}
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        try {
                          if (item.deal) {
                            await callAdmin("log_outreach", {
                              entry: {
                                contact_email: item.email,
                                contact_name: item.name,
                                action_type: "status_update",
                                outcome: newStatus,
                                notes: `Status changed to ${STATUS_LABELS[newStatus] || newStatus}`,
                                deal_id: item.deal.id,
                              }
                            });
                            if (newStatus === "booked" && confirm("Mark this deal as 'Booked' in the pipeline too?")) {
                              await callAdmin("update_deal_stage", { dealId: item.deal.id, stage: "booked" });
                            } else if (newStatus === "not_interested" && confirm("Mark this deal as 'Lost' in the pipeline?")) {
                              await callAdmin("update_deal_stage", { dealId: item.deal.id, stage: "lost" });
                            }
                          } else {
                            await callAdmin("log_outreach", {
                              entry: {
                                contact_email: item.email,
                                contact_name: item.name,
                                action_type: "status_update",
                                outcome: newStatus,
                                notes: `Status changed to ${STATUS_LABELS[newStatus] || newStatus}`,
                              }
                            });
                          }
                          toast.success("Status updated");
                          loadData();
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Update failed");
                        }
                      }}
                      className="appearance-none bg-muted/20 border border-border text-[10px] text-foreground font-sans tracking-wider uppercase pl-2 pr-5 py-1 cursor-pointer focus:outline-none focus:border-accent hover:border-accent/50 transition-colors w-full"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 4px center' }}
                    >
                      {Object.entries(STATUS_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                    {/* Tooltip showing recent outreach history */}
                    {contactLogs(item.email).length > 0 && (
                      <div className="hidden group-hover:block absolute left-0 top-full mt-1 z-50 bg-background border border-border shadow-lg p-2 min-w-[240px]">
                        <p className="font-sans text-[9px] tracking-[0.15em] uppercase text-muted-foreground mb-1">Recent Updates</p>
                        {contactLogs(item.email).slice(0, 4).map(log => (
                          <div key={log.id} className="flex gap-2 text-[10px] py-0.5 border-b border-border/50 last:border-0">
                            <span className="text-muted-foreground w-12 shrink-0">{format(new Date(log.created_at), "MMM d")}</span>
                            <span className="text-accent w-14 shrink-0 uppercase">{log.action_type}</span>
                            <span className="text-foreground truncate">{log.notes || log.outcome || "—"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {item.phone ? (
                      <a href={gvCallUrl(item.phone)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-1 bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 text-[10px] tracking-wider uppercase hover:bg-emerald-600/30 transition-colors" title={`Call ${item.phone}`}>
                        <PhoneOutgoing size={10} /> Call
                      </a>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-1 bg-muted/20 text-muted-foreground border border-border text-[10px] tracking-wider uppercase cursor-not-allowed" title="No phone number">
                        <Phone size={10} /> No #
                      </span>
                    )}
                    <button onClick={() => openLogModal(item, "call")} className="flex items-center gap-1 px-2 py-1 bg-muted/20 text-foreground border border-border text-[10px] tracking-wider uppercase hover:bg-muted/30 transition-colors" title="Log a call">
                      <ClipboardList size={10} /> Log
                    </button>
                    <button onClick={() => openLogModal(item, "email")} className="flex items-center gap-1 px-2 py-1 bg-accent/20 text-accent border border-accent/30 text-[10px] tracking-wider uppercase hover:bg-accent/30 transition-colors">
                      <Mail size={10} /> Email
                    </button>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {item.lastOutreach ? `${format(new Date(item.lastOutreach.created_at), "MMM d")} — ${item.lastOutreach.action_type}` : "Never"}
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="bg-muted/10 border-b border-border px-6 py-4 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div><span className="text-muted-foreground text-[10px] uppercase tracking-wider block">Email</span>{item.email}</div>
                      <div><span className="text-muted-foreground text-[10px] uppercase tracking-wider block">Phone</span>{item.phone ? <a href={gvCallUrl(item.phone)} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{item.phone}</a> : "—"}</div>
                      <div><span className="text-muted-foreground text-[10px] uppercase tracking-wider block">Company</span>{item.company || "—"}</div>
                      {item.deal && (
                        <>
                          <div><span className="text-muted-foreground text-[10px] uppercase tracking-wider block">Event</span>{item.deal.event_type || "—"}</div>
                          <div><span className="text-muted-foreground text-[10px] uppercase tracking-wider block">Date</span>{item.deal.event_date ? format(new Date(item.deal.event_date + "T00:00:00"), "MMM d, yyyy") : "—"}</div>
                          <div><span className="text-muted-foreground text-[10px] uppercase tracking-wider block">Location</span>{item.deal.location || "—"}</div>
                          <div><span className="text-muted-foreground text-[10px] uppercase tracking-wider block">Guests</span>{item.deal.guest_count || "—"}</div>
                          <div><span className="text-muted-foreground text-[10px] uppercase tracking-wider block">Deal Value</span>{formatCurrency(item.deal.deal_value)}</div>
                          <div><span className="text-muted-foreground text-[10px] uppercase tracking-wider block">Pipeline Stage</span>{item.deal.stage}</div>
                        </>
                      )}
                    </div>
                    {/* Outreach History */}
                    <div>
                      <h4 className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-2">Outreach History</h4>
                      {contactLogs(item.email).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No outreach logged yet</p>
                      ) : (
                        <div className="space-y-1">
                          {contactLogs(item.email).map(log => (
                            <div key={log.id} className="flex gap-3 text-sm border-l-2 border-accent/30 pl-3 py-1">
                              <span className="text-muted-foreground text-[11px] w-16 shrink-0">{format(new Date(log.created_at), "MMM d")}</span>
                              <span className="text-[11px] uppercase tracking-wider text-accent w-16 shrink-0">{log.action_type}</span>
                              <span className="text-[11px] text-muted-foreground w-20 shrink-0">{log.outcome || "—"}</span>
                              <span className="text-[11px] text-foreground">{log.notes || ""}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2">
        {filtered.map(item => {
          const isExpanded = expandedEmail === item.email;
          return (
          <div key={item.email} className={`border border-border ${item.outreachStatus === "booked" ? "bg-emerald-500/5" : item.outreachStatus === "not_interested" ? "bg-muted/30 opacity-60" : "bg-background"}`}>
            <button onClick={() => setExpandedEmail(isExpanded ? null : item.email)} className="w-full text-left p-3">
              <div className="flex items-center justify-between mb-2">
                {priorityBadge(item.priority)}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">{STATUS_LABELS[item.outreachStatus] || item.outreachStatus}</span>
                  {isExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                </div>
              </div>
              <p className="font-sans text-sm text-foreground font-medium">{item.name || item.email.split("@")[0]}</p>
              <p className="text-[11px] text-muted-foreground">{item.email}</p>
              {item.company && <p className="text-[10px] text-muted-foreground">{item.company}</p>}
              <p className="text-[10px] text-muted-foreground mt-1">{item.engagement}</p>
            </button>

            {isExpanded && (
              <div className="border-t border-border px-3 pb-3 pt-2 space-y-3">
                {/* Quick Actions */}
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  {item.phone ? (
                    <a href={`tel:${item.phone.replace(/\D/g, "").length === 10 ? "+1" + item.phone.replace(/\D/g, "") : "+" + item.phone.replace(/\D/g, "")}`} className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 text-xs tracking-wider uppercase font-sans active:bg-emerald-600/40 touch-manipulation">
                      <Phone size={14} /> Call {item.phone}
                    </a>
                  ) : (
                    <span className="flex-1 flex items-center justify-center gap-2 py-3 bg-muted/20 text-muted-foreground border border-border text-xs tracking-wider uppercase font-sans cursor-not-allowed">
                      <Phone size={14} /> No Phone #
                    </span>
                  )}
                </div>
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  <a href={`mailto:${item.email}`} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-accent/20 text-accent border border-accent/30 text-[10px] tracking-wider uppercase font-sans active:bg-accent/40 touch-manipulation">
                    <Mail size={12} /> Email
                  </a>
                  <button onClick={() => openLogModal(item, "call")} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-muted/20 text-foreground border border-border text-[10px] tracking-wider uppercase font-sans active:bg-muted/40 touch-manipulation">
                    <ClipboardList size={12} /> Log
                  </button>
                  {item.phone && (
                    <a href={gvCallUrl(item.phone)} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600/10 text-emerald-400/70 border border-emerald-600/20 text-[10px] tracking-wider uppercase font-sans active:bg-emerald-600/30 touch-manipulation">
                      <PhoneOutgoing size={12} /> GV
                    </a>
                  )}
                </div>

                {/* Contact Details */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {item.deal?.event_type && <div><span className="text-muted-foreground text-[9px] uppercase tracking-wider block">Event</span>{item.deal.event_type}</div>}
                  {item.deal?.event_date && <div><span className="text-muted-foreground text-[9px] uppercase tracking-wider block">Date</span>{format(new Date(item.deal.event_date + "T00:00:00"), "MMM d, yyyy")}</div>}
                  {item.deal?.location && <div><span className="text-muted-foreground text-[9px] uppercase tracking-wider block">Location</span>{item.deal.location}</div>}
                  {item.deal?.guest_count && <div><span className="text-muted-foreground text-[9px] uppercase tracking-wider block">Guests</span>{item.deal.guest_count}</div>}
                  {item.deal?.deal_value && <div><span className="text-muted-foreground text-[9px] uppercase tracking-wider block">Value</span>{formatCurrency(item.deal.deal_value)}</div>}
                  <div><span className="text-muted-foreground text-[9px] uppercase tracking-wider block">Source</span>{item.source}</div>
                </div>

                {/* Outreach History */}
                {contactLogs(item.email).length > 0 && (
                  <div>
                    <p className="font-sans text-[9px] tracking-[0.15em] uppercase text-muted-foreground mb-1">Recent Outreach</p>
                    {contactLogs(item.email).slice(0, 3).map(log => (
                      <div key={log.id} className="flex gap-2 text-[10px] py-0.5 border-b border-border/50 last:border-0">
                        <span className="text-muted-foreground w-12 shrink-0">{format(new Date(log.created_at), "MMM d")}</span>
                        <span className="text-accent w-14 shrink-0 uppercase">{log.action_type}</span>
                        <span className="text-foreground truncate">{log.notes || log.outcome || "—"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          );
        })}
      </div>

      {/* Log Outreach Modal */}
      <Dialog open={!!logModal} onOpenChange={() => setLogModal(null)}>
        <DialogContent className="max-w-md bg-background border-border">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Log {logModal?.actionType === "call" ? "Call" : "Email"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1">Contact</label>
              <p className="text-sm text-foreground">{logModal?.name || logModal?.email}</p>
              <p className="text-[11px] text-muted-foreground">{logModal?.email}</p>
            </div>
            <div>
              <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1">Action Type</label>
              <select value={logForm.action_type} onChange={e => setLogForm(f => ({ ...f, action_type: e.target.value }))} className="w-full bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent">
                {ACTION_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1">Outcome *</label>
              <select value={logForm.outcome} onChange={e => setLogForm(f => ({ ...f, outcome: e.target.value }))} className="w-full bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent">
                <option value="">Select outcome...</option>
                {OUTCOMES.map(o => <option key={o} value={o}>{o.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</option>)}
              </select>
            </div>
            <div>
              <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1">Notes</label>
              <textarea value={logForm.notes} onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Spoke with assistant, call back Thursday..." className="w-full bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none" />
            </div>
            <div>
              <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1">Schedule Follow-up</label>
              <input type="date" value={logForm.follow_up_date} onChange={e => setLogForm(f => ({ ...f, follow_up_date: e.target.value }))} className="w-full bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent" />
            </div>
            <button onClick={handleSaveLog} disabled={saving} className="w-full bg-accent text-accent-foreground py-2.5 font-sans text-xs tracking-[0.2em] uppercase hover:bg-accent/80 transition-colors disabled:opacity-50">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActionListTab;
