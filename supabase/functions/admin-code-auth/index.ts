// Sign-in door for the admin PWA: emails a 6 digit code, then exchanges a
// correct code for a one-time magic-link token hash that the app verifies
// in its own storage, so the session lives inside the installed app.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

const allowlist = (): string[] => {
  const list = (Deno.env.get("ADMIN_EMAILS") || "")
    .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return list.length ? list : ["scott.syme@whiterabbitla.com"];
};

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

function sixDigits(): string {
  const a = new Uint32Array(1);
  // rejection sampling to avoid modulo bias
  const limit = Math.floor(0xffffffff / 1_000_000) * 1_000_000;
  do crypto.getRandomValues(a); while (a[0] >= limit);
  return String(a[0] % 1_000_000).padStart(6, "0");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  let body: any = {};
  try { body = await req.json(); } catch { return json({ ok: false, error: "Bad request" }, 400); }
  const email = String(body?.email || "").trim().toLowerCase();
  if (!email || email.length > 254) return json({ ok: false, error: "Bad request" }, 400);

  if (body.action === "request") {
    try {
      const since = new Date(Date.now() - 3600_000).toISOString();
      const { count } = await supabase.from("admin_login_codes")
        .select("id", { count: "exact", head: true }).eq("email", email).gte("created_at", since);
      if ((count ?? 0) >= 5) return json({ ok: true });
      if (!allowlist().includes(email)) return json({ ok: true });

      const code = sixDigits();
      const { error } = await supabase.from("admin_login_codes").insert({
        email, code_hash: await sha256(code),
        expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
      });
      if (error) { console.error("insert code failed", error); return json({ ok: true }); }

      const text = `${code}\n\nThis code expires in 10 minutes. If you did not ask for it, ignore this email.`;
      const html = `<div style="font-family:Arial,sans-serif;color:#222"><p style="font-size:32px;letter-spacing:6px;font-weight:bold;margin:0 0 16px">${code}</p><p>This code expires in 10 minutes. If you did not ask for it, ignore this email.</p></div>`;
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "White Rabbit <scott.syme@whiterabbitla.com>", to: [email],
          subject: "Your White Rabbit sign in code", text, html,
        }),
      });
      if (!r.ok) console.error("resend failed", r.status, await r.text());
    } catch (e) { console.error("request error", e); }
    return json({ ok: true });
  }

  if (body.action === "verify") {
    const code = String(body?.code || "").trim();
    const { data: row } = await supabase.from("admin_login_codes")
      .select("id, code_hash, attempts").eq("email", email).is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!row) return json({ ok: false, error: "Invalid or expired code" });
    if (row.attempts >= 5) return json({ ok: false, error: "Too many attempts" });
    await supabase.from("admin_login_codes").update({ attempts: row.attempts + 1 }).eq("id", row.id);
    if (!/^\d{6}$/.test(code) || (await sha256(code)) !== row.code_hash) {
      return json({ ok: false, error: "Invalid or expired code" });
    }
    await supabase.from("admin_login_codes").update({ used_at: new Date().toISOString() }).eq("id", row.id);
    const { data, error } = await supabase.auth.admin.generateLink({ type: "magiclink", email });
    const token_hash = (data as any)?.properties?.hashed_token;
    if (error || !token_hash) {
      console.error("generateLink failed", error);
      return json({ ok: false, error: "Could not sign in" });
    }
    return json({ ok: true, token_hash });
  }

  return json({ ok: false, error: "Unknown action" }, 400);
});
