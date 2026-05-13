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
      const { id, to, subject, message, link } = await req.json();
      if (!to || !link) return json({ error: "Missing fields" }, 400);

      const safeSubject = (subject || "Your Proposal").replace(/</g, "&lt;");
      const safeMessage = (message || "").replace(/</g, "&lt;");
      const messageText = (message || "").trim() ||
        "Thank you for considering White Rabbit LA for your event. I've put together a proposal tailored to what you're planning — please take a look at the link below and let me know if you have any questions. I'm happy to jump on a quick call to walk through it.";
      const safeMessageRender = messageText.replace(/</g, "&lt;");

      const html = `<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#F8F5F0;padding:40px 20px;color:#223D34;margin:0;">
        <div style="max-width:560px;margin:0 auto;background:#fff;padding:48px 40px;border:1px solid #D4A843;">
          <h1 style="font-family:Georgia,serif;font-weight:300;font-size:26px;margin:0 0 20px;color:#223D34;">${safeSubject}</h1>
          <p style="font-size:16px;line-height:1.7;margin:0 0 20px;">Hi there,</p>
          <div style="font-size:16px;line-height:1.7;white-space:pre-wrap;margin:0 0 28px;">${safeMessageRender}</div>
          <div style="margin:32px 0;text-align:center;">
            <a href="${link}" style="display:inline-block;background:#223D34;color:#F8F5F0;text-decoration:none;padding:16px 36px;letter-spacing:2px;text-transform:uppercase;font-size:13px;font-family:Arial,sans-serif;">View Your Proposal</a>
          </div>
          <p style="font-size:13px;color:#6B6B6B;margin:8px 0 32px;text-align:center;">Or copy and paste this link into your browser:<br/><a href="${link}" style="color:#223D34;word-break:break-all;">${link}</a></p>
          <p style="font-size:14px;color:#444;line-height:1.6;margin:32px 0 0;border-top:1px solid #eee;padding-top:24px;">
            Warmly,<br/>
            <strong style="color:#223D34;">Scott Syme</strong><br/>
            White Rabbit LA — Luxury Magic & Entertainment<br/>
            <a href="tel:+14243941850" style="color:#223D34;text-decoration:none;">(424) 394-1850</a> · <a href="mailto:scott.syme@whiterabbitla.com" style="color:#223D34;text-decoration:none;">scott.syme@whiterabbitla.com</a><br/>
            <a href="https://whiterabbitla.com" style="color:#223D34;text-decoration:none;">whiterabbitla.com</a>
          </p>
          <p style="font-size:11px;color:#999;margin:28px 0 0;text-align:center;">
            White Rabbit LA · 7393 W. Manchester Ave #209, Los Angeles, CA 90045<br/>
            You're receiving this because you requested a proposal. <a href="${link}" style="color:#999;">View proposal</a>
          </p>
        </div>
      </body></html>`;

      const text = `Hi there,

${messageText}

View your proposal: ${link}

Warmly,
Scott Syme
White Rabbit LA — Luxury Magic & Entertainment
(424) 394-1850 · scott.syme@whiterabbitla.com
https://whiterabbitla.com

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
          subject: subject || "Your White Rabbit LA Proposal",
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
