import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Target, Upload, Eye, Send, RefreshCw, Users, Mail, UserX, Flame, ThermometerSun, MousePointerClick, ChevronDown, ChevronRight, ExternalLink, EyeIcon } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const DRIP_LABELS = [
  { step: 0, subjectA: "The entertainment gap", subjectB: "What your cocktail hour is missing", day: 0 },
  { step: 1, subjectA: "Cocktail hour secret", subjectB: "Why 200 guests didn't leave early", day: 3 },
  { step: 2, subjectA: "Surprise your clients", subjectB: "The thing nobody expected", day: 7 },
  { step: 3, subjectA: "Not your kids' magician", subjectB: "What Netflix and Disney booked", day: 14 },
  { step: 4, subjectA: "Add to your vendor list?", subjectB: "One vendor, three formats", day: 21 },
];

const WARM_LABELS = [
  { step: 0, subjectA: "Quick thought for your next event", subjectB: "Noticed you were curious", day: 0 },
  { step: 1, subjectA: "What happened at Morgan Stanley", subjectB: "200 guests, nobody left early", day: 3 },
  { step: 2, subjectA: "Before I move on", subjectB: "Last note from me", day: 7 },
];

const PULSE_LABELS = [
  { step: 0, subjectA: "3 entertainment trends planners are booking this spring", subjectB: "The problem with spring events (and the fix)", date: "Mar 1", pillar: "Event Intel" },
  { step: 1, subjectA: "How we solved the 'dead air' problem at a Rolls-Royce unveiling", subjectB: "30 VIP guests, zero dead time", date: "Mar 15", pillar: "Behind the Curtain" },
  { step: 2, subjectA: "Cocktail hours are getting a serious upgrade", subjectB: "The cocktail hour problem, solved", date: "Apr 1", pillar: "Event Intel" },
  { step: 3, subjectA: "How a Bel Air dinner party turned into the 'best party ever'", subjectB: "The after-dinner problem most hosts don't solve", date: "Apr 15", pillar: "Behind the Curtain" },
  { step: 4, subjectA: "The summer event problem nobody talks about", subjectB: "What top planners are booking for summer (and why)", date: "May 1", pillar: "Event Intel" },
  { step: 5, subjectA: "How we solved the 'everyone's scattered' problem at a Rivian retreat", subjectB: "The highlight of a Joshua Tree retreat", date: "May 15", pillar: "Behind the Curtain" },
  { step: 6, subjectA: "The wedding vendor gap your couples don't know they have", subjectB: "The easiest vendor add your couples will love", date: "Jun 1", pillar: "Steal This Idea" },
  { step: 7, subjectA: "The fine line between too much and just right", subjectB: "How Taittinger solved their luxury dinner problem", date: "Jun 15", pillar: "Behind the Curtain" },
  { step: 8, subjectA: "The Q4 booking problem starts now", subjectB: "Holiday party season fills up fast", date: "Jul 1", pillar: "Event Intel" },
  { step: 9, subjectA: "How a charity gala raised more money than the year before", subjectB: "The gala moment that changed everything", date: "Jul 15", pillar: "Behind the Curtain" },
];

interface PlannerContact {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  city: string | null;
  drip_step: number;
  drip_campaign: string;
  engagement_status: string;
  subscribed: boolean;
  reply_detected: boolean;
  last_emailed_at: string | null;
  created_at: string;
}

interface ClickRecord {
  id: string;
  link_slug: string;
  drip_step: number;
  clicked_at: string;
}

interface OpenRecord {
  id: string;
  drip_step: number;
  opened_at: string;
}

interface PlannerDripTabProps {
  storedPassword: string;
  onNavigateToContacts?: (filter: string) => void;
}

