import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { AlertTriangle } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface Contact {
  id: string;
  city: string | null;
  company: string | null;
  source: string | null;
  engagement_status: string;
  drip_campaign: string;
  subscribed: boolean;
  optimal_send_hour: number | null;
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

interface Props {
  storedPassword: string;
}

const COLORS = ["hsl(var(--accent))", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#6366f1", "#ec4899", "#14b8a6"];

const AnalyticsTab = ({ storedPassword }: Props) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [sendLog, setSendLog] = useState<SendLog[]>([]);
  const [opens, setOpens] = useState<OpenLog[]>([]);
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
        const [contactsRes, sendsRes, opensRes] = await Promise.all([
          callAdmin("get_contacts_full"),
          callAdmin("get_send_log"),
          callAdmin("get_opens_log"),
        ]);
        setContacts(contactsRes.contacts || []);
        setSendLog(sendsRes.sends || []);
        setOpens(opensRes.opens || []);
      } catch (e) {
        toast.error("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [callAdmin]);

  // City breakdown
  const cityData = useMemo(() => {
    const map = new Map<string, number>();
    contacts.filter(c => c.subscribed && c.city).forEach(c => {
      const city = c.city!.trim();
      if (city) map.set(city, (map.get(city) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  }, [contacts]);

  // Source breakdown
  const sourceData = useMemo(() => {
    const map = new Map<string, number>();
    contacts.filter(c => c.subscribed).forEach(c => {
      const src = c.source || "unknown";
      map.set(src, (map.get(src) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [contacts]);

  // Engagement breakdown
  const engagementData = useMemo(() => {
    const map = new Map<string, number>();
    contacts.filter(c => c.subscribed).forEach(c => {
      map.set(c.engagement_status, (map.get(c.engagement_status) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [contacts]);

  // Sends over time (daily for last 30 days)
  const sendsOverTime = useMemo(() => {
    const now = new Date();
    const days: { date: string; sends: number; opens: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const daysSends = sendLog.filter(s => s.sent_at.slice(0, 10) === key).length;
      const daysOpens = opens.filter(o => o.opened_at.slice(0, 10) === key).length;
      days.push({ date: key.slice(5), sends: daysSends, opens: daysOpens });
    }
    return days;
  }, [sendLog, opens]);

  // Anomaly detection — compare last 7 days to prior 7 days
  const anomaly = useMemo(() => {
    const now = new Date();
    const last7 = sendLog.filter(s => {
      const d = new Date(s.sent_at);
      return (now.getTime() - d.getTime()) < 7 * 86400000;
    });
    const prior7 = sendLog.filter(s => {
      const d = new Date(s.sent_at);
      const diff = now.getTime() - d.getTime();
      return diff >= 7 * 86400000 && diff < 14 * 86400000;
    });

    const last7Opens = opens.filter(o => (now.getTime() - new Date(o.opened_at).getTime()) < 7 * 86400000).length;
    const prior7Opens = opens.filter(o => {
      const diff = now.getTime() - new Date(o.opened_at).getTime();
      return diff >= 7 * 86400000 && diff < 14 * 86400000;
    }).length;

    const lastRate = last7.length > 0 ? (last7Opens / last7.length) * 100 : 0;
    const priorRate = prior7.length > 0 ? (prior7Opens / prior7.length) * 100 : 0;
    const dropPercent = priorRate > 0 ? ((priorRate - lastRate) / priorRate) * 100 : 0;

    return {
      lastRate: lastRate.toFixed(1),
      priorRate: priorRate.toFixed(1),
      dropPercent: dropPercent.toFixed(1),
      isAnomaly: dropPercent > 20 && prior7.length >= 5,
      lastSends: last7.length,
      priorSends: prior7.length,
    };
  }, [sendLog, opens]);

  // Optimal send hours distribution
  const sendHourData = useMemo(() => {
    const hourMap = new Map<number, number>();
    opens.forEach(o => {
      const hour = new Date(o.opened_at).getUTCHours();
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
    });
    return Array.from({ length: 24 }, (_, h) => ({
      hour: `${h.toString().padStart(2, "0")}:00`,
      opens: hourMap.get(h) || 0,
    }));
  }, [opens]);

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
              Open rate dropped {anomaly.dropPercent}% — from {anomaly.priorRate}% (prior week, {anomaly.priorSends} sends) to {anomaly.lastRate}% (this week, {anomaly.lastSends} sends). Review subject lines or sending frequency.
            </p>
          </div>
        </div>
      )}

      {/* Sends & Opens Trend */}
      <div className="border border-border p-6">
        <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-accent mb-4">Send & Open Trend (30 Days)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={sendsOverTime}>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
            <Line type="monotone" dataKey="sends" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} name="Sends" />
            <Line type="monotone" dataKey="opens" stroke="#10b981" strokeWidth={2} dot={false} name="Opens" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Open Hours Distribution */}
      <div className="border border-border p-6">
        <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-accent mb-1">Peak Open Hours (UTC)</h3>
        <p className="font-sans text-[10px] text-muted-foreground mb-4">When contacts open emails — use for send time optimization</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={sendHourData}>
            <XAxis dataKey="hour" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" interval={2} />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
            <Bar dataKey="opens" fill="hsl(var(--accent))" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* City Breakdown */}
        <div className="border border-border p-6">
          <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-accent mb-4">Top Cities</h3>
          {cityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={cityData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={100} />
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                <Bar dataKey="value" fill="hsl(var(--accent))" radius={[0, 2, 2, 0]} name="Contacts" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-xs">No city data yet</p>
          )}
        </div>

        {/* Source Breakdown */}
        <div className="border border-border p-6">
          <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-accent mb-4">Lead Sources</h3>
          {sourceData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <ResponsiveContainer width="100%" height={200} minWidth={140}>
                <PieChart>
                  <Pie
                    data={sourceData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {sourceData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="hsl(var(--background))" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", fontSize: 12 }}
                    formatter={(value: number, name: string) => {
                      const total = sourceData.reduce((s, d) => s + d.value, 0);
                      const pct = total > 0 ? ((value / total) * 100).toFixed(0) : "0";
                      return [`${value} (${pct}%)`, name];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 w-full space-y-1.5 min-w-0">
                {(() => {
                  const total = sourceData.reduce((s, d) => s + d.value, 0);
                  return sourceData.map((entry, i) => {
                    const pct = total > 0 ? ((entry.value / total) * 100).toFixed(0) : "0";
                    return (
                      <div key={entry.name} className="flex items-center gap-2 text-xs font-sans">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
                          style={{ background: COLORS[i % COLORS.length] }}
                        />
                        <span className="text-foreground truncate flex-1 capitalize">{entry.name}</span>
                        <span className="text-muted-foreground tabular-nums">{pct}%</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">No source data yet</p>
          )}
        </div>

        {/* Engagement Status */}
        <div className="border border-border p-6">
          <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-accent mb-4">Engagement Breakdown</h3>
          <div className="space-y-2">
            {engagementData.map(({ name, value }) => {
              const total = contacts.filter(c => c.subscribed).length;
              const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
              return (
                <div key={name} className="flex items-center gap-3">
                  <span className="font-sans text-xs text-muted-foreground w-16 capitalize">{name}</span>
                  <div className="flex-1 bg-border/30 h-4 rounded-sm overflow-hidden">
                    <div className="h-full bg-accent/70 rounded-sm transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="font-sans text-xs text-foreground w-16 text-right">{value} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Week over Week comparison */}
        <div className="border border-border p-6">
          <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-accent mb-4">Week-over-Week</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-sans text-[10px] text-muted-foreground uppercase tracking-wider">This Week Sends</p>
              <p className="font-serif text-2xl text-foreground">{anomaly.lastSends}</p>
            </div>
            <div>
              <p className="font-sans text-[10px] text-muted-foreground uppercase tracking-wider">Prior Week Sends</p>
              <p className="font-serif text-2xl text-foreground">{anomaly.priorSends}</p>
            </div>
            <div>
              <p className="font-sans text-[10px] text-muted-foreground uppercase tracking-wider">This Week Open Rate</p>
              <p className="font-serif text-2xl text-foreground">{anomaly.lastRate}%</p>
            </div>
            <div>
              <p className="font-sans text-[10px] text-muted-foreground uppercase tracking-wider">Prior Week Open Rate</p>
              <p className="font-serif text-2xl text-foreground">{anomaly.priorRate}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
