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
    const eventType = body.type;

    console.log("Webhook received:", eventType);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Helper: look up newsletter contact by email
    async function getContactByEmail(email: string) {
      const { data } = await supabase
        .from("newsletter_contacts")
        .select("id, engagement_status")
        .eq("email", email.toLowerCase())
        .maybeSingle();
      return data;
    }

    // Helper: look up cold campaign contact by email
    async function getColdContactByEmail(email: string) {
      const { data } = await supabase
        .from("cold_email_campaigns")
        .select("id, email, name, company, campaign_category, status, current_step")
        .eq("email", email.toLowerCase())
        .maybeSingle();
      return data;
    }

    // Helper: log bounce to email_bounces table
    async function logBounce(contactId: string | null, email: string, bounceType: string, reason: string | null) {
      await supabase.from("email_bounces").insert({
        contact_id: contactId,
        email: email.toLowerCase(),
        bounce_type: bounceType,
        reason,
        raw_payload: body,
      });
    }

    // Handle complaint (spam) events — auto-unsubscribe + log bounce
    if (eventType === "email.complained") {
      const recipientEmail = body.data?.to?.[0] || body.data?.email;
      if (recipientEmail) {
        const contact = await getContactByEmail(recipientEmail);
        await supabase
          .from("newsletter_contacts")
          .update({ subscribed: false, engagement_status: "bounced" })
          .eq("email", recipientEmail.toLowerCase());
        await logBounce(contact?.id || null, recipientEmail, "complained", body.data?.reason || body.data?.error || "Spam complaint");
        console.log(`Contact ${recipientEmail} unsubscribed + logged bounce (spam complaint)`);

        // Cold contact: mark as unsubscribed
        const coldContact = await getColdContactByEmail(recipientEmail);
        if (coldContact) {
          await supabase
            .from("cold_email_campaigns")
            .update({ status: "unsubscribed" })
            .eq("id", coldContact.id);
          console.log(`Cold contact ${recipientEmail} marked as unsubscribed (spam complaint)`);
        }
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

    // Handle bounce events — auto-unsubscribe + log bounce
    if (eventType === "email.bounced" || eventType === "email.delivery_delayed") {
      const recipientEmail = body.data?.to?.[0] || body.data?.email;
      if (recipientEmail) {
        const contact = await getContactByEmail(recipientEmail);
        const bounceType = eventType === "email.bounced" ? "bounced" : "delivery_delayed";
        await supabase
          .from("newsletter_contacts")
          .update({ subscribed: false, engagement_status: "bounced" })
          .eq("email", recipientEmail.toLowerCase());
        await logBounce(contact?.id || null, recipientEmail, bounceType, body.data?.reason || body.data?.error || null);
        console.log(`Contact ${recipientEmail} unsubscribed + logged bounce (${eventType})`);

        // Cold contact: mark as bounced
        const coldContact = await getColdContactByEmail(recipientEmail);
        if (coldContact) {
          await supabase
            .from("cold_email_campaigns")
            .update({ status: "bounced" })
            .eq("id", coldContact.id);
          console.log(`Cold contact ${recipientEmail} marked as bounced (${eventType})`);
        }
      }
    }

    // Handle opened events — bump engagement based on total opens
    if (eventType === "email.opened") {
      const recipientEmail = body.data?.to?.[0] || body.data?.email;
      if (recipientEmail) {
        const contact = await getContactByEmail(recipientEmail);

        if (contact && (contact.engagement_status === "new" || contact.engagement_status === "warm")) {
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

        // Cold contact: log open
        const coldContact = await getColdContactByEmail(recipientEmail);
        if (coldContact) {
          console.log(`Cold contact opened email: ${recipientEmail} (campaign: ${coldContact.campaign_category}, step: ${coldContact.current_step}, status: ${coldContact.status})`);
        }
      }
    }

    // Handle click events — mark as hot lead + notify
    if (eventType === "email.clicked") {
      const recipientEmail = body.data?.to?.[0] || body.data?.email;
      if (recipientEmail) {
        const contact = await getContactByEmail(recipientEmail);

        if (contact) {
          await supabase
            .from("newsletter_contacts")
            .update({ engagement_status: "hot" })
            .eq("id", contact.id);
          console.log(`Contact ${recipientEmail} marked as hot (clicked)`);

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

        // Cold contact: pause campaign, create deal, notify
        const coldContact = await getColdContactByEmail(recipientEmail);
        if (coldContact && coldContact.status === "active") {
          // Pause the cold campaign
          await supabase
            .from("cold_email_campaigns")
            .update({ status: "paused" })
            .eq("id", coldContact.id);
          console.log(`Cold contact ${recipientEmail} paused (clicked link)`);

          const clickedLink = body.data?.click?.link || "unknown";

          // Create a deal
          await supabase.from("deals").insert({
            contact_name: coldContact.name,
            contact_email: recipientEmail.toLowerCase(),
            company: coldContact.company,
            source: "cold_outreach",
            stage: "new",
            notes: `Cold contact clicked link in drip email step ${coldContact.current_step} campaign ${coldContact.campaign_category} — auto-created from click detection.`,
          });
          console.log(`Deal created for cold contact ${recipientEmail}`);

          // Notify Scott
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
                subject: `🎯 Cold Lead Clicked: ${recipientEmail}`,
                html: `<p>A cold outreach contact clicked a link!</p>
<p><strong>Name:</strong> ${coldContact.name || "Unknown"}</p>
<p><strong>Email:</strong> ${recipientEmail}</p>
<p><strong>Company:</strong> ${coldContact.company || "Unknown"}</p>
<p><strong>Campaign:</strong> ${coldContact.campaign_category}</p>
<p><strong>Step:</strong> ${coldContact.current_step}</p>
<p><strong>Link Clicked:</strong> ${clickedLink}</p>
<p><strong>Follow up immediately!</strong></p>`,
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
