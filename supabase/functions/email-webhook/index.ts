import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Resend webhook handler for reply detection
// Set up in Resend dashboard: Webhooks → Add endpoint → select "email.replied" event
// URL: https://pgjyzayvkyrftcksvncj.supabase.co/functions/v1/email-webhook

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const eventType = body.type;

    console.log("Webhook received:", eventType);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Handle reply events
    if (eventType === "email.replied" || eventType === "email.complained") {
      const recipientEmail = body.data?.to?.[0] || body.data?.email;

      if (recipientEmail) {
        // Find the contact and mark as hot lead
        const { data: contact } = await supabase
          .from("newsletter_contacts")
          .select("id, engagement_status")
          .eq("email", recipientEmail.toLowerCase())
          .maybeSingle();

        if (contact) {
          await supabase
            .from("newsletter_contacts")
            .update({
              reply_detected: true,
              engagement_status: "hot",
            })
            .eq("id", contact.id);

          console.log(`Contact ${recipientEmail} marked as hot lead (reply detected)`);

          // Send notification to Scott
          const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
          if (RESEND_API_KEY) {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
              },
              body: JSON.stringify({
                from: "White Rabbit System <scott.syme@whiterabbitla.com>",
                to: ["scott.syme@whiterabbitla.com"],
                subject: `🔥 Hot Lead: ${recipientEmail} replied!`,
                html: `<p>A planner drip contact has replied to one of your emails.</p>
<p><strong>Email:</strong> ${recipientEmail}</p>
<p><strong>Event:</strong> ${eventType}</p>
<p>Check your inbox and follow up personally!</p>`,
              }),
            });
          }
        }
      }
    }

    // Handle bounce/unsubscribe events
    if (eventType === "email.bounced" || eventType === "email.delivery_delayed") {
      const recipientEmail = body.data?.to?.[0] || body.data?.email;
      if (recipientEmail) {
        await supabase
          .from("newsletter_contacts")
          .update({ subscribed: false })
          .eq("email", recipientEmail.toLowerCase());
        console.log(`Contact ${recipientEmail} unsubscribed (${eventType})`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("email-webhook error:", error);
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
