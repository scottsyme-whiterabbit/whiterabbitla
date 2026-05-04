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
      return json({ proposal: data });
    }

    // ADMIN actions below
    if (!isAdmin(req)) return json({ error: "Unauthorized" }, 401);

    if (action === "list") {
      const { data, error } = await supabase
        .from("proposals")
        .select("id, slug, first_name, last_name, recipient_email, event_type, event_date, venue, sent_at, created_at")
        .order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 500);
      return json({ proposals: data });
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
      const html = `<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#F8F5F0;padding:40px 20px;color:#223D34;">
        <div style="max-width:560px;margin:0 auto;background:#fff;padding:48px 40px;border:1px solid #D4A843;">
          <h1 style="font-family:Georgia,serif;font-weight:300;font-size:28px;margin:0 0 24px;color:#223D34;">${(subject || "Your Proposal").replace(/</g, "&lt;")}</h1>
          <div style="font-size:16px;line-height:1.7;white-space:pre-wrap;">${(message || "").replace(/</g, "&lt;")}</div>
          <div style="margin:36px 0;text-align:center;">
            <a href="${link}" style="display:inline-block;background:#223D34;color:#F8F5F0;text-decoration:none;padding:16px 36px;letter-spacing:2px;text-transform:uppercase;font-size:13px;font-family:Arial,sans-serif;">View Your Proposal</a>
          </div>
          <p style="font-size:14px;color:#6B6B6B;margin-top:40px;">— Scott Syme<br/>White Rabbit LA<br/><a href="tel:+14243941850" style="color:#223D34;">(424) 394-1850</a></p>
        </div>
      </body></html>`;

      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Scott Syme <scott@whiterabbitla.com>",
          to: [to],
          subject: subject || "Your White Rabbit LA Proposal",
          html,
          reply_to: "scott@whiterabbitla.com",
        }),
      });
      if (!r.ok) {
        const t = await r.text();
        return json({ error: `Email send failed: ${t}` }, 500);
      }
      if (id) {
        await supabase.from("proposals").update({ sent_at: new Date().toISOString() }).eq("id", id);
      }
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
