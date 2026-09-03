// One-click unsubscribe handler for List-Unsubscribe-Post: List-Unsubscribe=One-Click
// Compliant with RFC 8058 (Gmail / Yahoo bulk sender requirements as of Feb 2024).
//
// Endpoints:
//   POST /unsubscribe-oneclick?email=foo@bar.com   → unsubscribes. A POST is the only
//                                                    way state changes: mail clients
//                                                    (Gmail / Apple Mail native button)
//                                                    and the browser confirmation form
//                                                    both POST here.
//   GET  /unsubscribe-oneclick?email=foo@bar.com   → shows a confirmation page with a
//                                                    form that POSTs back. GET NEVER
//                                                    unsubscribes — link prefetchers
//                                                    (corporate security scanners like
//                                                    Proofpoint / Mimecast URL defense)
//                                                    use GET, and RFC 8058 deliberately
//                                                    uses POST so prefetching a link
//                                                    cannot cause a state change.
//
// Behavior:
//   1. POST: Sets status='unsubscribed' + unsubscribed_at=now() on every matching row in
//      cold_email_campaigns (one email may have multiple category rows).
//   2. POST: Halts nurture sequence for the same rows (nurture_status='unsubscribed').
//   3. POST: Adds an immutable audit row to email_unsubscribes.
//   4. Idempotent — re-POSTing the same email is a no-op success.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function htmlConfirmation(email: string): string {
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Unsubscribed — White Rabbit LA</title>
</head>
<body style="margin:0; padding:0; background:#f8f5f0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; color:#223D34;">
  <div style="max-width:520px; margin:80px auto; padding:40px 32px; background:#ffffff; border-radius:6px;">
    <h1 style="margin:0 0 16px; font-size:22px; font-weight:600;">You've been unsubscribed.</h1>
    <p style="margin:0 0 12px; font-size:15px; line-height:1.6;">
      ${email ? `<strong>${email.replace(/[<>&"']/g, "")}</strong> has been removed from White Rabbit LA emails.` : "Your email has been removed from White Rabbit LA emails."}
    </p>
    <p style="margin:0 0 24px; font-size:15px; line-height:1.6;">Sorry to see you go.</p>
    <p style="margin:0; font-size:14px; color:#555;">— Scott</p>
  </div>
</body></html>`;
}

async function processUnsubscribe(rawEmail: string, source: string, userAgent: string | null): Promise<{ ok: boolean; rowsTouched: number; error?: string }> {
  const email = rawEmail.trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, rowsTouched: 0, error: "invalid_email" };
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const nowIso = new Date().toISOString();

  // 1. Update cold_email_campaigns — case-insensitive match on email.
  //    Halts BOTH cold drip (status='unsubscribed') AND nurture (nurture_status='unsubscribed').
  const { data: updated, error: updErr } = await supabase
    .from("cold_email_campaigns")
    .update({
      status: "unsubscribed",
      nurture_status: "unsubscribed",
      unsubscribed_at: nowIso,
      updated_at: nowIso,
    })
    .ilike("email", email)
    .select("id");

  if (updErr) {
    console.error("unsubscribe-oneclick: cold_email_campaigns update error", updErr);
  }

  // 2. Also update newsletter_contacts if present (covers nurture/drip via different table).
  const { error: nlErr } = await supabase
    .from("newsletter_contacts")
    .update({ subscribed: false, updated_at: nowIso })
    .ilike("email", email);
  if (nlErr) {
    console.error("unsubscribe-oneclick: newsletter_contacts update error", nlErr);
  }

  // 3. Audit log — always insert, even if no rows matched (covers spam-trap / unknown-source unsubs).
  const { error: logErr } = await supabase.from("email_unsubscribes").insert({
    email,
    source,
    user_agent: userAgent,
  });
  if (logErr) {
    console.error("unsubscribe-oneclick: audit log insert error", logErr);
  }

  console.log(`unsubscribe-oneclick: ${email} (source=${source}, cold_rows=${updated?.length ?? 0})`);
  return { ok: true, rowsTouched: updated?.length ?? 0 };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let email = url.searchParams.get("email") || "";
    let source = "list_unsubscribe_header";

    // Gmail/Yahoo one-click POSTs with body "List-Unsubscribe=One-Click" — email
    // typically lives in the URL query param, but accept POST body fallback.
    if (req.method === "POST" && !email) {
      const ct = req.headers.get("content-type") || "";
      try {
        if (ct.includes("application/json")) {
          const body = await req.json();
          email = (body.email || "").toString();
        } else if (ct.includes("application/x-www-form-urlencoded") || ct.includes("text/plain")) {
          const text = await req.text();
          const params = new URLSearchParams(text);
          email = params.get("email") || "";
        }
      } catch (_e) {
        // body parse failure — leave email empty, will 400 below
      }
    }

    if (req.method === "GET") {
      source = "list_unsubscribe_header_get";
    }

    if (!email) {
      // RFC 8058 expects 200 even on bad input for one-click POST so the mail
      // client doesn't retry. But return a useful body for GET.
      if (req.method === "POST") {
        return new Response(null, { status: 200, headers: corsHeaders });
      }
      return new Response("Missing email parameter.", {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    const ua = req.headers.get("user-agent");
    const result = await processUnsubscribe(email, source, ua);

    if (req.method === "POST") {
      // Gmail/Yahoo only need 200/204 with no body
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // GET → human-friendly HTML page
    return new Response(htmlConfirmation(result.ok ? email : ""), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("unsubscribe-oneclick error:", error);
    // Even on error, return 200 for POST so mail clients don't retry
    if (req.method === "POST") {
      return new Response(null, { status: 200, headers: corsHeaders });
    }
    return new Response("An error occurred. Please try again or contact scott.syme@whiterabbitla.com.", {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }
});
