import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Copy, Send, Eye, ChevronDown, ChevronUp, X } from "lucide-react";
import { ProposalView, DEFAULT_PROPOSAL, HERO_OPTIONS, type ProposalData, type Tier, type TimelineItem, type FaqItem } from "./ProposalTemplate";

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
}

interface FullProposal extends ProposalData {
  id: string;
  slug: string;
  sent_at?: string | null;
}

const EVENT_TYPES = ["Wedding", "Corporate Event", "Private Event", "Fundraiser", "Birthday", "Holiday Party"];

const AdminProposals = () => {
  const [password, setPassword] = useState(() => localStorage.getItem("wr_admin_session_pw") || "");
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState("");

  const [list, setList] = useState<ProposalRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<FullProposal | null>(null);
  const [showPreview, setShowPreview] = useState(false);

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

  const tryLogin = async () => {
    try {
      const res = await fetch(`${FN}?action=list`, { headers: { "x-admin-password": pwInput } });
      if (!res.ok) throw new Error("Wrong password");
      setPassword(pwInput);
      setAuthed(true);
      const session = JSON.stringify({ pw: pwInput, ts: Date.now() });
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
    const message = prompt("Personal message:", `${proposal.first_name},\n\nHere's the proposal we discussed. Take your time with it — call me anytime.\n\n— Scott`);
    if (message === null) return;
    const link = `${window.location.origin}/proposal/${proposal.slug}`;
    try {
      await apiCall("send", "POST", { id: proposal.id, to, subject, message, link });
      toast.success("Email sent");
      loadList();
    } catch (e) { toast.error((e as Error).message); }
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-forest-dark flex items-center justify-center p-6">
        <div className="bg-cream p-8 max-w-sm w-full">
          <h1 className="font-serif text-2xl text-forest-dark mb-6">Proposals Admin</h1>
          <input
            type="password"
            value={pwInput}
            onChange={(e) => setPwInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && tryLogin()}
            placeholder="Admin password"
            className="w-full border border-forest-dark/20 px-4 py-3 mb-4 bg-white"
          />
          <button onClick={tryLogin} className="w-full bg-forest-dark text-cream py-3 hover:opacity-90">
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
    return <ProposalEditor proposal={editing} onChange={setEditing} onSave={save} onCancel={() => setEditing(null)} onPreview={() => setShowPreview(true)} />;
  }

  return (
    <div className="min-h-screen bg-cream p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl text-forest-dark">Proposals</h1>
            <p className="text-sm text-forest-dark/60 mt-1">Build, preview, and send personalized proposals.</p>
          </div>
          <button onClick={startNew} className="bg-forest-dark text-cream px-5 py-3 flex items-center gap-2 hover:opacity-90">
            <Plus className="w-4 h-4" /> New Proposal
          </button>
        </div>

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
                  <div className="text-xs text-forest-dark/40 mt-1">
                    /proposal/{p.slug}
                    {p.sent_at && <span className="ml-2 text-emerald-700">· Sent {new Date(p.sent_at).toLocaleDateString()}</span>}
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
      </div>
    </div>
  );
};

/* ===================== EDITOR ===================== */
const ProposalEditor = ({
  proposal, onChange, onSave, onCancel, onPreview,
}: {
  proposal: FullProposal;
  onChange: (p: FullProposal) => void;
  onSave: () => void;
  onCancel: () => void;
  onPreview: () => void;
}) => {
  const update = (patch: Partial<FullProposal>) => onChange({ ...proposal, ...patch });

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

        {/* Letter intro */}
        <div className={sectionCls}>
          <h2 className="font-serif text-xl text-forest-dark mb-2">Opening Letter Line</h2>
          <p className="text-xs text-forest-dark/60 mb-3">First line after their name. Default mentions a phone call — edit if you haven't spoken yet.</p>
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
            <div key={i} className="grid grid-cols-12 gap-3 mb-3">
              <input className={inputCls + " col-span-3"} placeholder="6:30 PM" value={t.time} onChange={(e) => updateTimeline(i, { time: e.target.value })} />
              <input className={inputCls + " col-span-8"} placeholder="Description" value={t.desc} onChange={(e) => updateTimeline(i, { desc: e.target.value })} />
              <button onClick={() => removeTimeline(i)} className="col-span-1 text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4 mx-auto" /></button>
            </div>
          ))}
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
              <div key={i} className="flex gap-2 mb-2">
                <input className={inputCls} value={it} onChange={(e) => updateItem(i, e.target.value)} />
                <button onClick={() => removeItem(i)} className="text-red-600 hover:bg-red-50 px-2"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProposals;
