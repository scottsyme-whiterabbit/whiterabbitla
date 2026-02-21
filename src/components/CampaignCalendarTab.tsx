import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay } from "date-fns";

interface Campaign {
  id: string;
  subject: string;
  status: string;
  campaign_type: string;
  sent_count: number;
  created_at: string;
}

interface SendLogEntry {
  campaign_id: string;
  sent_at: string;
}

interface Props {
  campaigns: Campaign[];
  sendLog: SendLogEntry[];
}

const CampaignCalendarTab = ({ campaigns, sendLog }: Props) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const startDayOffset = getDay(startOfMonth(currentMonth));

  // Map dates to campaigns/sends
  const dateEvents = useMemo(() => {
    const map = new Map<string, { campaigns: Campaign[]; sends: number }>();

    campaigns.forEach(c => {
      const dateKey = format(new Date(c.created_at), "yyyy-MM-dd");
      const entry = map.get(dateKey) || { campaigns: [], sends: 0 };
      entry.campaigns.push(c);
      map.set(dateKey, entry);
    });

    sendLog.forEach(s => {
      const dateKey = format(new Date(s.sent_at), "yyyy-MM-dd");
      const entry = map.get(dateKey) || { campaigns: [], sends: 0 };
      entry.sends++;
      map.set(dateKey, entry);
    });

    return map;
  }, [campaigns, sendLog]);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectedEvents = selectedDate ? dateEvents.get(selectedDate) : null;

  return (
    <div className="space-y-6">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="text-muted-foreground hover:text-foreground p-2">
          <ChevronLeft size={20} />
        </button>
        <h2 className="font-serif text-2xl text-foreground">{format(currentMonth, "MMMM yyyy")}</h2>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="text-muted-foreground hover:text-foreground p-2">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
          <div key={d} className="text-center font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground py-2">{d}</div>
        ))}

        {/* Empty cells for offset */}
        {Array.from({ length: startDayOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Day cells */}
        {daysInMonth.map(day => {
          const dateKey = format(day, "yyyy-MM-dd");
          const events = dateEvents.get(dateKey);
          const isToday = isSameDay(day, new Date());
          const isSelected = selectedDate === dateKey;
          const hasCampaigns = events && events.campaigns.length > 0;
          const hasSends = events && events.sends > 0;

          return (
            <button
              key={dateKey}
              onClick={() => setSelectedDate(isSelected ? null : dateKey)}
              className={`aspect-square border transition-colors relative flex flex-col items-center justify-center gap-0.5 ${
                isSelected ? "border-accent bg-accent/10" :
                isToday ? "border-accent/50" :
                "border-border/30 hover:border-border"
              }`}
            >
              <span className={`font-sans text-sm ${isToday ? "text-accent font-medium" : "text-foreground"}`}>
                {format(day, "d")}
              </span>
              {(hasCampaigns || hasSends) && (
                <div className="flex gap-0.5">
                  {hasCampaigns && events.campaigns.map((c, i) => (
                    <span key={i} className={`w-1.5 h-1.5 rounded-full ${
                      c.status === "sent" ? "bg-green-500" :
                      c.status === "sending" ? "bg-yellow-500" :
                      "bg-blue-500"
                    }`} />
                  ))}
                  {hasSends && !hasCampaigns && (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent/60" />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs font-sans text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Sent</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Sending</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Draft</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent/60" /> Drip Sends</span>
      </div>

      {/* Selected date detail */}
      {selectedDate && selectedEvents && (
        <div className="border border-border p-4 space-y-3">
          <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-accent">
            {format(new Date(selectedDate), "EEEE, MMMM d, yyyy")}
          </h3>
          {selectedEvents.campaigns.map(c => (
            <div key={c.id} className="flex items-center justify-between text-sm">
              <span className="text-foreground">{c.subject}</span>
              <div className="flex gap-2 items-center">
                <span className={`text-xs px-2 py-0.5 ${
                  c.status === "sent" ? "bg-green-900/30 text-green-400" :
                  c.status === "sending" ? "bg-yellow-900/30 text-yellow-400" :
                  "bg-blue-900/30 text-blue-400"
                }`}>{c.status}</span>
                {c.sent_count > 0 && <span className="text-xs text-muted-foreground">{c.sent_count} sent</span>}
              </div>
            </div>
          ))}
          {selectedEvents.sends > 0 && (
            <p className="text-xs text-muted-foreground">{selectedEvents.sends} automated drip email{selectedEvents.sends > 1 ? "s" : ""} sent</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CampaignCalendarTab;
