import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Target, Upload, Eye, RefreshCw, Users, Mail, Pause, Play, MessageSquare, ChevronDown, ChevronRight, Trash2, Plus, X } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Email subjects and schedule for all 7 campaigns
const CAMPAIGN_DATA: Record<string, { label: string; emoji: string; emails: Array<{ subject: string; day: number; type: string }> }> = {
  corporate_planner: {
    label: "Corporate Planners",
    emoji: "🏢",
    emails: [
      { subject: "Quick question about your upcoming events", day: 0, type: "Cold Open" },
      { subject: "What Netflix does differently at their events", day: 3, type: "Value Add" },
      { subject: "How a 45-minute set changed a client reception", day: 10, type: "Different Angle" },
      { subject: "Last note from me", day: 24, type: "Breakup" },
    ],
  },
  wedding_planner: {
    label: "Wedding Planners",
    emoji: "💍",
    emails: [
      { subject: "Cocktail hour entertainment your couples will love", day: 0, type: "Cold Open" },
      { subject: "How planners use me for the cocktail hour gap", day: 3, type: "Value Add" },
      { subject: "What a planner said after adding me to her roster", day: 10, type: "Different Angle" },
      { subject: "Open invitation", day: 24, type: "Breakup" },
    ],
  },
  country_club: {
    label: "Country Clubs",
    emoji: "⛳",
    emails: [
      { subject: "A member event idea your social calendar might be missing", day: 0, type: "Cold Open" },
      { subject: "How private clubs use strolling entertainment", day: 3, type: "Value Add" },
      { subject: "The event members remember all year", day: 10, type: "Different Angle" },
      { subject: "Keeping it on your radar", day: 24, type: "Breakup" },
    ],
  },
  pr_agency: {
    label: "PR & Marketing",
    emoji: "📱",
    emails: [
      { subject: "Experiential talent for your next client activation", day: 0, type: "Cold Open" },
      { subject: "The moment that makes your activation go viral", day: 3, type: "Value Add" },
      { subject: "Why agencies keep bringing me back", day: 10, type: "Different Angle" },
      { subject: "On your radar for client events", day: 24, type: "Breakup" },
    ],
  },
  nonprofit: {
    label: "Nonprofits",
    emoji: "❤️",
    emails: [
      { subject: "Keeping donors engaged before the paddle raise", day: 0, type: "Cold Open" },
      { subject: "Why table-side magic works at galas", day: 3, type: "Value Add" },
      { subject: "The gala entertainment guests talk about at the next board meeting", day: 10, type: "Different Angle" },
      { subject: "For your next gala", day: 24, type: "Breakup" },
    ],
  },
  talent_management: {
    label: "Talent Mgmt",
    emoji: "⭐",
    emails: [
      { subject: "Specialty talent for your clients private events", day: 0, type: "Cold Open" },
      { subject: "The talent your VIP clients do not expect", day: 3, type: "Value Add" },
      { subject: "Why I get rebooked for VIP events", day: 10, type: "Different Angle" },
      { subject: "On your talent radar", day: 24, type: "Breakup" },
    ],
  },
  restaurant: {
    label: "Restaurants",
    emoji: "🍽️",
    emails: [
      { subject: "A guest experience idea for your slower nights", day: 0, type: "Cold Open" },
      { subject: "How table-side magic increases your average check", day: 3, type: "Value Add" },
      { subject: "What guests say about the table-side experience", day: 10, type: "Different Angle" },
      { subject: "If you ever want to try something different", day: 24, type: "Breakup" },
    ],
  },
};

