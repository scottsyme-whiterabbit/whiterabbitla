import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { TrendingUp, Users, Target, Filter, Plus, X } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface Props {
  storedPassword: string;
}

const COLORS = [
  "hsl(var(--accent))",
  "hsl(var(--primary))",
  "hsl(150, 40%, 45%)",
  "hsl(210, 50%, 50%)",
  "hsl(340, 40%, 55%)",
  "hsl(45, 70%, 50%)",
  "hsl(270, 40%, 50%)",
  "hsl(180, 40%, 45%)",
];

const CHANNEL_OPTIONS = [
  "website",
  "referral",
  "cold_outreach",
  "meta_ads",
  "google_ads",
  "instagram",
  "word_of_mouth",
  "repeat_client",
  "venue_partner",
  "planner_referral",
  "other",
];

const emptyForm = {
  contact_name: "",
  contact_email: "",
  company: "",
  event_type: "",
  event_date: "",
  deal_value: "",
  source: "",
  location: "",
};

const LeadAttributionTab = ({ storedPassword }: Props) => {
  const [deals, setDeals] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [quizLeads, setQuizLeads] = useState<any[]>([]);
  const [closedDeals, setClosedDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"30" | "90" | "all">("90");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const callAdmin = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/newsletter-admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({ action, adminPassword: storedPassword, ...payload }),
    });
    if (!res.ok) throw new Error("Request failed");
    return res.json();
  }, [storedPassword]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await callAdmin("get_lead_attribution");
        setDeals(res.deals || []);
        setInquiries(res.inquiries || []);
        setConsultations(res.consultations || []);
        setQuizLeads(res.quizLeads || []);
        setClosedDeals(res.closedDeals || []);
      } catch {
        toast.error("Failed to load attribution data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [callAdmin]);

  const handleSaveDeal = async () => {
    if (!form.contact_name.trim() || !form.source) {
      toast.error("Name and channel are required");
      return;
    }
    setSaving(true);
    try {
      const res = await callAdmin("log_closed_deal", form);
      if (res.deal) {
        setClosedDeals(prev => [res.deal, ...prev]);
        setForm(emptyForm);
        setShowForm(false);
        toast.success("Closed deal logged");
      }
    } catch {
      toast.error("Failed to save deal");
    } finally {
      setSaving(false);
    }
  };

  const filterByTime = useCallback((items: any[], dateField: string) => {
    if (timeRange === "all") return items;
    const days = parseInt(timeRange);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return items.filter(i => new Date(i[dateField]) >= cutoff);
  }, [timeRange]);

  // Pipeline source breakdown (deals by source)
  const pipelineBySource = useMemo(() => {
    const filtered = filterByTime(deals, "created_at");
    const map = new Map<string, { count: number; value: number }>();
    filtered.forEach(d => {
      const src = d.source || "unknown";
      const existing = map.get(src) || { count: 0, value: 0 };
      map.set(src, { count: existing.count + 1, value: existing.value + (d.deal_value || 0) });
    });
    return Array.from(map.entries())
      .map(([name, { count, value }]) => ({ name, count, value }))
      .sort((a, b) => b.count - a.count);
  }, [deals, filterByTime]);

  // Pipeline value by source
  const pipelineValueBySource = useMemo(() => {
    return pipelineBySource
      .filter(s => s.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [pipelineBySource]);

  // Inquiry source breakdown
  const inquiryBySource = useMemo(() => {
    const filtered = filterByTime(inquiries, "created_at");
    const map = new Map<string, number>();
    filtered.forEach(i => {
      const src = i.source || "unknown";
      map.set(src, (map.get(src) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [inquiries, filterByTime]);

  // Consultation source breakdown
  const consultationBySource = useMemo(() => {
    const filtered = filterByTime(consultations, "created_at");
    const map = new Map<string, number>();
    filtered.forEach(c => {
      const src = c.source || "unknown";
      map.set(src, (map.get(src) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [consultations, filterByTime]);

  // Leads over time (weekly buckets)
  const leadsOverTime = useMemo(() => {
    const filtered = filterByTime(deals, "created_at");
    const weekMap = new Map<string, { deals: number; inquiries: number; consultations: number }>();

    const addToWeek = (date: string, key: "deals" | "inquiries" | "consultations") => {
      const d = new Date(date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const label = weekStart.toISOString().slice(5, 10);
      const existing = weekMap.get(label) || { deals: 0, inquiries: 0, consultations: 0 };
      existing[key]++;
      weekMap.set(label, existing);
    };

    filtered.forEach(d => addToWeek(d.created_at, "deals"));
    filterByTime(inquiries, "created_at").forEach(i => addToWeek(i.created_at, "inquiries"));
    filterByTime(consultations, "created_at").forEach(c => addToWeek(c.created_at, "consultations"));

    return Array.from(weekMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([week, data]) => ({ week, ...data }));
  }, [deals, inquiries, consultations, filterByTime]);

  // Stage conversion by source
  const conversionBySource = useMemo(() => {
    const filtered = filterByTime(deals, "created_at");
    const map = new Map<string, { total: number; won: number; lost: number }>();
    filtered.forEach(d => {
      const src = d.source || "unknown";
      const existing = map.get(src) || { total: 0, won: 0, lost: 0 };
      existing.total++;
      if (d.stage === "completed") existing.won++;
      if (d.stage === "lost") existing.lost++;
      map.set(src, existing);
    });
    return Array.from(map.entries())
      .filter(([, v]) => v.total >= 2)
      .map(([name, { total, won, lost }]) => ({
        name,
        total,
        won,
        lost,
        winRate: total > 0 ? Math.round((won / total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [deals, filterByTime]);

  // Closed deals revenue by channel
  const closedByChannel = useMemo(() => {
    const map = new Map<string, { count: number; revenue: number }>();
    closedDeals.forEach(d => {
      const src = d.source || "unknown";
      const existing = map.get(src) || { count: 0, revenue: 0 };
      map.set(src, { count: existing.count + 1, revenue: existing.revenue + (d.deal_value || 0) });
    });
    return Array.from(map.entries())
      .map(([name, { count, revenue }]) => ({ name, count, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [closedDeals]);

  const totalClosedRevenue = closedDeals.reduce((sum, d) => sum + (d.deal_value || 0), 0);

  if (loading) {
    return <p className="text-center text-muted-foreground py-12">Loading attribution data...</p>;
  }

  const totalDeals = filterByTime(deals, "created_at").length;
  const totalInquiries = filterByTime(inquiries, "created_at").length;
  const totalConsultations = filterByTime(consultations, "created_at").length;
  const totalQuiz = filterByTime(quizLeads, "created_at").length;

  return (
    <div className="space-y-8">
      {/* Header with time filter */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-2xl text-foreground">Lead Attribution</h2>
          <p className="font-sans text-xs text-muted-foreground mt-1">Where your leads and pipeline come from</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-muted/20 p-1 rounded">
            {(["30", "90", "all"] as const).map(r => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 font-sans text-xs tracking-wider uppercase transition-colors rounded ${
                  timeRange === r ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r === "all" ? "All Time" : `${r}d`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Closed Deals Log ── */}
      <div className="border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-accent">Closed Deals Log</h3>
            <p className="font-sans text-[10px] text-muted-foreground mt-1">
              {closedDeals.length} closed · ${totalClosedRevenue.toLocaleString()} total revenue
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-accent-foreground font-sans text-xs tracking-wider uppercase rounded hover:bg-accent/90 transition-colors"
          >
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? "Cancel" : "Log Deal"}
          </button>
        </div>

        {/* Entry Form */}
        {showForm && (
          <div className="bg-muted/10 border border-border p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1">Client Name *</label>
                <input
                  value={form.contact_name}
                  onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))}
                  className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground rounded focus:outline-none focus:border-accent"
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label className="block font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1">Email</label>
                <input
                  value={form.contact_email}
                  onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))}
                  className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground rounded focus:outline-none focus:border-accent"
                  placeholder="jane@company.com"
                />
              </div>
              <div>
                <label className="block font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1">Company</label>
                <input
                  value={form.company}
                  onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                  className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground rounded focus:outline-none focus:border-accent"
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <label className="block font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1">Channel / Source *</label>
                <select
                  value={form.source}
                  onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                  className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground rounded focus:outline-none focus:border-accent"
                >
                  <option value="">Select channel…</option>
                  {CHANNEL_OPTIONS.map(ch => (
                    <option key={ch} value={ch}>{ch.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1">Event Type</label>
                <input
                  value={form.event_type}
                  onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))}
                  className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground rounded focus:outline-none focus:border-accent"
                  placeholder="Corporate gala"
                />
              </div>
              <div>
                <label className="block font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1">Event Date</label>
                <input
                  type="date"
                  value={form.event_date}
                  onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))}
                  className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground rounded focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1">Deal Value ($)</label>
                <input
                  type="number"
                  value={form.deal_value}
                  onChange={e => setForm(f => ({ ...f, deal_value: e.target.value }))}
                  className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground rounded focus:outline-none focus:border-accent"
                  placeholder="2500"
                />
              </div>
              <div>
                <label className="block font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1">Location</label>
                <input
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground rounded focus:outline-none focus:border-accent"
                  placeholder="Beverly Hills"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSaveDeal}
                disabled={saving}
                className="px-5 py-2 bg-accent text-accent-foreground font-sans text-xs tracking-wider uppercase rounded hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Closed Deal"}
              </button>
            </div>
          </div>
        )}

        {/* Revenue by Channel Summary */}
        {closedByChannel.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {closedByChannel.slice(0, 4).map(({ name, count, revenue }, i) => (
              <div key={name} className="bg-muted/10 px-3 py-2 rounded">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{name.replace(/_/g, " ")}</span>
                </div>
                <p className="font-serif text-lg text-foreground">${revenue.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">{count} deal{count !== 1 ? "s" : ""}</p>
              </div>
            ))}
          </div>
        )}

        {/* Closed Deals Table */}
        {closedDeals.length > 0 && (
          <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-3 font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Client</th>
                  <th className="py-2 pr-3 font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Channel</th>
                  <th className="py-2 pr-3 font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Event</th>
                  <th className="py-2 pr-3 font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Date</th>
                  <th className="py-2 font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground text-right">Value</th>
                </tr>
              </thead>
              <tbody>
                {closedDeals.map(d => (
                  <tr key={d.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                    <td className="py-2 pr-3">
                      <p className="text-foreground">{d.contact_name || "—"}</p>
                      {d.company && <p className="text-[10px] text-muted-foreground">{d.company}</p>}
                    </td>
                    <td className="py-2 pr-3">
                      <span className="inline-block px-2 py-0.5 bg-accent/10 text-accent text-[10px] tracking-wider uppercase rounded">
                        {(d.source || "unknown").replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">{d.event_type || "—"}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{d.event_date || "—"}</td>
                    <td className="py-2 text-right text-foreground font-medium">
                      {d.deal_value ? `$${d.deal_value.toLocaleString()}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {closedDeals.length === 0 && !showForm && (
          <p className="text-xs text-muted-foreground text-center py-4">No closed deals logged yet. Click "Log Deal" to add one.</p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Pipeline Deals", value: totalDeals, icon: Target },
          { label: "Inquiries", value: totalInquiries, icon: Users },
          { label: "Consultations", value: totalConsultations, icon: TrendingUp },
          { label: "Quiz Leads", value: totalQuiz, icon: Filter },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="border border-border p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Icon size={12} className="text-accent" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
            </div>
            <p className="font-serif text-3xl text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* Pipeline by Source — Pie + Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-border p-6">
          <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-accent mb-4">Pipeline by Source</h3>
          {pipelineBySource.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pipelineBySource}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pipelineBySource.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground">No pipeline data yet</p>
          )}
        </div>

        <div className="border border-border p-6">
          <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-accent mb-4">Pipeline Value by Source</h3>
          {pipelineValueBySource.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={pipelineValueBySource} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={100} />
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", fontSize: 12 }} formatter={(v: number) => [`$${v.toLocaleString()}`, "Value"]} />
                <Bar dataKey="value" fill="hsl(var(--accent))" radius={[0, 2, 2, 0]} name="Value" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground">No deal values recorded yet</p>
          )}
        </div>
      </div>

      {/* Leads Over Time */}
      <div className="border border-border p-6">
        <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-accent mb-4">Leads Over Time (Weekly)</h3>
        {leadsOverTime.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={leadsOverTime}>
              <XAxis dataKey="week" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="deals" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} name="Deals" />
              <Line type="monotone" dataKey="inquiries" stroke="hsl(150, 40%, 45%)" strokeWidth={2} dot={false} name="Inquiries" />
              <Line type="monotone" dataKey="consultations" stroke="hsl(210, 50%, 50%)" strokeWidth={2} dot={false} name="Consultations" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-xs text-muted-foreground">Not enough data yet</p>
        )}
      </div>

      {/* Inquiry + Consultation Sources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-border p-6">
          <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-accent mb-4">Inquiry Sources</h3>
          <div className="space-y-2">
            {inquiryBySource.map(({ name, value }) => {
              const pct = totalInquiries > 0 ? ((value / totalInquiries) * 100).toFixed(1) : "0";
              return (
                <div key={name} className="flex items-center gap-3">
                  <span className="font-sans text-xs text-muted-foreground w-24 truncate">{name}</span>
                  <div className="flex-1 bg-border/30 h-4 rounded-sm overflow-hidden">
                    <div className="h-full bg-accent/70 rounded-sm transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="font-sans text-xs text-foreground w-16 text-right">{value} ({pct}%)</span>
                </div>
              );
            })}
            {inquiryBySource.length === 0 && <p className="text-xs text-muted-foreground">No inquiry data</p>}
          </div>
        </div>

        <div className="border border-border p-6">
          <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-accent mb-4">Consultation Sources</h3>
          <div className="space-y-2">
            {consultationBySource.map(({ name, value }) => {
              const pct = totalConsultations > 0 ? ((value / totalConsultations) * 100).toFixed(1) : "0";
              return (
                <div key={name} className="flex items-center gap-3">
                  <span className="font-sans text-xs text-muted-foreground w-24 truncate">{name}</span>
                  <div className="flex-1 bg-border/30 h-4 rounded-sm overflow-hidden">
                    <div className="h-full bg-primary/70 rounded-sm transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="font-sans text-xs text-foreground w-16 text-right">{value} ({pct}%)</span>
                </div>
              );
            })}
            {consultationBySource.length === 0 && <p className="text-xs text-muted-foreground">No consultation data</p>}
          </div>
        </div>
      </div>

      {/* Conversion by Source */}
      {conversionBySource.length > 0 && (
        <div className="border border-border p-6">
          <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-accent mb-4">Win Rate by Source</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Source</th>
                  <th className="py-2 font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground text-right">Total</th>
                  <th className="py-2 font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground text-right">Won</th>
                  <th className="py-2 font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground text-right">Lost</th>
                  <th className="py-2 font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground text-right">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {conversionBySource.map(row => (
                  <tr key={row.name} className="border-b border-border/50">
                    <td className="py-2 text-foreground">{row.name}</td>
                    <td className="py-2 text-foreground text-right">{row.total}</td>
                    <td className="py-2 text-foreground text-right">{row.won}</td>
                    <td className="py-2 text-foreground text-right">{row.lost}</td>
                    <td className="py-2 text-right">
                      <span className={`font-medium ${row.winRate >= 50 ? "text-green-500" : row.winRate >= 25 ? "text-yellow-500" : "text-muted-foreground"}`}>
                        {row.winRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadAttributionTab;
