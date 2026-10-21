import { useEffect, useState } from "react";
import { emailTypeLabel, fmtPacific, sentStatus, type ScheduledEmail, type SentEmail } from "@/lib/emailTimeline";

type Props = { dealId: string; callAdmin: (action: string, payload?: Record<string, unknown>) => Promise<any> };

const EmailTimeline = ({ dealId, callAdmin }: Props) => {
  const [data, setData] = useState<{ sent: SentEmail[]; upcoming: ScheduledEmail[] } | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let live = true;
    setData(null); setError(false);
    callAdmin("get_email_timeline", { dealId }).then((r) => live && setData(r)).catch(() => live && setError(true));
    return () => { live = false; };
  }, [dealId, callAdmin]);

  if (error) return <p className="text-sm text-muted-foreground">The email timeline could not load.</p>;
  if (!data) return <p className="text-sm text-muted-foreground">Loading emails...</p>;
  return (
    <div className="space-y-4">
      <div>
        <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-accent mb-2">Upcoming</p>
        {data.upcoming.length === 0 ? <p className="text-sm text-muted-foreground">Nothing scheduled.</p> : (
          <ul className="divide-y divide-border border border-border">
            {data.upcoming.map((u, i) => (
              <li key={i} className="p-3 text-sm flex flex-wrap justify-between gap-2">
                <span className="text-foreground min-w-0 break-words">{u.label}{u.tentative ? <span className="text-xs text-muted-foreground"> ({u.note})</span> : null}</span>
                <span className="text-xs text-muted-foreground">{fmtPacific(u.planned_at, false)}{u.blocked_reason ? <span className="ml-2 text-destructive uppercase tracking-[0.1em]">Will be blocked: {u.blocked_reason.replace(/_/g, " ")}</span> : null}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-accent mb-2">Sent</p>
        {data.sent.length === 0 ? <p className="text-sm text-muted-foreground">No sent emails recorded.</p> : (
          <ul className="divide-y divide-border border border-border">
            {data.sent.map((e) => (
              <li key={e.id} className="p-3 text-sm space-y-1">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="text-foreground min-w-0 break-words">{emailTypeLabel(e.email_type)}</span>
                  <span className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{sentStatus(e)}</span>
                </div>
                {e.subject && <p className="text-xs text-foreground/80 break-words">{e.subject}</p>}
                <p className="text-xs text-muted-foreground break-all">
                  {e.recipient} · {e.provider === "gmail" ? "Gmail" : "Resend"} · {e.approximate_time ? "about " : ""}{fmtPacific(e.sent_at)}
                  {e.backfilled ? " · reconstructed" : ""}
                  {e.possible_duplicate ? <span className="ml-2 text-destructive uppercase tracking-[0.1em]">Possible duplicate</span> : null}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
export default EmailTimeline;
