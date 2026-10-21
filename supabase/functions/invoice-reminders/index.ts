// Daily invoice reminder engine.
// 1) Unpaid invoices: up to 4 reminders, one per day, until the deposit or the
//    full amount is paid.
// 2) Deposit-paid invoices: 3 balance reminders, 7 days out, 2 days out, and the
//    day of the event, only while the balance is unpaid, at least 20 hours apart.
// Holiday shift: if tomorrow in America/Los_Angeles is Thanksgiving (4th Thursday
// of November), Christmas Day or New Year's Day, the 7 and 2 day balance
// reminders and the "Two weeks to go" anticipation note are evaluated one day
// early (days - 1), so a send that would land on the holiday goes out today
// instead. The "See you tomorrow" anticipation note and the day of balance
// reminder are never shifted: that note reads "Tomorrow's the day", so shifting
// it would send it two days early. Step counters and the 20 hour spacing
// still stop the holiday-day run from sending again, and each run sends at
// most one step per type.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { invoiceDecisions, isShiftHoliday, pacificYmd as pacificYmdAt } from "../_shared/email-schedule.ts";
import {
  type Invoice, anticipationEmail, balanceReminderEmail, reminderEmail, sendEmail,
} from "../_shared/invoice-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const hoursSince = (ts: string | null) =>
  ts ? (Date.now() - new Date(ts).getTime()) / 36e5 : Infinity;

// YYYY-MM-DD for "now + offsetDays" in Pacific time.
const pacificYmd = (offsetDays: number) => pacificYmdAt(Date.now(), offsetDays);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const secret = Deno.env.get("CRON_SECRET") || "";
  const adminPassword = Deno.env.get("ADMIN_PASSWORD") || "";
  const body = await req.json().catch(() => ({} as any));
  const authorized =
    (secret && req.headers.get("x-cron-secret") === secret) ||
    (adminPassword && body?.adminPassword === adminPassword);
  if (!authorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const dryRun = body?.dryRun === true;
  const results = { unpaid_reminders: 0, balance_reminders: 0, anticipation_reminders: 0, stuck_payment_alerts: 0, skipped: 0, errors: [] as string[] };

  const { data, error } = await supabase
    .from("event_invoices")
    .select("*")
    .in("status", ["open", "deposit_paid", "paid"])
    .limit(500);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const holidayTomorrow = isShiftHoliday(pacificYmd(1));

  for (const row of data || []) {
    const inv = row as unknown as Invoice & {
      initial_reminders_sent: number; last_reminder_at: string | null;
      balance_reminders_sent: number; last_balance_reminder_at: string | null;
      anticipation_sent: number; last_anticipation_at: string | null;
      sent_at: string | null;
      pending_session_id: string | null; pending_since: string | null;
      pending_alert_sent_at: string | null;
      client_emails_paused: boolean | null;
    };


    // --- Stuck payment: a bank transfer still not cleared after 6 days ---
    if (inv.pending_session_id && inv.pending_since && !inv.pending_alert_sent_at) {
      const days = Math.floor(hoursSince(inv.pending_since) / 24);
      if (days >= 6) {
        try {
          if (!dryRun) {
            const link = `https://whiterabbitla.com/pay/${inv.pay_token}`;
            const ok = await sendEmail(
              "scott.syme@whiterabbitla.com",
              `[Action needed] A payment has been processing for ${days} days`,
              `<p>A payment has been processing for ${days} days.</p><p>Client: ${inv.client_name || "unknown"}<br/>Experience: ${inv.tier_name || "n/a"}</p><p>Check Stripe.</p><p><a href="${link}">${link}</a></p>`,
            );
            if (ok) {
              await supabase.from("event_invoices").update({
                pending_alert_sent_at: new Date().toISOString(),
              }).eq("id", inv.id);
              results.stuck_payment_alerts++;
            }
          } else {
            results.stuck_payment_alerts++;
          }
        } catch (e) {
          results.errors.push(`stuck alert ${inv.id}: ${(e as Error).message}`);
        }
      }
    }

    // Client emails paused (typically settled outside Stripe): no client-facing
    // sends at all. The Scott-facing stuck-payment alert above still runs.
    if (inv.client_emails_paused) { results.skipped++; continue; }

    if (!inv.client_email) { results.skipped++; continue; }


    try {
      // Decisions come from the shared pure rules so the admin email schedule
      // preview reads exactly what this run will do.
      const decisions = invoiceDecisions(inv, Date.now(), holidayTomorrow);
      if (!decisions.length) { results.skipped++; continue; }
      for (const d of decisions) {
        if (d.kind === "initial") {
          if (!dryRun) {
            const { subject, html } = reminderEmail(inv, d.n);
            const ok = await sendEmail(inv.client_email, subject, html);
            if (!ok) { results.errors.push(`send failed ${inv.id}`); break; }
            await supabase.from("event_invoices").update({
              initial_reminders_sent: d.n,
              last_reminder_at: new Date().toISOString(),
            }).eq("id", inv.id);
          }
          results.unpaid_reminders++;
        } else if (d.kind === "anticipation") {
          if (!dryRun) {
            const { subject, html } = anticipationEmail(inv, d.days);
            const ok = await sendEmail(inv.client_email, subject, html);
            if (ok) {
              await supabase.from("event_invoices").update({
                anticipation_sent: (inv.anticipation_sent || 0) | d.bit,
                last_anticipation_at: new Date().toISOString(),
              }).eq("id", inv.id);
              results.anticipation_reminders++;
            } else {
              results.errors.push(`anticipation send failed ${inv.id}`);
            }
          } else {
            results.anticipation_reminders++;
          }
        } else {
          if (!dryRun) {
            const { subject, html } = balanceReminderEmail(inv, d.days);
            const ok = await sendEmail(inv.client_email, subject, html);
            if (!ok) { results.errors.push(`send failed ${inv.id}`); break; }
            await supabase.from("event_invoices").update({
              balance_reminders_sent: d.nextCount,
              last_balance_reminder_at: new Date().toISOString(),
            }).eq("id", inv.id);
          }
          results.balance_reminders++;
        }
      }
    } catch (e) {
      results.errors.push(`${inv.id}: ${(e as Error).message}`);
    }
  }

  return new Response(JSON.stringify({ success: true, dryRun, ...results }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
