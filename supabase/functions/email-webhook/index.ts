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

        // Determine bounce subtype:
        //   delivery_delayed → 'delivery_delayed' (soft, transient)
        //   bounced + Resend bounceType=Permanent → 'hard_bounce'
        //   bounced + Resend bounceType=Transient → 'soft_bounce'
        //   bounced + missing bounceType → 'bounced' (legacy/unknown)
        let bounceType: string;
        if (eventType === "email.delivery_delayed") {
          bounceType = "delivery_delayed";
        } else {
          const resendSubtype = body.data?.bounce?.type;
          if (resendSubtype === "Permanent") bounceType = "hard_bounce";
          else if (resendSubtype === "Transient") bounceType = "soft_bounce";
          else bounceType = "bounced";
        }

        await supabase
          .from("newsletter_contacts")
          .update({ subscribed: false, engagement_status: "bounced" })
          .eq("email", recipientEmail.toLowerCase());
        await logBounce(contact?.id || null, recipientEmail, bounceType, body.data?.reason || body.data?.error || null);
        console.log(`Contact ${recipientEmail} unsubscribed + logged bounce (${eventType} → ${bounceType})`);

        // Cold contact: only auto-suppress on HARD bounces. Soft bounces and
        // delivery delays are recoverable — drip continues, watchdog handles repeats.
        if (bounceType === "hard_bounce" || bounceType === "bounced") {
          const coldContact = await getColdContactByEmail(recipientEmail);
          if (coldContact && coldContact.status === "active") {
            await supabase
              .from("cold_email_campaigns")
              .update({ status: "bounced" })
              .eq("id", coldContact.id);
            console.log(`Cold contact ${recipientEmail} marked as bounced (${bounceType})`);
          }
        } else {
          console.log(`Soft/delayed bounce (${bounceType}) for ${recipientEmail} — cold campaign status unchanged`);
        }
      }
    }

    // Handle opened events — persist row + bump engagement based on total opens
    if (eventType === "email.opened") {
      const recipientEmail = body.data?.to?.[0] || body.data?.email;
      if (recipientEmail) {
        const contact = await getContactByEmail(recipientEmail);
        const coldContact = !contact ? await getColdContactByEmail(recipientEmail) : null;

        // Persist open row keyed by whichever source matched
        if (contact) {
          await supabase.from("newsletter_opens").insert({
            contact_id: contact.id,
            drip_step: 0,
            user_agent: body.data?.user_agent || null,
            contact_source: "newsletter",
          });
        } else if (coldContact) {
          await supabase.from("newsletter_opens").insert({
            contact_id: coldContact.id,
            drip_step: coldContact.current_step ?? 0,
            user_agent: body.data?.user_agent || null,
            contact_source: "cold",
          });
          console.log(`Cold contact opened email: ${recipientEmail} (campaign: ${coldContact.campaign_category}, step: ${coldContact.current_step})`);
        }

        // Mirror open into action_log
        if (contact || coldContact) {
          await supabase.from("action_log").insert({
            action_type: "email_opened",
            contact_email: recipientEmail,
            contact_name: contact?.name || coldContact?.contact_name || null,
            summary: `${recipientEmail} opened an email`,
            metadata: { source: contact ? "newsletter" : "cold", user_agent: body.data?.user_agent || null },
          });
        }

        if (contact && (contact.engagement_status === "new" || contact.engagement_status === "warm")) {
          const { count: openCount } = await supabase
            .from("newsletter_opens")
            .select("*", { count: "exact", head: true })
            .eq("contact_id", contact.id)
            .eq("contact_source", "newsletter");

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
        const contact = await getContactByEmail(recipientEmail);

        if (contact) {
          // Persist click row for newsletter contact
          await supabase.from("newsletter_clicks").insert({
            contact_id: contact.id,
            drip_step: 0,
            link_slug: (body.data?.click?.link || "").replace(/^https?:\/\/[^/]+/, "").replace(/^\//, ""),
            contact_source: "newsletter",
          });

          await supabase.from("action_log").insert({
            action_type: "email_clicked",
            contact_email: recipientEmail,
            contact_name: contact.name || null,
            summary: `${recipientEmail} clicked a link`,
            metadata: { link: body.data?.click?.link || null, source: "newsletter" },
          });

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

        // Cold contact: persist click row + tiered click handling based on link intent
        const coldContact = await getColdContactByEmail(recipientEmail);
        if (coldContact) {
          const _clickedLinkAll = body.data?.click?.link || "";
          await supabase.from("newsletter_clicks").insert({
            contact_id: coldContact.id,
            drip_step: coldContact.current_step ?? 0,
            link_slug: _clickedLinkAll.replace(/^https?:\/\/[^/]+/, "").replace(/^\//, ""),
            contact_source: "cold",
          });
          await supabase.from("action_log").insert({
            action_type: "email_clicked",
            contact_email: recipientEmail,
            contact_name: coldContact.contact_name || null,
            summary: `${recipientEmail} clicked a link`,
            metadata: { link: _clickedLinkAll, source: "cold" },
          });
        }
        if (coldContact && coldContact.status === "active") {
          const clickedLink = body.data?.click?.link || "";
          const isHighIntent = /calendar\.app\.google|mailto:|\/book|\/consultation/i.test(clickedLink);

          if (isHighIntent) {
            // TIER 1: High-intent click — pause drip, create deal, notify
            await supabase
              .from("cold_email_campaigns")
              .update({ status: "paused" })
              .eq("id", coldContact.id);
            console.log(`Cold contact ${recipientEmail} paused (high-intent click: ${clickedLink})`);

            await supabase.from("deals").insert({
              contact_name: coldContact.name,
              contact_email: recipientEmail.toLowerCase(),
              company: coldContact.company,
              source: "cold_outreach",
              stage: "new",
              notes: `Cold contact clicked link in drip email step ${coldContact.current_step} campaign ${coldContact.campaign_category} — auto-created from click detection.`,
            });
            console.log(`Deal created for cold contact ${recipientEmail}`);

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
                  html: `<p>A cold outreach contact clicked a high-intent link!</p>
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
          } else {
            // TIER 2: Low-intent browse click — log only, drip continues
            console.log(`Cold contact ${recipientEmail} clicked non-intent link: ${clickedLink} (campaign: ${coldContact.campaign_category}, step: ${coldContact.current_step}) — drip continues`);
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
