// Shared send gate. Every outbound email passes through here:
//  - the address must be valid,
//  - it must not be on email_suppression_list, email_unsubscribes, or have a
//    hard bounce / complaint in email_bounces (all case-insensitive),
//  - To and Subject are stripped of CR/LF (header injection),
//  - the provider response is checked: a non-2xx status or an error body is a
//    failure, never reported as sent.
// Blocked or failed sends return { sent: false, reason } and are logged. The
// gate never throws.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import { classifyEmail } from "./email-schedule.ts";
import { ownerAlertOverride } from "./owner-alert.ts";
export { OWNER_INBOXES } from "./owner-alert.ts";

/**
 * Record one send attempt in email_log. Never throws and never delays the
 * caller meaningfully: logging must not block or alter a send.
 */
export async function logEmail(row: {
  to: string; subject: string; label: string; provider?: string;
  status: "sent" | "blocked" | "failed"; reason?: string | null; messageId?: string | null;
  dealId?: string | null; supabase?: any | null;
}): Promise<void> {
  try {
    const db = client(row.supabase);
    if (!db) return;
    const recipient = bareEmail(row.to) || "(none)";
    const providerName = row.provider || (row.label.includes("gmail") ? "gmail" : "resend");
    const { error } = await db.from("email_log").insert({
      recipient,
      subject: row.subject || null,
      email_type: classifyEmail(row.label, row.subject || ""),
      label: row.label,
      provider: providerName,
      status: row.status,
      block_reason: row.reason || null,
      provider_message_id: row.messageId || null,
      deal_id: row.dealId || null,
      source: "live",
      dedupe_key: row.messageId ? `${providerName}:${row.messageId}` : null,
    });
    if (error) console.warn("[send-gate] email_log insert failed", error.message);
  } catch (e) {
    console.warn("[send-gate] email_log insert threw", e);
  }
}

export type GateResult =
  | { sent: true; status: number; data: any }
  | { sent: false; reason: string; status?: number; detail?: string };

const EMAIL_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;

/** Strip CR/LF (and other control characters) from a header value. */
export function cleanHeader(value: unknown): string {
  return String(value ?? "").replace(/[\r\n\u0000-\u001f\u007f]+/g, " ").replace(/\s{2,}/g, " ").trim();
}

/** Bare address from "Name <a@b.com>" or "a@b.com", lowercased. */
export function bareEmail(raw: unknown): string {
  const s = cleanHeader(raw);
  const m = s.match(/<([^>]+)>/);
  return (m ? m[1] : s).trim().toLowerCase();
}

export function validEmail(raw: unknown): boolean {
  const e = bareEmail(raw);
  return e.length > 3 && e.length <= 254 && EMAIL_RE.test(e);
}

let cached: any = null;
function client(supabase?: any | null): any | null {
  if (supabase) return supabase;
  if (cached) return cached;
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  cached = createClient(url, key);
  return cached;
}

/** Why an address must not be emailed, or null when it is clear to send. */
export async function blockReason(rawTo: unknown, supabase?: any | null): Promise<string | null> {
  if (!validEmail(rawTo)) return "invalid_address";
  const email = bareEmail(rawTo);
  const db = client(supabase);
  // Without a database we cannot prove the address is clear: fail closed.
  if (!db) return "gate_unavailable";
  try {
    const [sup, unsub, bounce] = await Promise.all([
      db.from("email_suppression_list").select("id").ilike("email", email).limit(1),
      db.from("email_unsubscribes").select("id").ilike("email", email).limit(1),
      db.from("email_bounces").select("id").ilike("email", email)
        .in("bounce_type", ["hard_bounce", "complained"]).limit(1),
    ]);
    if (sup.error || unsub.error || bounce.error) {
      console.error("[send-gate] lookup failed", sup.error || unsub.error || bounce.error);
      return "gate_unavailable";
    }
    if (sup.data?.length) return "suppressed";
    if (unsub.data?.length) return "unsubscribed";
    if (bounce.data?.length) return "hard_bounced";
    return null;
  } catch (e) {
    console.error("[send-gate] lookup error", e);
    return "gate_unavailable";
  }
}

