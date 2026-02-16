import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Upload, Send, FileText, Users, Mail, RefreshCw, Trash2, Eye } from "lucide-react";
import PlannerDripTab from "@/components/PlannerDripTab";

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

interface Stats {
  subscribers: number;
  campaigns: number;
  emailsSent: number;
}

const AdminNewsletter = () => {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [storedPassword, setStoredPassword] = useState("");

  const [activeTab, setActiveTab] = useState<"dashboard" | "contacts" | "compose" | "campaigns" | "planner">("dashboard");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<Stats>({ subscribers: 0, campaigns: 0, emailsSent: 0 });
  const [loading, setLoading] = useState(false);

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
      const [statsRes, contactsRes, campaignsRes] = await Promise.all([
        callAdmin("get_stats"),
        callAdmin("get_contacts"),
        callAdmin("get_campaigns"),
      ]);
      setStats(statsRes);
      setContacts(contactsRes.contacts || []);
      setCampaigns(campaignsRes.campaigns || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [storedPassword, callAdmin]);

  useEffect(() => {
    if (authenticated) loadData();
  }, [authenticated, loadData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/newsletter-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ action: "get_stats", adminPassword: password }),
      });
      if (res.ok) {
        setStoredPassword(password);
        setAuthenticated(true);
        toast.success("Welcome back");
      } else {
        toast.error("Invalid password");
      }
    } catch {
      toast.error("Connection failed");
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split("\n").filter(l => l.trim());
    const header = lines[0].toLowerCase();
    const emailIdx = header.split(",").findIndex(h => h.trim().includes("email"));
    const nameIdx = header.split(",").findIndex(h => h.trim().includes("name"));

    if (emailIdx === -1) {
      toast.error("CSV must have an 'email' column");
      return;
    }

    const parsed = lines.slice(1).map(line => {
      const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
      return {
        email: cols[emailIdx],
        name: nameIdx >= 0 ? cols[nameIdx] : undefined,
        source: "csv",
      };
    }).filter(c => c.email && c.email.includes("@"));

    if (!parsed.length) {
      toast.error("No valid emails found in CSV");
      return;
    }

    try {
      const res = await callAdmin("import_contacts", { contacts: parsed });
      toast.success(`Imported ${res.imported} contacts`);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    }
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
      <div className="min-h-screen bg-forest-dark flex items-center justify-center px-6">
        <form onSubmit={handleLogin} className="w-full max-w-sm">
          <h1 className="font-serif text-3xl text-cream mb-8 text-center">Newsletter Admin</h1>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter admin password"
            className="w-full bg-forest-dark/50 border border-cream/20 text-cream px-4 py-3 mb-4 font-sans text-sm focus:outline-none focus:border-accent"
          />
          <button type="submit" className="w-full bg-accent text-accent-foreground py-3 font-sans text-sm tracking-[0.2em] uppercase hover:bg-accent/80 transition-colors">
            Enter
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-3xl text-foreground">Newsletter Admin</h1>
          <button onClick={loadData} disabled={loading} className="text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-border">
          {(["dashboard", "contacts", "compose", "campaigns", "planner"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-sans text-sm tracking-wider uppercase transition-colors ${
                activeTab === tab ? "text-accent border-b-2 border-accent" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-border p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users size={20} className="text-accent" />
                <p className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground">Subscribers</p>
              </div>
              <p className="font-serif text-4xl text-foreground">{stats.subscribers}</p>
            </div>
            <div className="border border-border p-6">
              <div className="flex items-center gap-3 mb-2">
                <FileText size={20} className="text-accent" />
                <p className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground">Campaigns</p>
              </div>
              <p className="font-serif text-4xl text-foreground">{stats.campaigns}</p>
            </div>
            <div className="border border-border p-6">
              <div className="flex items-center gap-3 mb-2">
                <Mail size={20} className="text-accent" />
                <p className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground">Emails Sent</p>
              </div>
              <p className="font-serif text-4xl text-foreground">{stats.emailsSent}</p>
            </div>
          </div>
        )}

        {/* Contacts */}
        {activeTab === "contacts" && (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <label className="inline-flex items-center gap-2 cursor-pointer bg-accent text-accent-foreground px-5 py-2 font-sans text-sm tracking-[0.2em] uppercase hover:bg-accent/80 transition-colors">
                <Upload size={16} />
                Import CSV
                <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
              </label>
              <p className="text-sm text-muted-foreground">{contacts.length} contacts total</p>
            </div>
            <div className="border border-border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-sans text-xs tracking-wider uppercase text-muted-foreground">Email</th>
                    <th className="text-left p-3 font-sans text-xs tracking-wider uppercase text-muted-foreground">Name</th>
                    <th className="text-left p-3 font-sans text-xs tracking-wider uppercase text-muted-foreground">Source</th>
                    <th className="text-left p-3 font-sans text-xs tracking-wider uppercase text-muted-foreground">Status</th>
                    <th className="text-left p-3 font-sans text-xs tracking-wider uppercase text-muted-foreground">Last Emailed</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map(c => (
                    <tr key={c.id} className="border-b border-border/50">
                      <td className="p-3 text-foreground">{c.email}</td>
                      <td className="p-3 text-muted-foreground">{c.name || "—"}</td>
                      <td className="p-3 text-muted-foreground">{c.source}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-1 ${c.subscribed ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>
                          {c.subscribed ? "Active" : "Unsubscribed"}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">
                        {c.last_emailed_at ? new Date(c.last_emailed_at).toLocaleDateString() : "Never"}
                      </td>
                    </tr>
                  ))}
                  {!contacts.length && (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No contacts yet. Upload a CSV to get started.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
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

        {/* Planner Drip Campaign */}
        {activeTab === "planner" && (
          <PlannerDripTab storedPassword={storedPassword} />
        )}
      </div>
    </div>
  );
};

export default AdminNewsletter;
