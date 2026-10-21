import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { handleRefundOrDispute } from "../../supabase/functions/payments-webhook/refund-dispute";
import { computeRevenueStats } from "../../supabase/functions/newsletter-admin/revenue-stats";
import { invoiceMoneyFlags } from "@/lib/invoiceMoneyFlag";

function fakeDb(invoice: any) {
  const events = new Set<string>(); const activity: any[] = []; const inv = { ...invoice };
  const db = { from: (t: string) => {
    const q: any = { _f: {} as any };
    q.select = () => q; q.eq = (k: string, v: any) => { q._f[k] = v; return q; };
    q.maybeSingle = async () => ({ data: Object.entries(q._f).every(([k, v]) => inv[k] === v) ? { ...inv } : null });
    q.insert = async (row: any) => {
      if (t === "stripe_webhook_events") { if (events.has(row.event_id)) return { error: { code: "23505", message: "dup" } }; events.add(row.event_id); }
      if (t === "deal_activity") activity.push(row);
      return { error: null };
    };
    q.update = (patch: any) => ({ eq: async () => { if (t === "event_invoices") Object.assign(inv, patch); return { error: null }; } });
    q.delete = () => ({ eq: async (_k: string, v: string) => { events.delete(v); return { error: null }; } });
    return q;
  } };
  return { db, inv, activity };
}
const base = { id: "inv1", deal_id: "deal1", status: "paid", amount_paid_cents: 300000, stripe_payment_intent_id: "pi_1" };
const charge = (refunded: number, full: boolean) => ({ object: "charge", id: "ch_1", payment_intent: "pi_1", amount: 300000, amount_refunded: refunded, refunded: full, refunds: { data: [{ created: 1793000000 }] } });
const noFetch = async () => { throw new Error("no Stripe call expected"); };

describe("Stripe refund and dispute sync", () => {
  it("full refund sets absolute refunded cents, status, timestamp and one activity", async () => {
    const f = fakeDb(base);
    await handleRefundOrDispute(f.db, { id: "evt_1", type: "charge.refunded", data: { object: charge(300000, true) } }, noFetch);
    expect(f.inv).toMatchObject({ refunded_cents: 300000, status: "refunded", refunded_at: new Date(1793000000 * 1000).toISOString() });
    expect(f.activity).toHaveLength(1);
  });
  it("partial refund is absolute, not incremented, across two events", async () => {
    const f = fakeDb(base);
    await handleRefundOrDispute(f.db, { id: "evt_a", type: "charge.refunded", data: { object: charge(50000, false) } }, noFetch);
    await handleRefundOrDispute(f.db, { id: "evt_b", type: "charge.refunded", data: { object: charge(80000, false) } }, noFetch);
    expect(f.inv).toMatchObject({ refunded_cents: 80000, status: "partially_refunded" });
  });
  it("same event twice is a no-op", async () => {
    const f = fakeDb(base);
    const e = { id: "evt_x", type: "charge.refunded", data: { object: charge(50000, false) } };
    await handleRefundOrDispute(f.db, e, noFetch);
    expect((await handleRefundOrDispute(f.db, e, noFetch)).result).toBe("duplicate");
    expect(f.activity).toHaveLength(1);
  });
  it("dispute created then lost, and won", async () => {
    const f = fakeDb(base);
    const d = (status: string, id: string) => ({ id, type: "charge.dispute.closed", data: { object: { id: "dp_1", payment_intent: "pi_1", amount: 300000, status, created: 1793000000 } } });
    await handleRefundOrDispute(f.db, { ...d("needs_response", "e1"), type: "charge.dispute.created" }, noFetch);
    expect(f.inv.dispute_status).toBe("disputed");
    await handleRefundOrDispute(f.db, d("lost", "e2"), noFetch);
    expect(f.inv).toMatchObject({ dispute_status: "dispute_lost", dispute_amount_cents: 300000, dispute_id: "dp_1" });
    const g = fakeDb(base);
    await handleRefundOrDispute(g.db, d("won", "e3"), noFetch);
    expect(g.inv.dispute_status).toBe("dispute_won");
  });
  it("revenue subtracts refunds and lost disputes but not won disputes", () => {
    const deal = { id: "d", contact_name: "C", stage: "completed", event_date: "2026-05-01", deal_value: 300000, source: null };
    const now = new Date("2026-10-21T18:00:00Z");
    const s = (inv: any) => computeRevenueStats([deal], [{ deal_id: "d", status: "paid", amount_paid_cents: 300000, ...inv }], [], now).delivered.cents;
    expect(s({ refunded_cents: 100000 })).toBe(200000);
    expect(s({ dispute_status: "dispute_lost", dispute_amount_cents: 300000 })).toBe(0);
    expect(s({ dispute_status: "dispute_won", dispute_amount_cents: 300000 })).toBe(300000);
  });
  it("badges", () => {
    expect(invoiceMoneyFlags({ status: "refunded", refunded_cents: 300000 })).toEqual(["Refunded $3,000"]);
    expect(invoiceMoneyFlags({ status: "partially_refunded", refunded_cents: 5000, dispute_status: "dispute_lost" })).toEqual(["Partially refunded $50", "Dispute lost"]);
  });
  it("never writes to Stripe or sends email", () => {
    const src = readFileSync("supabase/functions/payments-webhook/refund-dispute.ts", "utf8");
    const idx = readFileSync("supabase/functions/payments-webhook/index.ts", "utf8");
    expect(src).not.toMatch(/sendEmail|fetch\(|createStripeClient|\.refunds\.create/);
    const reader = idx.slice(idx.indexOf("async function readCharge"), idx.indexOf("Deno.serve("));
    expect(reader).toContain('method: "GET"');
    expect(reader).not.toMatch(/POST|sendEmail/);
  });
});
