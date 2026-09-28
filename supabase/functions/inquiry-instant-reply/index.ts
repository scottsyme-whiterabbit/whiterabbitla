import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CALENDAR_URL, inquiryFirstName, pacificParts, validEmail } from "../_shared/inquiry-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

interface Inquiry {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  event_type: string | null;
  date: string | null;
  location: string | null;
  guest_count: string | null;
  budget: string | null;
  message: string | null;
  client_type: string | null;
  created_at: string;
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const cronSecret = Deno.env.get("CRON_SECRET") ?? "";
    const cronSecretV2 = Deno.env.get("CRON_SECRET_V2") ?? "";
    const adminPassword = Deno.env.get("ADMIN_PASSWORD") ?? "";
    const suppliedCron = req.headers.get("x-cron-secret") ?? "";
    const cronOk = (cronSecret.length > 0 && suppliedCron === cronSecret) || (cronSecretV2.length > 0 && suppliedCron === cronSecretV2);
    const adminOk = adminPassword.length > 0 && body?.adminPassword === adminPassword;
    if (!cronOk && !adminOk) return json({ error: "Unauthorized" }, 401);

    const dryRun = body?.dryRun === true;
    const inquiryIds: string[] = dryRun && Array.isArray(body?.inquiryIds)
      ? body.inquiryIds.filter((id: unknown) => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id)).slice(0, 100)
      : [];

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!supabaseUrl || !serviceKey || !adminPassword || !resendKey) throw new Error("Required service configuration is missing");
    const supabase = createClient(supabaseUrl, serviceKey);

    let query = supabase
      .from("contact_inquiries")
      .select("id,email,name,phone,event_type,date,location,guest_count,budget,message,client_type,created_at")
      .not("email", "is", null)
      .order("created_at", { ascending: true });
    if (inquiryIds.length) {
      query = query.in("id", inquiryIds);
    } else {
      const oldest = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const newest = new Date(Date.now() - 6 * 60 * 1000).toISOString();
      query = query.is("instant_reply_sent_at", null).is("sequence_stopped_at", null).gt("created_at", oldest).lt("created_at", newest);
    }
    const { data: inquiries, error: fetchError } = await query;
    if (fetchError) throw fetchError;

    const pacific = pacificParts();
    const { data: bookedToday } = await supabase.from("deals").select("id").eq("stage", "booked").eq("event_date", pacific.isoDate).limit(1);
    const lateOrBookedToday = pacific.hour < 8 || pacific.hour * 60 + pacific.minute >= 20 * 60 + 30 || (bookedToday?.length || 0) > 0;
    let sent = 0;
    let skipped = 0;
    const errors: string[] = [];
    const wouldSend: unknown[] = [];
    const skippedList: unknown[] = [];
    const skip = (inquiry: Inquiry, email: string, reason: string) => {
      skipped++;
      if (dryRun) skippedList.push({ inquiry_id: inquiry.id, name: inquiry.name, email, skipped_reason: reason });
    };

    for (const inquiry of (inquiries || []) as Inquiry[]) {
      const email = inquiry.email.trim().toLowerCase();
      try {
        if (!validEmail(email)) { skip(inquiry, email, "invalid_email"); continue; }
        const { data: unsubscribed } = await supabase.from("email_unsubscribes").select("id").ilike("email", email).limit(1);
        if (unsubscribed?.length) { skip(inquiry, email, "unsubscribed"); continue; }

        const { data: outbound } = await supabase
          .from("deal_email_messages")
          .select("gmail_message_id")
          .eq("direction", "outbound")
          .ilike("to_email", email)
          .gt("sent_at", inquiry.created_at);
        const outboundIds = (outbound || []).map((row) => row.gmail_message_id).filter(Boolean);
        if (outboundIds.length) {
          const { data: automated } = await supabase.from("automated_gmail_sends").select("gmail_message_id").in("gmail_message_id", outboundIds);
          const automatedIds = new Set((automated || []).map((row) => row.gmail_message_id));
          if (outboundIds.some((id) => !automatedIds.has(id))) { skip(inquiry, email, "scott_already_replied"); continue; }
        }

        const firstName = inquiryFirstName(inquiry.name);
        const callLine = lateOrBookedToday
          ? `It is late here, so I will leave you be tonight. I will call you in the morning from (424) 394-1850. If you would rather pick a time that suits you, [here is my calendar](${CALENDAR_URL}).`
          : `I will give you a call today from (424) 394-1850, and I will not keep you long. If you see that number come up, it is me. If you would rather pick a time that suits you, [here is my calendar](${CALENDAR_URL}).`;
        const subject = `${firstName}, about your event`;
        const bodyText = `Hi ${firstName},\n\nYour note just came through, and I am glad it did.\n\nRather than send over a list of options, I would like to hear about it in your own words. What you are imagining, and how you want the room to feel. Then I will put together a proposal built around your event specifically, not a template.\n\n${callLine}\n\nYour guests do not watch the show, they become the show.`;

        if (dryRun) {
          wouldSend.push({ inquiry_id: inquiry.id, name: inquiry.name, email, subject, body_text: bodyText, skipped_reason: null });
          continue;
        }

        const { data: claimed, error: claimError } = await supabase
          .from("contact_inquiries")
          .update({ instant_reply_sent_at: new Date().toISOString() })
          .eq("id", inquiry.id)
          .is("instant_reply_sent_at", null)
          .is("sequence_stopped_at", null)
          .select("id");
        if (claimError) throw claimError;
        if (!claimed?.length) { skipped++; continue; }

        const { data: deal } = await supabase.from("deals").select("id").ilike("contact_email", email).order("created_at", { ascending: false }).limit(1).maybeSingle();
        const sendResponse = await fetch(`${supabaseUrl}/functions/v1/gmail-send`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
          body: JSON.stringify({ to: email, subject, body_text: bodyText, deal_id: deal?.id || null, adminPassword }),
        });
        const sendData = await sendResponse.json().catch(() => ({}));
        if (!sendResponse.ok || !sendData.message_id) {
          await supabase.from("contact_inquiries").update({ instant_reply_sent_at: null }).eq("id", inquiry.id);
          throw new Error(`Gmail send failed: ${sendData.error || sendResponse.status}`);
        }

        const { error: logError } = await supabase.from("automated_gmail_sends").insert({
          gmail_message_id: sendData.message_id,
          kind: "instant_reply",
          inquiry_id: inquiry.id,
        });
        if (logError) throw logError;
        await supabase.from("contact_inquiries").update({ instant_reply_message_id: sendData.message_id }).eq("id", inquiry.id);
        sent++;

        const alertBody = [
          `Name: ${inquiry.name || ""}`,
          `Email: ${email}`,
          `Phone: ${inquiry.phone ? `tel:${inquiry.phone.replace(/[^+\d]/g, "")}` : ""}`,
          `Event type: ${inquiry.event_type || ""}`,
          `Date: ${inquiry.date || ""}`,
          `Guest count: ${inquiry.guest_count || ""}`,
          `Budget: ${inquiry.budget || ""}`,
          `Location: ${inquiry.location || ""}`,
          "",
          `Message: ${inquiry.message || ""}`,
        ].join("\n");
        const alertResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
          body: JSON.stringify({
            from: "White Rabbit <events@whiterabbitla.com>",
            to: ["scott.syme@whiterabbitla.com"],
            subject: `[Inquiry] ${inquiry.name || ""}: ${inquiry.event_type || ""} ${inquiry.date || ""}`.trim(),
            text: alertBody,
          }),
        });
        if (!alertResponse.ok) errors.push(`${email}: Scott alert failed: ${await alertResponse.text()}`);
      } catch (error) {
        errors.push(`${email || inquiry.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (dryRun) return json({ dryRun: true, would_send: wouldSend, skipped: skippedList, errors });
    return json({ sent, skipped, errors });
  } catch (error) {
    console.error("inquiry-instant-reply error", error);
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
