// Send an email from Scott's Gmail (threaded if gmail_thread_id provided).
// Automatically appends Scott's Gmail signature (pulled from Gmail sendAs settings,
// with a hardcoded White Rabbit LA fallback).
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

// Fallback signature — matches Scott's Gmail signature visually.
const FALLBACK_SIGNATURE_HTML = `
<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;color:#4a4a4a;font-size:13px;line-height:1.5;">
  <tr>
    <td style="padding-right:20px;border-right:2px solid #223D34;vertical-align:middle;text-align:center;">
      <div style="font-family:Georgia,'Times New Roman',serif;color:#223D34;">
        <div style="color:#D4A843;font-size:18px;letter-spacing:2px;">✦ ✦ ✦</div>
        <div style="font-size:26px;font-weight:bold;margin-top:4px;">White Rabbit</div>
        <div style="font-size:11px;letter-spacing:4px;margin-top:4px;color:#223D34;">LOS ANGELES</div>
      </div>
    </td>
    <td style="padding-left:20px;vertical-align:middle;">
      <div style="font-size:15px;font-weight:bold;color:#4a4a4a;">Scott Syme</div>
      <div style="color:#6b6b6b;">Magician</div>
      <div style="color:#6b6b6b;margin-bottom:10px;">White Rabbit LA</div>
      <div>☎ <strong>Office Telephone:</strong> (424) 394-1850</div>
      <div>📞 <strong>Mobile:</strong> (650) 678-9428</div>
      <div>🌐 <strong>Website:</strong> <a href="https://www.whiterabbitla.com" style="color:#4a4a4a;text-decoration:none;">www.whiterabbitla.com</a></div>
      <div>✉ <strong>Email</strong>: <a href="mailto:scott.syme@whiterabbitla.com" style="color:#4a4a4a;text-decoration:none;">scott.syme@whiterabbitla.com</a></div>
      <div style="margin-top:10px;">
        <a href="https://www.instagram.com/whiterabbit.la" style="display:inline-block;border:1px solid #C9A3A8;padding:4px 6px;color:#C9A3A8;text-decoration:none;font-size:14px;">📷</a>
      </div>
    </td>
  </tr>
</table>`.trim();

// Cache the signature for the lifetime of the function instance.
let cachedSignature: string | null = null;
async function getSignature(): Promise<string> {
  if (cachedSignature !== null) return cachedSignature;
  try {
    const r = await fetch(`${GATEWAY}/users/me/settings/sendAs`, {
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_MAIL_API_KEY!,
      },
    });
    if (r.ok) {
      const data = await r.json();
      const primary = (data.sendAs || []).find((s: any) => s.isPrimary) || (data.sendAs || [])[0];
      if (primary?.signature && primary.signature.trim().length > 0) {
        cachedSignature = primary.signature;
        return cachedSignature;
      }
    } else {
      console.warn(`sendAs fetch ${r.status} — using fallback signature`);
    }
  } catch (e) {
    console.warn("sendAs fetch failed — using fallback signature:", e);
  }
  cachedSignature = FALLBACK_SIGNATURE_HTML;
  return cachedSignature;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Strip any AI-generated sign-off lines so we don't duplicate "-Scott" above the signature.
function stripTrailingSignoff(body: string): string {
  let out = body.replace(/\s+$/, "");
  // Remove trailing "-- " separator and anything that looks like a hand-typed sig block
  out = out.replace(/\n--\s*\n[\s\S]*$/m, "");
  // Strip trailing "-Scott" / "— Scott" / "- Scott" / "Scott Syme" lines
  out = out.replace(/(\s*[-—–]\s*Scott(\s+Syme)?\s*)+\s*$/i, "");
  out = out.replace(/(\n\s*Scott(\s+Syme)?\s*)+$/i, "");
  return out.replace(/\s+$/, "");
}

function buildMultipart(textBody: string, htmlBody: string, headers: string[]): string {
  const boundary = `=_wr_${Math.random().toString(36).slice(2)}_${Date.now()}`;
  const hdrs = [...headers, `Content-Type: multipart/alternative; boundary="${boundary}"`];
  const parts = [
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    textBody,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    htmlBody,
    ``,
    `--${boundary}--`,
    ``,
  ].join("\r\n");
  return hdrs.join("\r\n") + "\r\n\r\n" + parts;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    if (body.adminPassword !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const { deal_id, to, subject, body_text, gmail_thread_id, in_reply_to, skip_signature } = body;
    if (!to || !subject || !body_text) {
      return new Response(JSON.stringify({ error: "Missing to/subject/body_text" }), { status: 400, headers: corsHeaders });
    }

    const cleanText = skip_signature ? body_text : stripTrailingSignoff(body_text);
    const signatureHtml = skip_signature ? "" : await getSignature();

    // Build text + html parts. Gmail uses "-- \n" as the standard signature separator.
    const textBody = skip_signature
      ? cleanText
      : `${cleanText}\n\n-- \nScott Syme\nMagician · White Rabbit LA\n(424) 394-1850 · scott.syme@whiterabbitla.com\nwww.whiterabbitla.com`;
    const htmlBody = skip_signature
      ? `<div>${escapeHtml(cleanText).replace(/\n/g, "<br>")}</div>`
      : `<div style="font-family:Arial,Helvetica,sans-serif;color:#222;font-size:14px;line-height:1.55;">${escapeHtml(cleanText).replace(/\n/g, "<br>")}</div><br><div>${signatureHtml}</div>`;

    const headers = [
      `From: ${OWNER_NAME} <${OWNER_EMAIL}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
    ];
    if (in_reply_to) {
      headers.push(`In-Reply-To: ${in_reply_to}`);
      headers.push(`References: ${in_reply_to}`);
    }
    const rfc2822 = buildMultipart(textBody, htmlBody, headers);
    const raw = b64url(rfc2822);

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
        body: cleanText.slice(0, 500),
        metadata: { gmail_message_id: data.id, gmail_thread_id: data.threadId, subject },
      });
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
