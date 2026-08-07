// Daily invoice reminder engine.
// 1) Unpaid invoices: up to 4 reminders, one per day, until the deposit or the
//    full amount is paid.
// 2) Deposit-paid invoices: 3 balance reminders before the event
//    (21, 10 and 3 days out).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
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

const MAX_INITIAL_REMINDERS = 4;
const BALANCE_DAYS_OUT = [7, 3, 0];
const MIN_HOURS_BETWEEN = 20;

const hoursSince = (ts: string | null) =>
  ts ? (Date.now() - new Date(ts).getTime()) / 36e5 : Infinity;

const daysUntil = (date: string | null) => {
  if (!date) return null;
  const d = new Date(`${date}T12:00:00Z`).getTime();
  if (!isFinite(d)) return null;
  return Math.ceil((d - Date.now()) / 864e5);
};

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

  for (const row of data || []) {
    const inv = row as unknown as Invoice & {
      initial_reminders_sent: number; last_reminder_at: string | null;
      balance_reminders_sent: number; last_balance_reminder_at: string | null;
      anticipation_sent: number; last_anticipation_at: string | null;
      sent_at: string | null;
      pending_session_id: string | null; pending_since: string | null;
      pending_alert_sent_at: string | null;
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

    if (!inv.client_email) { results.skipped++; continue; }

    try {
      // --- Unpaid: daily reminders, max 4 ---
      if (inv.status === "open") {
        // Never nag while a payment is already clearing.
        if (inv.pending_session_id) { results.skipped++; continue; }
        if (inv.initial_reminders_sent >= MAX_INITIAL_REMINDERS) { results.skipped++; continue; }
        const anchor = inv.last_reminder_at || inv.sent_at;
        if (hoursSince(anchor) < MIN_HOURS_BETWEEN) { results.skipped++; continue; }

        const n = inv.initial_reminders_sent + 1;
        if (!dryRun) {
          const { subject, html } = reminderEmail(inv, n);
          const ok = await sendEmail(inv.client_email, subject, html);
          if (!ok) { results.errors.push(`send failed ${inv.id}`); continue; }
          await supabase.from("event_invoices").update({
            initial_reminders_sent: n,
            last_reminder_at: new Date().toISOString(),
          }).eq("id", inv.id);
        }
        results.unpaid_reminders++;
        continue;
      }

      // --- Confirmed bookings: pre-event anticipation notes (windowed) ---
      if (inv.status === "deposit_paid" || inv.status === "paid") {
        const days = daysUntil(inv.event_date);
        if (days !== null && days >= 0 && hoursSince(inv.last_anticipation_at) >= MIN_HOURS_BETWEEN) {
          const sent = inv.anticipation_sent || 0;
          const FAR = 1, NEAR = 2;
          let bit = 0;
          // "Two weeks to go" note: only with real runway (8-14 days out)
          if (!(sent & FAR) && days >= 8 && days <= 14) bit = FAR;
          // "See you tomorrow" note: the day before (0-1 days out)
          else if (!(sent & NEAR) && days <= 1) bit = NEAR;
          if (bit) {
            if (!dryRun) {
              const { subject, html } = anticipationEmail(inv, days);
              const ok = await sendEmail(inv.client_email, subject, html);
              if (ok) {
                await supabase.from("event_invoices").update({
                  anticipation_sent: sent | bit,
                  last_anticipation_at: new Date().toISOString(),
                }).eq("id", inv.id);
                results.anticipation_reminders++;
              } else {
                results.errors.push(`anticipation send failed ${inv.id}`);
              }
            } else {
              results.anticipation_reminders++;
            }
          }
        }
      }


      // --- Deposit paid: 3 pre-event balance reminders ---
      if (inv.status === "deposit_paid") {
        const days = daysUntil(inv.event_date);
        if (days === null || days < 0) { results.skipped++; continue; }
        const sentCount = inv.balance_reminders_sent || 0;
        if (sentCount >= BALANCE_DAYS_OUT.length) { results.skipped++; continue; }
        // Fire whenever we've crossed the next threshold in the schedule.
        const nextThreshold = BALANCE_DAYS_OUT[sentCount];
        if (days > nextThreshold) { results.skipped++; continue; }
        if (hoursSince(inv.last_balance_reminder_at) < MIN_HOURS_BETWEEN) { results.skipped++; continue; }

        if (!dryRun) {
          const { subject, html } = balanceReminderEmail(inv, days);
          const ok = await sendEmail(inv.client_email, subject, html);
          if (!ok) { results.errors.push(`send failed ${inv.id}`); continue; }
          await supabase.from("event_invoices").update({
            balance_reminders_sent: sentCount + 1,
            last_balance_reminder_at: new Date().toISOString(),
          }).eq("id", inv.id);
        }
        results.balance_reminders++;
      }
    } catch (e) {
      results.errors.push(`${inv.id}: ${(e as Error).message}`);
    }
  }

  return new Response(JSON.stringify({ success: true, dryRun, ...results }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
