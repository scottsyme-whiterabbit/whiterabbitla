import { useCallback, useEffect, useState } from "react";
import { emailTypeLabel, fmtPacific, sortSchedule, type ScheduledEmail } from "@/lib/emailTimeline";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const EmailScheduleTab = ({ adminPassword }: { adminPassword: string }) => {
  const [rows, setRows] = useState<ScheduledEmail[] | null>(null);
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const [error, setError] = useState(false);
  const load = useCallback(async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/newsletter-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ action: "get_email_schedule", adminPassword, days: 30 }),
      });
      if (!res.ok) throw new Error("failed");
      setRows((await res.json()).upcoming || []);
    } catch { setError(true); }
  }, [adminPassword]);
  useEffect(() => { load(); }, [load]);

  if (error) return <p className="text-sm text-muted-foreground">The email schedule could not load.</p>;
  if (!rows) return <p className="text-sm text-muted-foreground">Loading schedule...</p>;
  const sorted = sortSchedule(rows, dir);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl text-foreground">Email schedule, next 30 days</h2>
        <button onClick={() => setDir(dir === "asc" ? "desc" : "asc")} className="text-xs uppercase tracking-[0.1em] border border-border px-3 py-2 text-muted-foreground hover:text-foreground">
          Date {dir === "asc" ? "earliest first" : "latest first"}
        </button>
      </div>
      {sorted.length === 0 ? <p className="text-sm text-muted-foreground">No client emails scheduled.</p> : (
        <table className="w-full text-sm border border-border">
          <thead><tr className="text-left text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            <th className="p-2">Date (Pacific)</th><th className="p-2">Client</th><th className="p-2">Email</th><th className="p-2">Status</th>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {sorted.map((r, i) => (
              <tr key={i}>
                <td className="p-2 whitespace-nowrap">{fmtPacific(r.planned_at, false)}</td>
                <td className="p-2">{r.contact_name || r.recipient}</td>
                <td className="p-2">{emailTypeLabel(r.type)}{r.tentative ? <span className="text-xs text-muted-foreground"> ({r.note})</span> : null}</td>
                <td className="p-2 text-xs">{r.blocked_reason ? <span className="text-destructive">Will be blocked: {r.blocked_reason.replace(/_/g, " ")}</span> : "Scheduled"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
export default EmailScheduleTab;
