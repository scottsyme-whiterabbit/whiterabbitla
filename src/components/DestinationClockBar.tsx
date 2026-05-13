import { useEffect, useState } from "react";

const cities = [
  { name: "Los Angeles", tz: "America/Los_Angeles" },
  { name: "Aspen", tz: "America/Denver" },
  { name: "Jackson Hole", tz: "America/Denver" },
  { name: "The Hamptons", tz: "America/New_York" },
  { name: "Montecito", tz: "America/Los_Angeles" },
];

const formatTime = (tz: string, now: Date) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(now);

const DestinationClockBar = () => {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const msToNextMinute = 60000 - (Date.now() % 60000);
    const timeout = setTimeout(() => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), 60000);
    }, msToNextMinute);
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-forest-dark border-b border-white/5 h-14 md:h-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-full flex items-center justify-center md:justify-center relative">
        {/* Label — hidden on very small screens, visible on larger mobile */}
        <span className="hidden sm:inline font-sans text-[11px] tracking-[0.2em] uppercase text-cream/40 mr-4 md:mr-6 shrink-0">
          Checked In At
        </span>

      {/* Desktop + Tablet: single row */}
      <div className="hidden md:flex items-center">
        {cities.map((c, i) => (
          <div key={c.name} className="flex items-center">
            <span className="font-sans text-[11px] tracking-[0.15em] uppercase text-cream/50 whitespace-nowrap">
              {c.name} <span className="tabular-nums text-cream/70">{formatTime(c.tz, now)}</span>
            </span>
            {i < cities.length - 1 && (
              <span className="mx-3 lg:mx-4 text-cream/20" aria-hidden="true">·</span>
            )}
          </div>
        ))}
      </div>

      {/* Mobile: 2-row stack */}
      <div className="md:hidden flex flex-col items-center justify-center gap-y-0.5 w-full">
        <div className="flex items-center justify-center gap-x-3">
          {cities.slice(0, 2).map((c, i) => (
            <span key={c.name} className="font-sans text-[10px] tracking-[0.15em] uppercase text-cream/50 whitespace-nowrap">
              {c.name} <span className="tabular-nums text-cream/70">{formatTime(c.tz, now)}</span>
              {i === 0 && <span className="ml-3 text-cream/20" aria-hidden="true">·</span>}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-center gap-x-3">
          {cities.slice(2).map((c, i) => (
            <span key={c.name} className="font-sans text-[10px] tracking-[0.15em] uppercase text-cream/50 whitespace-nowrap">
              {c.name} <span className="tabular-nums text-cream/70">{formatTime(c.tz, now)}</span>
              {i < 2 && <span className="ml-3 text-cream/20" aria-hidden="true">·</span>}
            </span>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
};

export default DestinationClockBar;
