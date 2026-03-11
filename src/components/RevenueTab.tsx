import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell,
} from "recharts";
import { DollarSign, TrendingUp, Calendar, AlertTriangle, CheckCircle, Clock, Mail, MousePointerClick, Eye } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface Deal {
  id: string;
  contact_email: string;
  contact_name: string | null;
  company: string | null;
  event_type: string | null;
  event_date: string | null;
  deal_value: number | null;
  stage: string;
  next_follow_up: string | null;
  source: string | null;
  created_at: string;
  post_show_step: number;
}

interface SendLog {
  campaign_id: string;
  sent_at: string;
  contact_id: string;
}

interface OpenLog {
  contact_id: string;
  opened_at: string;
  drip_step: number;
}

interface ClickLog {
  contact_id: string;
  clicked_at: string;
  drip_step: number;
  link_slug: string;
}

const STAGES_ORDER = ["new", "contacted", "proposal_sent", "negotiating", "booked", "completed", "lost", "on_hold"];
const STAGE_LABELS: Record<string, string> = {
  new: "New", contacted: "Contacted", proposal_sent: "Proposal Sent",
  negotiating: "Negotiating", booked: "Booked", completed: "Completed",
  lost: "Lost", on_hold: "On Hold",
};
const SOURCE_LABELS: Record<string, string> = {
  planner_drip: "Planner Drip", contact_form: "Contact Form",
  referral: "Referral", quiz: "Quiz", manual: "Manual",
};

const POST_SHOW_LABELS = ["Thank You", "Review Ask", "Referral Ask", "Re-engage"];

type DateRange = "month" | "quarter" | "year" | "all";

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(cents / 100);