const PlannerDripTab = ({ storedPassword, onNavigateToContacts }: PlannerDripTabProps) => {
  const [stats, setStats] = useState<{ total: number; active: number; completed: number; unsubscribed: number; stepCounts: number[]; engagement: { warm: number; hot: number; cold: number }; clicks: { total: number; uniqueContacts: number }; opens: { total: number; uniqueContacts: number; rate: number; perStep: number[] }; totalSent: number; abResults?: Record<string, { sentA: number; sentB: number; openedA: number; openedB: number }> }>({
    total: 0, active: 0, completed: 0, unsubscribed: 0, stepCounts: [0, 0, 0, 0, 0],
    engagement: { warm: 0, hot: 0, cold: 0 }, clicks: { total: 0, uniqueContacts: 0 }, opens: { total: 0, uniqueContacts: 0, rate: 0, perStep: [0, 0, 0, 0, 0] }, totalSent: 0, abResults: {},
  });
  const [csvInput, setCsvInput] = useState("");
  const [previewStep, setPreviewStep] = useState(0);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewCampaign, setPreviewCampaign] = useState<string>("planner");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [contacts, setContacts] = useState<PlannerContact[]>([]);
  const [showContacts, setShowContacts] = useState(false);
  const [expandedContact, setExpandedContact] = useState<string | null>(null);
  const [activityCache, setActivityCache] = useState<Record<string, { clicks: ClickRecord[]; opens: OpenRecord[] }>>({});
  const [activityLoading, setActivityLoading] = useState<string | null>(null);
  const [contactFilter, setContactFilter] = useState<string>("all");

  const callPlanner = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/planner-drip`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({ action, adminPassword: storedPassword, ...payload }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Request failed");
    }
    return res.json();
  }, [storedPassword]);

  const loadStats = useCallback(async () => {
    try {
      const data = await callPlanner("stats");
      setStats(data);
    } catch (e) {
      console.error("Failed to load planner stats:", e);
    }
  }, [callPlanner]);

  const loadContacts = useCallback(async () => {
    try {
      const data = await callPlanner("get_contacts");
      setContacts(data.contacts || []);
    } catch (e) {
      console.error("Failed to load planner contacts:", e);
    }
  }, [callPlanner]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleToggleContacts = async () => {
    if (!showContacts && contacts.length === 0) {
      await loadContacts();
    }
    setShowContacts(!showContacts);
  };

  const handleExpandContact = async (contactId: string) => {
    if (expandedContact === contactId) {
      setExpandedContact(null);
      return;
    }
    setExpandedContact(contactId);
    if (!activityCache[contactId]) {
      setActivityLoading(contactId);
      try {
        const data = await callPlanner("get_contact_activity", { contactId });
        setActivityCache(prev => ({ ...prev, [contactId]: { clicks: data.clicks || [], opens: data.opens || [] } }));
      } catch (e) {
        console.error("Failed to load activity:", e);
      } finally {
        setActivityLoading(null);
      }
    }
  };

  const filteredContacts = contacts.filter(c => {
    if (contactFilter === "all") return true;
    if (contactFilter === "warm") return c.engagement_status === "warm";
    if (contactFilter === "hot") return c.engagement_status === "hot" || c.reply_detected;
    if (contactFilter === "unsubscribed") return !c.subscribed;
    if (contactFilter === "active") return c.subscribed;
    return true;
  });

  const engagementBadge = (c: PlannerContact) => {
    if (c.reply_detected) return <span className="px-2 py-0.5 text-[10px] tracking-wider uppercase bg-red-500/20 text-red-300 rounded">Replied</span>;
    if (c.engagement_status === "hot") return <span className="px-2 py-0.5 text-[10px] tracking-wider uppercase bg-red-500/20 text-red-300 rounded">Hot</span>;
    if (c.engagement_status === "warm") return <span className="px-2 py-0.5 text-[10px] tracking-wider uppercase bg-orange-500/20 text-orange-300 rounded">Warm</span>;
    if (!c.subscribed) return <span className="px-2 py-0.5 text-[10px] tracking-wider uppercase bg-muted text-muted-foreground rounded">Unsub</span>;
    return null;
  };

  // ... keep existing code (handleCSVUpload, handleManualEnroll, handlePreview, handleProcessNow)
  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split("\n").filter(l => l.trim());
    const header = lines[0].toLowerCase();
    const cols = header.split(",").map(h => h.trim());
    const emailIdx = cols.findIndex(h => h.includes("email"));
    const nameIdx = cols.findIndex(h => (h.includes("first") && h.includes("name")) || (h === "name") || (h.includes("name") && !h.includes("company") && !h.includes("last")));
    const companyIdx = cols.findIndex(h => h.includes("company") || h.includes("business"));
    const cityIdx = cols.findIndex(h => h.includes("city") || h.includes("location"));

    if (emailIdx === -1) {
      toast.error("CSV must have an 'email' column");
      return;
    }

    const parsed = lines.slice(1).map(line => {
      const c = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
      return {
        email: c[emailIdx],
        name: nameIdx >= 0 ? c[nameIdx] : undefined,
        company: companyIdx >= 0 ? c[companyIdx] : undefined,
        city: cityIdx >= 0 ? c[cityIdx] : undefined,
      };
    }).filter(c => c.email?.includes("@"));

    if (!parsed.length) {
      toast.error("No valid emails found");
      return;
    }

    setLoading(true);
    try {
      const res = await callPlanner("enroll", { contacts: parsed });
      toast.success(`Enrolled ${res.enrolled} planners (${res.skipped} already enrolled)`);
      loadStats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Enrollment failed");
    } finally {
      setLoading(false);
    }
    e.target.value = "";
  };

  const handleManualEnroll = async () => {
    const lines = csvInput.split("\n").filter(l => l.trim());
    const contactsList = lines.map(line => {
      const parts = line.split(",").map(p => p.trim());
      return { email: parts[0], name: parts[1] || undefined, company: parts[2] || undefined, city: parts[3] || undefined };
    }).filter(c => c.email?.includes("@"));

    if (!contactsList.length) {
      toast.error("Enter at least one valid email");
      return;
    }

    setLoading(true);
    try {
      const res = await callPlanner("enroll", { contacts: contactsList });
      toast.success(`Enrolled ${res.enrolled} planners`);
      setCsvInput("");
      loadStats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Enrollment failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (step: number, campaign: string = "planner") => {
    setPreviewStep(step);
    setPreviewCampaign(campaign);
    try {
      const res = await callPlanner("preview", { step, campaign });
      setPreviewHtml(res.body_html);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Preview failed");
    }
  };

  const handleProcessNow = async () => {
    if (!confirm("Send all due planner drip emails now?")) return;
    setProcessing(true);
    try {
      const res = await callPlanner("process");
      toast.success(`Processed: ${res.sent} emails sent out of ${res.processed} contacts checked`);
      loadStats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Processing failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats Row 1 */}
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
            <Mail size={16} className="text-accent" />
            <p className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground">Completed</p>
          </div>
          <p className="font-serif text-3xl text-foreground">{stats.completed}</p>
        </div>
        <button onClick={() => onNavigateToContacts?.("unsubscribed")} className="border border-border p-5 text-left hover:border-accent/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-2 mb-1">
            <UserX size={16} className="text-red-400" />
            <p className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground">Unsubscribed</p>
          </div>
          <p className="font-serif text-3xl text-foreground">{stats.unsubscribed}</p>
        </button>
        <div className="border border-border p-5">
          <button
            onClick={handleProcessNow}
            disabled={processing}
            className="w-full h-full flex flex-col items-center justify-center gap-2 text-accent hover:text-accent/80 transition-colors disabled:opacity-50"
          >
            <Send size={20} className={processing ? "animate-pulse" : ""} />
            <span className="font-sans text-xs tracking-[0.2em] uppercase">
              {processing ? "Sending..." : "Process Now"}
            </span>
          </button>
        </div>
      </div>

      {/* Stats Row 2 — Engagement */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <button onClick={() => onNavigateToContacts?.("hot")} className="border border-border p-5 text-left hover:border-accent/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-2 mb-1">
            <Flame size={16} className="text-red-400" />
            <p className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground">Hot Leads</p>
          </div>
          <p className="font-serif text-3xl text-foreground">{stats.engagement.hot}</p>
        </button>
        <button onClick={() => onNavigateToContacts?.("warm")} className="border border-border p-5 text-left hover:border-accent/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-2 mb-1">
            <ThermometerSun size={16} className="text-orange-400" />
            <p className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground">Warm Leads</p>
          </div>
          <p className="font-serif text-3xl text-foreground">{stats.engagement.warm}</p>
        </button>
        <div className="border border-border p-5">
          <div className="flex items-center gap-2 mb-1">
            <Eye size={16} className="text-accent" />
            <p className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground">Opens</p>
          </div>
          <p className="font-serif text-3xl text-foreground">{stats.opens.total}</p>
          <p className="font-sans text-xs text-muted-foreground mt-1">{stats.opens.uniqueContacts} unique</p>
        </div>
        <div className="border border-border p-5">
          <div className="flex items-center gap-2 mb-1">
            <EyeIcon size={16} className="text-accent" />
            <p className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground">Open Rate</p>
          </div>
          <p className="font-serif text-3xl text-foreground">{stats.opens.rate}%</p>
          <p className="font-sans text-xs text-muted-foreground mt-1">{stats.opens.uniqueContacts}/{stats.totalSent} sent</p>
        </div>
        <div className="border border-border p-5">
          <div className="flex items-center gap-2 mb-1">
            <MousePointerClick size={16} className="text-accent" />
            <p className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground">Link Clicks</p>
          </div>
          <p className="font-serif text-3xl text-foreground">{stats.clicks.total}</p>
          <p className="font-sans text-xs text-muted-foreground mt-1">{stats.clicks.uniqueContacts} unique</p>
        </div>
        <div className="border border-border p-5">
          <div className="flex items-center gap-2 mb-1">
            <Mail size={16} className="text-accent" />
            <p className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground">Emails Sent</p>
          </div>
          <p className="font-serif text-3xl text-foreground">{stats.totalSent}</p>
        </div>
      </div>

      {/* Sequence Pipeline */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-sans text-sm tracking-[0.2em] uppercase text-muted-foreground">Drip Sequence Pipeline</h3>
          <button onClick={loadStats} className="text-muted-foreground hover:text-foreground">
            <RefreshCw size={16} />
          </button>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {DRIP_LABELS.map((d, i) => (
            <button
              key={i}
              onClick={() => handlePreview(i)}
              className={`border p-3 text-left transition-colors hover:border-accent ${previewStep === i && previewHtml ? "border-accent" : "border-border"}`}
            >
              <p className="font-sans text-xs text-muted-foreground mb-1">Day {d.day}</p>
              <p className="font-sans text-sm text-foreground leading-tight">{d.subjectA}</p>
              <p className="font-sans text-[10px] text-muted-foreground/60 leading-tight mt-0.5">B: {d.subjectB}</p>
              <p className="font-sans text-xs text-accent mt-2">{stats.stepCounts[i]} waiting</p>
              <p className="font-sans text-[10px] text-muted-foreground mt-0.5">
                <Eye size={10} className="inline mr-1" />{stats.opens.perStep[i]} opened
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Warm Nurture Sequence */}
      <div>
        <h3 className="font-sans text-sm tracking-[0.2em] uppercase text-muted-foreground mb-4 flex items-center gap-2">
          <ThermometerSun size={16} className="text-orange-400" />
          Warm Nurture Sequence
          <span className="text-xs text-muted-foreground/50 normal-case tracking-normal">(3+ clicks triggers this)</span>
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {WARM_LABELS.map((d, i) => (
            <button
              key={`warm-${i}`}
              onClick={() => handlePreview(i, "planner-warm")}
              className={`border p-3 text-left transition-colors hover:border-accent ${previewCampaign === "planner-warm" && previewStep === i && previewHtml ? "border-accent" : "border-border"}`}
            >
              <p className="font-sans text-xs text-orange-400/70 mb-1">Day {d.day}</p>
              <p className="font-sans text-sm text-foreground leading-tight">{d.subjectA}</p>
              <p className="font-sans text-[10px] text-muted-foreground/60 leading-tight mt-0.5">B: {d.subjectB}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Planner Pulse — Twice-Monthly Newsletter */}
      <div>
        <h3 className="font-sans text-sm tracking-[0.2em] uppercase text-muted-foreground mb-4 flex items-center gap-2">
          <Mail size={16} className="text-accent" />
          Planner Pulse — Twice Monthly
          <span className="text-xs text-muted-foreground/50 normal-case tracking-normal">(after drip/nurture completes · {(stats as any).pulseActive || 0} active)</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {PULSE_LABELS.map((d, i) => (
            <button
              key={`pulse-${i}`}
              onClick={() => handlePreview(i, "planner-pulse")}
              className={`border p-3 text-left transition-colors hover:border-accent ${previewCampaign === "planner-pulse" && previewStep === i && previewHtml ? "border-accent" : "border-border"}`}
            >
              <p className="font-sans text-[10px] text-accent/70 mb-1">{d.date}</p>
              <p className="font-sans text-[10px] tracking-wider uppercase text-muted-foreground/50 mb-1">{d.pillar}</p>
              <p className="font-sans text-xs text-foreground leading-tight">{d.subjectA}</p>
              <p className="font-sans text-[10px] text-muted-foreground/60 leading-tight mt-0.5">B: {d.subjectB}</p>
            </button>
          ))}
        </div>
      </div>


      {stats.abResults && Object.keys(stats.abResults).length > 0 && (
        <div>
          <h3 className="font-sans text-sm tracking-[0.2em] uppercase text-muted-foreground mb-4 flex items-center gap-2">
            <EyeIcon size={16} />
            A/B Subject Line Results
          </h3>
          <div className="border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-card border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-sans text-xs tracking-wider uppercase text-muted-foreground">Step</th>
                  <th className="text-left px-4 py-3 font-sans text-xs tracking-wider uppercase text-muted-foreground">Variant A</th>
                  <th className="text-center px-4 py-3 font-sans text-xs tracking-wider uppercase text-muted-foreground">Open %</th>
                  <th className="text-left px-4 py-3 font-sans text-xs tracking-wider uppercase text-muted-foreground">Variant B</th>
                  <th className="text-center px-4 py-3 font-sans text-xs tracking-wider uppercase text-muted-foreground">Open %</th>
                  <th className="text-center px-4 py-3 font-sans text-xs tracking-wider uppercase text-muted-foreground">Winner</th>
                </tr>
              </thead>
              <tbody>
                {DRIP_LABELS.map((d) => {
                  const key = `planner-step-${d.step}`;
                  const ab = stats.abResults?.[key];
                  if (!ab || (ab.sentA === 0 && ab.sentB === 0)) return null;
                  const rateA = ab.sentA > 0 ? Math.round((ab.openedA / ab.sentA) * 100) : 0;
                  const rateB = ab.sentB > 0 ? Math.round((ab.openedB / ab.sentB) * 100) : 0;
                  const winner = ab.sentA >= 3 && ab.sentB >= 3
                    ? rateA > rateB ? "A" : rateB > rateA ? "B" : "Tie"
                    : "—";
                  return (
                    <tr key={key} className="border-b border-border/50">
                      <td className="px-4 py-3 font-sans text-xs text-muted-foreground">Day {d.day}</td>
                      <td className="px-4 py-3">
                        <p className="font-sans text-sm text-foreground">{d.subjectA}</p>
                        <p className="font-sans text-[10px] text-muted-foreground">{ab.sentA} sent · {ab.openedA} opened</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-sans text-sm font-semibold ${winner === "A" ? "text-accent" : "text-foreground"}`}>{rateA}%</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-sans text-sm text-foreground">{d.subjectB}</p>
                        <p className="font-sans text-[10px] text-muted-foreground">{ab.sentB} sent · {ab.openedB} opened</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-sans text-sm font-semibold ${winner === "B" ? "text-accent" : "text-foreground"}`}>{rateB}%</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-sans text-xs tracking-wider uppercase font-semibold ${winner === "A" || winner === "B" ? "text-accent" : "text-muted-foreground"}`}>
                          {winner}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="px-4 py-2 font-sans text-[10px] text-muted-foreground/50">Winner declared after 3+ sends per variant. Each contact is randomly assigned A or B.</p>
          </div>
        </div>
      )}

      {previewHtml && (
        <div className="border border-border">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-sans text-sm text-foreground">
                <Eye size={14} className="inline mr-2" />
                {previewCampaign === "planner-pulse"
                  ? `Preview: Pulse ${previewStep + 1} — "${PULSE_LABELS[previewStep]?.subjectA}"`
                  : previewCampaign === "planner-warm"
                  ? `Preview: Nurture ${previewStep + 1} — "${WARM_LABELS[previewStep]?.subjectA}"`
                  : `Preview: Email ${previewStep + 1} — "${DRIP_LABELS[previewStep]?.subjectA}"`
                }
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {previewCampaign === "planner-pulse"
                  ? `${PULSE_LABELS[previewStep]?.date} · ${PULSE_LABELS[previewStep]?.pillar} · Sample: Sarah from Stellar Events`
                  : previewCampaign === "planner-warm"
                  ? `Day ${WARM_LABELS[previewStep]?.day} · Warm Nurture Sequence · Sample: Sarah from Stellar Events`
                  : `Day ${DRIP_LABELS[previewStep]?.day} · Sample: Sarah from Stellar Events`
                }
              </p>
            </div>
            <button onClick={() => setPreviewHtml("")} className="text-muted-foreground hover:text-foreground text-xs uppercase tracking-wider">Close</button>
          </div>
          <div className="bg-white rounded overflow-hidden">
            <iframe
              srcDoc={previewHtml}
              title="Planner email preview"
              className="w-full h-[600px] border-0"
              sandbox=""
            />
          </div>
        </div>
      )}

      {/* Contacts List */}
      <div className="border border-border">
        <button
          onClick={handleToggleContacts}
          className="w-full p-4 flex items-center justify-between hover:bg-accent/5 transition-colors"
        >
          <h3 className="font-sans text-sm tracking-[0.2em] uppercase text-muted-foreground flex items-center gap-2">
            <Users size={16} />
            Planner Contacts
            {contacts.length > 0 && <span className="text-accent">({contacts.length})</span>}
          </h3>
          {showContacts ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
        </button>

        {showContacts && (
          <div>
            {/* Filter bar */}
            <div className="px-4 pb-3 flex gap-2 flex-wrap">
              {["all", "active", "warm", "hot", "unsubscribed"].map(f => (
                <button
                  key={f}
                  onClick={() => setContactFilter(f)}
                  className={`px-3 py-1 text-xs tracking-wider uppercase transition-colors ${contactFilter === f ? "bg-accent text-accent-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Contacts table */}
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-2 font-sans text-xs tracking-wider uppercase text-muted-foreground"></th>
                    <th className="text-left px-4 py-2 font-sans text-xs tracking-wider uppercase text-muted-foreground">Name</th>
                    <th className="text-left px-4 py-2 font-sans text-xs tracking-wider uppercase text-muted-foreground hidden md:table-cell">Company</th>
                    <th className="text-left px-4 py-2 font-sans text-xs tracking-wider uppercase text-muted-foreground hidden md:table-cell">City</th>
                    <th className="text-left px-4 py-2 font-sans text-xs tracking-wider uppercase text-muted-foreground">Step</th>
                    <th className="text-left px-4 py-2 font-sans text-xs tracking-wider uppercase text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map(c => (
                    <>
                      <tr
                        key={c.id}
                        onClick={() => handleExpandContact(c.id)}
                        className="border-b border-border/50 hover:bg-accent/5 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-2.5">
                          {expandedContact === c.id ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="text-foreground">{c.name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{c.email}</p>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">{c.company || "—"}</td>
                        <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">{c.city || "—"}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {c.drip_campaign === "planner-done" ? "Done" : `${c.drip_step + 1}/5`}
                        </td>
                        <td className="px-4 py-2.5">{engagementBadge(c)}</td>
                      </tr>
                      {expandedContact === c.id && (
                        <tr key={`${c.id}-detail`}>
                          <td colSpan={6} className="px-8 py-4 bg-accent/5">
                            {activityLoading === c.id ? (
                              <p className="text-xs text-muted-foreground animate-pulse">Loading activity...</p>
                            ) : activityCache[c.id] ? (
                              <div className="grid md:grid-cols-2 gap-6">
                                {/* Clicks */}
                                <div>
                                  <h4 className="font-sans text-xs tracking-wider uppercase text-muted-foreground mb-2 flex items-center gap-1">
                                    <MousePointerClick size={12} /> Link Clicks ({activityCache[c.id].clicks.length})
                                  </h4>
                                  {activityCache[c.id].clicks.length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic">No clicks yet</p>
                                  ) : (
                                    <div className="space-y-1.5">
                                      {activityCache[c.id].clicks.map(click => (
                                        <div key={click.id} className="flex items-start gap-2 text-xs">
                                          <ExternalLink size={10} className="text-accent mt-0.5 shrink-0" />
                                          <div>
                                            <p className="text-foreground">{click.link_slug}</p>
                                            <p className="text-muted-foreground">
                                              Email {click.drip_step + 1} · {new Date(click.clicked_at).toLocaleDateString()} {new Date(click.clicked_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                {/* Opens */}
                                <div>
                                  <h4 className="font-sans text-xs tracking-wider uppercase text-muted-foreground mb-2 flex items-center gap-1">
                                    <EyeIcon size={12} /> Opens ({activityCache[c.id].opens.length})
                                  </h4>
                                  {activityCache[c.id].opens.length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic">No opens tracked yet</p>
                                  ) : (
                                    <div className="space-y-1.5">
                                      {activityCache[c.id].opens.map(open => (
                                        <div key={open.id} className="flex items-start gap-2 text-xs">
                                          <EyeIcon size={10} className="text-accent mt-0.5 shrink-0" />
                                          <p className="text-muted-foreground">
                                            Email {open.drip_step + 1} · {new Date(open.opened_at).toLocaleDateString()} {new Date(open.opened_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : null}
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
              {filteredContacts.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-8">No contacts match this filter</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Enroll Planners */}
      <div className="border border-border p-6">
        <h3 className="font-sans text-sm tracking-[0.2em] uppercase text-muted-foreground mb-4">Enroll Planners</h3>

        <div className="flex gap-4 mb-4">
          <label className="inline-flex items-center gap-2 cursor-pointer bg-accent text-accent-foreground px-5 py-2 font-sans text-sm tracking-[0.2em] uppercase hover:bg-accent/80 transition-colors">
            <Upload size={16} />
            Upload CSV
            <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
          </label>
          <p className="text-xs text-muted-foreground self-center">CSV with email, name, company, city columns</p>
        </div>

        <div className="mb-4">
          <label className="font-sans text-xs tracking-wider uppercase text-muted-foreground mb-2 block">
            Or paste manually (email, name, company, city per line)
          </label>
          <textarea
            value={csvInput}
            onChange={e => setCsvInput(e.target.value)}
            placeholder={"sarah@stellarevents.com, Sarah Chen, Stellar Events, Los Angeles\njohn@luxwed.com, John Park, Lux Weddings, San Diego"}
            rows={4}
            className="w-full bg-forest-dark/50 border border-border text-foreground px-4 py-3 font-sans text-sm focus:outline-none focus:border-accent resize-none font-mono"
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

export default PlannerDripTab;
