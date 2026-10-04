import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CALENDAR_URL, inquiryFirstName } from "../_shared/inquiry-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};


/** Escape user-supplied values before interpolating into notification HTML. */
function escapeHtml(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

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

    // ── Private feedback from the review gate (never an inquiry, never a deal) ──
    if (body._privateFeedback) {
      const fbName = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";
      const fbEmail = typeof body.email === "string" ? body.email.trim().slice(0, 255) : "";
      const fbMessage = typeof body.message === "string" ? body.message.trim().slice(0, 2000) : "";
      const fbDealId = typeof body.dealId === "string" ? body.dealId.trim() : "";

      if (!fbName || !fbMessage) {
        return new Response(JSON.stringify({ error: "Name and message are required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (fbEmail && !fbEmail.includes("@")) {
        return new Response(JSON.stringify({ error: "Email address is not valid" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const fbSupabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (fbDealId && isUuid.test(fbDealId)) {
        try {
          await fbSupabase.from("deal_activity").insert({
            deal_id: fbDealId,
            type: "feedback",
            title: "Private feedback from the review page",
            body: fbMessage.slice(0, 500),
            metadata: { name: fbName, email: fbEmail, source: "review_gate" },
          });
        } catch (fbActivityError) {
          console.error("Private feedback activity insert failed:", fbActivityError);
        }
        // Pull the client out of the post-show core so the referral ask never
        // reaches someone who said the night fell short.
        try {
          await fbSupabase
            .from("deals")
            .update({ post_show_step: 2 })
            .eq("id", fbDealId)
            .lt("post_show_step", 2);
        } catch (fbStepError) {
          console.error("Post-show step update failed:", fbStepError);
        }
      }

      const fbResendKey = Deno.env.get("RESEND_API_KEY");
      if (fbResendKey) {
        try {
          const fbHtml = `
            <h2>Private feedback from the review page</h2>
            <p><strong>Name:</strong> ${escapeHtml(fbName)}</p>
            <p><strong>Email:</strong> ${escapeHtml(fbEmail || "Not provided")}</p>
            <p><strong>Deal ID:</strong> ${escapeHtml(fbDealId || "Not linked")}</p>
            <p style="white-space:pre-wrap;">${escapeHtml(fbMessage)}</p>
          `;
          const fbPayload: Record<string, unknown> = {
            from: "White Rabbit <scott.syme@whiterabbitla.com>",
            to: ["scott.syme@whiterabbitla.com"],
            subject: `Private feedback from ${fbName}`,
            html: fbHtml,
          };
          if (fbEmail) fbPayload.reply_to = fbEmail;
          const fbResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${fbResendKey}` },
            body: JSON.stringify(fbPayload),
          });
          if (!fbResponse.ok) console.error("Resend feedback notification error:", await fbResponse.text());
        } catch (fbSendError) {
          console.error("Resend feedback notification failed:", fbSendError);
        }
      } else {
        console.error("RESEND_API_KEY is not set; private feedback notification was not sent");
      }

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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD");

    const emailHtml = `
      <h2>New Booking Inquiry</h2>
      <table style="border-collapse:collapse;width:100%;max-width:600px;">
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Name</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(name)}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Email</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(email)}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Phone</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(phone || "N/A")}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Client Type</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(clientType || "Not specified")}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Event Type</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(eventType)}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Date</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(date)}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Guest Count</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(guestCount || "Not specified")}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Budget</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(budget || "Not specified")}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Location</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(location)}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">How They Found Us</td><td style="padding:8px;border-bottom:1px solid #eee;color:#2a7d5f;font-weight:bold;">${escapeHtml(formSource || "Not specified")}</td></tr>
      </table>
      <h3 style="margin-top:24px;">Message</h3>
      <p style="white-space:pre-wrap;">${escapeHtml(message)}</p>
    `;

    const firstName = inquiryFirstName(name);
    const safeFirstName = escapeHtml(firstName);
    const GALLERY_URL = "https://whiterabbitla.com/experience";
    const pacificParts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date());
    const pacificValue = (type: "hour" | "minute") => Number(pacificParts.find((part) => part.type === type)?.value || 0);
    const pacificMinutes = pacificValue("hour") * 60 + pacificValue("minute");
    const callLine = pacificMinutes >= 8 * 60 && pacificMinutes < 20 * 60 + 30
      ? "I will give you a call today from (424) 394-1850, and I will not keep you long. If you see that number come up, it is me."
      : "It is late here, so I will leave you be tonight. I will call you in the morning from (424) 394-1850.";
    const confirmationSubject = `Your note reached me, ${firstName}`;
    const confirmationText = `${firstName}, your note has reached me, and I am glad it did.\n\nRather than send over a list of options, I would like to hear about it in your own words. What you are imagining, and how you want the room to feel. Then I will put together a proposal built around your event specifically, not a template.\n\n${callLine}\n\nPICK A TIME THAT SUITS YOU →\n${CALENDAR_URL}\n\nAnd if you would like a glimpse while you wait:\n\nSEE A NIGHT IN ACTION →\n${GALLERY_URL}\n\nYour guests do not watch the show, they become the show.\n\nScott Syme\nMagician · (424) 394-1850 · whiterabbitla.com`;

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
             Your note reached me, ${safeFirstName}
          </h1>
        </td></tr>

        <!-- Divider -->
        <tr><td style="padding:24px 40px 0;text-align:center;">
          <div style="width:40px;height:1px;background-color:#C9A3A8;margin:0 auto;"></div>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:24px 40px 0;">
          <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:16px;line-height:1.8;color:rgba(245,240,232,0.85);">
             ${safeFirstName}, your note has reached me, and I am glad it did.
          </p>
          <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:16px;line-height:1.8;color:rgba(245,240,232,0.85);">
             Rather than send over a list of options, I would like to hear about it in your own words. What you are imagining, and how you want the room to feel. Then I will put together a proposal built around your event specifically, not a template.
          </p>
          <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:16px;line-height:1.8;color:rgba(245,240,232,0.85);">
             ${callLine}
          </p>

          <!-- Calendar CTA Button -->
          <p style="margin:0 0 28px;text-align:center;">
             <a href="${CALENDAR_URL}" target="_blank" style="display:inline-block;font-family:Georgia,serif;font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#223D34;text-decoration:none;background-color:#C9A3A8;padding:14px 28px;border-radius:4px;">
               PICK A TIME THAT SUITS YOU →
            </a>
          </p>

          <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:16px;line-height:1.8;color:rgba(245,240,232,0.85);">
             And if you would like a glimpse while you wait:
          </p>
          <p style="margin:0 0 28px;text-align:center;">
             <a href="${GALLERY_URL}" target="_blank" style="font-family:Georgia,serif;font-size:14px;letter-spacing:0.15em;text-transform:uppercase;color:#C9A3A8;text-decoration:none;border-bottom:1px solid rgba(201,163,168,0.3);padding-bottom:2px;">
               SEE A NIGHT IN ACTION →
            </a>
          </p>
          <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:16px;line-height:1.8;color:rgba(245,240,232,0.85);">
             Your guests do not watch the show, they become the show.
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

    const contactEmail = email.toLowerCase().trim();
    const supabase = SUPABASE_URL && SERVICE_KEY ? createClient(SUPABASE_URL, SERVICE_KEY) : null;
    let inquiryId: string | null = null;
    let dealId: string | null = null;

    if (!supabase) {
      console.error("Database configuration is missing");
    } else {
      try {
        const { data: inquiry, error: inquiryError } = await supabase
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
        if (inquiryError) console.error("Inquiry insert failed:", inquiryError);
        inquiryId = inquiry?.id || null;

        const eventTypeMap: Record<string, string> = {
          "Corporate Event": "corporate",
          "Wedding": "wedding",
          "Private Party": "private_party",
          "Parlor Show": "parlor_show",
        };

        // Safely parse event_date — accept ISO/parseable strings only, else null
        let parsedEventDate: string | null = null;
        if (date) {
          const d = new Date(date);
          if (!isNaN(d.getTime())) {
            parsedEventDate = d.toISOString().slice(0, 10);
          }
        }
        const notesWithDate = parsedEventDate
          ? message
          : `Event Date (raw): ${date}\n\n${message || ""}`;

        const { data: deal, error: dealErr } = await supabase.from("deals").insert({
          contact_email: contactEmail,
          contact_name: name,
          phone: phone || null,
          event_type: eventTypeMap[eventType] || "other",
          event_date: parsedEventDate,
          location: location || null,
          stage: "new",
          source: formSource || "contact_form",
          source_id: inquiryId,
          notes: notesWithDate,
        }).select("id").single();
        if (dealErr) console.error("Deal insert failed:", dealErr);
        dealId = deal?.id || null;
      } catch (insertError) {
        console.error("Inquiry or deal insert failed:", insertError);
      }
    }

    if (RESEND_API_KEY) {
      try {
        const notificationResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
          body: JSON.stringify({
            from: "White Rabbit <scott.syme@whiterabbitla.com>",
            to: ["scott.syme@whiterabbitla.com"],
            subject: `Booking Inquiry: ${name} (${eventType})`,
            html: emailHtml,
            reply_to: email,
          }),
        });
        if (!notificationResponse.ok) console.error("Resend notification error:", await notificationResponse.text());
      } catch (notificationError) {
        console.error("Resend notification failed:", notificationError);
      }
    } else {
      console.error("RESEND_API_KEY is not set; Scott notification was not sent");
    }

    let gmailSent = false;
    if (SUPABASE_URL && SERVICE_KEY && ADMIN_PASSWORD) {
      try {
        const gmailResponse = await fetch(`${SUPABASE_URL}/functions/v1/gmail-send`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
          body: JSON.stringify({
            to: email,
            subject: confirmationSubject,
            body_text: confirmationText,
            html_body: confirmationHtml,
            skip_signature: true,
            skip_stage_update: true,
            deal_id: dealId,
            adminPassword: ADMIN_PASSWORD,
          }),
        });
        const gmailData = await gmailResponse.json().catch(() => ({}));
        if (!gmailResponse.ok || !gmailData.message_id) throw new Error(gmailData.error || `Gmail send ${gmailResponse.status}`);
        gmailSent = true;
        if (supabase && inquiryId) {
          const { error: inquiryUpdateError } = await supabase.from("contact_inquiries").update({
            instant_reply_sent_at: new Date().toISOString(),
            instant_reply_message_id: gmailData.message_id,
            gmail_thread_id: gmailData.thread_id || null,
          }).eq("id", inquiryId);
          if (inquiryUpdateError) console.error("Inquiry Gmail result update failed:", inquiryUpdateError);
          const { error: ledgerError } = await supabase.from("automated_gmail_sends").insert({
            gmail_message_id: gmailData.message_id,
            kind: "instant_reply",
            inquiry_id: inquiryId,
          });
          if (ledgerError) console.error("Automated Gmail ledger insert failed:", ledgerError);
        }
      } catch (gmailError) {
        console.error("Gmail confirmation failed; using Resend fallback:", gmailError);
      }
    } else {
      console.error("Gmail confirmation configuration is missing; using Resend fallback");
    }

    if (!gmailSent) {
      if (RESEND_API_KEY) {
        try {
          const fallbackResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
            body: JSON.stringify({
              from: "White Rabbit <scott.syme@whiterabbitla.com>",
              to: [email],
              subject: confirmationSubject,
              html: confirmationHtml,
              text: confirmationText,
            }),
          });
          if (!fallbackResponse.ok) console.error("Resend confirmation fallback error:", await fallbackResponse.text());
          else if (supabase && inquiryId) {
            const { error: fallbackUpdateError } = await supabase.from("contact_inquiries").update({
              instant_reply_sent_at: new Date().toISOString(),
            }).eq("id", inquiryId);
            if (fallbackUpdateError) console.error("Inquiry fallback result update failed:", fallbackUpdateError);
          }
        } catch (fallbackError) {
          console.error("Resend confirmation fallback failed:", fallbackError);
        }
      } else {
        console.error("Resend confirmation fallback unavailable because RESEND_API_KEY is not set");
      }
    }

    if (supabase) {
      try {
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
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
