// System health report — thin wrapper over public.system_health() and
// public.deals_awaiting_reply(). No health logic lives here.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const BG = "#F8F6F1";
const INK = "#223932";
const MUTED = "#5C7069";
const GOLD = "#DDA73C";
const FAIL = "#9A5B33";
const WARN = "#B8843C";
const OK = "#3F7A5E";

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function statusColor(s: string): string {
  return s === "fail" ? FAIL : s === "warn" ? WARN : OK;
}

interface Check { key: string; label: string; status: string; detail: string }
interface Health { generated_at: string; local_date: string; failures: number; warnings: number; overall: string; checks: Check[] }
interface Awaiting { name: string; email: string; stage: string; event_date: string | null; waiting_since: string; hours_waiting: number }

function buildHtml(health: Health, awaiting: Awaiting[]): string {
  const waitingBlock = awaiting.length === 0 ? "" : `
  <tr><td style="padding:0 28px 8px 28px">
    <h2 style="font-family:Georgia,'Times New Roman',serif;font-size:19px;color:${INK};margin:0 0 4px 0">Waiting on you</h2>
    <p style="font-family:Helvetica,Arial,sans-serif;font-size:13px;color:${MUTED};margin:0 0 14px 0">Their last message went unanswered.</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      ${awaiting.map((p) => `<tr><td style="padding:8px 0;border-bottom:1px solid #E7E2D8">
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:14px;color:${INK};font-weight:bold">${esc(p.name)}</div>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:13px;color:${MUTED}">${esc(p.stage)} &middot; ${esc(p.event_date ?? "no date")} &middot; waiting since ${esc(p.waiting_since)} (${esc(p.hours_waiting)}h)</div>
      </td></tr>`).join("")}
    </table>
  </td></tr>
  <tr><td style="padding:18px 28px"><div style="height:2px;background:${GOLD};line-height:2px;font-size:0">&nbsp;</div></td></tr>`;

  const checksRows = (health.checks ?? []).map((c) => `<tr>
    <td style="padding:8px 10px 8px 0;font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:bold;text-transform:uppercase;color:${statusColor(c.status)};white-space:nowrap;vertical-align:top">${esc(c.status)}</td>
    <td style="padding:8px 10px 8px 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;color:${INK};vertical-align:top">${esc(c.label)}</td>
    <td style="padding:8px 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;color:${MUTED};text-align:right;vertical-align:top">${esc(c.detail)}</td>
  </tr>`).join("");

  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:${BG}">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BG};padding:24px 0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:${BG}">
  <tr><td style="padding:8px 28px 18px 28px">
    <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:${INK};margin:0">White Rabbit systems</h1>
  </td></tr>
  ${waitingBlock}
  <tr><td style="padding:0 28px">
    <h2 style="font-family:Georgia,'Times New Roman',serif;font-size:19px;color:${INK};margin:0 0 10px 0">System checks</h2>
    <table width="100%" cellpadding="0" cellspacing="0" border="0">${checksRows}</table>
  </td></tr>
  <tr><td style="padding:22px 28px 8px 28px;font-family:Helvetica,Arial,sans-serif;font-size:11px;color:${MUTED}">
    Checked ${esc(health.local_date)} &middot; White Rabbit LA
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const acceptedCronSecrets = [Deno.env.get("CRON_SECRET"), Deno.env.get("CRON_SECRET_V2")]
      .filter((s): s is string => !!s && s.length > 0);
    const adminPasswordEnv = Deno.env.get("ADMIN_PASSWORD") ?? "";

    let body: Record<string, unknown> = {};
    if (req.method === "POST") body = await req.json().catch(() => ({})) as Record<string, unknown>;

    const provided = req.headers.get("x-cron-secret")
      || (typeof body.cron_secret === "string" ? body.cron_secret : "")
      || (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    const cronOk = acceptedCronSecrets.length > 0 && acceptedCronSecrets.includes(provided || "");
    const adminOk = adminPasswordEnv.length > 0 && body.adminPassword === adminPasswordEnv;

    if (!cronOk && !adminOk) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: health, error: healthErr } = await supabase.rpc("system_health");
    if (healthErr) throw healthErr;
    const { data: awaitingRaw, error: awaitingErr } = await supabase.rpc("deals_awaiting_reply");
    if (awaitingErr) throw awaitingErr;

    const h = health as Health;
    const awaiting = (awaitingRaw ?? []) as Awaiting[];

    const pacificDay = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", weekday: "short" }).format(new Date());
    const isMonday = pacificDay === "Mon";
    const force = body.force === true;

    const shouldEmail = h.overall !== "ok" || awaiting.length > 0 || isMonday || force;
    if (!shouldEmail) {
      return new Response(JSON.stringify({ emailed: false, health: h, awaiting }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subject = h.failures > 0
      ? `⚠️ ${h.failures} system check${h.failures === 1 ? "" : "s"} failing`
      : awaiting.length > 0
        ? `${awaiting.length} ${awaiting.length === 1 ? "person is" : "people are"} waiting on a reply`
        : `White Rabbit systems: all clear`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      },
      body: JSON.stringify({
        from: "White Rabbit System <alerts@whiterabbitla.com>",
        to: ["scott.syme@whiterabbitla.com"],
        subject,
        html: buildHtml(h, awaiting),
      }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Resend failed [${res.status}]: ${errBody.slice(0, 300)}`);
    }

    return new Response(JSON.stringify({
      emailed: true,
      overall: h.overall,
      failures: h.failures,
      awaiting: awaiting.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("system-health-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
