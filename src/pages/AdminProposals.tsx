import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Copy, Send, Eye, ChevronDown, ChevronUp, X, Sparkles, Loader2, ArrowLeft, ArrowUp, ArrowDown } from "lucide-react";
import { ProposalView, DEFAULT_PROPOSAL, HERO_OPTIONS, type ProposalData, type Tier, type TimelineItem, type FaqItem } from "./ProposalTemplate";
import { BRAND_PHOTOS, DEFAULT_GALLERY_KEYS, PROPOSAL_TEMPLATES } from "@/data/proposalAssets";
import { DrivePhotoBank } from "@/components/DrivePhotoBank";
import { BiometricUnlockButton, BiometricEnrollPrompt } from "@/components/BiometricUnlockButton";
import ResidencyAdmin from "@/components/admin/ResidencyAdmin";
import SignedAgreementsTab from "@/components/admin/SignedAgreementsTab";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const FN = `${SUPABASE_URL}/functions/v1/proposals-api`;

interface ProposalRow {
  id: string;
  slug: string;
  first_name: string;
  last_name: string;
  recipient_email: string | null;
  event_type: string;
  event_date: string;
  venue: string | null;
  sent_at: string | null;
  created_at: string;
  view_count?: number;
  last_viewed_at?: string | null;
}

interface FullProposal extends ProposalData {
  id: string;
  slug: string;
  sent_at?: string | null;
  deal_id?: string | null;
}

const EVENT_TYPES = ["Wedding", "Corporate Event", "Private Event", "Fundraiser", "Birthday", "Holiday Party"];

const formatRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
};

