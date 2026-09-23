import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isAdminRequest } from "../_shared/require-admin.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ---- Google Calendar push (booked deals → primary calendar) ----
const GCAL_GATEWAY = "https://connector-gateway.lovable.dev/google_calendar/calendar/v3";
const GCAL_TZ = "America/Los_Angeles";
const GCAL_BOOKED_STAGES = new Set(["booked", "completed"]);
// Tentative holds: a proposal is out with a date on it, so the night is blocked
// with a 🎩 HOLD event that gets upgraded in place to 🎩 BOOKED once they sign.
const GCAL_HOLD_STAGES = new Set(["proposal_sent", "negotiating", "on_hold"]);
const GCAL_CANCEL_STAGES = new Set(["lost"]);

// Pulls an end time out of free text the client typed, such as "6:00-9:00"
// or "7:30 to 9:00 PM". Returns minutes from midnight, or null when unsure.
function parsePerformanceEndMinutes(text: string | null): number | null {
  if (!text) return null;
  const tokens = [...text.matchAll(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?/gi)]
    .map((m) => ({
      hour: parseInt(m[1], 10),
      minute: m[2] ? parseInt(m[2], 10) : 0,
      meridiem: m[3] ? m[3].toLowerCase().replace(/\./g, "").charAt(0) : null,
    }))
    .filter((t) => t.hour >= 1 && t.hour <= 23 && t.minute < 60);
  if (tokens.length < 2) return null;
  const end = tokens[tokens.length - 1];
  let hour = end.hour;
  const meridiem = end.meridiem
    || tokens.map((t) => t.meridiem).filter(Boolean).pop()
    || (hour >= 1 && hour <= 11 ? "p" : null);
  if (meridiem === "p" && hour < 12) hour += 12;
  if (meridiem === "a" && hour === 12) hour = 0;
  if (hour > 23) return null;
  return hour * 60 + end.minute;
}

function computeEventTimes(eventDate: string, eventTime: string | null, performanceTime?: string | null) {
  // Returns { start, end } as {dateTime,timeZone} or {date} pair.
  if (eventTime && /^\d{2}:\d{2}/.test(eventTime)) {
    const startISO = `${eventDate}T${eventTime.length === 5 ? eventTime + ":00" : eventTime}`;
    const startDt = new Date(`${startISO}`);
    let endDt = new Date(startDt.getTime() + 2 * 60 * 60 * 1000); // default 2h
    const endMinutes = parsePerformanceEndMinutes(performanceTime ?? null);
    if (endMinutes !== null) {
      const candidate = new Date(startDt);
      candidate.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);
      if (candidate.getTime() > startDt.getTime()) endDt = candidate;
    }
    const pad = (n: number) => n.toString().padStart(2, "0");
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
    return {
      start: { dateTime: fmt(startDt), timeZone: GCAL_TZ },
      end: { dateTime: fmt(endDt), timeZone: GCAL_TZ },
    };
  }
  // All-day event
  const d = new Date(eventDate);
  const next = new Date(d.getTime() + 86400000);
  return {
    start: { date: eventDate },
    end: { date: next.toISOString().slice(0, 10) },
  };
}