/** Read a provider response; non-2xx or an error body is a failure. */
export async function readProviderResponse(res: Response): Promise<GateResult> {
  let text = "";
  try { text = await res.text(); } catch { /* empty body */ }
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  if (!res.ok) return { sent: false, reason: "provider_error", status: res.status, detail: text.slice(0, 500) };
  if (data && typeof data === "object" && (data.error || data.ok === false || data.success === false || data.sent === false)) {
    return { sent: false, reason: "provider_error", status: res.status, detail: text.slice(0, 500) };
  }
  return { sent: true, status: res.status, data };
}

/**
 * Gate one send. `send` receives the cleaned recipient and subject and must
 * return the provider's fetch Response.
 */
export async function gatedSend(
  opts: { to: unknown; subject: unknown; label: string; supabase?: any | null; internalAlert?: boolean },
  send: (to: string, subject: string) => Promise<Response>,
): Promise<GateResult> {
  const to = cleanHeader(opts.to);
  const subject = cleanHeader(opts.subject);
  let blocked = await blockReason(to, opts.supabase);
  if (ownerAlertOverride(bareEmail(to), blocked, opts.internalAlert)) {
    console.warn(`[send-gate] ${opts.label}: owner inbox override (${blocked})`);
    blocked = null;
  }
  if (blocked) {
    console.warn(`[send-gate] ${opts.label}: not sent to ${bareEmail(to) || "(none)"} (${blocked})`);
    await logEmail({ to, subject, label: opts.label, status: "blocked", reason: blocked, supabase: opts.supabase });
    return { sent: false, reason: blocked };
  }
  try {
    const result = await readProviderResponse(await send(to, subject));
    if (!result.sent) console.error(`[send-gate] ${opts.label}: provider failure for ${bareEmail(to)}`, result.status, result.detail);
    await logEmail({ to, subject, label: opts.label, status: result.sent ? "sent" : "failed", reason: result.sent ? null : result.reason, messageId: result.sent ? result.data?.id : null, supabase: opts.supabase });
    return result;
  } catch (e) {
    console.error(`[send-gate] ${opts.label}: send threw for ${bareEmail(to)}`, e);
    await logEmail({ to, subject, label: opts.label, status: "failed", reason: "send_exception", supabase: opts.supabase });
    return { sent: false, reason: "send_exception", detail: String(e).slice(0, 500) };
  }
}

/**
 * Drop-in replacement for fetch() to the Resend send endpoint. Reads `to` and
 * `subject` from the JSON body, gates every recipient (blocked ones are
 * removed; if none remain nothing is sent), cleans the headers, and returns a
 * Response whose `ok` reflects whether the email really went out. A blocked
 * or failed send comes back as a non-2xx Response with { sent:false, reason }.
 */
export async function gatedResendFetch(url: string, init: RequestInit & { body: string }, label = "resend"): Promise<Response> {
  let payload: Record<string, unknown>;
  try { payload = JSON.parse(init.body); } catch {
    return new Response(JSON.stringify({ sent: false, reason: "bad_payload" }), { status: 400 });
  }
  const list = (Array.isArray(payload.to) ? payload.to : [payload.to]).map(cleanHeader).filter(Boolean);
  const allowed: string[] = [];
  for (const addr of list) {
    const why = await blockReason(addr);
    if (why) {
      console.warn(`[send-gate] ${label}: dropped ${bareEmail(addr)} (${why})`);
      await logEmail({ to: addr, subject: cleanHeader(payload.subject), label, status: "blocked", reason: why });
    }
    else allowed.push(addr);
  }
  if (!allowed.length) {
    return new Response(JSON.stringify({ sent: false, reason: list.length ? "all_recipients_blocked" : "invalid_address" }), { status: 422 });
  }
  const subject = cleanHeader(payload.subject);
  try {
    const res = await fetch(url, { ...init, body: JSON.stringify({ ...payload, to: allowed, subject }) });
    const result = await readProviderResponse(res);
    for (const addr of allowed) {
      await logEmail({ to: addr, subject, label, status: result.sent ? "sent" : "failed", reason: result.sent ? null : result.reason, messageId: result.sent && allowed.length === 1 ? result.data?.id : null });
    }
    if (!result.sent) {
      console.error(`[send-gate] ${label}: provider failure`, result.status, result.detail);
      return new Response(JSON.stringify({ sent: false, reason: result.reason, error: result.detail }), { status: result.status && result.status >= 400 ? result.status : 502 });
    }
    return new Response(JSON.stringify(result.data ?? { sent: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error(`[send-gate] ${label}: send threw`, e);
    return new Response(JSON.stringify({ sent: false, reason: "send_exception" }), { status: 502 });
  }
}
