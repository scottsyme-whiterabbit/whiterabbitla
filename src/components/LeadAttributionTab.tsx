import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { TrendingUp, Users, Target, Filter } from "lucide-react";

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

const LeadAttributionTab = ({ storedPassword }: Props) => {
  const [deals, setDeals] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [quizLeads, setQuizLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"30" | "90" | "all">("90");

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
      } catch {
        toast.error("Failed to load attribution data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [callAdmin]);

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
