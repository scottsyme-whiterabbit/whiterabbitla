// CRM actions for the Find the Lady tab: the list of pop-up claims with 30 day
// counts, free alternate drawing entries, "Move to pipeline", and the random
// quarterly drawing. Claims never become pipeline deals unless Scott moves them.
import {
  QUEEN_SOURCE, drawingPool, drawingQuarter, pickWinner, pipelineDealFromClaim,
} from "../_shared/find-the-lady.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

export const LADY_ACTIONS = new Set(["lady_list", "lady_move_to_pipeline", "lady_add_alt_entry", "lady_pick_winner"]);

const COUNTED_EVENTS = ["view", "play", "found", "answered", "reserve_click"] as const;
const QUARTER_RE = /^(\d{4}) Q([1-4])$/;
const EMAIL_RE = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[a-z]{2,}$/i;

/** True once the quarter's last day has passed in Los Angeles. */
export function quarterHasEnded(quarter: string, now: Date): boolean {
  const m = quarter.match(QUARTER_RE);
  if (!m) return false;
  const [cy, cq] = drawingQuarter(now).match(QUARTER_RE)!.slice(1).map(Number);
  const y = Number(m[1]), q = Number(m[2]);
  return y < cy || (y === cy && q < cq);
}

/** The quarter a YYYY-MM-DD day falls in. */
export function quarterOfDay(day: string): string | null {
  const m = day.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return `${m[1]} Q${Math.floor((month - 1) / 3) + 1}`;
}

