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
    const { campaignId, adminPassword } = await req.json();
    
    // Simple password check
    if (adminPassword !== Deno.env.get("ADMIN_PASSWORD")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get the campaign
    const { data: campaign, error: campError } = await supabase
      .from("newsletter_campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campError || !campaign) {
      return new Response(JSON.stringify({ error: "Campaign not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (campaign.status === "sent" || campaign.status === "sending") {
      return new Response(JSON.stringify({ error: `Campaign already ${campaign.status}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark as sending
    await supabase.from("newsletter_campaigns").update({ status: "sending" }).eq("id", campaignId);

    // Get subscribed contacts
    const { data: contacts, error: contactsError } = await supabase
      .from("newsletter_contacts")
      .select("id, email, name")
      .eq("subscribed", true);

    if (contactsError || !contacts?.length) {
      await supabase.from("newsletter_campaigns").update({ status: "draft" }).eq("id", campaignId);
      return new Response(JSON.stringify({ error: "No subscribed contacts found" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sentCount = 0;
    const errors: string[] = [];

    // Send in batches of 10
    for (let i = 0; i < contacts.length; i += 10) {
      const batch = contacts.slice(i, i + 10);
      
      const promises = batch.map(async (contact) => {
        try {
          // Personalize the email
          let html = campaign.body_html
            .replace(/\{\{NAME\}\}/g, contact.name || "there")
            .replace(/\{\{UNSUBSCRIBE_LINK\}\}/g, `https://whiterabbitla.com/unsubscribe?email=${encodeURIComponent(contact.email)}`);

          // Inject open tracking pixel
          const openPixel = `<img src="https://pgjyzayvkyrftcksvncj.supabase.co/functions/v1/track-open?cid=${contact.id}&step=0&cam=${campaignId}" width="1" height="1" style="display:block;width:1px;height:1px;border:0;" alt="" />`;
          if (html.includes("</body>")) {
            html = html.replace("</body>", `${openPixel}</body>`);
          } else {
            html += openPixel;
          }

          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "White Rabbit <scott.syme@whiterabbitla.com>",
              to: [contact.email],
              reply_to: "events@whiterabbitla.com",
              subject: campaign.subject,
              html,
              text: `${campaign.subject}\n\nView this email in your browser. If you'd like to unsubscribe, visit: https://whiterabbitla.com/unsubscribe?email=${encodeURIComponent(contact.email)}\n\nWhite Rabbit · Los Angeles\n7393 W. Manchester Ave #209, Los Angeles, CA 90045`,
              headers: {
                "List-Unsubscribe": `<https://whiterabbitla.com/unsubscribe?email=${encodeURIComponent(contact.email)}>, <mailto:events@whiterabbitla.com?subject=Unsubscribe>`,
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
              },
            }),
          });

          if (res.ok) {
            sentCount++;
            // Log the send
            await supabase.from("newsletter_send_log").insert({
              campaign_id: campaignId,
              contact_id: contact.id,
              status: "sent",
            });
            // Update last_emailed_at
            await supabase.from("newsletter_contacts").update({ last_emailed_at: new Date().toISOString() }).eq("id", contact.id);
          } else {
            const errData = await res.json();
            errors.push(`${contact.email}: ${JSON.stringify(errData)}`);
          }
        } catch (e) {
          errors.push(`${contact.email}: ${e instanceof Error ? e.message : "Unknown error"}`);
        }
      });

      await Promise.all(promises);
      
      // Small delay between batches to respect rate limits
      if (i + 10 < contacts.length) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    // Update campaign status
    await supabase.from("newsletter_campaigns").update({
      status: "sent",
      sent_count: sentCount,
    }).eq("id", campaignId);

    return new Response(JSON.stringify({
      success: true,
      sent: sentCount,
      total: contacts.length,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-newsletter error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
