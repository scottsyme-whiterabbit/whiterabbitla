// Castle Invite — daily summary email to Scott at 7pm PT.
// Aggregates sent / replies / accepted / declined per tier for today, emails Scott.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const RESEND_KEY = Deno.env.get("RESEND_API_KEY")!;

    const now = new Date();
    const todayPT = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(now);
    const todayStartISO = new Date(`${todayPT}T00:00:00-08:00`).toISOString();

    // Sync today's status counts into log rows before emailing
    const tiers = ["newsletter", "paused", "active", "completed"];
    for (const tier of tiers) {
      const { data: rows } = await supabase
        .from("cold_email_campaigns")
        .select("castle_invite_status")
        .eq("campaign_track", "castle_invite_la")
        .eq("castle_tier", tier)
        .gte("castle_invited_at", todayStartISO);
      const accepted = (rows ?? []).filter((r) => r.castle_invite_status === "accepted").length;
      const declined = (rows ?? []).filter((r) => r.castle_invite_status === "declined").length;
      const { data: existing } = await supabase
        .from("castle_invite_log")
        .select("id, sent")
        .eq("log_date", todayPT)
        .eq("tier", tier)
        .maybeSingle();
      if (existing) {
        await supabase
          .from("castle_invite_log")
          .update({ accepted, declined })
          .eq("id", existing.id);
      }
    }

    const { data: todayRows } = await supabase
      .from("castle_invite_log")
      .select("tier, sent, replies_received, accepted, declined")
      .eq("log_date", todayPT);

    // Cumulative totals
    const { data: cumRows } = await supabase
      .from("cold_email_campaigns")
      .select("castle_tier, castle_invite_status")
      .eq("campaign_track", "castle_invite_la");
    const cumByTier: Record<string, { invited: number; pending: number; accepted: number; declined: number }> = {};
    for (const r of cumRows ?? []) {
      const t = r.castle_tier ?? "unknown";
      cumByTier[t] ??= { invited: 0, pending: 0, accepted: 0, declined: 0 };
      if (r.castle_invite_status === null) cumByTier[t].pending++;
      else cumByTier[t].invited++;
      if (r.castle_invite_status === "accepted") cumByTier[t].accepted++;
      if (r.castle_invite_status === "declined") cumByTier[t].declined++;
    }

    const rowsHtml = (todayRows ?? []).map((r) =>
      `<tr><td>${r.tier}</td><td>${r.sent}</td><td>${r.replies_received}</td><td>${r.accepted}</td><td>${r.declined}</td></tr>`
    ).join("");

    const cumHtml = Object.entries(cumByTier).map(([t, v]) =>
      `<tr><td>${t}</td><td>${v.invited}</td><td>${v.pending}</td><td>${v.accepted}</td><td>${v.declined}</td></tr>`
    ).join("");

    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#000;background:#fff;padding:16px">
<h2 style="margin:0 0 8px">Castle Invite — Daily Summary (${todayPT})</h2>
<h3>Today</h3>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-size:14px">
<thead><tr><th>Tier</th><th>Sent</th><th>Replies</th><th>Accepted</th><th>Declined</th></tr></thead>
<tbody>${rowsHtml || `<tr><td colspan="5">No sends today.</td></tr>`}</tbody>
</table>
<h3>Cumulative</h3>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-size:14px">
<thead><tr><th>Tier</th><th>Invited</th><th>Pending</th><th>Accepted</th><th>Declined</th></tr></thead>
<tbody>${cumHtml || `<tr><td colspan="5">No data.</td></tr>`}</tbody>
</table>
</body></html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_KEY}` },
      body: JSON.stringify({
        from: "White Rabbit Ops <scott.syme@whiterabbitla.com>",
        to: "scott.syme@whiterabbitla.com",
        subject: `Castle Invite — Daily Summary ${todayPT}`,
        html,
      }),
    });
    const ok = res.ok;
    const respBody = await res.text();
    return new Response(JSON.stringify({ ok, todayPT, todayRows, cumByTier, resend: respBody.slice(0, 300) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("castle-invite-summary error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
