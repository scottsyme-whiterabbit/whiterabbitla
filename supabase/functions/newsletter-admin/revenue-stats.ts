// Pure revenue / pipeline computation for get_revenue_stats. All amounts are
// cents. Dates are compared as Los Angeles calendar dates (YYYY-MM-DD strings).

export type StatsDeal = {
  id: string;
  contact_name: string | null;
  stage: string;
  event_date: string | null;
  deal_value: number | null;
  source: string | null;
};
export type StatsInvoice = {
  deal_id: string | null;
  status: string | null;
  amount_paid_cents: number | null;
  refunded_cents?: number | null;
};
export type StatsAgreement = { deal_id: string | null };

export type RevenueFlag = { id: string; contact_name: string | null; stage: string; event_date: string | null; reason: string };

const INACTIVE = new Set(["void", "canceled", "cancelled"]);
const OPEN_STAGES = new Set(["new", "contacted", "proposal_sent", "negotiating"]);
const STAGES = ["new", "contacted", "proposal_sent", "negotiating", "on_hold", "booked", "completed", "lost"];

export function todayLA(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export const netPaid = (inv: StatsInvoice) =>
  Math.max(0, (inv.amount_paid_cents || 0) - (inv.refunded_cents || 0));

/** Legacy client history: Square imports with no real value. */
export const isSquareHistory = (d: StatsDeal) =>
  d.source === "Square Import" && !(d.deal_value && d.deal_value > 0);

export function computeRevenueStats(
  deals: StatsDeal[],
  invoices: StatsInvoice[],
  agreements: StatsAgreement[],
  now: Date = new Date(),
) {
  const today = todayLA(now);
  const year = Number(today.slice(0, 4));
  const inYear = (d: string | null) => !!d && d.slice(0, 4) === String(year);

  const byDeal = new Map<string, { any: boolean; paid: number }>();
  for (const inv of invoices) {
    if (!inv.deal_id || INACTIVE.has(String(inv.status || ""))) continue;
    const row = byDeal.get(inv.deal_id) || { any: false, paid: 0 };
    row.any = true;
    row.paid += netPaid(inv);
    byDeal.set(inv.deal_id, row);
  }
  const signed = new Set(agreements.map((a) => a.deal_id).filter(Boolean) as string[]);

  const squareHistoryCount = deals.filter(isSquareHistory).length;
  const counted = deals.filter((d) => !isSquareHistory(d));

  const monthly = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, delivered: 0, booked: 0, paid: 0 }));
  let delivered = 0, deliveredCount = 0;
  let bookedAheadThisYear = 0, bookedAheadAll = 0, bookedAheadPaid = 0, bookedAheadCount = 0;
  const flags: RevenueFlag[] = [];
  const stageCounts: Record<string, number> = Object.fromEntries(STAGES.map((s) => [s, 0]));
  const stageValues: Record<string, number> = Object.fromEntries(STAGES.map((s) => [s, 0]));

  for (const d of counted) {
    stageCounts[d.stage] = (stageCounts[d.stage] || 0) + 1;
    stageValues[d.stage] = (stageValues[d.stage] || 0) + (d.deal_value || 0);
    const inv = byDeal.get(d.id);
    const paid = inv?.paid || 0;
    const month = d.event_date && inYear(d.event_date) ? Number(d.event_date.slice(5, 7)) : null;

    if (d.stage === "completed" && inYear(d.event_date)) {
      const amount = inv?.any ? paid : (d.deal_value || 0);
      delivered += amount;
      deliveredCount++;
      if (month) { monthly[month - 1].delivered += amount; monthly[month - 1].paid += paid; }
    }
    if (d.stage === "booked" && d.event_date && d.event_date >= today) {
      const value = d.deal_value || 0;
      bookedAheadAll += value;
      bookedAheadPaid += paid;
      bookedAheadCount++;
      if (inYear(d.event_date)) bookedAheadThisYear += value;
      if (month) { monthly[month - 1].booked += value; monthly[month - 1].paid += paid; }
    }

    const past = !!d.event_date && d.event_date < today;
    const flag = (reason: string) => flags.push({ id: d.id, contact_name: d.contact_name, stage: d.stage, event_date: d.event_date, reason });
    if (OPEN_STAGES.has(d.stage) && past && paid <= 0) flag("event_passed_open");
    if (d.stage === "on_hold" && past) flag("on_hold_past");
    if (d.stage === "booked" && past) flag("booked_past");
    if (!["booked", "completed", "lost"].includes(d.stage) && (signed.has(d.id) || paid > 0)) flag("paid_not_booked");
  }

  const won = (stageCounts.booked || 0) + (stageCounts.completed || 0);
  return {
    year,
    today,
    delivered: { cents: delivered, count: deliveredCount },
    bookedAhead: {
      cents: bookedAheadThisYear,
      allYearsCents: bookedAheadAll,
      paidCents: bookedAheadPaid,
      remainingCents: Math.max(0, bookedAheadAll - bookedAheadPaid),
      count: bookedAheadCount,
    },
    totalThisYear: delivered + bookedAheadThisYear,
    monthly,
    flags,
    stageCounts,
    stageValues,
    conversionRate: counted.length ? won / counted.length : 0,
    countedDeals: counted.length,
    squareHistoryCount,
  };
}

/** Open deals with a signed agreement or money received: safe to move to booked. */
export function dealsToAutoBook(deals: StatsDeal[], invoices: StatsInvoice[], agreements: StatsAgreement[]): string[] {
  const paid = new Map<string, number>();
  for (const inv of invoices) {
    if (!inv.deal_id || INACTIVE.has(String(inv.status || ""))) continue;
    paid.set(inv.deal_id, (paid.get(inv.deal_id) || 0) + netPaid(inv));
  }
  const signed = new Set(agreements.map((a) => a.deal_id).filter(Boolean) as string[]);
  return deals
    .filter((d) => OPEN_STAGES.has(d.stage) && (signed.has(d.id) || (paid.get(d.id) || 0) > 0))
    .map((d) => d.id);
}
