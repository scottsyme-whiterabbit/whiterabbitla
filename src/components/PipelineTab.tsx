import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, DollarSign, TrendingUp, Calendar, BarChart3, ChevronDown, ChevronRight, Mail, Eye, MousePointerClick, Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ShowCalendar from "@/components/ShowCalendar";
import ClientContextPanel from "@/components/admin/ClientContextPanel";


const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface Deal {
  id: string;
  contact_email: string;
  contact_name: string | null;
  company: string | null;
  event_type: string | null;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  guest_count: string | null;
  deal_value: number | null;
  stage: string;
  lost_reason: string | null;
  notes: string | null;
  next_follow_up: string | null;
  source: string | null;
  source_id: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  post_show_step?: number;
  post_show_started_at?: string | null;
}

const STAGES = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "proposal_sent", label: "Proposal Sent" },
  { key: "negotiating", label: "Negotiating" },
  { key: "booked", label: "Booked" },
  { key: "completed", label: "Completed" },
  { key: "lost", label: "Lost" },
  { key: "on_hold", label: "On Hold" },
];

const COLLAPSIBLE_STAGES = ["completed", "lost"];
const PREVIEW_COUNT = 3;

const LOST_REASONS = [
  "Pricing / budget",
  "Date conflict",
  "Went with another vendor",
  "Event cancelled / postponed",
  "Ghosted / no response",
  "Wrong fit (entertainment style)",
  "Venue restriction",
  "Decision delayed",
  "Other",
];

const EVENT_EMOJIS: Record<string, string> = {
  corporate: "🏢", Corporate: "🏢",
  wedding: "💍", Wedding: "💍",
  private_party: "🎉", "Private Party": "🎉",
  parlor_show: "🎩",
  other: "✨",
};

const POST_SHOW_SEQUENCE = [
  { step: 0, label: "Thank You Email", timing: "Day 0", desc: "Personalized thank-you with event details" },
  { step: 1, label: "Review Request", timing: "Day 3", desc: "Google review ask with direct link" },
  { step: 2, label: "Referral Ask", timing: "Day 14", desc: "Referral request with incentive" },
  { step: 3, label: "Seasonal Re-Engage", timing: "Day 90", desc: "Dynamic season-aware content for upcoming events" },
];

const HOLIDAY_EMAILS = [
  { label: "Valentine's Day", window: "Jan 15 – Feb 14" },
  { label: "4th of July", window: "Jun 4 – Jul 4" },
  { label: "Halloween", window: "Oct 1 – Oct 31" },
  { label: "Thanksgiving", window: "Oct 28 – Nov 27" },
  { label: "Christmas / NYE", window: "Nov 25 – Dec 25" },
];

const formatCurrency = (cents: number | null) => {
  if (!cents) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(cents / 100);
};

const daysSince = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const getFollowUpStatus = (followUp: string | null): "ok" | "today" | "overdue" | "none" => {
  if (!followUp) return "none";
  const today = new Date().toISOString().slice(0, 10);
  if (followUp < today) return "overdue";
  if (followUp === today) return "today";
  return "ok";
};

const followUpBorder: Record<string, string> = {
  ok: "border-l-emerald-500",
  today: "border-l-amber-500",
  overdue: "border-l-red-500",
  none: "border-l-border",
};

interface PipelineTabProps {
  adminPassword: string;
}

