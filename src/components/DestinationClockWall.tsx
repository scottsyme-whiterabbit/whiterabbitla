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

const DestinationClockWall = () => {
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
    <section className="bg-background py-20">
      <div className="max-w-5xl mx-auto px-6">
        <p className="text-center font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-8">
          Checked In At
        </p>
        <div className="flex flex-col md:flex-row md:flex-wrap items-center justify-center gap-y-3 md:gap-y-0">
          {cities.map((c, i) => (
            <div key={c.name} className="flex items-center">
              <div className="font-sans text-[12px] md:text-[13px] tracking-[0.2em] uppercase text-muted-foreground whitespace-nowrap">
                <span>{c.name}</span>
                <span className="mx-2 text-muted-foreground/60">·</span>
                <span className="tabular-nums">{formatTime(c.tz, now)}</span>
              </div>
              {i < cities.length - 1 && (
                <span className="hidden md:inline mx-5 text-muted-foreground/40" aria-hidden="true">
                  •
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DestinationClockWall;