const AdminProposals = () => {
  const [password, setPassword] = useState(() => localStorage.getItem("wr_admin_session_pw") || "");
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState("");

  const [list, setList] = useState<ProposalRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<FullProposal | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<"client" | "residency" | "signed">("client");

  // Try saved session
  useEffect(() => {
    const saved = localStorage.getItem("wr_admin_session") || sessionStorage.getItem("wr_admin_session");
    if (saved) {
      try {
        const { pw, ts } = JSON.parse(saved);
        if (Date.now() - ts < 24 * 60 * 60 * 1000) {
          setPassword(pw);
          setAuthed(true);
        }
      } catch {}
    }
  }, []);

  useEffect(() => { if (authed) loadList(); }, [authed]);

  const apiCall = async (action: string, method: "GET" | "POST" = "GET", body?: any) => {
    const res = await fetch(`${FN}?action=${action}`, {
      method,
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: body ? JSON.stringify(body) : undefined,
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "Request failed");
    return j;
  };

  const tryLogin = async (pw?: string) => {
    const candidate = pw ?? pwInput;
    try {
      const res = await fetch(`${FN}?action=list`, { headers: { "x-admin-password": candidate } });
      if (!res.ok) throw new Error("Wrong password");
      setPassword(candidate);
      setAuthed(true);
      const session = JSON.stringify({ pw: candidate, ts: Date.now() });
      localStorage.setItem("wr_admin_session", session);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const loadList = async () => {
    setLoading(true);
    try {
      const j = await apiCall("list");
      setList(j.proposals || []);
    } catch (e) { toast.error((e as Error).message); }
    setLoading(false);
  };

  const startNew = () => {
    setEditing({ ...DEFAULT_PROPOSAL, id: "", slug: "" } as FullProposal);
  };

  const startEdit = async (slug: string) => {
    try {
      const res = await fetch(`${FN}?action=get&slug=${slug}`);
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setEditing(j.proposal);
    } catch (e) { toast.error((e as Error).message); }
  };

  const save = async () => {
    if (!editing) return;
    try {
      const payload: any = { ...editing };
      // Strip server-managed fields and any empty id/slug to avoid invalid uuid syntax
      delete payload.created_at;
      delete payload.updated_at;
      const action = editing.id ? "update" : "create";
      if (!editing.id) {
        delete payload.id;
        if (!payload.slug) delete payload.slug;
      }
      const j = await apiCall(action, "POST", payload);
      toast.success(editing.id ? "Saved" : "Created");
      setEditing(j.proposal);
      loadList();
    } catch (e) { toast.error((e as Error).message); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this proposal?")) return;
    try {
      await apiCall("delete", "POST", { id });
      toast.success("Deleted");
      loadList();
    } catch (e) { toast.error((e as Error).message); }
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/proposal/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };

  const sendEmail = async (proposal: FullProposal | ProposalRow) => {
    const to = prompt("Recipient email:", proposal.recipient_email || "");
    if (!to) return;
    const subject = prompt("Subject:", `Your White Rabbit LA Proposal — ${proposal.first_name}`);
    if (!subject) return;
    const message = prompt("Personal message (greeting and signature are added automatically):", `Here's the proposal we discussed. Take your time with it — call me anytime.\n\nBest,\n-Scott`);
    if (message === null) return;
    const link = `${window.location.origin}/proposal/${proposal.slug}`;
    try {
      await apiCall("send", "POST", { id: proposal.id, to, subject, message, link, firstName: proposal.first_name });
      toast.success("Email sent");
      loadList();
    } catch (e) { toast.error((e as Error).message); }
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-forest-dark flex items-center justify-center p-6">
        <div className="bg-cream p-8 max-w-sm w-full">
          <h1 className="font-serif text-2xl text-forest-dark mb-6">Proposals Admin</h1>
          <BiometricUnlockButton
            namespace="proposals"
            variant="light"
            onUnlock={(pw) => tryLogin(pw)}
          />
          <input
            type="password"
            value={pwInput}
            onChange={(e) => setPwInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && tryLogin()}
            placeholder="Admin password"
            className="w-full border border-forest-dark/20 px-4 py-3 mb-4 bg-white"
          />
          <button onClick={() => tryLogin()} className="w-full bg-forest-dark text-cream py-3 hover:opacity-90">
            Sign in
          </button>
        </div>
      </div>
    );
  }

  if (showPreview && editing) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="sticky top-0 z-50 bg-forest-dark text-cream px-6 py-3 flex items-center justify-between">
          <span className="text-sm tracking-wider uppercase">Preview Mode</span>
          <button onClick={() => setShowPreview(false)} className="flex items-center gap-2 text-sm hover:text-gold">
            <X className="w-4 h-4" /> Close Preview
          </button>
        </div>
        <ProposalView data={editing} />
      </div>
    );
  }

  if (editing) {
    return <ProposalEditor proposal={editing} onChange={setEditing} onSave={save} onCancel={() => setEditing(null)} onPreview={() => setShowPreview(true)} list={list} password={password} loadFullProposal={async (slug) => { const res = await fetch(`${FN}?action=get&slug=${slug}`); const j = await res.json(); if (!res.ok) throw new Error(j.error); return j.proposal; }} />;
  }

  return (
    <div className="min-h-screen bg-cream p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <BiometricEnrollPrompt namespace="proposals" password={password} variant="light" />
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <a
              href="/admin/newsletter"
              className="inline-flex items-center justify-center w-10 h-10 border border-forest-dark/20 text-forest-dark hover:bg-white transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </a>
            <div>
              <h1 className="font-serif text-3xl md:text-4xl text-forest-dark">Proposals</h1>
              <p className="text-sm text-forest-dark/60 mt-1">Build, preview, and send personalized proposals.</p>
            </div>
          </div>
          {activeTab === "client" && (
            <button
              onClick={startNew}
              className="hidden md:inline-flex bg-forest-dark text-cream px-5 py-3 items-center gap-2 hover:opacity-90"
            >
              <Plus className="w-4 h-4" /> New Proposal
            </button>
          )}
        </div>

        {/* Tab toggle */}
        <div className="flex border-b border-forest-dark/20 mb-6">
          <button
            onClick={() => setActiveTab("client")}
            className={`px-5 py-3 text-sm tracking-wider uppercase transition-colors ${
              activeTab === "client"
                ? "border-b-2 border-forest-dark text-forest-dark font-medium"
                : "text-forest-dark/50 hover:text-forest-dark"
            }`}
          >
            Client Proposals
          </button>
          <button
            onClick={() => setActiveTab("residency")}
            className={`px-5 py-3 text-sm tracking-wider uppercase transition-colors ${
              activeTab === "residency"
                ? "border-b-2 border-forest-dark text-forest-dark font-medium"
                : "text-forest-dark/50 hover:text-forest-dark"
            }`}
          >
            Residency Pitches
          </button>
          <button
            onClick={() => setActiveTab("signed")}
            className={`px-5 py-3 text-sm tracking-wider uppercase transition-colors ${
              activeTab === "signed"
                ? "border-b-2 border-forest-dark text-forest-dark font-medium"
                : "text-forest-dark/50 hover:text-forest-dark"
            }`}
          >
            Signed Agreements
          </button>
        </div>

        {activeTab === "residency" ? (
          <ResidencyAdmin password={password} />
        ) : activeTab === "signed" ? (
          <SignedAgreementsTab password={password} />
        ) : (
          <>
        {/* Mobile-prominent New Proposal CTA */}
        <button
          onClick={startNew}
          className="md:hidden w-full bg-forest-dark text-cream px-5 py-4 flex items-center justify-center gap-2 hover:opacity-90 shadow-md mb-6 text-base font-medium tracking-wide"
        >
          <Plus className="w-5 h-5" /> New Proposal
        </button>


        {loading ? (
          <div className="text-forest-dark/60">Loading…</div>
        ) : list.length === 0 ? (
          <div className="bg-white border border-forest-dark/10 p-10 text-center text-forest-dark/60">
            No proposals yet. Click "New Proposal" to start.
          </div>
        ) : (
          <div className="bg-white border border-forest-dark/10 divide-y divide-forest-dark/10">
            {list.map((p) => (
              <div key={p.id} className="p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex-1 min-w-[240px]">
                  <div className="font-serif text-lg text-forest-dark">{p.first_name} {p.last_name}</div>
                  <div className="text-sm text-forest-dark/60">
                    {p.event_type} {p.event_date && `· ${p.event_date}`} {p.venue && `· ${p.venue}`}
                  </div>
                  <div className="text-xs text-forest-dark/40 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    <span>/proposal/{p.slug}</span>
                    {p.sent_at && <span className="text-emerald-700">· Sent {new Date(p.sent_at).toLocaleDateString()}</span>}
                    {p.view_count ? (
                      <span className="text-gold font-medium">
                        · 👁 Viewed {p.view_count}× {p.last_viewed_at && `· last ${formatRelative(p.last_viewed_at)}`}
                      </span>
                    ) : p.sent_at ? (
                      <span className="text-forest-dark/40">· Not yet opened</span>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => copyLink(p.slug)} title="Copy link" className="p-2 hover:bg-cream rounded"><Copy className="w-4 h-4 text-forest-dark" /></button>
                  <a href={`/proposal/${p.slug}`} target="_blank" rel="noopener noreferrer" title="View" className="p-2 hover:bg-cream rounded"><Eye className="w-4 h-4 text-forest-dark" /></a>
                  <button onClick={() => sendEmail(p)} title="Email" className="p-2 hover:bg-cream rounded"><Send className="w-4 h-4 text-forest-dark" /></button>
                  <button onClick={() => startEdit(p.slug)} className="px-3 py-2 text-sm border border-forest-dark/20 hover:bg-cream">Edit</button>
                  <button onClick={() => remove(p.id)} title="Delete" className="p-2 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-600" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};

/* ===================== EDITOR ===================== */
const ProposalEditor = ({
  proposal, onChange, onSave, onCancel, onPreview, list, password, loadFullProposal,
}: {
  proposal: FullProposal;
  onChange: (p: FullProposal) => void;
  onSave: () => void;
  onCancel: () => void;
  onPreview: () => void;
  list: ProposalRow[];
  password: string;
  loadFullProposal: (slug: string) => Promise<FullProposal>;
}) => {
  const update = (patch: Partial<FullProposal>) => onChange({ ...proposal, ...patch });
  const isNew = !proposal.id;
  const [inquiryText, setInquiryText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [duplicateSlug, setDuplicateSlug] = useState("");
  const [contactQuery, setContactQuery] = useState("");
  const [contactResults, setContactResults] = useState<any[]>([]);
  const [contactLoading, setContactLoading] = useState(false);

  useEffect(() => {
    const q = contactQuery.trim();
    if (q.length < 2) { setContactResults([]); return; }
    setContactLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${FN}?action=search_contacts&q=${encodeURIComponent(q)}`, {
          headers: { "x-admin-password": password },
        });
        const j = await res.json();
        setContactResults(j.results || []);
      } catch { setContactResults([]); }
      setContactLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [contactQuery, password]);

  const applyContact = (c: any) => {
    const fullName = (c.name || "").trim();
    const [firstName, ...rest] = fullName.split(" ");
    const eventTypeMap: Record<string, string> = {
      corporate: "Corporate Event", wedding: "Wedding", private_party: "Private Event",
      parlor_show: "Private Event", other: "Private Event",
    };
    const mappedEventType = eventTypeMap[c.event_type] || c.event_type || proposal.event_type;
    update({
      first_name: firstName || proposal.first_name,
      last_name: rest.join(" ") || proposal.last_name,
      recipient_email: c.email || proposal.recipient_email,
      event_type: mappedEventType,
      event_date: c.event_date || proposal.event_date,
      venue: c.venue || proposal.venue,
      ...(c.deal_id ? { deal_id: c.deal_id } as any : {}),
    });
    setContactQuery("");
    setContactResults([]);
    toast.success(`Loaded ${c.name || c.email}${c.source === "deal" ? " — linked to deal" : ""}`);
  };


  const applyTemplate = (eventType: string) => {
    const tpl = PROPOSAL_TEMPLATES[eventType];
    if (!tpl) return;
    update({
      event_type: eventType,
      letter_intro: tpl.letter_intro,
      intro_paragraph: tpl.intro_paragraph,
      hero_image: tpl.hero_image,
      timeline: tpl.timeline,
      tiers: tpl.tiers,
      faqs: tpl.faqs,
      closing_quote: tpl.closing_quote || "",
      closing_attribution: tpl.closing_attribution || "",
    });
    toast.success(`${eventType} template applied`);
  };

  const duplicateFrom = async () => {
    if (!duplicateSlug) return;
    try {
      const src = await loadFullProposal(duplicateSlug);
      // Clone everything except identity fields
      const { id, slug, sent_at, created_at, ...rest } = src as any;
      onChange({ ...proposal, ...rest });
      toast.success("Cloned — update name, date, and venue");
    } catch (e) { toast.error((e as Error).message); }
  };

  const aiDraft = async () => {
    if (!inquiryText.trim()) { toast.error("Paste the inquiry text first"); return; }
    setAiLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proposal-ai-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify({ inquiry_text: inquiryText }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "AI draft failed");
      const d = j.draft;
      // Apply event-type template first (if recognized) then overlay AI-extracted fields
      const tpl = PROPOSAL_TEMPLATES[d.event_type];
      // If AI extracted tier prices from the inquiry, overlay them onto template tiers
      const tp = d.tier_prices || {};
      const priceOverrides = [tp.tier_1, tp.tier_2, tp.tier_3];
      const tiersWithPricing = tpl?.tiers
        ? tpl.tiers.map((t, idx) =>
            priceOverrides[idx] ? { ...t, price: priceOverrides[idx] } : t
          )
        : proposal.tiers;
      onChange({
        ...proposal,
        first_name: d.first_name || proposal.first_name,
        last_name: d.last_name || proposal.last_name,
        recipient_email: d.recipient_email || proposal.recipient_email,
        event_type: d.event_type || proposal.event_type,
        event_date: d.event_date || proposal.event_date,
        venue: d.venue || proposal.venue,
        letter_intro: d.letter_intro || proposal.letter_intro,
        intro_paragraph: d.intro_paragraph || proposal.intro_paragraph,
        hero_image: tpl?.hero_image || proposal.hero_image,
        timeline: tpl?.timeline || proposal.timeline,
        tiers: tiersWithPricing,
        faqs: tpl?.faqs || proposal.faqs,
        closing_quote: tpl?.closing_quote ?? proposal.closing_quote,
      });

      toast.success("Draft ready — review and tweak");
      setInquiryText("");
    } catch (e) { toast.error((e as Error).message); }
    setAiLoading(false);
  };

  const [photoSource, setPhotoSource] = useState<"brand" | "drive">("brand");

  const galleryKeys: string[] = (proposal.gallery_photos && proposal.gallery_photos.length > 0)
    ? proposal.gallery_photos
    : DEFAULT_GALLERY_KEYS;

  const togglePhoto = (key: string) => {
    const current = [...galleryKeys];
    const idx = current.indexOf(key);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(key);
    }
    update({ gallery_photos: current });
  };
  const resetGallery = () => update({ gallery_photos: [] });

  const updateTier = (i: number, patch: Partial<Tier>) => {
    const tiers = [...proposal.tiers];
    tiers[i] = { ...tiers[i], ...patch };
    update({ tiers });
  };
  const removeTier = (i: number) => update({ tiers: proposal.tiers.filter((_, j) => j !== i) });
  const addTier = () => update({ tiers: [...proposal.tiers, { name: "New Tier", tagline: "", items: [], price: "$0", href: "", cta: "Reserve" }] });

  const updateTimeline = (i: number, patch: Partial<TimelineItem>) => {
    const t = [...proposal.timeline]; t[i] = { ...t[i], ...patch }; update({ timeline: t });
  };
  const addTimeline = () => update({ timeline: [...proposal.timeline, { time: "", desc: "" }] });
  const removeTimeline = (i: number) => update({ timeline: proposal.timeline.filter((_, j) => j !== i) });
  const moveTimeline = (i: number, dir: -1 | 1) => {
    const t = [...proposal.timeline];
    const j = i + dir;
    if (j < 0 || j >= t.length) return;
    [t[i], t[j]] = [t[j], t[i]];
    update({ timeline: t });
  };


  const updateFaq = (i: number, patch: Partial<FaqItem>) => {
    const f = [...proposal.faqs]; f[i] = { ...f[i], ...patch }; update({ faqs: f });
  };
  const addFaq = () => update({ faqs: [...proposal.faqs, { q: "", a: "" }] });
  const removeFaq = (i: number) => update({ faqs: proposal.faqs.filter((_, j) => j !== i) });

  const inputCls = "w-full border border-forest-dark/20 px-3 py-2 bg-white text-sm";
  const labelCls = "block text-xs uppercase tracking-wider text-forest-dark/60 mb-1";
  const sectionCls = "bg-white border border-forest-dark/10 p-6 mb-6";

  return (
    <div className="min-h-screen bg-cream p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <button onClick={onCancel} className="text-sm text-forest-dark/70 hover:text-forest-dark">← Back to list</button>
          <div className="flex gap-2">
            <button onClick={onPreview} className="px-4 py-2 border border-forest-dark/20 text-sm hover:bg-white flex items-center gap-2"><Eye className="w-4 h-4" /> Preview</button>
            <button onClick={onSave} className="px-5 py-2 bg-forest-dark text-cream text-sm hover:opacity-90">Save</button>
          </div>
        </div>

        <h1 className="font-serif text-3xl text-forest-dark mb-6">
          {proposal.id ? "Edit Proposal" : "New Proposal"}
          {proposal.slug && <span className="ml-3 text-sm text-forest-dark/50 font-sans">/proposal/{proposal.slug}</span>}
        </h1>

        {/* QUICK START — only on new proposals */}
        {isNew && (
          <div className="bg-forest-dark/5 border border-forest-dark/15 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-gold" />
              <h2 className="font-serif text-xl text-forest-dark">Quick Start</h2>
              <span className="text-xs text-forest-dark/50">— pick one to skip the blank page</span>
            </div>

            {/* AI auto-draft */}
            <div className="mb-5">
              <label className={labelCls}>Auto-draft from inquiry text</label>
              <textarea
                className={inputCls + " min-h-[100px]"}
                placeholder="Paste their inquiry email or your call notes here. AI will pull out name, date, venue, event type, and write a personalized opening in your voice."
                value={inquiryText}
                onChange={(e) => setInquiryText(e.target.value)}
              />
              <button
                onClick={aiDraft}
                disabled={aiLoading || !inquiryText.trim()}
                className="mt-2 px-4 py-2 bg-forest-dark text-cream text-sm hover:opacity-90 disabled:opacity-40 flex items-center gap-2"
              >
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {aiLoading ? "Drafting…" : "Auto-draft proposal"}
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-forest-dark/10">
              {/* Event-type templates */}
              <div>
                <label className={labelCls}>Start from event-type template</label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(PROPOSAL_TEMPLATES).map((t) => (
                    <button key={t} onClick={() => applyTemplate(t)} className="px-3 py-1.5 text-xs border border-forest-dark/25 hover:bg-forest-dark hover:text-cream transition-colors">
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duplicate from previous */}
              <div>
                <label className={labelCls}>Or duplicate from a previous proposal</label>
                <div className="flex gap-2">
                  <select className={inputCls} value={duplicateSlug} onChange={(e) => setDuplicateSlug(e.target.value)}>
                    <option value="">— pick a proposal —</option>
                    {list.map((p) => (
                      <option key={p.id} value={p.slug}>
                        {p.first_name} {p.last_name} · {p.event_type}
                      </option>
                    ))}
                  </select>
                  <button onClick={duplicateFrom} disabled={!duplicateSlug} className="px-4 py-2 bg-forest-dark text-cream text-sm whitespace-nowrap hover:opacity-90 disabled:opacity-40">
                    Clone
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recipient */}
        <div className={sectionCls}>
          <h2 className="font-serif text-xl text-forest-dark mb-4">Recipient & Event</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className={labelCls}>First name</label><input className={inputCls} value={proposal.first_name} onChange={(e) => update({ first_name: e.target.value })} /></div>
            <div><label className={labelCls}>Last name</label><input className={inputCls} value={proposal.last_name} onChange={(e) => update({ last_name: e.target.value })} /></div>
            <div><label className={labelCls}>Recipient email</label><input className={inputCls} value={proposal.recipient_email || ""} onChange={(e) => update({ recipient_email: e.target.value })} /></div>
            <div>
              <label className={labelCls}>Event type</label>
              <select className={inputCls} value={proposal.event_type} onChange={(e) => update({ event_type: e.target.value })}>
                {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Event date (display)</label><input className={inputCls} placeholder="June 14, 2026" value={proposal.event_date} onChange={(e) => update({ event_date: e.target.value })} /></div>
            <div><label className={labelCls}>Venue</label><input className={inputCls} value={proposal.venue || ""} onChange={(e) => update({ venue: e.target.value })} /></div>
            <div className="md:col-span-2">
              <label className={labelCls}>Hero photo</label>
              <select className={inputCls} value={proposal.hero_image} onChange={(e) => update({ hero_image: e.target.value })}>
                {HERO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* GALLERY PHOTOS picker */}
        <div className={sectionCls}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-serif text-xl text-forest-dark">Gallery Photos</h2>
            <button onClick={resetGallery} className="text-xs text-forest-dark/60 hover:text-forest-dark underline">Reset to defaults</button>
          </div>
          <p className="text-xs text-forest-dark/60 mb-4">
            {proposal.gallery_photos && proposal.gallery_photos.length > 0
              ? `Custom selection — ${proposal.gallery_photos.length} photo${proposal.gallery_photos.length === 1 ? "" : "s"} chosen.`
              : "Using the default gallery. Click any photo to start a custom selection for this proposal."}
          </p>

          {/* Source tabs */}
          <div className="flex gap-1 mb-3 border-b border-forest-dark/10">
            {(["brand", "drive"] as const).map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => setPhotoSource(src)}
                className={`text-xs uppercase tracking-wider px-3 py-2 -mb-px border-b-2 transition-colors ${
                  photoSource === src
                    ? "border-forest-dark text-forest-dark"
                    : "border-transparent text-forest-dark/50 hover:text-forest-dark"
                }`}
              >
                {src === "brand" ? "Brand Library" : "Google Drive"}
              </button>
            ))}
          </div>

          {photoSource === "brand" ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-[420px] overflow-y-auto pr-1">
              {BRAND_PHOTOS.map((p) => {
                const selected = galleryKeys.includes(p.key);
                const order = selected ? galleryKeys.indexOf(p.key) + 1 : null;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => togglePhoto(p.key)}
                    title={p.label}
                    className={`relative aspect-square overflow-hidden border-2 transition-all ${selected ? "border-gold ring-2 ring-gold/30" : "border-transparent hover:border-forest-dark/40"}`}
                  >
                    <img src={p.src} alt={p.label} loading="lazy" className="w-full h-full object-cover" />
                    {selected && (
                      <div className="absolute top-1 right-1 bg-gold text-forest-dark w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">
                        {order}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <DrivePhotoBank
              password={password}
              showManager
              selectedFileIds={galleryKeys
                .filter((k) => k.startsWith("drive:"))
                .map((k) => k.slice(6))}
              onPick={(fileId) => togglePhoto(`drive:${fileId}`)}
            />
          )}
        </div>

        <div className={sectionCls}>
          <h2 className="font-serif text-xl text-forest-dark mb-2">Opening Letter Line</h2>
          <p className="text-xs text-forest-dark/60 mb-3">Optional opening line after their name. Leave blank to skip.</p>
          <textarea
            className={inputCls + " min-h-[80px]"}
            placeholder="Thank you for the time on the phone — I enjoyed it more than you know."
            value={proposal.letter_intro || ""}
            onChange={(e) => update({ letter_intro: e.target.value })}
          />
        </div>

        {/* Intro */}
        <div className={sectionCls}>
          <h2 className="font-serif text-xl text-forest-dark mb-4">Your Night (intro paragraph)</h2>
          <textarea className={inputCls + " min-h-[140px]"} value={proposal.intro_paragraph} onChange={(e) => update({ intro_paragraph: e.target.value })} />
        </div>

        {/* Timeline */}
        <div className={sectionCls}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl text-forest-dark">Timeline</h2>
            <button onClick={addTimeline} className="text-sm text-forest-dark/70 hover:text-forest-dark flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button>
          </div>
          {proposal.timeline.map((t, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 mb-3 items-center">
              <input className={inputCls + " col-span-3"} placeholder="6:30 PM" value={t.time} onChange={(e) => updateTimeline(i, { time: e.target.value })} />
              <input className={inputCls + " col-span-6"} placeholder="Description" value={t.desc} onChange={(e) => updateTimeline(i, { desc: e.target.value })} />
              <div className="col-span-3 flex items-center justify-end gap-1">
                <button onClick={() => moveTimeline(i, -1)} disabled={i === 0} title="Move up" className="p-1.5 border border-forest-dark/15 text-forest-dark hover:bg-cream disabled:opacity-30 disabled:cursor-not-allowed"><ArrowUp className="w-4 h-4" /></button>
                <button onClick={() => moveTimeline(i, 1)} disabled={i === proposal.timeline.length - 1} title="Move down" className="p-1.5 border border-forest-dark/15 text-forest-dark hover:bg-cream disabled:opacity-30 disabled:cursor-not-allowed"><ArrowDown className="w-4 h-4" /></button>
                <button onClick={() => removeTimeline(i)} title="Remove" className="p-1.5 text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}

        </div>

        {/* Square Invoice URL (proposal-level) */}
        <div className={sectionCls}>
          <h2 className="font-serif text-xl text-forest-dark mb-2">Square Invoice URL</h2>
          <p className="text-xs text-forest-dark/60 mb-3">
            Paste the public payment link from the Square invoice you prepared for this client (looks like <code>https://squareup.com/pay-invoice/...</code>).
            When set, every <strong>Reserve</strong> button on the proposal opens this invoice so they can pay the 50% deposit right there. Button text becomes "Pay Deposit &amp; Reserve."
            Leave blank to keep the per-tier links below.
          </p>
          <input
            className={inputCls}
            placeholder="https://squareup.com/pay-invoice/..."
            value={proposal.square_invoice_url || ""}
            onChange={(e) => update({ square_invoice_url: e.target.value })}
          />
        </div>

        {/* Tiers */}
        <div className={sectionCls}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl text-forest-dark">Pricing Tiers</h2>
            <button onClick={addTier} className="text-sm text-forest-dark/70 hover:text-forest-dark flex items-center gap-1"><Plus className="w-4 h-4" /> Add Tier</button>
          </div>
          {proposal.tiers.map((tier, i) => (
            <TierEditor key={i} tier={tier} onChange={(patch) => updateTier(i, patch)} onRemove={() => removeTier(i)} index={i} />
          ))}
        </div>

        {/* FAQs */}
        <div className={sectionCls}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl text-forest-dark">FAQs</h2>
            <button onClick={addFaq} className="text-sm text-forest-dark/70 hover:text-forest-dark flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button>
          </div>
          {proposal.faqs.map((f, i) => (
            <div key={i} className="mb-4 border-l-2 border-gold/40 pl-4">
              <input className={inputCls + " mb-2 font-medium"} placeholder="Question" value={f.q} onChange={(e) => updateFaq(i, { q: e.target.value })} />
              <textarea className={inputCls + " min-h-[80px]"} placeholder="Answer" value={f.a} onChange={(e) => updateFaq(i, { a: e.target.value })} />
              <button onClick={() => removeFaq(i)} className="text-xs text-red-600 mt-1 hover:underline">Remove</button>
            </div>
          ))}
        </div>

        {/* Closing */}
        <div className={sectionCls}>
          <h2 className="font-serif text-xl text-forest-dark mb-4">Closing</h2>
          <label className={labelCls}>Closing quote (optional)</label>
          <input className={inputCls + " mb-3"} value={proposal.closing_quote || ""} onChange={(e) => update({ closing_quote: e.target.value })} />
          <label className={labelCls}>Attribution (optional)</label>
          <input className={inputCls} value={proposal.closing_attribution || ""} onChange={(e) => update({ closing_attribution: e.target.value })} />
        </div>

        <div className="flex justify-end gap-2 sticky bottom-4">
          <button onClick={onPreview} className="px-4 py-2 border border-forest-dark/20 bg-white text-sm hover:bg-cream flex items-center gap-2"><Eye className="w-4 h-4" /> Preview</button>
          <button onClick={onSave} className="px-6 py-2 bg-forest-dark text-cream text-sm hover:opacity-90">Save</button>
        </div>
      </div>
    </div>
  );
};

const TierEditor = ({ tier, onChange, onRemove, index }: { tier: Tier; onChange: (p: Partial<Tier>) => void; onRemove: () => void; index: number }) => {
  const [open, setOpen] = useState(true);
  const inputCls = "w-full border border-forest-dark/20 px-3 py-2 bg-white text-sm";
  const labelCls = "block text-xs uppercase tracking-wider text-forest-dark/60 mb-1";

  const updateItem = (i: number, val: string) => {
    const items = [...tier.items]; items[i] = val; onChange({ items });
  };
  const addItem = () => onChange({ items: [...tier.items, ""] });
  const removeItem = (i: number) => onChange({ items: tier.items.filter((_, j) => j !== i) });
  const moveItem = (i: number, dir: -1 | 1) => {
    const items = [...tier.items];
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    [items[i], items[j]] = [items[j], items[i]];
    onChange({ items });
  };


  return (
    <div className="border border-forest-dark/15 mb-3">
      <div className="flex items-center justify-between p-3 bg-cream/40">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-2 text-sm font-medium text-forest-dark">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Tier {index + 1}: {tier.name} {tier.recommended && <span className="text-xs text-gold ml-2">★ Recommended</span>}
        </button>
        <button onClick={onRemove} className="text-red-600 hover:bg-red-50 p-1"><Trash2 className="w-4 h-4" /></button>
      </div>
      {open && (
        <div className="p-4 grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><label className={labelCls}>Name</label><input className={inputCls} value={tier.name} onChange={(e) => onChange({ name: e.target.value })} /></div>
          <div className="md:col-span-2"><label className={labelCls}>Tagline</label><input className={inputCls} value={tier.tagline} onChange={(e) => onChange({ tagline: e.target.value })} /></div>
          <div><label className={labelCls}>Price (display)</label><input className={inputCls} placeholder="$3,500" value={tier.price} onChange={(e) => onChange({ price: e.target.value })} /></div>
          <div><label className={labelCls}>CTA label</label><input className={inputCls} value={tier.cta} onChange={(e) => onChange({ cta: e.target.value })} /></div>
          <div className="md:col-span-2"><label className={labelCls}>Square checkout link</label><input className={inputCls} placeholder="https://square.link/..." value={tier.href} onChange={(e) => onChange({ href: e.target.value })} /></div>
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm text-forest-dark">
              <input type="checkbox" checked={!!tier.recommended} onChange={(e) => onChange({ recommended: e.target.checked })} />
              Mark as Recommended (highlighted gold)
            </label>
          </div>
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label className={labelCls}>What's included</label>
              <button onClick={addItem} className="text-xs text-forest-dark/70 hover:text-forest-dark flex items-center gap-1"><Plus className="w-3 h-3" /> Add line</button>
            </div>
            {tier.items.map((it, i) => (
              <div key={i} className="flex gap-2 mb-2 items-center">
                <input className={inputCls} value={it} onChange={(e) => updateItem(i, e.target.value)} />
                <button onClick={() => moveItem(i, -1)} disabled={i === 0} title="Move up" className="p-1.5 border border-forest-dark/15 text-forest-dark hover:bg-cream disabled:opacity-30 disabled:cursor-not-allowed"><ArrowUp className="w-4 h-4" /></button>
                <button onClick={() => moveItem(i, 1)} disabled={i === tier.items.length - 1} title="Move down" className="p-1.5 border border-forest-dark/15 text-forest-dark hover:bg-cream disabled:opacity-30 disabled:cursor-not-allowed"><ArrowDown className="w-4 h-4" /></button>
                <button onClick={() => removeItem(i)} title="Remove" className="text-red-600 hover:bg-red-50 px-2"><X className="w-4 h-4" /></button>
              </div>
            ))}

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProposals;
