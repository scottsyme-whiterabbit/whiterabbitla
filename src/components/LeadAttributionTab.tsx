import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface Props {
  storedPassword: string;
}

const VERTICAL_OPTIONS = [
  "Wedding Planner",
  "Corporate Planner",
  "Country Club",
  "Newsletter",
  "Restaurant",
  "PR Agency",
  "Talent Management",
  "Spirits",
  "Other",
];

const LEAD_SOURCE_OPTIONS = [
  "Supabase Drip",
  "Magic Castle",
  "Referrals",
  "Meta Ads",
  "Apollo Outreach",
  "Inbound Website",
  "Other",
];

const emptyForm = {
  contact_name: "",
  event_date: "",
  event_type: "",
  vertical: "",
  lead_source: "",
};

const LeadAttributionTab = ({ storedPassword }: Props) => {
  const [closedDeals, setClosedDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

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
        const res = await callAdmin("get_lead_attribution");
        setClosedDeals(res.closedDeals || []);
      } catch {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [callAdmin]);

  const handleSave = async () => {
    if (!form.contact_name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.vertical) {
      toast.error("Vertical is required");
      return;
    }
    setSaving(true);
    try {
      const res = await callAdmin("log_closed_deal", {
        contact_name: form.contact_name,
        event_date: form.event_date || null,
        event_type: form.event_type || null,
        source: form.lead_source,
        location: form.vertical,
      });
      if (res.deal) {
        setClosedDeals(prev => [res.deal, ...prev]);
        setForm(emptyForm);
        setShowForm(false);
        toast.success("Booking logged");
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-center text-muted-foreground py-12">Loading…</p>;
  }

  return (
    <div className="space-y-8">
      {/* SECTION 1 — Log a Booking */}
      <div className="border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-accent">Log a Booking</h3>
            <p className="font-sans text-[10px] text-muted-foreground mt-1">{closedDeals.length} bookings logged</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-accent-foreground font-sans text-xs tracking-wider uppercase rounded hover:bg-accent/90 transition-colors"
          >
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? "Cancel" : "New Booking"}
          </button>
        </div>

        {showForm && (
          <div className="bg-muted/10 border border-border p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1">Name *</label>
                <input
                  value={form.contact_name}
                  onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))}
                  className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground rounded focus:outline-none focus:border-accent"
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label className="block font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1">Event Date</label>
                <input
                  type="date"
                  value={form.event_date}
                  onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))}
                  className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground rounded focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1">Event Type</label>
                <input
                  value={form.event_type}
                  onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))}
                  className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground rounded focus:outline-none focus:border-accent"
                  placeholder="e.g. Corporate Gala, Wedding"
                />
              </div>
              <div>
                <label className="block font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1">Vertical *</label>
                <select
                  value={form.vertical}
                  onChange={e => setForm(f => ({ ...f, vertical: e.target.value }))}
                  className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground rounded focus:outline-none focus:border-accent"
                >
                  <option value="">Select vertical…</option>
                  {VERTICAL_OPTIONS.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1">Lead Source *</label>
                <select
                  value={form.lead_source}
                  onChange={e => setForm(f => ({ ...f, lead_source: e.target.value }))}
                  className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground rounded focus:outline-none focus:border-accent"
                >
                  <option value="">Select source…</option>
                  {LEAD_SOURCE_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 bg-accent text-accent-foreground font-sans text-xs tracking-wider uppercase rounded hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Booking"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2 — Bookings Table */}
      <div className="border border-border p-6">
        <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-accent mb-4">All Bookings</h3>
        {closedDeals.length > 0 ? (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-4 font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Name</th>
                  <th className="py-2 pr-4 font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Event Date</th>
                  <th className="py-2 pr-4 font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Event Type</th>
                  <th className="py-2 font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Vertical</th>
                </tr>
              </thead>
              <tbody>
                {closedDeals.map(d => (
                  <tr key={d.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                    <td className="py-2.5 pr-4 text-foreground">{d.contact_name || "—"}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{d.event_date || "—"}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{d.event_type || "—"}</td>
                    <td className="py-2.5">
                      <span className="inline-block px-2 py-0.5 bg-accent/10 text-accent text-[10px] tracking-wider uppercase rounded">
                        {d.source || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-6">No bookings logged yet.</p>
        )}
      </div>
    </div>
  );
};

export default LeadAttributionTab;
