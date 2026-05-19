import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-password",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const slugify = (first: string, last: string) => {
  const base = `${first}-${last}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "proposal";
  const rand = Math.random().toString(36).slice(2, 8);
  return `${base}-${rand}`;
};

const slugifyVenue = (venue: string) => {
  const base = (venue || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "residency";
  const rand = Math.random().toString(36).slice(2, 8);
  return `${base}-${rand}`;
};

const isAdmin = (req: Request) => {
  const pw = req.headers.get("x-admin-password") || "";
  return ADMIN_PASSWORD && pw === ADMIN_PASSWORD;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "";
    const slug = url.searchParams.get("slug") || "";

    // PUBLIC: get by slug
    if (action === "get" && slug) {
      const { data, error } = await supabase.from("proposals").select("*").eq("slug", slug).maybeSingle();
      if (error) return json({ error: error.message }, 500);
      if (!data) return json({ error: "Not found" }, 404);

      // Log view (skip if admin preview header present)
      if (!isAdmin(req)) {
        const ua = req.headers.get("user-agent") || "";
        const ref = req.headers.get("referer") || "";
        // fire-and-forget
        supabase.from("proposal_views").insert({
          proposal_id: data.id,
          user_agent: ua.slice(0, 500),
          referrer: ref.slice(0, 500),
        }).then(() => {});
      }
      return json({ proposal: data });
    }

    // PUBLIC: views for a single proposal (no PII) — used by admin list too
    // ADMIN actions below
    if (!isAdmin(req)) return json({ error: "Unauthorized" }, 401);

    if (action === "list") {
      const { data, error } = await supabase
        .from("proposals")
        .select("id, slug, first_name, last_name, recipient_email, event_type, event_date, venue, sent_at, created_at")
        .order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 500);

      // Attach view stats
      const ids = (data || []).map((p: any) => p.id);
      let stats: Record<string, { count: number; last: string | null }> = {};
      if (ids.length) {
        const { data: views } = await supabase
          .from("proposal_views")
          .select("proposal_id, viewed_at")
          .in("proposal_id", ids)
          .order("viewed_at", { ascending: false });
        for (const v of views || []) {
          const s = stats[v.proposal_id] ||= { count: 0, last: null };
          s.count++;
          if (!s.last) s.last = v.viewed_at;
        }
      }
      const enriched = (data || []).map((p: any) => ({
        ...p,
        view_count: stats[p.id]?.count || 0,
        last_viewed_at: stats[p.id]?.last || null,
      }));
      return json({ proposals: enriched });
    }

    if (action === "views" && req.method === "GET") {
      const id = url.searchParams.get("id");
      if (!id) return json({ error: "Missing id" }, 400);
      const { data, error } = await supabase
        .from("proposal_views")
        .select("viewed_at, user_agent, referrer")
        .eq("proposal_id", id)
        .order("viewed_at", { ascending: false })
        .limit(100);
      if (error) return json({ error: error.message }, 500);
      return json({ views: data });
    }

    if (action === "create" && req.method === "POST") {
      const body = await req.json();
      const newSlug = slugify(body.first_name || "", body.last_name || "");
      const { data, error } = await supabase
        .from("proposals")
        .insert({ ...body, slug: newSlug })
        .select()
        .single();
      if (error) return json({ error: error.message }, 500);
      return json({ proposal: data });
    }

    if (action === "update" && req.method === "POST") {
      const body = await req.json();
      const { id, ...updates } = body;
      delete updates.created_at;
      delete updates.updated_at;
      const { data, error } = await supabase
        .from("proposals")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) return json({ error: error.message }, 500);
      return json({ proposal: data });
    }

    if (action === "delete" && req.method === "POST") {
      const { id } = await req.json();
      const { error } = await supabase.from("proposals").delete().eq("id", id);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === "send" && req.method === "POST") {
      const { id, to, subject, message, link, firstName } = await req.json();
      if (!to || !link) return json({ error: "Missing fields" }, 400);

      const LOGO_URL = "https://pgjyzayvkyrftcksvncj.supabase.co/storage/v1/object/public/email-assets/wr-email-logo.png";
      const greetingName = (firstName || "").toString().trim();
      const safeGreeting = greetingName.replace(/</g, "&lt;");
      const finalSubject = subject || "Your White Rabbit LA Proposal";

      const messageText = (message || "").trim() ||
        "Here's the proposal we discussed. Take your time with it — call me anytime.\n\nBest,\n-Scott";
      // Escape, then convert paragraph breaks to <br/><br/> and single newlines to <br/>
      const safeMessageHtml = messageText
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br/>");

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<style>
body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
body { margin: 0; padding: 0; width: 100% !important; background-color: #335747; }
@media screen and (max-width: 600px) {
  .email-container { width: 100% !important; }
  .padding-mobile { padding-left: 20px !important; padding-right: 20px !important; }
}
</style>
</head>
<body style="margin:0; padding:0; background-color:#335747;">
<div style="display:none; max-height:0; overflow:hidden; font-size:1px; line-height:1px; color:#335747;">Your White Rabbit LA proposal is ready to view.</div>
<center style="width:100%; background-color:#335747;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#335747;">
<tr><td style="padding: 30px 0;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" align="center" class="email-container" style="max-width:560px; margin:auto; background-color:#223D34; border-radius:4px;">

<tr><td style="padding: 40px 40px 24px; text-align:center;" class="padding-mobile">
<img src="${LOGO_URL}" alt="White Rabbit" width="90" style="width:90px; height:auto; display:block; margin:0 auto;" />
</td></tr>

<tr><td style="padding: 0 40px 20px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0;">Hello${safeGreeting ? ` ${safeGreeting}` : ""},</p>
</td></tr>

<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0;">${safeMessageHtml}</p>
</td></tr>

<tr><td style="padding: 0 40px 32px; text-align:center;" class="padding-mobile">
<a href="${link}" target="_blank" style="display:inline-block; padding:14px 36px; font-family:Georgia,serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#C9A3A8; text-decoration:none; font-weight:bold; border:1px solid #C9A3A8; border-radius:2px;">View Your Proposal</a>
</td></tr>

<tr><td style="padding: 0 40px 28px; text-align:center;" class="padding-mobile">
<p style="margin:0; font-family:Georgia,serif; font-size:12px; color:rgba(245,240,232,0.4);">Or open in your browser:<br/><a href="${link}" style="color:rgba(201,163,168,0.7); word-break:break-all; text-decoration:none;">${link}</a></p>
</td></tr>

<tr><td style="padding: 0 40px;" class="padding-mobile">
<hr style="border:none; border-top:1px solid rgba(201,163,168,0.15); margin:0 0 24px;" />
</td></tr>

<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:13px; line-height:1.7; color:rgba(245,240,232,0.55);" class="padding-mobile">
<p style="margin:0;">
<span style="color:rgba(245,240,232,0.85);">Scott Syme</span><br/>
White Rabbit LA — Luxury Magic &amp; Entertainment<br/>
Office <a href="tel:+14243941850" style="color:rgba(201,163,168,0.85); text-decoration:none;">(424) 394-1850</a> · Cell <a href="tel:+16506789428" style="color:rgba(201,163,168,0.85); text-decoration:none;">(650) 678-9428</a><br/>
<a href="mailto:scott.syme@whiterabbitla.com" style="color:rgba(201,163,168,0.85); text-decoration:none;">scott.syme@whiterabbitla.com</a> · <a href="https://whiterabbitla.com" style="color:rgba(201,163,168,0.85); text-decoration:none;">whiterabbitla.com</a>
</p>
</td></tr>

<tr><td style="padding: 0 40px 12px; text-align:center;" class="padding-mobile">
<p style="margin:0; font-family:Georgia,serif; font-size:12px; color:rgba(245,240,232,0.4);">
White Rabbit · Los Angeles<br/>
7393 W. Manchester Ave #209, Los Angeles, CA 90045
</p>
</td></tr>
<tr><td style="padding: 0 40px 32px; text-align:center;" class="padding-mobile">
<p style="margin:0; font-family:Georgia,serif; font-size:11px; color:rgba(245,240,232,0.25);">
You're receiving this because you requested a proposal from White Rabbit LA.
</p>
</td></tr>

</table>
</td></tr></table>
</center>
</body></html>`;

      const text = `Hello${greetingName ? ` ${greetingName}` : ""},

${messageText}

Scott Syme
White Rabbit LA — Luxury Magic & Entertainment
Office (424) 394-1850 · Cell (650) 678-9428
scott.syme@whiterabbitla.com · https://whiterabbitla.com

View your proposal: ${link}

—
White Rabbit LA · 7393 W. Manchester Ave #209, Los Angeles, CA 90045`;

      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Scott Syme <scott.syme@whiterabbitla.com>",
          to: [to],
          subject: finalSubject,
          html,
          text,
          reply_to: "scott.syme@whiterabbitla.com",
          headers: {
            "List-Unsubscribe": "<mailto:scott.syme@whiterabbitla.com?subject=unsubscribe>",
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        }),
      });
      if (!r.ok) {
        const t = await r.text();
        return json({ error: `Email send failed: ${t}` }, 500);
      }
      if (id) {
        await supabase.from("proposals").update({ sent_at: new Date().toISOString() }).eq("id", id);

        // Auto-create / update CRM deal in "proposal_sent" stage
        try {
          const { data: prop } = await supabase
            .from("proposals")
            .select("id, first_name, last_name, recipient_email, event_type, event_date, venue")
            .eq("id", id)
            .maybeSingle();
          if (prop?.recipient_email) {
            const contactName = `${prop.first_name || ""} ${prop.last_name || ""}`.trim() || null;
            // Parse event_date (free-text) to a real date if possible
            let eventDate: string | null = null;
            if (prop.event_date) {
              const d = new Date(prop.event_date);
              if (!isNaN(d.getTime())) eventDate = d.toISOString().slice(0, 10);
            }
            const { data: existing } = await supabase
              .from("deals")
              .select("id, stage")
              .eq("contact_email", prop.recipient_email.toLowerCase())
              .maybeSingle();
            if (existing) {
              const updates: any = { stage: "proposal_sent", source_id: prop.id, source: "proposal" };
              if (eventDate) updates.event_date = eventDate;
              if (prop.venue) updates.location = prop.venue;
              if (prop.event_type) updates.event_type = prop.event_type;
              if (contactName) updates.contact_name = contactName;
              await supabase.from("deals").update(updates).eq("id", existing.id);
            } else {
              await supabase.from("deals").insert({
                contact_email: prop.recipient_email.toLowerCase(),
                contact_name: contactName,
                event_type: prop.event_type || null,
                event_date: eventDate,
                location: prop.venue || null,
                stage: "proposal_sent",
                source: "proposal",
                source_id: prop.id,
                notes: `Auto-created when proposal sent on ${new Date().toLocaleDateString()}`,
              });
            }
          }
        } catch (e) {
          console.error("Deal auto-create failed:", (e as Error).message);
        }
      }
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
