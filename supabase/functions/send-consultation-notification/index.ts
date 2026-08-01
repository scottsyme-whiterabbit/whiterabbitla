import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};


/** Escape user-supplied values before interpolating into notification HTML. */
function escapeHtml(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, event_type, event_date, description } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailHtml = `
      <h2>New Consultation Lead (Meta Ads)</h2>
      <table style="border-collapse:collapse;width:100%;max-width:600px;">
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Name</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(name || "N/A")}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Email</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(email || "N/A")}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Phone</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(phone || "N/A")}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Event Type</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(event_type || "Not specified")}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Event Date</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(event_date || "Not specified")}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Source</td><td style="padding:8px;border-bottom:1px solid #eee;color:#2a7d5f;font-weight:bold;">Meta Ads — Consultation Page</td></tr>
      </table>
      ${description ? `<h3 style="margin-top:24px;">Description</h3><p style="white-space:pre-wrap;">${escapeHtml(description)}</p>` : ""}
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "White Rabbit <scott.syme@whiterabbitla.com>",
        to: ["scott.syme@whiterabbitla.com"],
        subject: `Consultation Lead — ${event_type || "General Inquiry"}`,
        html: emailHtml,
        reply_to: email || undefined,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend error:", data);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: data }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auto-create deal in pipeline
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    try {
      await fetch(supabaseUrl + "/rest/v1/deals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": "Bearer " + supabaseKey,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify((() => {
          let parsedEventDate: string | null = null;
          if (event_date) {
            const d = new Date(event_date);
            if (!isNaN(d.getTime())) parsedEventDate = d.toISOString().slice(0, 10);
          }
          const notes = parsedEventDate
            ? (description || null)
            : `Event Date (raw): ${event_date || "—"}\n\n${description || ""}`;
          return {
            contact_name: name,
            contact_email: email,
            phone: phone || null,
            event_type: event_type || null,
            event_date: parsedEventDate,
            stage: "new",
            source: "website",
            notes,
          };
        })())
      });
    } catch (e) { console.error("Deal creation error:", e); }

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
