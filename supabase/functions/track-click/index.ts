import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = "https://whiterabbitla.com";
const LOGO_URL = "https://pgjyzayvkyrftcksvncj.supabase.co/storage/v1/object/public/email-assets/wr-email-logo.png";

function extractFirstName(name: string | null | undefined): string {
  if (!name) return "there";
  if (name.includes(" and ") || name.includes(" & ")) return name;
  if (name.trim().toLowerCase().endsWith("team")) return name;
  return name.split(" ")[0];
}

// Campaign types that have warm nurture sequences
const WARM_NURTURE_CAMPAIGNS: Record<string, string> = {
  "planner": "planner-warm",
  "resident": "resident-warm",
};

// Nurture Email 1 — sent immediately on 3rd click
function buildNurtureEmail1(name: string, email: string): { subject: string; html: string } {
  const subject = "Quick thought for your next event";
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
body { margin: 0; padding: 0; width: 100% !important; background-color: #335747; }
@media screen and (max-width: 600px) {
  .email-container { width: 100% !important; }
  .padding-mobile { padding-left: 20px !important; padding-right: 20px !important; }
}
</style>
</head>
<body style="margin:0; padding:0; background-color:#335747;">
<div style="display:none; max-height:0; overflow:hidden; font-size:1px; line-height:1px; color:#335747;">Since you were curious...</div>
<center style="width:100%; background-color:#335747;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#335747;">
<tr><td style="padding: 30px 0;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" align="center" class="email-container" style="max-width:560px; margin:auto; background-color:#223D34; border-radius:4px;">
<tr><td style="padding: 40px 40px 24px; text-align:center;" class="padding-mobile">
<img src="${LOGO_URL}" alt="White Rabbit" width="90" style="width:90px; height:auto; display:block; margin:0 auto;" />
</td></tr>
<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">Hey ${name},</p>
<p style="margin:0 0 18px;">I noticed you checked out some of our work. Figured I'd reach out directly.</p>
<p style="margin:0 0 18px;">Most planners I work with start with a quick 10-minute call to talk through the event, the vibe, and which format would land best. No pitch, just a conversation about what would actually make your event unforgettable.</p>
<p style="margin:0 0 18px;">Want to find 10 minutes this week?</p>
<p style="margin:0 0 18px;"><a href="mailto:events@whiterabbitla.com?subject=Let's%20chat%20about%20an%20event" style="color:#C9A3A8; text-decoration:none; border-bottom:1px solid rgba(201,163,168,0.3);">Just reply to this email</a> or call me at (424) 394-1850.</p>
<p style="margin:18px 0 0; text-align:center;">
<a href="https://calendar.app.google/58WjggPt3RFAcJjq8" target="_blank" style="display:inline-block; padding:12px 32px; font-family:Georgia,serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#C9A3A8; text-decoration:none; font-weight:bold; border:1px solid #C9A3A8; border-radius:2px;">Book a Call</a>
</p>
<p style="margin:18px 0 0; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);">
Scott Syme<br/>
<span style="font-size:13px; color:rgba(245,240,232,0.5);">White Rabbit · Los Angeles</span><br/>
<span style="font-size:12px; color:rgba(245,240,232,0.35);">(424) 394-1850 · scott.syme@whiterabbitla.com</span><br/>
<span style="font-size:12px;"><a href="https://whiterabbitla.com" style="color:rgba(245,240,232,0.35); text-decoration:none;">whiterabbitla.com</a></span>
</p>
</td></tr>
<tr><td style="padding: 0 40px;" class="padding-mobile">
<hr style="border:none; border-top:1px solid rgba(201,163,168,0.15); margin:0 0 24px;" />
</td></tr>
<tr><td style="padding: 0 40px 12px; text-align:center;" class="padding-mobile">
<p style="margin:0; font-family:Georgia,serif; font-size:12px; color:rgba(245,240,232,0.4);">
White Rabbit · Los Angeles<br/>7393 W. Manchester Ave #209, Los Angeles, CA 90045<br/>
<a href="mailto:events@whiterabbitla.com" style="color:#C9A3A8; text-decoration:none;">events@whiterabbitla.com</a> · <a href="tel:+14243941850" style="color:rgba(248,245,240,0.4); text-decoration:none;">(424) 394-1850</a>
</p>
</td></tr>
<tr><td style="padding: 0 40px 32px; text-align:center;" class="padding-mobile">
<p style="margin:0; font-family:Georgia,serif; font-size:11px; color:rgba(245,240,232,0.25);">
<a href="${SITE_URL}/unsubscribe?email=${encodeURIComponent(email)}" style="color:rgba(245,240,232,0.3); text-decoration:underline;">Unsubscribe</a>
</p>
</td></tr>
</table>
</td></tr></table>
</center>
</body></html>`;
  return { subject, html };
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const contactId = url.searchParams.get("cid");
    const step = url.searchParams.get("step");
    const redirect = url.searchParams.get("r");

    if (!redirect) {
      return new Response("Missing redirect", { status: 400 });
    }

    const redirectUrl = decodeURIComponent(redirect);

    // Process click tracking (don't block the redirect)
    if (contactId && step) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const linkSlug = redirectUrl.replace(SITE_URL, "").replace(/^\//, "");

      // Insert click record
      await supabase.from("newsletter_clicks").insert({
        contact_id: contactId,
        drip_step: parseInt(step),
        link_slug: linkSlug,
      });

      // Count total clicks for this contact
      const { count: clickCount } = await supabase
        .from("newsletter_clicks")
        .select("*", { count: "exact", head: true })
        .eq("contact_id", contactId);

      const totalClicks = clickCount || 1;

      // Fetch contact for all escalation paths
      const { data: contact } = await supabase
        .from("newsletter_contacts")
        .select("drip_campaign, engagement_status, name, email")
        .eq("id", contactId)
        .single();

      if (contact) {
        if (totalClicks >= 3 && contact.engagement_status !== "hot") {
          // 3+ clicks: mark as Hot for ANY campaign type
          const warmNurtureCampaign = WARM_NURTURE_CAMPAIGNS[contact.drip_campaign];

          if (warmNurtureCampaign) {
            // Has a warm nurture sequence — transition into it
            await supabase
              .from("newsletter_contacts")
              .update({
                engagement_status: "hot",
                drip_campaign: warmNurtureCampaign,
                drip_step: 1,
                drip_started_at: new Date().toISOString(),
                last_emailed_at: new Date().toISOString(),
              })
              .eq("id", contactId);

            // Send Nurture Email 1 immediately
            const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
            if (RESEND_API_KEY && contact.email) {
              const firstName = extractFirstName(contact.name);
              const { subject, html } = buildNurtureEmail1(firstName, contact.email);
              try {
                await fetch("https://api.resend.com/emails", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
                  body: JSON.stringify({
                    from: "Scott Syme | White Rabbit LA <scott.syme@whiterabbitla.com>",
                    to: [contact.email],
                    reply_to: "events@whiterabbitla.com",
                    subject,
                    html,
                    headers: {
                      "List-Unsubscribe": `<${SITE_URL}/unsubscribe?email=${encodeURIComponent(contact.email)}>, <mailto:events@whiterabbitla.com?subject=Unsubscribe>`,
                      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
                    },
                  }),
                });
                await supabase.from("newsletter_send_log").insert({
                  campaign_id: `${warmNurtureCampaign}-step-0`,
                  contact_id: contactId,
                  ab_variant: "A",
                });
              } catch (e) {
                console.error("Failed to send immediate nurture email:", e);
              }
            }
          } else {
            // No warm nurture sequence — just mark as hot
            await supabase
              .from("newsletter_contacts")
              .update({ engagement_status: "hot" })
              .eq("id", contactId);
          }
        } else if (totalClicks >= 1 && contact.engagement_status === "new") {
          // 1-2 clicks: mark as warm for ANY campaign type
          await supabase
            .from("newsletter_contacts")
            .update({ engagement_status: "warm" })
            .eq("id", contactId);
        }
      }
    }

    // Redirect to the actual destination
    return new Response(null, {
      status: 302,
      headers: { Location: redirectUrl },
    });
  } catch (error) {
    console.error("track-click error:", error);
    const url = new URL(req.url);
    const redirect = url.searchParams.get("r");
    if (redirect) {
      return new Response(null, {
        status: 302,
        headers: { Location: decodeURIComponent(redirect) },
      });
    }
    return new Response("Error", { status: 500 });
  }
});
