import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Fixed canary address. Never a client address.
const CANARY_TO = "scott.syme+canary@whiterabbitla.com";

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Auth gate identical to post-show-sequence.
  const cronSecret = Deno.env.get("CRON_SECRET") ?? "";
  const cronSecretV2 = Deno.env.get("CRON_SECRET_V2") ?? "";
  const adminPasswordEnv = Deno.env.get("ADMIN_PASSWORD") ?? "";
  const reqBody = req.method === "POST" ? await req.json().catch(() => ({} as any)) : ({} as any);
  const headerCron = req.headers.get("x-cron-secret") ?? "";
  const cronOk = (cronSecret.length > 0 && headerCron === cronSecret) ||
    (cronSecretV2.length > 0 && headerCron === cronSecretV2);
  const adminOk = adminPasswordEnv.length > 0 && reqBody?.adminPassword === adminPasswordEnv;
  if (!cronOk && !adminOk) return json({ error: "Unauthorized" }, 401);

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  let ok = false;
  let messageId: string | null = null;
  let error: string | null = null;

  try {
    const res = await fetch(`${url}/functions/v1/gmail-send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
      body: JSON.stringify({
        to: CANARY_TO,
        subject: "White Rabbit canary",
        body_text: "Automated check. If this stopped arriving, gmail-send is broken.",
        skip_signature: true,
        skip_stage_update: true,
        adminPassword: adminPasswordEnv,
      }),
    });
    const text = await res.text();
    let data: any = null;
    try { data = JSON.parse(text); } catch { /* non-JSON */ }
    if (res.ok && data?.message_id) {
      ok = true;
      messageId = String(data.message_id);
    } else {
      error = `HTTP ${res.status}: ${data?.error ?? text}`;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  if (error) error = error.slice(0, 300);

  try {
    const sb = createClient(url, serviceKey);
    const { error: insErr } = await sb.from("system_canary_log").insert({ ok, message_id: messageId, error });
    if (insErr) console.error("canary log insert failed", insErr.message);
  } catch (e) {
    console.error("canary log insert threw", e);
  }

  return json({ ok, message_id: messageId, error });
});