async function syncDealToGoogleCalendar(supabase: any, dealId: string) {
  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GCAL_API_KEY = Deno.env.get("GOOGLE_CALENDAR_API_KEY_1");
    if (!LOVABLE_API_KEY || !GCAL_API_KEY) return;

    const { data: deal } = await supabase
      .from("deals")
      .select("id, stage, event_type, event_date, event_time, location, contact_name, contact_email, phone, company, guest_count, deal_value, notes, next_follow_up, calendar_event_id")
      .eq("id", dealId)
      .maybeSingle();
    if (!deal) return;

    const isBooked = GCAL_BOOKED_STAGES.has(deal.stage);
    const isHold = GCAL_HOLD_STAGES.has(deal.stage);

    // Deal died: pull the hold off the calendar so the night frees up again.
    if (GCAL_CANCEL_STAGES.has(deal.stage) && deal.calendar_event_id) {
      await fetch(
        `${GCAL_GATEWAY}/calendars/primary/events/${encodeURIComponent(deal.calendar_event_id)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": GCAL_API_KEY,
          },
        },
      ).catch(() => {});
      await supabase.from("deals").update({
        calendar_event_id: null,
        last_calendar_sync_at: new Date().toISOString(),
      }).eq("id", deal.id);
      return;
    }

    if (!isBooked && !isHold) return;
    if (!deal.event_date) return;

    const who = deal.contact_name || deal.contact_email || "Client";
    const eventTypeLabels: Record<string, string> = {
      corporate: "Corporate Event",
      wedding: "Wedding",
      private_party: "Private Party",
      parlor_show: "Parlor Show",
      other: "Event",
    };
    const eventLabel = eventTypeLabels[deal.event_type || "other"] || "Event";
    const stageLabels: Record<string, string> = {
      proposal_sent: "Proposal sent, awaiting signature",
      negotiating: "In conversation",
      on_hold: "On hold",
      booked: "Booked and confirmed",
      completed: "Completed",
    };

    // The proposal (if any) gives us the tier, the pricing and a link to open.
    let proposalSlug: string | null = null;
    let proposalHoldUntil: string | null = null;
    let proposalTiers: Array<{ name?: string; price?: string; recommended?: boolean }> = [];
    let signedTier: string | null = null;
    let performanceTime: string | null = null;
    let arrivalTime: string | null = null;
    let invoice: {
      total_cents: number;
      amount_paid_cents: number;
      status: string;
      payment_method: string | null;
    } | null = null;
    try {
      const { data: prop } = await supabase
        .from("proposals")
        .select("slug, tiers, sent_at, created_at, hold_until")
        .eq("deal_id", deal.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (prop) {
        proposalSlug = prop.slug || null;
        proposalTiers = Array.isArray(prop.tiers) ? prop.tiers : [];
        proposalHoldUntil = prop.hold_until || null;
      }
      const { data: agreement } = await supabase
        .from("signed_agreements")
        .select("tier_name, tier_price, signed_at, performance_time, arrival_time")
        .eq("deal_id", deal.id)
        .order("signed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (agreement) {
        signedTier = [agreement.tier_name, agreement.tier_price].filter(Boolean).join(" ") || null;
        performanceTime = agreement.performance_time || null;
        arrivalTime = agreement.arrival_time || null;
      }
      const { data: inv } = await supabase
        .from("event_invoices")
        .select("total_cents, amount_paid_cents, status, payment_method")
        .eq("deal_id", deal.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (inv) invoice = inv;
    } catch (_e) { /* enrichment is best effort */ }

    const times = computeEventTimes(deal.event_date, deal.event_time, performanceTime);
    const dollars = (cents: number) => `$${Math.round((cents || 0) / 100).toLocaleString()}`;
    const paymentLines = invoice
      ? [
        "",
        "Payment",
        `Total: ${dollars(invoice.total_cents)}`,
        `Paid: ${dollars(invoice.amount_paid_cents)}`,
        `Balance: ${dollars(Math.max((invoice.total_cents || 0) - (invoice.amount_paid_cents || 0), 0))}`,
        `Status: ${invoice.status}${invoice.payment_method ? `, ${invoice.payment_method}` : ""}`,
      ]
      : [];

    const summary = `${isBooked ? "🎩 BOOKED" : "🎩 HOLD"}: ${eventLabel} for ${who}${deal.company ? ` (${deal.company})` : ""}`;
    const proposalLine = proposalSlug ? `Proposal: https://whiterabbitla.com/proposal/${proposalSlug}` : null;
    const tierLine = signedTier
      ? `Experience: ${signedTier}`
      : proposalTiers.length
        ? `Quoted: ${proposalTiers.map((t) => `${t?.name || "Option"}${t?.price ? ` ${t.price}` : ""}`).join(" / ")}`
        : null;

    const descLines = [
      isBooked
        ? "Confirmed show. Everything below is pulled live from the White Rabbit CRM."
        : "Tentative hold while the proposal is out. This becomes BOOKED automatically once they sign and the deposit lands.",
      "",
      `Status: ${stageLabels[deal.stage] || deal.stage}`,
      !isBooked && proposalHoldUntil ? `Hold expires: ${proposalHoldUntil}` : null,
      `Occasion: ${eventLabel}`,
      deal.event_time ? `Start time: ${String(deal.event_time).slice(0, 5)}` : "Start time: to be confirmed",
      performanceTime ? `Performance: ${performanceTime}` : null,
      arrivalTime ? `Arrival: ${arrivalTime}` : null,
      deal.location ? `Venue: ${deal.location}` : "Venue: to be confirmed",
      deal.guest_count ? `Guests: ${deal.guest_count}` : null,
      "",
      `Client: ${who}`,
      deal.contact_email ? `Email: ${deal.contact_email}` : null,
      deal.phone ? `Phone: ${deal.phone}` : null,
      deal.company ? `Company: ${deal.company}` : null,
      "",
      tierLine,
      deal.deal_value ? `Value: $${(deal.deal_value / 100).toLocaleString()}` : null,
      ...paymentLines,
      invoice ? "" : null,
      proposalLine,
      deal.next_follow_up ? `Next follow up: ${deal.next_follow_up}` : null,
      deal.notes ? `\nNotes:\n${deal.notes}` : null,
      `\nWhite Rabbit CRM deal ${deal.id}`,
    ].filter((l) => l !== null && l !== undefined).join("\n");

    const body: Record<string, unknown> = {
      summary,
      location: deal.location || undefined,
      description: descLines,
      colorId: isBooked ? "10" : "5",
      transparency: "opaque",
      status: isBooked ? "confirmed" : "tentative",
      ...times,
    };

    const isUpdate = !!deal.calendar_event_id;
    const url = isUpdate
      ? `${GCAL_GATEWAY}/calendars/primary/events/${encodeURIComponent(deal.calendar_event_id)}`
      : `${GCAL_GATEWAY}/calendars/primary/events`;
    const res = await fetch(url, {
      method: isUpdate ? "PATCH" : "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GCAL_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const respBody = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error(`[gcal-push] ${res.status}:`, JSON.stringify(respBody).slice(0, 400));
      // If patch failed because event was deleted upstream, fall back to create
      if (isUpdate && res.status === 404) {
        const createRes = await fetch(`${GCAL_GATEWAY}/calendars/primary/events`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": GCAL_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
        const created = await createRes.json().catch(() => ({}));
        if (createRes.ok && created?.id) {
          await supabase.from("deals").update({
            calendar_event_id: created.id,
            last_calendar_sync_at: new Date().toISOString(),
          }).eq("id", deal.id);
        }
      }
      return;
    }
    if (!isUpdate && respBody?.id) {
      await supabase.from("deals").update({
        calendar_event_id: respBody.id,
        last_calendar_sync_at: new Date().toISOString(),
      }).eq("id", deal.id);
    } else if (isUpdate) {
      await supabase.from("deals").update({
        last_calendar_sync_at: new Date().toISOString(),
      }).eq("id", deal.id);
    }
  } catch (e) {
    console.error("[gcal-push] unexpected error:", e);
  }
}

// ---- Manually booked shows: give them the same client-facing emails ----
// A show marked booked by hand (comped, settled outside Stripe, invoiced
// elsewhere) has no event_invoices row, so the pre-event anticipation notes
// never fire. This creates a settled booking record for it: status "paid" and
// payment_method "external", so no payment nags or balance reminders can ever
// go out, only the "two weeks to go" and "see you tomorrow" notes. Post-show
// follow-up already runs off the calendar link, so it needs nothing here.
async function ensureBookedClientEmails(supabase: any, dealId: string) {
  try {
    const { data: deal } = await supabase
      .from("deals")
      .select("id, stage, contact_email, contact_name, company, event_type, event_date, location, deal_value")
      .eq("id", dealId)
      .maybeSingle();
    if (!deal) return;
    if (deal.stage !== "booked") return;
    if (!deal.event_date || !deal.contact_email) return;

    const { data: existing } = await supabase
      .from("event_invoices")
      .select("id")
      .eq("deal_id", deal.id)
      .limit(1);
    if (existing && existing.length) return;

    const total = typeof deal.deal_value === "number" ? deal.deal_value : 0;
    const nowIso = new Date().toISOString();
    const { error } = await supabase.from("event_invoices").insert({
      deal_id: deal.id,
      pay_token: crypto.randomUUID().replace(/-/g, ""),
      client_name: deal.contact_name || null,
      client_email: deal.contact_email,
      event_type: deal.event_type || null,
      event_date: deal.event_date,
      venue: deal.location || null,
      tier_name: null,
      total_cents: total,
      deposit_percent: 0,
      amount_paid_cents: total,
      status: "paid",
      environment: "external",
      payment_method: "external",
      external_note: "Marked booked manually in the pipeline; settled outside Stripe.",
      client_emails_paused: false,
      paid_in_full_at: nowIso,
      sent_at: nowIso,
    });
    if (error) {
      console.error("[booked-emails] insert failed:", error.message);
      return;
    }
    await supabase.from("deal_activity").insert({
      deal_id: deal.id,
      type: "note",
      title: "Marked booked manually — client emails enabled",
      body: "Pre-event notes and post-show follow-up will run as for any signed client. No payment reminders.",
      occurred_at: nowIso,
    });
  } catch (e) {
    console.error("[booked-emails] unexpected error:", e);
  }
}


/* ==========================================================================
   "Still interested?" re-engagement email.
   Same shell as proposal-followup. Sent only from an explicit list of ids
   chosen by hand in the dashboard. No cron, no automatic recipient selection.
   ========================================================================== */

const RE_LOGO_URL = "https://whiterabbitla.com/email-assets/wr-logo-stars.png";
const RE_GROUND = "#283932";
const RE_GOLD = "#C79A54";
const RE_CREAM = "#F8F6F1";
const RE_CREAM_SOFT = "#EDE9E1";
const RE_SAND = "#DDCEB1";
const RE_SAGE = "#7E9188";
const RE_BODY_FONT = "'Montserrat', Helvetica, Arial, sans-serif";
const RE_SITE_URL = "https://whiterabbitla.com";
const RE_FROM = "Scott Syme <scott.syme@whiterabbitla.com>";
const RE_REPLY_TO = "scott.syme@whiterabbitla.com";

const reEsc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const reFirstName = (name: string | null) =>
  (name || "there").trim().split(/\s+/)[0] || "there";

const reInquiryMonth = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", { month: "long", timeZone: "America/Los_Angeles" })
    : "";

function buildReengageEmail(inq: { name: string | null; event_type: string | null; created_at: string | null }) {
  const first = reFirstName(inq.name);
  const type = (inq.event_type || "").trim();
  const subject = type
    ? `${first}, is the ${type} still happening?`
    : `${first}, is your event still happening?`;
  const thing = type || "your event";
  const month = reInquiryMonth(inq.created_at);

  const paras = [
    `${first},`,
    `You reached out back in ${month} about ${thing}, and I never want to be the person emailing into silence, so this is a straight question rather than a nudge.`,
    `Is that evening still happening?`,
    `If you have already found someone, say so and I will close the file with no hard feelings. If the date moved, or the plan changed, or it just went quiet for a while, all of that is normal and I would still love to be part of it.`,
    `Either way, one line is enough.`,
  ];

  const p = (t: string) =>
    `<p style="margin:0 0 18px;font-family:${RE_BODY_FONT};font-size:15px;line-height:1.75;color:${RE_CREAM};">${reEsc(t)}</p>`;

  const signature = `<div style="margin:30px 0 0;font-family:${RE_BODY_FONT};font-size:14px;line-height:1.7;color:${RE_CREAM_SOFT};">
    Scott Syme<br/>
    Magician<br/>
    (424) 394-1850<br/>
    <a href="${RE_SITE_URL}" style="color:${RE_SAND};text-decoration:none;">whiterabbitla.com</a>
  </div>`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${RE_GROUND};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${RE_GROUND};">
    <tr><td align="center" style="padding:32px 12px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px;max-width:100%;background:${RE_GROUND};">
        <tr><td style="padding:24px 40px 28px;text-align:center;">
          <img src="${RE_LOGO_URL}" alt="White Rabbit LA" width="150" style="width:150px;max-width:60%;height:auto;display:block;margin:0 auto;border:0;outline:none;text-decoration:none;" />
        </td></tr>
        <tr><td style="padding:0 40px 36px;">${paras.map(p).join("")}${signature}</td></tr>
        <tr><td style="padding:0 40px 36px;text-align:center;">
          <div style="height:1px;background:${RE_GOLD};opacity:.5;margin:0 0 16px;"></div>
          <div style="font-family:${RE_BODY_FONT};font-size:11px;color:${RE_SAGE};line-height:1.6;">
            White Rabbit LA &middot; Los Angeles, CA<br/>
            7393 W. Manchester Ave #209, Los Angeles, CA 90045
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = `${paras.join("\n\n")}

Scott Syme
Magician
(424) 394-1850
whiterabbitla.com`;

  return { subject, html, text };
}

async function sendReengageEmail(to: string, subject: string, html: string, text: string) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key || !to) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: RE_FROM,
      to: [to],
      subject,
      html,
      text,
      reply_to: RE_REPLY_TO,
      headers: {
        "List-Unsubscribe": `<${RE_SITE_URL}/unsubscribe?email=${encodeURIComponent(to)}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }),
  });
  if (!res.ok) console.error("[reengage] Resend failed", res.status, await res.text().catch(() => ""));
  return res.ok;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, adminPassword, ...payload } = await req.json();

    if (!(await isAdminRequest(req, { adminPassword }))) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    switch (action) {
      case "import_contacts": {
        const { contacts } = payload;
        if (!contacts?.length) {
          return new Response(JSON.stringify({ error: "No contacts provided" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Deduplicate within the batch (keep first occurrence)
        const seen = new Set<string>();
        const unique = contacts.filter((c: { email: string }) => {
          const email = c.email.toLowerCase().trim();
          if (seen.has(email)) return false;
          seen.add(email);
          return true;
        });

        // Upsert deduplicated contacts
        const { data, error } = await supabase
          .from("newsletter_contacts")
          .upsert(
            unique.map((c: { email: string; name?: string; company?: string; city?: string; source?: string; phone?: string; drip_campaign?: string }) => ({
              email: c.email.toLowerCase().trim(),
              name: c.name?.trim() || null,
              company: c.company?.trim() || null,
              city: c.city?.trim() || null,
              source: c.source || "csv",
              phone: c.phone?.trim() || null,
              drip_campaign: c.drip_campaign || "welcome",
              subscribed: true,
            })),
            { onConflict: "email" }
          )
          .select();

        if (error) throw error;
        return new Response(JSON.stringify({ imported: data?.length || 0, duplicatesSkipped: contacts.length - unique.length }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_contacts_full": {
        const { data, error } = await supabase
          .from("newsletter_contacts")
          .select("id, email, name, company, city, source, subscribed, drip_campaign, drip_step, engagement_status, reply_detected, last_emailed_at, created_at")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return new Response(JSON.stringify({ contacts: data }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_contacts": {
        const { data, error } = await supabase
          .from("newsletter_contacts")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return new Response(JSON.stringify({ contacts: data }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_campaigns": {
        const { data, error } = await supabase
          .from("newsletter_campaigns")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return new Response(JSON.stringify({ campaigns: data }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "save_campaign": {
        const { campaign } = payload;
        if (campaign.id) {
          const { data, error } = await supabase
            .from("newsletter_campaigns")
            .update({
              subject: campaign.subject,
              body_html: campaign.body_html,
              body_preview: campaign.body_preview,
              status: campaign.status || "draft",
              campaign_type: campaign.campaign_type || "broadcast",
              drip_step: campaign.drip_step,
            })
            .eq("id", campaign.id)
            .select()
            .single();
          if (error) throw error;
          return new Response(JSON.stringify({ campaign: data }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          const { data, error } = await supabase
            .from("newsletter_campaigns")
            .insert({
              subject: campaign.subject,
              body_html: campaign.body_html,
              body_preview: campaign.body_preview,
              status: "draft",
              campaign_type: campaign.campaign_type || "broadcast",
              drip_step: campaign.drip_step,
            })
            .select()
            .single();
          if (error) throw error;
          return new Response(JSON.stringify({ campaign: data }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      case "delete_contact": {
        const { contactId } = payload;
        if (!contactId) {
          return new Response(JSON.stringify({ error: "contactId required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Delete related records first, then the contact
        await supabase.from("newsletter_clicks").delete().eq("contact_id", contactId);
        await supabase.from("newsletter_opens").delete().eq("contact_id", contactId);
        await supabase.from("newsletter_send_log").delete().eq("contact_id", contactId);
        await supabase.from("email_bounces").delete().eq("contact_id", contactId);
        const { error: delErr } = await supabase.from("newsletter_contacts").delete().eq("id", contactId);
        if (delErr) throw delErr;
        return new Response(JSON.stringify({ success: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete_campaign": {
        const { campaignId } = payload;
        // Delete related opens that reference this campaign first
        await supabase.from("newsletter_opens").delete().eq("campaign_id", campaignId);
        const { error } = await supabase
          .from("newsletter_campaigns")
          .delete()
          .eq("id", campaignId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_contact_clicks": {
        const { contactId } = payload;
        if (!contactId) {
          return new Response(JSON.stringify({ error: "contactId required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data: clicks, error: clicksErr } = await supabase
          .from("newsletter_clicks")
          .select("id, link_slug, drip_step, clicked_at")
          .eq("contact_id", contactId)
          .order("clicked_at", { ascending: false });
        if (clicksErr) throw clicksErr;

        const { data: opens, error: opensErr } = await supabase
          .from("newsletter_opens")
          .select("id, drip_step, opened_at, user_agent")
          .eq("contact_id", contactId)
          .order("opened_at", { ascending: false });
        if (opensErr) throw opensErr;

        return new Response(JSON.stringify({ clicks: clicks || [], opens: opens || [] }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_send_log": {
        let allSends: { campaign_id: string; sent_at: string; contact_id: string }[] = [];
        let page = 0;
        const PAGE = 1000;
        while (true) {
          const { data: batch, error } = await supabase
            .from("newsletter_send_log")
            .select("campaign_id, sent_at, contact_id")
            .order("sent_at", { ascending: false })
            .range(page * PAGE, (page + 1) * PAGE - 1);
          if (error) throw error;
          if (!batch || batch.length === 0) break;
          allSends = allSends.concat(batch);
          if (batch.length < PAGE) break;
          page++;
          if (page > 50) break;
        }
        return new Response(JSON.stringify({ sends: allSends }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_opens_log": {
        let allOpens: { contact_id: string; opened_at: string; drip_step: number }[] = [];
        let page = 0;
        const PAGE = 1000;
        while (true) {
          const { data: batch, error } = await supabase
            .from("newsletter_opens")
            .select("contact_id, opened_at, drip_step")
            .order("opened_at", { ascending: false })
            .range(page * PAGE, (page + 1) * PAGE - 1);
          if (error) throw error;
          if (!batch || batch.length === 0) break;
          allOpens = allOpens.concat(batch);
          if (batch.length < PAGE) break;
          page++;
          if (page > 50) break;
        }
        return new Response(JSON.stringify({ opens: allOpens }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_clicks_log": {
        let allClicks: { contact_id: string; clicked_at: string; drip_step: number; link_slug: string }[] = [];
        let page = 0;
        const PAGE = 1000;
        while (true) {
          const { data: batch, error } = await supabase
            .from("newsletter_clicks")
            .select("contact_id, clicked_at, drip_step, link_slug")
            .order("clicked_at", { ascending: false })
            .range(page * PAGE, (page + 1) * PAGE - 1);
          if (error) throw error;
          if (!batch || batch.length === 0) break;
          allClicks = allClicks.concat(batch);
          if (batch.length < PAGE) break;
          page++;
          if (page > 50) break;
        }
        return new Response(JSON.stringify({ clicks: allClicks }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_opened_contact_ids": {
        const { data: opens, error: opensErr } = await supabase
          .from("newsletter_opens")
          .select("contact_id");
        if (opensErr) throw opensErr;
        const uniqueIds = [...new Set((opens || []).map((o: { contact_id: string }) => o.contact_id))];
        return new Response(JSON.stringify({ contactIds: uniqueIds }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_stats": {
        // Fetch all newsletter_contacts with pagination to bypass 1000-row default
        let allContacts: { drip_campaign: string; subscribed: boolean; engagement_status: string }[] = [];
        let page = 0;
        const PAGE_SIZE = 1000;
        while (true) {
          const { data: batch } = await supabase
            .from("newsletter_contacts")
            .select("drip_campaign, subscribed, engagement_status")
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
          if (!batch || batch.length === 0) break;
          allContacts = allContacts.concat(batch);
          if (batch.length < PAGE_SIZE) break;
          page++;
        }

        const { count: campaignCount } = await supabase
          .from("newsletter_campaigns")
          .select("*", { count: "exact", head: true });

        // Fetch all send_log with pagination
        let allSends: { campaign_id: string }[] = [];
        page = 0;
        while (true) {
          const { data: batch } = await supabase
            .from("newsletter_send_log")
            .select("campaign_id")
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
          if (!batch || batch.length === 0) break;
          allSends = allSends.concat(batch);
          if (batch.length < PAGE_SIZE) break;
          page++;
        }

        const contacts = allContacts;
        const sends = allSends;

        const buildCampaignStats = (prefix: string) => {
          const cc = contacts.filter((c: { drip_campaign: string }) => c.drip_campaign.startsWith(prefix));
          const active = cc.filter((c: { subscribed: boolean }) => c.subscribed);
          return {
            subscribers: active.length,
            unsubscribed: cc.filter((c: { subscribed: boolean }) => !c.subscribed).length,
            emailsSent: sends.filter((s: { campaign_id: string }) => s.campaign_id.startsWith(prefix)).length,
            hot: active.filter((c: { engagement_status: string }) => c.engagement_status === "hot").length,
            warm: active.filter((c: { engagement_status: string }) => c.engagement_status === "warm").length,
          };
        };

        // Cold campaign stats from cold_email_campaigns table (paginated)
        let allColdData: { campaign_category: string; status: string }[] = [];
        page = 0;
        while (true) {
          const { data: batch } = await supabase
            .from("cold_email_campaigns")
            .select("campaign_category, status")
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
          if (!batch || batch.length === 0) break;
          allColdData = allColdData.concat(batch);
          if (batch.length < PAGE_SIZE) break;
          page++;
        }
        const coldContacts = allColdData;

        const buildColdStats = (category: string) => {
          const cc = coldContacts.filter((c: { campaign_category: string }) => c.campaign_category === category);
          return {
            total: cc.length,
            active: cc.filter((c: { status: string }) => c.status === "active").length,
            paused: cc.filter((c: { status: string }) => c.status === "paused").length,
            replied: cc.filter((c: { status: string }) => c.status === "replied").length,
            completed: cc.filter((c: { status: string }) => c.status === "completed").length,
          };
        };

        // Orphan lead table counts
        const [
          { count: consultationCount },
          { count: quizCount },
          { count: magnetCount },
        ] = await Promise.all([
          supabase.from("consultation_leads").select("*", { count: "exact", head: true }),
          supabase.from("discovery_quiz_leads").select("*", { count: "exact", head: true }),
          supabase.from("lead_magnet_signups").select("*", { count: "exact", head: true }),
        ]);

        const totalNewsletterContacts = contacts.length;
        const totalSendable = contacts.filter(
          (c: { subscribed: boolean; engagement_status: string }) =>
            c.subscribed && c.engagement_status !== "bounced"
        ).length;

        return new Response(JSON.stringify({
          subscribers: contacts.filter((c: { subscribed: boolean }) => c.subscribed).length,
          totalNewsletterContacts,
          totalSendable,
          campaigns: campaignCount || 0,
          emailsSent: sends.length,
          planner: buildCampaignStats("planner"),
          resident: buildCampaignStats("resident"),
          cold_corporate: buildColdStats("corporate_planner"),
          cold_wedding: buildColdStats("wedding_planner"),
          cold_club: buildColdStats("country_club"),
          cold_pr: buildColdStats("pr_agency"),
          cold_nonprofit: buildColdStats("nonprofit"),
          cold_talent: buildColdStats("talent"),
          cold_nightlife: buildColdStats("nightlife"),
          cold_spirits: buildColdStats("spirits"),
          cold_restaurant: buildColdStats("restaurant"),
          cold_charity_golf: buildColdStats("charity_golf"),
          orphan_leads: {
            consultation_leads: consultationCount || 0,
            discovery_quiz_leads: quizCount || 0,
            lead_magnet_signups: magnetCount || 0,
          },
        }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_deals": {
        const { data, error } = await supabase
          .from("deals")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return new Response(JSON.stringify({ deals: data }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "create_deal": {
        const { deal } = payload;
           const { data, error } = await supabase
          .from("deals")
          .insert({
            contact_email: deal.contact_email,
            contact_name: deal.contact_name || null,
            company: deal.company || null,
            phone: deal.phone || null,
            event_type: deal.event_type || null,
            event_date: deal.event_date || null,
            event_time: deal.event_time || null,
            location: deal.location || null,
            guest_count: deal.guest_count || null,
            deal_value: deal.deal_value || null,
            stage: deal.stage || "new",
            notes: deal.notes || null,
            next_follow_up: deal.next_follow_up || null,
            source: deal.source || null,
            lost_reason: deal.lost_reason || null,
          })
          .select()
          .single();
        if (error) throw error;

        // Also upsert into newsletter_contacts so pipeline leads are tracked
        await supabase
          .from("newsletter_contacts")
          .upsert(
            {
              email: deal.contact_email.toLowerCase().trim(),
              name: deal.contact_name || null,
              company: deal.company || null,
              source: "pipeline",
              drip_campaign: "welcome",
              drip_step: 0,
              subscribed: true,
            },
            { onConflict: "email", ignoreDuplicates: true }
          );

        if (data?.id) {
          await syncDealToGoogleCalendar(supabase, data.id);
          await ensureBookedClientEmails(supabase, data.id);
        }

        return new Response(JSON.stringify({ deal: data }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update_deal": {
        const { deal } = payload;
        const { data, error } = await supabase
          .from("deals")
          .update({
            contact_email: deal.contact_email,
            contact_name: deal.contact_name || null,
            company: deal.company || null,
            phone: deal.phone || null,
            event_type: deal.event_type || null,
            event_date: deal.event_date || null,
            event_time: deal.event_time || null,
            location: deal.location || null,
            guest_count: deal.guest_count || null,
            deal_value: deal.deal_value || null,
            stage: deal.stage || "new",
            notes: deal.notes || null,
            next_follow_up: deal.next_follow_up || null,
            source: deal.source || null,
            lost_reason: deal.lost_reason || null,
          })
          .eq("id", deal.id)
          .select()
          .single();
        if (error) throw error;
        if (data?.id) {
          await syncDealToGoogleCalendar(supabase, data.id);
          await ensureBookedClientEmails(supabase, data.id);
        }
        return new Response(JSON.stringify({ deal: data }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "sync_deal_calendar": {
        const { dealId } = payload;
        await syncDealToGoogleCalendar(supabase, dealId);
        return new Response(JSON.stringify({ success: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update_deal_stage": {
        const { dealId, stage } = payload;
        const { error } = await supabase
          .from("deals")
          .update({ stage })
          .eq("id", dealId);
        if (error) throw error;
        await syncDealToGoogleCalendar(supabase, dealId);
        await ensureBookedClientEmails(supabase, dealId);
        return new Response(JSON.stringify({ success: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update_contact": {
        const { contactId, updates } = payload;
        const patch: Record<string, unknown> = {};
        if (updates.name !== undefined) patch.name = updates.name || null;
        if (updates.company !== undefined) patch.company = updates.company || null;
        if (updates.phone !== undefined) patch.phone = updates.phone || null;
        if (updates.email !== undefined) patch.email = updates.email;
        const { error } = await supabase.from("newsletter_contacts").update(patch).eq("id", contactId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete_deal": {
        const { dealId } = payload;
        const { error } = await supabase
          .from("deals")
          .delete()
          .eq("id", dealId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "log_outreach": {
        const { entry } = payload;
        // Insert into outreach_log
        const { error: logErr } = await supabase
          .from("outreach_log")
          .insert({
            contact_email: entry.contact_email.toLowerCase().trim(),
            contact_name: entry.contact_name || null,
            action_type: entry.action_type || "call",
            notes: entry.notes || null,
            outcome: entry.outcome || null,
          });
        if (logErr) throw logErr;

        // Update deal if exists
        if (entry.deal_id) {
          const updates: Record<string, unknown> = {
            last_outreach_date: new Date().toISOString(),
            outreach_notes: entry.notes || null,
          };
          if (entry.outcome) updates.outreach_status = entry.outcome === "booked" ? "booked" : entry.outcome === "not_interested" ? "not_interested" : entry.outcome === "connected" ? "connected" : entry.outcome === "follow_up" ? "follow_up_scheduled" : "attempted";
          if (entry.follow_up_date) updates.next_follow_up = entry.follow_up_date;
          await supabase.from("deals").update(updates).eq("id", entry.deal_id);
        }

        return new Response(JSON.stringify({ success: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_outreach_log": {
        const { email } = payload;
        let query = supabase.from("outreach_log").select("*").order("created_at", { ascending: false });
        if (email) query = query.eq("contact_email", email.toLowerCase().trim());
        else query = query.limit(500);
        const { data, error } = await query;
        if (error) throw error;
        return new Response(JSON.stringify({ logs: data }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_action_list_data": {
        // Get deals, hot/warm contacts, outreach logs, and inbound form leads
        const [dealsRes, contactsRes, logsRes, inquiriesRes, quizRes, consultRes] = await Promise.all([
          supabase.from("deals").select("*").not("stage", "in", "(completed,lost)").order("created_at", { ascending: false }),
          supabase.from("newsletter_contacts").select("id, email, name, company, source, drip_campaign, drip_step, engagement_status, subscribed, created_at, phone").in("engagement_status", ["hot", "warm"]).eq("subscribed", true).order("created_at", { ascending: false }),
          supabase.from("outreach_log").select("*").order("created_at", { ascending: false }).limit(1000),
          supabase.from("contact_inquiries").select("id, name, email, phone, event_type, date, location, guest_count, budget, message, client_type, source, recommendation, created_at").order("created_at", { ascending: false }).limit(500),
          supabase.from("discovery_quiz_leads").select("id, name, email, event_type, guest_count, biggest_concern, experience_priority, recommendation, client_type, created_at").order("created_at", { ascending: false }).limit(500),
          supabase.from("consultation_leads").select("id, name, email, phone, event_type, event_date, description, source, created_at").order("created_at", { ascending: false }).limit(500),
        ]);
        if (dealsRes.error) throw dealsRes.error;
        if (contactsRes.error) throw contactsRes.error;
        if (logsRes.error) throw logsRes.error;
        if (inquiriesRes.error) throw inquiriesRes.error;
        if (quizRes.error) throw quizRes.error;
        if (consultRes.error) throw consultRes.error;

        return new Response(JSON.stringify({
          deals: dealsRes.data || [],
          hotWarmContacts: contactsRes.data || [],
          outreachLogs: logsRes.data || [],
          inquiries: inquiriesRes.data || [],
          quizLeads: quizRes.data || [],
          consultationLeads: consultRes.data || [],
        }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ═══════════════════════════════════════════════
      // COLD EMAIL CAMPAIGNS
      // ═══════════════════════════════════════════════

      case "get_cold_campaigns": {
        const { category } = payload;
        if (category === "spirits") {
          const { data, error } = await supabase
            .from("newsletter_contacts")
            .select("email, name, company, phone, created_at")
            .eq("drip_campaign", "cold_spirits");
          if (error) return new Response(JSON.stringify({ error: error.message }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
          const mapped = (data || []).map((c: { email: string; name: string | null; company: string | null; phone: string | null; created_at: string }) => ({
            email: c.email,
            name: c.name || null,
            company: c.company || null,
            phone: c.phone || null,
            campaign_category: "spirits",
            status: "active",
            current_step: 0,
            created_at: c.created_at,
          }));
          return new Response(JSON.stringify({ campaigns: mapped }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Default: get all campaigns from cold_email_campaigns + spirits from newsletter_contacts
        const [coldRes, spiritsRes] = await Promise.all([
          supabase.from("cold_email_campaigns").select("*").order("created_at", { ascending: false }),
          supabase.from("newsletter_contacts").select("email, name, company, phone, created_at, drip_step, subscribed").eq("drip_campaign", "cold_spirits"),
        ]);
        if (coldRes.error) throw coldRes.error;
        const spiritsData = (spiritsRes.data || []).map((c: { email: string; name: string | null; company: string | null; phone: string | null; created_at: string; drip_step: number; subscribed: boolean }) => ({
          email: c.email,
          name: c.name || null,
          company: c.company || null,
          phone: c.phone || null,
          campaign_category: "spirits",
          status: c.subscribed ? "active" : "paused",
          current_step: c.drip_step || 0,
          created_at: c.created_at,
        }));
        const allCampaigns = [...(coldRes.data || []), ...spiritsData];
        return new Response(JSON.stringify({ campaigns: allCampaigns }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "add_cold_campaign": {
        const { campaign } = payload;
        if (!campaign?.email) {
          return new Response(JSON.stringify({ error: "Email required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data, error } = await supabase
          .from("cold_email_campaigns")
          .insert({
            email: campaign.email.toLowerCase().trim(),
            name: campaign.name?.trim() || null,
            company: campaign.company?.trim() || null,
            phone: campaign.phone?.trim() || null,
            campaign_category: campaign.campaign_category,
            status: "active",
            current_step: 0,
          })
          .select()
          .single();
        if (error) {
          if (error.code === "23505") {
            const { data: existing } = await supabase
              .from("cold_email_campaigns")
              .select("campaign_category, status, name, company")
              .eq("email", campaign.email.toLowerCase().trim())
              .limit(5);
            const categories = (existing || []).map((e: { campaign_category: string; status: string }) => `${e.campaign_category} (${e.status})`).join(", ");
            return new Response(JSON.stringify({
              error: `Already in campaign: ${categories || "unknown"}`,
              existing,
            }), {
              status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          throw error;
        }
        return new Response(JSON.stringify({ campaign: data }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update_cold_campaign_status": {
        const { campaignId, status } = payload;
        const { error } = await supabase
          .from("cold_email_campaigns")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", campaignId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "bulk_update_drip_campaign": {
        const { emails, drip_campaign } = payload;
        if (!emails?.length || !drip_campaign) {
          return new Response(JSON.stringify({ error: "emails and drip_campaign required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const normalized = emails.map((e: string) => e.toLowerCase().trim());
        const { data: updated, error: bulkErr } = await supabase
          .from("newsletter_contacts")
          .update({ drip_campaign })
          .in("email", normalized)
          .select("id");
        if (bulkErr) throw bulkErr;
        return new Response(JSON.stringify({ updated: updated?.length || 0 }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "bulk_add_cold_campaigns": {
        const { emails, campaign_category } = payload;
        if (!emails?.length || !campaign_category) {
          return new Response(JSON.stringify({ error: "emails and campaign_category required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const normalizedEmails = emails.map((e: string) => e.toLowerCase().trim());

        // Look up contacts to get name/company
        const { data: contactsLookup } = await supabase
          .from("newsletter_contacts")
          .select("email, name, company")
          .in("email", normalizedEmails);
        const contactMap = new Map((contactsLookup || []).map((c: { email: string; name: string | null; company: string | null }) => [c.email, c]));

        const rows = normalizedEmails.map((email: string) => {
          const contact = contactMap.get(email);
          return {
            email,
            name: contact?.name || null,
            company: contact?.company || null,
            campaign_category,
            status: "active",
            current_step: 0,
          };
        });

        const { data: enrolled, error: bulkColdErr } = await supabase
          .from("cold_email_campaigns")
          .upsert(rows, { onConflict: "email" })
          .select("id");
        if (bulkColdErr) throw bulkColdErr;
        return new Response(JSON.stringify({ enrolled: enrolled?.length || 0 }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete_cold_campaign": {
        const { campaignId } = payload;
        const { error } = await supabase
          .from("cold_email_campaigns")
          .delete()
          .eq("id", campaignId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "global_search": {
        const { query } = payload;
        if (!query || query.length < 2) {
          return new Response(JSON.stringify({ contacts: [], deals: [], cold: [] }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const q = `%${query.toLowerCase()}%`;
        const [contactsRes, dealsRes, coldRes] = await Promise.all([
          supabase.from("newsletter_contacts")
            .select("id, email, name, company, drip_campaign, engagement_status")
            .or(`email.ilike.${q},name.ilike.${q},company.ilike.${q}`)
            .limit(10),
          supabase.from("deals")
            .select("id, contact_email, contact_name, company, stage, event_type, source")
            .or(`contact_email.ilike.${q},contact_name.ilike.${q},company.ilike.${q}`)
            .limit(10),
          supabase.from("cold_email_campaigns")
            .select("id, email, name, company, campaign_category, status")
            .or(`email.ilike.${q},name.ilike.${q},company.ilike.${q}`)
            .limit(10),
        ]);
        return new Response(JSON.stringify({
          contacts: contactsRes.data || [],
          deals: dealsRes.data || [],
          cold: coldRes.data || [],
        }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_dashboard_summary": {
        const today = new Date().toISOString().split("T")[0];
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const last30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const [dealsRes, recentInquiries, recentQuiz, recentConsultations,
               bouncesTotal, bounces30d, unsubsTotal, unsubs30d, totalContacts, totalSent] = await Promise.all([
          supabase.from("deals")
            .select("id, next_follow_up, source, stage")
            .not("stage", "in", "(lost,completed)"),
          supabase.from("contact_inquiries")
            .select("id, name, email, event_type, created_at")
            .gte("created_at", last24h)
            .order("created_at", { ascending: false })
            .limit(10),
          supabase.from("discovery_quiz_leads")
            .select("id, name, email, recommendation, created_at")
            .gte("created_at", last24h)
            .order("created_at", { ascending: false })
            .limit(10),
          supabase.from("consultation_leads")
            .select("id, name, email, event_type, created_at")
            .gte("created_at", last24h)
            .order("created_at", { ascending: false })
            .limit(10),
          // Email health: total bounces
          supabase.from("email_bounces").select("id", { count: "exact", head: true }),
          // Bounces in last 30 days
          supabase.from("email_bounces").select("id", { count: "exact", head: true }).gte("created_at", last30d),
          // Total unsubscribed contacts
          supabase.from("newsletter_contacts").select("id", { count: "exact", head: true }).eq("subscribed", false),
          // Unsubscribed in last 30 days (approximation: updated_at recent + unsubscribed)
          supabase.from("newsletter_contacts").select("id", { count: "exact", head: true }).eq("subscribed", false).gte("updated_at", last30d),
          // Total contacts for rate calc
          supabase.from("newsletter_contacts").select("id", { count: "exact", head: true }),
          // Total sent for bounce rate
          supabase.from("newsletter_send_log").select("id", { count: "exact", head: true }),
        ]);

        const deals = dealsRes.data || [];
        const dueToday = deals.filter(d => d.next_follow_up === today).length;
        const overdue = deals.filter(d => d.next_follow_up && d.next_follow_up < today).length;

        // Source attribution from ALL deals (including completed)
        const { data: allDeals } = await supabase.from("deals").select("source, stage");
        const sourceCounts: Record<string, number> = {};
        (allDeals || []).forEach(d => {
          const src = d.source || "Unknown";
          sourceCounts[src] = (sourceCounts[src] || 0) + 1;
        });

        return new Response(JSON.stringify({
          dueToday,
          overdue,
          recentInquiries: recentInquiries.data?.length || 0,
          recentQuiz: recentQuiz.data?.length || 0,
          recentConsultations: recentConsultations.data?.length || 0,
          recentInquiriesList: recentInquiries.data || [],
          recentQuizList: recentQuiz.data || [],
          recentConsultationsList: recentConsultations.data || [],
          sourceCounts,
          emailHealth: {
            bouncesTotal: bouncesTotal.count || 0,
            bounces30d: bounces30d.count || 0,
            unsubsTotal: unsubsTotal.count || 0,
            unsubs30d: unsubs30d.count || 0,
            totalContacts: totalContacts.count || 0,
            totalSent: totalSent.count || 0,
          },
        }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_lead_attribution": {
        const [dealsRes, inquiriesRes, consultationsRes, quizRes, closedRes] = await Promise.all([
          supabase.from("deals").select("id, source, stage, deal_value, created_at").order("created_at", { ascending: false }).limit(1000),
          supabase.from("contact_inquiries").select("id, source, created_at").order("created_at", { ascending: false }).limit(1000),
          supabase.from("consultation_leads").select("id, source, created_at").order("created_at", { ascending: false }).limit(1000),
          supabase.from("discovery_quiz_leads").select("id, created_at").order("created_at", { ascending: false }).limit(1000),
          supabase.from("deals").select("id, contact_name, contact_email, company, event_type, event_date, deal_value, source, location, notes, created_at").eq("stage", "completed").order("event_date", { ascending: false }).limit(200),
        ]);
        return new Response(JSON.stringify({
          deals: dealsRes.data || [],
          inquiries: inquiriesRes.data || [],
          consultations: consultationsRes.data || [],
          quizLeads: quizRes.data || [],
          closedDeals: closedRes.data || [],
        }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "log_closed_deal": {
        const { contact_name, contact_email, company, event_type, event_date, deal_value, source, location, notes } = payload;
        if (!contact_name || !source) {
          return new Response(JSON.stringify({ error: "Name and source are required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data, error } = await supabase.from("deals").insert({
          contact_name: contact_name as string,
          contact_email: (contact_email as string) || `${(contact_name as string).toLowerCase().replace(/\s+/g, '.')}@manual.entry`,
          company: company as string || null,
          event_type: event_type as string || null,
          event_date: event_date as string || null,
          deal_value: deal_value ? Math.round(Number(deal_value) * 100) : null,
          source: source as string,
          location: location as string || null,
          notes: notes as string || null,
          stage: "completed",
        }).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ deal: data }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_nurture_campaigns": {
        const { category } = payload;
        let query = supabase
          .from("cold_email_campaigns")
          .select("id, email, name, company, phone, campaign_category, status, nurture_step, nurture_status, nurture_started_at, nurture_last_sent_at, created_at")
          .eq("status", "completed");
        if (category) {
          query = query.eq("campaign_category", category);
        }
        const { data, error } = await query.order("nurture_last_sent_at", { ascending: false, nullsFirst: false });
        if (error) throw error;
        return new Response(JSON.stringify({ campaigns: data || [] }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "mark_cold_reply": {
        const { email: replyEmail } = payload;
        if (!replyEmail) {
          return new Response(JSON.stringify({ error: "email required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data: coldReplyContact } = await supabase
          .from("cold_email_campaigns")
          .select("id, email, name, company, campaign_category, status, current_step")
          .eq("email", (replyEmail as string).toLowerCase())
          .maybeSingle();

        if (!coldReplyContact) {
          return new Response(JSON.stringify({ error: "Cold contact not found" }), {
            status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (coldReplyContact.status === "active") {
          const { error: updateErr } = await supabase
            .from("cold_email_campaigns")
            .update({ status: "replied", updated_at: new Date().toISOString() })
            .eq("id", coldReplyContact.id);
          if (updateErr) throw updateErr;

          const { error: dealErr } = await supabase.from("deals").insert({
            contact_name: coldReplyContact.name,
            contact_email: coldReplyContact.email,
            company: coldReplyContact.company,
            source: "cold_outreach",
            stage: "new",
            notes: `Cold contact replied to drip email step ${coldReplyContact.current_step} campaign ${coldReplyContact.campaign_category}.`,
          });
          if (dealErr) throw dealErr;

          const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
          if (RESEND_API_KEY) {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
              body: JSON.stringify({
                from: "White Rabbit System <scott.syme@whiterabbitla.com>",
                to: ["scott.syme@whiterabbitla.com"],
                subject: `💬 Cold Lead Replied: ${coldReplyContact.email}`,
                html: `<p>A cold outreach contact replied!</p>
<p><strong>Name:</strong> ${coldReplyContact.name || "Unknown"}</p>
<p><strong>Email:</strong> ${coldReplyContact.email}</p>
<p><strong>Company:</strong> ${coldReplyContact.company || "Unknown"}</p>
<p><strong>Campaign:</strong> ${coldReplyContact.campaign_category}</p>
<p><strong>Step:</strong> ${coldReplyContact.current_step}</p>
<p><strong>Follow up immediately!</strong></p>`,
              }),
            });
          }
        } else {
          const { error: updateErr2 } = await supabase
            .from("cold_email_campaigns")
            .update({ status: "replied", updated_at: new Date().toISOString() })
            .eq("id", coldReplyContact.id);
          if (updateErr2) throw updateErr2;
        }

        return new Response(JSON.stringify({ success: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update_nurture_status": {
        const { campaignId, nurture_status } = payload;
        const { error } = await supabase
          .from("cold_email_campaigns")
          .update({ nurture_status, updated_at: new Date().toISOString() })
          .eq("id", campaignId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_deal_inbox": {
        // Hot list: deals with recent inbound replies OR hot_signal, sorted by latest activity
        const { data: deals } = await supabase
          .from("deals")
          .select("id, contact_name, contact_email, company, stage, event_type, event_date, last_inbound_at, hot_signal, hot_reason, gmail_thread_id, calendar_event_id, deal_value, source")
          .order("last_inbound_at", { ascending: false, nullsFirst: false })
          .limit(200);
        return new Response(JSON.stringify({ deals: deals || [] }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_deal_threads": {
        const { deal_id } = payload;
        const { data: threads } = await supabase
          .from("deal_email_threads")
          .select("*")
          .eq("deal_id", deal_id)
          .order("last_message_at", { ascending: false });
        const { data: messages } = await supabase
          .from("deal_email_messages")
          .select("*")
          .eq("deal_id", deal_id)
          .order("sent_at", { ascending: true });
        const { data: activity } = await supabase
          .from("deal_activity")
          .select("*")
          .eq("deal_id", deal_id)
          .order("occurred_at", { ascending: false })
          .limit(50);
        return new Response(JSON.stringify({ threads: threads || [], messages: messages || [], activity: activity || [] }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_contact_activity": {
        // Full unified timeline for one contact: outreach_log + action_log + deal_activity + deal_email_messages (inbound replies + outbound sends)
        const { email, deal_id } = payload;
        const emailLower = (email || "").toLowerCase().trim();
        if (!emailLower) {
          return new Response(JSON.stringify({ error: "email required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Resolve deal ids tied to this contact email (in case multiple) plus optional explicit
        const { data: dealRows } = await supabase
          .from("deals")
          .select("id")
          .ilike("contact_email", emailLower);
        const dealIds = Array.from(new Set([
          ...((dealRows || []).map((d: { id: string }) => d.id)),
          ...(deal_id ? [deal_id] : []),
        ]));

        const [outreachRes, actionRes, dealActRes, msgRes] = await Promise.all([
          supabase.from("outreach_log").select("*").eq("contact_email", emailLower).order("created_at", { ascending: false }).limit(200),
          supabase.from("action_log").select("*").eq("contact_email", emailLower).order("occurred_at", { ascending: false }).limit(200),
          dealIds.length
            ? supabase.from("deal_activity").select("*").in("deal_id", dealIds).order("occurred_at", { ascending: false }).limit(200)
            : Promise.resolve({ data: [], error: null }),
          dealIds.length
            ? supabase.from("deal_email_messages").select("*").in("deal_id", dealIds).order("sent_at", { ascending: false }).limit(200)
            : Promise.resolve({ data: [], error: null }),
        ]);

        type TimelineItem = {
          id: string;
          source: "outreach" | "action" | "deal_activity" | "email_inbound" | "email_outbound";
          type: string;
          at: string;
          title: string | null;
          summary: string | null;
          outcome: string | null;
          subject: string | null;
        };
        const timeline: TimelineItem[] = [];

        for (const r of outreachRes.data || []) {
          timeline.push({
            id: `o-${r.id}`, source: "outreach", type: r.action_type || "log",
            at: r.created_at, title: r.action_type || null, summary: r.notes || null,
            outcome: r.outcome || null, subject: null,
          });
        }
        for (const r of actionRes.data || []) {
          timeline.push({
            id: `a-${r.id}`, source: "action", type: r.action_type || "action",
            at: r.occurred_at || r.created_at, title: r.action_type || null,
            summary: r.summary || null, outcome: null, subject: r.subject || null,
          });
        }
        for (const r of dealActRes.data || []) {
          timeline.push({
            id: `da-${r.id}`, source: "deal_activity", type: r.type || "activity",
            at: r.occurred_at || r.created_at, title: r.title || null,
            summary: r.body || null, outcome: null, subject: null,
          });
        }
        for (const r of msgRes.data || []) {
          const inbound = r.direction === "inbound";
          timeline.push({
            id: `m-${r.id}`, source: inbound ? "email_inbound" : "email_outbound",
            type: inbound ? "reply" : "email_sent",
            at: r.sent_at || r.created_at, title: inbound ? `From ${r.from_email}` : `To ${r.to_email}`,
            summary: r.snippet || (r.body_text ? r.body_text.slice(0, 280) : null),
            outcome: null, subject: r.subject || null,
          });
        }

        timeline.sort((a, b) => (b.at || "").localeCompare(a.at || ""));

        return new Response(JSON.stringify({ timeline }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }


      case "trigger_gmail_sync": {
        const { deal_id } = payload;
        const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/gmail-sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}` },
          body: JSON.stringify({ adminPassword: Deno.env.get("ADMIN_PASSWORD"), deal_id }),
        });
        const data = await r.json();
        return new Response(JSON.stringify(data), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "trigger_calendar_sync": {
        const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/calendar-sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}` },
          body: JSON.stringify({ adminPassword: Deno.env.get("ADMIN_PASSWORD") }),
        });
        const data = await r.json();
        return new Response(JSON.stringify(data), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "check_availability": {
        const { date } = payload;
        const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/calendar-availability`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}` },
          body: JSON.stringify({ date }),
        });
        const data = await r.json();
        return new Response(JSON.stringify(data), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "send_gmail_reply": {
        const { deal_id, to, subject, body_text, gmail_thread_id } = payload;
        const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/gmail-send`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}` },
          body: JSON.stringify({ adminPassword: Deno.env.get("ADMIN_PASSWORD"), deal_id, to, subject, body_text, gmail_thread_id }),
        });
        const data = await r.json();
        return new Response(JSON.stringify(data), {
          status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_deal_invoices": {
        // Invoices for the client context panel. Matches on deal_id and also on
        // client_email, so invoices raised before the deal link existed show up.
        const { deal_id } = payload;
        if (!deal_id) {
          return new Response(JSON.stringify({ error: "deal_id required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data: deal } = await supabase
          .from("deals")
          .select("contact_email")
          .eq("id", deal_id)
          .maybeSingle();
        const email = (deal?.contact_email || "").toLowerCase().trim();

        const [byDeal, byEmail] = await Promise.all([
          supabase.from("event_invoices").select("*").eq("deal_id", deal_id),
          email
            ? supabase.from("event_invoices").select("*").ilike("client_email", email)
            : Promise.resolve({ data: [] as Record<string, unknown>[] }),
        ]);

        const seen = new Set<string>();
        const invoices = [...(byDeal.data || []), ...((byEmail as { data: Record<string, unknown>[] }).data || [])]
          .filter((inv) => {
            const id = inv.id as string;
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
          })
          .sort((a, b) =>
            String(b.created_at).localeCompare(String(a.created_at))
          );

        return new Response(JSON.stringify({ invoices }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_deal_proposals": {
        // Proposals + signed agreements for the client context panel.
        const { deal_id } = payload;
        if (!deal_id) {
          return new Response(JSON.stringify({ error: "deal_id required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data: deal } = await supabase
          .from("deals")
          .select("contact_email")
          .eq("id", deal_id)
          .maybeSingle();
        const email = (deal?.contact_email || "").toLowerCase().trim();

        const propCols = "id, slug, first_name, last_name, recipient_email, event_type, event_date, venue, tiers, sent_at, created_at, deal_id, square_invoice_url";
        const [byDeal, byEmail, agreements, views] = await Promise.all([
          supabase.from("proposals").select(propCols).eq("deal_id", deal_id),
          email
            ? supabase.from("proposals").select(propCols).ilike("recipient_email", email)
            : Promise.resolve({ data: [] as Record<string, unknown>[] }),
          supabase.from("signed_agreements")
            .select("id, proposal_id, proposal_slug, tier_name, tier_price, client_name, client_email, signed_at, deal_id")
            .or(`deal_id.eq.${deal_id}${email ? `,client_email.ilike.${email}` : ""}`),
          supabase.from("proposal_views").select("proposal_id, viewed_at"),
        ]);

        const seen = new Set<string>();
        const proposals = [...(byDeal.data || []), ...((byEmail as { data: Record<string, unknown>[] }).data || [])]
          .filter((p) => {
            const id = p.id as string;
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
          })
          .map((p) => {
            const pViews = (views.data || []).filter((v: { proposal_id: string | null }) => v.proposal_id === p.id);
            const lastViewed = pViews
              .map((v: { viewed_at: string }) => v.viewed_at)
              .sort()
              .pop() || null;
            return { ...p, view_count: pViews.length, last_viewed_at: lastViewed };
          })
          .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

        return new Response(JSON.stringify({ proposals, agreements: agreements.data || [] }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }


      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("newsletter-admin error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
