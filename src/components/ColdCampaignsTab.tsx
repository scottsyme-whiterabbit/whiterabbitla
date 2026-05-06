import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Plus, Pause, Play, MessageSquare, Users, ChevronDown, Trash2 } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const CATEGORIES = [
  { value: "corporate_planner", label: "Corporate Planners", emoji: "🏢" },
  { value: "wedding_planner", label: "Wedding Planners", emoji: "💍" },
  { value: "country_club", label: "Country Clubs", emoji: "⛳" },
  { value: "pr_agency", label: "PR & Marketing", emoji: "📱" },
  { value: "nonprofit", label: "Nonprofits", emoji: "❤️" },
  { value: "talent", label: "Talent (Wrap)", emoji: "🎬" },
  { value: "nightlife", label: "Nightlife", emoji: "🌙" },
  { value: "restaurant", label: "Restaurants", emoji: "🍽️" },
  { value: "spirits", label: "Spirits Brands", emoji: "🍸" },
  { value: "charity_golf", label: "Charity Golf", emoji: "🏌️" },
] as const;

const STEP_LABELS = ["Not Started", "Email 1 ✓", "Email 2 ✓", "Email 3 ✓", "Breakup ✓"];
const STATUS_COLORS: Record<string, string> = {
  active: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30",
  paused: "text-yellow-400 bg-yellow-500/20 border-yellow-500/30",
  completed: "text-muted-foreground bg-muted/20 border-border",
  replied: "text-accent bg-accent/20 border-accent/30",
};

interface ColdCampaign {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  phone: string | null;
  campaign_category: string;
  current_step: number;
  started_at: string | null;
  last_email_sent_at: string | null;
  status: string;
  created_at: string;
}

interface ColdCampaignsTabProps {
  adminPassword: string;
}

