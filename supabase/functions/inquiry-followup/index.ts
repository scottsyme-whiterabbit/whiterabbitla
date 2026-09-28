import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { inquiryFirstName, parseFutureInquiryDate, withinPacificSendHours } from "../_shared/inquiry-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};
const FOLLOWUP_SCHEDULE = [3, 9];

interface Inquiry {
  id: string;
  email: string;
  name: string | null;
  date: string | null;
  followup_step: number;
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
    if (!withinPacificSendHours()) return json({ sent: 0 });

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey || !adminPassword) throw new Error("Required service configuration is missing");
    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: inquiries, error: fetchError } = await supabase
      .from("contact_inquiries")
      .select("id,email,name,date,followup_step,created_at")
      .lt("followup_step", 2)
      .is("sequence_stopped_at", null)
      .not("instant_reply_sent_at", "is", null)
      .is("called_at", null)
      .order("created_at", { ascending: true });
    if (fetchError) throw fetchError;

    let sent = 0;
    let skipped = 0;
    const errors: string[] = [];
    const now = Date.now();
    for (const inquiry of (inquiries || []) as Inquiry[]) {
      const email = inquiry.email.trim().toLowerCase();
      const currentStep = inquiry.followup_step;
      const requiredDays = FOLLOWUP_SCHEDULE[currentStep];
      if (requiredDays === undefined || now - new Date(inquiry.created_at).getTime() < requiredDays * 86400000) continue;

      try {
        const { data: unsubscribed } = await supabase.from("email_unsubscribes").select("id").ilike("email", email).limit(1);
        if (unsubscribed?.length) { skipped++; continue; }
        const { data: inbound } = await supabase.from("deal_email_messages").select("id").eq("direction", "inbound").ilike("from_email", email).gt("sent_at", inquiry.created_at).limit(1);
        if (inbound?.length) { skipped++; continue; }

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

        const nextStep = currentStep + 1;
        const { data: claimed, error: claimError } = await supabase
          .from("contact_inquiries")
          .update({ followup_step: nextStep })
          .eq("id", inquiry.id)
          .eq("followup_step", currentStep)
          .is("sequence_stopped_at", null)
          .select("id");
        if (claimError) throw claimError;
        if (!claimed?.length) { skipped++; continue; }

        const firstName = inquiryFirstName(inquiry.name);
        const parsedDate = parseFutureInquiryDate(inquiry.date);
        const subject = currentStep === 0 ? `${firstName}, just wanted to make sure this reached you` : `${firstName}, one last note`;
        const bodyText = currentStep === 0
          ? `${firstName},\n\nWanted to make sure this got to you and didn't land somewhere strange.\n\nMost of what I do is close up, right in the middle of the room while people are talking and drinking. Nobody sits in rows and nothing gets announced. It just starts happening next to them.\n\n${parsedDate ? `If ${parsedDate.monthDayOrdinal} is still the plan, tell me roughly what the evening looks like and I'll tell you honestly whether I'm the right fit for it.` : "If the evening is still happening, tell me roughly what it looks like and I'll tell you honestly whether I'm the right fit for it."}\n\n(424) 394-1850 is the fastest way to reach me. I answer it myself.`
          : `${firstName},\n\nI'll stop filling your inbox after this.\n\nIf the date moved or you went a different direction, no hard feelings at all. Plans shift constantly in this world and I'd rather you have a great night than have a magician.\n\nIf it's still live, my number is (424) 394-1850.\n\n${parsedDate ? `Either way, I hope ${parsedDate.monthDayOrdinal} is a beautiful evening.` : "Either way, I hope it's a beautiful evening."}`;

        const { data: deal } = await supabase.from("deals").select("id").ilike("contact_email", email).order("created_at", { ascending: false }).limit(1).maybeSingle();
        const sendResponse = await fetch(`${supabaseUrl}/functions/v1/gmail-send`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
          body: JSON.stringify({ to: email, subject, body_text: bodyText, deal_id: deal?.id || null, adminPassword }),
        });
        const sendData = await sendResponse.json().catch(() => ({}));
        if (!sendResponse.ok || !sendData.message_id) {
          await supabase.from("contact_inquiries").update({ followup_step: currentStep }).eq("id", inquiry.id).eq("followup_step", nextStep);
          throw new Error(`Gmail send failed: ${sendData.error || sendResponse.status}`);
        }
        const { error: logError } = await supabase.from("automated_gmail_sends").insert({
          gmail_message_id: sendData.message_id,
          kind: `followup_${nextStep}`,
          inquiry_id: inquiry.id,
        });
        if (logError) throw logError;
        sent++;
      } catch (error) {
        errors.push(`${email || inquiry.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return json({ sent, skipped, errors });
  } catch (error) {
    console.error("inquiry-followup error", error);
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});