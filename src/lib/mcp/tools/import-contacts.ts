import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

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
  "charity_golf",
  "country_club",
  "pr_agency",
  "nonprofit",
  "talent",
  "restaurant",
  "nightlife",
  "luxury_auto",
  "tech_events",
  "hotel_concierge",
  "casino_entertainment",
] as const;

const ROLE_BASED_PREFIXES = new Set([
  "info", "hello", "contact", "events", "admin", "support", "sales",
  "team", "office", "help", "marketing", "no-reply", "noreply",
]);

const ContactSchema = z.object({
  email: z.string().describe("Email address (required)."),
  name: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  linkedin_url: z.string().optional(),
  apollo_id: z.string().optional(),
  website: z.string().optional(),
  domain: z.string().optional(),
  notes: z.string().optional(),
});

export default defineTool({
  name: "import_contacts",
  title: "Import cold-outreach contacts",
  description:
    "Upload contacts scraped from Apollo (or similar) into a specific drip campaign category. Dedupes by email + apollo_id against existing campaigns, skips role-based addresses (info@, hello@, etc.) and anything on the suppression list. Contacts are inserted PAUSED by default — set start_immediately=true to enroll them in the drip right away. Returns a full breakdown of inserted vs skipped counts.",
  inputSchema: {
    campaign_category: z
      .enum(VALID_CATEGORIES)
      .describe("Which drip campaign these contacts belong to."),
    contacts: z
      .array(ContactSchema)
      .min(1)
      .max(500)
      .describe("Array of contacts (max 500 per call)."),
    start_immediately: z
      .boolean()
      .optional()
      .describe("If true, contacts enroll in the drip immediately. Default false (paused)."),
  },
  annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ campaign_category, contacts, start_immediately }) => {
    const supabase = createClient(
      // @ts-ignore Deno env at runtime
      (globalThis as any).Deno?.env.get("SUPABASE_URL") ?? "",
      // @ts-ignore Deno env at runtime
      (globalThis as any).Deno?.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Normalize + dedupe within payload
    const seen = new Set<string>();
    const cleaned = contacts
      .map((c) => ({ ...c, email: (c.email || "").toLowerCase().trim() }))
      .filter((c) => {
        if (!c.email || !c.email.includes("@")) return false;
        if (seen.has(c.email)) return false;
        seen.add(c.email);
        return true;
      });

    const skipped: { email: string; reason: string }[] = [];

    // Role-based filter + auto-suppress
    const roleBased: { email: string }[] = [];
    const afterRole = cleaned.filter((c) => {
      const local = c.email.split("@")[0];
      if (ROLE_BASED_PREFIXES.has(local)) {
        roleBased.push({ email: c.email });
        skipped.push({ email: c.email, reason: "role_based" });
        return false;
      }
      return true;
    });
    if (roleBased.length) {
      await supabase.from("email_suppression_list").upsert(
        roleBased.map((r) => ({
          email: r.email,
          reason: "role_based",
          source_campaign_category: campaign_category,
          notes: "Auto-rejected via MCP import (role-based local-part)",
        })),
        { onConflict: "email", ignoreDuplicates: true },
      );
    }

    // Suppression list check
    const emails = afterRole.map((c) => c.email);
    const { data: suppressed } = emails.length
      ? await supabase.from("email_suppression_list").select("email, reason").in("email", emails)
      : { data: [] as { email: string; reason: string }[] };
    const suppMap = new Map((suppressed || []).map((r) => [r.email, r.reason]));
    const afterSupp = afterRole.filter((c) => {
      const r = suppMap.get(c.email);
      if (r) { skipped.push({ email: c.email, reason: `suppressed:${r}` }); return false; }
      return true;
    });

    // Dedup against existing campaigns
    const apolloIds = afterSupp.map((c) => c.apollo_id).filter(Boolean) as string[];
    const existingEmails = new Set<string>();
    const existingApollo = new Set<string>();
    if (afterSupp.length) {
      const { data } = await supabase
        .from("cold_email_campaigns")
        .select("email, apollo_id")
        .in("email", afterSupp.map((c) => c.email));
      (data || []).forEach((r: any) => existingEmails.add(r.email));
    }
    if (apolloIds.length) {
      const { data } = await supabase
        .from("cold_email_campaigns")
        .select("apollo_id")
        .in("apollo_id", apolloIds);
      (data || []).forEach((r: any) => r.apollo_id && existingApollo.add(r.apollo_id));
    }

    const toInsert: any[] = [];
    for (const c of afterSupp) {
      if (existingEmails.has(c.email)) {
        skipped.push({ email: c.email, reason: "email_exists" });
        continue;
      }
      if (c.apollo_id && existingApollo.has(c.apollo_id)) {
        skipped.push({ email: c.email, reason: "apollo_id_exists" });
        continue;
      }
      const concatName =
        [c.first_name, c.last_name].filter(Boolean).join(" ").trim() || c.name || null;
      toInsert.push({
        email: c.email,
        name: concatName,
        first_name: c.first_name ?? null,
        last_name: c.last_name ?? null,
        company: c.company ?? null,
        title: c.title ?? null,
        phone: c.phone ?? null,
        city: c.city ?? null,
        state: c.state ?? null,
        linkedin_url: c.linkedin_url ?? null,
        apollo_id: c.apollo_id ?? null,
        website: c.website ?? null,
        domain: c.domain ?? null,
        notes: c.notes ?? null,
        campaign_category,
        status: start_immediately ? "active" : "paused",
        current_step: 0,
        started_at: start_immediately ? new Date().toISOString() : null,
      });
    }

    let inserted = 0;
    const errors: string[] = [];
    for (let i = 0; i < toInsert.length; i += 100) {
      const chunk = toInsert.slice(i, i + 100);
      const { data, error } = await supabase
        .from("cold_email_campaigns")
        .insert(chunk)
        .select("id");
      if (error) errors.push(`Chunk ${i}: ${error.message}`);
      else inserted += data?.length || 0;
    }

    const summary = {
      campaign_category,
      received: contacts.length,
      cleaned: cleaned.length,
      inserted,
      skipped_role_based: roleBased.length,
      skipped_suppressed: (suppressed || []).length,
      skipped_total: skipped.length,
      status: start_immediately ? "active" : "paused",
      errors: errors.length ? errors : undefined,
      skipped_detail: skipped.slice(0, 50),
    };

    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
    };
  },
});
