import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { inquiryFirstName, pacificParts, parseFutureInquiryDate, validEmail } from "../_shared/inquiry-email.ts";

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!supabaseUrl || !serviceKey || !adminPassword || !resendKey) throw new Error("Required service configuration is missing");
    const supabase = createClient(supabaseUrl, serviceKey);
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: inquiries, error: fetchError } = await supabase
      .from("contact_inquiries")
      .select("id,email,name,phone,event_type,date,location,guest_count,budget,message,client_type,created_at")
      .is("instant_reply_sent_at", null)
      .is("sequence_stopped_at", null)
      .gt("created_at", cutoff)
      .not("email", "is", null)
      .order("created_at", { ascending: true });
    if (fetchError) throw fetchError;

    const pacific = pacificParts();
    const { data: bookedToday } = await supabase.from("deals").select("id").eq("stage", "booked").eq("event_date", pacific.isoDate).limit(1);
    const lateOrBookedToday = pacific.hour < 8 || pacific.hour * 60 + pacific.minute >= 20 * 60 + 30 || (bookedToday?.length || 0) > 0;
    let sent = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const inquiry of (inquiries || []) as Inquiry[]) {
      const email = inquiry.email.trim().toLowerCase();
      try {
        if (!validEmail(email)) { skipped++; continue; }
        const { data: unsubscribed } = await supabase.from("email_unsubscribes").select("id").ilike("email", email).limit(1);
        if (unsubscribed?.length) { skipped++; continue; }

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
          if (outboundIds.some((id) => !automatedIds.has(id))) { skipped++; continue; }
        }

        const parsedDate = parseFutureInquiryDate(inquiry.date);
        let dateIsFree = false;
        if (parsedDate) {
          const { data: bookedDate } = await supabase.from("deals").select("id").eq("stage", "booked").eq("event_date", parsedDate.iso).limit(1);
          dateIsFree = !bookedDate?.length;
        }
        const firstName = inquiryFirstName(inquiry.name);
        const opening = parsedDate && dateIsFree
          ? `Your note just came through. ${parsedDate.monthDayOrdinal} is open on my calendar and I'd love to hear more about the evening.`
          : "Your note just came through. I'd love to hear more about the evening you're planning.";
        const question = inquiry.guest_count?.trim()
          ? "Before I put anything together I want to know what you're picturing. Is it a seated dinner or more of a cocktail hour? That changes the shape of the night completely."
          : "Before I put anything together I want to know what you're picturing. How many guests, and is it a seated dinner or more of a cocktail hour? That changes the shape of the night completely.";
        const callLine = lateOrBookedToday
          ? "It's late here so I won't ring you tonight. I'll call you in the morning from (424) 394-1850."
          : "I'll give you a call today from (424) 394-1850. If you see that number come up, it's me. If you'd rather reach me first, that's the best line to use.";
        const matchText = `${inquiry.event_type || ""} ${inquiry.client_type || ""}`.toLowerCase();
        const keyLine = matchText.includes("wedding")
          ? "It feels like being let in on something."
          : matchText.includes("corporate")
            ? "It becomes shared moments your guests talk about long after the evening ends."
            : "Your guests don't watch the show, they become the show.";
        const subject = parsedDate
          ? `${firstName}, about ${parsedDate.monthDay}`
          : `${firstName}, about your ${inquiry.event_type?.trim() || "event"}`;
        const bodyText = `${firstName},\n\n${opening}\n\n${question}\n\n${callLine}\n\n${keyLine}`;

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

    return json({ sent, skipped, errors });
  } catch (error) {
    console.error("inquiry-instant-reply error", error);
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});