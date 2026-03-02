import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Target, Upload, Eye, Send, RefreshCw, Users, Mail, UserX, Flame, ThermometerSun, MousePointerClick, ChevronDown, ChevronRight, ExternalLink, EyeIcon, Building2 } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const DRIP_LABELS = [
  { step: 0, subjectA: "Your resident events deserve better", subjectB: "The attendance problem nobody talks about", day: 0 },
  { step: 1, subjectA: "The easiest vendor decision you'll make this quarter", subjectB: "One vendor, zero headaches", day: 3 },
  { step: 2, subjectA: "How one magic show changed resident engagement", subjectB: "Record attendance at a resident event", day: 7 },
  { step: 3, subjectA: "Resident event ideas that actually get RSVPs", subjectB: "What your residents haven't seen yet", day: 14 },
  { step: 4, subjectA: "Quick question about your event calendar", subjectB: "Before your Q3 events are locked in", day: 21 },
];

const BREAKUP_LABEL = { subjectA: "Closing the loop", subjectB: "Timing is everything", day: 28 };

const PULSE_LABELS = [
  { step: 0, subjectA: "Spring resident events that actually fill the room", subjectB: "Your Q2 events don't have to be boring", date: "Mar 1", pillar: "Spring" },
  { step: 1, subjectA: "The welcome event that makes new residents feel at home", subjectB: "First impressions matter (for buildings too)", date: "Mar 15", pillar: "Move-Ins" },
  { step: 2, subjectA: "Pool party season is here (with a twist)", subjectB: "The poolside entertainment nobody expects", date: "Apr 1", pillar: "Summer" },
  { step: 3, subjectA: "The retention tool hiding in your event budget", subjectB: "Why great resident events = higher renewals", date: "Apr 15", pillar: "Retention" },
  { step: 4, subjectA: "Your summer events are being planned right now", subjectB: "The summer event that books itself", date: "May 1", pillar: "Summer" },
  { step: 5, subjectA: "The resident event that sells units", subjectB: "What prospects ask about during tours", date: "May 15", pillar: "Leasing" },
  { step: 6, subjectA: "It's not too early to book your holiday party", subjectB: "The holiday party that residents actually attend", date: "Jun 1", pillar: "Holiday" },
  { step: 7, subjectA: "We can help make the flyer too", subjectB: "The resident event flyer that actually works", date: "Jun 15", pillar: "Promo" },
  { step: 8, subjectA: "What managers are saying after their first show", subjectB: "The feedback we keep hearing", date: "Jul 1", pillar: "Social Proof" },
  { step: 9, subjectA: "Fall resident events that build community", subjectB: "Q4 is coming. What's on your calendar?", date: "Jul 15", pillar: "Fall" },
  { step: 10, subjectA: "Managing multiple properties? One vendor for all", subjectB: "Scale your events without scaling the work", date: "Aug 1", pillar: "Portfolio" },
  { step: 11, subjectA: "One last idea for your events calendar", subjectB: "The vendor you'll wish you booked sooner", date: "Aug 15", pillar: "Evergreen" },
];

interface ResidentContact {
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

interface ResidentDripTabProps {
  storedPassword: string;
  onNavigateToContacts?: (filter: string) => void;
}

const ResidentDripTab = ({ storedPassword, onNavigateToContacts }: ResidentDripTabProps) => {
  const [stats, setStats] = useState<{
    total: number; active: number; completed: number; unsubscribed: number;
    stepCounts: number[];
    engagement: { warm: number; hot: number; cold: number };
    clicks: { total: number; uniqueContacts: number };
    opens: { total: number; uniqueContacts: number; rate: number; perStep: number[] };
    totalSent: number;
    pulseActive?: number;
  }>({
    total: 0, active: 0, completed: 0, unsubscribed: 0, stepCounts: [0, 0, 0, 0, 0],
    engagement: { warm: 0, hot: 0, cold: 0 },
    clicks: { total: 0, uniqueContacts: 0 },
    opens: { total: 0, uniqueContacts: 0, rate: 0, perStep: [0, 0, 0, 0, 0] },
    totalSent: 0, pulseActive: 0,
  });
  const [csvInput, setCsvInput] = useState("");
  const [previewStep, setPreviewStep] = useState(0);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewCampaign, setPreviewCampaign] = useState<string>("resident");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [contacts, setContacts] = useState<ResidentContact[]>([]);
  const [showContacts, setShowContacts] = useState(false);
  const [expandedContact, setExpandedContact] = useState<string | null>(null);
  const [activityCache, setActivityCache] = useState<Record<string, { clicks: ClickRecord[]; opens: OpenRecord[] }>>({});
  const [activityLoading, setActivityLoading] = useState<string | null>(null);
  const [contactFilter, setContactFilter] = useState<string>("all");

