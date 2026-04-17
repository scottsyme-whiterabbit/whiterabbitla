import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-bulk-import-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_CATEGORIES = [
  "wedding_planner",
  "corporate_planner",
  "spirits",
  "resident",
  "dmc",
  "venue",
  "fundraiser",
  "trade_show",
  "golf_tournament",
];

interface ContactInput {
  email: string;
  name?: string;
  company?: string;
  title?: string;
  phone?: string;
  city?: string;
  state?: string;
  linkedin_url?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Token can be sent via header OR body for flexibility
    const headerToken = req.headers.get("x-bulk-import-token");
    const body = await req.json();
    const token = headerToken || body.bulkImportToken;

    if (!token || token !== Deno.env.get("BULK_IMPORT_TOKEN")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { campaign_category, contacts, start_immediately } = body as {
      campaign_category: string;
      contacts: ContactInput[];
      start_immediately?: boolean;
    };

    if (!campaign_category || !VALID_CATEGORIES.includes(campaign_category)) {
      return new Response(
        JSON.stringify({
          error: `Invalid campaign_category. Must be one of: ${VALID_CATEGORIES.join(", ")}`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return new Response(JSON.stringify({ error: "contacts must be a non-empty array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (contacts.length > 1000) {
      return new Response(
        JSON.stringify({ error: "Max 1000 contacts per request. Split into batches." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Normalize + dedupe within payload
    const seen = new Set<string>();
    const cleaned = contacts
      .map((c) => ({
        ...c,
        email: (c.email || "").toLowerCase().trim(),
      }))
      .filter((c) => {
        if (!c.email || !c.email.includes("@")) return false;
        if (seen.has(c.email)) return false;
        seen.add(c.email);
        return true;
      });

    // Look up which emails already exist in cold_email_campaigns (any category)
    const emails = cleaned.map((c) => c.email);
    const { data: existingRows } = await supabase
      .from("cold_email_campaigns")
      .select("email, campaign_category")
      .in("email", emails);

    const existingMap = new Map<string, string[]>();
    (existingRows || []).forEach((row) => {
      const arr = existingMap.get(row.email) || [];
      arr.push(row.campaign_category);
      existingMap.set(row.email, arr);
    });

    const toInsert: any[] = [];
    const skipped: { email: string; reason: string; categories?: string[] }[] = [];

    for (const c of cleaned) {
      const existingCats = existingMap.get(c.email);
      if (existingCats) {
        skipped.push({ email: c.email, reason: "already_exists", categories: existingCats });
        continue;
      }
      toInsert.push({
        email: c.email,
        name: c.name || null,
        company: c.company || null,
        title: c.title || null,
        phone: c.phone || null,
        city: c.city || null,
        state: c.state || null,
        linkedin_url: c.linkedin_url || null,
        campaign_category,
        status: start_immediately ? "active" : "pending",
        current_step: 0,
        started_at: start_immediately ? new Date().toISOString() : null,
      });
    }

    let insertedCount = 0;
    const insertErrors: string[] = [];

    // Insert in chunks of 100
    for (let i = 0; i < toInsert.length; i += 100) {
      const chunk = toInsert.slice(i, i + 100);
      const { data, error } = await supabase
        .from("cold_email_campaigns")
        .insert(chunk)
        .select("id");
      if (error) {
        insertErrors.push(`Chunk ${i}: ${error.message}`);
      } else {
        insertedCount += data?.length || 0;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        campaign_category,
        received: contacts.length,
        cleaned: cleaned.length,
        inserted: insertedCount,
        skipped_duplicates: skipped.length,
        skipped,
        insert_errors: insertErrors.length ? insertErrors : undefined,
        status: start_immediately ? "active" : "pending",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("bulk-import-cold-campaigns error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
