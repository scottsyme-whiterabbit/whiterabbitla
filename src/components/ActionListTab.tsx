import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Phone, PhoneOutgoing, Mail, ChevronDown, ChevronUp, Search, Flame, Clock, CheckCircle, TrendingUp, ClipboardList, Pencil, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import AIDraftModal, { type AIDraftContext } from "./AIDraftModal";

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

interface InboundLead {
  id: string;
  source_table: "contact_inquiries" | "discovery_quiz_leads" | "consultation_leads";
  name: string | null;
  email: string | null;
  phone: string | null;
  event_type: string | null;
  event_date: string | null;
  location: string | null;
  guest_count: string | null;
  budget: string | null;
  message: string | null;
  client_type: string | null;
  source: string | null;
  recommendation: string | null;
  created_at: string;
}

interface ActionItem {
  type: "deal" | "contact" | "inbound";
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
  inbound?: InboundLead;
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
  const [inboundLeads, setInboundLeads] = useState<InboundLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"priority" | "newest" | "follow_up" | "value">("priority");
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [logModal, setLogModal] = useState<{ email: string; name: string | null; dealId?: string; actionType: string } | null>(null);
  const [logForm, setLogForm] = useState({ action_type: "call", outcome: "", notes: "", follow_up_date: "" });
  const [saving, setSaving] = useState(false);
  const [editModal, setEditModal] = useState<ActionItem | null>(null);
  const [editForm, setEditForm] = useState({
    contact_name: "", contact_email: "", company: "", phone: "",
    event_type: "", event_date: "", location: "", guest_count: "",
    deal_value: "", notes: "", next_follow_up: "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [aiDraftCtx, setAiDraftCtx] = useState<AIDraftContext | null>(null);

  const openAIDraft = (item: ActionItem) => {
    setAiDraftCtx({
      contact_email: item.email,
      contact_name: item.name,
      company: item.company,
      vertical: item.deal?.event_type || item.contact?.drip_campaign || null,
      source: item.source,
      deal_id: item.deal?.id || null,
      engagement_summary: item.engagement,
      notes: item.deal?.notes || null,
    });
  };

  const openEditModal = (item: ActionItem) => {
    setEditModal(item);
    setEditForm({
      contact_name: item.name || "",
      contact_email: item.email,
      company: item.company || "",
      phone: item.phone || "",
      event_type: item.deal?.event_type || "",
      event_date: item.deal?.event_date || "",
      location: item.deal?.location || "",
      guest_count: item.deal?.guest_count || "",
      deal_value: item.deal?.deal_value ? String(item.deal.deal_value / 100) : "",
      notes: item.deal?.notes || "",
      next_follow_up: item.deal?.next_follow_up || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;
    setEditSaving(true);
    try {
      if (editModal.deal) {
        await callAdmin("update_deal", {
          deal: {
            ...editModal.deal,
            contact_name: editForm.contact_name,
            contact_email: editForm.contact_email,
            company: editForm.company,
            phone: editForm.phone,
            event_type: editForm.event_type,
            event_date: editForm.event_date || null,
            location: editForm.location,
            guest_count: editForm.guest_count,
            deal_value: editForm.deal_value ? Math.round(parseFloat(editForm.deal_value) * 100) : null,
            notes: editForm.notes,
            next_follow_up: editForm.next_follow_up || null,
          },
        });
      } else if (editModal.contact) {
        await callAdmin("update_contact", {
          contactId: editModal.contact.id,
          updates: {
            name: editForm.contact_name,
            email: editForm.contact_email,
            company: editForm.company,
            phone: editForm.phone,
          },
        });
      }
      toast.success("Contact updated");
      setEditModal(null);
      loadData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setEditSaving(false);
    }
  };

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
      const inbound: InboundLead[] = [
        ...(res.inquiries || []).map((r: Record<string, unknown>) => ({ ...r, source_table: "contact_inquiries" as const })),
        ...(res.quizLeads || []).map((r: Record<string, unknown>) => ({ ...r, source_table: "discovery_quiz_leads" as const })),
        ...(res.consultationLeads || []).map((r: Record<string, unknown>) => ({
          ...r,
          source_table: "consultation_leads" as const,
          event_date: r.event_date as string | null,
          message: r.description as string | null,
        })),
      ] as InboundLead[];
      setInboundLeads(inbound);
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

    // From inbound form leads NOT already in deals/contacts
    const existing = new Set([...dealEmails, ...hotWarmContacts.map(c => c.email.toLowerCase())]);
    for (const lead of inboundLeads) {
      if (!lead.email) continue;
      const email = lead.email.toLowerCase();
      if (existing.has(email)) continue;
      existing.add(email);
      const lastLog = outreachLogs.find(l => l.contact_email.toLowerCase() === email);
      const isNew = (Date.now() - new Date(lead.created_at).getTime()) < 48 * 60 * 60 * 1000;

      const sourceLabel =
        lead.source_table === "contact_inquiries" ? `Contact Form${lead.source && lead.source !== "contact_form" ? ` (${lead.source})` : ""}`
        : lead.source_table === "discovery_quiz_leads" ? "Discovery Quiz"
        : `Consultation${lead.source ? ` (${lead.source})` : ""}`;

      let engagement = lead.event_type || "";
      if (lead.guest_count) engagement += `${engagement ? ", " : ""}${lead.guest_count} guests`;
      if (lead.location) engagement += `${engagement ? ", " : ""}${lead.location}`;
      if (lead.event_date) {
        try { engagement += `${engagement ? ", " : ""}${format(new Date(lead.event_date + "T00:00:00"), "MMM d")}`; } catch { /* skip */ }
      }
      if (lead.message) engagement += `${engagement ? " — " : ""}"${lead.message.slice(0, 80)}${lead.message.length > 80 ? "…" : ""}"`;
      if (!engagement) engagement = "Inbound inquiry";

      items.push({
        type: "inbound",
        email,
        name: lead.name,
        company: null,
        source: sourceLabel,
        engagement,
        priority: isNew ? "hot" : "warm",
        priorityScore: isNew ? 85 : 55,
        phone: lead.phone,
        inbound: lead,
        lastOutreach: lastLog,
        outreachStatus: lastLog ? "attempted" : "not_contacted",
      });
    }

    return items;
  }, [deals, hotWarmContacts, outreachLogs, inboundLeads, today]);

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

    // Source filter
    if (sourceFilter !== "all") {
      items = items.filter(i => {
        const src = (i.source || "").toLowerCase();
        const drip = i.contact?.drip_campaign?.toLowerCase() || "";
        if (sourceFilter === "planner") return src.includes("planner") || drip === "planner";
        if (sourceFilter === "apartment") return src.includes("apartment") || src.includes("resident") || drip === "resident";
        return src.includes(sourceFilter);
      });
    }

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
      if (sortBy === "newest") return new Date(b.deal?.created_at || b.contact?.created_at || b.inbound?.created_at || "").getTime() - new Date(a.deal?.created_at || a.contact?.created_at || a.inbound?.created_at || "").getTime();
      if (sortBy === "follow_up") {
        const aFu = a.deal?.next_follow_up || "9999";
        const bFu = b.deal?.next_follow_up || "9999";
        return aFu.localeCompare(bFu);
      }
      if (sortBy === "value") return (b.deal?.deal_value || 0) - (a.deal?.deal_value || 0);
      return 0;
    });
    return items;
  }, [actionItems, filter, search, sortBy, sourceFilter]);

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

      {/* Today's Follow-Up Reminders */}
      {(() => {
        const overdue = actionItems.filter(i => i.deal?.next_follow_up && i.deal.next_follow_up < today && i.outreachStatus !== "booked" && i.outreachStatus !== "not_interested");
        const dueToday = actionItems.filter(i => i.deal?.next_follow_up === today && i.outreachStatus !== "booked" && i.outreachStatus !== "not_interested");
        if (overdue.length === 0 && dueToday.length === 0) return null;
        return (
          <div className="border border-accent/40 bg-accent/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} className="text-accent" />
              <h3 className="font-sans text-[11px] tracking-[0.2em] uppercase text-accent">Today's Follow-Ups</h3>
              <span className="font-sans text-[10px] text-muted-foreground ml-auto">{overdue.length} overdue · {dueToday.length} due today</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[...overdue, ...dueToday].slice(0, 10).map(item => {
                const isOverdue = !!(item.deal?.next_follow_up && item.deal.next_follow_up < today);
                return (
                  <div key={item.email} className="flex items-center gap-2 bg-background border border-border px-3 py-2">
                    <span className={`text-[9px] px-1.5 py-0.5 border tracking-wider uppercase shrink-0 ${isOverdue ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-blue-500/20 text-blue-400 border-blue-500/30"}`}>
                      {isOverdue ? "Overdue" : "Today"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-sans text-sm text-foreground truncate">{item.name || item.email.split("@")[0]}</p>
                      <p className="font-sans text-[10px] text-muted-foreground truncate">
                        {item.deal?.next_follow_up && format(new Date(item.deal.next_follow_up + "T00:00:00"), "MMM d")}
                        {item.deal?.event_type && ` · ${item.deal.event_type}`}
                        {item.company && ` · ${item.company}`}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {item.phone && (
                        <a href={gvCallUrl(item.phone)} target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 text-[9px] tracking-wider uppercase" title="Call">
                          <PhoneOutgoing size={10} />
                        </a>
                      )}
                      <button onClick={() => openLogModal(item, "call")} className="px-2 py-1 bg-muted/20 text-foreground border border-border text-[9px] tracking-wider uppercase" title="Log outreach">
                        <ClipboardList size={10} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Source Filter */}
      <div className="flex flex-wrap gap-2">
        {([
          { key: "all", label: "All" },
          { key: "planner", label: "Planner" },
          { key: "apartment", label: "Apartment" },
          { key: "corporate", label: "Corporate" },
          { key: "wedding", label: "Wedding" },
          { key: "clubs", label: "Clubs" },
          { key: "pr", label: "PR" },
          { key: "nonprofit", label: "Nonprofit" },
          { key: "talent", label: "Talent" },
        ]).map(opt => (
          <button key={opt.key} onClick={() => setSourceFilter(opt.key)} className={`px-3 py-1.5 text-[10px] font-sans tracking-[0.15em] uppercase border transition-colors ${sourceFilter === opt.key ? "border-accent text-accent bg-accent/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
            {opt.label}
          </button>
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
        <div className="grid grid-cols-[80px_1.3fr_90px_1.1fr_150px_220px_120px] gap-3 bg-muted/30 border-b border-border px-4 py-2">
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
                <div className={`grid grid-cols-[80px_1.3fr_90px_1.1fr_150px_220px_120px] gap-3 px-4 py-3 border-b border-border items-center transition-colors ${rowBg}`}>
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
                  <div className="grid grid-cols-4 gap-1">
                    {item.phone ? (
                      <a href={gvCallUrl(item.phone)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1 px-1.5 py-1 bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 text-[10px] tracking-wider uppercase hover:bg-emerald-600/30 transition-colors" title={`Call ${item.phone}`}>
                        <PhoneOutgoing size={10} /> Call
                      </a>
                    ) : (
                      <span className="flex items-center justify-center gap-1 px-1.5 py-1 bg-muted/20 text-muted-foreground border border-border text-[10px] tracking-wider uppercase cursor-not-allowed" title="No phone number">
                        <Phone size={10} /> No #
                      </span>
                    )}
                    <button onClick={() => openLogModal(item, "call")} className="flex items-center justify-center gap-1 px-1.5 py-1 bg-muted/20 text-foreground border border-border text-[10px] tracking-wider uppercase hover:bg-muted/30 transition-colors" title="Log a call">
                      <ClipboardList size={10} /> Log
                    </button>
                    <button onClick={() => openAIDraft(item)} className="flex items-center justify-center gap-1 px-1.5 py-1 bg-accent/20 text-accent border border-accent/30 text-[10px] tracking-wider uppercase hover:bg-accent/30 transition-colors" title="AI-draft a follow-up email">
                      <Sparkles size={10} /> AI Draft
                    </button>
                    <button onClick={() => openEditModal(item)} className="flex items-center justify-center gap-1 px-1.5 py-1 bg-muted/20 text-foreground border border-border text-[10px] tracking-wider uppercase hover:bg-muted/30 transition-colors" title="Edit contact info">
                      <Pencil size={10} /> Edit
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
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No items match your filters</div>
        ) : (
          filtered.map(item => {
            const isExpanded = expandedEmail === item.email;
            const cardBg = item.outreachStatus === "booked" ? "bg-emerald-500/5" : item.outreachStatus === "not_interested" ? "bg-muted/30 opacity-60" : "bg-background";
            return (
            <div key={item.email} className={`border border-border overflow-hidden ${cardBg}`}>
              {/* Card Header — always visible, tappable */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setExpandedEmail(isExpanded ? null : item.email);
                }}
                className="w-full text-left p-4 touch-manipulation select-none"
                style={{ WebkitTapHighlightColor: 'rgba(0,0,0,0.05)', WebkitUserSelect: 'none', minHeight: '64px' } as React.CSSProperties}
              >
                <div className="flex items-center justify-between mb-2">
                  {priorityBadge(item.priority)}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{STATUS_LABELS[item.outreachStatus] || item.outreachStatus}</span>
                    {isExpanded ? <ChevronUp size={18} className="text-accent" /> : <ChevronDown size={18} className="text-muted-foreground" />}
                  </div>
                </div>
                <p className="font-sans text-sm text-foreground font-medium">{item.name || item.email.split("@")[0]}</p>
                <p className="text-[11px] text-muted-foreground">{item.email}</p>
                {item.company && <p className="text-[10px] text-muted-foreground mt-0.5">{item.company}</p>}
                <p className="text-[10px] text-muted-foreground mt-1">{item.engagement}</p>
              </button>

              {/* Expanded Detail Panel */}
              {isExpanded && (
                <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
                  {/* Call Button — Google Voice */}
                  {item.phone ? (
                    <a
                      href={gvCallUrl(item.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-full flex items-center justify-center gap-3 py-4 bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 text-sm tracking-wider uppercase font-sans font-medium active:bg-emerald-600/40 touch-manipulation rounded-sm"
                      style={{ WebkitTapHighlightColor: 'transparent', minHeight: '52px' } as React.CSSProperties}
                    >
                      <PhoneOutgoing size={18} /> Call via Google Voice
                    </a>
                  ) : (
                    <div className="w-full flex items-center justify-center gap-2 py-4 bg-muted/20 text-muted-foreground border border-border text-sm tracking-wider uppercase font-sans cursor-not-allowed" style={{ minHeight: '52px' }}>
                      <Phone size={18} /> No Phone Number
                    </div>
                  )}

                  {/* Secondary actions row */}
                  <div className="grid grid-cols-3 gap-2">
                    {item.phone && (
                      <a
                        href={`tel:${item.phone.replace(/\D/g, "").length === 10 ? "+1" + item.phone.replace(/\D/g, "") : "+" + item.phone.replace(/\D/g, "")}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-center gap-1.5 py-3 bg-muted/20 text-foreground border border-border text-[10px] tracking-wider uppercase font-sans active:bg-muted/40 touch-manipulation"
                        style={{ minHeight: '44px' }}
                      >
                        <Phone size={14} /> Direct
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openAIDraft(item); }}
                      className="flex items-center justify-center gap-1.5 py-3 bg-accent/20 text-accent border border-accent/30 text-[10px] tracking-wider uppercase font-sans active:bg-accent/40 touch-manipulation"
                      style={{ minHeight: '44px' }}
                    >
                      <Sparkles size={14} /> AI Draft
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openLogModal(item, "call"); }}
                      className="flex items-center justify-center gap-1.5 py-3 bg-muted/20 text-foreground border border-border text-[10px] tracking-wider uppercase font-sans active:bg-muted/40 touch-manipulation"
                      style={{ minHeight: '44px' }}
                    >
                      <ClipboardList size={14} /> Log
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); openEditModal(item); }}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-muted/20 text-foreground border border-border text-[11px] tracking-wider uppercase font-sans active:bg-muted/40 touch-manipulation"
                    style={{ minHeight: '44px' }}
                  >
                    <Pencil size={14} /> Edit Contact Info
                  </button>

                  {/* Contact Details Grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground text-[9px] uppercase tracking-wider block mb-0.5">Phone</span><span className="text-foreground">{item.phone || "—"}</span></div>
                    <div><span className="text-muted-foreground text-[9px] uppercase tracking-wider block mb-0.5">Source</span><span className="text-foreground">{item.source}</span></div>
                    {item.deal?.event_type && <div><span className="text-muted-foreground text-[9px] uppercase tracking-wider block mb-0.5">Event</span><span className="text-foreground">{item.deal.event_type}</span></div>}
                    {item.deal?.event_date && <div><span className="text-muted-foreground text-[9px] uppercase tracking-wider block mb-0.5">Date</span><span className="text-foreground">{format(new Date(item.deal.event_date + "T00:00:00"), "MMM d, yyyy")}</span></div>}
                    {item.deal?.location && <div><span className="text-muted-foreground text-[9px] uppercase tracking-wider block mb-0.5">Location</span><span className="text-foreground">{item.deal.location}</span></div>}
                    {item.deal?.guest_count && <div><span className="text-muted-foreground text-[9px] uppercase tracking-wider block mb-0.5">Guests</span><span className="text-foreground">{item.deal.guest_count}</span></div>}
                    {item.deal?.deal_value && <div><span className="text-muted-foreground text-[9px] uppercase tracking-wider block mb-0.5">Value</span><span className="text-foreground">{formatCurrency(item.deal.deal_value)}</span></div>}
                    {item.deal && <div><span className="text-muted-foreground text-[9px] uppercase tracking-wider block mb-0.5">Stage</span><span className="text-foreground capitalize">{item.deal.stage}</span></div>}
                  </div>

                  {/* Status Dropdown */}
                  <div>
                    <span className="text-muted-foreground text-[9px] uppercase tracking-wider block mb-1">Outreach Status</span>
                    <select
                      value={item.outreachStatus}
                      onClick={(e) => e.stopPropagation()}
                      onChange={async (e) => {
                        e.stopPropagation();
                        const newStatus = e.target.value;
                        try {
                          await callAdmin("log_outreach", {
                            entry: {
                              contact_email: item.email,
                              contact_name: item.name,
                              action_type: "status_update",
                              outcome: newStatus,
                              notes: `Status changed to ${STATUS_LABELS[newStatus] || newStatus}`,
                              deal_id: item.deal?.id,
                            }
                          });
                          if (newStatus === "booked" && item.deal && confirm("Mark as 'Booked' in pipeline too?")) {
                            await callAdmin("update_deal_stage", { dealId: item.deal.id, stage: "booked" });
                          } else if (newStatus === "not_interested" && item.deal && confirm("Mark as 'Lost' in pipeline?")) {
                            await callAdmin("update_deal_stage", { dealId: item.deal.id, stage: "lost" });
                          }
                          toast.success("Status updated");
                          loadData();
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Update failed");
                        }
                      }}
                      className="w-full appearance-none bg-muted/20 border border-border text-sm text-foreground font-sans pl-3 pr-8 py-3 cursor-pointer focus:outline-none focus:border-accent touch-manipulation"
                      style={{
                        fontSize: '16px',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 8px center'
                      }}
                    >
                      {Object.entries(STATUS_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Outreach History */}
                  {contactLogs(item.email).length > 0 && (
                    <div>
                      <p className="font-sans text-[9px] tracking-[0.15em] uppercase text-muted-foreground mb-2">Recent Outreach</p>
                      {contactLogs(item.email).slice(0, 3).map(log => (
                        <div key={log.id} className="flex gap-2 text-[11px] py-1 border-b border-border/50 last:border-0">
                          <span className="text-muted-foreground w-14 shrink-0">{format(new Date(log.created_at), "MMM d")}</span>
                          <span className="text-accent w-16 shrink-0 uppercase">{log.action_type}</span>
                          <span className="text-foreground truncate">{log.notes || log.outcome || "—"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            );
          })
        )}
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

      {/* Edit Contact Modal */}
      <Dialog open={!!editModal} onOpenChange={() => setEditModal(null)}>
        <DialogContent className="max-w-lg bg-background border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Edit Contact Info</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1">Name</label>
                <input value={editForm.contact_name} onChange={e => setEditForm(f => ({ ...f, contact_name: e.target.value }))} className="w-full bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1">Company</label>
                <input value={editForm.company} onChange={e => setEditForm(f => ({ ...f, company: e.target.value }))} className="w-full bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1">Email</label>
                <input type="email" value={editForm.contact_email} onChange={e => setEditForm(f => ({ ...f, contact_email: e.target.value }))} className="w-full bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1">Phone</label>
                <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} placeholder="(555) 555-5555" className="w-full bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent" />
              </div>
            </div>
            {editModal?.deal && (
              <>
                <div className="pt-2 border-t border-border">
                  <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-2">Deal Details</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1">Event Type</label>
                    <input value={editForm.event_type} onChange={e => setEditForm(f => ({ ...f, event_type: e.target.value }))} className="w-full bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1">Event Date</label>
                    <input type="date" value={editForm.event_date} onChange={e => setEditForm(f => ({ ...f, event_date: e.target.value }))} className="w-full bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1">Location</label>
                    <input value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} className="w-full bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1">Guests</label>
                    <input value={editForm.guest_count} onChange={e => setEditForm(f => ({ ...f, guest_count: e.target.value }))} className="w-full bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1">Deal Value ($)</label>
                    <input type="number" value={editForm.deal_value} onChange={e => setEditForm(f => ({ ...f, deal_value: e.target.value }))} placeholder="2000" className="w-full bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1">Next Follow-up</label>
                    <input type="date" value={editForm.next_follow_up} onChange={e => setEditForm(f => ({ ...f, next_follow_up: e.target.value }))} className="w-full bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                  </div>
                </div>
                <div>
                  <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1">Notes</label>
                  <textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="w-full bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none" />
                </div>
              </>
            )}
            <button onClick={handleSaveEdit} disabled={editSaving} className="w-full bg-accent text-accent-foreground py-2.5 font-sans text-xs tracking-[0.2em] uppercase hover:bg-accent/80 transition-colors disabled:opacity-50">
              {editSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActionListTab;
