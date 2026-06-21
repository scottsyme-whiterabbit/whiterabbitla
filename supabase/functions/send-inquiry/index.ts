import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const body = await req.json();

    // ── Review completion flag (from /review?cid=xxx) ──
    if (body._reviewFlag && body.dealId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await supabase
        .from("deals")
        .update({ review_completed_at: new Date().toISOString() })
        .eq("id", body.dealId);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { name, email, phone, eventType, date, location, message, clientType, guestCount, budget, recommendation, source: formSource } = body;

    // Basic validation
    if (!name || !email || !eventType || !date || !location || !message) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailHtml = `
      <h2>New Booking Inquiry</h2>
      <table style="border-collapse:collapse;width:100%;max-width:600px;">
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Name</td><td style="padding:8px;border-bottom:1px solid #eee;">${name}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Email</td><td style="padding:8px;border-bottom:1px solid #eee;">${email}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Phone</td><td style="padding:8px;border-bottom:1px solid #eee;">${phone || "N/A"}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Client Type</td><td style="padding:8px;border-bottom:1px solid #eee;">${clientType || "Not specified"}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Event Type</td><td style="padding:8px;border-bottom:1px solid #eee;">${eventType}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Date</td><td style="padding:8px;border-bottom:1px solid #eee;">${date}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Guest Count</td><td style="padding:8px;border-bottom:1px solid #eee;">${guestCount || "Not specified"}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Budget</td><td style="padding:8px;border-bottom:1px solid #eee;">${budget || "Not specified"}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Location</td><td style="padding:8px;border-bottom:1px solid #eee;">${location}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">How They Found Us</td><td style="padding:8px;border-bottom:1px solid #eee;color:#2a7d5f;font-weight:bold;">${formSource || "Not specified"}</td></tr>
      </table>
      <h3 style="margin-top:24px;">Message</h3>
      <p style="white-space:pre-wrap;">${message}</p>
    `;

    const firstName = name.split(" ")[0] || name;

    const TRACK_URL = "https://pgjyzayvkyrftcksvncj.supabase.co/functions/v1/track-click";
    const BOOKING_URL = "https://calendar.app.google/9DnGRoMUWaMDvvpt9";
    const GALLERY_URL = "https://whiterabbitla.com/experience";

    function buildTrackedUrl(url: string, contactId: string, step: number, content: string): string {
      const sep = url.includes("?") ? "&" : "?";
      const taggedUrl = `${url}${sep}utm_source=email&utm_medium=inquiry-auto-reply&utm_campaign=inquiry&utm_content=${encodeURIComponent(content)}`;
      return `${TRACK_URL}?cid=${encodeURIComponent(contactId)}&step=${step}&r=${encodeURIComponent(taggedUrl)}`;
    }

    const calendarTrackingUrl = buildTrackedUrl(BOOKING_URL, email, 0, "inquiry-calendar");
    const galleryTrackingUrl = buildTrackedUrl(GALLERY_URL, email, 0, "inquiry-gallery");

    const confirmationHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#335747;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#335747;">
    <tr><td style="padding:40px 20px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="max-width:560px;margin:0 auto;background-color:#223D34;border-radius:8px;overflow:hidden;">
        
        <!-- Logo -->
        <tr><td style="padding:40px 40px 0;text-align:center;">
          <img src="https://pgjyzayvkyrftcksvncj.supabase.co/storage/v1/object/public/email-assets/wr-email-logo.png" alt="White Rabbit" width="90" style="width:90px;height:auto;display:block;margin:0 auto;" />
        </td></tr>

        <!-- Headline -->
        <tr><td style="padding:32px 40px 0;text-align:center;">
          <h1 style="margin:0;font-family:Georgia,serif;font-size:28px;font-weight:normal;color:#F8F5F0;letter-spacing:0.02em;line-height:1.3;">
            Your note reached me, ${firstName}
          </h1>
        </td></tr>

        <!-- Divider -->
        <tr><td style="padding:24px 40px 0;text-align:center;">
          <div style="width:40px;height:1px;background-color:#C9A3A8;margin:0 auto;"></div>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:24px 40px 0;">
          <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:16px;line-height:1.8;color:rgba(245,240,232,0.85);">
            ${firstName}, your inquiry just landed with me — and I'm already looking forward to hearing about your event.
          </p>
          <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:16px;line-height:1.8;color:rgba(245,240,232,0.85);">
            I read every one of these myself, so this isn't an auto-pilot reply. I'll be in touch within a few hours to talk through your evening; every event is different and yours deserves that attention.
          </p>
          <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:16px;line-height:1.8;color:rgba(245,240,232,0.85);">
            If you'd rather not wait, you can put a time straight on my calendar — a short, easy fifteen minutes about what you're planning:
          </p>

          <!-- Calendar CTA Button -->
          <p style="margin:0 0 28px;text-align:center;">
            <a href="${calendarTrackingUrl}" target="_blank" style="display:inline-block;font-family:Georgia,serif;font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#223D34;text-decoration:none;background-color:#C9A3A8;padding:14px 28px;border-radius:4px;">
              Book a 15-minute conversation →
            </a>
          </p>

          <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:16px;line-height:1.8;color:rgba(245,240,232,0.85);">
            And if you'd like a glimpse while you wait:
          </p>
          <p style="margin:0 0 28px;text-align:center;">
            <a href="${galleryTrackingUrl}" target="_blank" style="font-family:Georgia,serif;font-size:14px;letter-spacing:0.15em;text-transform:uppercase;color:#C9A3A8;text-decoration:none;border-bottom:1px solid rgba(201,163,168,0.3);padding-bottom:2px;">
              See a night in action →
            </a>
          </p>
          <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:16px;line-height:1.8;color:rgba(245,240,232,0.85);">
            Looking forward to it.
          </p>
        </td></tr>

        <!-- Sign off -->
        <tr><td style="padding:32px 40px 0;">
          <p style="margin:0;font-family:Georgia,serif;font-size:15px;color:rgba(245,240,232,0.6);">
            Scott Syme
          </p>
          <p style="margin:2px 0 0;font-family:Georgia,serif;font-size:13px;color:rgba(245,240,232,0.4);letter-spacing:0.1em;text-transform:uppercase;">
            Magician · (424) 394-1850 · whiterabbitla.com
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:40px 40px 32px;text-align:center;">
          <p style="margin:0;font-family:Georgia,serif;font-size:11px;color:rgba(245,240,232,0.3);letter-spacing:0.1em;">
            White Rabbit Magic · Los Angeles, CA<br/>
            7393 W. Manchester Ave #209, Los Angeles, CA 90045
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // Send notification to Scott
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "White Rabbit <scott.syme@whiterabbitla.com>",
        to: ["scott.syme@whiterabbitla.com"],
        subject: `Booking Inquiry — ${eventType}`,
        html: emailHtml,
        reply_to: email,
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

    // Send confirmation email to the user
    const confirmRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "White Rabbit <scott.syme@whiterabbitla.com>",
        to: [email],
        reply_to: "events@whiterabbitla.com",
        subject: "Your note reached me, " + firstName,
        html: confirmationHtml,
        text: `${firstName}, your inquiry just landed with me — and I'm already looking forward to hearing about your event.\n\nI read every one of these myself, so this isn't an auto-pilot reply. I'll be in touch within a few hours to talk through your evening; every event is different and yours deserves that attention.\n\nIf you'd rather not wait, you can put a time straight on my calendar — a short, easy fifteen minutes about what you're planning:\n${calendarTrackingUrl}\n\nAnd if you'd like a glimpse while you wait:\n${galleryTrackingUrl}\n\nLooking forward to it.\n\nScott Syme\nMagician · (424) 394-1850 · whiterabbitla.com`,
        headers: {
          "List-Unsubscribe": "<mailto:events@whiterabbitla.com?subject=Unsubscribe>",
        },
      }),
    });

    if (!confirmRes.ok) {
      const confirmErr = await confirmRes.json();
      console.error("Confirmation email error:", confirmErr);
    }

    // Save to contact_inquiries and create deal in pipeline
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const contactEmail = email.toLowerCase().trim();

      // Save inquiry
      const { data: inquiry } = await supabase
        .from("contact_inquiries")
        .insert({
          name,
          email: contactEmail,
          phone: phone || null,
          event_type: eventType,
          date,
          location,
          message,
          client_type: clientType || null,
          guest_count: guestCount || null,
          budget: budget || null,
          recommendation: recommendation || null,
          source: formSource || "contact_form",
        })
        .select("id")
        .single();

      // Create deal in pipeline
      const eventTypeMap: Record<string, string> = {
        "Corporate Event": "corporate",
        "Wedding": "wedding",
        "Private Party": "private_party",
        "Parlor Show": "parlor_show",
      };

      await supabase.from("deals").insert({
        contact_email: contactEmail,
        contact_name: name,
        phone: phone || null,
        event_type: eventTypeMap[eventType] || "other",
        event_date: date || null,
        location: location || null,
        stage: "new",
        source: "contact_form",
        source_id: inquiry?.id || null,
        notes: message || null,
      });

      // Auto-convert: if this email is in the drip campaign, mark as converted
      const { data: dripContact } = await supabase
        .from("newsletter_contacts")
        .select("id, drip_campaign")
        .eq("email", contactEmail)
        .maybeSingle();

      if (dripContact && dripContact.drip_campaign?.startsWith("planner")) {
        await supabase
          .from("newsletter_contacts")
          .update({
            drip_campaign: "planner-converted",
            engagement_status: "hot",
          })
          .eq("id", dripContact.id);
        console.log(`Auto-converted drip contact: ${contactEmail}`);
      }
    } catch (convErr) {
      console.error("Post-send processing failed (non-blocking):", convErr);
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
