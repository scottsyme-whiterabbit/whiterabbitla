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
    const cronSecret = Deno.env.get("CRON_SECRET") ?? "";
    const headerCron = req.headers.get("x-cron-secret") ?? "";
    let bodyCron = "";
    let bodyAdminPassword = "";
    if (req.method === "POST") {
      const b = await req.json().catch(() => ({}));
      bodyCron = b.cron_secret ?? "";
      bodyAdminPassword = b.adminPassword ?? "";
    }
    const adminOk = !!ADMIN_PASSWORD && bodyAdminPassword === ADMIN_PASSWORD;
    const cronOk = cronSecret.length > 0 && (bodyCron === cronSecret || headerCron === cronSecret);
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
        .select("id, stage, contact_email, post_show_step, post_show_started_at, hot_signal")
        .eq("calendar_event_id", eventId)
        .maybeSingle();

      if (!deal && guestEmails.length) {
        const { data: byEmail } = await supabase
          .from("deals")
          .select("id, stage, contact_email, post_show_step, post_show_started_at, hot_signal")
          .in("contact_email", guestEmails)
          .order("updated_at", { ascending: false })
          .limit(1);
        if (byEmail && byEmail.length) deal = byEmail[0];
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

    return new Response(JSON.stringify({
      success: true, events: data.items?.length || 0, linked, created, hotMarked, postShowQueued,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
