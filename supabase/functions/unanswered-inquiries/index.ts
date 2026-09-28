import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const UUID = /^[0-9a-f-]{36}$/i;
const ADMIN_LINK = "https://whiterabbitla.com/admin/newsletter?tab=today&deal=";

interface Waiting {
  deal_id: string; contact_name: string | null; contact_email: string; phone: string | null;
  event_type: string | null; event_date: string | null; location: string | null; notes: string | null;
  days_waiting: number; created_at: string;
}

const pacific = () => {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { hour: Number(g("hour")), today: `${g("year")}-${g("month")}-${g("day")}` };
};

// deno-lint-ignore no-explicit-any
async function findWaiting(supabase: any): Promise<Waiting[]> {
  const cutoff = new Date(Date.now() - 12 * 3600000).toISOString();
  const { data: deals, error } = await supabase.from("deals")
    .select("id,contact_name,contact_email,phone,event_type,event_date,location,notes,created_at")
    .eq("stage", "new").lt("created_at", cutoff).is("reply_dismissed_at", null)
    .order("created_at", { ascending: true }).limit(1000);
  if (error) throw error;
  const out: Waiting[] = [];
  for (const d of deals || []) {
    if (out.length >= 25) break;
    const email = (d.contact_email || "").trim();
    if (email) {
      const { data: outbound, error: oErr } = await supabase.from("deal_email_messages")
        .select("gmail_message_id").eq("direction", "outbound").ilike("to_email", `%${email}%`).gt("sent_at", d.created_at).limit(200);
      if (oErr) throw oErr;
      const ids = (outbound || []).map((m: { gmail_message_id: string }) => m.gmail_message_id);
      if (ids.length) {
        const { data: auto, error: aErr } = await supabase.from("automated_gmail_sends").select("gmail_message_id").in("gmail_message_id", ids);
        if (aErr) throw aErr;
        const autoSet = new Set((auto || []).map((a: { gmail_message_id: string }) => a.gmail_message_id));
        if (ids.some((id: string) => !autoSet.has(id))) continue; // a human replied
      }
    }
    out.push({
      deal_id: d.id, contact_name: d.contact_name, contact_email: d.contact_email, phone: d.phone,
      event_type: d.event_type, event_date: d.event_date, location: d.location, notes: d.notes,
      days_waiting: Math.floor((Date.now() - new Date(d.created_at).getTime()) / 864e5), created_at: d.created_at,
    });
  }
  return out;
}

function personHtml(w: Waiting) {
  const details = [w.event_type, w.event_date, w.location].filter((x) => x && String(x).trim()).map((x) => esc(String(x))).join(" · ");
  const tel = w.phone ? w.phone.replace(/[^\d+]/g, "") : "";
  return `<div style="margin:0 0 20px 0;">
<div><strong>${esc(w.contact_name || w.contact_email)}</strong></div>
${details ? `<div>${details}</div>` : ""}
<div>Waiting ${w.days_waiting} day${w.days_waiting === 1 ? "" : "s"}</div>
<div>${w.phone ? `<a href="tel:${esc(tel)}">${esc(w.phone)}</a> · ` : ""}<a href="mailto:${esc(w.contact_email)}">${esc(w.contact_email)}</a></div>
<div><a href="${ADMIN_LINK}${w.deal_id}">Open in CRM</a></div>
</div>`;
}

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
    if (!supabaseUrl || !serviceKey) throw new Error("Required service configuration is missing");
    const supabase = createClient(supabaseUrl, serviceKey);
    const action = typeof body?.action === "string" ? body.action : "alert";

    if (action === "list") {
      const waiting = await findWaiting(supabase);
      return json({ count: waiting.length, waiting });
    }

    if (action === "dismiss" || action === "undismiss") {
      if (!adminOk) return json({ error: "Unauthorized" }, 401);
      const dealId = body?.deal_id;
      if (typeof dealId !== "string" || !UUID.test(dealId)) return json({ error: "deal_id is required" }, 400);
      let patch: Record<string, string | null>;
      if (action === "dismiss") {
        const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
        if (!reason || reason.length > 200) return json({ error: "reason is required (max 200 characters)" }, 400);
        patch = { reply_dismissed_at: new Date().toISOString(), reply_dismissed_reason: reason, reply_dismissed_by: "admin" };
      } else {
        patch = { reply_dismissed_at: null, reply_dismissed_reason: null, reply_dismissed_by: null };
      }
      const { error } = await supabase.from("deals").update(patch).eq("id", dealId);
      if (error) throw error;
      return json({ ok: true });
    }

    if (action !== "alert") return json({ error: "Unknown action" }, 400);

    const { hour, today } = pacific();
    if (body?.force !== true && hour !== 8 && hour !== 16) return json({ skipped: true });

    const waiting = await findWaiting(supabase);
    const count = waiting.length;
    if (count === 0) return json({ sent: 0, count: 0 });

    const upcoming = waiting.filter((w) => !w.event_date || w.event_date >= today);
    const passed = waiting.filter((w) => w.event_date && w.event_date < today);
    const subject = `${count} ${count === 1 ? "person is" : "people are"} waiting on you`;
    const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#222;">
<p>These people contacted you and have not heard from you personally yet. Oldest first.</p>
${upcoming.map(personHtml).join("\n")}
${passed.length ? `<p style="margin-top:28px;"><strong>Event date has passed</strong></p>\n${passed.map(personHtml).join("\n")}` : ""}
</div>`;

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY missing");
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "White Rabbit <scott.syme@whiterabbitla.com>", to: ["scott.syme@whiterabbitla.com"], subject, html }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error(`Resend failed [${res.status}]: ${t}`);
      return json({ error: "Alert send failed", status: res.status, details: t }, 502);
    }
    return json({ sent: 1, count });
  } catch (e) {
    console.error("unanswered-inquiries error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
