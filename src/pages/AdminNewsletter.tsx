import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Upload, Send, FileText, Flame, ThermometerSun, RefreshCw, Trash2, Eye, Heart, Download, LayoutGrid, DollarSign, Users, MoreHorizontal, Plus, X, ClipboardList, Search, AlertTriangle, CalendarCheck, ShieldAlert, UserMinus, Mail, ArrowRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import PlannerDripTab from "@/components/PlannerDripTab";
import ResidentDripTab from "@/components/ResidentDripTab";
import ContactsListTab from "@/components/ContactsListTab";
import CampaignCalendarTab from "@/components/CampaignCalendarTab";
import AnalyticsTab from "@/components/AnalyticsTab";
import PipelineTab from "@/components/PipelineTab";
import ActionListTab from "@/components/ActionListTab";
import RevenueTab from "@/components/RevenueTab";
import SubjectScorer from "@/components/SubjectScorer";
// ColdCampaignsTab removed — consolidated into ColdDripCampaignTab with sub-selector
import ColdDripCampaignTab from "@/components/ColdDripCampaignTab";
import EmailAnalyticsTab from "@/components/EmailAnalyticsTab";
import LeadAttributionTab from "@/components/LeadAttributionTab";
import DealInboxTab from "@/components/DealInboxTab";
import FollowupQueueTab from "@/components/FollowupQueueTab";
import CastleInvitesTab from "@/components/CastleInvitesTab";
import { BiometricUnlockButton, BiometricEnrollPrompt } from "@/components/BiometricUnlockButton";
import { useIsMobile } from "@/hooks/use-mobile";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface Contact {
  id: string;
  email: string;
  name: string | null;
  source: string;
  subscribed: boolean;
  drip_step: number;
  last_emailed_at: string | null;
  created_at: string;
}

interface Campaign {
  id: string;
  subject: string;
  body_html: string;
  body_preview: string | null;
  status: string;
  campaign_type: string;
  drip_step: number | null;
  sent_count: number;
  created_at: string;
}

interface CampaignStats {
  subscribers: number;
  unsubscribed: number;
  emailsSent: number;
  hot: number;
  warm: number;
}

interface ColdCampaignStats {
  total: number;
  active: number;
  paused: number;
  replied: number;
  completed: number;
}

interface Stats {
  subscribers: number;
  campaigns: number;
  emailsSent: number;
  planner?: CampaignStats;
  resident?: CampaignStats;
  cold_corporate?: ColdCampaignStats;
  cold_wedding?: ColdCampaignStats;
  cold_club?: ColdCampaignStats;
  cold_pr?: ColdCampaignStats;
  cold_nonprofit?: ColdCampaignStats;
  cold_talent?: ColdCampaignStats;
  cold_spirits?: ColdCampaignStats;
  cold_charity_golf?: ColdCampaignStats;
}

