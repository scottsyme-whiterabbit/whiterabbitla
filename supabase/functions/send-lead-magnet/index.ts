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
    const { email, sourcePage } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
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

    // 1. Send the guide email to the lead
    const leadEmailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#335747;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#335747;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#223D34;border:1px solid rgba(201,163,168,0.2);">
        
        <!-- Header -->
        <tr><td style="padding:48px 40px 24px;text-align:center;">
          <img src="https://pgjyzayvkyrftcksvncj.supabase.co/storage/v1/object/public/email-assets/wr-symbol-outline.png" alt="White Rabbit" style="width:60px;height:auto;margin:0 auto 20px;" />
          <h1 style="font-family:Georgia,serif;font-size:32px;color:#F8F5F0;margin:0 0 8px;font-weight:normal;">The Host's Playbook</h1>
          <p style="font-family:Georgia,serif;font-size:16px;color:rgba(245,240,232,0.5);margin:0;font-style:italic;">7 Secrets to Choosing Entertainment That Makes Your Event Legendary</p>
        </td></tr>

        <!-- Divider -->
        <tr><td style="padding:0 40px;">
          <hr style="border:none;border-top:1px solid rgba(201,163,168,0.2);margin:0;" />
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px 40px;">
          <p style="font-family:Georgia,serif;font-size:16px;color:rgba(245,240,232,0.8);line-height:1.7;margin:0 0 24px;">
            Thank you for downloading The Host's Playbook. You now have access to the exact framework that clients like Morgan Stanley, Netflix, and Rolls-Royce use when planning unforgettable events.
          </p>
          <p style="font-family:Georgia,serif;font-size:16px;color:rgba(245,240,232,0.8);line-height:1.7;margin:0 0 32px;">
            Your guide is ready — click below to access it:
          </p>

          <!-- CTA Button -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="https://whiterabbitla.com/guide" 
                 style="display:inline-block;font-family:sans-serif;font-size:13px;letter-spacing:2px;text-transform:uppercase;background-color:#C9A3A8;color:#223D34;text-decoration:none;padding:16px 40px;">
                Download Your Guide
              </a>
            </td></tr>
          </table>

          <p style="font-family:Georgia,serif;font-size:14px;color:rgba(245,240,232,0.4);line-height:1.7;margin:32px 0 0;text-align:center;">
            <em>When you're ready to create something unforgettable, we'd love to hear from you.</em>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 40px 40px;text-align:center;">
          <hr style="border:none;border-top:1px solid rgba(201,163,168,0.15);margin:0 0 24px;" />
          <p style="font-family:sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(245,240,232,0.3);margin:0;">
            White Rabbit · Los Angeles<br/>
            7393 W. Manchester Ave #209, Los Angeles, CA 90045
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const leadRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "White Rabbit <scott.syme@whiterabbitla.com>",
        to: [email],
        reply_to: "events@whiterabbitla.com",
        subject: "Your Host's Playbook Is Ready ✨",
        html: leadEmailHtml,
        text: `Thank you for downloading The Host's Playbook.\n\nYou now have access to the exact framework that clients like Morgan Stanley, Netflix, and Rolls-Royce use when planning unforgettable events.\n\nDownload your guide: https://whiterabbitla.com/guide\n\nWhen you're ready to create something unforgettable, we'd love to hear from you.\n\nWhite Rabbit · Los Angeles\n7393 W. Manchester Ave #209, Los Angeles, CA 90045`,
        headers: {
          "List-Unsubscribe": "<mailto:events@whiterabbitla.com?subject=Unsubscribe>",
        },
      }),
    });

    const leadData = await leadRes.json();
    if (!leadRes.ok) {
      console.error("Resend error (lead email):", leadData);
    }

    // 2. Notify Scott about the new lead
    const notifyHtml = `
      <h2>🐇 New Lead Magnet Signup</h2>
      <table style="border-collapse:collapse;width:100%;max-width:500px;">
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Email</td><td style="padding:8px;border-bottom:1px solid #eee;">${email}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Source Page</td><td style="padding:8px;border-bottom:1px solid #eee;">${sourcePage || "Unknown"}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Time</td><td style="padding:8px;border-bottom:1px solid #eee;">${new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })}</td></tr>
      </table>
    `;

    const notifyRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "White Rabbit <scott.syme@whiterabbitla.com>",
        to: ["scott.syme@whiterabbitla.com"],
        subject: `New Lead: ${email}`,
        html: notifyHtml,
      }),
    });

    const notifyData = await notifyRes.json();
    if (!notifyRes.ok) {
      console.error("Resend error (notify email):", notifyData);
    }

    return new Response(
      JSON.stringify({ success: true }),
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
