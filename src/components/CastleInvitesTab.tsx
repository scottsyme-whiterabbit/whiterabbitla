import { useEffect, useState } from "react";
import { Mail, Eye, CheckCircle2, XCircle, Clock, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TierRow {
  tier: string;
  invited: number;
  pending: number;
  accepted: number;
  declined: number;
}

interface DailyRow {
  log_date: string;
  tier: string;
  sent: number;
  replies_received: number;
  accepted: number;
  declined: number;
}

const TIER_ORDER = ["newsletter", "paused", "active", "completed"] as const;
const TIER_LABEL: Record<string, string> = {
  newsletter: "Newsletter",
  paused: "Paused Drips",
  active: "Active Drips",
  completed: "Completed Drips",
};

const CastleInvitesTab = () => {
  const [loading, setLoading] = useState(true);
  const [tierRows, setTierRows] = useState<TierRow[]>([]);
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [openStats, setOpenStats] = useState({ opens: 0, unique: 0 });
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      // Cumulative tier stats
      const { data: campaigns } = await supabase
        .from("cold_email_campaigns")
        .select("id, castle_tier, castle_invite_status")
        .eq("campaign_track", "castle_invite_la");

      const tierMap: Record<string, TierRow> = {};
      const invitedIds: string[] = [];
      for (const t of TIER_ORDER) {
        tierMap[t] = { tier: t, invited: 0, pending: 0, accepted: 0, declined: 0 };
      }
      for (const r of campaigns ?? []) {
        const tier = (r.castle_tier as string) ?? "unknown";
        tierMap[tier] ??= { tier, invited: 0, pending: 0, accepted: 0, declined: 0 };
        if (r.castle_invite_status === null) tierMap[tier].pending++;
        else {
          tierMap[tier].invited++;
          invitedIds.push(r.id as string);
        }
        if (r.castle_invite_status === "accepted") tierMap[tier].accepted++;
        if (r.castle_invite_status === "declined") tierMap[tier].declined++;
      }
      setTierRows(TIER_ORDER.map((t) => tierMap[t]).filter(Boolean));

      // Daily log (last 14 days)
      const { data: logs } = await supabase
        .from("castle_invite_log")
        .select("log_date, tier, sent, replies_received, accepted, declined")
        .order("log_date", { ascending: false })
        .limit(60);
      setDaily((logs ?? []) as DailyRow[]);

      // Open stats — pixel sends step=castle which parses to NaN→0, source=cold
      if (invitedIds.length > 0) {
        // chunk to avoid URL limits
        let opens = 0;
        const unique = new Set<string>();
        const chunkSize = 200;
        for (let i = 0; i < invitedIds.length; i += chunkSize) {
          const chunk = invitedIds.slice(i, i + chunkSize);
          const { data } = await supabase
            .from("newsletter_opens")
            .select("contact_id")
            .eq("contact_source", "cold")
            .in("contact_id", chunk);
          for (const o of data ?? []) {
            opens++;
            unique.add(o.contact_id as string);
          }
        }
        setOpenStats({ opens, unique: unique.size });
      } else {
        setOpenStats({ opens: 0, unique: 0 });
      }
    } finally {
      setLoading(false);
    }
  }

  const totals = tierRows.reduce(
    (a, r) => ({
      invited: a.invited + r.invited,
      pending: a.pending + r.pending,
      accepted: a.accepted + r.accepted,
      declined: a.declined + r.declined,
    }),
    { invited: 0, pending: 0, accepted: 0, declined: 0 },
  );

  const openRate = totals.invited > 0 ? ((openStats.unique / totals.invited) * 100).toFixed(1) : "0";
  const todayPT = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
  const today = daily.filter((d) => d.log_date === todayPT);
  const todaySent = today.reduce((a, r) => a + (r.sent ?? 0), 0);

  if (loading) {
    return <div className="text-muted-foreground font-sans text-sm py-12 text-center">Loading castle invite stats…</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header / summary cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif text-2xl text-foreground">🏰 Magic Castle Invites</h2>
            <p className="text-muted-foreground font-sans text-xs mt-1">
              Single-send hosted-night invitations. 30/day weekday cap. Sends from Scott&apos;s address.
            </p>
          </div>
          <button
            onClick={() => setShowPreview((v) => !v)}
            className="px-3 py-2 text-xs font-sans tracking-wider uppercase border border-border hover:bg-muted/20 transition-colors"
          >
            {showPreview ? "Hide Email Preview" : "Preview Email"}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat icon={<Send size={16} />} label="Sent Today" value={todaySent} />
          <Stat icon={<Mail size={16} />} label="Total Invited" value={totals.invited} />
          <Stat icon={<Clock size={16} />} label="Pending" value={totals.pending} />
          <Stat icon={<Eye size={16} />} label="Opens" value={`${openStats.unique} (${openRate}%)`} sub={`${openStats.opens} total`} />
          <Stat icon={<CheckCircle2 size={16} />} label="Accepted / Declined" value={`${totals.accepted} / ${totals.declined}`} />
        </div>
      </div>

      {/* Per-tier table */}
      <div>
        <h3 className="font-serif text-lg text-foreground mb-3">By Tier</h3>
        <div className="overflow-x-auto border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/20">
              <tr className="text-left font-sans tracking-wider uppercase text-xs text-muted-foreground">
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3 text-right">Invited</th>
                <th className="px-4 py-3 text-right">Pending</th>
                <th className="px-4 py-3 text-right">Accepted</th>
                <th className="px-4 py-3 text-right">Declined</th>
              </tr>
            </thead>
            <tbody>
              {tierRows.map((r) => (
                <tr key={r.tier} className="border-t border-border">
                  <td className="px-4 py-3 text-foreground">{TIER_LABEL[r.tier] ?? r.tier}</td>
                  <td className="px-4 py-3 text-right text-foreground">{r.invited}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{r.pending}</td>
                  <td className="px-4 py-3 text-right text-emerald-500">{r.accepted}</td>
                  <td className="px-4 py-3 text-right text-rose-400">{r.declined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily log */}
      <div>
        <h3 className="font-serif text-lg text-foreground mb-3">Daily Sends</h3>
        <div className="overflow-x-auto border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/20">
              <tr className="text-left font-sans tracking-wider uppercase text-xs text-muted-foreground">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3 text-right">Sent</th>
                <th className="px-4 py-3 text-right">Replies</th>
                <th className="px-4 py-3 text-right">Accepted</th>
                <th className="px-4 py-3 text-right">Declined</th>
              </tr>
            </thead>
            <tbody>
              {daily.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No sends logged yet.</td></tr>
              ) : daily.filter((r) => r.tier !== "load_marker").map((r, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-4 py-3 text-foreground">{r.log_date}</td>
                  <td className="px-4 py-3 text-muted-foreground">{TIER_LABEL[r.tier] ?? r.tier}</td>
                  <td className="px-4 py-3 text-right text-foreground">{r.sent}</td>
                  <td className="px-4 py-3 text-right">{r.replies_received}</td>
                  <td className="px-4 py-3 text-right text-emerald-500">{r.accepted}</td>
                  <td className="px-4 py-3 text-right text-rose-400">{r.declined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email preview */}
      {showPreview && (
        <div>
          <h3 className="font-serif text-lg text-foreground mb-3">Email Preview (Newsletter Tier)</h3>
          <div className="border border-border bg-white text-black p-6 max-w-2xl text-sm leading-relaxed space-y-3">
            <p className="font-semibold">Subject: [First], the Castle on me this summer?</p>
            <hr />
            <p>[First],</p>
            <p>Wanted to extend you a real invitation. A few nights a month I host guests, usually planners, agents, PR folks, fundraisers, people who work in the same world you do, at the Magic Castle in Hollywood. Yes, this is partly business; if we hit it off and an event comes up, I&apos;d hope to be on your shortlist. But the night itself has zero strings. The point is a real evening together, some magic, and meeting other people doing interesting work in the city.</p>
            <p>You and up to one guest come on my pass, no $45 door fee, no required dinner reservations, no pressure to spend a dollar inside. The Castle is members-only, so this is the cleanest way to get in.</p>
            <p>Here&apos;s the night:</p>
            <p>You arrive. I meet you at the door, tour you through The Magic Castle, the bars, the Parlour of Prestidigitation, the Palace. Then I&apos;ll perform a highlight version of my show for you in the Museum Theater (small, intimate, close-up at conversation distance). We&apos;ll catch other shows around the Castle for a few hours and connect along the way.</p>
            <p>If a Castle night sounds like a fit, send me two or three weekday evenings that work for you this summer and I&apos;ll lock one of them in.</p>
            <p className="pt-2">Scott Syme<br/>Magician<br/>(424) 394-1850<br/>whiterabbitla.com</p>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Subject lines and intro paragraphs vary per tier (paused / active / completed).</p>
        </div>
      )}
    </div>
  );
};

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number | string; sub?: string }) {
  return (
    <div className="border border-border p-4">
      <div className="flex items-center gap-2 text-muted-foreground font-sans text-[10px] tracking-wider uppercase mb-2">
        {icon}{label}
      </div>
      <div className="font-serif text-2xl text-foreground">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground font-sans mt-1">{sub}</div>}
    </div>
  );
}

export default CastleInvitesTab;
