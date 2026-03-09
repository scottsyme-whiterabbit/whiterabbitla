import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Resend webhook handler for email event tracking
// Set up in Resend dashboard: Webhooks → Add endpoint
// Select events: email.bounced, email.complained, email.delivered, email.opened, email.clicked
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

    // Handle complaint (spam) events — auto-unsubscribe
    if (eventType === "email.complained") {
      const recipientEmail = body.data?.to?.[0] || body.data?.email;
      if (recipientEmail) {
        await supabase
          .from("newsletter_contacts")
          .update({ subscribed: false, engagement_status: "unsubscribed" })
          .eq("email", recipientEmail.toLowerCase());
        console.log(`Contact ${recipientEmail} unsubscribed (spam complaint)`);
      }
    }

    // Handle manual unsubscribe from the website
    if (eventType === "unsubscribe_manual") {
      const recipientEmail = body.data?.email_address;
      if (recipientEmail) {
        await supabase
          .from("newsletter_contacts")
          .update({ subscribed: false })
          .eq("email", recipientEmail.toLowerCase().trim());
        console.log(`Contact ${recipientEmail} manually unsubscribed`);
      }
    }

    // Handle bounce events — auto-unsubscribe
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

    // Handle opened events — bump engagement based on total opens
    if (eventType === "email.opened") {
      const recipientEmail = body.data?.to?.[0] || body.data?.email;
      if (recipientEmail) {
        const { data: contact } = await supabase
          .from("newsletter_contacts")
          .select("id, engagement_status")
          .eq("email", recipientEmail.toLowerCase())
          .maybeSingle();

        if (contact && (contact.engagement_status === "new" || contact.engagement_status === "warm")) {
          // Count total opens for this contact
          const { count: openCount } = await supabase
            .from("newsletter_opens")
            .select("*", { count: "exact", head: true })
            .eq("contact_id", contact.id);

          const totalOpens = openCount || 1;

          if (totalOpens >= 5 && contact.engagement_status !== "hot") {
            await supabase
              .from("newsletter_contacts")
              .update({ engagement_status: "hot" })
              .eq("id", contact.id);
            console.log(`Contact ${recipientEmail} upgraded to hot (${totalOpens} opens)`);
          } else if (totalOpens >= 1 && contact.engagement_status === "new") {
            await supabase
              .from("newsletter_contacts")
              .update({ engagement_status: "warm" })
              .eq("id", contact.id);
            console.log(`Contact ${recipientEmail} upgraded to warm (opened)`);
          }
        }
      }
    }

    // Handle click events — mark as hot lead + notify
    if (eventType === "email.clicked") {
      const recipientEmail = body.data?.to?.[0] || body.data?.email;
      if (recipientEmail) {
        const { data: contact } = await supabase
          .from("newsletter_contacts")
          .select("id, engagement_status")
          .eq("email", recipientEmail.toLowerCase())
          .maybeSingle();

        if (contact) {
          await supabase
            .from("newsletter_contacts")
            .update({ engagement_status: "hot" })
            .eq("id", contact.id);
          console.log(`Contact ${recipientEmail} marked as hot (clicked)`);

          // Notify Scott about hot lead
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
                subject: `🔥 Hot Lead: ${recipientEmail} clicked a link!`,
                html: `<p>A drip contact clicked a link in your email.</p>
<p><strong>Email:</strong> ${recipientEmail}</p>
<p><strong>Link:</strong> ${body.data?.click?.link || "unknown"}</p>
<p>Follow up while they're engaged!</p>`,
              }),
            });
          }
        }
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
