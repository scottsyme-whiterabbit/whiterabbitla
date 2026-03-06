import { useState, useMemo } from "react";
import { Download, ExternalLink, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, MapPin, Users, Phone, Mail, FileText } from "lucide-react";

interface BookedDeal {
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
}

interface ShowCalendarProps {
  deals: BookedDeal[];
  onOpenDeal?: (dealId: string) => void;
}

const HOLD_STAGES = ["new", "contacted", "negotiating", "proposal_sent"];

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

const generateGoogleCalendarUrl = (deal: BookedDeal): string => {
  const title = encodeURIComponent(`Show: ${deal.contact_name || deal.company || deal.contact_email}`);
  const location = encodeURIComponent(deal.location || "");
  const details = encodeURIComponent(
    [
      deal.company && `Company: ${deal.company}`,
      deal.event_type && `Type: ${deal.event_type}`,
      deal.guest_count && `Guests: ${deal.guest_count}`,
      deal.deal_value && `Value: ${formatCurrency(deal.deal_value)}`,
      `Contact: ${deal.contact_email}`,
    ].filter(Boolean).join("\n")
  );

  // Build date/time
  const date = deal.event_date!.replace(/-/g, "");
  let dates: string;
  if (deal.event_time) {
    const time = deal.event_time.replace(/:/g, "").slice(0, 4) + "00";
    // End time = 2 hours later
    const startH = parseInt(deal.event_time.split(":")[0]);
    const endH = String(Math.min(startH + 2, 23)).padStart(2, "0");
    const endTime = `${endH}${deal.event_time.split(":")[1]}00`;
    dates = `${date}T${time}/${date}T${endTime}`;
  } else {
    dates = `${date}/${date}`;
  }

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&location=${location}&details=${details}`;
};

const generateICS = (deal: BookedDeal): string => {
  const date = deal.event_date!.replace(/-/g, "");
  let dtstart: string;
  let dtend: string;

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
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//White Rabbit//Show Calendar//EN",
    "BEGIN:VEVENT",
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:Show: ${deal.contact_name || deal.company || deal.contact_email}`,
    `LOCATION:${deal.location || ""}`,
    `DESCRIPTION:${description}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
};

const downloadICS = (deal: BookedDeal) => {
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

const ShowCalendar = ({ deals, onOpenDeal }: ShowCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const bookedDeals = useMemo(
    () => deals.filter(d => (d.stage === "booked" || d.stage === "completed") && d.event_date),
    [deals]
  );

  const holdDeals = useMemo(
    () => deals.filter(d => HOLD_STAGES.includes(d.stage) && d.event_date),
    [deals]
  );

  const bookedDates = useMemo(() => {
    const map = new Map<string, BookedDeal[]>();
    bookedDeals.forEach(d => {
      const key = d.event_date!;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    });
    return map;
  }, [bookedDeals]);

  const holdDates = useMemo(() => {
    const map = new Map<string, BookedDeal[]>();
    holdDeals.forEach(d => {
      const key = d.event_date!;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    });
    return map;
  }, [holdDeals]);

  const { year, month } = currentMonth;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [firstDay, daysInMonth]);

  const prevMonth = () => {
    setCurrentMonth(prev => prev.month === 0
      ? { year: prev.year - 1, month: 11 }
      : { year: prev.year, month: prev.month - 1 }
    );
  };

  const nextMonth = () => {
    setCurrentMonth(prev => prev.month === 11
      ? { year: prev.year + 1, month: 0 }
      : { year: prev.year, month: prev.month + 1 }
    );
  };

  const monthName = new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Upcoming shows list
  const upcoming = bookedDeals
    .filter(d => d.event_date! >= today)
    .sort((a, b) => a.event_date!.localeCompare(b.event_date!))
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="text-muted-foreground hover:text-foreground p-1"><ChevronLeft size={18} /></button>
            <h3 className="font-serif text-lg text-foreground">{monthName}</h3>
            <button onClick={nextMonth} className="text-muted-foreground hover:text-foreground p-1"><ChevronRight size={18} /></button>
          </div>
          <div className="grid grid-cols-7 gap-px">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="text-center font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground py-2">{d}</div>
            ))}
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} className="h-20" />;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const showsOnDay = bookedDates.get(dateStr);
              const holdsOnDay = holdDates.get(dateStr);
              const isToday = dateStr === today;
              const isBooked = !!showsOnDay;
              const hasHolds = !!holdsOnDay;

              return (
                <div
                  key={dateStr}
                  className={`h-20 border p-1 relative transition-colors overflow-hidden ${
                    isBooked ? "bg-emerald-900/20 border-emerald-600/40" :
                    hasHolds ? "bg-[#C9A96E]/10 border-dashed border-[#C9A96E]/50" :
                    "border-border/50"
                  } ${isToday ? "ring-1 ring-accent" : ""}`}
                >
                  <span className={`text-xs font-sans ${isToday ? "text-accent font-bold" : "text-muted-foreground"}`}>{day}</span>
                  {showsOnDay?.map(deal => (
                    <div key={deal.id} onClick={() => onOpenDeal?.(deal.id)} className="mt-0.5 bg-emerald-900/30 border border-emerald-600/40 px-1 py-0.5 text-[9px] text-foreground truncate rounded-sm cursor-pointer hover:bg-emerald-900/50" title={deal.contact_name || deal.contact_email}>
                      {EVENT_EMOJIS[deal.event_type || "other"] || "✨"} {deal.event_time?.slice(0, 5) || ""} {deal.contact_name?.split(" ")[0] || deal.company || "Show"}
                    </div>
                  ))}
                  {holdsOnDay?.map(deal => (
                    <div key={deal.id} onClick={() => onOpenDeal?.(deal.id)} className="mt-0.5 bg-[#C9A96E]/15 border border-dashed border-[#C9A96E]/50 px-1 py-0.5 text-[9px] text-[#C9A96E] truncate rounded-sm cursor-pointer hover:bg-[#C9A96E]/25" title={`HOLD: ${deal.contact_name || deal.contact_email}`}>
                      🔒 HOLD: {deal.contact_name?.split(" ")[0] || deal.company || "TBD"}
                    </div>
                  ))}
                  {isBooked && (
                    <div className="absolute top-1 right-1">
                      <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full" />
                    </div>
                  )}
                  {hasHolds && !isBooked && (
                    <div className="absolute top-1 right-1">
                      <span className="inline-block w-2 h-2 bg-[#C9A96E]/60 rounded-full" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Shows Sidebar */}
        <div className="border border-border p-4">
          <h3 className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-4">Upcoming Shows</h3>
          {upcoming.length === 0 ? (
            <p className="text-muted-foreground text-sm">No upcoming booked shows</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map(deal => (
                <div key={deal.id} className="border border-border p-3 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span>{EVENT_EMOJIS[deal.event_type || "other"] || "✨"}</span>
                    <span className="font-sans text-sm text-foreground font-medium">{deal.contact_name || deal.company || deal.contact_email}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground space-y-0.5">
                    <p>{new Date(deal.event_date! + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      {deal.event_time && ` at ${deal.event_time.slice(0, 5)}`}
                    </p>
                    {deal.location && <p>📍 {deal.location}</p>}
                    {deal.deal_value && <p className="text-accent font-mono">{formatCurrency(deal.deal_value)}</p>}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <a
                      href={generateGoogleCalendarUrl(deal)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] font-sans tracking-[0.1em] uppercase text-muted-foreground hover:text-accent transition-colors"
                    >
                      <ExternalLink size={10} /> Google
                    </a>
                    <button
                      onClick={() => downloadICS(deal)}
                      className="flex items-center gap-1 text-[10px] font-sans tracking-[0.1em] uppercase text-muted-foreground hover:text-accent transition-colors"
                    >
                      <Download size={10} /> Apple / iCal
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs font-sans text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-900/30 border border-emerald-600/40 rounded-sm" /> Confirmed</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#C9A96E]/15 border border-dashed border-[#C9A96E]/50 rounded-sm" /> Hold Date</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="border border-border p-4 text-center">
          <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1">Booked Shows</p>
          <p className="font-serif text-2xl text-foreground">{bookedDeals.filter(d => d.event_date! >= today).length}</p>
          <p className="text-[10px] text-muted-foreground">upcoming</p>
        </div>
        <div className="border border-border p-4 text-center">
          <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1">Hold Dates</p>
          <p className="font-serif text-2xl text-[#C9A96E]">{holdDeals.filter(d => d.event_date! >= today).length}</p>
          <p className="text-[10px] text-muted-foreground">pending</p>
        </div>
        <div className="border border-border p-4 text-center">
          <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1">This Month</p>
          <p className="font-serif text-2xl text-foreground">
            {bookedDeals.filter(d => d.event_date?.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)).length}
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

export default ShowCalendar;
