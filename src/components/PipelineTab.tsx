import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, DollarSign, TrendingUp, Calendar, BarChart3 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ShowCalendar from "@/components/ShowCalendar";

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
  created_at: string;
  updated_at: string;
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

const EVENT_EMOJIS: Record<string, string> = {
  corporate: "🏢",
  wedding: "💍",
  private_party: "🎉",
  parlor_show: "🎩",
  other: "✨",
};

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
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    contact_email: "",
    contact_name: "",
    company: "",
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
    setLoading(true);
    try {
      const res = await callAdmin("get_deals");
      setDeals(res.deals || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load deals");
    } finally {
      setLoading(false);
    }
  }, [callAdmin]);

  useEffect(() => { loadDeals(); }, [loadDeals]);

  const handleSave = async () => {
    if (!form.contact_email) { toast.error("Email required"); return; }
    try {
      const dealData = {
        ...form,
        deal_value: form.deal_value ? Math.round(parseFloat(form.deal_value) * 100) : null,
        event_date: form.event_date || null,
        event_time: form.event_time || null,
        next_follow_up: form.next_follow_up || null,
        ...(editingDeal ? { id: editingDeal.id } : {}),
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
    setForm({ contact_email: "", contact_name: "", company: "", event_type: "corporate", event_date: "", event_time: "", location: "", guest_count: "", deal_value: "", stage: "new", notes: "", next_follow_up: "", source: "manual", lost_reason: "" });
  };

  const openEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setForm({
      contact_email: deal.contact_email,
      contact_name: deal.contact_name || "",
      company: deal.company || "",
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
    });
    setShowForm(true);
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

  return (
    <div className="space-y-6">
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
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground text-sm">{deals.length} total deals</p>
        <button
          onClick={() => { resetForm(); setEditingDeal(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 font-sans text-xs tracking-[0.15em] uppercase hover:bg-accent/80 transition-colors"
        >
          <Plus size={14} /> New Deal
        </button>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto">
        <div className="flex gap-3 min-w-[1200px] pb-4">
          {STAGES.map(stage => {
            const stageDeals = deals.filter(d => d.stage === stage.key);
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
                  {stageDeals.map(deal => {
                    const fuStatus = getFollowUpStatus(deal.next_follow_up);
                    return (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={() => setDraggedId(deal.id)}
                        onClick={() => openEdit(deal)}
                        className={`border border-border border-l-4 ${followUpBorder[fuStatus]} bg-background p-3 cursor-pointer hover:bg-muted/20 transition-colors`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-sm">{EVENT_EMOJIS[deal.event_type || "other"] || "✨"}</span>
                          <span className="font-sans text-xs text-foreground truncate">{deal.contact_name || deal.contact_email}</span>
                        </div>
                        {deal.event_date && (
                          <p className="text-[10px] text-muted-foreground">{new Date(deal.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                        )}
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="font-mono text-xs text-accent">{formatCurrency(deal.deal_value)}</span>
                          <span className="text-[9px] text-muted-foreground">{daysSince(deal.updated_at)}d ago</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Show Calendar */}
      <ShowCalendar deals={deals} />

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
              <div>
                <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Name</label>
                <input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} className="w-full bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Company</label>
                <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className="w-full bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Event Type</label>
                <select value={form.event_type} onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))} className="w-full bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent">
                  <option value="corporate">Corporate</option>
                  <option value="wedding">Wedding</option>
                  <option value="private_party">Private Party</option>
                  <option value="parlor_show">Parlor Show</option>
                  <option value="other">Other</option>
                </select>
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
                <input value={form.lost_reason} onChange={e => setForm(f => ({ ...f, lost_reason: e.target.value }))} className="w-full bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent" />
              </div>
            )}
            <div>
              <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="w-full bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none" />
            </div>
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
                  className="px-4 py-2.5 border border-red-500/30 text-red-400 font-sans text-xs tracking-[0.15em] uppercase hover:bg-red-500/10 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PipelineTab;
