import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Target, Upload, Eye, Send, RefreshCw, Users, Mail, UserX, Flame, ThermometerSun, MousePointerClick } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const DRIP_LABELS = [
  { step: 0, subject: "The entertainment gap", day: 0 },
  { step: 1, subject: "Cocktail hour secret", day: 3 },
  { step: 2, subject: "Surprise your clients", day: 7 },
  { step: 3, subject: "Not your kids' magician", day: 14 },
  { step: 4, subject: "Add to your vendor list?", day: 21 },
];

interface PlannerDripTabProps {
  storedPassword: string;
  onNavigateToContacts?: (filter: string) => void;
}

const PlannerDripTab = ({ storedPassword, onNavigateToContacts }: PlannerDripTabProps) => {
  const [stats, setStats] = useState<{ total: number; active: number; completed: number; unsubscribed: number; stepCounts: number[]; engagement: { warm: number; hot: number; cold: number }; clicks: { total: number; uniqueContacts: number }; totalSent: number }>({
    total: 0, active: 0, completed: 0, unsubscribed: 0, stepCounts: [0, 0, 0, 0, 0],
    engagement: { warm: 0, hot: 0, cold: 0 }, clicks: { total: 0, uniqueContacts: 0 }, totalSent: 0,
  });
  const [csvInput, setCsvInput] = useState("");
  const [previewStep, setPreviewStep] = useState(0);
  const [previewHtml, setPreviewHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

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

  useEffect(() => {
    loadStats();
  }, [loadStats]);

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
    const contacts = lines.map(line => {
      const parts = line.split(",").map(p => p.trim());
      return { email: parts[0], name: parts[1] || undefined, company: parts[2] || undefined, city: parts[3] || undefined };
    }).filter(c => c.email?.includes("@"));

    if (!contacts.length) {
      toast.error("Enter at least one valid email");
      return;
    }

    setLoading(true);
    try {
      const res = await callPlanner("enroll", { contacts });
      toast.success(`Enrolled ${res.enrolled} planners`);
      setCsvInput("");
      loadStats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Enrollment failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (step: number) => {
    setPreviewStep(step);
    try {
      const res = await callPlanner("preview", { step });
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <p className="font-sans text-sm text-foreground leading-tight">{d.subject}</p>
              <p className="font-sans text-xs text-accent mt-2">{stats.stepCounts[i]} waiting</p>
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
                Preview: Email {previewStep + 1} — "{DRIP_LABELS[previewStep].subject}"
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Day {DRIP_LABELS[previewStep].day} · Sample: Sarah from Stellar Events</p>
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
