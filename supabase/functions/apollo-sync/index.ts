import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// apollo-sync
// Pulls the newest Apollo contacts (one page, no pagination) and inserts net-new
// leads into cold_email_campaigns as paused / step 0 / started_at NULL.
// This function NEVER sends email, never calls Resend, and never updates or
// deletes an existing row. Insert only.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret, x-import-token",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Priority ordered: first match wins.
const LABEL_MAP: { category: string; labels: string[] }[] = [
  { category: "restaurant", labels: ["69c700c0db0f4c001934501a"] },
  { category: "spirits", labels: ["69b1dcd0bb189d00199258df", "69c6ffa0db0f4c0019344f53"] },
  {
    category: "talent",
    labels: ["69bac07310963200119a0195", "69d670586ea51e00157909ff", "69c4a62a4d8154000d95ae69"],
  },
  {
    category: "pr_agency",
    labels: ["69bac06f109632000db4ada9", "69d670014631e2000d28e812", "69c4a6191d13430018c0361b"],
  },
  { category: "nonprofit", labels: ["69bac0741096320019ed87e5", "69d670276ea51e00157909d2"] },
  { category: "country_club", labels: ["69c12e0503e1420015489ea4", "69ca92c946e5dc000dfe7627"] },
  {
    category: "wedding_planner",
    labels: [
      "69c12df86b8c06000d9b52d9",
      "69ca92c6ce52420015dd194e",
      "69b34a554b2cbe0019922d9e",
      "69dfaaa95ef01f0019e0ff27",
    ],
  },
  { category: "corporate_planner", labels: ["69b98e15e97baf001973ad4d", "69ca9292035c670011a33a96"] },
];

const ROLE_PREFIXES = new Set([
  "info", "hello", "contact", "events", "event", "admin", "support", "sales", "team",
  "office", "help", "marketing", "no-reply", "noreply", "booking", "bookings",
  "reservations", "press", "media", "careers", "jobs", "general", "inquiries", "enquiries",
]);

const BAD_DOMAINS = new Set([
  "example.com", "example.org", "example.net", "test.com", "localhost", "domain.com",
  "email.com", "company.com", "yourcompany.com", "mycompany.com", "acme.com",
]);

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

