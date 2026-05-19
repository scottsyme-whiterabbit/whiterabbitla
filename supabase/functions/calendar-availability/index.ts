// Freebusy availability check for a date or date range.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const GATEWAY = "https://connector-gateway.lovable.dev/google_calendar/calendar/v3";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const GCAL_API_KEY = Deno.env.get("GOOGLE_CALENDAR_API_KEY_1");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { date, timeMin, timeMax } = await req.json();
    let tMin = timeMin;
    let tMax = timeMax;
    if (date && !tMin) {
      const d = new Date(date);
      tMin = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0).toISOString();
      tMax = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).toISOString();
    }
    if (!tMin || !tMax) {
      return new Response(JSON.stringify({ error: "date or timeMin/timeMax required" }), { status: 400, headers: corsHeaders });
    }
    const r = await fetch(`${GATEWAY}/freeBusy`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GCAL_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ timeMin: tMin, timeMax: tMax, items: [{ id: "primary" }] }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(`freeBusy ${r.status}: ${JSON.stringify(data)}`);
    const busy = data.calendars?.primary?.busy || [];
    return new Response(JSON.stringify({ available: busy.length === 0, busy, timeMin: tMin, timeMax: tMax }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
