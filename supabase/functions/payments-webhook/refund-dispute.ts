// Refund and dispute sync from Stripe webhooks into event_invoices.
// READ ONLY toward Stripe: this module never creates, refunds, or updates
// anything in Stripe, and never sends email. It only writes CRM rows.

export type Db = { from: (table: string) => any };
export type FetchCharge = (chargeId: string) => Promise<Record<string, any> | null>;

export const REFUND_EVENTS = ["charge.refunded", "charge.refund.updated", "refund.created", "refund.updated"];
export const DISPUTE_EVENTS = ["charge.dispute.created", "charge.dispute.updated", "charge.dispute.closed"];
export const HANDLED_EVENTS = [...REFUND_EVENTS, ...DISPUTE_EVENTS];

const iso = (sec: unknown) => (typeof sec === "number" && sec > 0 ? new Date(sec * 1000).toISOString() : new Date().toISOString());
const idOf = (v: unknown): string | null => (typeof v === "string" ? v : v && typeof v === "object" && typeof (v as any).id === "string" ? (v as any).id : null);
export const money = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Absolute refund state from a Charge object, so replays never double count. */
export function refundPatch(charge: Record<string, any>, prevStatus: string) {
  const refunded = Math.max(0, Math.abs(Number(charge.amount_refunded || 0)));
  if (refunded === 0) return null;
  const full = charge.refunded === true || refunded >= Number(charge.amount || 0);
  const refunds = (charge.refunds?.data || []) as any[];
  const latest = refunds.reduce((m, r) => Math.max(m, Number(r.created || 0)), 0);
  return {
    refunded_cents: refunded,
    refunded_at: iso(latest || charge.created),
    status: full ? "refunded" : prevStatus === "refunded" ? "refunded" : "partially_refunded",
  };
}

/** Maps a Stripe dispute to the CRM dispute status. */
export function disputeStatus(dispute: Record<string, any>): "disputed" | "dispute_won" | "dispute_lost" {
  if (dispute.status === "won") return "dispute_won";
  if (dispute.status === "lost") return "dispute_lost";
  return "disputed";
}

/** Amount that actually left the account: refunds plus lost disputes. */
export function lostCents(inv: { refunded_cents?: number | null; dispute_status?: string | null; dispute_amount_cents?: number | null }) {
  return (inv.refunded_cents || 0) + (inv.dispute_status === "dispute_lost" ? inv.dispute_amount_cents || 0 : 0);
}

async function findInvoice(db: Db, paymentIntent: string | null, invoiceId: string | null) {
  if (paymentIntent) {
    const { data } = await db.from("event_invoices").select("*").eq("stripe_payment_intent_id", paymentIntent).maybeSingle();
    if (data) return data;
  }
  if (invoiceId) {
    const { data } = await db.from("event_invoices").select("*").eq("id", invoiceId).maybeSingle();
    if (data) return data;
  }
  return null;
}

/**
 * Processes one verified Stripe event. Returns what happened.
 * Idempotent: the event id is claimed in stripe_webhook_events first; a
 * duplicate delivery is a no-op. If processing fails the claim is released
 * so Stripe's retry can succeed.
 */
export async function handleRefundOrDispute(db: Db, event: { id: string; type: string; data: { object: any } }, fetchCharge: FetchCharge) {
  if (!HANDLED_EVENTS.includes(event.type)) return { result: "ignored" as const };

  const claim = await db.from("stripe_webhook_events").insert({ event_id: event.id, event_type: event.type });
  if (claim.error) {
    if (claim.error.code === "23505") return { result: "duplicate" as const };
    throw new Error(`event claim failed: ${claim.error.message}`);
  }

  try {
    const obj = event.data.object || {};
    let invoice: any = null;
    let patch: Record<string, unknown> | null = null;
    let title = "";

    if (REFUND_EVENTS.includes(event.type)) {
      // charge.refunded carries the Charge; refund events carry a Refund, so
      // the Charge is read (GET only) to get the absolute refunded total.
      const charge = obj.object === "charge" ? obj : await fetchCharge(idOf(obj.charge) || "");
      if (!charge) return await finish(db, event.id, null, "no_charge");
      invoice = await findInvoice(db, idOf(charge.payment_intent), charge.metadata?.invoice_id || null);
      if (!invoice) return await finish(db, event.id, null, "no_invoice");
      patch = refundPatch(charge, invoice.status);
      if (!patch) return await finish(db, event.id, invoice.id, "no_refund");
      title = `${patch.status === "refunded" ? "Refunded" : "Partially refunded"} ${money(patch.refunded_cents as number)} in Stripe`;
    } else {
      invoice = await findInvoice(db, idOf(obj.payment_intent), obj.metadata?.invoice_id || null);
      if (!invoice && idOf(obj.charge)) {
        const charge = await fetchCharge(idOf(obj.charge)!);
        if (charge) invoice = await findInvoice(db, idOf(charge.payment_intent), charge.metadata?.invoice_id || null);
      }
      if (!invoice) return await finish(db, event.id, null, "no_invoice");
      const status = disputeStatus(obj);
      const amount = Math.abs(Number(obj.amount || 0));
      patch = { dispute_status: status, dispute_id: obj.id || null, dispute_amount_cents: amount, disputed_at: invoice.disputed_at || iso(obj.created) };
      title = status === "dispute_lost" ? `Dispute lost: ${money(amount)}` : status === "dispute_won" ? `Dispute won: ${money(amount)}` : `Payment disputed: ${money(amount)}`;
    }

    const { error } = await db.from("event_invoices").update(patch).eq("id", invoice.id);
    if (error) throw new Error(`invoice update failed: ${error.message}`);
    await db.from("stripe_webhook_events").update({ invoice_id: invoice.id }).eq("event_id", event.id);
    if (invoice.deal_id) {
      await db.from("deal_activity").insert({
        deal_id: invoice.deal_id,
        type: REFUND_EVENTS.includes(event.type) ? "stripe_refund" : "stripe_dispute",
        title,
        body: `Stripe event ${event.type}. No client email was sent.`,
        metadata: { stripe_event_id: event.id, invoice_id: invoice.id, ...patch },
      });
    }
    return { result: "applied" as const, invoiceId: invoice.id, patch };
  } catch (e) {
    await db.from("stripe_webhook_events").delete().eq("event_id", event.id);
    throw e;
  }
}

async function finish(_db: Db, _eventId: string, invoiceId: string | null, reason: string) {
  console.warn("refund/dispute event not applied:", reason, invoiceId);
  return { result: "skipped" as const, reason };
}