const AdminNewsletter = () => {
  const isMobile = useIsMobile();
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(() => {
    // Check both localStorage and sessionStorage for session persistence
    const saved = localStorage.getItem("wr_admin_session") || sessionStorage.getItem("wr_admin_session");
    if (saved) {
      try {
        const { pw: _pw, ts } = JSON.parse(saved);
        if (Date.now() - ts < 24 * 60 * 60 * 1000) return true;
      } catch {}
      localStorage.removeItem("wr_admin_session");
      sessionStorage.removeItem("wr_admin_session");
    }
    return false;
  });
  const [storedPassword, setStoredPassword] = useState(() => {
    const saved = localStorage.getItem("wr_admin_session") || sessionStorage.getItem("wr_admin_session");
    if (saved) {
      try {
        const { pw, ts } = JSON.parse(saved);
        if (Date.now() - ts < 24 * 60 * 60 * 1000) return pw;
      } catch {}
    }
    return "";
  });

  const [activeTab, setActiveTab] = useState<"dashboard" | "pipeline" | "inbox" | "actions" | "followups" | "revenue" | "contacts" | "compose" | "campaigns" | "calendar" | "analytics" | "email_analytics" | "planner" | "apartment" | "thankyou" | "cold" | "lead_attribution" | "castle">("dashboard");
  const [coldCategory, setColdCategory] = useState<string>("corporate_planner");
  const [actionBadge, setActionBadge] = useState(0);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddForm, setQuickAddForm] = useState({ name: "", email: "", phone: "", event_type: "", notes: "", source: "Referral" });
  const [quickAddSaving, setQuickAddSaving] = useState(false);
  const [showMoreTabs, setShowMoreTabs] = useState(false);
  const [tyClientName, setTyClientName] = useState("");
  const [tyClientEmail, setTyClientEmail] = useState("");
  const [tyEventType, setTyEventType] = useState("");
  const [tySending, setTySending] = useState(false);
  const [tySent, setTySent] = useState(false);
  const [contactsFilter, setContactsFilter] = useState<string>("all");
  const [contactsCampaign, setContactsCampaign] = useState<string>("all");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<Stats>({ subscribers: 0, campaigns: 0, emailsSent: 0 });
  const [loading, setLoading] = useState(false);

  // Global search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ contacts: any[]; deals: any[]; cold: any[] } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dashboard summary state
  const [dashSummary, setDashSummary] = useState<{
    dueToday: number;
    overdue: number;
    recentInquiries: number;
    recentQuiz: number;
    recentConsultations: number;
    recentInquiriesList: Array<{ id: string; name: string; email: string; event_type?: string; created_at: string }>;
    recentQuizList: Array<{ id: string; name?: string; email?: string; recommendation: string; created_at: string }>;
    recentConsultationsList: Array<{ id: string; name: string; email: string; event_type?: string; created_at: string }>;
    sourceCounts: Record<string, number>;
    emailHealth: {
      bouncesTotal: number;
      bounces30d: number;
      unsubsTotal: number;
      unsubs30d: number;
      totalContacts: number;
      totalSent: number;
    };
  } | null>(null);

  // Compose state
  const [topic, setTopic] = useState("");
  const [campaignType, setCampaignType] = useState<"broadcast" | "drip">("broadcast");
  const [dripStep, setDripStep] = useState(1);
  const [draftSubject, setDraftSubject] = useState("");
  const [draftHtml, setDraftHtml] = useState("");
  const [draftPreview, setDraftPreview] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [editedCampaignId, setEditedCampaignId] = useState<string | null>(null);


  const callAdmin = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/newsletter-admin`, {
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

  const loadData = useCallback(async () => {
    if (!storedPassword) return;
    setLoading(true);
    try {
      const [statsRes, contactsRes, campaignsRes, summaryRes] = await Promise.all([
        callAdmin("get_stats"),
        callAdmin("get_contacts"),
        callAdmin("get_campaigns"),
        callAdmin("get_dashboard_summary"),
      ]);
      setStats(statsRes);
      setContacts(contactsRes.contacts || []);
      setCampaigns(campaignsRes.campaigns || []);
      setDashSummary(summaryRes);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [storedPassword, callAdmin]);

  // Global search with debounce
  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (q.length < 2) { setSearchResults(null); return; }
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await callAdmin("global_search", { query: q });
        setSearchResults(res);
      } catch { setSearchResults(null); }
    }, 300);
  }, [callAdmin]);

  useEffect(() => {
    if (authenticated) loadData();
  }, [authenticated, loadData]);

  const handleLogin = async (e?: React.FormEvent, pwOverride?: string) => {
    if (e) e.preventDefault();
    const candidate = pwOverride ?? password;
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/newsletter-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ action: "get_stats", adminPassword: candidate }),
      });
      if (res.ok) {
        setPassword(candidate);
        setStoredPassword(candidate);
        setAuthenticated(true);
        const session = JSON.stringify({ pw: candidate, ts: Date.now() });
        localStorage.setItem("wr_admin_session", session);
        sessionStorage.setItem("wr_admin_session", session);
        toast.success("Welcome back");
      } else {
        toast.error("Invalid password");
      }
    } catch {
      toast.error("Connection failed");
    }
  };

  // Smart CSV parser that handles quoted fields with commas/newlines
  const parseCSVRow = (row: string): string[] => {
    const cols: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        cols.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    cols.push(current.trim());
    return cols;
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    // Normalize line endings and handle quoted multi-line fields
    const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    
    // Reassemble lines that are inside quoted fields
    const rawLines: string[] = [];
    let buffer = "";
    let quoteCount = 0;
    for (const line of normalized.split("\n")) {
      buffer += (buffer ? "\n" : "") + line;
      quoteCount += (line.match(/"/g) || []).length;
      if (quoteCount % 2 === 0) {
        rawLines.push(buffer);
        buffer = "";
        quoteCount = 0;
      }
    }
    if (buffer) rawLines.push(buffer);

    const lines = rawLines.filter(l => l.trim());
    if (!lines.length) { toast.error("Empty CSV"); return; }

    const headerCols = parseCSVRow(lines[0]).map(h => h.toLowerCase().replace(/^\ufeff/, ""));
    
    // Detect column indices for multiple CSV formats
    const emailIdx = headerCols.findIndex(h => h.includes("email"));
    const apartmentIdx = headerCols.findIndex(h => h.includes("apartment name") || h === "building name");
    const firstNameIdx = headerCols.findIndex(h => h.includes("first name"));
    const companyIdx = headerCols.findIndex(h => h.includes("company") || h.includes("apartment name") || h === "building name");
    const cityIdx = headerCols.findIndex(h => h === "city");
    const phoneIdx = headerCols.findIndex(h => h.includes("phone") || h.includes("mobile") || h.includes("cell"));
    const nameIdx = headerCols.findIndex(h => h.includes("name") && !h.includes("first") && !h.includes("last") && !h.includes("apartment") && !h.includes("building"));

    if (emailIdx === -1) {
      toast.error("CSV must have an 'email' or 'EMAIL CONTACT' column");
      return;
    }

    const isApartmentCSV = apartmentIdx >= 0;

    const parsed = lines.slice(1).map(line => {
      const cols = parseCSVRow(line);
      const email = cols[emailIdx]?.replace(/^"|"$/g, "").trim();
      if (!email || !email.includes("@")) return null;

      let contactName: string | undefined;
      const apartmentName = isApartmentCSV ? cols[apartmentIdx]?.replace(/^"|"$/g, "").trim() : undefined;

      if (isApartmentCSV && apartmentName) {
        // Auto-transform: set name to "[Apartment Name] Team"
        contactName = `${apartmentName} Team`;
      } else if (firstNameIdx >= 0) {
        contactName = cols[firstNameIdx]?.replace(/^"|"$/g, "").trim() || undefined;
      } else if (nameIdx >= 0) {
        contactName = cols[nameIdx]?.replace(/^"|"$/g, "").trim() || undefined;
      }

      const company = isApartmentCSV && apartmentName ? apartmentName : (companyIdx >= 0 ? cols[companyIdx]?.replace(/^"|"$/g, "").trim() || undefined : undefined);
      const city = cityIdx >= 0 ? cols[cityIdx]?.replace(/^"|"$/g, "").replace(/,$/g, "").trim() || undefined : undefined;
      const phone = phoneIdx >= 0 ? cols[phoneIdx]?.replace(/^"|"$/g, "").trim() || undefined : undefined;

      return {
        email: email.toLowerCase(),
        name: contactName,
        company,
        city,
        phone,
        source: "csv",
      };
    }).filter(Boolean);

    if (!parsed.length) {
      toast.error("No valid emails found in CSV");
      return;
    }

    try {
      const res = await callAdmin("import_contacts", { contacts: parsed });
      toast.success(`Imported ${res.imported} contacts${isApartmentCSV ? " (names set to [Apartment] Team)" : ""}`);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    }
    e.target.value = "";
  };

  // Process CSV and download updated version with [Apartment Name] Team names
  const handleProcessAndDownloadCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    
    // Reassemble lines that are inside quoted fields
    const rawLines: string[] = [];
    let buffer = "";
    let quoteCount = 0;
    for (const line of normalized.split("\n")) {
      buffer += (buffer ? "\n" : "") + line;
      quoteCount += (line.match(/"/g) || []).length;
      if (quoteCount % 2 === 0) {
        rawLines.push(buffer);
        buffer = "";
        quoteCount = 0;
      }
    }
    if (buffer) rawLines.push(buffer);

    const lines = rawLines.filter(l => l.trim());
    if (!lines.length) { toast.error("Empty CSV"); return; }

    const headerCols = parseCSVRow(lines[0]).map(h => h.toLowerCase().replace(/^\ufeff/, ""));
    const emailIdx = headerCols.findIndex(h => h.includes("email"));
    const apartmentIdx = headerCols.findIndex(h => h.includes("apartment name") || h === "building name");
    const firstNameIdx = headerCols.findIndex(h => h.includes("first name"));

    if (emailIdx === -1 || apartmentIdx === -1 || firstNameIdx === -1) {
      toast.error("CSV must have 'Email', 'Apartment Name', and 'First Name' columns");
      e.target.value = "";
      return;
    }

    let updatedCount = 0;
    const outputLines = [lines[0]]; // keep header as-is

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVRow(lines[i]);
      const email = cols[emailIdx]?.replace(/^"|"$/g, "").trim();
      const apartmentName = cols[apartmentIdx]?.replace(/^"|"$/g, "").trim();

      if (email && email.includes("@") && apartmentName) {
        cols[firstNameIdx] = `${apartmentName} Team`;
        updatedCount++;
      }

      // Rebuild line with proper CSV quoting
      const rebuiltLine = cols.map(c => {
        const val = c || "";
        if (val.includes(",") || val.includes('"') || val.includes("\n")) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(",");
      outputLines.push(rebuiltLine);
    }

    // Trigger download
    const blob = new Blob([outputLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name.replace(/\.csv$/i, "-UPDATED.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Updated ${updatedCount} contact names to [Apartment Name] Team`);
    e.target.value = "";
  };

  const handleDraft = async () => {
    setDrafting(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/draft-newsletter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          topic: topic || undefined,
          campaignType,
          dripStep: campaignType === "drip" ? dripStep : undefined,
          adminPassword: storedPassword,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Draft failed");
      }
      const draft = await res.json();
      setDraftSubject(draft.subject || "");
      setDraftHtml(draft.body_html || "");
      setDraftPreview(draft.preview || "");
      toast.success("AI draft ready for review");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate draft");
    } finally {
      setDrafting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!draftSubject || !draftHtml) {
      toast.error("Subject and body required");
      return;
    }
    try {
      const res = await callAdmin("save_campaign", {
        campaign: {
          id: editedCampaignId || undefined,
          subject: draftSubject,
          body_html: draftHtml,
          body_preview: draftPreview,
          campaign_type: campaignType,
          drip_step: campaignType === "drip" ? dripStep : null,
          status: "draft",
        },
      });
      toast.success("Campaign saved");
      setEditedCampaignId(res.campaign.id);
      loadData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  const handleApproveAndSend = async (campaignId: string) => {
    if (!confirm(`Send this email to ${stats.subscribers} subscribers?`)) return;
    setSending(true);
    try {
      // First approve
      await callAdmin("save_campaign", {
        campaign: { id: campaignId, status: "approved", subject: draftSubject, body_html: draftHtml, body_preview: draftPreview },
      });
      // Then send
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-newsletter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ campaignId, adminPassword: storedPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Sent to ${data.sent} of ${data.total} contacts`);
        loadData();
        resetCompose();
      } else {
        throw new Error(data.error || "Send failed");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm("Delete this campaign?")) return;
    try {
      await callAdmin("delete_campaign", { campaignId: id });
      toast.success("Deleted");
      loadData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const resetCompose = () => {
    setTopic("");
    setDraftSubject("");
    setDraftHtml("");
    setDraftPreview("");
    setEditedCampaignId(null);
    setPreviewMode(false);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[hsl(var(--forest-dark))] flex items-center justify-center px-6">
        <form onSubmit={handleLogin} className="w-full max-w-sm">
          <h1 className="font-serif text-3xl text-cream mb-8 text-center">White Rabbit Concierge</h1>
          <BiometricUnlockButton
            namespace="newsletter"
            variant="dark"
            onUnlock={(pw) => handleLogin(undefined, pw)}
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter admin password"
            autoFocus
            className="w-full bg-[hsl(var(--forest-dark))]/50 border border-cream/20 text-cream px-4 py-3 mb-4 font-sans text-base focus:outline-none focus:border-accent"
          />
          <button type="submit" className="w-full bg-accent text-accent-foreground py-3 font-sans text-sm tracking-[0.2em] uppercase hover:bg-accent/80 transition-colors min-h-[44px]">
            Enter
          </button>
        </form>
      </div>
    );
  }

  const handleQuickAddSave = async () => {
    if (!quickAddForm.name || !quickAddForm.email) { toast.error("Name and email required"); return; }
    setQuickAddSaving(true);
    try {
      await callAdmin("create_deal", {
        deal: {
          contact_name: quickAddForm.name,
          contact_email: quickAddForm.email.toLowerCase(),
          event_type: quickAddForm.event_type || null,
          notes: [quickAddForm.phone ? `Phone: ${quickAddForm.phone}` : "", quickAddForm.notes].filter(Boolean).join("\n"),
          source: quickAddForm.source,
          stage: "new",
        }
      });
      toast.success("Lead added to pipeline");
      setShowQuickAdd(false);
      setQuickAddForm({ name: "", email: "", phone: "", event_type: "", notes: "", source: "Referral" });
      loadData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setQuickAddSaving(false);
    }
  };

  // Mobile bottom nav tabs
  const MOBILE_NAV_TABS = [
    { key: "dashboard" as const, icon: LayoutGrid, label: "Dashboard" },
    { key: "pipeline" as const, icon: FileText, label: "Pipeline" },
    { key: "actions" as const, icon: ClipboardList, label: "Actions", badge: actionBadge },
    { key: "revenue" as const, icon: DollarSign, label: "Revenue" },
    { key: "contacts" as const, icon: Users, label: "Contacts" },
  ];

  

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 md:pb-16" onClick={() => searchOpen && setSearchOpen(false)}>
      {/* Add bottom padding on mobile for the nav bar */}
      <div className={`max-w-6xl mx-auto px-4 md:px-6 ${isMobile ? 'pb-24' : ''}`}>
        <BiometricEnrollPrompt namespace="newsletter" password={storedPassword} variant="light" />
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h1 className="font-serif text-2xl md:text-3xl text-foreground">White Rabbit Concierge</h1>
          <div className="flex items-center gap-2">
            <a
              href="/admin/proposals"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 border border-border text-foreground hover:border-accent hover:text-accent transition-colors font-sans text-xs tracking-[0.15em] uppercase min-h-[44px]"
              title="Proposals"
            >
              <FileText size={14} /> Proposals
            </a>
            <button onClick={loadData} disabled={loading} className="text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Mobile-prominent Proposals CTA */}
        <a
          href="/admin/proposals"
          className="md:hidden w-full bg-forest-dark text-cream px-5 py-4 flex items-center justify-center gap-2 hover:opacity-90 shadow-md mb-4 text-base font-medium tracking-wide"
        >
          <FileText size={18} /> Open Proposals
        </a>

        {/* Global Search Bar */}
        <div className="relative mb-6">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search contacts, deals, outreach by name or email..."
              className="w-full bg-muted/20 border border-border text-foreground pl-10 pr-4 py-2.5 font-sans text-sm focus:outline-none focus:border-accent transition-colors"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); setSearchResults(null); setSearchOpen(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            )}
          </div>
          {searchOpen && searchResults && (searchResults.contacts.length > 0 || searchResults.deals.length > 0 || searchResults.cold.length > 0) && (
            <div className="absolute top-full left-0 right-0 z-50 bg-background border border-border shadow-lg max-h-80 overflow-y-auto mt-1">
              {searchResults.deals.length > 0 && (
                <div>
                  <p className="px-4 py-2 text-[10px] tracking-[0.2em] uppercase text-muted-foreground bg-muted/10 border-b border-border">Pipeline ({searchResults.deals.length})</p>
                  {searchResults.deals.map((d: any) => (
                    <button key={d.id} onClick={() => { setActiveTab("pipeline"); setSearchOpen(false); setSearchQuery(""); setSearchResults(null); }} className="w-full text-left px-4 py-2.5 hover:bg-muted/20 border-b border-border/50 transition-colors">
                      <p className="text-sm text-foreground">{d.contact_name || d.contact_email}</p>
                      <p className="text-[10px] text-muted-foreground">{d.stage} · {d.event_type || "No type"} · {d.source || "Unknown source"}</p>
                    </button>
                  ))}
                </div>
              )}
              {searchResults.contacts.length > 0 && (
                <div>
                  <p className="px-4 py-2 text-[10px] tracking-[0.2em] uppercase text-muted-foreground bg-muted/10 border-b border-border">Contacts ({searchResults.contacts.length})</p>
                  {searchResults.contacts.map((c: any) => (
                    <button key={c.id} onClick={() => { setContactsFilter("all"); setContactsCampaign("all"); setActiveTab("contacts"); setSearchOpen(false); setSearchQuery(""); setSearchResults(null); }} className="w-full text-left px-4 py-2.5 hover:bg-muted/20 border-b border-border/50 transition-colors">
                      <p className="text-sm text-foreground">{c.name || c.email}</p>
                      <p className="text-[10px] text-muted-foreground">{c.email} · {c.drip_campaign} · {c.engagement_status}</p>
                    </button>
                  ))}
                </div>
              )}
              {searchResults.cold.length > 0 && (
                <div>
                  <p className="px-4 py-2 text-[10px] tracking-[0.2em] uppercase text-muted-foreground bg-muted/10 border-b border-border">Cold Outreach ({searchResults.cold.length})</p>
                  {searchResults.cold.map((c: any) => (
                    <button key={c.id} onClick={() => { setColdCategory(c.campaign_category); setActiveTab("cold"); setSearchOpen(false); setSearchQuery(""); setSearchResults(null); }} className="w-full text-left px-4 py-2.5 hover:bg-muted/20 border-b border-border/50 transition-colors">
                      <p className="text-sm text-foreground">{c.name || c.email}</p>
                      <p className="text-[10px] text-muted-foreground">{c.email} · {c.campaign_category} · {c.status}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Desktop Tabs — hidden on mobile */}
        <div className="hidden md:flex gap-1 mb-8 border-b border-border overflow-x-auto">
          {(["dashboard", "pipeline", "inbox", "actions", "followups", "revenue", "contacts", "cold", "castle", "compose", "campaigns", "calendar", "analytics", "email_analytics", "lead_attribution", "planner", "apartment", "thankyou"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-4 py-2 font-sans text-sm tracking-wider uppercase transition-colors whitespace-nowrap ${
                activeTab === tab ? "text-accent border-b-2 border-accent" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "actions" ? "ACTION LIST" : tab === "followups" ? "✨ FOLLOW-UPS" : tab === "inbox" ? "📬 INBOX" : tab === "email_analytics" ? "📊 EMAIL ANALYTICS" : tab === "lead_attribution" ? "📈 ATTRIBUTION" : tab === "cold" ? "🎯 OUTREACH" : tab === "castle" ? "🏰 CASTLE" : tab}
              {tab === "actions" && actionBadge > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[9px] font-sans min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">{actionBadge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Mobile "More" tabs — shown when more tabs overlay is open */}
        {isMobile && showMoreTabs && (
          <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-sans text-sm tracking-[0.2em] uppercase text-foreground">All Tabs</h2>
              <button onClick={() => setShowMoreTabs(false)} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {(["dashboard", "pipeline", "inbox", "actions", "followups", "revenue", "contacts", "cold", "castle", "compose", "campaigns", "calendar", "analytics", "email_analytics", "lead_attribution", "planner", "apartment", "thankyou"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setShowMoreTabs(false); }}
                  className={`w-full text-left px-4 py-3 font-sans text-sm tracking-wider uppercase transition-colors min-h-[44px] ${
                    activeTab === tab ? "text-accent bg-accent/10" : "text-foreground hover:bg-muted/20"
                  }`}
                >
                  {tab === "actions" ? "ACTION LIST" : tab === "followups" ? "✨ Follow-Ups" : tab === "inbox" ? "📬 Inbox" : tab === "email_analytics" ? "📊 Email Analytics" : tab === "lead_attribution" ? "📈 Lead Attribution" : tab === "cold" ? "🎯 Cold Outreach" : tab === "castle" ? "🏰 Castle Invites" : tab}
                  {tab === "actions" && actionBadge > 0 && (
                    <span className="ml-2 bg-destructive text-destructive-foreground text-[9px] font-sans min-w-[16px] h-4 inline-flex items-center justify-center rounded-full px-1">{actionBadge}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Add Lead Modal */}
        {showQuickAdd && (
          <div className="fixed inset-0 z-50 bg-background flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-serif text-xl text-foreground">Quick Add Lead</h2>
              <button onClick={() => setShowQuickAdd(false)} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1">Name *</label>
                <input value={quickAddForm.name} onChange={e => setQuickAddForm(f => ({ ...f, name: e.target.value }))} placeholder="Contact name" className="w-full bg-muted/20 border border-border text-foreground px-4 py-3 text-base focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1">Email *</label>
                <input type="email" value={quickAddForm.email} onChange={e => setQuickAddForm(f => ({ ...f, email: e.target.value }))} placeholder="email@company.com" className="w-full bg-muted/20 border border-border text-foreground px-4 py-3 text-base focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1">Phone</label>
                <input type="tel" value={quickAddForm.phone} onChange={e => setQuickAddForm(f => ({ ...f, phone: e.target.value }))} placeholder="(310) 555-0100" className="w-full bg-muted/20 border border-border text-foreground px-4 py-3 text-base focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1">Event Type</label>
                <select value={quickAddForm.event_type} onChange={e => setQuickAddForm(f => ({ ...f, event_type: e.target.value }))} className="w-full bg-muted/20 border border-border text-foreground px-4 py-3 text-base focus:outline-none focus:border-accent">
                  <option value="">Select type...</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Private Party">Private Party</option>
                  <option value="Fundraiser">Fundraiser</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1">Source</label>
                <select value={quickAddForm.source} onChange={e => setQuickAddForm(f => ({ ...f, source: e.target.value }))} className="w-full bg-muted/20 border border-border text-foreground px-4 py-3 text-base focus:outline-none focus:border-accent">
                  <option value="Referral">Referral</option>
                  <option value="Magic Castle">Magic Castle</option>
                  <option value="Event">Event</option>
                  <option value="Cold Outreach">Cold Outreach</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground block mb-1">Notes</label>
                <textarea value={quickAddForm.notes} onChange={e => setQuickAddForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Met at the Netflix party..." className="w-full bg-muted/20 border border-border text-foreground px-4 py-3 text-base focus:outline-none focus:border-accent resize-none" />
              </div>
              <button onClick={handleQuickAddSave} disabled={quickAddSaving} className="w-full bg-accent text-accent-foreground py-3 font-sans text-sm tracking-[0.2em] uppercase hover:bg-accent/80 transition-colors disabled:opacity-50 min-h-[44px]">
                {quickAddSaving ? "Saving..." : "Save Lead"}
              </button>
            </div>
          </div>
        )}

        {/* Pipeline */}
        {activeTab === "pipeline" && (
          <PipelineTab adminPassword={storedPassword} />
        )}

        {/* Action List */}
        {activeTab === "actions" && (
          <ActionListTab adminPassword={storedPassword} onBadgeCount={setActionBadge} />
        )}

        {/* AI Follow-Ups Queue */}
        {activeTab === "followups" && (
          <FollowupQueueTab adminPassword={storedPassword} />
        )}

        {/* Revenue */}
        {activeTab === "revenue" && (
          <RevenueTab adminPassword={storedPassword} />
        )}

        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* Today's Pulse + Source Attribution */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Follow-up Reminders */}
              <button
                onClick={() => setActiveTab("actions")}
                className="border border-border p-6 text-left hover:border-accent/30 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-3">
                  <CalendarCheck size={16} className="text-accent" />
                  <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground">Follow-Ups</h3>
                </div>
                <div className="flex gap-6">
                  <div>
                    <p className="font-serif text-3xl text-foreground group-hover:text-accent transition-colors">{dashSummary?.dueToday ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground">due today</p>
                  </div>
                  {(dashSummary?.overdue ?? 0) > 0 && (
                    <div>
                      <p className="font-serif text-3xl text-destructive">{dashSummary?.overdue}</p>
                      <p className="text-[10px] text-destructive/70 flex items-center gap-1"><AlertTriangle size={10} /> overdue</p>
                    </div>
                  )}
                </div>
              </button>

              {/* Recent Activity */}
              <div className="border border-border p-6">
                <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-3">Last 24 Hours</h3>
                <div className="flex gap-6">
                  <div>
                    <p className="font-serif text-3xl text-foreground">{dashSummary?.recentInquiries ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground">inquiries</p>
                  </div>
                  <div>
                    <p className="font-serif text-3xl text-foreground">{dashSummary?.recentQuiz ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground">quiz leads</p>
                  </div>
                  <div>
                    <p className="font-serif text-3xl text-foreground">{dashSummary?.recentConsultations ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground">consultations</p>
                  </div>
                </div>
              </div>

              {/* Lead Source Attribution Pie Chart */}
              <div className="border border-border p-6">
                <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-3">Lead Sources</h3>
                {dashSummary?.sourceCounts && Object.keys(dashSummary.sourceCounts).length > 0 ? (
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={Object.entries(dashSummary.sourceCounts).map(([name, value]) => ({ name, value }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={20}
                            outerRadius={40}
                            dataKey="value"
                            stroke="none"
                          >
                            {Object.keys(dashSummary.sourceCounts).map((_, i) => (
                              <Cell key={i} fill={["hsl(var(--accent))", "hsl(var(--primary))", "hsl(150, 40%, 45%)", "hsl(210, 50%, 50%)", "hsl(340, 40%, 55%)", "hsl(45, 70%, 50%)", "hsl(270, 40%, 50%)", "hsl(180, 40%, 45%)"][i % 8]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", fontSize: "12px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-1">
                      {Object.entries(dashSummary.sourceCounts)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([source, count], i) => (
                          <div key={source} className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ["hsl(var(--accent))", "hsl(var(--primary))", "hsl(150, 40%, 45%)", "hsl(210, 50%, 50%)", "hsl(340, 40%, 55%)", "hsl(45, 70%, 50%)", "hsl(270, 40%, 50%)", "hsl(180, 40%, 45%)"][i % 8] }} />
                            <span className="text-muted-foreground truncate">{source}</span>
                            <span className="text-foreground font-medium ml-auto">{count}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No data yet</p>
                )}
              </div>
            </div>

            {/* Email Health + Recent Form Submissions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email Health */}
              <div className="border border-border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Mail size={16} className="text-accent" />
                  <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground">Email Health</h3>
                </div>
                {dashSummary?.emailHealth ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted/10 px-4 py-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <ShieldAlert size={12} className="text-destructive" />
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Bounces (30d)</span>
                        </div>
                        <p className="font-serif text-2xl text-foreground">{dashSummary.emailHealth.bounces30d}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {dashSummary.emailHealth.totalSent > 0
                            ? `${((dashSummary.emailHealth.bouncesTotal / dashSummary.emailHealth.totalSent) * 100).toFixed(1)}% lifetime rate`
                            : "No sends yet"}
                        </p>
                      </div>
                      <div className="bg-muted/10 px-4 py-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <UserMinus size={12} className="text-orange-400" />
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Unsubs (30d)</span>
                        </div>
                        <p className="font-serif text-2xl text-foreground">{dashSummary.emailHealth.unsubs30d}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {dashSummary.emailHealth.totalContacts > 0
                            ? `${dashSummary.emailHealth.unsubsTotal} total of ${dashSummary.emailHealth.totalContacts}`
                            : "No contacts yet"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab("email_analytics")}
                      className="flex items-center gap-1 text-[10px] tracking-[0.15em] uppercase text-muted-foreground hover:text-accent transition-colors"
                    >
                      View full analytics <ArrowRight size={10} />
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Loading...</p>
                )}
              </div>

              {/* Recent Form Submissions Feed */}
              <div className="border border-border p-6">
                <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">Recent Submissions (24h)</h3>
                {dashSummary && (dashSummary.recentInquiriesList?.length > 0 || dashSummary.recentQuizList?.length > 0 || dashSummary.recentConsultationsList?.length > 0) ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {[
                      ...(dashSummary.recentInquiriesList || []).map(i => ({ ...i, _type: "inquiry" as const })),
                      ...(dashSummary.recentQuizList || []).map(i => ({ ...i, _type: "quiz" as const })),
                      ...(dashSummary.recentConsultationsList || []).map(i => ({ ...i, _type: "consultation" as const })),
                    ]
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .slice(0, 8)
                      .map(item => (
                        <div key={`${item._type}-${item.id}`} className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
                          <span className="text-sm mt-0.5">
                            {item._type === "inquiry" ? "📩" : item._type === "quiz" ? "🎯" : "📞"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground truncate">{item.name || item.email || "Anonymous"}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {item._type === "inquiry" ? "Booking inquiry" : item._type === "quiz" ? "Quiz lead" : "Consultation"}
                              {" · "}
                              {new Date(item.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                            </p>
                          </div>
                          <span className={`text-[9px] px-1.5 py-0.5 font-sans uppercase tracking-wider ${
                            item._type === "inquiry" ? "bg-accent/10 text-accent" :
                            item._type === "quiz" ? "bg-primary/10 text-primary" :
                            "bg-emerald-500/10 text-emerald-400"
                          }`}>
                            {item._type}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No submissions in the last 24 hours</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Planner Audience */}
              <div className="border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-accent">Planners</h3>
                  <button
                    onClick={() => { setContactsFilter("all"); setContactsCampaign("planner"); setActiveTab("contacts"); }}
                    className="font-sans text-[10px] tracking-wider uppercase text-muted-foreground hover:text-accent transition-colors"
                  >
                    View All →
                  </button>
                </div>
                <button
                  onClick={() => { setContactsFilter("all"); setContactsCampaign("planner"); setActiveTab("contacts"); }}
                  className="text-left w-full mb-4 group"
                >
                  <p className="font-serif text-4xl text-foreground group-hover:text-accent transition-colors">{stats.planner?.subscribers ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">active subscribers</p>
                </button>
                <div className="grid grid-cols-3 gap-3 text-xs font-sans">
                  <div className="bg-accent/5 px-3 py-2">
                    <span className="text-muted-foreground block">Emails Sent</span>
                    <span className="text-foreground font-medium">{stats.planner?.emailsSent ?? 0}</span>
                  </div>
                  <button
                    onClick={() => { setContactsFilter("hot"); setContactsCampaign("planner"); setActiveTab("contacts"); }}
                    className="bg-accent/5 px-3 py-2 text-left hover:bg-accent/10 transition-colors"
                  >
                    <span className="flex items-center gap-1 text-muted-foreground"><Flame size={10} className="text-destructive" /> Hot</span>
                    <span className="text-foreground font-medium">{stats.planner?.hot ?? 0}</span>
                  </button>
                  <button
                    onClick={() => { setContactsFilter("warm"); setContactsCampaign("planner"); setActiveTab("contacts"); }}
                    className="bg-accent/5 px-3 py-2 text-left hover:bg-accent/10 transition-colors"
                  >
                    <span className="flex items-center gap-1 text-muted-foreground"><ThermometerSun size={10} className="text-orange-400" /> Warm</span>
                    <span className="text-foreground font-medium">{stats.planner?.warm ?? 0}</span>
                  </button>
                </div>
                {(stats.planner?.unsubscribed ?? 0) > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-2">{stats.planner?.unsubscribed} unsubscribed</p>
                )}
              </div>

              {/* Apartment Audience */}
              <div className="border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-accent">Apartments</h3>
                  <button
                    onClick={() => { setContactsFilter("all"); setContactsCampaign("resident"); setActiveTab("contacts"); }}
                    className="font-sans text-[10px] tracking-wider uppercase text-muted-foreground hover:text-accent transition-colors"
                  >
                    View All →
                  </button>
                </div>
                <button
                  onClick={() => { setContactsFilter("all"); setContactsCampaign("resident"); setActiveTab("contacts"); }}
                  className="text-left w-full mb-4 group"
                >
                  <p className="font-serif text-4xl text-foreground group-hover:text-accent transition-colors">{stats.resident?.subscribers ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">active subscribers</p>
                </button>
                <div className="grid grid-cols-3 gap-3 text-xs font-sans">
                  <div className="bg-accent/5 px-3 py-2">
                    <span className="text-muted-foreground block">Emails Sent</span>
                    <span className="text-foreground font-medium">{stats.resident?.emailsSent ?? 0}</span>
                  </div>
                  <button
                    onClick={() => { setContactsFilter("hot"); setContactsCampaign("resident"); setActiveTab("contacts"); }}
                    className="bg-accent/5 px-3 py-2 text-left hover:bg-accent/10 transition-colors"
                  >
                    <span className="flex items-center gap-1 text-muted-foreground"><Flame size={10} className="text-destructive" /> Hot</span>
                    <span className="text-foreground font-medium">{stats.resident?.hot ?? 0}</span>
                  </button>
                  <button
                    onClick={() => { setContactsFilter("warm"); setContactsCampaign("resident"); setActiveTab("contacts"); }}
                    className="bg-accent/5 px-3 py-2 text-left hover:bg-accent/10 transition-colors"
                  >
                    <span className="flex items-center gap-1 text-muted-foreground"><ThermometerSun size={10} className="text-orange-400" /> Warm</span>
                    <span className="text-foreground font-medium">{stats.resident?.warm ?? 0}</span>
                  </button>
                </div>
                {(stats.resident?.unsubscribed ?? 0) > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-2">{stats.resident?.unsubscribed} unsubscribed</p>
                )}
              </div>
            </div>

            {/* Cold Campaign Categories */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {([
                { key: "cold_corporate" as const, label: "Corporate", emoji: "🏢", category: "corporate_planner" },
                { key: "cold_wedding" as const, label: "Wedding", emoji: "💍", category: "wedding_planner" },
                { key: "cold_club" as const, label: "Clubs", emoji: "⛳", category: "country_club" },
                { key: "cold_pr" as const, label: "PR", emoji: "📱", category: "pr_agency" },
                { key: "cold_nonprofit" as const, label: "Nonprofit", emoji: "❤️", category: "nonprofit" },
                { key: "cold_talent" as const, label: "Talent", emoji: "🎬", category: "talent" },
                { key: "cold_nightlife" as const, label: "Nightlife", emoji: "🌙", category: "nightlife" },
                { key: "cold_spirits" as const, label: "Spirits", emoji: "🍸", category: "spirits" },
                { key: "cold_charity_golf" as const, label: "Charity Golf", emoji: "🏌️", category: "charity_golf" },
              ]).map(cat => {
                const s = stats[cat.key] || { total: 0, active: 0, paused: 0, replied: 0, completed: 0 };
                return (
                  <button
                    key={cat.key}
                    onClick={() => { setColdCategory(cat.category); setActiveTab("cold"); }}
                    className="border border-border p-4 text-left hover:border-accent/30 transition-colors group"
                  >
                    <span className="text-lg">{cat.emoji}</span>
                    <h3 className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground mt-1">{cat.label}</h3>
                    <p className="font-serif text-3xl text-foreground group-hover:text-accent transition-colors">{s.total}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-[9px] font-sans">
                      {s.active > 0 && <span className="text-emerald-400">{s.active} active</span>}
                      {s.replied > 0 && <span className="text-accent">{s.replied} replied</span>}
                      {s.completed > 0 && <span className="text-muted-foreground">{s.completed} done</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Combined totals row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-border/50 p-4">
                <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">Total Active</p>
                <p className="font-serif text-2xl text-foreground">{stats.subscribers}</p>
              </div>
              <div className="border border-border/50 p-4">
                <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">Campaigns</p>
                <p className="font-serif text-2xl text-foreground">{stats.campaigns}</p>
              </div>
              <div className="border border-border/50 p-4">
                <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">Total Emails Sent</p>
                <p className="font-serif text-2xl text-foreground">{stats.emailsSent}</p>
              </div>
            </div>

            {/* CSV Tools */}
            <div className="border border-border p-6">
              <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">CSV Tools</h3>
              <div className="flex flex-wrap gap-4">
                <label className="cursor-pointer bg-accent text-accent-foreground px-5 py-2.5 font-sans text-sm tracking-[0.15em] uppercase hover:bg-accent/80 transition-colors flex items-center gap-2">
                  <Upload size={14} />
                  Import to Database
                  <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
                </label>
                <label className="cursor-pointer border border-border text-foreground px-5 py-2.5 font-sans text-sm tracking-[0.15em] uppercase hover:border-accent hover:text-accent transition-colors flex items-center gap-2">
                  <Download size={14} />
                  Process & Download CSV
                  <input type="file" accept=".csv" className="hidden" onChange={handleProcessAndDownloadCSV} />
                </label>
              </div>
              <p className="font-sans text-xs text-muted-foreground mt-3">
                "Process & Download" transforms names to [Apartment Name] Team and downloads the updated file without importing.
              </p>
            </div>
          </div>
        )}

        {/* Contacts */}
        {activeTab === "contacts" && (
          <ContactsListTab storedPassword={storedPassword} initialFilter={contactsFilter as any} initialCampaign={contactsCampaign as any} />
        )}

        {/* Compose */}
        {activeTab === "compose" && (
          <div className="max-w-3xl">
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setCampaignType("broadcast")}
                className={`px-4 py-2 font-sans text-sm tracking-wider uppercase border transition-colors ${
                  campaignType === "broadcast" ? "border-accent text-accent" : "border-border text-muted-foreground"
                }`}
              >
                Broadcast
              </button>
              <button
                onClick={() => setCampaignType("drip")}
                className={`px-4 py-2 font-sans text-sm tracking-wider uppercase border transition-colors ${
                  campaignType === "drip" ? "border-accent text-accent" : "border-border text-muted-foreground"
                }`}
              >
                Drip Sequence
              </button>
            </div>

            {campaignType === "drip" && (
              <div className="mb-6">
                <label className="font-sans text-xs tracking-wider uppercase text-muted-foreground mb-2 block">Drip Email #</label>
                <select
                  value={dripStep}
                  onChange={e => setDripStep(Number(e.target.value))}
                  className="bg-forest-dark/50 border border-border text-foreground px-4 py-2 font-sans text-sm focus:outline-none focus:border-accent"
                >
                  <option value={1}>Email 1 — Welcome (Day 0)</option>
                  <option value={2}>Email 2 — Story & Desire (Day 7)</option>
                  <option value={3}>Email 3 — Urgency & CTA (Day 14)</option>
                </select>
              </div>
            )}

            <div className="mb-6">
              <label className="font-sans text-xs tracking-wider uppercase text-muted-foreground mb-2 block">
                Topic / Direction (optional)
              </label>
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g., 'Holiday party season is approaching, mention recent Netflix event, include behind-the-scenes card routine photo'"
                rows={3}
                className="w-full bg-forest-dark/50 border border-border text-foreground px-4 py-3 font-sans text-sm focus:outline-none focus:border-accent resize-none"
              />
            </div>

            <button
              onClick={handleDraft}
              disabled={drafting}
              className="bg-accent text-accent-foreground px-6 py-3 font-sans text-sm tracking-[0.2em] uppercase hover:bg-accent/80 transition-colors disabled:opacity-50 mb-8"
            >
              {drafting ? "Generating..." : "Generate AI Draft"}
            </button>

            {(draftSubject || draftHtml) && (
              <div className="mt-8 border border-border">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-sans text-sm tracking-wider uppercase text-foreground">Email Preview</h3>
                  <button onClick={() => setPreviewMode(!previewMode)} className="text-muted-foreground hover:text-foreground">
                    <Eye size={18} />
                  </button>
                </div>

                {!previewMode ? (
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="font-sans text-xs tracking-wider uppercase text-muted-foreground mb-1 block">Subject</label>
                      <input
                        value={draftSubject}
                        onChange={e => setDraftSubject(e.target.value)}
                        className="w-full bg-forest-dark/50 border border-border text-foreground px-4 py-2 font-sans text-sm focus:outline-none focus:border-accent"
                      />
                      <SubjectScorer subjectLine={draftSubject} storedPassword={storedPassword} onUseSuggestion={(s) => setDraftSubject(s)} />
                    </div>
                    <div>
                      <label className="font-sans text-xs tracking-wider uppercase text-muted-foreground mb-1 block">Preview Text</label>
                      <input
                        value={draftPreview}
                        onChange={e => setDraftPreview(e.target.value)}
                        className="w-full bg-forest-dark/50 border border-border text-foreground px-4 py-2 font-sans text-sm focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="font-sans text-xs tracking-wider uppercase text-muted-foreground mb-1 block">HTML Body</label>
                      <textarea
                        value={draftHtml}
                        onChange={e => setDraftHtml(e.target.value)}
                        rows={16}
                        className="w-full bg-forest-dark/50 border border-border text-foreground px-4 py-2 font-sans text-xs font-mono focus:outline-none focus:border-accent resize-y"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    <p className="text-xs text-muted-foreground mb-2">Subject: {draftSubject}</p>
                    <div className="border border-border bg-white rounded overflow-hidden">
                      <iframe
                        srcDoc={draftHtml}
                        title="Email preview"
                        className="w-full h-[600px] border-0"
                        sandbox=""
                      />
                    </div>
                  </div>
                )}

                <div className="p-4 border-t border-border flex gap-3">
                  <button
                    onClick={handleSaveDraft}
                    className="border border-border text-foreground px-5 py-2 font-sans text-sm tracking-[0.2em] uppercase hover:border-accent transition-colors"
                  >
                    Save Draft
                  </button>
                  {editedCampaignId && (
                    <button
                      onClick={() => handleApproveAndSend(editedCampaignId)}
                      disabled={sending}
                      className="bg-accent text-accent-foreground px-5 py-2 font-sans text-sm tracking-[0.2em] uppercase hover:bg-accent/80 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <Send size={14} />
                      {sending ? "Sending..." : `Send to ${stats.subscribers} Subscribers`}
                    </button>
                  )}
                  <button onClick={resetCompose} className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm">
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Campaigns */}
        {activeTab === "campaigns" && (
          <div className="space-y-4">
            {campaigns.map(c => (
              <div key={c.id} className="border border-border p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-sans text-sm text-foreground font-medium">{c.subject}</h3>
                  <div className="flex gap-3 mt-1">
                    <span className={`text-xs px-2 py-0.5 ${
                      c.status === "sent" ? "bg-green-900/30 text-green-400" :
                      c.status === "sending" ? "bg-yellow-900/30 text-yellow-400" :
                      "bg-blue-900/30 text-blue-400"
                    }`}>{c.status}</span>
                    <span className="text-xs text-muted-foreground">{c.campaign_type}</span>
                    {c.sent_count > 0 && <span className="text-xs text-muted-foreground">Sent to {c.sent_count}</span>}
                    <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {c.status === "draft" && (
                    <button
                      onClick={() => {
                        setDraftSubject(c.subject);
                        setDraftHtml(c.body_html);
                        setDraftPreview(c.body_preview || "");
                        setEditedCampaignId(c.id);
                        setCampaignType(c.campaign_type as "broadcast" | "drip");
                        setDripStep(c.drip_step || 1);
                        setActiveTab("compose");
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <FileText size={16} />
                    </button>
                  )}
                  {c.status === "draft" && (
                    <button onClick={() => handleDeleteCampaign(c.id)} className="text-muted-foreground hover:text-red-400">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {!campaigns.length && (
              <p className="text-center text-muted-foreground py-8">No campaigns yet. Go to Compose to create one.</p>
            )}
          </div>
        )}

        {/* Campaign Calendar */}
        {activeTab === "calendar" && (
          <CampaignCalendarTab campaigns={campaigns} sendLog={[]} />
        )}

        {/* Analytics */}
        {activeTab === "analytics" && (
          <AnalyticsTab storedPassword={storedPassword} />
        )}

        {/* Email Analytics */}
        {activeTab === "email_analytics" && (
          <EmailAnalyticsTab storedPassword={storedPassword} />
        )}

        {/* Lead Attribution */}
        {activeTab === "lead_attribution" && (
          <LeadAttributionTab storedPassword={storedPassword} />
        )}

        {activeTab === "inbox" && (
          <DealInboxTab storedPassword={storedPassword} />
        )}

        {activeTab === "planner" && (
          <PlannerDripTab storedPassword={storedPassword} onNavigateToContacts={(filter) => { setContactsFilter(filter); setActiveTab("contacts"); }} />
        )}

        {/* Apartment / Resident Drip Campaign */}
        {activeTab === "apartment" && (
          <ResidentDripTab storedPassword={storedPassword} onNavigateToContacts={(filter) => { setContactsFilter(filter); setActiveTab("contacts"); }} />
        )}
        {activeTab === "castle" && (
          <CastleInvitesTab />
        )}

        {activeTab === "cold" && (
          <div>
            {/* Category sub-selector */}
            <div className="flex flex-wrap gap-2 mb-6">
              {([
                { category: "corporate_planner", label: "🏢 Corporate" },
                { category: "wedding_planner", label: "💍 Wedding" },
                { category: "country_club", label: "⛳ Clubs" },
                { category: "pr_agency", label: "📱 PR" },
                { category: "nonprofit", label: "❤️ Nonprofit" },
                { category: "talent", label: "🎬 Talent" },
                { category: "nightlife", label: "🌙 Nightlife" },
                { category: "spirits", label: "🍸 Spirits" },
                { category: "restaurant", label: "🍽️ Restaurant" },
                { category: "charity_golf", label: "🏌️ Charity Golf" },
              ]).map(cat => (
                <button
                  key={cat.category}
                  onClick={() => setColdCategory(cat.category)}
                  className={`px-4 py-2 font-sans text-xs tracking-[0.15em] uppercase border transition-colors ${
                    coldCategory === cat.category ? "border-accent text-accent bg-accent/10" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <ColdDripCampaignTab category={coldCategory} storedPassword={storedPassword} />
          </div>
        )}
        {/* Thank You Email */}
        {activeTab === "thankyou" && (
          <div className="max-w-xl">
            <h2 className="font-serif text-2xl text-foreground mb-2">Post-Show Thank You</h2>
            <p className="font-sans text-sm text-muted-foreground mb-8">
              Send a branded thank-you email to a client after their event. Includes a link to leave a review.
            </p>

            {tySent ? (
              <div className="border border-accent/30 p-8 text-center">
                <Heart size={24} className="text-accent mx-auto mb-4" />
                <p className="font-serif text-xl text-foreground mb-2">Email Sent!</p>
                <p className="font-sans text-sm text-muted-foreground mb-6">
                  Thank-you email delivered to {tyClientEmail}.
                </p>
                <button
                  onClick={() => { setTySent(false); setTyClientName(""); setTyClientEmail(""); setTyEventType(""); }}
                  className="font-sans text-sm tracking-[0.2em] uppercase text-accent hover:text-foreground transition-colors"
                >
                  Send Another
                </button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!tyClientName || !tyClientEmail) {
                    toast.error("Name and email required");
                    return;
                  }
                  setTySending(true);
                  try {
                    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-thank-you`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${SUPABASE_KEY}`,
                      },
                      body: JSON.stringify({
                        clientName: tyClientName,
                        clientEmail: tyClientEmail,
                        eventType: tyEventType || undefined,
                        adminPassword: storedPassword,
                      }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setTySent(true);
                      toast.success("Thank-you email sent!");
                    } else {
                      throw new Error(data.error || "Send failed");
                    }
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Failed to send");
                  } finally {
                    setTySending(false);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="font-sans text-xs tracking-wider uppercase text-muted-foreground mb-1 block">Client Name *</label>
                  <input
                    value={tyClientName}
                    onChange={e => setTyClientName(e.target.value)}
                    placeholder="e.g., Jamie Irving"
                    maxLength={100}
                    required
                    className="w-full bg-transparent border border-border text-foreground px-4 py-3 font-sans text-sm focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="font-sans text-xs tracking-wider uppercase text-muted-foreground mb-1 block">Client Email *</label>
                  <input
                    value={tyClientEmail}
                    onChange={e => setTyClientEmail(e.target.value)}
                    type="email"
                    placeholder="client@company.com"
                    maxLength={255}
                    required
                    className="w-full bg-transparent border border-border text-foreground px-4 py-3 font-sans text-sm focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="font-sans text-xs tracking-wider uppercase text-muted-foreground mb-1 block">Event Name / Type (optional)</label>
                  <input
                    value={tyEventType}
                    onChange={e => setTyEventType(e.target.value)}
                    placeholder="e.g., your holiday gala, the Morgan Stanley dinner"
                    maxLength={200}
                    className="w-full bg-transparent border border-border text-foreground px-4 py-3 font-sans text-sm focus:outline-none focus:border-accent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={tySending}
                  className="w-full bg-accent text-accent-foreground py-3 font-sans text-sm tracking-[0.2em] uppercase hover:bg-accent/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send size={14} />
                  {tySending ? "Sending..." : "Send Thank You Email"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <>
          {/* FAB - Quick Add Lead */}
          <button
            onClick={() => setShowQuickAdd(true)}
            className="fixed bottom-[76px] right-4 z-40 w-14 h-14 rounded-full bg-accent text-accent-foreground shadow-lg flex items-center justify-center hover:bg-accent/80 transition-colors active:scale-95"
            aria-label="Quick add lead"
          >
            <Plus size={24} />
          </button>

          {/* Bottom Nav Bar */}
          <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border h-[60px] flex items-center justify-around px-1 safe-area-pb">
            {MOBILE_NAV_TABS.map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex flex-col items-center justify-center gap-0.5 min-h-[44px] min-w-[44px] px-2 transition-colors ${
                    isActive ? "text-accent" : "text-muted-foreground"
                  }`}
                >
                  <tab.icon size={20} />
                  <span className="text-[9px] font-sans tracking-wider uppercase">{tab.label}</span>
                  {tab.badge && tab.badge > 0 && (
                    <span className="absolute -top-0.5 right-0 bg-destructive text-destructive-foreground text-[8px] font-sans min-w-[14px] h-3.5 flex items-center justify-center rounded-full px-0.5">{tab.badge}</span>
                  )}
                </button>
              );
            })}
            <button
              onClick={() => setShowMoreTabs(true)}
              className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] min-w-[44px] px-2 transition-colors text-muted-foreground`}
            >
              <MoreHorizontal size={20} />
              <span className="text-[9px] font-sans tracking-wider uppercase">More</span>
            </button>
          </nav>
        </>
      )}
    </div>
  );
};

export default AdminNewsletter;