const ColdCampaignsTab = ({ adminPassword }: ColdCampaignsTabProps) => {
  const [campaigns, setCampaigns] = useState<ColdCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ email: "", name: "", company: "", phone: "", campaign_category: "corporate_planner" });
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

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
      const res = await callAdmin("get_cold_campaigns");
      setCampaigns(res.campaigns || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [callAdmin]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAdd = async () => {
    if (!addForm.email) { toast.error("Email required"); return; }
    setSaving(true);
    try {
      await callAdmin("add_cold_campaign", { campaign: addForm });
      toast.success("Contact added to campaign");
      setAddForm({ email: "", name: "", company: "", phone: "", campaign_category: "corporate_planner" });
      setShowAdd(false);
      loadData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await callAdmin("update_cold_campaign_status", { campaignId: id, status });
      toast.success(`Status updated to ${status}`);
      loadData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this contact from the campaign?")) return;
    try {
      await callAdmin("delete_cold_campaign", { campaignId: id });
      toast.success("Removed");
      loadData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  // Stats per category
  const categoryStats = useMemo(() => {
    const stats: Record<string, { total: number; active: number; replied: number; completed: number }> = {};
    for (const cat of CATEGORIES) {
      const items = campaigns.filter(c => c.campaign_category === cat.value);
      stats[cat.value] = {
        total: items.length,
        active: items.filter(c => c.status === "active").length,
        replied: items.filter(c => c.status === "replied").length,
        completed: items.filter(c => c.status === "completed").length,
      };
    }
    return stats;
  }, [campaigns]);

  const filtered = useMemo(() => {
    let items = [...campaigns];
    if (filterCategory !== "all") items = items.filter(c => c.campaign_category === filterCategory);
    if (filterStatus !== "all") items = items.filter(c => c.status === filterStatus);
    return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [campaigns, filterCategory, filterStatus]);

  return (
    <div className="space-y-6">
      {/* Category Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {CATEGORIES.map(cat => {
          const s = categoryStats[cat.value] || { total: 0, active: 0, replied: 0, completed: 0 };
          return (
            <button
              key={cat.value}
              onClick={() => setFilterCategory(filterCategory === cat.value ? "all" : cat.value)}
              className={`border p-3 text-left transition-colors ${filterCategory === cat.value ? "border-accent bg-accent/10" : "border-border hover:border-accent/30"}`}
            >
              <span className="text-lg">{cat.emoji}</span>
              <p className="font-sans text-[9px] tracking-[0.15em] uppercase text-muted-foreground mt-1">{cat.label}</p>
              <p className="font-serif text-xl text-foreground">{s.total}</p>
              <div className="flex gap-2 mt-1">
                {s.active > 0 && <span className="text-[9px] text-emerald-400">{s.active} active</span>}
                {s.replied > 0 && <span className="text-[9px] text-accent">{s.replied} replied</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground font-sans text-[10px] tracking-[0.2em] uppercase hover:bg-accent/80 transition-colors">
          <Plus size={14} /> Add Contact
        </button>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 text-[10px] font-sans tracking-wider uppercase bg-muted/20 border border-border text-foreground focus:outline-none focus:border-accent">
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="replied">Replied</option>
          <option value="completed">Completed</option>
        </select>
        <button onClick={loadData} className="px-3 py-2 text-[10px] font-sans tracking-wider uppercase border border-border text-muted-foreground hover:text-foreground transition-colors">
          Refresh
        </button>
        <span className="ml-auto text-[11px] text-muted-foreground">{filtered.length} contacts</span>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="border border-accent/30 bg-accent/5 p-4 space-y-3">
          <h3 className="font-sans text-[10px] tracking-[0.15em] uppercase text-accent">Add Contact to Cold Campaign</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} placeholder="Email *" className="bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent" style={{ fontSize: "16px" }} />
            <input value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} placeholder="Name" className="bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent" style={{ fontSize: "16px" }} />
            <input value={addForm.company} onChange={e => setAddForm(f => ({ ...f, company: e.target.value }))} placeholder="Company" className="bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent" style={{ fontSize: "16px" }} />
            <input value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone" className="bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent" style={{ fontSize: "16px" }} />
          </div>
          <div>
            <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1">Campaign Category</label>
            <select value={addForm.campaign_category} onChange={e => setAddForm(f => ({ ...f, campaign_category: e.target.value }))} className="w-full md:w-auto bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent">
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.emoji} {cat.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving} className="px-4 py-2 bg-accent text-accent-foreground font-sans text-[10px] tracking-[0.2em] uppercase hover:bg-accent/80 disabled:opacity-50">
              {saving ? "Adding..." : "Add to Campaign"}
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 border border-border text-muted-foreground font-sans text-[10px] tracking-[0.2em] uppercase hover:text-foreground">Cancel</button>
          </div>
        </div>
      )}

      {/* Campaign List */}
      {loading ? (
        <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-sm">No campaigns found. Add a contact to get started.</div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block border border-border">
            <div className="grid grid-cols-[1.2fr_1fr_120px_100px_120px_140px] gap-3 bg-muted/30 border-b border-border px-4 py-2">
              {["Contact", "Campaign", "Step", "Status", "Last Sent", "Actions"].map(h => (
                <span key={h} className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">{h}</span>
              ))}
            </div>
            {filtered.map(c => {
              const catInfo = CATEGORIES.find(cat => cat.value === c.campaign_category);
              return (
                <div key={c.id} className="grid grid-cols-[1.2fr_1fr_120px_100px_120px_140px] gap-3 px-4 py-3 border-b border-border items-center hover:bg-muted/10 transition-colors">
                  <div className="min-w-0">
                    <p className="font-sans text-sm text-foreground font-medium truncate">{c.name || c.email.split("@")[0]}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{c.email}</p>
                    {c.company && <p className="text-[10px] text-muted-foreground">{c.company}</p>}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {catInfo?.emoji} {catInfo?.label || c.campaign_category}
                  </div>
                  <div>
                    <div className="flex gap-0.5 mb-1">
                      {[0, 1, 2, 3].map(s => (
                        <div key={s} className={`h-1.5 flex-1 rounded-full ${s < c.current_step ? "bg-accent" : "bg-muted/30"}`} />
                      ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{STEP_LABELS[c.current_step] || `Step ${c.current_step}`}</span>
                  </div>
                  <div>
                    <span className={`text-[10px] px-2 py-0.5 border ${STATUS_COLORS[c.status] || ""} font-sans tracking-wider uppercase`}>
                      {c.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {c.last_email_sent_at ? new Date(c.last_email_sent_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                  </div>
                  <div className="flex gap-1">
                    {c.status === "active" && (
                      <button onClick={() => handleStatusChange(c.id, "paused")} className="p-1.5 border border-border text-yellow-400 hover:bg-yellow-500/10 transition-colors" title="Pause">
                        <Pause size={12} />
                      </button>
                    )}
                    {c.status === "paused" && (
                      <button onClick={() => handleStatusChange(c.id, "active")} className="p-1.5 border border-border text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="Resume">
                        <Play size={12} />
                      </button>
                    )}
                    {c.status !== "replied" && c.status !== "completed" && (
                      <button onClick={() => handleStatusChange(c.id, "replied")} className="p-1.5 border border-border text-accent hover:bg-accent/10 transition-colors" title="Mark Replied">
                        <MessageSquare size={12} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 border border-border text-red-400 hover:bg-red-500/10 transition-colors" title="Remove">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-2">
            {filtered.map(c => {
              const catInfo = CATEGORIES.find(cat => cat.value === c.campaign_category);
              return (
                <div key={c.id} className="border border-border p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-sans text-sm text-foreground font-medium">{c.name || c.email.split("@")[0]}</p>
                      <p className="text-[11px] text-muted-foreground">{c.email}</p>
                      {c.company && <p className="text-[10px] text-muted-foreground">{c.company}</p>}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 border ${STATUS_COLORS[c.status] || ""} font-sans tracking-wider uppercase shrink-0`}>
                      {c.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">{catInfo?.emoji} {catInfo?.label}</span>
                    <span className="text-[10px] text-muted-foreground">{STEP_LABELS[c.current_step]}</span>
                  </div>
                  <div className="flex gap-0.5">
                    {[0, 1, 2, 3].map(s => (
                      <div key={s} className={`h-1.5 flex-1 rounded-full ${s < c.current_step ? "bg-accent" : "bg-muted/30"}`} />
                    ))}
                  </div>
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    {c.status === "active" && (
                      <button onClick={() => handleStatusChange(c.id, "paused")} className="flex-1 py-2 border border-border text-yellow-400 text-[10px] tracking-wider uppercase font-sans active:bg-yellow-500/10 touch-manipulation">
                        Pause
                      </button>
                    )}
                    {c.status === "paused" && (
                      <button onClick={() => handleStatusChange(c.id, "active")} className="flex-1 py-2 border border-border text-emerald-400 text-[10px] tracking-wider uppercase font-sans active:bg-emerald-500/10 touch-manipulation">
                        Resume
                      </button>
                    )}
                    {c.status !== "replied" && c.status !== "completed" && (
                      <button onClick={() => handleStatusChange(c.id, "replied")} className="flex-1 py-2 border border-border text-accent text-[10px] tracking-wider uppercase font-sans active:bg-accent/10 touch-manipulation">
                        Replied
                      </button>
                    )}
                    <button onClick={() => handleDelete(c.id)} className="py-2 px-3 border border-border text-red-400 text-[10px] tracking-wider uppercase font-sans active:bg-red-500/10 touch-manipulation">
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default ColdCampaignsTab;
