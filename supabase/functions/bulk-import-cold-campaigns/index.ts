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

// Role-based local-parts that should never receive cold outreach.
// Mailbox providers commonly block cold sends to these and they hurt sender reputation.
const ROLE_BASED_PREFIXES = [
  "info",
  "hello",
  "contact",
  "events",
  "admin",
  "support",
  "sales",
  "team",
  "office",
  "help",
  "marketing",
  "no-reply",
  "noreply",
];

function isRoleBasedEmail(email: string): boolean {
  const localPart = email.split("@")[0]?.toLowerCase() ?? "";
  return ROLE_BASED_PREFIXES.includes(localPart);
}

interface ContactInput {
  email: string;
  name?: string;
  company?: string;
  title?: string;
  phone?: string;
  city?: string;
  state?: string;
  linkedin_url?: string;
  apollo_id?: string;
  notes?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ---- Kill switch ----
  if ((Deno.env.get("EDGE_FUNCTIONS_DISABLED") || "").toLowerCase() === "true") {
    return new Response(JSON.stringify({ error: "temporarily_disabled" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const headerToken = req.headers.get("x-bulk-import-token");
    const body = await req.json();
    const token = headerToken || body.bulkImportToken;

    if (!token || token !== Deno.env.get("BULK_IMPORT_TOKEN")) {
      return new Response(JSON.stringify({ error: "auth_failed" }), {
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

    const skipped: {
      email: string;
      apollo_id?: string;
      reason: string;
      categories?: string[];
    }[] = [];

    // ============================================================
    // STAGE 1: Auto-reject role-based addresses, add to suppression
    // ============================================================
    const roleBasedHits: { email: string; apollo_id?: string }[] = [];
    const afterRoleFilter = cleaned.filter((c) => {
      if (isRoleBasedEmail(c.email)) {
        roleBasedHits.push({ email: c.email, apollo_id: c.apollo_id });
        skipped.push({
          email: c.email,
          apollo_id: c.apollo_id,
          reason: "role_based",
        });
        return false;
      }
      return true;
    });

    // Auto-add role-based hits to suppression list (idempotent via unique email)
    if (roleBasedHits.length > 0) {
      await supabase.from("email_suppression_list").upsert(
        roleBasedHits.map((r) => ({
          email: r.email,
          reason: "role_based",
          source_campaign_category: campaign_category,
          notes: "Auto-rejected at import (role-based local-part)",
        })),
        { onConflict: "email", ignoreDuplicates: true }
      );
    }

    // ============================================================
    // STAGE 2: Check suppression list
    // ============================================================
    const remainingEmails = afterRoleFilter.map((c) => c.email);
    const { data: suppressedRows } = remainingEmails.length
      ? await supabase
          .from("email_suppression_list")
          .select("email, reason")
          .in("email", remainingEmails)
      : { data: [] as { email: string; reason: string }[] };

    const suppressedMap = new Map<string, string>();
    (suppressedRows || []).forEach((row) => {
      suppressedMap.set(row.email, row.reason);
    });

    const afterSuppression = afterRoleFilter.filter((c) => {
      const reason = suppressedMap.get(c.email);
      if (reason) {
        skipped.push({
          email: c.email,
          apollo_id: c.apollo_id,
          reason: `suppressed:${reason}`,
        });
        return false;
      }
      return true;
    });

    // ============================================================
    // STAGE 3: Dedup against existing cold_email_campaigns
    // ============================================================
    const emails = afterSuppression.map((c) => c.email);
    const apolloIds = afterSuppression.map((c) => c.apollo_id).filter(Boolean) as string[];

    const { data: existingByEmail } = emails.length
      ? await supabase
          .from("cold_email_campaigns")
          .select("email, apollo_id, campaign_category")
          .in("email", emails)
      : { data: [] as any[] };

    const { data: existingByApollo } = apolloIds.length
      ? await supabase
          .from("cold_email_campaigns")
          .select("email, apollo_id, campaign_category")
          .in("apollo_id", apolloIds)
      : { data: [] as any[] };

    const existingEmails = new Map<string, string[]>();
    const existingApollo = new Map<string, string[]>();
    (existingByEmail || []).forEach((row) => {
      const arr = existingEmails.get(row.email) || [];
      arr.push(row.campaign_category);
      existingEmails.set(row.email, arr);
    });
    (existingByApollo || []).forEach((row) => {
      if (!row.apollo_id) return;
      const arr = existingApollo.get(row.apollo_id) || [];
      arr.push(row.campaign_category);
      existingApollo.set(row.apollo_id, arr);
    });

    const toInsert: any[] = [];

    for (const c of afterSuppression) {
      const emailHit = existingEmails.get(c.email);
      const apolloHit = c.apollo_id ? existingApollo.get(c.apollo_id) : undefined;
      if (emailHit || apolloHit) {
        skipped.push({
          email: c.email,
          apollo_id: c.apollo_id,
          reason: apolloHit ? "apollo_id_exists" : "email_exists",
          categories: apolloHit || emailHit,
        });
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
        apollo_id: c.apollo_id || null,
        notes: c.notes || null,
        campaign_category,
        status: start_immediately ? "active" : "paused",
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
        skipped_role_based: roleBasedHits.length,
        skipped_suppressed: (suppressedRows || []).length,
        skipped_total: skipped.length,
        skipped,
        insert_errors: insertErrors.length ? insertErrors : undefined,
        status: start_immediately ? "active" : "paused",
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