const PipelineTab = ({ adminPassword }: PipelineTabProps) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [expandedLostReason, setExpandedLostReason] = useState<string | null>(null);
  const [expandedCols, setExpandedCols] = useState<Record<string, boolean>>({});
  const [emailActivity, setEmailActivity] = useState<{ clicks: any[]; opens: any[] } | null>(null);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [showEmailPanel, setShowEmailPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [form, setForm] = useState({
    contact_email: "",
    contact_name: "",
    company: "",
    phone: "",
    event_type: "corporate",
    event_date: "",
    event_time: "",
    location: "",
    guest_count: "",
    deal_value: "",
    stage: "new",
    notes: "",
    next_follow_up: "",
    source: "manual",
    lost_reason: "",
    skip_thank_you: false,
  });

  const callAdmin = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/newsletter-admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({ action, adminPassword, ...payload }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Request failed");
    }
    return res.json();
  }, [adminPassword]);

  const loadDeals = useCallback(async () => {
    try {
      const res = await callAdmin("get_deals");
      setDeals(res.deals || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load deals");
    }
  }, [callAdmin]);

  useEffect(() => { loadDeals(); }, [loadDeals]);

  const loadEmailActivity = useCallback(async (deal: Deal) => {
    setLoadingActivity(true);
    setEmailActivity(null);
    try {
      // We need the contact_id from newsletter_contacts for this email
      const contactsRes = await callAdmin("get_contacts");
      const contact = (contactsRes.contacts || []).find(
        (c: { email: string }) => c.email.toLowerCase() === deal.contact_email.toLowerCase()
      );
      if (contact) {
        const activityRes = await callAdmin("get_contact_clicks", { contactId: contact.id });
        setEmailActivity({ clicks: activityRes.clicks || [], opens: activityRes.opens || [] });
      } else {
        setEmailActivity({ clicks: [], opens: [] });
      }
    } catch {
      setEmailActivity({ clicks: [], opens: [] });
    } finally {
      setLoadingActivity(false);
    }
  }, [callAdmin]);

  const handleSave = async () => {
    if (!form.contact_email) { toast.error("Email required"); return; }
    try {
      const { skip_thank_you, ...rest } = form;
      const dealData = {
        ...rest,
        deal_value: rest.deal_value ? Math.round(parseFloat(rest.deal_value) * 100) : null,
        event_date: rest.event_date || null,
        event_time: rest.event_time || null,
        next_follow_up: rest.next_follow_up || null,
        ...(editingDeal ? { id: editingDeal.id } : {}),
        ...(skip_thank_you && rest.stage === "completed" ? { post_show_step: 2, post_show_started_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() } : {}),
      };
      await callAdmin(editingDeal ? "update_deal" : "create_deal", { deal: dealData });
      toast.success(editingDeal ? "Deal updated" : "Deal created");
      setShowForm(false);
      setEditingDeal(null);
      resetForm();
      loadDeals();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  const handleStageChange = async (dealId: string, newStage: string) => {
    try {
      await callAdmin("update_deal_stage", { dealId, stage: newStage });
      setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: newStage } : d));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const resetForm = () => {
    setForm({ contact_email: "", contact_name: "", company: "", phone: "", event_type: "corporate", event_date: "", event_time: "", location: "", guest_count: "", deal_value: "", stage: "new", notes: "", next_follow_up: "", source: "manual", lost_reason: "", skip_thank_you: false });
  };

  const openEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setForm({
      contact_email: deal.contact_email,
      contact_name: deal.contact_name || "",
      company: deal.company || "",
      phone: deal.phone || "",
      event_type: deal.event_type || "corporate",
      event_date: deal.event_date || "",
      event_time: deal.event_time || "",
      location: deal.location || "",
      guest_count: deal.guest_count || "",
      deal_value: deal.deal_value ? (deal.deal_value / 100).toString() : "",
      stage: deal.stage,
      notes: deal.notes || "",
      next_follow_up: deal.next_follow_up || "",
      source: deal.source || "manual",
      lost_reason: deal.lost_reason || "",
      skip_thank_you: false,
    });
    setShowForm(true);
    setShowEmailPanel(false);
    setEmailActivity(null);
  };

  const openEmailPanel = (deal: Deal) => {
    setEditingDeal(deal);
    setShowEmailPanel(true);
    setShowForm(false);
    loadEmailActivity(deal);
  };

  // Stats
  const activeDeals = deals.filter(d => !["completed", "lost"].includes(d.stage));
  const pipelineValue = activeDeals.reduce((sum, d) => sum + (d.deal_value || 0), 0);
  const thisMonth = deals.filter(d => {
    const created = new Date(d.created_at);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  });
  const booked = deals.filter(d => d.stage === "booked" || d.stage === "completed").length;
  const conversionRate = deals.length ? Math.round((booked / deals.length) * 100) : 0;
  const avgDealValue = activeDeals.length
    ? activeDeals.reduce((s, d) => s + (d.deal_value || 0), 0) / activeDeals.length
    : 0;

  // Lost reasons breakdown — bucket free-text into known categories where possible
  const lostDeals = deals.filter(d => d.stage === "lost");
  const bucketReason = (raw: string | null): string => {
    if (!raw) return "Unspecified";
    const r = raw.toLowerCase();
    if (LOST_REASONS.includes(raw)) return raw;
    if (/(price|pricing|budget|cost|expensive|too much|afford)/.test(r)) return "Pricing / budget";
    if (/(date|conflict|not available|unavailable|schedul)/.test(r)) return "Date conflict";
    if (/(another|other vendor|different|hired|went with|chose)/.test(r)) return "Went with another vendor";
    if (/(cancel|postpon|pulled|fell through)/.test(r)) return "Event cancelled / postponed";
    if (/(ghost|no response|never responded|never replied|silent|stopped)/.test(r)) return "Ghosted / no response";
    if (/(fit|style|wrong)/.test(r)) return "Wrong fit (entertainment style)";
    if (/(venue|restriction|not allowed)/.test(r)) return "Venue restriction";
    if (/(delay|later|next year|2027)/.test(r)) return "Decision delayed";
    return "Other";
  };
  const lostBuckets = lostDeals.reduce<Record<string, { count: number; value: number }>>((acc, d) => {
    const b = bucketReason(d.lost_reason);
    if (!acc[b]) acc[b] = { count: 0, value: 0 };
    acc[b].count++;
    acc[b].value += d.deal_value || 0;
    return acc;
  }, {});
  const lostBucketEntries = Object.entries(lostBuckets).sort((a, b) => b[1].count - a[1].count);
  const lostTotalValue = lostDeals.reduce((s, d) => s + (d.deal_value || 0), 0);

  // Revenue meter calculations
  const ANNUAL_TARGET = 50000000; // $500,000 in cents
  const MONTHLY_TARGET = Math.round(ANNUAL_TARGET / 12);
  const PROPOSED_STAGES = ["new", "contacted", "negotiating", "proposal_sent"];
  
  const bookedRevenue = deals
    .filter(d => d.stage === "booked" || d.stage === "completed")
    .reduce((s, d) => s + (d.deal_value || 0), 0);
  const proposedRevenue = deals
    .filter(d => PROPOSED_STAGES.includes(d.stage))
    .reduce((s, d) => s + (d.deal_value || 0), 0);
  const totalPipeline = bookedRevenue + proposedRevenue;
  const bookedPct = Math.min((bookedRevenue / ANNUAL_TARGET) * 100, 100);
  const proposedPct = Math.min((proposedRevenue / ANNUAL_TARGET) * 100, 100 - bookedPct);
  const monthlyPct = (MONTHLY_TARGET / ANNUAL_TARGET) * 100;

  const openDealById = (dealId: string) => {
    const deal = deals.find(d => d.id === dealId);
    if (deal) openEdit(deal);
  };

  return (
    <div className="space-y-6">
      {/* Revenue Meter */}
      <div className="border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg text-foreground">Revenue Pipeline</h3>
          <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
            Annual Target: {formatCurrency(ANNUAL_TARGET)}
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="relative">
          <div className="w-full h-8 bg-muted/30 border border-border relative overflow-hidden">
            {/* Booked bar */}
            <div 
              className="absolute left-0 top-0 h-full bg-emerald-700/60 transition-all duration-500"
              style={{ width: `${bookedPct}%` }}
            />
            {/* Proposed bar stacked on top */}
            <div 
              className="absolute top-0 h-full bg-[#C9A96E]/40 transition-all duration-500"
              style={{ left: `${bookedPct}%`, width: `${proposedPct}%` }}
            />
            {/* Monthly target marker */}
            <div 
              className="absolute top-0 h-full w-px bg-foreground/30" 
              style={{ left: `${monthlyPct}%` }}
              title={`Monthly Target: ${formatCurrency(MONTHLY_TARGET)}`}
            />
          </div>
          {/* Monthly label */}
          <div className="absolute -bottom-4 text-[8px] text-muted-foreground font-sans" style={{ left: `${monthlyPct}%`, transform: 'translateX(-50%)' }}>
            Mo. Target
          </div>
        </div>

        {/* Summary text */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-2">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-emerald-700/60 rounded-sm" />
            <span className="font-mono text-sm text-foreground">{formatCurrency(bookedRevenue)}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Booked</span>
          </span>
          <span className="text-muted-foreground text-sm">+</span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#C9A96E]/40 rounded-sm" />
            <span className="font-mono text-sm text-[#C9A96E]">{formatCurrency(proposedRevenue)}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Proposed</span>
          </span>
          <span className="text-muted-foreground text-sm">=</span>
          <span className="font-mono text-sm text-foreground font-medium">{formatCurrency(totalPipeline)}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Pipeline</span>
          <span className="ml-auto font-sans text-xs text-accent font-medium">
            {Math.round((totalPipeline / ANNUAL_TARGET) * 100)}% of Goal
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: DollarSign, label: "Pipeline Value", value: formatCurrency(pipelineValue) },
          { icon: Calendar, label: "Deals This Month", value: thisMonth.length.toString() },
          { icon: TrendingUp, label: "Conversion Rate", value: `${conversionRate}%` },
          { icon: BarChart3, label: "Avg Deal Value", value: formatCurrency(avgDealValue) },
        ].map(stat => (
          <div key={stat.label} className="border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <stat.icon size={14} />
              <span className="font-sans text-[10px] tracking-[0.15em] uppercase">{stat.label}</span>
            </div>
            <p className="font-serif text-xl text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <p className="text-muted-foreground text-sm">{deals.length} total deals</p>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search name, email, company, location..."
              className="w-full bg-muted/20 border border-border text-foreground pl-9 pr-8 py-2 text-sm focus:outline-none focus:border-accent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => { resetForm(); setEditingDeal(null); setShowForm(true); }}
            className="flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 font-sans text-xs tracking-[0.15em] uppercase hover:bg-accent/80 transition-colors whitespace-nowrap"
          >
            <Plus size={14} /> New Deal
          </button>
        </div>
      </div>


      {/* Lost Reasons Tracker */}
      {lostDeals.length > 0 && (
        <div className="border border-border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg text-foreground">Lost Reasons</h3>
            <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
              {lostDeals.length} lost · {formatCurrency(lostTotalValue)} value
            </span>
          </div>
          <div className="space-y-2">
            {lostBucketEntries.map(([reason, { count, value }]) => {
              const pct = Math.round((count / lostDeals.length) * 100);
              const dealsInBucket = lostDeals.filter(d => bucketReason(d.lost_reason) === reason);
              const isOpen = expandedLostReason === reason;
              return (
                <div key={reason} className="border border-transparent hover:border-border/60 rounded">
                  <button
                    type="button"
                    onClick={() => setExpandedLostReason(isOpen ? null : reason)}
                    className="w-full text-left p-2 -m-2 rounded hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-sans text-xs text-foreground flex items-center gap-1.5">
                        <span className="text-muted-foreground text-[10px]">{isOpen ? "▾" : "▸"}</span>
                        {reason}
                      </span>
                      <span className="font-sans text-[10px] text-muted-foreground">
                        {count} ({pct}%) {value > 0 && <span className="text-accent">· {formatCurrency(value)}</span>}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-muted/30">
                      <div className="h-full bg-red-500/50 transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </button>
                  {isOpen && (
                    <div className="mt-2 ml-4 space-y-1 border-l-2 border-red-500/30 pl-3">
                      {dealsInBucket.map(d => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => openEdit(d)}
                          className="w-full text-left flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/30 transition-colors group"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-sans text-xs text-foreground truncate group-hover:text-accent">
                              {d.contact_name || d.contact_email}
                              {d.company && <span className="text-muted-foreground"> · {d.company}</span>}
                            </p>
                            {d.lost_reason && d.lost_reason !== reason && (
                              <p className="font-sans text-[10px] text-muted-foreground truncate italic">"{d.lost_reason}"</p>
                            )}
                          </div>
                          <span className="font-mono text-[10px] text-accent shrink-0 ml-2">
                            {d.deal_value ? formatCurrency(d.deal_value) : "—"}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="font-sans text-[10px] text-muted-foreground italic pt-2 border-t border-border">
            Tip: tag every lost deal with a reason so this stays accurate. Click a reason to drill into those deals.
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="flex gap-3 min-w-[1200px] pb-4">
          {STAGES.map(stage => {
            const q = searchQuery.trim().toLowerCase();
            const stageDeals = deals.filter(d => {
              if (d.stage !== stage.key) return false;
              if (!q) return true;
              return (
                (d.contact_name || "").toLowerCase().includes(q) ||
                (d.contact_email || "").toLowerCase().includes(q) ||
                (d.company || "").toLowerCase().includes(q) ||
                (d.location || "").toLowerCase().includes(q) ||
                (d.phone || "").toLowerCase().includes(q) ||
                (d.event_type || "").toLowerCase().includes(q)
              );
            });
            const isCollapsible = COLLAPSIBLE_STAGES.includes(stage.key) && stageDeals.length > PREVIEW_COUNT;
            const isExpanded = expandedCols[stage.key] || false;
            const visibleDeals = isCollapsible && !isExpanded ? stageDeals.slice(0, PREVIEW_COUNT) : stageDeals;
            const hiddenCount = stageDeals.length - PREVIEW_COUNT;

            return (
              <div
                key={stage.key}
                className="flex-1 min-w-[160px]"
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  if (draggedId) handleStageChange(draggedId, stage.key);
                  setDraggedId(null);
                }}
              >
                <div className="bg-muted/30 border border-border px-3 py-2 mb-2 flex items-center justify-between">
                  <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">{stage.label}</span>
                  <span className="text-[10px] bg-border px-1.5 py-0.5 text-muted-foreground">{stageDeals.length}</span>
                </div>
                <div className="space-y-2 min-h-[100px]">
                  {visibleDeals.map(deal => {
                    const fuStatus = getFollowUpStatus(deal.next_follow_up);
                    return (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={() => setDraggedId(deal.id)}
                        className={`border border-border border-l-4 ${followUpBorder[fuStatus]} bg-background p-3 cursor-pointer hover:bg-muted/20 transition-colors`}
                      >
                        <div className="flex items-center gap-1.5 mb-1" onClick={() => openEdit(deal)}>
                          <span className="text-sm">{EVENT_EMOJIS[deal.event_type || "other"] || "✨"}</span>
                          <span className="font-sans text-xs text-foreground truncate">{deal.contact_name || deal.contact_email}</span>
                        </div>
                        {deal.event_date && (
                          <p className="text-[10px] text-muted-foreground" onClick={() => openEdit(deal)}>{new Date(deal.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                        )}
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="font-mono text-xs text-accent" onClick={() => openEdit(deal)}>{formatCurrency(deal.deal_value)}</span>
                          <div className="flex items-center gap-2">
                            <a
                              href={`/admin/proposals?fromDeal=${deal.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 text-[9px] text-accent hover:text-accent/80 transition-colors"
                              title="Create proposal from this deal"
                            >
                              📄 Proposal
                            </a>
                            {stage.key === "completed" ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); openEmailPanel(deal); }}
                                className="flex items-center gap-1 text-[9px] text-accent hover:text-accent/80 transition-colors"
                                title="View email activity"
                              >
                                <Mail size={10} /> Emails
                              </button>
                            ) : (
                              <span className="text-[9px] text-muted-foreground">{daysSince(deal.updated_at)}d ago</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Collapse/Expand toggle for completed & lost */}
                  {isCollapsible && (
                    <button
                      onClick={() => setExpandedCols(prev => ({ ...prev, [stage.key]: !isExpanded }))}
                      className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronDown size={12} />
                          <span className="font-sans text-[10px] tracking-[0.1em] uppercase">Collapse</span>
                        </>
                      ) : (
                        <>
                          <ChevronRight size={12} />
                          <span className="font-sans text-[10px] tracking-[0.1em] uppercase">Show {hiddenCount} more</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Show Calendar */}
      <ShowCalendar deals={deals} onOpenDeal={openDealById} adminPassword={adminPassword} />

      {/* Deal Form Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg bg-background border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">{editingDeal ? "Edit Deal" : "New Deal"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Email *</label>
                <input value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} className="w-full bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">First Name</label>
                  <input value={form.contact_name.split(" ")[0] || ""} onChange={e => { const last = form.contact_name.split(" ").slice(1).join(" "); setForm(f => ({ ...f, contact_name: e.target.value + (last ? ` ${last}` : "") })); }} className="w-full bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Last Name</label>
                  <input value={form.contact_name.split(" ").slice(1).join(" ")} onChange={e => { const first = form.contact_name.split(" ")[0] || ""; setForm(f => ({ ...f, contact_name: first + (e.target.value ? ` ${e.target.value}` : "") })); }} className="w-full bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Company</label>
                <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className="w-full bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Phone</label>
                <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(555) 123-4567" className="w-full bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Event Type</label>
                <select value={["corporate","wedding","private_party","parlor_show","other"].includes(form.event_type) ? form.event_type : "__custom"} onChange={e => { if (e.target.value === "__custom") { setForm(f => ({ ...f, event_type: "" })); } else { setForm(f => ({ ...f, event_type: e.target.value })); } }} className="w-full bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent">
                  <option value="corporate">Corporate</option>
                  <option value="wedding">Wedding</option>
                  <option value="private_party">Private Party</option>
                  <option value="parlor_show">Parlor Show</option>
                  <option value="other">Other</option>
                  <option value="__custom">Custom...</option>
                </select>
                {!["corporate","wedding","private_party","parlor_show","other"].includes(form.event_type) && (
                  <input value={form.event_type} onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))} placeholder="e.g. charity gala, birthday dinner" className="w-full mt-1 bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Event Date</label>
                <input type="date" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} className="w-full bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Event Time</label>
                <input type="time" value={form.event_time} onChange={e => setForm(f => ({ ...f, event_time: e.target.value }))} className="w-full bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Location</label>
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="w-full bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Guests</label>
                <input value={form.guest_count} onChange={e => setForm(f => ({ ...f, guest_count: e.target.value }))} className="w-full bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Deal Value ($)</label>
                <input type="number" value={form.deal_value} onChange={e => setForm(f => ({ ...f, deal_value: e.target.value }))} placeholder="5000" className="w-full bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Stage</label>
                <select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))} className="w-full bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent">
                  {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Follow-up</label>
                <input type="date" value={form.next_follow_up} onChange={e => setForm(f => ({ ...f, next_follow_up: e.target.value }))} className="w-full bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent" />
              </div>
            </div>
            <div>
              <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Source</label>
              <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className="w-full bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent">
                <option value="manual">Manual</option>
                <option value="contact_form">Contact Form</option>
                <option value="planner_drip">Planner Drip</option>
                <option value="referral">Referral</option>
                <option value="quiz">Quiz</option>
              </select>
            </div>
            {form.stage === "lost" && (
              <div>
                <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Lost Reason</label>
                <select
                  value={LOST_REASONS.includes(form.lost_reason) ? form.lost_reason : (form.lost_reason ? "Other" : "")}
                  onChange={e => setForm(f => ({ ...f, lost_reason: e.target.value === "Other" ? (LOST_REASONS.includes(f.lost_reason) ? "" : f.lost_reason) : e.target.value }))}
                  className="w-full bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent"
                >
                  <option value="">— Select reason —</option>
                  {LOST_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {(!LOST_REASONS.includes(form.lost_reason) || form.lost_reason === "Other") && (
                  <input
                    value={form.lost_reason === "Other" ? "" : form.lost_reason}
                    onChange={e => setForm(f => ({ ...f, lost_reason: e.target.value }))}
                    placeholder="Add detail (optional)"
                    className="w-full mt-1 bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent"
                  />
                )}
              </div>
            )}
            {form.stage === "completed" && (
              <label className="flex items-center gap-2 cursor-pointer py-1">
                <input type="checkbox" checked={form.skip_thank_you} onChange={e => setForm(f => ({ ...f, skip_thank_you: e.target.checked }))} className="accent-accent" />
                <span className="font-sans text-xs text-muted-foreground">Skip Thank You & Review emails (past client — start at Referral & Re-engage drips only)</span>
              </label>
            )}
            <div>
              <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="w-full bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none" />
            </div>

            {/* Show email sequence preview when editing a completed deal */}
            {editingDeal && editingDeal.stage === "completed" && (
              <div className="border border-border p-3 mt-2">
                <button
                  onClick={() => loadEmailActivity(editingDeal)}
                  className="flex items-center gap-2 text-accent hover:text-accent/80 font-sans text-[10px] tracking-[0.15em] uppercase mb-2"
                >
                  <Mail size={12} /> View Email Activity
                </button>
                {loadingActivity && <p className="text-xs text-muted-foreground">Loading...</p>}
                {emailActivity && (
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye size={10} /> {emailActivity.opens.length} opens</span>
                      <span className="flex items-center gap-1"><MousePointerClick size={10} /> {emailActivity.clicks.length} clicks</span>
                    </div>
                    {emailActivity.opens.length > 0 && (
                      <div className="mt-1">
                        <p className="font-sans text-[9px] tracking-[0.15em] uppercase text-muted-foreground mb-1">Recent Opens</p>
                        {emailActivity.opens.slice(0, 5).map((o: any, i: number) => (
                          <p key={i} className="text-[10px] text-muted-foreground">Step {o.drip_step} — {new Date(o.opened_at).toLocaleDateString()}</p>
                        ))}
                      </div>
                    )}
                    {emailActivity.clicks.length > 0 && (
                      <div className="mt-1">
                        <p className="font-sans text-[9px] tracking-[0.15em] uppercase text-muted-foreground mb-1">Recent Clicks</p>
                        {emailActivity.clicks.slice(0, 5).map((c: any, i: number) => (
                          <p key={i} className="text-[10px] text-muted-foreground">{c.link_slug} — {new Date(c.clicked_at).toLocaleDateString()}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} className="flex-1 bg-accent text-accent-foreground py-2.5 font-sans text-xs tracking-[0.15em] uppercase hover:bg-accent/80 transition-colors">
                {editingDeal ? "Update Deal" : "Create Deal"}
              </button>
              {editingDeal && (
                <button
                  onClick={async () => {
                    if (!confirm("Delete this deal?")) return;
                    try {
                      await callAdmin("delete_deal", { dealId: editingDeal.id });
                      toast.success("Deleted");
                      setShowForm(false);
                      setEditingDeal(null);
                      loadDeals();
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Delete failed");
                    }
                  }}
                  className="px-4 py-2.5 border border-destructive/30 text-destructive font-sans text-xs tracking-[0.15em] uppercase hover:bg-destructive/10 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Activity Panel (standalone for quick access from Kanban) */}
      <Dialog open={showEmailPanel} onOpenChange={setShowEmailPanel}>
        <DialogContent className="max-w-md bg-background border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center gap-2">
              <Mail size={18} /> Post-Show Emails
            </DialogTitle>
            {editingDeal && (
              <p className="text-sm text-muted-foreground">{editingDeal.contact_name || editingDeal.contact_email}</p>
            )}
          </DialogHeader>

          {/* Email Sequence Preview */}
          <div className="space-y-3">
            <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-accent">Email Sequence</p>
            {POST_SHOW_SEQUENCE.map(email => {
              const currentStep = editingDeal?.post_show_step ?? 0;
              const isSent = currentStep > email.step;
              const isCurrent = currentStep === email.step;
              const isSkipped = (editingDeal?.post_show_step ?? 0) >= 2 && email.step < 2;
              return (
                <div key={email.step} className={`border px-3 py-2.5 ${isSent ? "border-emerald-500/30 bg-emerald-500/5" : isCurrent ? "border-accent/50 bg-accent/5" : isSkipped ? "border-border/50 bg-muted/10 opacity-50" : "border-border"}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-xs text-foreground">{email.label}</span>
                    <span className={`font-sans text-[9px] tracking-[0.1em] uppercase ${isSent ? "text-emerald-500" : isSkipped ? "text-muted-foreground line-through" : isCurrent ? "text-accent" : "text-muted-foreground"}`}>
                      {isSkipped ? "Skipped" : isSent ? "Sent ✓" : isCurrent ? "Next Up" : email.timing}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{email.desc}</p>
                </div>
              );
            })}

            <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-accent mt-4">Holiday Re-Engagement</p>
            {HOLIDAY_EMAILS.map(h => (
              <div key={h.label} className="border border-border px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-xs text-foreground">{h.label}</span>
                  <span className="font-sans text-[9px] text-muted-foreground">{h.window}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Activity log */}
          <div className="mt-4 border-t border-border pt-4">
            <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-accent mb-3">Engagement Activity</p>
            {loadingActivity && <p className="text-xs text-muted-foreground">Loading activity...</p>}
            {emailActivity && (
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground"><Eye size={14} /> {emailActivity.opens.length} opens</span>
                  <span className="flex items-center gap-1.5 text-muted-foreground"><MousePointerClick size={14} /> {emailActivity.clicks.length} clicks</span>
                </div>
                {emailActivity.opens.length === 0 && emailActivity.clicks.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No engagement recorded yet. Emails will start sending based on the sequence above.</p>
                )}
                {emailActivity.opens.length > 0 && (
                  <div>
                    <p className="font-sans text-[9px] tracking-[0.15em] uppercase text-muted-foreground mb-1.5">Opens</p>
                    <div className="space-y-1">
                      {emailActivity.opens.slice(0, 10).map((o: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-[10px] border-b border-border/30 pb-1">
                          <span className="text-foreground">Step {o.drip_step} — {POST_SHOW_SEQUENCE[o.drip_step]?.label || `Email ${o.drip_step}`}</span>
                          <span className="text-muted-foreground">{new Date(o.opened_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {emailActivity.clicks.length > 0 && (
                  <div>
                    <p className="font-sans text-[9px] tracking-[0.15em] uppercase text-muted-foreground mb-1.5">Clicks</p>
                    <div className="space-y-1">
                      {emailActivity.clicks.slice(0, 10).map((c: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-[10px] border-b border-border/30 pb-1">
                          <span className="text-foreground">{c.link_slug}</span>
                          <span className="text-muted-foreground">{new Date(c.clicked_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => { setShowEmailPanel(false); if (editingDeal) openEdit(editingDeal); }}
            className="w-full mt-3 border border-border py-2 font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Edit Deal Details →
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PipelineTab;
