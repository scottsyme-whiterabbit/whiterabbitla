// Calendar sync: pull upcoming + recent calendar events, link to deals or auto-create,
// mark hot signal for confirmed bookings, trigger post-show for finished events.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const GATEWAY = "https://connector-gateway.lovable.dev/google_calendar/calendar/v3";
const CAL_ID = "primary";
const OWNER_EMAIL = "scott.syme@whiterabbitla.com";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const GCAL_API_KEY = Deno.env.get("GOOGLE_CALENDAR_API_KEY_1");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD");
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!GCAL_API_KEY) throw new Error("GOOGLE_CALENDAR_API_KEY_1 not configured");

    // Auth gate (both GET and POST). Accepted callers:
    //   - pg_cron job "calendar-sync-every-30min": POST body { cron_secret }
    //   - newsletter-admin proxy: POST body { adminPassword }
    // Anything else is rejected.
    // Accept either the current or the legacy cron secret, matching the pattern
    // used by bounce-threshold-check / nurture-drip / inquiry-followup.
    const acceptedCronSecrets = [Deno.env.get("CRON_SECRET"), Deno.env.get("CRON_SECRET_V2")]
      .filter((s): s is string => !!s && s.length > 0);
    let bodyCron = "";
    let bodyAdminPassword = "";
    if (req.method === "POST") {
      const b = await req.json().catch(() => ({}));
      bodyCron = b.cron_secret ?? "";
      bodyAdminPassword = b.adminPassword ?? "";
    }
    const adminOk = !!ADMIN_PASSWORD && bodyAdminPassword === ADMIN_PASSWORD;
    const provided = bodyCron || req.headers.get("x-cron-secret") || "";
    const cronOk = acceptedCronSecrets.length > 0 && acceptedCronSecrets.includes(provided);
    if (!adminOk && !cronOk) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    const now = new Date();
    const timeMin = new Date(now.getTime() - 14 * 86400000).toISOString();
    const timeMax = new Date(now.getTime() + 120 * 86400000).toISOString();

    const params = new URLSearchParams({
      timeMin, timeMax, singleEvents: "true", orderBy: "startTime", maxResults: "250",
    });
    const r = await fetch(`${GATEWAY}/calendars/${encodeURIComponent(CAL_ID)}/events?${params}`, {
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GCAL_API_KEY,
      },
    });
    const data = await r.json();
    if (!r.ok) throw new Error(`Calendar ${r.status}: ${JSON.stringify(data).slice(0, 300)}`);

    let linked = 0;
    let created = 0;
    let hotMarked = 0;
    let postShowQueued = 0;
    for (const ev of data.items || []) {
      const eventId = ev.id;
      const start = ev.start?.dateTime || ev.start?.date;
      const end = ev.end?.dateTime || ev.end?.date;
      if (!start) continue;
      const startDate = new Date(start);
      const isPast = startDate.getTime() < now.getTime() - 3600000; // ended >1hr ago
      const summary = ev.summary || "(No title)";
      const location = ev.location || null;
      const attendees: any[] = ev.attendees || [];
      const guestEmails = attendees
        .map((a: any) => (a.email || "").toLowerCase())
        .filter((e: string) => e && e !== OWNER_EMAIL.toLowerCase());

      // Try to find an existing deal: by calendar_event_id, or by attendee email
      let { data: deal } = await supabase
        .from("deals")
        .select("id, stage, contact_email, post_show_step, post_show_started_at, hot_signal, calendar_event_id, consultation_event_id")
        .eq("calendar_event_id", eventId)
        .maybeSingle();

      if (!deal && guestEmails.length) {
        const { data: byEmail } = await supabase
          .from("deals")
          .select("id, stage, contact_email, post_show_step, post_show_started_at, hot_signal, calendar_event_id, consultation_event_id")
          .in("contact_email", guestEmails)
          .order("updated_at", { ascending: false })
          .limit(1);
        if (byEmail && byEmail.length) deal = byEmail[0];
      }

      // Discovery calls and consultations are not show bookings.
      const titleLc = summary.toLowerCase();
      // System show events (🎩 BOOKED / 🎩 HOLD) are never consultations.
      // Booking page appointments read "A 15-minute conversation with Scott Syme x White Rabbit LA (Name)".
      const isSystemShow = summary.startsWith("🎩");
      const isConsultation = !isSystemShow &&
        ["conversation with scott syme", "conversation with scott", "15-minute", "15 minute", "discovery call", "consultation"]
          .some((k) => titleLc.includes(k));

      if (isConsultation) {
        // A consultation only says a call is scheduled. It must NEVER write the
        // deal's event_date, event_time, location or calendar_event_id; the
        // consultation id goes into consultation_event_id only.
        if (deal && !isPast && (deal as any).consultation_event_id !== eventId) {
          const consultUpdate: Record<string, unknown> = {
            consultation_event_id: eventId,
            ...(deal.stage === "new" ? { stage: "contacted" } : {}),
            hot_signal: true,
            hot_reason: "Call booked",
            last_calendar_sync_at: new Date().toISOString(),
          };
          delete consultUpdate.event_date;
          delete consultUpdate.event_time;
          delete consultUpdate.location;
          delete consultUpdate.calendar_event_id;
          await supabase.from("deals").update(consultUpdate).eq("id", deal.id);
          await supabase.from("deal_activity").insert({
            deal_id: deal.id,
            type: "calendar_event",
            title: `Linked consultation call: ${summary}`,
            body: null,
            metadata: { event_id: eventId, start, end, consultation: true },
            occurred_at: new Date().toISOString(),
          });
          linked++;
          hotMarked++;
        }
        continue;
      }

      // Link existing deal to event
      if (deal && !deal.hot_signal && !isPast) {
        await supabase.from("deals").update({
          calendar_event_id: eventId,
          event_date: startDate.toISOString().slice(0, 10),
          stage: deal.stage === "new" || deal.stage === "contacted" ? "booked" : deal.stage,
          hot_signal: true,
          hot_reason: "Booked on calendar",
          last_calendar_sync_at: new Date().toISOString(),
        }).eq("id", deal.id);
        await supabase.from("deal_activity").insert({
          deal_id: deal.id,
          type: "calendar_event",
          title: `Linked to calendar: ${summary}`,
          body: location || undefined,
          metadata: { event_id: eventId, start, end },
          occurred_at: new Date().toISOString(),
        });
        linked++;
        hotMarked++;
      } else if (!deal && guestEmails.length && !isPast) {
        // Auto-create deal from calendar event with an external attendee
        const contactEmail = guestEmails[0];
        const { data: newDeal } = await supabase.from("deals").insert({
          contact_email: contactEmail,
          contact_name: attendees.find((a: any) => (a.email || "").toLowerCase() === contactEmail)?.displayName || null,
          event_type: summary,
          event_date: startDate.toISOString().slice(0, 10),
          location,
          stage: "booked",
          source: "google_calendar",
          calendar_event_id: eventId,
          hot_signal: true,
          hot_reason: "Auto-created from calendar booking",
          last_calendar_sync_at: new Date().toISOString(),
        }).select().single();
        if (newDeal) {
          await supabase.from("deal_activity").insert({
            deal_id: newDeal.id,
            type: "calendar_event",
            title: `Auto-created from calendar: ${summary}`,
            body: location || undefined,
            metadata: { event_id: eventId, start, end },
          });
          created++;
        }
      }

      // Past event with linked deal → kick off post-show sequence if not already
      if (deal && isPast && !deal.post_show_started_at && deal.stage !== "lost") {
        await supabase.from("deals").update({
          post_show_started_at: new Date().toISOString(),
          post_show_step: 0,
          stage: "completed",
        }).eq("id", deal.id);
        await supabase.from("deal_activity").insert({
          deal_id: deal.id,
          type: "stage_change",
          title: "Event ended — post-show sequence started",
          metadata: { event_id: eventId },
        });
        postShowQueued++;
      }
    }

    // Reconciliation pass: a show deal inside the fetched window whose
    // calendar entry is absent from the fetch gets adopted from an existing
    // calendar event when one matches, otherwise recreated. Skipped on an
    // empty fetch (unhealthy API, not every show vanished). Capped per run.
    // NOTE: a null calendar_event_id does NOT mean no event exists — Scott
    // hand-writes many calendar entries himself, so always try to adopt
    // before creating a duplicate.
    const HEAL_CAP = 20;
    let healed = 0;
    let adopted = 0;
    const fetchedItems: any[] = data.items || [];
    if (fetchedItems.length > 0) {
      const fetchedIds = new Set<string>(fetchedItems.map((e: any) => e.id).filter(Boolean));
      const windowStart = timeMin.slice(0, 10);
      const windowEnd = timeMax.slice(0, 10);
      const pacificDateOf = (ev: any): string | null => {
        if (ev?.start?.dateTime) {
          try {
            return new Intl.DateTimeFormat("en-CA", {
              timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit",
            }).format(new Date(ev.start.dateTime));
          } catch { return null; }
        }
        const dateOnly = ev?.start?.date;
        return dateOnly ? String(dateOnly).slice(0, 10) : null;
      };
      // Priority 1: the system writes "White Rabbit CRM deal <id>" into
      // descriptions, so an exact deal-id match wins outright.
      // Priority 2: an owned event (summary starts with the 🎩 marker, written
      // with or without a following space) whose start date falls on the
      // deal's event_date and whose summary/description names the client.
      const findAdoptable = (d: any) => {
        for (const ev of fetchedItems) {
          if ((ev?.description || "").includes(d.id)) return ev;
        }
        const name = (d.contact_name || "").toLowerCase();
        const email = (d.contact_email || "").toLowerCase();
        const dealDate = String(d.event_date || "").slice(0, 10);
        for (const ev of fetchedItems) {
          const summary = ev?.summary || "";
          if (!summary.startsWith("🎩")) continue;
          if ((pacificDateOf(ev) || "") !== dealDate) continue;
          const desc = (ev?.description || "").toLowerCase();
          if (name && (summary.toLowerCase().includes(name) || desc.includes(name))) return ev;
          if (email && desc.includes(email)) return ev;
        }
        return null;
      };
      const { data: showDeals, error: showErr } = await supabase
        .from("deals")
        .select("id, event_date, calendar_event_id, contact_name, contact_email")
        .in("stage", ["booked", "completed", "proposal_sent", "negotiating", "on_hold"])
        .not("event_date", "is", null)
        .gte("event_date", windowStart)
        .lte("event_date", windowEnd);
      if (showErr) console.error("[calendar-sync] reconciliation query failed", showErr);
      for (const d of showDeals || []) {
        if (healed + adopted >= HEAL_CAP) break;
        const needsHeal = !d.calendar_event_id || !fetchedIds.has(d.calendar_event_id);
        if (!needsHeal) continue;
        // Adopt an existing event out of the already-fetched list before
        // creating anything new.
        const match = findAdoptable(d);
        if (match?.id) {
          const { error: adoptErr } = await supabase.from("deals")
            .update({ calendar_event_id: match.id, last_calendar_sync_at: new Date().toISOString() })
            .eq("id", d.id);
          if (adoptErr) { console.error(`[calendar-sync] adopt failed for ${d.id}`, adoptErr); continue; }
          await supabase.from("deal_activity").insert({
            deal_id: d.id,
            type: "calendar_event",
            title: "Linked to an existing calendar entry",
            body: `Show on ${d.event_date}`,
            metadata: { event_id: match.id, summary: match.summary || "", previous_event_id: d.calendar_event_id ?? null },
            occurred_at: new Date().toISOString(),
          });
          adopted++;
          continue;
        }
        // Null FIRST so the sync creates a fresh event instead of patching a missing one.
        const { error: nullErr } = await supabase.from("deals")
          .update({ calendar_event_id: null }).eq("id", d.id);
        if (nullErr) { console.error(`[calendar-sync] could not clear id on ${d.id}`, nullErr); continue; }
        try {
          const res = await fetch(`${SUPABASE_URL}/functions/v1/newsletter-admin`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_KEY}` },
            body: JSON.stringify({ action: "sync_deal_calendar", adminPassword: ADMIN_PASSWORD, dealId: d.id }),
          });
          await res.text().catch(() => "");
          if (!res.ok) console.error(`[calendar-sync] resync failed for ${d.id}: ${res.status}`);
        } catch (err) {
          console.error(`[calendar-sync] resync error for ${d.id}`, err);
        }
        await supabase.from("deal_activity").insert({
          deal_id: d.id,
          type: "calendar_event",
          title: "Calendar entry was missing, recreated",
          body: `Show on ${d.event_date}`,
          metadata: { previous_event_id: d.calendar_event_id ?? null },
          occurred_at: new Date().toISOString(),
        });
        healed++;
      }
      console.log(`[calendar-sync] reconciliation healed ${healed}, adopted ${adopted}`);
    } else {
      console.warn("[calendar-sync] empty calendar fetch; reconciliation skipped");
    }

    return new Response(JSON.stringify({
      success: true, events: data.items?.length || 0, linked, created, hotMarked, postShowQueued, healed, adopted,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