const getDateRangeStart = (range: DateRange): Date | null => {
  const now = new Date();
  if (range === "all") return null;
  if (range === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (range === "quarter") {
    const q = Math.floor(now.getMonth() / 3) * 3;
    return new Date(now.getFullYear(), q, 1);
  }
  return new Date(now.getFullYear(), 0, 1);
};

interface Props {
  adminPassword: string;
}

const RevenueTab = ({ adminPassword }: Props) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [sendLog, setSendLog] = useState<SendLog[]>([]);
  const [opens, setOpens] = useState<OpenLog[]>([]);
  const [clicks, setClicks] = useState<ClickLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>("year");

  const callAdmin = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/newsletter-admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({ action, adminPassword, ...payload }),
    });
    if (!res.ok) throw new Error("Request failed");
    return res.json();
  }, [adminPassword]);

  useEffect(() => {
    const load = async () => {
      try {
        const [dealsRes, sendsRes, opensRes, clicksRes] = await Promise.all([
          callAdmin("get_deals"),
          callAdmin("get_send_log"),
          callAdmin("get_opens_log"),
          callAdmin("get_clicks_log"),
        ]);
        setDeals(dealsRes.deals || []);
        setSendLog(sendsRes.sends || []);
        setOpens(opensRes.opens || []);
        setClicks(clicksRes.clicks || []);
      } catch {
        toast.error("Failed to load revenue data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [callAdmin]);

  const filtered = useMemo(() => {
    const start = getDateRangeStart(dateRange);
    if (!start) return deals;
    return deals.filter(d => new Date(d.created_at) >= start);
  }, [deals, dateRange]);

  // Revenue Summary — split booked vs completed (exclude $0 deals from revenue calcs)
  const revenueSummary = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const booked = deals.filter(d => d.stage === "booked" && (d.deal_value || 0) > 0);
    const completed = deals.filter(d => d.stage === "completed" && (d.deal_value || 0) > 0);
    const all = [...booked, ...completed];
    const sum = (arr: Deal[]) => arr.reduce((s, d) => s + (d.deal_value || 0), 0);
    const inRange = (d: Deal, start: Date) => new Date(d.created_at) >= start;

    return {
      bookedTotal: sum(booked),
      completedTotal: sum(completed),
      grossMonth: sum(completed.filter(d => inRange(d, monthStart))),
      grossQuarter: sum(completed.filter(d => inRange(d, quarterStart))),
      grossYear: sum(completed.filter(d => inRange(d, yearStart))),
      bookedMonth: sum(booked.filter(d => inRange(d, monthStart))),
      bookedQuarter: sum(booked.filter(d => inRange(d, quarterStart))),
      bookedYear: sum(booked.filter(d => inRange(d, yearStart))),
      avgDeal: all.length ? sum(all) / all.length : 0,
      totalDeals: all.length,
    };
  }, [deals]);

  // Monthly Show Tracker
  const monthlyShows = useMemo(() => {
    const now = new Date();
    const months: { month: string; shows: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      const count = deals.filter(deal => {
        if (!["booked", "completed"].includes(deal.stage)) return false;
        const ed = deal.event_date ? new Date(deal.event_date) : new Date(deal.created_at);
        return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear();
      }).length;
      months.push({ month: key, shows: count });
    }
    return months;
  }, [deals]);

  // Pipeline Funnel
  const funnelData = useMemo(() => {
    return STAGES_ORDER.map(stage => ({
      stage: STAGE_LABELS[stage],
      count: filtered.filter(d => d.stage === stage).length,
    }));
  }, [filtered]);

  // Source Performance
  const sourcePerformance = useMemo(() => {
    const sources = new Map<string, { leads: number; booked: number; revenue: number }>();
    filtered.forEach(d => {
      const src = d.source || "manual";
      const entry = sources.get(src) || { leads: 0, booked: 0, revenue: 0 };
      entry.leads++;
      if (["booked", "completed"].includes(d.stage)) {
        entry.booked++;
        entry.revenue += d.deal_value || 0;
      }
      sources.set(src, entry);
    });
    return Array.from(sources.entries())
      .map(([source, data]) => ({
        source,
        label: SOURCE_LABELS[source] || source,
        ...data,
        conversionRate: data.leads > 0 ? Math.round((data.booked / data.leads) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filtered]);

  // Follow-Up Health
  const followUpHealth = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndStr = weekEnd.toISOString().slice(0, 10);

    const active = deals.filter(d => !["completed", "lost"].includes(d.stage));
    const overdue = active.filter(d => d.next_follow_up && d.next_follow_up < today);
    const todayFollowUps = active.filter(d => d.next_follow_up === today);
    const thisWeek = active.filter(d => d.next_follow_up && d.next_follow_up > today && d.next_follow_up <= weekEndStr);
    const noFollowUp = active.filter(d => !d.next_follow_up);

    return { overdue, today: todayFollowUps, thisWeek, noFollowUp };
  }, [deals]);

  // Post-Show Email Engagement
  const postShowEngagement = useMemo(() => {
    const completedDealIds = new Set(deals.filter(d => d.stage === "completed").map(d => d.id));

    // Filter sends/opens/clicks to post-show campaigns
    const postSends = sendLog.filter(s => s.campaign_id.startsWith("post-show-"));
    const postOpens = opens.filter(o => completedDealIds.has(o.contact_id));
    const postClicks = clicks.filter(c => completedDealIds.has(c.contact_id));

    // Per-step breakdown
    const steps = [0, 1, 2, 3].map(step => {
      const stepSends = postSends.filter(s => s.campaign_id === `post-show-${step}`).length;
      const stepOpens = postOpens.filter(o => o.drip_step === step).length;
      const stepClicks = postClicks.filter(c => c.drip_step === step).length;
      return {
        step,
        label: POST_SHOW_LABELS[step],
        sends: stepSends,
        opens: stepOpens,
        clicks: stepClicks,
        openRate: stepSends > 0 ? Math.round((stepOpens / stepSends) * 100) : 0,
        clickRate: stepSends > 0 ? Math.round((stepClicks / stepSends) * 100) : 0,
      };
    });

    return {
      totalSends: postSends.length,
      totalOpens: postOpens.length,
      totalClicks: postClicks.length,
      uniqueOpeners: new Set(postOpens.map(o => o.contact_id)).size,
      steps,
    };
  }, [deals, sendLog, opens, clicks]);

  if (loading) {
    return <p className="text-center text-muted-foreground py-12">Loading revenue data...</p>;
  }

  const FUNNEL_COLORS: Record<string, string> = {
    New: "hsl(var(--accent))",
    Contacted: "#8b5cf6",
    "Proposal Sent": "#f59e0b",
    Negotiating: "#6366f1",
    Booked: "#10b981",
    Completed: "#14b8a6",
    Lost: "#ef4444",
    "On Hold": "#94a3b8",
  };

  return (
    <div className="space-y-8">
      {/* Date Range Filter */}
      <div className="flex items-center gap-2">
        <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Range:</span>
        {(["month", "quarter", "year", "all"] as DateRange[]).map(r => (
          <button
            key={r}
            onClick={() => setDateRange(r)}
            className={`px-3 py-1 font-sans text-[10px] tracking-[0.15em] uppercase transition-colors ${
              dateRange === r
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            {r === "month" ? "This Month" : r === "quarter" ? "This Quarter" : r === "year" ? "This Year" : "All Time"}
          </button>
        ))}
      </div>

      {/* Revenue Summary Cards — Booked vs Gross */}
      <div>
        <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-accent mb-4">Revenue Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Calendar, label: "Booked Revenue", value: formatCurrency(revenueSummary.bookedTotal), sub: "Upcoming confirmed shows" },
            { icon: CheckCircle, label: "Gross Revenue", value: formatCurrency(revenueSummary.completedTotal), sub: "Completed shows" },
            { icon: TrendingUp, label: "Combined Total", value: formatCurrency(revenueSummary.bookedTotal + revenueSummary.completedTotal), sub: "Booked + Completed" },
            { icon: DollarSign, label: "Avg Deal Value", value: formatCurrency(revenueSummary.avgDeal), sub: `${revenueSummary.totalDeals} total deals` },
          ].map(stat => (
            <div key={stat.label} className="border border-border p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <stat.icon size={14} />
                <span className="font-sans text-[10px] tracking-[0.15em] uppercase">{stat.label}</span>
              </div>
              <p className="font-serif text-xl text-foreground">{stat.value}</p>
              <p className="font-sans text-[10px] text-muted-foreground mt-1">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Pace Tracker */}
      <div className="border border-border p-6">
        <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-accent mb-4">Monthly Pace Tracker</h3>
        {(() => {
          const ANNUAL_TARGET = 50000000; // $500,000 in cents
          const MONTHLY_TARGET = 4166700; // $41,667 in cents
          const now = new Date();
          const currentMonth = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
          const monthsRemaining = 12 - (now.getMonth() + 1);
          const combinedTotal = revenueSummary.bookedTotal + revenueSummary.completedTotal;
          const currentMonthRevenue = revenueSummary.bookedMonth + revenueSummary.grossMonth;
          const pctOfAnnual = Math.min(Math.round((combinedTotal / ANNUAL_TARGET) * 100), 100);
          const pctOfMonth = Math.min(Math.round((currentMonthRevenue / MONTHLY_TARGET) * 100), 100);

          return (
            <div className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: "Annual Target", value: formatCurrency(ANNUAL_TARGET) },
                  { label: "Monthly Target", value: formatCurrency(MONTHLY_TARGET) },
                  { label: currentMonth, value: formatCurrency(currentMonthRevenue) },
                  { label: "Months Remaining", value: String(monthsRemaining) },
                  { label: "Annual Progress", value: `${pctOfAnnual}%` },
                ].map(stat => (
                  <div key={stat.label} className="text-center">
                    <p className="font-serif text-xl text-foreground">{stat.value}</p>
                    <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Annual progress bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Annual Goal</span>
                  <span className="font-mono text-[10px] text-emerald-500">{formatCurrency(combinedTotal)} / {formatCurrency(ANNUAL_TARGET)}</span>
                </div>
                <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pctOfAnnual}%`, background: "linear-gradient(90deg, #10b981, #14b8a6)" }}
                  />
                </div>
              </div>

              {/* Monthly progress bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Monthly Goal</span>
                  <span className="font-mono text-[10px] text-amber-500">{formatCurrency(currentMonthRevenue)} / {formatCurrency(MONTHLY_TARGET)}</span>
                </div>
                <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pctOfMonth}%`, background: "linear-gradient(90deg, #f59e0b, #eab308)" }}
                  />
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Period Breakdown */}
      <div className="border border-border p-6">
        <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-accent mb-4">Period Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Period", "Booked Revenue", "Gross Revenue", "Total"].map(h => (
                  <th key={h} className="text-left font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground py-2 px-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { period: "This Month", booked: revenueSummary.bookedMonth, gross: revenueSummary.grossMonth },
                { period: "This Quarter", booked: revenueSummary.bookedQuarter, gross: revenueSummary.grossQuarter },
                { period: "This Year", booked: revenueSummary.bookedYear, gross: revenueSummary.grossYear },
              ].map(row => (
                <tr key={row.period} className="border-b border-border/50">
                  <td className="py-2.5 px-3 font-sans text-xs text-foreground">{row.period}</td>
                  <td className="py-2.5 px-3 font-mono text-xs text-amber-500">{formatCurrency(row.booked)}</td>
                  <td className="py-2.5 px-3 font-mono text-xs text-emerald-500">{formatCurrency(row.gross)}</td>
                  <td className="py-2.5 px-3 font-mono text-xs text-accent">{formatCurrency(row.booked + row.gross)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Post-Show Email Engagement */}
      <div className="border border-border p-6">
        <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-accent mb-1">Post-Show Email Engagement</h3>
        <p className="font-sans text-[10px] text-muted-foreground mb-4">How completed clients engage with the post-show drip sequence</p>
        
        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { icon: Mail, label: "Emails Sent", value: postShowEngagement.totalSends },
            { icon: Eye, label: "Total Opens", value: postShowEngagement.totalOpens },
            { icon: MousePointerClick, label: "Total Clicks", value: postShowEngagement.totalClicks },
            { icon: CheckCircle, label: "Unique Openers", value: postShowEngagement.uniqueOpeners },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <stat.icon size={18} className="mx-auto mb-1 text-muted-foreground" />
              <p className="font-serif text-2xl text-foreground">{stat.value}</p>
              <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Per-step table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Email", "Sends", "Opens", "Open Rate", "Clicks", "Click Rate"].map(h => (
                  <th key={h} className="text-left font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground py-2 px-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {postShowEngagement.steps.map(row => (
                <tr key={row.step} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-2.5 px-3 font-sans text-xs text-foreground">{row.label}</td>
                  <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">{row.sends}</td>
                  <td className="py-2.5 px-3 font-mono text-xs text-foreground">{row.opens}</td>
                  <td className="py-2.5 px-3">
                    <span className={`font-mono text-xs ${row.openRate >= 40 ? "text-emerald-500" : row.openRate >= 20 ? "text-amber-500" : "text-muted-foreground"}`}>
                      {row.openRate}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-xs text-foreground">{row.clicks}</td>
                  <td className="py-2.5 px-3">
                    <span className={`font-mono text-xs ${row.clickRate >= 10 ? "text-emerald-500" : row.clickRate >= 3 ? "text-amber-500" : "text-muted-foreground"}`}>
                      {row.clickRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Show Tracker */}
      <div className="border border-border p-6">
        <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-accent mb-1">Monthly Show Tracker</h3>
        <p className="font-sans text-[10px] text-muted-foreground mb-4">Booked + completed shows per month vs 8/month goal</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthlyShows}>
            <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
            <ReferenceLine y={8} stroke="hsl(var(--accent))" strokeDasharray="4 4" label={{ value: "Goal: 8", position: "right", fontSize: 10, fill: "hsl(var(--accent))" }} />
            <Bar dataKey="shows" fill="hsl(var(--accent))" radius={[2, 2, 0, 0]} name="Shows" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pipeline Funnel */}
      <div className="border border-border p-6">
        <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-accent mb-4">Pipeline Funnel</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={funnelData} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis dataKey="stage" type="category" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={110} />
            <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
            <Bar dataKey="count" name="Deals" radius={[0, 4, 4, 0]}>
              {funnelData.map((entry) => (
                <Cell key={entry.stage} fill={FUNNEL_COLORS[entry.stage] || "hsl(var(--accent))"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Source Performance Table */}
      <div className="border border-border p-6">
        <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-accent mb-4">Source Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Source", "Leads", "Booked", "Conv. Rate", "Revenue"].map(h => (
                  <th key={h} className="text-left font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground py-2 px-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sourcePerformance.map(row => (
                <tr key={row.source} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-2.5 px-3 font-sans text-xs text-foreground">{row.label}</td>
                  <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">{row.leads}</td>
                  <td className="py-2.5 px-3 font-mono text-xs text-foreground">{row.booked}</td>
                  <td className="py-2.5 px-3">
                    <span className={`font-mono text-xs ${row.conversionRate >= 30 ? "text-emerald-500" : row.conversionRate >= 15 ? "text-amber-500" : "text-muted-foreground"}`}>
                      {row.conversionRate}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-xs text-accent">{formatCurrency(row.revenue)}</td>
                </tr>
              ))}
              {sourcePerformance.length === 0 && (
                <tr><td colSpan={5} className="text-center text-muted-foreground py-6 text-xs">No deals yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Follow-Up Health */}
      <div className="border border-border p-6">
        <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-accent mb-4">Follow-Up Health</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { icon: AlertTriangle, label: "Overdue", count: followUpHealth.overdue.length, color: "text-red-500" },
            { icon: Clock, label: "Today", count: followUpHealth.today.length, color: "text-amber-500" },
            { icon: Calendar, label: "This Week", count: followUpHealth.thisWeek.length, color: "text-emerald-500" },
            { icon: CheckCircle, label: "No Follow-Up Set", count: followUpHealth.noFollowUp.length, color: "text-muted-foreground" },
          ].map(item => (
            <div key={item.label} className="text-center">
              <item.icon size={20} className={`mx-auto mb-1 ${item.color}`} />
              <p className={`font-serif text-2xl ${item.color}`}>{item.count}</p>
              <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>

        {followUpHealth.overdue.length > 0 && (
          <div>
            <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-red-500 mb-2">Overdue Follow-Ups</p>
            <div className="space-y-1">
              {followUpHealth.overdue.slice(0, 8).map(d => (
                <div key={d.id} className="flex items-center justify-between border border-border/50 px-3 py-2">
                  <span className="font-sans text-xs text-foreground">{d.contact_name || d.contact_email}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-sans text-[10px] text-muted-foreground">{STAGE_LABELS[d.stage]}</span>
                    <span className="font-mono text-[10px] text-red-500">{d.next_follow_up}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueTab;