const STATUS_COLORS: Record<string, string> = {
  active: "text-emerald-400 bg-emerald-500/20",
  paused: "text-yellow-400 bg-yellow-500/20",
  completed: "text-muted-foreground bg-muted/20",
  replied: "text-accent bg-accent/20",
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

interface ColdDripCampaignTabProps {
  category: string;
  storedPassword: string;
}

const ColdDripCampaignTab = ({ category, storedPassword }: ColdDripCampaignTabProps) => {
  const campaignInfo = CAMPAIGN_DATA[category];
  const [campaigns, setCampaigns] = useState<ColdCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [csvInput, setCsvInput] = useState("");
  const [addForm, setAddForm] = useState({ email: "", name: "", company: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showContacts, setShowContacts] = useState(false);
  const [previewStep, setPreviewStep] = useState<number | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");

  const callAdmin = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/newsletter-admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({ action, adminPassword: storedPassword, ...payload }),
    });
    if (!res.ok) throw new Error((await res.json()).error || "Request failed");
    return res.json();
  }, [storedPassword]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await callAdmin("get_cold_campaigns");
      setCampaigns((res.campaigns || []).filter((c: ColdCampaign) => c.campaign_category === category));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [callAdmin, category]);

  useEffect(() => { loadData(); }, [loadData]);

  // Stats
  const stats = useMemo(() => {
    const active = campaigns.filter(c => c.status === "active").length;
    const paused = campaigns.filter(c => c.status === "paused").length;
    const replied = campaigns.filter(c => c.status === "replied").length;
    const completed = campaigns.filter(c => c.status === "completed").length;
    const stepCounts = [0, 1, 2, 3].map(s => campaigns.filter(c => c.current_step === s && c.status === "active").length);
    return { total: campaigns.length, active, paused, replied, completed, stepCounts };
  }, [campaigns]);

  const filtered = useMemo(() => {
    let items = [...campaigns];
    if (filterStatus !== "all") items = items.filter(c => c.status === filterStatus);
    return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [campaigns, filterStatus]);

  const handleAdd = async () => {
    if (!addForm.email) { toast.error("Email required"); return; }
    setSaving(true);
    try {
      await callAdmin("add_cold_campaign", { campaign: { ...addForm, campaign_category: category } });
      toast.success("Contact added");
      setAddForm({ email: "", name: "", company: "", phone: "" });
      setShowAdd(false);
      loadData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setSaving(false);
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").filter(l => l.trim());
    const header = lines[0].toLowerCase();
    const cols = header.split(",").map(h => h.trim());
    const emailIdx = cols.findIndex(h => h.includes("email"));
    const nameIdx = cols.findIndex(h => h.includes("name") && !h.includes("company") && !h.includes("last"));
    const companyIdx = cols.findIndex(h => h.includes("company") || h.includes("business"));
    const phoneIdx = cols.findIndex(h => h.includes("phone") || h.includes("mobile") || h.includes("cell"));

    if (emailIdx === -1) { toast.error("CSV must have an 'email' column"); return; }

    const parsed = lines.slice(1).map(line => {
      const c = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
      return {
        email: c[emailIdx],
        name: nameIdx >= 0 ? c[nameIdx] : undefined,
        company: companyIdx >= 0 ? c[companyIdx] : undefined,
        phone: phoneIdx >= 0 ? c[phoneIdx]?.trim() || undefined : undefined,
      };
    }).filter(c => c.email?.includes("@"));

    if (!parsed.length) { toast.error("No valid emails found"); return; }

    setLoading(true);
    let added = 0;
    let errors = 0;
    for (const contact of parsed) {
      try {
        await callAdmin("add_cold_campaign", { campaign: { ...contact, campaign_category: category } });
        added++;
      } catch {
        errors++;
      }
    }
    toast.success(`Added ${added} contacts${errors > 0 ? `, ${errors} duplicates/errors skipped` : ""}`);
    loadData();
    e.target.value = "";
  };

  const handleManualEnroll = async () => {
    const lines = csvInput.split("\n").filter(l => l.trim());
    const contactsList = lines.map(line => {
      const parts = line.split(",").map(p => p.trim());
      return { email: parts[0], name: parts[1] || undefined, company: parts[2] || undefined, phone: parts[3] || undefined };
    }).filter(c => c.email?.includes("@"));
    if (!contactsList.length) { toast.error("Enter at least one valid email"); return; }

    setLoading(true);
    let added = 0;
    for (const contact of contactsList) {
      try {
        await callAdmin("add_cold_campaign", { campaign: { ...contact, campaign_category: category } });
        added++;
      } catch { /* skip duplicates */ }
    }
    toast.success(`Added ${added} contacts`);
    setCsvInput("");
    loadData();
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await callAdmin("update_cold_campaign_status", { campaignId: id, status });
      toast.success(`Status → ${status}`);
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

  const [previewSubject, setPreviewSubject] = useState("");

  const handlePreview = async (step: number) => {
    if (previewStep === step && previewHtml) {
      setPreviewStep(null);
      setPreviewHtml("");
      setPreviewSubject("");
      return;
    }
    setPreviewStep(step);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/cold-drip`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ action: "preview", category, step, previewName: "Kevin" }),
      });
      if (!res.ok) throw new Error("Preview failed");
      const data = await res.json();
      setPreviewHtml(data.body_html);
      setPreviewSubject(data.subject || "");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Preview failed");
    }
  };

  if (!campaignInfo) return <div className="p-8 text-center text-muted-foreground">Unknown campaign category</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="font-serif text-2xl text-foreground flex items-center gap-3">
          <span className="text-3xl">{campaignInfo.emoji}</span>
          {campaignInfo.label} Cold Outreach
        </h2>
        <p className="font-sans text-sm text-muted-foreground mt-1">
          4-email automated drip sequence · Days 0, 3, 10, 24
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="border border-border p-5">
          <div className="flex items-center gap-2 mb-1">
            <Target size={16} className="text-accent" />
            <p className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground">Total</p>
          </div>
          <p className="font-serif text-3xl text-foreground">{stats.total}</p>
        </div>
        <div className="border border-border p-5">
          <div className="flex items-center gap-2 mb-1">
            <Users size={16} className="text-accent" />
            <p className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground">Active</p>
          </div>
          <p className="font-serif text-3xl text-foreground">{stats.active}</p>
        </div>
        <div className="border border-border p-5">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare size={16} className="text-accent" />
            <p className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground">Replied</p>
          </div>
          <p className="font-serif text-3xl text-foreground">{stats.replied}</p>
        </div>
        <div className="border border-border p-5">
          <div className="flex items-center gap-2 mb-1">
            <Mail size={16} className="text-accent" />
            <p className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground">Completed</p>
          </div>
          <p className="font-serif text-3xl text-foreground">{stats.completed}</p>
        </div>
        <div className="border border-border p-5">
          <div className="flex items-center gap-2 mb-1">
            <Pause size={16} className="text-yellow-400" />
            <p className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground">Paused</p>
          </div>
          <p className="font-serif text-3xl text-foreground">{stats.paused}</p>
        </div>
      </div>

      {/* Email Sequence Pipeline */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-sans text-sm tracking-[0.2em] uppercase text-muted-foreground">Email Sequence Pipeline</h3>
          <button onClick={loadData} className="text-muted-foreground hover:text-foreground">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {campaignInfo.emails.map((email, i) => (
            <button
              key={i}
              onClick={() => handlePreview(i)}
              className={`border p-4 text-left transition-colors hover:border-accent ${previewStep === i && previewHtml ? "border-accent bg-accent/5" : "border-border"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-accent/70">{email.type}</span>
                <span className="font-sans text-[10px] text-muted-foreground">Day {email.day}</span>
              </div>
              <p className="font-sans text-sm text-foreground leading-tight mb-3">"{email.subject}"</p>
              <div className="flex items-center justify-between">
                <span className="font-sans text-xs text-accent">{stats.stepCounts[i]} waiting</span>
                <div className="flex items-center gap-1">
                  <Eye size={10} className="text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">
                    Email {i + 1}/4
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Email Preview */}
        {previewHtml && previewStep !== null && (
          <div className="mt-4 border border-accent/30 bg-muted/10">
            <div className="px-4 py-3 border-b border-border space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-sans text-xs tracking-[0.15em] uppercase text-accent">
                  Preview: {campaignInfo.emails[previewStep]?.type} (Email {previewStep + 1}/4 · Day {campaignInfo.emails[previewStep]?.day})
                </span>
                <button onClick={() => { setPreviewStep(null); setPreviewHtml(""); setPreviewSubject(""); }} className="text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              </div>
              {previewSubject && (
                <p className="font-sans text-sm text-foreground">
                  <span className="text-muted-foreground">Subject:</span> {previewSubject}
                </p>
              )}
              <p className="font-sans text-xs text-muted-foreground">
                <span className="text-muted-foreground">To:</span> Kevin (test preview — real emails will use each contact's first name)
              </p>
            </div>
            <div className="p-4 max-h-[600px] overflow-y-auto">
              <iframe
                srcDoc={previewHtml}
                className="w-full min-h-[500px] border-0"
                title="Email preview"
                sandbox=""
              />
            </div>
          </div>
        )}
      </div>

      {/* Contacts Section */}
      <div className="border border-border">
        <button
          onClick={() => { if (!showContacts && campaigns.length === 0) loadData(); setShowContacts(!showContacts); }}
          className="w-full p-4 flex items-center justify-between hover:bg-accent/5 transition-colors"
        >
          <h3 className="font-sans text-sm tracking-[0.2em] uppercase text-muted-foreground flex items-center gap-2">
            <Users size={16} />
            {campaignInfo.label} Contacts
            {campaigns.length > 0 && <span className="text-accent">({campaigns.length})</span>}
          </h3>
          {showContacts ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
        </button>

        {showContacts && (
          <div>
            {/* Filter + Actions */}
            <div className="px-4 pb-3 flex gap-2 flex-wrap">
              {["all", "active", "paused", "replied", "completed"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilterStatus(f)}
                  className={`px-3 py-1 text-xs tracking-wider uppercase transition-colors ${filterStatus === f ? "bg-accent text-accent-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}
                >
                  {f}
                </button>
              ))}
              <button onClick={() => setShowAdd(!showAdd)} className="ml-auto px-3 py-1 text-xs tracking-wider uppercase bg-accent text-accent-foreground hover:bg-accent/80 flex items-center gap-1">
                <Plus size={12} /> Add
              </button>
            </div>

            {/* Add Form */}
            {showAdd && (
              <div className="mx-4 mb-3 border border-accent/30 bg-accent/5 p-4 space-y-3">
                <h4 className="font-sans text-[10px] tracking-[0.15em] uppercase text-accent">Add Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} placeholder="Email *" className="bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent" style={{ fontSize: "16px" }} />
                  <input value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} placeholder="Name" className="bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent" style={{ fontSize: "16px" }} />
                  <input value={addForm.company} onChange={e => setAddForm(f => ({ ...f, company: e.target.value }))} placeholder="Company" className="bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent" style={{ fontSize: "16px" }} />
                  <input value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone" className="bg-muted/20 border border-border text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent" style={{ fontSize: "16px" }} />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAdd} disabled={saving} className="px-4 py-2 bg-accent text-accent-foreground font-sans text-[10px] tracking-[0.2em] uppercase hover:bg-accent/80 disabled:opacity-50">
                    {saving ? "Adding..." : "Add"}
                  </button>
                  <button onClick={() => setShowAdd(false)} className="px-4 py-2 border border-border text-muted-foreground font-sans text-[10px] tracking-[0.2em] uppercase hover:text-foreground">Cancel</button>
                </div>
              </div>
            )}

            {/* Contacts Table */}
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-2 font-sans text-xs tracking-wider uppercase text-muted-foreground">Contact</th>
                    <th className="text-left px-4 py-2 font-sans text-xs tracking-wider uppercase text-muted-foreground hidden md:table-cell">Company</th>
                    <th className="text-left px-4 py-2 font-sans text-xs tracking-wider uppercase text-muted-foreground">Step</th>
                    <th className="text-left px-4 py-2 font-sans text-xs tracking-wider uppercase text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-2 font-sans text-xs tracking-wider uppercase text-muted-foreground hidden md:table-cell">Last Sent</th>
                    <th className="text-left px-4 py-2 font-sans text-xs tracking-wider uppercase text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-accent/5 transition-colors">
                      <td className="px-4 py-2.5">
                        <p className="text-foreground">{c.name || c.email.split("@")[0]}</p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">{c.company || "—"}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-0.5 mb-1">
                          {[0, 1, 2, 3].map(s => (
                            <div key={s} className={`h-1.5 w-4 rounded-full ${s < c.current_step ? "bg-accent" : "bg-muted/30"}`} />
                          ))}
                        </div>
                        <span className="text-[10px] text-muted-foreground">{c.current_step === 0 ? "Not started" : c.current_step >= 4 ? "All sent" : `${c.current_step}/4 sent`}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded ${STATUS_COLORS[c.status] || ""} font-sans tracking-wider uppercase`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[11px] text-muted-foreground hidden md:table-cell">
                        {c.last_email_sent_at ? new Date(c.last_email_sent_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-1">
                          {c.status === "active" && (
                            <button onClick={() => handleStatusChange(c.id, "paused")} className="p-1.5 border border-border text-yellow-400 hover:bg-yellow-500/10" title="Pause">
                              <Pause size={12} />
                            </button>
                          )}
                          {c.status === "paused" && (
                            <button onClick={() => handleStatusChange(c.id, "active")} className="p-1.5 border border-border text-emerald-400 hover:bg-emerald-500/10" title="Resume">
                              <Play size={12} />
                            </button>
                          )}
                          {c.status !== "replied" && c.status !== "completed" && (
                            <button onClick={() => handleStatusChange(c.id, "replied")} className="p-1.5 border border-border text-accent hover:bg-accent/10" title="Replied">
                              <MessageSquare size={12} />
                            </button>
                          )}
                          <button onClick={() => handleDelete(c.id)} className="p-1.5 border border-border text-red-400 hover:bg-red-500/10" title="Remove">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-8">No contacts in this campaign yet</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Enroll Contacts */}
      <div className="border border-border p-6">
        <h3 className="font-sans text-sm tracking-[0.2em] uppercase text-muted-foreground mb-4">Enroll {campaignInfo.label}</h3>

        <div className="flex gap-4 mb-4">
          <label className="inline-flex items-center gap-2 cursor-pointer bg-accent text-accent-foreground px-5 py-2 font-sans text-sm tracking-[0.2em] uppercase hover:bg-accent/80 transition-colors">
            <Upload size={16} />
            Upload CSV
            <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
          </label>
          <p className="text-xs text-muted-foreground self-center">CSV with email, name, company, phone columns</p>
        </div>

        <div className="mb-4">
          <label className="font-sans text-xs tracking-wider uppercase text-muted-foreground mb-2 block">
            Or paste manually (email, name, company, phone per line)
          </label>
          <textarea
            value={csvInput}
            onChange={e => setCsvInput(e.target.value)}
            placeholder={"sarah@company.com, Sarah Chen, Company Inc, (310) 555-0100\njohn@firm.com, John Park, The Firm"}
            rows={4}
            className="w-full bg-muted/20 border border-border text-foreground px-4 py-3 font-sans text-sm focus:outline-none focus:border-accent resize-none font-mono"
          />
        </div>

        <button
          onClick={handleManualEnroll}
          disabled={loading || !csvInput.trim()}
          className="bg-accent text-accent-foreground px-6 py-2 font-sans text-sm tracking-[0.2em] uppercase hover:bg-accent/80 transition-colors disabled:opacity-50"
        >
          {loading ? "Enrolling..." : "Enroll Contacts"}
        </button>
      </div>
    </div>
  );
};

export default ColdDripCampaignTab;
