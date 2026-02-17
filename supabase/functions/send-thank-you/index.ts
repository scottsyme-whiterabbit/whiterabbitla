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
    const { clientName, clientEmail, eventType, adminPassword } = await req.json();

    // Verify admin
    const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD");
    if (!adminPassword || adminPassword !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!clientName || !clientEmail) {
      return new Response(JSON.stringify({ error: "Client name and email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const firstName = clientName.split(" ")[0] || clientName;
    const eventLabel = eventType || "your event";

    const thankYouHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#2D4A3E;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#2D4A3E;">
    <tr><td style="padding:40px 20px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="max-width:560px;margin:0 auto;background-color:#1e352c;border-radius:8px;overflow:hidden;">
        
        <!-- Logo -->
        <tr><td style="padding:40px 40px 0;text-align:center;">
          <img src="https://pgjyzayvkyrftcksvncj.supabase.co/storage/v1/object/public/email-assets/wr-symbol.png" alt="White Rabbit" width="50" style="width:50px;height:auto;display:block;margin:0 auto;" />
        </td></tr>

        <!-- Headline -->
        <tr><td style="padding:32px 40px 0;text-align:center;">
          <h1 style="margin:0;font-family:Georgia,serif;font-size:28px;font-weight:normal;color:#F5F0E8;letter-spacing:0.02em;line-height:1.3;">
            Thank You, ${firstName}
          </h1>
        </td></tr>

        <!-- Divider -->
        <tr><td style="padding:24px 40px 0;text-align:center;">
          <div style="width:40px;height:1px;background-color:#c8a0a0;margin:0 auto;"></div>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:24px 40px 0;">
          <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:16px;line-height:1.8;color:rgba(245,240,232,0.85);">
            It was a genuine pleasure performing at ${eventLabel}. I hope the magic created a few moments your guests will be talking about for a while.
          </p>
          <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:16px;line-height:1.8;color:rgba(245,240,232,0.85);">
            If you have a moment, I'd be incredibly grateful if you could share your experience with a quick review. It helps other hosts discover White Rabbit, and it means more than you know.
          </p>
        </td></tr>

        <!-- CTA Button -->
        <tr><td style="padding:24px 40px 0;text-align:center;">
          <a href="https://whiterabbitla.com/review" style="display:inline-block;font-family:Georgia,serif;font-size:14px;letter-spacing:0.15em;text-transform:uppercase;color:#1e352c;background-color:#c8a0a0;text-decoration:none;padding:14px 32px;border-radius:2px;">
            Share Your Experience
          </a>
        </td></tr>

        <!-- Secondary -->
        <tr><td style="padding:24px 40px 0;">
          <p style="margin:0;font-family:Georgia,serif;font-size:16px;line-height:1.8;color:rgba(245,240,232,0.85);">
            And of course — if you ever need entertainment for a future event, or know someone who does, I'm always just an email away.
          </p>
        </td></tr>

        <!-- Sign off -->
        <tr><td style="padding:32px 40px 0;">
          <p style="margin:0;font-family:Georgia,serif;font-size:15px;color:rgba(245,240,232,0.6);font-style:italic;">
            With gratitude,
          </p>
          <p style="margin:4px 0 0;font-family:Georgia,serif;font-size:16px;color:#F5F0E8;">
            Scott Syme
          </p>
          <p style="margin:2px 0 0;font-family:Georgia,serif;font-size:13px;color:rgba(245,240,232,0.4);letter-spacing:0.1em;text-transform:uppercase;">
            White Rabbit · Los Angeles
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

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Scott Syme <scott.syme@whiterabbitla.com>",
        to: [clientEmail],
        subject: `Thank you for having me, ${firstName}`,
        html: thankYouHtml,
        reply_to: "scott.syme@whiterabbitla.com",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend error:", data);
      return new Response(JSON.stringify({ error: "Failed to send", details: data }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
