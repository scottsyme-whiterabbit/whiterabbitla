import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Name</td><td style="padding:8px;border-bottom:1px solid #eee;">${name || "N/A"}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Email</td><td style="padding:8px;border-bottom:1px solid #eee;">${email || "N/A"}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Phone</td><td style="padding:8px;border-bottom:1px solid #eee;">${phone || "N/A"}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Event Type</td><td style="padding:8px;border-bottom:1px solid #eee;">${event_type || "Not specified"}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Event Date</td><td style="padding:8px;border-bottom:1px solid #eee;">${event_date || "Not specified"}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Source</td><td style="padding:8px;border-bottom:1px solid #eee;color:#2a7d5f;font-weight:bold;">Meta Ads — Consultation Page</td></tr>
      </table>
      ${description ? `<h3 style="margin-top:24px;">Description</h3><p style="white-space:pre-wrap;">${description}</p>` : ""}
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

    // Create contact in Apollo.io CRM (non-blocking)
    try {
      const APOLLO_API_KEY = Deno.env.get("APOLLO_API_KEY");
      if (APOLLO_API_KEY && email) {
        const [firstName, ...lastParts] = (name || "").split(" ");
        const lastName = lastParts.join(" ") || undefined;
        const apolloRes = await fetch("https://api.apollo.io/api/v1/contacts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": APOLLO_API_KEY,
          },
          body: JSON.stringify({
            first_name: firstName || undefined,
            last_name: lastName,
            email: email,
            phone_numbers: phone ? [{ raw_number: phone }] : undefined,
            label_names: ["Consultation Lead", "Meta Ads"],
          }),
        });
        if (!apolloRes.ok) {
          const err = await apolloRes.text();
          console.error("Apollo.io error:", apolloRes.status, err);
        } else {
          await apolloRes.text();
          console.log("Apollo.io contact created for:", email);
        }
      }
    } catch (apolloErr) {
      console.error("Apollo.io creation failed (non-blocking):", apolloErr);
    }

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
