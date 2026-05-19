// Send an email from Scott's Gmail (threaded if gmail_thread_id provided).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const GATEWAY = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";
const OWNER_EMAIL = "scott.syme@whiterabbitla.com";
const OWNER_NAME = "Scott Syme";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const GOOGLE_MAIL_API_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD");
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

function b64url(s: string) {
  return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    if (body.adminPassword !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const { deal_id, to, subject, body_text, gmail_thread_id, in_reply_to } = body;
    if (!to || !subject || !body_text) {
      return new Response(JSON.stringify({ error: "Missing to/subject/body_text" }), { status: 400, headers: corsHeaders });
    }

    const headers = [
      `From: ${OWNER_NAME} <${OWNER_EMAIL}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: text/plain; charset=UTF-8`,
    ];
    if (in_reply_to) {
      headers.push(`In-Reply-To: ${in_reply_to}`);
      headers.push(`References: ${in_reply_to}`);
    }
    const raw = b64url(headers.join("\r\n") + "\r\n\r\n" + body_text);

    const payload: any = { raw };
    if (gmail_thread_id) payload.threadId = gmail_thread_id;

    const r = await fetch(`${GATEWAY}/users/me/messages/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_MAIL_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(`Gmail send ${r.status}: ${JSON.stringify(data)}`);

    // Log activity
    if (deal_id) {
      await supabase.from("deal_activity").insert({
        deal_id,
        type: "email_out",
        title: `Sent to ${to}`,
        body: body_text.slice(0, 500),
        metadata: { gmail_message_id: data.id, gmail_thread_id: data.threadId, subject },
      });
      // Touch the deal to advance from "new"
      const { data: deal } = await supabase.from("deals").select("stage,gmail_thread_id").eq("id", deal_id).maybeSingle();
      const updates: any = {};
      if (deal && !deal.gmail_thread_id) updates.gmail_thread_id = data.threadId;
      if (deal && deal.stage === "new") updates.stage = "contacted";
      if (Object.keys(updates).length) await supabase.from("deals").update(updates).eq("id", deal_id);
    }
    return new Response(JSON.stringify({ success: true, message_id: data.id, thread_id: data.threadId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