// deno-lint-ignore no-explicit-any
export async function handleLadyAction(action: string, payload: Record<string, any>, supabase: any): Promise<Response> {
  const now = new Date();

  if (action === "lady_list") {
    const since = new Date(now.getTime() - 30 * 864e5).toISOString();
    const [claimsRes, altRes, drawRes, claimCount, ...eventCounts] = await Promise.all([
      supabase.from("find_the_lady_credits")
        .select("id, code, email, first_name, event_type, event_timing, found_queen, marketing_opt_in, expires_on, status, redeemed_at, drawing_entry, drawing_quarter, welcome_email_status, deal_id, inquiry_id, inquiry_linked_at, moved_to_pipeline_at, source, created_at")
        .order("created_at", { ascending: false }).limit(2000),
      supabase.from("find_the_queen_alt_entries").select("id, quarter, first_name, email, received_on, note, created_at").order("created_at", { ascending: false }).limit(1000),
      supabase.from("find_the_queen_drawings").select("*").order("quarter", { ascending: false }),
      supabase.from("find_the_lady_credits").select("id", { count: "exact", head: true }).eq("source", QUEEN_SOURCE).gte("created_at", since),
      ...COUNTED_EVENTS.map((e) => supabase.from("find_the_queen_events").select("id", { count: "exact", head: true }).eq("event", e).gte("created_at", since)),
    ]);
    const err = claimsRes.error || altRes.error || drawRes.error || claimCount.error || eventCounts.find((r: { error: unknown }) => r.error)?.error;
    if (err) throw new Error(err.message);
    const counts: Record<string, number> = { claimed: claimCount.count || 0 };
    COUNTED_EVENTS.forEach((e, i) => { counts[e] = eventCounts[i].count || 0; });
    return json({
      claims: claimsRes.data || [],
      alternates: altRes.data || [],
      drawings: drawRes.data || [],
      counts,
      currentQuarter: drawingQuarter(now),
    });
  }

  if (action === "lady_move_to_pipeline") {
    const creditId = String(payload.creditId || "");
    const { data: credit, error } = await supabase.from("find_the_lady_credits")
      .select("id, email, first_name, code, expires_on, event_type, event_timing, found_queen, deal_id").eq("id", creditId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!credit) return json({ error: "Claim not found" }, 404);
    if (credit.deal_id) {
      const { data: existing } = await supabase.from("deals").select("id").eq("id", credit.deal_id).maybeSingle();
      if (existing) return json({ ok: true, dealId: existing.id, existing: true });
    }
    // Claim the move on the row first, so two clicks can never make two deals.
    const { data: claimed, error: claimErr } = await supabase.from("find_the_lady_credits")
      .update({ moved_to_pipeline_at: now.toISOString() }).eq("id", creditId).is("moved_to_pipeline_at", null).select("id");
    if (claimErr) throw new Error(claimErr.message);
    if (!claimed || claimed.length !== 1) return json({ error: "This claim is already being moved. Refresh in a moment." }, 409);
    try {
      const like = String(credit.email).replace(/[\\%_]/g, (c: string) => `\\${c}`);
      const { data: open } = await supabase.from("deals").select("id")
        .ilike("contact_email", like).not("stage", "in", "(lost,completed)")
        .order("updated_at", { ascending: false }).limit(1).maybeSingle();
      let dealId = open?.id as string | undefined;
      const row = pipelineDealFromClaim(credit);
      if (!dealId) {
        const { data: deal, error: dealErr } = await supabase.from("deals").insert(row).select("id").single();
        if (dealErr || !deal) throw new Error(dealErr?.message || "deal insert failed");
        dealId = deal.id;
      }
      const { error: linkErr } = await supabase.from("find_the_lady_credits").update({ deal_id: dealId }).eq("id", creditId);
      if (linkErr) throw new Error(linkErr.message);
      await supabase.from("deal_activity").insert({
        deal_id: dealId, type: "find_the_lady", title: `Find the Lady code ${credit.code}`, body: row.notes,
        metadata: { code: credit.code, credit_id: creditId, existing_deal: Boolean(open) },
      });
      return json({ ok: true, dealId, existing: Boolean(open) });
    } catch (e) {
      await supabase.from("find_the_lady_credits").update({ moved_to_pipeline_at: null }).eq("id", creditId).is("deal_id", null);
      throw e;
    }
  }

  if (action === "lady_add_alt_entry") {
    const firstName = String(payload.firstName || "").trim().replace(/\s+/g, " ").slice(0, 60);
    const email = String(payload.email || "").trim().toLowerCase();
    const receivedOn = String(payload.receivedOn || "");
    const note = String(payload.note || "").trim().slice(0, 300) || null;
    const quarter = quarterOfDay(receivedOn);
    if (!firstName) return json({ error: "Add the first name." }, 400);
    if (!EMAIL_RE.test(email) || email.length > 255) return json({ error: "Check the email address." }, 400);
    if (!quarter) return json({ error: "Add the day the entry email arrived." }, 400);
    const { data: drawn } = await supabase.from("find_the_queen_drawings").select("id").eq("quarter", quarter).maybeSingle();
    if (drawn) return json({ error: `The ${quarter} winner has already been picked.` }, 409);
    const { data, error } = await supabase.from("find_the_queen_alt_entries")
      .insert({ quarter, first_name: firstName, email, received_on: receivedOn, note }).select("*").single();
    if (error?.code === "23505") return json({ error: `${email} is already entered for ${quarter}.` }, 409);
    if (error) throw new Error(error.message);
    return json({ ok: true, entry: data });
  }

  if (action === "lady_pick_winner") {
    const quarter = String(payload.quarter || "");
    if (!QUARTER_RE.test(quarter)) return json({ error: "Choose a quarter." }, 400);
    if (!quarterHasEnded(quarter, now)) return json({ error: `The ${quarter} drawing opens once the quarter ends.` }, 400);
    const { data: drawn } = await supabase.from("find_the_queen_drawings").select("*").eq("quarter", quarter).maybeSingle();
    if (drawn) return json({ ok: true, drawing: drawn, existing: true });
    const [claimsRes, altRes] = await Promise.all([
      supabase.from("find_the_lady_credits").select("id, first_name, email, drawing_entry, drawing_quarter, status").eq("drawing_quarter", quarter).eq("drawing_entry", true),
      supabase.from("find_the_queen_alt_entries").select("id, first_name, email, quarter").eq("quarter", quarter),
    ]);
    if (claimsRes.error || altRes.error) throw new Error((claimsRes.error || altRes.error).message);
    const pool = drawingPool(claimsRes.data || [], altRes.data || [], quarter);
    if (pool.length === 0) return json({ error: `No entries for ${quarter}.` }, 400);
    const winner = pickWinner(pool);
    const { data: drawing, error } = await supabase.from("find_the_queen_drawings").insert({
      quarter,
      winner_kind: winner.kind,
      winner_credit_id: winner.kind === "claim" ? winner.id : null,
      winner_alt_entry_id: winner.kind === "alternate" ? winner.id : null,
      winner_name: winner.name,
      winner_email: winner.email,
      entry_count: pool.length,
      picked_by: "crm",
    }).select("*").single();
    if (error?.code === "23505") {
      const { data: raced } = await supabase.from("find_the_queen_drawings").select("*").eq("quarter", quarter).maybeSingle();
      return json({ ok: true, drawing: raced, existing: true });
    }
    if (error) throw new Error(error.message);
    return json({ ok: true, drawing, existing: false });
  }

  return json({ error: "Unknown action" }, 400);
}