function categoryFor(labelIds: unknown): string | null {
  const ids: string[] = Array.isArray(labelIds) ? labelIds.filter((x) => typeof x === "string") : [];
  if (!ids.length) return null;
  for (const entry of LABEL_MAP) {
    if (entry.labels.some((l) => ids.includes(l))) return entry.category;
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // ---- Auth: x-cron-secret, Authorization: Bearer <CRON_SECRET>, or x-import-token ----
  const accepted = [
      Deno.env.get("CRON_SECRET"),
      Deno.env.get("CRON_SECRET_V2"),
      Deno.env.get("EXTERNAL_IMPORT_TOKEN"),
    ].filter((s) => s.length > 0);

    const presented = [
      req.headers.get("x-cron-secret") ?? "",
      req.headers.get("x-import-token"),
      (req.headers.get("authorization") ?? "").replace(/^Bearer\\s+/i, ""),
    ].filter((p) => p.length > 0);

    const authorized = presented.some((p) => accepted.includes(p));

    if (!authorized) {
      return json({ error: "Unauthorized" }, 401);
    }
  const apolloKey = Deno.env.get("APOLLO_API_KEY");
  if (!apolloKey) return json({ error: "APOLLO_API_KEY is not configured" }, 500);

  const today = new Date().toISOString().slice(0, 10);
  const errors: string[] = [];

  try {
    // ---- STEP 1: fetch one page from Apollo contact search (no credit cost, never paginate) ----
    const apolloRes = await fetch("https://api.apollo.io/api/v1/contacts/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": apolloKey,
      },
      body: JSON.stringify({
        per_page: 50,
        page: 1,
        sort_by_field: "contact_created_at",
        sort_ascending: false,
      }),
    });

    if (!apolloRes.ok) {
      const text = await apolloRes.text();
      console.error(`apollo-sync: Apollo request failed [${apolloRes.status}]: ${text}`);
      return json({ error: "Apollo request failed", status: apolloRes.status, details: text }, 502);
    }

    const apolloJson = await apolloRes.json();
    const contacts: any[] = Array.isArray(apolloJson?.contacts) ? apolloJson.contacts : [];
    const fetched = contacts.length;

    // ---- STEP 2-4: map, filter, dedupe within batch ----
    let unmapped = 0;
    const filtered = {
      missing_email: 0,
      bracket: 0,
      syntax: 0,
      role_based: 0,
      bad_domain: 0,
    };
    let batchDuplicates = 0;

    const perCategory: Record<
      string,
      {
        apollo_fetched: number;
        bracket: number;
        syntax: number;
        bad_domain: number;
        role_based: number;
        missing_email: number;
        posted: number;
        inserted: number;
      }
    > = {};
    const bump = (cat: string) => {
      if (!perCategory[cat]) {
        perCategory[cat] = {
          apollo_fetched: 0, bracket: 0, syntax: 0, bad_domain: 0,
          role_based: 0, missing_email: 0, posted: 0, inserted: 0,
        };
      }
      return perCategory[cat];
    };

    const seen = new Set<string>();
    const candidates: Record<string, any>[] = [];

    for (const c of contacts) {
      const category = categoryFor(c?.label_ids);
      if (!category) {
        unmapped++;
        continue;
      }
      const stats = bump(category);
      stats.apollo_fetched++;

      const email = typeof c?.email === "string" ? c.email.trim().toLowerCase() : "";
      if (!email) {
        filtered.missing_email++;
        stats.missing_email++;
        continue;
      }
      if (/[<>\[\]]/.test(email)) {
        filtered.bracket++;
        stats.bracket++;
        continue;
      }
      if (!EMAIL_RE.test(email)) {
        filtered.syntax++;
        stats.syntax++;
        continue;
      }
      const [localPart, domain] = email.split("@");
      if (ROLE_PREFIXES.has(localPart)) {
        filtered.role_based++;
        stats.role_based++;
        continue;
      }
      if (BAD_DOMAINS.has(domain)) {
        filtered.bad_domain++;
        stats.bad_domain++;
        continue;
      }
      if (seen.has(email)) {
        batchDuplicates++;
        continue;
      }
      seen.add(email);

      const first_name = c?.first_name ?? null;
      const last_name = c?.last_name ?? null;
      candidates.push({
        email,
        first_name,
        last_name,
        name: c?.name ?? [first_name, last_name].filter(Boolean).join(" ") ?? null,
        title: c?.title ?? null,
        company: c?.organization_name ?? null,
        city: c?.city ?? null,
        state: c?.state ?? null,
        linkedin_url: c?.linkedin_url ?? null,
        // person_id, NOT contact.id — contact.id does not dedupe against existing rows.
        apollo_id: c?.person_id ?? null,
        email_status: c?.email_status ?? null,
        campaign_category: category,
        status: "paused",
        current_step: 0,
        started_at: null,
        notes: `apollo-sync ${today}`,
      });
      stats.posted++;
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ---- STEP 5: dedupe against existing rows + suppression list ----
    let toInsert = candidates;
    if (candidates.length) {
      const emails = candidates.map((c) => c.email);
      const apolloIds = candidates.map((c) => c.apollo_id).filter(Boolean) as string[];

      const [existingEmailRes, existingApolloRes, suppressedRes] = await Promise.all([
        supabase.from("cold_email_campaigns").select("email").in("email", emails),
        apolloIds.length
          ? supabase.from("cold_email_campaigns").select("apollo_id").in("apollo_id", apolloIds)
          : Promise.resolve({ data: [], error: null } as any),
        supabase.from("email_suppression_list").select("email").in("email", emails),
      ]);

      if (existingEmailRes.error) errors.push(`email lookup: ${existingEmailRes.error.message}`);
      if (existingApolloRes.error) errors.push(`apollo_id lookup: ${existingApolloRes.error.message}`);
      if (suppressedRes.error) errors.push(`suppression lookup: ${suppressedRes.error.message}`);

      const knownEmails = new Set(
        (existingEmailRes.data || []).map((r: any) => String(r.email).toLowerCase())
      );
      const knownApollo = new Set(
        (existingApolloRes.data || []).map((r: any) => r.apollo_id).filter(Boolean)
      );
      const suppressed = new Set(
        (suppressedRes.data || []).map((r: any) => String(r.email).toLowerCase())
      );

      toInsert = candidates.filter((c) => {
        if (knownEmails.has(c.email)) return false;
        if (c.apollo_id && knownApollo.has(c.apollo_id)) return false;
        if (suppressed.has(c.email)) return false;
        return true;
      });
    }

    const duplicates = batchDuplicates + (candidates.length - toInsert.length);

    let insertedRows: any[] = [];
    if (toInsert.length) {
      const { data, error } = await supabase
        .from("cold_email_campaigns")
        .upsert(toInsert, { onConflict: "email", ignoreDuplicates: true })
        .select("id, email, campaign_category");
      if (error) {
        errors.push(`insert: ${error.message}`);
        console.error("apollo-sync insert error:", error.message);
      } else {
        insertedRows = data || [];
      }
    }

    const inserted = insertedRows.length;
    const by_category: Record<string, number> = {};
    for (const row of insertedRows) {
      const cat = row.campaign_category as string;
      by_category[cat] = (by_category[cat] || 0) + 1;
      bump(cat).inserted++;
    }

    // ---- STEP 6: batch log, one row per category touched ----
    const logRows = Object.entries(perCategory).map(([category, s]) => ({
      run_date: today,
      category,
      page_pulled: 1,
      apollo_fetched: s.apollo_fetched,
      mx_rejected: 0,
      bracket_rejected: s.bracket,
      syntax_rejected: s.syntax,
      bad_domain_rejected: s.bad_domain,
      role_based_dropped: s.role_based,
      free_email_flagged: 0,
      posted: s.posted,
      inserted: s.inserted,
      updated: 0,
      skipped_invalid_category: unmapped,
      skipped_missing_email: s.missing_email,
      http_status: 200,
      batch_id: `${today}-${category}-apollosync`,
    }));

    if (logRows.length) {
      const { error: logErr } = await supabase.from("apollo_batch_log").insert(logRows);
      if (logErr) errors.push(`batch_log: ${logErr.message}`);
    }

    const summary = { fetched, unmapped, filtered, duplicates, inserted, by_category, errors };
    console.log("apollo-sync summary:", JSON.stringify(summary));
    return json(summary, 200);
  } catch (e: any) {
    console.error("apollo-sync error:", e?.message ?? String(e));
    return json({ error: e?.message ?? "Unknown error", errors }, 500);
  }
});
