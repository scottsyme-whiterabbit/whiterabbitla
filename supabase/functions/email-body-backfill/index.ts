// One-off backfill: converts stored HTML / quoted-printable email bodies to plain text.
// Idempotent (keeps the first original in body_raw). Deleted after use.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { cleanEmailBody } from "../_shared/htmlToText.ts";

Deno.serve(async () => {
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const re = /(<div|<table|<!doctype|style=)/i;
  const qp = /=(3D|0A)/;
  let converted = 0, scanned = 0, from = 0;
  const errors: string[] = [];
  while (true) {
    const { data, error } = await sb.from("deal_email_messages")
      .select("id, body_text, body_raw").order("id").range(from, from + 499);
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    if (!data?.length) break;
    for (const r of data) {
      scanned++;
      const b = r.body_text || "";
      if (!re.test(b) && !qp.test(b)) continue;
      const t = cleanEmailBody(b);
      if (t === b) continue;
      const { error: e } = await sb.from("deal_email_messages")
        .update({ body_raw: r.body_raw ?? b, body_text: t }).eq("id", r.id);
      if (e) errors.push(`${r.id}: ${e.message}`); else converted++;
    }
    from += 500;
  }
  return new Response(JSON.stringify({ scanned, converted, errors }), { headers: { "Content-Type": "application/json" } });
});
