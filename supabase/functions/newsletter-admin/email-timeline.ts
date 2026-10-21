// Admin email timeline and schedule. Read only: never sends, never writes.
import { parseEventDate } from "../_shared/event-date.ts";
import {
  markDuplicates, simulateInvoice, simulatePostShow, simulateProposal, type UpcomingEmail,
} from "../_shared/email-schedule.ts";

const lower = (s: unknown) => String(s ?? "").trim().toLowerCase();

/** Same end-of-Pacific-day rule proposal-followup uses for its past-event skip. */
const proposalEventEnd = (raw: string | null) => {
  const d = parseEventDate(raw);
  return d ? Date.UTC(d.year, d.month - 1, d.day + 1, 8) : null;
};

async function blockedSet(supabase: any, emails: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const list = [...new Set(emails.filter(Boolean))];
  if (!list.length) return out;
  const [sup, unsub, bounce] = await Promise.all([
    supabase.from("email_suppression_list").select("email").in("email", list),
    supabase.from("email_unsubscribes").select("email").in("email", list),
    supabase.from("email_bounces").select("email").in("email", list).in("bounce_type", ["hard_bounce", "complained"]),
  ]);
  for (const r of bounce.data || []) out.set(lower(r.email), "hard_bounced");
  for (const r of unsub.data || []) out.set(lower(r.email), "unsubscribed");
  for (const r of sup.data || []) out.set(lower(r.email), "suppressed");
  return out;
}

export type ScheduledEmail = UpcomingEmail & { deal_id: string | null; contact_name: string | null; blocked_reason?: string | null };

/** Upcoming client emails, replayed with the cron jobs' own rules. */
export async function upcomingEmails(supabase: any, opts: { dealId?: string; horizonDays?: number; now?: number }): Promise<ScheduledEmail[]> {
  const now = opts.now ?? Date.now();
  const horizon = opts.horizonDays ?? 30;

  let dealsQ = supabase.from("deals").select("id, contact_name, contact_email, stage, event_date, post_show_step, post_show_started_at, post_show_last_sent_at");
  dealsQ = opts.dealId ? dealsQ.eq("id", opts.dealId) : dealsQ.in("stage", ["booked", "completed", "proposal_sent", "negotiating", "contacted", "new", "on_hold"]);
  const { data: deals } = await dealsQ.limit(5000);
  const dealList = (deals || []) as any[];
  const byEmail = new Map<string, any>();
  for (const d of dealList) if (d.contact_email) byEmail.set(lower(d.contact_email), d);

  let invQ = supabase.from("event_invoices").select("*").in("status", ["open", "deposit_paid", "paid"]);
  let propQ = supabase.from("proposals")
    .select("id, deal_id, recipient_email, event_date, sent_at, followup_step, last_followup_at, followup_paused, hold_until")
    .not("sent_at", "is", null).not("recipient_email", "is", null).lt("followup_step", 3).eq("followup_paused", false);
  if (opts.dealId) {
    const email = lower(dealList[0]?.contact_email);
    invQ = invQ.or(`deal_id.eq.${opts.dealId}${email ? `,client_email.ilike.${email}` : ""}`);
    propQ = propQ.or(`deal_id.eq.${opts.dealId}${email ? `,recipient_email.ilike.${email}` : ""}`);
  }
  const [{ data: invoices }, { data: proposals }] = await Promise.all([invQ.limit(500), propQ.limit(500)]);
  const props = (proposals || []) as any[];
  const { data: signed } = props.length
    ? await supabase.from("signed_agreements").select("proposal_id").in("proposal_id", props.map((p) => p.id))
    : { data: [] };
  const signedIds = new Set((signed || []).map((s: any) => s.proposal_id));

  const items: UpcomingEmail[] = [];
  for (const inv of (invoices || []) as any[]) items.push(...simulateInvoice(inv, now, horizon));
  for (const p of props) {
    if (signedIds.has(p.id)) continue;
    items.push(...simulateProposal({ ...p, event_end_ms: proposalEventEnd(p.event_date) }, now, horizon));
  }
  for (const d of dealList) items.push(...simulatePostShow(d, now, horizon));

  const blocked = await blockedSet(supabase, items.map((i) => i.recipient));
  const invDeal = new Map(((invoices || []) as any[]).map((i) => [i.id, i.deal_id]));
  const propDeal = new Map(props.map((p) => [p.id, p.deal_id]));
  return items
    .map((i) => {
      const linked = i.source === "invoice" ? invDeal.get(i.source_id) : i.source === "proposal" ? propDeal.get(i.source_id) : i.source_id;
      const deal = (linked && dealList.find((d) => d.id === linked)) || byEmail.get(i.recipient) || null;
      return { ...i, deal_id: deal?.id ?? linked ?? null, contact_name: deal?.contact_name ?? null, blocked_reason: blocked.get(i.recipient) ?? null };
    })
    .filter((i) => !opts.dealId || i.deal_id === opts.dealId || lower(dealList[0]?.contact_email) === i.recipient)
    .sort((a, b) => a.planned_at.localeCompare(b.planned_at));
}

/** Sent log for one deal, matched by deal id or the deal's contact email. */
export async function sentEmails(supabase: any, dealId: string) {
  const { data: deal } = await supabase.from("deals").select("contact_email").eq("id", dealId).maybeSingle();
  const email = lower(deal?.contact_email);
  const q = supabase.from("email_log").select("*").order("sent_at", { ascending: false }).limit(500);
  const { data } = email ? await q.or(`deal_id.eq.${dealId},recipient.eq.${email}`) : await q.eq("deal_id", dealId);
  const rows = (data || []) as any[];
  const { data: bounces } = email
    ? await supabase.from("email_bounces").select("bounce_type, created_at").ilike("email", email)
    : { data: [] };
  const withStatus = rows.map((r) => {
    if (r.delivery_status || r.status !== "sent") return r;
    // Bounce recorded for this address within two days after the send.
    const t = new Date(r.sent_at).getTime();
    const b = (bounces || []).find((x: any) => { const bt = new Date(x.created_at).getTime(); return bt >= t && bt - t < 2 * 864e5; });
    return b ? { ...r, delivery_status: b.bounce_type === "complained" ? "complained" : "bounced" } : r;
  });
  return markDuplicates(withStatus).sort((a, b) => b.sent_at.localeCompare(a.sent_at));
}
