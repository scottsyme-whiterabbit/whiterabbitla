import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle, TrendingUp, DollarSign, Target, Mail } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface Contact {
  id: string;
  drip_campaign: string;
  engagement_status: string;
  subscribed: boolean;
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

interface Deal {
  id: string;
  source: string | null;
  stage: string;
  deal_value: number | null;
  created_at: string;
}

interface Props {
  storedPassword: string;
}

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(cents / 100);

// Map raw deal.source values into clean human channels
const channelLabel = (src: string | null): string => {
  if (!src) return "Unknown";
  const s = src.toLowerCase();
  if (s.includes("referral")) return "Referral";
  if (s.includes("planner") && s.includes("drip")) return "Email, Planner Drip";
  if (s.includes("resident") && s.includes("drip")) return "Email, Resident Drip";
  if (s.includes("cold") && s.includes("drip")) return "Email, Cold Outreach";
  if (s.includes("post-show") || s.includes("post_show")) return "Email, Post-Show";
  if (s.includes("inquiry") || s.includes("nurture")) return "Email, Inquiry Nurture";
  if (s.includes("drip") || s.includes("newsletter") || s.includes("email")) return "Email, Other";
  if (s.includes("meta") || s.includes("facebook") || s.includes("instagram") || s.includes("ad")) return "Meta Ads";
  if (s.includes("quiz")) return "Site, Discovery Quiz";
  if (s.includes("contact") || s.includes("form") || s.includes("inbound")) return "Site, Contact Form";
  if (s.includes("consultation")) return "Site, Consultation Form";
  if (s.includes("magic castle") || s.includes("castle")) return "Magic Castle";
  if (s.includes("apollo") || s.includes("outreach")) return "Manual Outreach";
  if (s.includes("manual") || s.includes("square")) return "Manual / Imported";
  return src;
};

// Group send_log campaign_id values into drip campaign families
const dripFamily = (campaignId: string): string | null => {
  if (!campaignId) return null;
  if (campaignId.startsWith("planner-warm")) return "Planner Re-engage";
  if (campaignId.startsWith("planner-")) return "Planner Drip";
  if (campaignId.startsWith("resident-pulse") || campaignId.startsWith("pulse-")) return "Resident Pulse";
  if (campaignId.startsWith("resident-warm")) return "Resident Re-engage";
  if (campaignId.startsWith("resident-")) return "Resident Drip";
  if (campaignId.startsWith("post-show")) return "Post-Show";
  if (campaignId.startsWith("inquiry-followup")) return "Inquiry Follow-Up";
  if (campaignId.startsWith("inquiry-nurture")) return "Inquiry Nurture";
  if (campaignId.startsWith("warm-")) return "Warm Re-engage";
  if (campaignId.startsWith("cold-")) return "Cold Outreach";
  return "Other";
};

// Map a contact's drip_campaign field to the same family label (best-effort for opens/clicks)
const contactDripFamily = (drip: string): string | null => {
  const d = (drip || "").toLowerCase();
  if (d.startsWith("planner-warm") || d === "planner-warm") return "Planner Re-engage";
  if (d.startsWith("planner")) return "Planner Drip";
  if (d.startsWith("resident-pulse") || d === "resident-pulse") return "Resident Pulse";
  if (d.startsWith("resident-warm")) return "Resident Re-engage";
  if (d.startsWith("resident")) return "Resident Drip";
  if (d.startsWith("post-show")) return "Post-Show";
  if (d.startsWith("inquiry-followup")) return "Inquiry Follow-Up";
  if (d.startsWith("inquiry-nurture") || d === "inquiry") return "Inquiry Nurture";
  if (d.startsWith("warm")) return "Warm Re-engage";
  if (d.startsWith("cold")) return "Cold Outreach";
  return null;
};

const AnalyticsTab = ({ storedPassword }: Props) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [sendLog, setSendLog] = useState<SendLog[]>([]);
  const [opens, setOpens] = useState<OpenLog[]>([]);
  const [clicks, setClicks] = useState<ClickLog[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

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
        const [contactsRes, sendsRes, opensRes, clicksRes, dealsRes] = await Promise.all([
          callAdmin("get_contacts_full"),
          callAdmin("get_send_log"),
          callAdmin("get_opens_log"),
          callAdmin("get_clicks_log"),
          callAdmin("get_deals"),
        ]);
        setContacts(contactsRes.contacts || []);
        setSendLog(sendsRes.sends || []);
        setOpens(opensRes.opens || []);
        setClicks(clicksRes.clicks || []);
        setDeals(dealsRes.deals || []);
      } catch {
        toast.error("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [callAdmin]);

  // Exclude legacy Square Import
  const cleanDeals = useMemo(() => deals.filter(d => (d.source || "").toLowerCase() !== "square import"), [deals]);

  // === Booking Source Attribution ===
  const attribution = useMemo(() => {
    const map = new Map<string, { leads: number; booked: number; revenue: number }>();
    cleanDeals.forEach(d => {
      const label = channelLabel(d.source);
      const e = map.get(label) || { leads: 0, booked: 0, revenue: 0 };
      e.leads++;
      if (d.stage === "booked" || d.stage === "completed") {
        e.booked++;
        e.revenue += d.deal_value || 0;
      }
      map.set(label, e);
    });
    return Array.from(map.entries())
      .map(([channel, v]) => ({
        channel,
        ...v,
        convRate: v.leads > 0 ? Math.round((v.booked / v.leads) * 100) : 0,
      }))
      .sort((a, b) => b.booked - a.booked || b.revenue - a.revenue);
  }, [cleanDeals]);

  const totalBooked = useMemo(() => attribution.reduce((s, r) => s + r.booked, 0), [attribution]);
  const totalRevenue = useMemo(() => attribution.reduce((s, r) => s + r.revenue, 0), [attribution]);
  const topChannel = attribution[0];

  // === Per-Drip-Campaign Performance ===
  const contactCampaignMap = useMemo(() => {
    const m = new Map<string, string | null>();
    contacts.forEach(c => m.set(c.id, contactDripFamily(c.drip_campaign)));
    return m;
  }, [contacts]);

  const dripPerformance = useMemo(() => {
    const families = new Map<string, { sends: number; opens: number; clicks: number; uniqueOpeners: Set<string> }>();
    const init = () => ({ sends: 0, opens: 0, clicks: 0, uniqueOpeners: new Set<string>() });

    sendLog.forEach(s => {
      const fam = dripFamily(s.campaign_id);
      if (!fam) return;
      if (!families.has(fam)) families.set(fam, init());
      families.get(fam)!.sends++;
    });

    opens.forEach(o => {
      const fam = contactCampaignMap.get(o.contact_id);
      if (!fam) return;
      if (!families.has(fam)) families.set(fam, init());
      const f = families.get(fam)!;
      f.opens++;
      f.uniqueOpeners.add(o.contact_id);
    });

    clicks.forEach(c => {
      const fam = contactCampaignMap.get(c.contact_id);
      if (!fam) return;
      if (!families.has(fam)) families.set(fam, init());
      families.get(fam)!.clicks++;
    });

    return Array.from(families.entries())
      .map(([campaign, v]) => ({
        campaign,
        sends: v.sends,
        opens: v.opens,
        clicks: v.clicks,
        uniqueOpeners: v.uniqueOpeners.size,
        openRate: v.sends > 0 ? Math.round((v.opens / v.sends) * 100) : 0,
        clickRate: v.sends > 0 ? Math.round((v.clicks / v.sends) * 100) : 0,
      }))
      .filter(r => r.sends > 0 || r.opens > 0)
      .sort((a, b) => b.sends - a.sends);
  }, [sendLog, opens, clicks, contactCampaignMap]);

  // Overall drip rates
  const overallDrip = useMemo(() => {
    const sends = dripPerformance.reduce((s, r) => s + r.sends, 0);
    const opens = dripPerformance.reduce((s, r) => s + r.opens, 0);
    const clicks = dripPerformance.reduce((s, r) => s + r.clicks, 0);
    return {
      sends,
      opens,
      clicks,
      openRate: sends > 0 ? ((opens / sends) * 100).toFixed(1) : "0",
      clickRate: sends > 0 ? ((clicks / sends) * 100).toFixed(1) : "0",
    };
  }, [dripPerformance]);

  // === 30-day Trend ===
  const sendsOverTime = useMemo(() => {
    const now = new Date();
    const days: { date: string; sends: number; opens: number; clicks: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({
        date: key.slice(5),
        sends: sendLog.filter(s => s.sent_at.slice(0, 10) === key).length,
        opens: opens.filter(o => o.opened_at.slice(0, 10) === key).length,
        clicks: clicks.filter(c => c.clicked_at.slice(0, 10) === key).length,
      });
    }
    return days;
  }, [sendLog, opens, clicks]);

  // === Anomaly (week-over-week open rate) ===
  const anomaly = useMemo(() => {
    const now = new Date();
    const last7 = sendLog.filter(s => (now.getTime() - new Date(s.sent_at).getTime()) < 7 * 86400000);
    const prior7 = sendLog.filter(s => {
      const diff = now.getTime() - new Date(s.sent_at).getTime();
      return diff >= 7 * 86400000 && diff < 14 * 86400000;
    });
    const lastOpens = opens.filter(o => (now.getTime() - new Date(o.opened_at).getTime()) < 7 * 86400000).length;
    const priorOpens = opens.filter(o => {
      const diff = now.getTime() - new Date(o.opened_at).getTime();
      return diff >= 7 * 86400000 && diff < 14 * 86400000;
    }).length;
    const lastRate = last7.length > 0 ? (lastOpens / last7.length) * 100 : 0;
    const priorRate = prior7.length > 0 ? (priorOpens / prior7.length) * 100 : 0;
    const drop = priorRate > 0 ? ((priorRate - lastRate) / priorRate) * 100 : 0;
    return {
      lastRate: lastRate.toFixed(1),
      priorRate: priorRate.toFixed(1),
      dropPercent: drop.toFixed(1),
      isAnomaly: drop > 20 && prior7.length >= 5,
    };
  }, [sendLog, opens]);

  if (loading) {
    return <p className="text-center text-muted-foreground py-12">Loading analytics...</p>;
  }

  return (
    <div className="space-y-8">
      {/* Anomaly Alert */}
      {anomaly.isAnomaly && (
        <div className="border border-destructive/50 bg-destructive/5 p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="font-sans text-sm text-foreground font-medium">Open Rate Drop Detected</p>
            <p className="font-sans text-xs text-muted-foreground mt-1">
              Open rate dropped {anomaly.dropPercent}%, from {anomaly.priorRate}% (prior week) to {anomaly.lastRate}% (this week). Review subject lines or sending frequency.
            </p>
          </div>
        </div>
      )}

      {/* === Top KPI cards === */}
      <div>
        <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-accent mb-4">At a Glance</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Target, label: "Bookings Won", value: totalBooked.toString(), sub: `${cleanDeals.length} total leads` },
            { icon: DollarSign, label: "Booked Revenue", value: formatCurrency(totalRevenue), sub: "Booked + Completed" },
            { icon: TrendingUp, label: "Top Channel", value: topChannel?.channel || "", sub: topChannel ? `${topChannel.booked} bookings · ${topChannel.convRate}% conv` : "No bookings yet" },
            { icon: Mail, label: "Drip Open Rate", value: `${overallDrip.openRate}%`, sub: `${overallDrip.sends.toLocaleString()} sends · ${overallDrip.clickRate}% CTR` },
          ].map(stat => (
            <div key={stat.label} className="border border-border p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <stat.icon size={14} />
                <span className="font-sans text-[10px] tracking-[0.15em] uppercase">{stat.label}</span>
              </div>
              <p className="font-serif text-xl text-foreground truncate">{stat.value}</p>
              <p className="font-sans text-[10px] text-muted-foreground mt-1 truncate">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* === Booking Source Attribution === */}
      <div className="border border-border p-6">
        <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-accent mb-1">Where Bookings Come From</h3>
        <p className="font-sans text-[10px] text-muted-foreground mb-4">
          Every closed deal grouped by its source channel, sorted by bookings won.
        </p>
        {attribution.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Channel", "Leads", "Booked", "Conv. Rate", "Revenue", "Share of Revenue"].map(h => (
                    <th key={h} className="text-left font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground py-2 px-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attribution.map(row => {
                  const revShare = totalRevenue > 0 ? Math.round((row.revenue / totalRevenue) * 100) : 0;
                  return (
                    <tr key={row.channel} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-3 font-sans text-xs text-foreground">{row.channel}</td>
                      <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">{row.leads}</td>
                      <td className="py-2.5 px-3 font-mono text-xs text-foreground">{row.booked}</td>
                      <td className="py-2.5 px-3">
                        <span className={`font-mono text-xs ${row.convRate >= 30 ? "text-emerald-500" : row.convRate >= 15 ? "text-amber-500" : "text-muted-foreground"}`}>
                          {row.convRate}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs text-accent">{formatCurrency(row.revenue)}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[120px] h-1.5 bg-muted/30 rounded-sm overflow-hidden">
                            <div className="h-full bg-accent/70" style={{ width: `${revShare}%` }} />
                          </div>
                          <span className="font-mono text-[10px] text-muted-foreground w-8 text-right">{revShare}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">No deal data yet.</p>
        )}
      </div>

      {/* === Per-Drip Performance === */}
      <div className="border border-border p-6">
        <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-accent mb-1">Drip Campaign Performance</h3>
        <p className="font-sans text-[10px] text-muted-foreground mb-4">
          Open & click rates broken out by drip family. (Opens/clicks are attributed via the contact's current drip campaign.)
        </p>
        {dripPerformance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Campaign", "Sends", "Opens", "Unique Openers", "Open Rate", "Clicks", "Click Rate"].map(h => (
                    <th key={h} className="text-left font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground py-2 px-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dripPerformance.map(row => (
                  <tr key={row.campaign} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 px-3 font-sans text-xs text-foreground">{row.campaign}</td>
                    <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">{row.sends.toLocaleString()}</td>
                    <td className="py-2.5 px-3 font-mono text-xs text-foreground">{row.opens.toLocaleString()}</td>
                    <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">{row.uniqueOpeners.toLocaleString()}</td>
                    <td className="py-2.5 px-3">
                      <span className={`font-mono text-xs ${row.openRate >= 40 ? "text-emerald-500" : row.openRate >= 20 ? "text-amber-500" : "text-muted-foreground"}`}>
                        {row.openRate}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs text-foreground">{row.clicks.toLocaleString()}</td>
                    <td className="py-2.5 px-3">
                      <span className={`font-mono text-xs ${row.clickRate >= 10 ? "text-emerald-500" : row.clickRate >= 3 ? "text-amber-500" : "text-muted-foreground"}`}>
                        {row.clickRate}%
                      </span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted/10">
                  <td className="py-2.5 px-3 font-sans text-xs text-foreground font-medium">All Drips</td>
                  <td className="py-2.5 px-3 font-mono text-xs text-foreground">{overallDrip.sends.toLocaleString()}</td>
                  <td className="py-2.5 px-3 font-mono text-xs text-foreground">{overallDrip.opens.toLocaleString()}</td>
                  <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground"></td>
                  <td className="py-2.5 px-3 font-mono text-xs text-accent">{overallDrip.openRate}%</td>
                  <td className="py-2.5 px-3 font-mono text-xs text-foreground">{overallDrip.clicks.toLocaleString()}</td>
                  <td className="py-2.5 px-3 font-mono text-xs text-accent">{overallDrip.clickRate}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">No drip activity yet.</p>
        )}
      </div>

      {/* === 30-day Trend === */}
      <div className="border border-border p-6">
        <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-accent mb-4">Sends, Opens & Clicks, Last 30 Days</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={sendsOverTime}>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
            <Line type="monotone" dataKey="sends" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} name="Sends" />
            <Line type="monotone" dataKey="opens" stroke="#10b981" strokeWidth={2} dot={false} name="Opens" />
            <Line type="monotone" dataKey="clicks" stroke="#f59e0b" strokeWidth={2} dot={false} name="Clicks" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* === Engagement Breakdown === */}
      <div className="border border-border p-6">
        <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-accent mb-4">Contact Engagement Breakdown</h3>
        <div className="space-y-2">
          {(() => {
            const map = new Map<string, number>();
            contacts.filter(c => c.subscribed).forEach(c => {
              map.set(c.engagement_status, (map.get(c.engagement_status) || 0) + 1);
            });
            const total = contacts.filter(c => c.subscribed).length;
            return Array.from(map.entries()).map(([name, value]) => {
              const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
              return (
                <div key={name} className="flex items-center gap-3">
                  <span className="font-sans text-xs text-muted-foreground w-20 capitalize">{name}</span>
                  <div className="flex-1 bg-border/30 h-4 rounded-sm overflow-hidden">
                    <div className="h-full bg-accent/70 rounded-sm transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="font-sans text-xs text-foreground w-20 text-right">{value} ({pct}%)</span>
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
