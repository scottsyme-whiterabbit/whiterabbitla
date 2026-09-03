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
    const { campaignId, adminPassword, testEmail, segment, maxSends } = await req.json();
    
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

    // TEST EMAIL PATH: send one copy to testEmail without touching status,
    // contacts, send log, or sent_count.
    if (testEmail) {
      const testContactId = "test";
      let testHtml = campaign.body_html
        .replace(/\{\{NAME\}\}/g, "Scott")
        .replace(/\{\{UNSUBSCRIBE_LINK\}\}/g, `https://whiterabbitla.com/unsubscribe?email=${encodeURIComponent(testEmail)}`);

      const campaignSlug = (campaign.campaign_type || "newsletter").replace(/\s+/g, "-").toLowerCase();
      testHtml = testHtml.replace(
        /href="(https:\/\/whiterabbitla\.com[^"]*?)"/g,
        (_match: string, url: string) => {
          if (url.includes("utm_source") || url.includes("/unsubscribe")) return `href="${url}"`;
          const sep = url.includes("?") ? "&" : "?";
          return `href="${url}${sep}utm_source=email&utm_medium=newsletter&utm_campaign=${encodeURIComponent(campaignSlug)}&utm_content=${encodeURIComponent(campaignId)}"`;
        }
      );

      const openPixel = `<img src="https://pgjyzayvkyrftcksvncj.supabase.co/functions/v1/track-open?cid=${testContactId}&step=0&cam=${campaignId}" width="1" height="1" style="display:block;width:1px;height:1px;border:0;" alt="" />`;
      if (testHtml.includes("</body>")) {
        testHtml = testHtml.replace("</body>", `${openPixel}</body>`);
      } else {
        testHtml += openPixel;
      }

      // RFC 8058 one-click unsubscribe must point at the edge function,
      // not the SPA route (same pattern as cold-drip).
      const oneClickUrl = `https://pgjyzayvkyrftcksvncj.supabase.co/functions/v1/unsubscribe-oneclick?email=${encodeURIComponent(testEmail)}`;
      const testRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "White Rabbit <scott.syme@whiterabbitla.com>",
          to: [testEmail],
          reply_to: "events@whiterabbitla.com",
          subject: `[TEST] ${campaign.subject}`,
          html: testHtml,
          text: `${campaign.subject}\n\nView this email in your browser. If you'd like to unsubscribe, visit: https://whiterabbitla.com/unsubscribe?email=${encodeURIComponent(testEmail)}\n\nWhite Rabbit · Los Angeles\n7393 W. Manchester Ave #209, Los Angeles, CA 90045`,
          headers: {
            "List-Unsubscribe": `<mailto:unsubscribe@whiterabbitla.com?subject=unsubscribe>, <${oneClickUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        }),
      });

      if (!testRes.ok) {
        const errData = await testRes.json();
        return new Response(JSON.stringify({ error: errData.message || JSON.stringify(errData) }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, test: true, sentTo: testEmail }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (campaign.status === "sent") {
      return new Response(JSON.stringify({ error: `Campaign already ${campaign.status}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const segmentKey: string = segment && segment !== "all" ? segment : "";

    // Helper: eligible recipients = subscribed (optionally segmented) minus anyone already in the send log
    const fetchEligible = async () => {
      let q = supabase.from("newsletter_contacts").select("id, email, name").eq("subscribed", true);
      if (segmentKey) q = q.eq("drip_campaign", segmentKey);
      const { data: all, error: err } = await q;
      if (err) throw err;

      const sentIds = new Set<string>();
      let from = 0;
      while (true) {
        const { data: logRows, error: logErr } = await supabase
          .from("newsletter_send_log")
          .select("contact_id")
          .eq("campaign_id", campaignId)
          .range(from, from + 999);
        if (logErr) throw logErr;
        (logRows || []).forEach((r: { contact_id: string }) => sentIds.add(r.contact_id));
        if (!logRows || logRows.length < 1000) break;
        from += 1000;
      }

      return (all || []).filter((c) => !sentIds.has(c.id));
    };

    const countSendLog = async () => {
      const { count } = await supabase
        .from("newsletter_send_log")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", campaignId);
      return count || 0;
    };

    // Mark as sending
    await supabase.from("newsletter_campaigns").update({ status: "sending" }).eq("id", campaignId);

    let eligible: Array<{ id: string; email: string; name: string | null }> = [];
    try {
      eligible = await fetchEligible();
    } catch (_e) {
      await supabase.from("newsletter_campaigns").update({ status: "draft" }).eq("id", campaignId);
      return new Response(JSON.stringify({ error: "Failed to load recipients" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!eligible.length) {
      await supabase.from("newsletter_campaigns").update({ status: "draft" }).eq("id", campaignId);
      return new Response(JSON.stringify({ error: "No subscribed contacts found" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const limit = typeof maxSends === "number" && maxSends > 0 ? maxSends : 0;
    const contacts = limit ? eligible.slice(0, limit) : eligible;

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

          // Inject UTM params into all whiterabbitla.com links for GA4 attribution
          const campaignSlug = (campaign.campaign_type || "newsletter").replace(/\s+/g, "-").toLowerCase();
          html = html.replace(
            /href="(https:\/\/whiterabbitla\.com[^"]*?)"/g,
            (_match: string, url: string) => {
              if (url.includes("utm_source") || url.includes("/unsubscribe")) return `href="${url}"`;
              const sep = url.includes("?") ? "&" : "?";
              return `href="${url}${sep}utm_source=email&utm_medium=newsletter&utm_campaign=${encodeURIComponent(campaignSlug)}&utm_content=${encodeURIComponent(campaignId)}"`;
            }
          );

          // Inject open tracking pixel
          const openPixel = `<img src="https://pgjyzayvkyrftcksvncj.supabase.co/functions/v1/track-open?cid=${contact.id}&step=0&cam=${campaignId}" width="1" height="1" style="display:block;width:1px;height:1px;border:0;" alt="" />`;
          if (html.includes("</body>")) {
            html = html.replace("</body>", `${openPixel}</body>`);
          } else {
            html += openPixel;
          }

          // RFC 8058 one-click unsubscribe must point at the edge function,
          // not the SPA route (same pattern as cold-drip).
          const oneClickUrl = `https://pgjyzayvkyrftcksvncj.supabase.co/functions/v1/unsubscribe-oneclick?email=${encodeURIComponent(contact.email)}`;
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
                "List-Unsubscribe": `<mailto:unsubscribe@whiterabbitla.com?subject=unsubscribe>, <${oneClickUrl}>`,
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

    // How many eligible recipients remain after this run
    let remaining = 0;
    try {
      remaining = (await fetchEligible()).length;
    } catch (_e) {
      remaining = 0;
    }
    const totalLogged = await countSendLog();

    await supabase.from("newsletter_campaigns").update({
      status: remaining === 0 ? "sent" : "draft",
      sent_count: totalLogged,
    }).eq("id", campaignId);

    return new Response(JSON.stringify({
      success: true,
      sent: sentCount,
      remaining,
      segment: segmentKey || "all",
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
