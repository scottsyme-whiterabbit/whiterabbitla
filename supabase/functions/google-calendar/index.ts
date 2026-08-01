import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CALENDAR_ID = "scott.syme@whiterabbitla.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GOOGLE_CALENDAR_API_KEY");
    if (!apiKey) {
      throw new Error("GOOGLE_CALENDAR_API_KEY is not configured");
    }

    const body = await req.json().catch(() => ({}));
    const { timeMin, timeMax, adminPassword } = body;

    // This endpoint is reachable with only the publishable anon key, so the
    // default response is PII-free: free/busy time blocks only. Titles,
    // descriptions, locations and attendees are returned only to an
    // admin-password-authenticated caller (the internal CRM calendars).
    const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD");
    const detailed = !!ADMIN_PASSWORD && adminPassword === ADMIN_PASSWORD;

    if (!timeMin || !timeMax) {
      return new Response(JSON.stringify({ error: "timeMin and timeMax are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const params = new URLSearchParams({
      key: apiKey,
      timeMin,
      timeMax,
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "250",
    });

    const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?${params}`;

    const response = await fetch(calendarUrl);
    const data = await response.json();

    if (!response.ok) {
      console.error("Google Calendar API error:", data);
      throw new Error(`Google Calendar API error [${response.status}]: ${JSON.stringify(data)}`);
    }

    // Map to simplified event objects
    const events = (data.items || []).map((item: any) => {
      const base = {
        id: item.id,
        start: item.start?.dateTime || item.start?.date || null,
        end: item.end?.dateTime || item.end?.date || null,
        allDay: !item.start?.dateTime,
        status: item.status || "confirmed",
        busy: item.transparency !== "transparent",
      };
      if (!detailed) {
        // Free/busy only — no title, description, location, attendees or links.
        return { ...base, summary: "(No title)", description: null, location: null, colorId: null };
      }
      return {
        ...base,
        summary: item.summary || "(No title)",
        description: item.description || null,
        location: item.location || null,
        htmlLink: item.htmlLink || null,
        colorId: item.colorId || null,
      };
    });


    return new Response(JSON.stringify({ events }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("google-calendar error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
