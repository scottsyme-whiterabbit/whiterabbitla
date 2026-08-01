import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, X, ExternalLink, Download, MapPin, Users, Clock, DollarSign, Building2, Mail, Phone } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isToday as isTodayFn } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GoogleCalEvent {
  id: string;
  summary: string;
  description: string | null;
  location: string | null;
  start: string | null;
  end: string | null;
  allDay: boolean;
  htmlLink: string | null;
  status: string;
  colorId: string | null;
}

interface Deal {
  id: string;
  contact_name: string | null;
  contact_email: string;
  company: string | null;
  event_type: string | null;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  guest_count: string | null;
  deal_value: number | null;
  stage: string;
  phone: string | null;
  notes: string | null;
}

interface Props {
  campaigns?: unknown[];
  sendLog?: unknown[];
  /** Admin password — required for the calendar API to return event details. */
  adminPassword?: string;
}

const HOLD_STAGES = ["new", "contacted", "negotiating", "proposal_sent"];
const BOOKED_STAGES = ["booked", "completed"];

/** Convert "HH:mm" or ISO datetime to 12-hour format like "6:00 PM" */
const to12Hour = (timeStr: string | null | undefined): string => {
  if (!timeStr) return "";
  // Extract HH:mm from either "HH:mm:ss" or ISO "...T18:00:00..."
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!match) return timeStr;
  let h = parseInt(match[1]);
  const m = match[2];
  const ampm = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${ampm}`;
};

const EVENT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  corporate: { bg: "bg-blue-900/30", border: "border-blue-500/50", text: "text-blue-300" },
  wedding: { bg: "bg-pink-900/30", border: "border-pink-500/50", text: "text-pink-300" },
  private_party: { bg: "bg-purple-900/30", border: "border-purple-500/50", text: "text-purple-300" },
  parlor_show: { bg: "bg-amber-900/30", border: "border-amber-500/50", text: "text-amber-300" },
  other: { bg: "bg-emerald-900/30", border: "border-emerald-500/50", text: "text-emerald-300" },
};

const EVENT_EMOJIS: Record<string, string> = {
  corporate: "🏢",
  wedding: "💍",
  private_party: "🎉",
  parlor_show: "🎩",
  other: "✨",
};

const formatCurrency = (cents: number | null) => {
  if (!cents) return "";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(cents / 100);
};

const generateGoogleCalendarUrl = (deal: Deal): string => {
  const title = encodeURIComponent(`Show: ${deal.contact_name || deal.company || deal.contact_email}`);
  const location = encodeURIComponent(deal.location || "");
  const details = encodeURIComponent(
    [
      deal.company && `Company: ${deal.company}`,
      deal.event_type && `Type: ${deal.event_type}`,
      deal.guest_count && `Guests: ${deal.guest_count}`,
      deal.deal_value && `Value: ${formatCurrency(deal.deal_value)}`,
      `Contact: ${deal.contact_email}`,
      deal.phone && `Phone: ${deal.phone}`,
      deal.notes && `Notes: ${deal.notes}`,
    ].filter(Boolean).join("\n")
  );

  const date = deal.event_date!.replace(/-/g, "");
  let dates: string;
  if (deal.event_time) {
    const time = deal.event_time.replace(/:/g, "").slice(0, 4) + "00";
    const startH = parseInt(deal.event_time.split(":")[0]);
    const endH = String(Math.min(startH + 2, 23)).padStart(2, "0");
    const endTime = `${endH}${deal.event_time.split(":")[1]}00`;
    dates = `${date}T${time}/${date}T${endTime}`;
  } else {
    dates = `${date}/${date}`;
  }

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&location=${location}&details=${details}`;
};

