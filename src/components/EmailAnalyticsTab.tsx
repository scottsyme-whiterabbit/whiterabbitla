import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Eye, MousePointer, TrendingUp, ChevronDown, ChevronRight, AlertTriangle, Filter } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subDays, parseISO } from "date-fns";

interface BounceRecord {
  id: string;
  contact_id: string | null;
  email: string;
  bounce_type: string;
  reason: string | null;
  created_at: string;
}

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
  has_bounced: boolean;
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
  const [totalBounced, setTotalBounced] = useState(0);
  const [chartData, setChartData] = useState<DayData[]>([]);
  const [contactEngagements, setContactEngagements] = useState<ContactEngagement[]>([]);
  const [bounceRecords, setBounceRecords] = useState<BounceRecord[]>([]);
  const [expandedContact, setExpandedContact] = useState<string | null>(null);
  const [showBouncedOnly, setShowBouncedOnly] = useState(false);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [sentRes, opensRes, clicksRes, contactsRes, bouncesRes] = await Promise.all([
        supabase.from("newsletter_contacts").select("id", { count: "exact", head: true }).not("last_emailed_at", "is", null),
        supabase.from("newsletter_opens").select("*"),
        supabase.from("newsletter_clicks").select("*"),
        supabase.from("newsletter_contacts").select("id, name, email, company, drip_campaign, engagement_status"),
        supabase.from("email_bounces").select("*").order("created_at", { ascending: false }),
      ]);

      const opens = opensRes.data || [];
      const clicks = clicksRes.data || [];
      const contacts = contactsRes.data || [];
      const bounces = (bouncesRes.data || []) as BounceRecord[];

      setTotalSent(sentRes.count || 0);
      setTotalOpens(opens.length);
      setTotalClicks(clicks.length);
      setBounceRecords(bounces);

      // Count unique bounced contacts
      const bouncedContactIds = new Set(bounces.map(b => b.contact_id).filter(Boolean));
      const bouncedEmails = new Set(bounces.map(b => b.email.toLowerCase()));
      setTotalBounced(Math.max(bouncedContactIds.size, bouncedEmails.size));

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

        const hasBounced = bouncedContactIds.has(c.id) || bouncedEmails.has(c.email.toLowerCase());

        return {
          ...c,
          opens_count: cOpens.length,
          clicks_count: cClicks.length,
          last_activity: allDates[0] || null,
          has_bounced: hasBounced,
          opens: cOpens.map(o => ({ id: o.id, opened_at: o.opened_at, drip_step: o.drip_step })).sort((a, b) => b.opened_at.localeCompare(a.opened_at)),
          clicks: cClicks.map(cl => ({ id: cl.id, clicked_at: cl.clicked_at, drip_step: cl.drip_step, link_slug: cl.link_slug })).sort((a, b) => b.clicked_at.localeCompare(a.clicked_at)),
        };
      });

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

  const filteredContacts = contactEngagements.filter(c => {
    if (showBouncedOnly) return c.has_bounced;
    return c.opens_count > 0 || c.clicks_count > 0 || c.has_bounced;
  });

  return (
    <div className="space-y-8">
      {/* Aggregate Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: "Emails Sent", value: totalSent.toLocaleString(), icon: Mail, color: "text-accent" },
          { label: "Total Opens", value: totalOpens.toLocaleString(), icon: Eye, color: "text-accent" },
          { label: "Total Clicks", value: totalClicks.toLocaleString(), icon: MousePointer, color: "text-accent" },
          { label: "Open Rate", value: `${openRate}%`, icon: TrendingUp, color: "text-accent" },
          { label: "Click Rate", value: `${clickRate}%`, icon: TrendingUp, color: "text-accent" },
          { label: "Bounced", value: totalBounced.toLocaleString(), icon: AlertTriangle, color: "text-destructive" },
        ].map(stat => (
          <div key={stat.label} className="border border-border p-4 md:p-6">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={14} className={stat.color} />
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

      {/* Bounced Contacts Section */}
      {bounceRecords.length > 0 && (
        <div className="border border-destructive/30">
          <div className="p-4 md:p-6 border-b border-destructive/30 bg-destructive/5">
            <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-destructive flex items-center gap-2">
              <AlertTriangle size={14} /> Bounced / Complained Contacts ({bounceRecords.length} events)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-medium">Email</th>
                  <th className="px-4 py-3 text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-medium hidden md:table-cell">Name</th>
                  <th className="px-4 py-3 text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-medium">Type</th>
                  <th className="px-4 py-3 text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-medium hidden md:table-cell">Reason</th>
                  <th className="px-4 py-3 text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {bounceRecords.map(b => {
                  const contact = contactEngagements.find(c => c.id === b.contact_id || c.email.toLowerCase() === b.email.toLowerCase());
                  return (
                    <tr key={b.id} className="border-b border-border/50">
                      <td className="px-4 py-3 text-foreground">{b.email}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{contact?.name || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] tracking-wider uppercase font-medium ${
                          b.bounce_type === "complained" ? "text-destructive" : "text-orange-400"
                        }`}>{b.bounce_type}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell max-w-[300px] truncate">{b.reason || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{format(parseISO(b.created_at), "MMM d, h:mm a")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Contacts Table */}
      <div className="border border-border">
        <div className="p-4 md:p-6 border-b border-border flex items-center justify-between">
          <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground">Per-Contact Engagement</h3>
          <button
            onClick={() => setShowBouncedOnly(!showBouncedOnly)}
            className={`flex items-center gap-1.5 font-sans text-[10px] tracking-[0.15em] uppercase transition-colors ${
              showBouncedOnly ? "text-destructive" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Filter size={12} />
            {showBouncedOnly ? "Showing Bounced" : "Filter Bounced"}
          </button>
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
              {filteredContacts.map(c => (
                <>
                  <tr
                    key={c.id}
                    onClick={() => setExpandedContact(expandedContact === c.id ? null : c.id)}
                    className="border-b border-border/50 hover:bg-muted/20 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-muted-foreground">
                      {expandedContact === c.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      <span className="flex items-center gap-2">
                        {c.name || "—"}
                        {c.has_bounced && (
                          <span className="inline-flex items-center gap-0.5 bg-destructive/15 text-destructive text-[9px] tracking-wider uppercase font-medium px-1.5 py-0.5 rounded">
                            <AlertTriangle size={9} /> Bounced
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{c.email}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{c.company || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{c.drip_campaign}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] tracking-wider uppercase ${
                        c.engagement_status === "hot" ? "text-destructive" :
                        c.engagement_status === "warm" ? "text-orange-400" :
                        c.engagement_status === "bounced" ? "text-destructive" :
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
              {filteredContacts.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-muted-foreground">
                    {showBouncedOnly ? "No bounced contacts" : "No engagement data yet"}
                  </td>
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
