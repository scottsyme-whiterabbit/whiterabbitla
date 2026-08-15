import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Copy, Send, Eye, X, ArrowLeft } from "lucide-react";
import {
  ResidencyView,
  DEFAULT_VENUE_PITCH,
  type VenuePitchData,
  type VenueTestimonial,
} from "@/pages/ResidencyTemplate";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const FN = `${SUPABASE_URL}/functions/v1/proposals-api`;

interface PitchRow {
  id: string;
  slug: string;
  venue_name: string;
  gm_name: string;
  gm_email: string | null;
  submarket: string | null;
  fee_dollars: number | null;
  sent_at: string | null;
  created_at: string;
  view_count?: number;
  last_viewed_at?: string | null;
}

interface FullPitch extends VenuePitchData {
  id: string;
  slug: string;
  sent_at?: string | null;
}

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

interface Props {
  password: string;
}

const ResidencyAdmin = ({ password }: Props) => {
  const [list, setList] = useState<PitchRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<FullPitch | null>(null);
  const [showPreview, setShowPreview] = useState(false);

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

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadList = async () => {
    setLoading(true);
    try {
      const j = await apiCall("list_venue");
      setList(j.pitches || []);
    } catch (e) {
      toast.error((e as Error).message);
    }
    setLoading(false);
  };

  const startNew = () => {
    setEditing({ ...DEFAULT_VENUE_PITCH, id: "", slug: "" } as FullPitch);
  };

  const startEdit = async (slug: string) => {
    try {
      const res = await fetch(`${FN}?action=get_venue&slug=${slug}`, {
        headers: { "x-admin-password": password },
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setEditing(j.pitch);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const save = async () => {
    if (!editing) return;
    try {
      const payload: any = { ...editing };
      delete payload.created_at;
      delete payload.updated_at;
      const action = editing.id ? "update_venue" : "create_venue";
      if (!editing.id) {
        delete payload.id;
        if (!payload.slug) delete payload.slug;
      }
      const j = await apiCall(action, "POST", payload);
      toast.success(editing.id ? "Saved" : "Created");
      setEditing(j.pitch);
      loadList();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this residency pitch?")) return;
    try {
      await apiCall("delete_venue", "POST", { id });
      toast.success("Deleted");
      loadList();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/residency/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };

  const sendEmail = async (pitch: FullPitch | PitchRow) => {
    const to = prompt("Recipient email:", pitch.gm_email || "");
    if (!to) return;
    const subject = prompt(
      "Subject:",
      `A residency proposal for ${pitch.venue_name}`
    );
    if (!subject) return;
    const message = prompt(
      "Personal message (greeting and signature are added automatically):",
      `I put together a short proposal for a four-week residency at ${pitch.venue_name}. Twenty minutes in the room is all I'm asking for to start.\n\nBest,\n-Scott`
    );
    if (message === null) return;
    const link = `${window.location.origin}/residency/${pitch.slug}`;
    try {
      await apiCall("send_venue", "POST", {
        id: pitch.id,
        to,
        subject,
        message,
        link,
        gmName: pitch.gm_name,
        venueName: pitch.venue_name,
      });
      toast.success("Email sent");
      loadList();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (showPreview && editing) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="sticky top-0 z-50 bg-forest-dark text-cream px-6 py-3 flex items-center justify-between">
          <span className="text-sm tracking-wider uppercase">Preview Mode</span>
          <button
            onClick={() => setShowPreview(false)}
            className="flex items-center gap-2 text-sm hover:text-gold"
          >
            <X className="w-4 h-4" /> Close Preview
          </button>
        </div>
        <ResidencyView data={editing} />
      </div>
    );
  }

  if (editing) {
    return (
      <ResidencyEditor
        pitch={editing}
        onChange={setEditing}
        onSave={save}
        onCancel={() => setEditing(null)}
        onPreview={() => setShowPreview(true)}
      />
    );
  }

  return (
    <>
      <button
        onClick={startNew}
        className="hidden md:inline-flex bg-forest-dark text-cream px-5 py-3 items-center gap-2 hover:opacity-90 mb-6"
      >
        <Plus className="w-4 h-4" /> New Residency Pitch
      </button>

      <button
        onClick={startNew}
        className="md:hidden w-full bg-forest-dark text-cream px-5 py-4 flex items-center justify-center gap-2 hover:opacity-90 shadow-md mb-6 text-base font-medium tracking-wide"
      >
        <Plus className="w-5 h-5" /> New Residency Pitch
      </button>

      {loading ? (
        <div className="text-forest-dark/60">Loading…</div>
      ) : list.length === 0 ? (
        <div className="bg-white border border-forest-dark/10 p-10 text-center text-forest-dark/60">
          No residency pitches yet. Click "New Residency Pitch" to start.
        </div>
      ) : (
        <div className="bg-white border border-forest-dark/10 divide-y divide-forest-dark/10">
          {list.map((p) => (
            <div
              key={p.id}
              className="p-5 flex flex-wrap items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-[240px]">
                <div className="font-serif text-lg text-forest-dark">
                  {p.venue_name}
                </div>
                <div className="text-sm text-forest-dark/60">
                  {p.gm_name} {p.submarket && `· ${p.submarket}`}{" "}
                  {p.fee_dollars && `· $${p.fee_dollars.toLocaleString()}/night`}
                </div>
                <div className="text-xs text-forest-dark/40 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                  <span>/residency/{p.slug}</span>
                  {p.sent_at && (
                    <span className="text-emerald-700">
                      · Sent {new Date(p.sent_at).toLocaleDateString()}
                    </span>
                  )}
                  {p.view_count ? (
                    <span className="text-gold font-medium">
                      · 👁 Viewed {p.view_count}×{" "}
                      {p.last_viewed_at &&
                        `· last ${formatRelative(p.last_viewed_at)}`}
                    </span>
                  ) : p.sent_at ? (
                    <span className="text-forest-dark/40">· Not yet opened</span>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyLink(p.slug)}
                  title="Copy link"
                  className="p-2 hover:bg-cream rounded"
                >
                  <Copy className="w-4 h-4 text-forest-dark" />
                </button>
                <a
                  href={`/residency/${p.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View"
                  className="p-2 hover:bg-cream rounded"
                >
                  <Eye className="w-4 h-4 text-forest-dark" />
                </a>
                <button
                  onClick={() => sendEmail(p)}
                  title="Email"
                  className="p-2 hover:bg-cream rounded"
                >
                  <Send className="w-4 h-4 text-forest-dark" />
                </button>
                <button
                  onClick={() => startEdit(p.slug)}
                  className="px-3 py-2 text-sm border border-forest-dark/20 hover:bg-cream"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(p.id)}
                  title="Delete"
                  className="p-2 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

/* ===================== EDITOR ===================== */

const ResidencyEditor = ({
  pitch,
  onChange,
  onSave,
  onCancel,
  onPreview,
}: {
  pitch: FullPitch;
  onChange: (p: FullPitch) => void;
  onSave: () => void;
  onCancel: () => void;
  onPreview: () => void;
}) => {
  const update = (patch: Partial<FullPitch>) =>
    onChange({ ...pitch, ...patch });

  const updateParagraph = (i: number, value: string) => {
    const p = [...pitch.intro_paragraphs];
    p[i] = value;
    update({ intro_paragraphs: p });
  };
  const addParagraph = () =>
    update({ intro_paragraphs: [...pitch.intro_paragraphs, ""] });
  const removeParagraph = (i: number) =>
    update({
      intro_paragraphs: pitch.intro_paragraphs.filter((_, j) => j !== i),
    });

  const updateTestimonial = (i: number, patch: Partial<VenueTestimonial>) => {
    const t = [...pitch.testimonials];
    t[i] = { ...t[i], ...patch };
    update({ testimonials: t });
  };
  const addTestimonial = () =>
    update({
      testimonials: [...pitch.testimonials, { quote: "", attribution: "" }],
    });
  const removeTestimonial = (i: number) =>
    update({ testimonials: pitch.testimonials.filter((_, j) => j !== i) });

  const inputCls =
    "w-full border border-forest-dark/20 px-3 py-2 bg-white text-sm";
  const labelCls =
    "block text-xs uppercase tracking-wider text-forest-dark/60 mb-1";
  const sectionCls = "bg-white border border-forest-dark/10 p-6 mb-6";

  return (
    <div className="min-h-screen bg-cream -mx-6 -my-10 md:-mx-10 p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <button
            onClick={onCancel}
            className="text-sm text-forest-dark/70 hover:text-forest-dark flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to list
          </button>
          <div className="flex gap-2">
            <button
              onClick={onPreview}
              className="px-4 py-2 border border-forest-dark/20 text-sm hover:bg-white flex items-center gap-2"
            >
              <Eye className="w-4 h-4" /> Preview
            </button>
            <button
              onClick={onSave}
              className="px-5 py-2 bg-forest-dark text-cream text-sm hover:opacity-90"
            >
              Save
            </button>
          </div>
        </div>

        <div className={sectionCls}>
          <h2 className="font-serif text-xl text-forest-dark mb-4">The Venue</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Venue name *</label>
              <input
                className={inputCls}
                value={pitch.venue_name}
                onChange={(e) => update({ venue_name: e.target.value })}
                placeholder="The Peninsula Beverly Hills"
              />
            </div>
            <div>
              <label className={labelCls}>Submarket / city</label>
              <input
                className={inputCls}
                value={pitch.submarket || ""}
                onChange={(e) => update({ submarket: e.target.value })}
                placeholder="Beverly Hills"
              />
            </div>
            <div>
              <label className={labelCls}>GM / contact name *</label>
              <input
                className={inputCls}
                value={pitch.gm_name}
                onChange={(e) => update({ gm_name: e.target.value })}
                placeholder="Offer Waxberg"
              />
            </div>
            <div>
              <label className={labelCls}>First name (for greeting)</label>
              <input
                className={inputCls}
                value={pitch.first_name || ""}
                onChange={(e) => update({ first_name: e.target.value })}
                placeholder="Offer"
              />
            </div>
            <div>
              <label className={labelCls}>GM email</label>
              <input
                className={inputCls}
                type="email"
                value={pitch.gm_email || ""}
                onChange={(e) => update({ gm_email: e.target.value })}
                placeholder="gm@venue.com"
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Hero image URL (or "signature" for default)</label>
              <input
                className={inputCls}
                value={pitch.hero_image}
                onChange={(e) => update({ hero_image: e.target.value })}
                placeholder="signature"
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Hero subhead (italic line under headline)</label>
              <input
                className={inputCls}
                value={pitch.hero_subhead}
                onChange={(e) => update({ hero_subhead: e.target.value })}
                placeholder="One Thursday a month. Lobby lounge. From 7 to 9."
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Room detail (specific observation for letter)</label>
              <input
                className={inputCls}
                value={pitch.room_detail || ""}
                onChange={(e) => update({ room_detail: e.target.value })}
                placeholder="The booths along the back wall, the bar at nine on a Thursday"
              />
            </div>
          </div>
        </div>

        <div className={sectionCls}>
          <h2 className="font-serif text-xl text-forest-dark mb-4">
            The Invitation Letter
          </h2>
          <p className="text-xs text-forest-dark/60 mb-3">
            Each paragraph is a separate block. Keep them short, like a letter,
            not a brochure.
          </p>
          {pitch.intro_paragraphs.map((p, i) => (
            <div key={i} className="flex gap-2 mb-3">
              <textarea
                className={`${inputCls} flex-1 min-h-[100px]`}
                value={p}
                onChange={(e) => updateParagraph(i, e.target.value)}
              />
              <button
                onClick={() => removeParagraph(i)}
                className="p-2 hover:bg-red-50 self-start"
                title="Remove paragraph"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </div>
          ))}
          <button
            onClick={addParagraph}
            className="text-sm text-forest-dark/70 hover:text-forest-dark flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add paragraph
          </button>
        </div>

        <div className={sectionCls}>
          <h2 className="font-serif text-xl text-forest-dark mb-4">The Pilot</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className={labelCls}>Weeks</label>
              <input
                className={inputCls}
                type="number"
                min={1}
                value={pitch.pilot_weeks}
                onChange={(e) =>
                  update({ pilot_weeks: parseInt(e.target.value) || 1 })
                }
              />
            </div>
            <div>
              <label className={labelCls}>Nights per week</label>
              <input
                className={inputCls}
                type="number"
                min={1}
                value={pitch.nights_per_week}
                onChange={(e) =>
                  update({ nights_per_week: parseInt(e.target.value) || 1 })
                }
              />
            </div>
            <div>
              <label className={labelCls}>Hours per night</label>
              <input
                className={inputCls}
                type="number"
                min={1}
                value={pitch.session_hours}
                onChange={(e) =>
                  update({ session_hours: parseInt(e.target.value) || 1 })
                }
              />
            </div>
            <div>
              <label className={labelCls}>Fee per night ($)</label>
              <input
                className={inputCls}
                type="number"
                value={pitch.fee_dollars || ""}
                onChange={(e) =>
                  update({
                    fee_dollars: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  })
                }
                placeholder="850"
              />
            </div>
          </div>
        </div>

        <div className={sectionCls}>
          <h2 className="font-serif text-xl text-forest-dark mb-4">
            Testimonials (up to 3)
          </h2>
          {pitch.testimonials.map((t, i) => (
            <div
              key={i}
              className="border border-forest-dark/10 p-4 mb-3 bg-cream/30"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs uppercase tracking-wider text-forest-dark/60">
                  Quote {i + 1}
                </span>
                <button
                  onClick={() => removeTestimonial(i)}
                  className="p-1 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
              <textarea
                className={`${inputCls} mb-2`}
                value={t.quote}
                onChange={(e) =>
                  updateTestimonial(i, { quote: e.target.value })
                }
                placeholder="Quote..."
                rows={3}
              />
              <input
                className={inputCls}
                value={t.attribution}
                onChange={(e) =>
                  updateTestimonial(i, { attribution: e.target.value })
                }
                placeholder="Name, Event / Context"
              />
            </div>
          ))}
          {pitch.testimonials.length < 3 && (
            <button
              onClick={addTestimonial}
              className="text-sm text-forest-dark/70 hover:text-forest-dark flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add testimonial
            </button>
          )}
        </div>

        <div className={sectionCls}>
          <h2 className="font-serif text-xl text-forest-dark mb-4">
            Extras (optional)
          </h2>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>
                Press line (small italic under About the Work)
              </label>
              <input
                className={inputCls}
                value={pitch.press_line || ""}
                onChange={(e) => update({ press_line: e.target.value })}
                placeholder="Featured in LA Magazine, 2025."
              />
            </div>
            <div>
              <label className={labelCls}>
                Scheduling URL (Calendly / Google Calendar booking link)
              </label>
              <input
                className={inputCls}
                value={pitch.scheduling_url || ""}
                onChange={(e) => update({ scheduling_url: e.target.value })}
                placeholder="https://calendly.com/scottsyme/walkthrough"
              />
            </div>
            <div>
              <label className={labelCls}>
                Private closing line (residency pages only, leave default
                unless you have reason)
              </label>
              <input
                className={inputCls}
                value={pitch.closing_private_line || ""}
                onChange={(e) =>
                  update({ closing_private_line: e.target.value })
                }
              />
            </div>
            <div>
              <label className={labelCls}>Case study result sentence</label>
              <textarea
                className={`${inputCls} min-h-[80px]`}
                value={pitch.case_study_result || ""}
                onChange={(e) => update({ case_study_result: e.target.value })}
                placeholder="On residency nights, tables stayed through dessert and asked for him by name."
              />
            </div>
            <div>
              <label className={labelCls}>Case study quote</label>
              <textarea
                className={`${inputCls} min-h-[80px]`}
                value={pitch.case_study_quote || ""}
                onChange={(e) => update({ case_study_quote: e.target.value })}
                placeholder="Scott was our resident Magician at Rideau. His performances, combined, elegance, technical mastery and humor, creating memorable experiences that our guests truly loved."
              />
            </div>
            <div>
              <label className={labelCls}>Case study attribution</label>
              <input
                className={inputCls}
                value={pitch.case_study_attribution || ""}
                onChange={(e) => update({ case_study_attribution: e.target.value })}
                placeholder="General Manager, Rideau at Arden"
              />
            </div>
            <div>
              <label className={labelCls}>Video URL (case-study film link)</label>
              <input
                className={inputCls}
                value={pitch.video_url || ""}
                onChange={(e) => update({ video_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResidencyAdmin;