  const callResident = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/resident-drip`, {
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
      const data = await callResident("stats");
      setStats(data);
    } catch (e) {
      console.error("Failed to load resident stats:", e);
    }
  }, [callResident]);

  const loadContacts = useCallback(async () => {
    try {
      const data = await callResident("get_contacts");
      setContacts(data.contacts || []);
    } catch (e) {
      console.error("Failed to load resident contacts:", e);
    }
  }, [callResident]);

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
        const data = await callResident("get_contact_activity", { contactId });
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

  const engagementBadge = (c: ResidentContact) => {
    if (c.reply_detected) return <span className="px-2 py-0.5 text-[10px] tracking-wider uppercase bg-red-500/20 text-red-300 rounded">Replied</span>;
    if (c.engagement_status === "hot") return <span className="px-2 py-0.5 text-[10px] tracking-wider uppercase bg-red-500/20 text-red-300 rounded">Hot</span>;
    if (c.engagement_status === "warm") return <span className="px-2 py-0.5 text-[10px] tracking-wider uppercase bg-orange-500/20 text-orange-300 rounded">Warm</span>;
    if (!c.subscribed) return <span className="px-2 py-0.5 text-[10px] tracking-wider uppercase bg-muted text-muted-foreground rounded">Unsub</span>;
    return null;
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split("\n").filter(l => l.trim());
    const header = lines[0].toLowerCase();
    const cols = header.split(",").map(h => h.trim());
    const emailIdx = cols.findIndex(h => h.includes("email"));
    const nameIdx = cols.findIndex(h => (h.includes("first") && h.includes("name")) || (h === "name") || (h.includes("name") && !h.includes("company") && !h.includes("last") && !h.includes("apartment") && !h.includes("building")));
    const apartmentIdx = cols.findIndex(h => h.includes("apartment name") || h === "building name");
    const companyIdx = cols.findIndex(h => h.includes("company") || h.includes("apartment name") || h === "building name");
    const cityIdx = cols.findIndex(h => h.includes("city") || h.includes("location"));
    const phoneIdx = cols.findIndex(h => h.includes("phone") || h.includes("mobile") || h.includes("cell"));

    if (emailIdx === -1) {
      toast.error("CSV must have an 'email' column");
      return;
    }

    const isApartmentCSV = apartmentIdx >= 0;

    const parsed = lines.slice(1).map(line => {
      const c = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
      const email = c[emailIdx];
      if (!email?.includes("@")) return null;

      const apartmentName = isApartmentCSV ? c[apartmentIdx]?.trim() : undefined;
      let contactName: string | undefined;
      if (isApartmentCSV && apartmentName) {
        contactName = `${apartmentName} Team`;
      } else if (nameIdx >= 0) {
        contactName = c[nameIdx]?.trim() || undefined;
      }

      const company = isApartmentCSV && apartmentName ? apartmentName : (companyIdx >= 0 ? c[companyIdx]?.trim() || undefined : undefined);
      const city = cityIdx >= 0 ? c[cityIdx]?.trim() || undefined : undefined;
      const phone = phoneIdx >= 0 ? c[phoneIdx]?.trim() || undefined : undefined;

      return { email: email.toLowerCase(), name: contactName, company, city, phone };
    }).filter(Boolean);

    if (!parsed.length) {
      toast.error("No valid emails found");
      return;
    }

    setLoading(true);
    try {
      const res = await callResident("enroll", { contacts: parsed });
      toast.success(`Enrolled ${res.enrolled} properties (${res.skipped} already enrolled)`);
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
      const res = await callResident("enroll", { contacts: contactsList });
      toast.success(`Enrolled ${res.enrolled} properties`);
      setCsvInput("");
      loadStats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Enrollment failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (step: number, campaign: string = "resident") => {
    setPreviewStep(step);
    setPreviewCampaign(campaign);
    try {
      const res = await callResident("preview", { step, campaign });
      setPreviewHtml(res.body_html);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Preview failed");
    }
  };

  const handleProcessNow = async () => {
    if (!confirm("Send all due resident drip emails now?")) return;
    setProcessing(true);
    try {
      const res = await callResident("process");
      toast.success(`Processed: ${res.sent} emails sent out of ${res.processed} contacts checked`);
      loadStats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Processing failed");
    } finally {
      setProcessing(false);
    }
  };

  const campaignStepLabel = (c: ResidentContact) => {
    if (c.drip_campaign === "resident-done") return "Done";
    if (c.drip_campaign === "resident-pulse") return `Pulse ${c.drip_step + 1}/12`;
    return `${c.drip_step + 1}/5`;
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
        <button onClick={() => onNavigateToContacts?.("opened")} className="border border-border p-5 text-left hover:border-accent/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-2 mb-1">
            <Eye size={16} className="text-accent" />
            <p className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground">Opens</p>
          </div>
          <p className="font-serif text-3xl text-foreground">{stats.opens.total}</p>
          <p className="font-sans text-xs text-muted-foreground mt-1">{stats.opens.uniqueContacts} unique</p>
        </button>
        <button onClick={() => onNavigateToContacts?.("opened")} className="border border-border p-5 text-left hover:border-accent/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-2 mb-1">
            <EyeIcon size={16} className="text-accent" />
            <p className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground">Open Rate</p>
          </div>
          <p className="font-serif text-3xl text-foreground">{stats.opens.rate}%</p>
          <p className="font-sans text-xs text-muted-foreground mt-1">{stats.opens.uniqueContacts}/{stats.totalSent} sent</p>
        </button>
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

      {/* Drip Sequence Pipeline */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-sans text-sm tracking-[0.2em] uppercase text-muted-foreground flex items-center gap-2">
            <Building2 size={16} className="text-accent" />
            Resident Drip Pipeline
          </h3>
          <button onClick={loadStats} className="text-muted-foreground hover:text-foreground">
            <RefreshCw size={16} />
          </button>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {DRIP_LABELS.map((d, i) => (
            <button
              key={i}
              onClick={() => handlePreview(i)}
              className={`border p-3 text-left transition-colors hover:border-accent ${previewCampaign === "resident" && previewStep === i && previewHtml ? "border-accent" : "border-border"}`}
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

      {/* Breakup Email */}
      <div>
        <h3 className="font-sans text-sm tracking-[0.2em] uppercase text-muted-foreground mb-4 flex items-center gap-2">
          <UserX size={16} className="text-red-400" />
          Breakup Email
          <span className="text-xs text-muted-foreground/50 normal-case tracking-normal">(Day 28 for non-engagers)</span>
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handlePreview(0, "breakup")}
            className={`border p-3 text-left transition-colors hover:border-accent ${previewCampaign === "breakup" && previewHtml ? "border-accent" : "border-border"}`}
          >
            <p className="font-sans text-xs text-red-400/70 mb-1">Day {BREAKUP_LABEL.day}</p>
            <p className="font-sans text-sm text-foreground leading-tight">{BREAKUP_LABEL.subjectA}</p>
            <p className="font-sans text-[10px] text-muted-foreground/60 leading-tight mt-0.5">B: {BREAKUP_LABEL.subjectB}</p>
          </button>
        </div>
      </div>

      {/* Resident Pulse — Twice-Monthly Newsletter */}
      <div>
        <h3 className="font-sans text-sm tracking-[0.2em] uppercase text-muted-foreground mb-4 flex items-center gap-2">
          <Mail size={16} className="text-accent" />
          Resident Pulse — Twice Monthly
          <span className="text-xs text-muted-foreground/50 normal-case tracking-normal">(after drip completes · {stats.pulseActive || 0} active)</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {PULSE_LABELS.map((d, i) => (
            <button
              key={`pulse-${i}`}
              onClick={() => handlePreview(i, "resident-pulse")}
              className={`border p-3 text-left transition-colors hover:border-accent ${previewCampaign === "resident-pulse" && previewStep === i && previewHtml ? "border-accent" : "border-border"}`}
            >
              <p className="font-sans text-[10px] text-accent/70 mb-1">{d.date}</p>
              <p className="font-sans text-[10px] tracking-wider uppercase text-muted-foreground/50 mb-1">{d.pillar}</p>
              <p className="font-sans text-xs text-foreground leading-tight">{d.subjectA}</p>
              <p className="font-sans text-[10px] text-muted-foreground/60 leading-tight mt-0.5">B: {d.subjectB}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Email Preview */}
      {previewHtml && (
        <div className="border border-border">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-sans text-sm text-foreground">
                <Eye size={14} className="inline mr-2" />
                {previewCampaign === "resident-pulse"
                  ? `Preview: Pulse ${previewStep + 1} — "${PULSE_LABELS[previewStep]?.subjectA}"`
                  : previewCampaign === "breakup"
                  ? `Preview: Breakup — "${BREAKUP_LABEL.subjectA}"`
                  : `Preview: Email ${previewStep + 1} — "${DRIP_LABELS[previewStep]?.subjectA}"`
                }
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {previewCampaign === "resident-pulse"
                  ? `${PULSE_LABELS[previewStep]?.date} · ${PULSE_LABELS[previewStep]?.pillar} · Sample: Jordan from Greystar Luxury Living`
                  : previewCampaign === "breakup"
                  ? `Day 28 · Non-engager breakup · Sample: Jordan from Greystar Luxury Living`
                  : `Day ${DRIP_LABELS[previewStep]?.day} · Sample: Jordan from Greystar Luxury Living`
                }
              </p>
            </div>
            <button onClick={() => setPreviewHtml("")} className="text-muted-foreground hover:text-foreground text-xs uppercase tracking-wider">Close</button>
          </div>
          <div className="bg-white rounded overflow-hidden">
            <iframe
              srcDoc={previewHtml}
              title="Resident email preview"
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
            <Building2 size={16} />
            Property Manager Contacts
            {contacts.length > 0 && <span className="text-accent">({contacts.length})</span>}
          </h3>
          {showContacts ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
        </button>

        {showContacts && (
          <div>
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

            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-2 font-sans text-xs tracking-wider uppercase text-muted-foreground"></th>
                    <th className="text-left px-4 py-2 font-sans text-xs tracking-wider uppercase text-muted-foreground">Name</th>
                    <th className="text-left px-4 py-2 font-sans text-xs tracking-wider uppercase text-muted-foreground hidden md:table-cell">Building</th>
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
                        <td className="px-4 py-2.5 text-muted-foreground">{campaignStepLabel(c)}</td>
                        <td className="px-4 py-2.5">{engagementBadge(c)}</td>
                      </tr>
                      {expandedContact === c.id && (
                        <tr key={`${c.id}-detail`}>
                          <td colSpan={6} className="px-8 py-4 bg-accent/5">
                            {activityLoading === c.id ? (
                              <p className="text-xs text-muted-foreground animate-pulse">Loading activity...</p>
                            ) : activityCache[c.id] ? (
                              <div className="grid md:grid-cols-2 gap-6">
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

      {/* Enroll Properties */}
      <div className="border border-border p-6">
        <h3 className="font-sans text-sm tracking-[0.2em] uppercase text-muted-foreground mb-4">Enroll Property Managers</h3>

        <div className="flex gap-4 mb-4">
          <label className="inline-flex items-center gap-2 cursor-pointer bg-accent text-accent-foreground px-5 py-2 font-sans text-sm tracking-[0.2em] uppercase hover:bg-accent/80 transition-colors">
            <Upload size={16} />
            Upload CSV
            <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
          </label>
          <p className="text-xs text-muted-foreground self-center">CSV with email, name/apartment name, company, city columns</p>
        </div>

        <div className="mb-4">
          <label className="font-sans text-xs tracking-wider uppercase text-muted-foreground mb-2 block">
            Or paste manually (email, name, building, city per line)
          </label>
          <textarea
            value={csvInput}
            onChange={e => setCsvInput(e.target.value)}
            placeholder={"jordan@greystar.com, Jordan Smith, Greystar Luxury Living, Los Angeles\nmanager@avalonbay.com, The Avalon Team, AvalonBay, San Diego"}
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

export default ResidentDripTab;
