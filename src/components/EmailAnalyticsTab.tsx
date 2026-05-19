import { useState, useEffect, useCallback, useMemo } from "react";
import { Mail, Eye, MousePointer, TrendingUp, ChevronDown, ChevronRight, AlertTriangle, Filter } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subDays, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface BounceRecord {
  id: string;
  contact_id: string | null;
  email: string;
  bounce_type: string;
  reason: string | null;
  created_at: string;
}

interface Contact {
  id: string;
  name: string | null;
  email: string;
  company: string | null;
  drip_campaign: string;
  engagement_status: string;
}

interface OpenRow { contact_id: string; opened_at: string; drip_step: number }
interface ClickRow { contact_id: string; clicked_at: string; drip_step: number; link_slug: string }
interface SendRow { contact_id: string; sent_at: string; campaign_id: string }

interface ContactEngagement extends Contact {
  opens_count: number;
  clicks_count: number;
  last_activity: string | null;
  has_bounced: boolean;
  opens: { opened_at: string; drip_step: number }[];
  clicks: { clicked_at: string; drip_step: number; link_slug: string }[];
}

interface DayData { date: string; opens: number; clicks: number }

// Group send_log campaign_id into drip families
const dripFamily = (campaignId: string): string => {
  if (!campaignId) return "Other";
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

const contactDripFamily = (drip: string): string => {
  const d = (drip || "").toLowerCase();
  if (d.startsWith("planner-warm")) return "Planner Re-engage";
  if (d.startsWith("planner")) return "Planner Drip";
  if (d.startsWith("resident-pulse") || d === "resident-pulse") return "Resident Pulse";
  if (d.startsWith("resident-warm")) return "Resident Re-engage";
  if (d.startsWith("resident")) return "Resident Drip";
  if (d.startsWith("post-show")) return "Post-Show";
  if (d.startsWith("inquiry-followup")) return "Inquiry Follow-Up";
  if (d.startsWith("inquiry-nurture") || d === "inquiry") return "Inquiry Nurture";
  if (d.startsWith("warm")) return "Warm Re-engage";
  if (d.startsWith("cold")) return "Cold Outreach";
  return "Other";
};

interface Props { storedPassword?: string }

const EmailAnalyticsTab = ({ storedPassword: passedPwd }: Props = {}) => {
  // Pull stored admin password from sessionStorage as fallback so this tab is
  // self-sufficient even when AdminNewsletter doesn't pass it as a prop.
  const storedPassword = passedPwd || (typeof window !== "undefined" ? sessionStorage.getItem("newsletterAdminPassword") || "" : "");

  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [opens, setOpens] = useState<OpenRow[]>([]);
  const [clicks, setClicks] = useState<ClickRow[]>([]);
  const [sends, setSends] = useState<SendRow[]>([]);
  const [bounceRecords, setBounceRecords] = useState<BounceRecord[]>([]);
  const [totalSent, setTotalSent] = useState(0);
  const [expandedContact, setExpandedContact] = useState<string | null>(null);
  const [showBouncedOnly, setShowBouncedOnly] = useState(false);
  const [dripFilter, setDripFilter] = useState<string>("all");

  const callAdmin = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/newsletter-admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({ action, adminPassword: storedPassword, ...payload }),
    });
    if (!res.ok) throw new Error("Request failed");
    return res.json();
  }, [storedPassword]);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [contactsRes, opensRes, clicksRes, sendsRes, sentCountRes, bouncesRes] = await Promise.all([
        callAdmin("get_contacts_full"),
        callAdmin("get_opens_log"),
        callAdmin("get_clicks_log"),
        callAdmin("get_send_log"),
        supabase.from("newsletter_contacts").select("id", { count: "exact", head: true }).not("last_emailed_at", "is", null),
        supabase.from("email_bounces").select("*").order("created_at", { ascending: false }),
      ]);

      setContacts(contactsRes.contacts || []);
      setOpens(opensRes.opens || []);
      setClicks(clicksRes.clicks || []);
      setSends(sendsRes.sends || []);
      setTotalSent(sentCountRes.count || 0);
      setBounceRecords((bouncesRes.data || []) as BounceRecord[]);
    } catch (e) {
      console.error("Failed to load email analytics", e);
    } finally {
      setLoading(false);
    }
  }, [callAdmin]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  // === Per-Drip Performance ===
  const contactCampaignMap = useMemo(() => {
    const m = new Map<string, string>();
    contacts.forEach(c => m.set(c.id, contactDripFamily(c.drip_campaign)));
    return m;
  }, [contacts]);

  const dripPerformance = useMemo(() => {
    const families = new Map<string, { sends: number; opens: number; clicks: number; uniqueOpeners: Set<string>; uniqueSent: Set<string> }>();
    const init = () => ({ sends: 0, opens: 0, clicks: 0, uniqueOpeners: new Set<string>(), uniqueSent: new Set<string>() });

    sends.forEach(s => {
      const fam = dripFamily(s.campaign_id);
      if (!families.has(fam)) families.set(fam, init());
      const f = families.get(fam)!;
      f.sends++;
      f.uniqueSent.add(s.contact_id);
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
        uniqueSent: v.uniqueSent.size,
        uniqueOpeners: v.uniqueOpeners.size,
        openRate: v.sends > 0 ? Math.round((v.opens / v.sends) * 100) : 0,
        uniqueOpenRate: v.uniqueSent.size > 0 ? Math.round((v.uniqueOpeners.size / v.uniqueSent.size) * 100) : 0,
        clickRate: v.sends > 0 ? Math.round((v.clicks / v.sends) * 100) : 0,
      }))
      .filter(r => r.sends > 0 || r.opens > 0)
      .sort((a, b) => b.sends - a.sends);
  }, [sends, opens, clicks, contactCampaignMap]);

  const dripFamilies = useMemo(() => ["all", ...dripPerformance.map(r => r.campaign)], [dripPerformance]);

  // === Per-Contact Engagement (now includes EVERYONE; filters can narrow) ===
  const bouncedContactIds = useMemo(() => new Set(bounceRecords.map(b => b.contact_id).filter(Boolean) as string[]), [bounceRecords]);
  const bouncedEmails = useMemo(() => new Set(bounceRecords.map(b => b.email.toLowerCase())), [bounceRecords]);

  const contactEngagements = useMemo<ContactEngagement[]>(() => {
    const opensByContact = new Map<string, OpenRow[]>();
    opens.forEach(o => {
      if (!opensByContact.has(o.contact_id)) opensByContact.set(o.contact_id, []);
      opensByContact.get(o.contact_id)!.push(o);
    });
    const clicksByContact = new Map<string, ClickRow[]>();
    clicks.forEach(c => {
      if (!clicksByContact.has(c.contact_id)) clicksByContact.set(c.contact_id, []);
      clicksByContact.get(c.contact_id)!.push(c);
    });

    return contacts
      .map(c => {
        const cOpens = opensByContact.get(c.id) || [];
        const cClicks = clicksByContact.get(c.id) || [];
        const dates = [
          ...cOpens.map(o => o.opened_at),
          ...cClicks.map(cl => cl.clicked_at),
        ].filter(Boolean).sort().reverse();
        const hasBounced = bouncedContactIds.has(c.id) || bouncedEmails.has(c.email.toLowerCase());
        return {
          ...c,
          opens_count: cOpens.length,
          clicks_count: cClicks.length,
          last_activity: dates[0] || null,
          has_bounced: hasBounced,
          opens: cOpens.map(o => ({ opened_at: o.opened_at, drip_step: o.drip_step })).sort((a, b) => b.opened_at.localeCompare(a.opened_at)),
          clicks: cClicks.map(cl => ({ clicked_at: cl.clicked_at, drip_step: cl.drip_step, link_slug: cl.link_slug })).sort((a, b) => b.clicked_at.localeCompare(a.clicked_at)),
        };
      })
      .sort((a, b) => (b.opens_count + b.clicks_count) - (a.opens_count + a.clicks_count));
  }, [contacts, opens, clicks, bouncedContactIds, bouncedEmails]);

  // === Aggregate stats (filtered by drip if not 'all') ===
  const stats = useMemo(() => {
    let activeOpens = opens.length;
    let activeClicks = clicks.length;
    let activeSends = sends.length;
    if (dripFilter !== "all") {
      activeSends = sends.filter(s => dripFamily(s.campaign_id) === dripFilter).length;
      activeOpens = opens.filter(o => contactCampaignMap.get(o.contact_id) === dripFilter).length;
      activeClicks = clicks.filter(c => contactCampaignMap.get(c.contact_id) === dripFilter).length;
    }
    const openRate = activeSends > 0 ? ((activeOpens / activeSends) * 100).toFixed(1) : "0";
    const clickRate = activeSends > 0 ? ((activeClicks / activeSends) * 100).toFixed(1) : "0";
    return { activeOpens, activeClicks, activeSends, openRate, clickRate };
  }, [opens, clicks, sends, dripFilter, contactCampaignMap]);

  // === 30-day Chart (filtered by drip) ===
  const chartData = useMemo<DayData[]>(() => {
    const now = new Date();
    const days: DayData[] = [];
    const fOpens = dripFilter === "all" ? opens : opens.filter(o => contactCampaignMap.get(o.contact_id) === dripFilter);
    const fClicks = dripFilter === "all" ? clicks : clicks.filter(c => contactCampaignMap.get(c.contact_id) === dripFilter);
    for (let i = 29; i >= 0; i--) {
      const d = subDays(now, i);
      const key = format(d, "yyyy-MM-dd");
      const day: DayData = { date: format(d, "MMM d"), opens: 0, clicks: 0 };
      fOpens.forEach(o => { if (o.opened_at?.startsWith(key)) day.opens++; });
      fClicks.forEach(c => { if (c.clicked_at?.startsWith(key)) day.clicks++; });
      days.push(day);
    }
    return days;
  }, [opens, clicks, dripFilter, contactCampaignMap]);

  // === Filtered contacts table ===
  const filteredContacts = useMemo(() => {
    return contactEngagements.filter(c => {
      if (showBouncedOnly && !c.has_bounced) return false;
      if (dripFilter !== "all" && contactDripFamily(c.drip_campaign) !== dripFilter) return false;
      // Show contacts with ANY signal (open, click, bounce, OR was sent to)
      if (!showBouncedOnly && c.opens_count === 0 && c.clicks_count === 0 && !c.has_bounced) return false;
      return true;
    });
  }, [contactEngagements, showBouncedOnly, dripFilter]);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground font-sans text-sm">Loading analytics...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Drip filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Filter by drip:</span>
        {dripFamilies.map(fam => (
          <button
            key={fam}
            onClick={() => setDripFilter(fam)}
            className={`px-3 py-1 font-sans text-[10px] tracking-[0.15em] uppercase transition-colors ${
              dripFilter === fam ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            {fam === "all" ? "All Drips" : fam}
          </button>
        ))}
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: "Total Sent", value: (dripFilter === "all" ? totalSent : stats.activeSends).toLocaleString(), icon: Mail, color: "text-accent" },
          { label: "Sends Logged", value: stats.activeSends.toLocaleString(), icon: Mail, color: "text-muted-foreground" },
          { label: "Opens", value: stats.activeOpens.toLocaleString(), icon: Eye, color: "text-accent" },
          { label: "Clicks", value: stats.activeClicks.toLocaleString(), icon: MousePointer, color: "text-accent" },
          { label: "Open Rate", value: `${stats.openRate}%`, icon: TrendingUp, color: "text-accent" },
          { label: "Click Rate", value: `${stats.clickRate}%`, icon: TrendingUp, color: "text-accent" },
        ].map(stat => (
          <div key={stat.label} className="border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={14} className={stat.color} />
              <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">{stat.label}</span>
            </div>
            <p className="font-serif text-2xl text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Per-Drip Performance Table */}
      <div className="border border-border p-4 md:p-6">
        <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-accent mb-1">Performance Across All Drips</h3>
        <p className="font-sans text-[10px] text-muted-foreground mb-4">
          Sends, opens, and clicks grouped by drip family. Unique open rate = unique openers ÷ unique contacts sent to.
        </p>
        {dripPerformance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Drip", "Sends", "Unique Sent", "Opens", "Unique Open Rate", "Open Rate", "Clicks", "Click Rate"].map(h => (
                    <th key={h} className="text-left font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground py-2 px-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dripPerformance.map(row => (
                  <tr
                    key={row.campaign}
                    onClick={() => setDripFilter(row.campaign)}
                    className={`border-b border-border/50 hover:bg-muted/20 cursor-pointer transition-colors ${dripFilter === row.campaign ? "bg-muted/30" : ""}`}
                  >
                    <td className="py-2.5 px-3 font-sans text-xs text-foreground">{row.campaign}</td>
                    <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">{row.sends.toLocaleString()}</td>
                    <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">{row.uniqueSent.toLocaleString()}</td>
                    <td className="py-2.5 px-3 font-mono text-xs text-foreground">{row.opens.toLocaleString()} <span className="text-muted-foreground">({row.uniqueOpeners})</span></td>
                    <td className="py-2.5 px-3">
                      <span className={`font-mono text-xs ${row.uniqueOpenRate >= 40 ? "text-emerald-500" : row.uniqueOpenRate >= 20 ? "text-amber-500" : "text-muted-foreground"}`}>
                        {row.uniqueOpenRate}%
                      </span>
                    </td>
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
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">No drip activity yet.</p>
        )}
      </div>

      {/* Chart */}
      <div className="border border-border p-4 md:p-6">
        <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">
          Opens & Clicks — Last 30 Days {dripFilter !== "all" && <span className="text-accent">· {dripFilter}</span>}
        </h3>
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
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="border-b border-border text-left sticky top-0 bg-background">
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
                        <span className={`text-[10px] tracking-wider uppercase font-medium ${b.bounce_type === "complained" ? "text-destructive" : "text-orange-400"}`}>{b.bounce_type}</span>
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

      {/* Per-Contact Engagement Table */}
      <div className="border border-border">
        <div className="p-4 md:p-6 border-b border-border flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground">Per-Contact Engagement</h3>
            <p className="font-sans text-[10px] text-muted-foreground mt-1">
              Showing {filteredContacts.length.toLocaleString()} of {contactEngagements.length.toLocaleString()} contacts with activity
              {dripFilter !== "all" && ` in ${dripFilter}`}
            </p>
          </div>
          <button
            onClick={() => setShowBouncedOnly(!showBouncedOnly)}
            className={`flex items-center gap-1.5 font-sans text-[10px] tracking-[0.15em] uppercase transition-colors ${showBouncedOnly ? "text-destructive" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Filter size={12} />
            {showBouncedOnly ? "Showing Bounced" : "Filter Bounced"}
          </button>
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm font-sans">
            <thead>
              <tr className="border-b border-border text-left sticky top-0 bg-background">
                <th className="px-4 py-3 text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-medium"></th>
                <th className="px-4 py-3 text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-medium">Name</th>
                <th className="px-4 py-3 text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-medium hidden md:table-cell">Email</th>
                <th className="px-4 py-3 text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-medium hidden md:table-cell">Company</th>
                <th className="px-4 py-3 text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-medium hidden md:table-cell">Drip</th>
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
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-[11px]">{contactDripFamily(c.drip_campaign)}</td>
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
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">
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
                                {c.opens.map((o, i) => (
                                  <div key={i} className="text-xs text-muted-foreground">
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
                                {c.clicks.map((cl, i) => (
                                  <div key={i} className="text-xs text-muted-foreground">
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
                    {showBouncedOnly ? "No bounced contacts" : "No engagement data for this filter"}
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
