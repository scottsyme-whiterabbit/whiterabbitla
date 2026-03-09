import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Eye, MousePointer, TrendingUp, ChevronDown, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subDays, parseISO } from "date-fns";

interface ContactEngagement {
  id: string;
  name: string | null;
  email: string;
  company: string | null;
  drip_campaign: string;
  engagement_status: string;
  opens_count: number;
  clicks_count: number;
  last_activity: string | null;
  opens: { id: string; opened_at: string; drip_step: number }[];
  clicks: { id: string; clicked_at: string; drip_step: number; link_slug: string }[];
}

interface DayData {
  date: string;
  opens: number;
  clicks: number;
}

const EmailAnalyticsTab = () => {
  const [loading, setLoading] = useState(true);
  const [totalSent, setTotalSent] = useState(0);
  const [totalOpens, setTotalOpens] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [chartData, setChartData] = useState<DayData[]>([]);
  const [contactEngagements, setContactEngagements] = useState<ContactEngagement[]>([]);
  const [expandedContact, setExpandedContact] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      // Parallel queries
      const [sentRes, opensRes, clicksRes, contactsRes] = await Promise.all([
        supabase.from("newsletter_contacts").select("id", { count: "exact", head: true }).not("last_emailed_at", "is", null),
        supabase.from("newsletter_opens").select("*"),
        supabase.from("newsletter_clicks").select("*"),
        supabase.from("newsletter_contacts").select("id, name, email, company, drip_campaign, engagement_status"),
      ]);

      const opens = opensRes.data || [];
      const clicks = clicksRes.data || [];
      const contacts = contactsRes.data || [];

      setTotalSent(sentRes.count || 0);
      setTotalOpens(opens.length);
      setTotalClicks(clicks.length);

      // Chart data: last 30 days
      const now = new Date();
      const days: DayData[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = subDays(now, i);
        const key = format(d, "yyyy-MM-dd");
        days.push({ date: format(d, "MMM d"), opens: 0, clicks: 0 });
        opens.forEach(o => {
          if (o.opened_at?.startsWith(key)) days[days.length - 1].opens++;
        });
        clicks.forEach(c => {
          if (c.clicked_at?.startsWith(key)) days[days.length - 1].clicks++;
        });
      }
      setChartData(days);

      // Per-contact engagement
      const engagements: ContactEngagement[] = contacts.map(c => {
        const cOpens = opens.filter(o => o.contact_id === c.id);
        const cClicks = clicks.filter(cl => cl.contact_id === c.id);
        const allDates = [
          ...cOpens.map(o => o.opened_at),
          ...cClicks.map(cl => cl.clicked_at),
        ].filter(Boolean).sort().reverse();

        return {
          ...c,
          opens_count: cOpens.length,
          clicks_count: cClicks.length,
          last_activity: allDates[0] || null,
          opens: cOpens.map(o => ({ id: o.id, opened_at: o.opened_at, drip_step: o.drip_step })).sort((a, b) => b.opened_at.localeCompare(a.opened_at)),
          clicks: cClicks.map(cl => ({ id: cl.id, clicked_at: cl.clicked_at, drip_step: cl.drip_step, link_slug: cl.link_slug })).sort((a, b) => b.clicked_at.localeCompare(a.clicked_at)),
        };
      });

      // Sort by most engaged first
      engagements.sort((a, b) => (b.opens_count + b.clicks_count) - (a.opens_count + a.clicks_count));
      setContactEngagements(engagements);
    } catch (e) {
      console.error("Failed to load email analytics", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  const openRate = totalSent > 0 ? ((totalOpens / totalSent) * 100).toFixed(1) : "0";
  const clickRate = totalSent > 0 ? ((totalClicks / totalSent) * 100).toFixed(1) : "0";

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground font-sans text-sm">Loading analytics...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Aggregate Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Emails Sent", value: totalSent.toLocaleString(), icon: Mail },
          { label: "Total Opens", value: totalOpens.toLocaleString(), icon: Eye },
          { label: "Total Clicks", value: totalClicks.toLocaleString(), icon: MousePointer },
          { label: "Open Rate", value: `${openRate}%`, icon: TrendingUp },
          { label: "Click Rate", value: `${clickRate}%`, icon: TrendingUp },
        ].map(stat => (
          <div key={stat.label} className="border border-border p-4 md:p-6">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={14} className="text-accent" />
              <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">{stat.label}</span>
            </div>
            <p className="font-serif text-2xl md:text-3xl text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="border border-border p-4 md:p-6">
        <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">Opens & Clicks — Last 30 Days</h3>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  fontSize: 12,
                  fontFamily: "Montserrat, sans-serif",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: "Montserrat, sans-serif" }} />
              <Bar dataKey="opens" fill="hsl(var(--accent))" radius={[2, 2, 0, 0]} />
              <Bar dataKey="clicks" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="border border-border">
        <div className="p-4 md:p-6 border-b border-border">
          <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground">Per-Contact Engagement</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-sans">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-medium"></th>
                <th className="px-4 py-3 text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-medium">Name</th>
                <th className="px-4 py-3 text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-medium hidden md:table-cell">Email</th>
                <th className="px-4 py-3 text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-medium hidden md:table-cell">Company</th>
                <th className="px-4 py-3 text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-medium hidden md:table-cell">Campaign</th>
                <th className="px-4 py-3 text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-medium">Status</th>
                <th className="px-4 py-3 text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-medium text-center">Opens</th>
                <th className="px-4 py-3 text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-medium text-center">Clicks</th>
                <th className="px-4 py-3 text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-medium hidden md:table-cell">Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {contactEngagements.filter(c => c.opens_count > 0 || c.clicks_count > 0).map(c => (
                <>
                  <tr
                    key={c.id}
                    onClick={() => setExpandedContact(expandedContact === c.id ? null : c.id)}
                    className="border-b border-border/50 hover:bg-muted/20 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-muted-foreground">
                      {expandedContact === c.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </td>
                    <td className="px-4 py-3 text-foreground">{c.name || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{c.email}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{c.company || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{c.drip_campaign}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] tracking-wider uppercase ${
                        c.engagement_status === "hot" ? "text-destructive" :
                        c.engagement_status === "warm" ? "text-orange-400" :
                        "text-muted-foreground"
                      }`}>{c.engagement_status}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-foreground font-medium">{c.opens_count}</td>
                    <td className="px-4 py-3 text-center text-foreground font-medium">{c.clicks_count}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {c.last_activity ? format(parseISO(c.last_activity), "MMM d, h:mm a") : "—"}
                    </td>
                  </tr>
                  {expandedContact === c.id && (
                    <tr key={`${c.id}-detail`} className="bg-muted/10">
                      <td colSpan={9} className="px-8 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {c.opens.length > 0 && (
                            <div>
                              <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-2 flex items-center gap-1"><Eye size={10} /> Opens ({c.opens.length})</p>
                              <div className="space-y-1 max-h-40 overflow-y-auto">
                                {c.opens.map(o => (
                                  <div key={o.id} className="text-xs text-muted-foreground">
                                    Step {o.drip_step} — {format(parseISO(o.opened_at), "MMM d, yyyy h:mm a")}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {c.clicks.length > 0 && (
                            <div>
                              <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-2 flex items-center gap-1"><MousePointer size={10} /> Clicks ({c.clicks.length})</p>
                              <div className="space-y-1 max-h-40 overflow-y-auto">
                                {c.clicks.map(cl => (
                                  <div key={cl.id} className="text-xs text-muted-foreground">
                                    Step {cl.drip_step} — <span className="text-foreground">{cl.link_slug}</span> — {format(parseISO(cl.clicked_at), "MMM d, yyyy h:mm a")}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {contactEngagements.filter(c => c.opens_count > 0 || c.clicks_count > 0).length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-muted-foreground">No engagement data yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmailAnalyticsTab;