const generateICS = (deal: Deal): string => {
  const date = deal.event_date!.replace(/-/g, "");
  let dtstart: string, dtend: string;
  if (deal.event_time) {
    const time = deal.event_time.replace(/:/g, "").slice(0, 4) + "00";
    dtstart = `${date}T${time}`;
    const startH = parseInt(deal.event_time.split(":")[0]);
    const endH = String(Math.min(startH + 2, 23)).padStart(2, "0");
    dtend = `${date}T${endH}${deal.event_time.split(":")[1]}00`;
  } else {
    dtstart = date;
    dtend = date;
  }
  const description = [
    deal.company && `Company: ${deal.company}`,
    deal.event_type && `Type: ${deal.event_type}`,
    deal.guest_count && `Guests: ${deal.guest_count}`,
    `Contact: ${deal.contact_email}`,
  ].filter(Boolean).join("\\n");

  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//White Rabbit//Show Calendar//EN",
    "BEGIN:VEVENT", `DTSTART:${dtstart}`, `DTEND:${dtend}`,
    `SUMMARY:Show: ${deal.contact_name || deal.company || deal.contact_email}`,
    `LOCATION:${deal.location || ""}`, `DESCRIPTION:${description}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
};

const downloadICS = (deal: Deal) => {
  const ics = generateICS(deal);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `show-${deal.event_date}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const CampaignCalendarTab = ({ adminPassword }: Props) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [gcalEvents, setGcalEvents] = useState<GoogleCalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [expandedDealId, setExpandedDealId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showGcal, setShowGcal] = useState(true);
  const [addForm, setAddForm] = useState({
    contact_name: "", contact_email: "", company: "", event_type: "corporate",
    event_date: "", event_time: "", location: "", guest_count: "", deal_value: "",
    phone: "", notes: "", stage: "booked",
  });
  const [saving, setSaving] = useState(false);

  const fetchDeals = async () => {
    const { data, error } = await supabase
      .from("deals")
      .select("id, contact_name, contact_email, company, event_type, event_date, event_time, location, guest_count, deal_value, stage, phone, notes")
      .not("event_date", "is", null);
    if (error) {
      console.error("Error fetching deals:", error);
      toast.error("Failed to load calendar events");
    } else {
      setDeals(data || []);
    }
  };

  const fetchGoogleCalEvents = async () => {
    try {
      const start = startOfMonth(subMonths(currentMonth, 1));
      const end = endOfMonth(addMonths(currentMonth, 2));
      const { data, error } = await supabase.functions.invoke("google-calendar", {
        body: {
          timeMin: start.toISOString(),
          timeMax: end.toISOString(),
          adminPassword,
        },

      });
      if (error) {
        console.error("Google Calendar fetch error:", error);
      } else if (data?.events) {
        setGcalEvents(data.events);
      }
    } catch (err) {
      console.error("Failed to fetch Google Calendar:", err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchDeals(), fetchGoogleCalEvents()]).finally(() => setLoading(false));
  }, []);

  // Refetch gcal when month changes
  useEffect(() => { fetchGoogleCalEvents(); }, [currentMonth]);

  const bookedDeals = useMemo(() => deals.filter(d => BOOKED_STAGES.includes(d.stage)), [deals]);
  const holdDeals = useMemo(() => deals.filter(d => HOLD_STAGES.includes(d.stage)), [deals]);

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const startDayOffset = getDay(startOfMonth(currentMonth));

  // Map gcal events by date
  const gcalDateMap = useMemo(() => {
    const map = new Map<string, GoogleCalEvent[]>();
    gcalEvents.forEach(ev => {
      if (!ev.start) return;
      const dateStr = ev.start.length > 10 ? ev.start.slice(0, 10) : ev.start;
      if (!map.has(dateStr)) map.set(dateStr, []);
      map.get(dateStr)!.push(ev);
    });
    return map;
  }, [gcalEvents]);

  const dateMap = useMemo(() => {
    const map = new Map<string, { booked: Deal[]; holds: Deal[]; gcal: GoogleCalEvent[] }>();
    bookedDeals.forEach(d => {
      const key = d.event_date!;
      if (!map.has(key)) map.set(key, { booked: [], holds: [], gcal: [] });
      map.get(key)!.booked.push(d);
    });
    holdDeals.forEach(d => {
      const key = d.event_date!;
      if (!map.has(key)) map.set(key, { booked: [], holds: [], gcal: [] });
      map.get(key)!.holds.push(d);
    });
    if (showGcal) {
      gcalDateMap.forEach((events, key) => {
        if (!map.has(key)) map.set(key, { booked: [], holds: [], gcal: [] });
        map.get(key)!.gcal.push(...events);
      });
    }
    return map;
  }, [bookedDeals, holdDeals, gcalDateMap, showGcal]);

  const today = format(new Date(), "yyyy-MM-dd");

  const upcomingBooked = useMemo(() =>
    bookedDeals.filter(d => d.event_date! >= today).sort((a, b) => a.event_date!.localeCompare(b.event_date!)).slice(0, 8),
    [bookedDeals, today]
  );
  const upcomingHolds = useMemo(() =>
    holdDeals.filter(d => d.event_date! >= today).sort((a, b) => a.event_date!.localeCompare(b.event_date!)).slice(0, 8),
    [holdDeals, today]
  );

  const selectedDeals = selectedDate ? dateMap.get(selectedDate) : null;

  const handleAddEvent = async () => {
    if (!addForm.contact_email || !addForm.event_date) {
      toast.error("Email and date are required");
      return;
    }
    setSaving(true);
    const payload: Record<string, unknown> = {
      contact_name: addForm.contact_name || null,
      contact_email: addForm.contact_email,
      company: addForm.company || null,
      event_type: addForm.event_type || null,
      event_date: addForm.event_date,
      event_time: addForm.event_time || null,
      location: addForm.location || null,
      guest_count: addForm.guest_count || null,
      deal_value: addForm.deal_value ? Math.round(parseFloat(addForm.deal_value) * 100) : null,
      phone: addForm.phone || null,
      notes: addForm.notes || null,
      stage: addForm.stage,
    };

    const { error } = await supabase.from("deals").insert(payload as any);
    if (error) {
      toast.error("Failed to add event");
      console.error(error);
    } else {
      toast.success("Event added to calendar!");
      setShowAddForm(false);
      setAddForm({ contact_name: "", contact_email: "", company: "", event_type: "corporate", event_date: "", event_time: "", location: "", guest_count: "", deal_value: "", phone: "", notes: "", stage: "booked" });
      fetchDeals();
    }
    setSaving(false);
  };

  const getColors = (type: string | null) => EVENT_COLORS[type || "other"] || EVENT_COLORS.other;

  const renderDealDetail = (deal: Deal, isHold: boolean) => {
    const colors = getColors(deal.event_type);
    const isExpanded = expandedDealId === deal.id;
    return (
      <div
        key={deal.id}
        onClick={() => setExpandedDealId(isExpanded ? null : deal.id)}
        className={`border p-3 cursor-pointer transition-all ${
          isHold ? "border-dashed border-[#C9A96E]/50 hover:bg-[#C9A96E]/10" : `${colors.border} hover:bg-muted/20`
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">{EVENT_EMOJIS[deal.event_type || "other"] || "✨"}</span>
            <div>
              <p className="font-sans text-sm text-foreground font-medium">{deal.contact_name || deal.company || deal.contact_email}</p>
              <p className="text-[11px] text-muted-foreground">
                {new Date(deal.event_date! + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                {deal.event_time && ` · ${to12Hour(deal.event_time)}`}
              </p>
            </div>
          </div>
          {isHold && <span className="text-[8px] font-sans tracking-[0.15em] uppercase text-[#C9A96E] bg-[#C9A96E]/15 px-2 py-0.5">HOLD</span>}
          {!isHold && deal.deal_value && <span className="font-mono text-xs text-accent">{formatCurrency(deal.deal_value)}</span>}
        </div>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-border/50 space-y-2 text-[12px]">
            {deal.company && <p className="flex items-center gap-1.5 text-muted-foreground"><Building2 size={12} /> {deal.company}</p>}
            {deal.event_type && <p className="flex items-center gap-1.5 text-muted-foreground">{EVENT_EMOJIS[deal.event_type] || "✨"} {deal.event_type.replace(/_/g, " ")}</p>}
            {deal.location && <p className="flex items-center gap-1.5 text-muted-foreground"><MapPin size={12} /> {deal.location}</p>}
            {deal.guest_count && <p className="flex items-center gap-1.5 text-muted-foreground"><Users size={12} /> {deal.guest_count} guests</p>}
            {deal.event_time && <p className="flex items-center gap-1.5 text-muted-foreground"><Clock size={12} /> {to12Hour(deal.event_time)}</p>}
            {deal.deal_value && <p className="flex items-center gap-1.5 text-accent"><DollarSign size={12} /> {formatCurrency(deal.deal_value)}</p>}
            <p className="flex items-center gap-1.5 text-muted-foreground"><Mail size={12} /> {deal.contact_email}</p>
            {deal.phone && <p className="flex items-center gap-1.5 text-muted-foreground"><Phone size={12} /> {deal.phone}</p>}
            {deal.notes && <p className="text-muted-foreground/70 italic mt-1">"{deal.notes}"</p>}
            <div className="flex gap-3 pt-2">
              <a
                href={generateGoogleCalendarUrl(deal)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1 text-[10px] font-sans tracking-[0.12em] uppercase text-accent hover:text-accent/80 transition-colors"
              >
                <ExternalLink size={11} /> Add to Google Cal
              </a>
              <button
                onClick={e => { e.stopPropagation(); downloadICS(deal); }}
                className="flex items-center gap-1 text-[10px] font-sans tracking-[0.12em] uppercase text-muted-foreground hover:text-accent transition-colors"
              >
                <Download size={11} /> iCal / Apple
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading calendar...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-serif text-xl text-foreground">Show Calendar</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {bookedDeals.filter(d => d.event_date! >= today).length} upcoming · {holdDeals.filter(d => d.event_date! >= today).length} holds
            {showGcal && gcalEvents.length > 0 && ` · ${gcalEvents.length} Google events`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowGcal(!showGcal)}
            className={`flex items-center gap-1.5 text-xs font-sans tracking-[0.12em] uppercase px-4 py-2 border transition-colors ${
              showGcal ? "border-sky-500/50 bg-sky-900/20 text-sky-300" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            📅 {showGcal ? "Google Cal On" : "Google Cal Off"}
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 text-xs font-sans tracking-[0.12em] uppercase bg-accent text-background px-4 py-2 hover:bg-accent/90 transition-colors"
          >
            {showAddForm ? <X size={14} /> : <Plus size={14} />}
            {showAddForm ? "Cancel" : "Add Event"}
          </button>
        </div>
      </div>

      {/* Add Event Form */}
      {showAddForm && (
        <div className="border border-accent/30 p-4 space-y-4">
          <h3 className="font-sans text-[10px] tracking-[0.15em] uppercase text-accent mb-2">New Calendar Event</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input placeholder="Contact Name" value={addForm.contact_name} onChange={e => setAddForm(p => ({ ...p, contact_name: e.target.value }))} className="bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent outline-none" />
            <input placeholder="Email *" type="email" value={addForm.contact_email} onChange={e => setAddForm(p => ({ ...p, contact_email: e.target.value }))} className="bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent outline-none" />
            <input placeholder="Phone" value={addForm.phone} onChange={e => setAddForm(p => ({ ...p, phone: e.target.value }))} className="bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent outline-none" />
            <input placeholder="Company" value={addForm.company} onChange={e => setAddForm(p => ({ ...p, company: e.target.value }))} className="bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent outline-none" />
            <select value={addForm.event_type} onChange={e => setAddForm(p => ({ ...p, event_type: e.target.value }))} className="bg-background border border-border px-3 py-2 text-sm text-foreground focus:border-accent outline-none">
              <option value="corporate">🏢 Corporate</option>
              <option value="wedding">💍 Wedding</option>
              <option value="private_party">🎉 Private Party</option>
              <option value="parlor_show">🎩 Parlor Show</option>
              <option value="other">✨ Other</option>
            </select>
            <select value={addForm.stage} onChange={e => setAddForm(p => ({ ...p, stage: e.target.value }))} className="bg-background border border-border px-3 py-2 text-sm text-foreground focus:border-accent outline-none">
              <option value="booked">✅ Confirmed</option>
              <option value="new">🔒 Hold - New</option>
              <option value="contacted">🔒 Hold - Contacted</option>
              <option value="negotiating">🔒 Hold - Negotiating</option>
              <option value="proposal_sent">🔒 Hold - Proposal Sent</option>
            </select>
            <input type="date" placeholder="Event Date *" value={addForm.event_date} onChange={e => setAddForm(p => ({ ...p, event_date: e.target.value }))} className="bg-background border border-border px-3 py-2 text-sm text-foreground focus:border-accent outline-none" />
            <input type="time" placeholder="Event Time" value={addForm.event_time} onChange={e => setAddForm(p => ({ ...p, event_time: e.target.value }))} className="bg-background border border-border px-3 py-2 text-sm text-foreground focus:border-accent outline-none" />
            <input placeholder="Location" value={addForm.location} onChange={e => setAddForm(p => ({ ...p, location: e.target.value }))} className="bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent outline-none" />
            <input placeholder="Guest Count" value={addForm.guest_count} onChange={e => setAddForm(p => ({ ...p, guest_count: e.target.value }))} className="bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent outline-none" />
            <input placeholder="Deal Value ($)" type="number" value={addForm.deal_value} onChange={e => setAddForm(p => ({ ...p, deal_value: e.target.value }))} className="bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent outline-none" />
          </div>
          <textarea placeholder="Notes..." value={addForm.notes} onChange={e => setAddForm(p => ({ ...p, notes: e.target.value }))} className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent outline-none h-16 resize-none" />
          <button
            onClick={handleAddEvent}
            disabled={saving}
            className="bg-accent text-background px-6 py-2 text-xs font-sans tracking-[0.12em] uppercase hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save & Add to Calendar"}
          </button>
        </div>
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 border border-border p-4">
          {/* Month Nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="text-muted-foreground hover:text-foreground p-1">
              <ChevronLeft size={18} />
            </button>
            <h3 className="font-serif text-lg text-foreground">{format(currentMonth, "MMMM yyyy")}</h3>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="text-muted-foreground hover:text-foreground p-1">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-px">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="text-center font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground py-2">{d}</div>
            ))}

            {/* Empty offset */}
            {Array.from({ length: startDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24" />
            ))}

            {/* Days */}
            {daysInMonth.map(day => {
              const dateKey = format(day, "yyyy-MM-dd");
              const events = dateMap.get(dateKey);
              const isToday = isTodayFn(day);
              const isSelected = selectedDate === dateKey;
              const hasBooked = events && events.booked.length > 0;
              const hasHolds = events && events.holds.length > 0;
              const hasGcal = events && events.gcal && events.gcal.length > 0;

              return (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                  className={`h-24 border p-1 relative transition-colors text-left overflow-hidden ${
                    isSelected ? "border-accent bg-accent/10" :
                    hasBooked ? "bg-emerald-900/15 border-emerald-600/30" :
                    hasHolds ? "bg-[#C9A96E]/8 border-dashed border-[#C9A96E]/40" :
                    hasGcal ? "bg-sky-900/10 border-sky-600/20" :
                    "border-border/30 hover:border-border/60"
                  } ${isToday ? "ring-1 ring-accent" : ""}`}
                >
                  <span className={`text-xs font-sans ${isToday ? "text-accent font-bold" : "text-muted-foreground"}`}>
                    {format(day, "d")}
                  </span>
                  <div className="mt-0.5 space-y-0.5 overflow-hidden">
                    {events?.booked.slice(0, 2).map(deal => {
                      const colors = getColors(deal.event_type);
                      return (
                        <div key={deal.id} className={`${colors.bg} border ${colors.border} px-1 py-0.5 text-[8px] ${colors.text} truncate rounded-sm leading-tight`}>
                          {EVENT_EMOJIS[deal.event_type || "other"] || "✨"} {to12Hour(deal.event_time)} {deal.contact_name?.split(" ")[0] || deal.company || "Show"}
                        </div>
                      );
                    })}
                    {events?.holds.slice(0, 1).map(deal => (
                      <div key={deal.id} className="bg-[#C9A96E]/12 border border-dashed border-[#C9A96E]/40 px-1 py-0.5 text-[8px] text-[#C9A96E] truncate rounded-sm leading-tight">
                        🔒 {deal.contact_name?.split(" ")[0] || "HOLD"}
                      </div>
                    ))}
                    {events?.gcal?.slice(0, 1).map(ev => {
                      const time = ev.start && ev.start.length > 10 ? to12Hour(ev.start) : "";
                      const label = ev.summary === "(No title)" ? (ev.allDay ? "Busy" : "Event") : ev.summary;
                      return (
                        <div key={ev.id} className="bg-sky-900/20 border border-sky-500/30 px-1 py-0.5 text-[8px] text-sky-300 truncate rounded-sm leading-tight">
                          📅 {time && `${time} `}{label}
                        </div>
                      );
                    })}
                    {events && ((events.booked.length + events.holds.length + (events.gcal?.length || 0)) > 3) && (
                      <span className="text-[7px] text-muted-foreground">+{events.booked.length + events.holds.length + (events.gcal?.length || 0) - 3} more</span>
                    )}
                  </div>
                  {hasBooked && (
                    <div className="absolute top-1 right-1">
                      <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full" />
                    </div>
                  )}
                  {hasHolds && !hasBooked && (
                    <div className="absolute top-1 right-1">
                      <span className="inline-block w-2 h-2 bg-[#C9A96E]/60 rounded-full" />
                    </div>
                  )}
                  {hasGcal && !hasBooked && !hasHolds && (
                    <div className="absolute top-1 right-1">
                      <span className="inline-block w-2 h-2 bg-sky-500/60 rounded-full" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 text-xs font-sans text-muted-foreground mt-4 flex-wrap">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-900/30 border border-emerald-600/40 rounded-sm" /> Confirmed</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#C9A96E]/15 border border-dashed border-[#C9A96E]/50 rounded-sm" /> Hold</span>
            {showGcal && <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-sky-900/20 border border-sky-500/30 rounded-sm" /> Google Cal</span>}
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-blue-900/30 border border-blue-500/50 rounded-sm" /> Corporate</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-pink-900/30 border border-pink-500/50 rounded-sm" /> Wedding</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-purple-900/30 border border-purple-500/50 rounded-sm" /> Private</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-amber-900/30 border border-amber-500/50 rounded-sm" /> Parlor</span>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Selected Date Details */}
          {selectedDate && selectedDeals && (
            <div className="border border-accent/40 p-4 space-y-3">
              <h3 className="font-sans text-[10px] tracking-[0.15em] uppercase text-accent">
                {format(new Date(selectedDate + "T12:00:00"), "EEEE, MMMM d, yyyy")}
              </h3>
              {selectedDeals.booked.map(d => renderDealDetail(d, false))}
              {selectedDeals.holds.map(d => renderDealDetail(d, true))}
              {selectedDeals.gcal?.map(ev => {
                const time = ev.start && ev.start.length > 10 ? to12Hour(ev.start) : "All day";
                const endTime = ev.end && ev.end.length > 10 ? to12Hour(ev.end) : "";
                const isUntitled = ev.summary === "(No title)";
                const displayName = isUntitled ? (ev.allDay ? "Busy (All Day)" : `Personal Event`) : ev.summary;
                return (
                  <div key={ev.id} className="border border-sky-500/30 bg-sky-900/10 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">📅</span>
                        <div>
                          <p className="font-sans text-sm text-foreground font-medium">{displayName}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {time}{endTime && ` – ${endTime}`}
                            {isUntitled && " · Details hidden"}
                          </p>
                        </div>
                      </div>
                      <span className="text-[8px] font-sans tracking-[0.15em] uppercase text-sky-400 bg-sky-500/15 px-2 py-0.5">GCAL</span>
                    </div>
                    {ev.location && <p className="flex items-center gap-1.5 text-muted-foreground text-[12px] mt-2"><MapPin size={12} /> {ev.location}</p>}
                    {ev.description && <p className="text-muted-foreground/70 text-[12px] italic mt-1 line-clamp-3">"{ev.description}"</p>}
                    {ev.htmlLink && (
                      <a href={ev.htmlLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-sans tracking-[0.12em] uppercase text-sky-400 hover:text-sky-300 transition-colors mt-2">
                        <ExternalLink size={11} /> Open in Google Calendar
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Upcoming Shows */}
          <div className="border border-border p-4">
            <h3 className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-3">
              Upcoming Shows <span className="text-emerald-500">●</span>
            </h3>
            {upcomingBooked.length === 0 ? (
              <p className="text-muted-foreground text-sm">No upcoming booked shows</p>
            ) : (
              <div className="space-y-2">
                {upcomingBooked.map(d => renderDealDetail(d, false))}
              </div>
            )}
          </div>

          {/* Holds */}
          <div className="border border-dashed border-[#C9A96E]/40 p-4">
            <h3 className="font-sans text-[10px] tracking-[0.15em] uppercase text-[#C9A96E] mb-3">
              Hold Dates <span className="text-[#C9A96E]">●</span>
            </h3>
            {upcomingHolds.length === 0 ? (
              <p className="text-muted-foreground text-sm">No pending holds</p>
            ) : (
              <div className="space-y-2">
                {upcomingHolds.map(d => renderDealDetail(d, true))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="border border-border p-4 text-center">
          <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1">Upcoming</p>
          <p className="font-serif text-2xl text-foreground">{bookedDeals.filter(d => d.event_date! >= today).length}</p>
          <p className="text-[10px] text-muted-foreground">confirmed shows</p>
        </div>
        <div className="border border-border p-4 text-center">
          <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1">Holds</p>
          <p className="font-serif text-2xl text-[#C9A96E]">{holdDeals.filter(d => d.event_date! >= today).length}</p>
          <p className="text-[10px] text-muted-foreground">pending dates</p>
        </div>
        <div className="border border-border p-4 text-center">
          <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1">This Month</p>
          <p className="font-serif text-2xl text-foreground">
            {bookedDeals.filter(d => d.event_date?.startsWith(format(currentMonth, "yyyy-MM"))).length}
          </p>
          <p className="text-[10px] text-muted-foreground">shows</p>
        </div>
        <div className="border border-border p-4 text-center">
          <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1">Booked Revenue</p>
          <p className="font-serif text-2xl text-accent">
            {formatCurrency(bookedDeals.filter(d => d.event_date! >= today).reduce((s, d) => s + (d.deal_value || 0), 0)) || "$0"}
          </p>
          <p className="text-[10px] text-muted-foreground">upcoming</p>
        </div>
      </div>
    </div>
  );
};

export default CampaignCalendarTab;
