import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-import-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_CATEGORIES = new Set([
  "corporate_planner", "wedding_planner", "pr_agency", "country_club", "talent",
  "nonprofit", "spirits", "venue", "fundraiser", "restaurant", "nightlife",
  "luxury_auto", "tech_events", "hotel_concierge", "casino_entertainment",
]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const token = req.headers.get("x-import-token");
  const expected = Deno.env.get("EXTERNAL_IMPORT_TOKEN");
  if (!expected || !token || token !== expected) {
    return json({ error: "Unauthorized" }, 401);
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // ---- check_ids action: read-only existence check by apollo_id ----
  if (payload?.action === "check_ids") {
    const ids = Array.isArray(payload?.apollo_ids) ? payload.apollo_ids.filter((x: any) => typeof x === "string" && x.length > 0) : null;
    if (!ids) return json({ error: "apollo_ids must be a string array" }, 400);
    const known: string[] = [];
    for (let i = 0; i < ids.length; i += 500) {
      const batch = ids.slice(i, i + 500);
      const { data, error } = await supabase
        .from("cold_email_campaigns")
        .select("apollo_id")
        .in("apollo_id", batch);
      if (error) return json({ error: error.message }, 500);
      (data || []).forEach((r: any) => { if (r.apollo_id) known.push(r.apollo_id); });
    }
    return json({ known });
  }

  const contacts = Array.isArray(payload?.contacts) ? payload.contacts : null;
  if (!contacts) return json({ error: "Body must include contacts: [] or action: 'check_ids'" }, 400);

  let inserted = 0;
  let updated = 0;
  let skipped_invalid_category = 0;
  let skipped_missing_email = 0;
  const errors: { email: string; reason: string }[] = [];

  for (const raw of contacts) {
    const emailRaw = typeof raw?.email === "string" ? raw.email.trim().toLowerCase() : "";
    if (!emailRaw) {
      skipped_missing_email++;
      continue;
    }

    const category = typeof raw?.campaign_category === "string" ? raw.campaign_category.trim() : "";
    if (!ALLOWED_CATEGORIES.has(category)) {
      skipped_invalid_category++;
      errors.push({ email: emailRaw, reason: `invalid campaign_category: ${category || "(empty)"}` });
      continue;
    }

    try {
      const { data: existing, error: selErr } = await supabase
        .from("cold_email_campaigns")
        .select("id")
        .ilike("email", emailRaw)
        .maybeSingle();

      if (selErr) throw selErr;

      const first_name = raw.first_name ?? null;
      const last_name = raw.last_name ?? null;
      const concatName = [first_name, last_name].filter(Boolean).join(" ").trim() || raw.name || null;

      const baseFields: Record<string, unknown> = {
        email: emailRaw,
        name: concatName,
        first_name,
        last_name,
        title: raw.title ?? null,
        company: raw.company ?? null,
        domain: raw.domain ?? null,
        website: raw.website ?? null,
        phone: raw.phone ?? null,
        city: raw.city ?? null,
        state: raw.state ?? null,
        linkedin_url: raw.linkedin_url ?? null,
        apollo_id: raw.apollo_id ?? null,
        email_status: raw.email_status ?? null,
        notes: raw.notes ?? null,
        campaign_category: category,
        updated_at: new Date().toISOString(),
      };

      if (existing?.id) {
        // Don't touch status / current_step on existing rows
        const { error: updErr } = await supabase
          .from("cold_email_campaigns")
          .update(baseFields)
          .eq("id", existing.id);
        if (updErr) throw updErr;
        updated++;
      } else {
        const { error: insErr } = await supabase
          .from("cold_email_campaigns")
          .insert({ ...baseFields, status: "active", current_step: 0 });
        if (insErr) throw insErr;
        inserted++;
      }
    } catch (e: any) {
      errors.push({ email: emailRaw, reason: e?.message ?? String(e) });
    }
  }

  return json({ inserted, updated, skipped_invalid_category, skipped_missing_email, errors });
});
