// Instant Telegram alert to Scott for each new website inquiry.
// Pure formatting plus a send helper that never throws, so the inquiry,
// the owner email and the client email are never blocked by Telegram.
import { eventDateForAlert, parseEventDate } from "./event-date.ts";

export const TELEGRAM_LIMIT = 4096;
export const TELEGRAM_TIMEOUT_MS = 3000;
export const CONTINUED = "… (continued in CRM)";
export const CRM_URL = "https://whiterabbitla.com/admin/newsletter";
/** Single-line fields are capped so the client message always keeps most of the room. */
const FIELD_MAX = 200;

export interface InquiryAlertInput {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  clientType?: unknown;
  eventType?: unknown;
  date?: unknown;
  guestCount?: unknown;
  budget?: unknown;
  location?: unknown;
  foundUs?: unknown;
  message?: unknown;
  dealId?: unknown;
}

export function escapeTelegramHtml(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function text(v: unknown): string {
  if (typeof v === "number" && isFinite(v)) return String(v);
  return typeof v === "string" ? v.trim() : "";
}

/** One-line field: whitespace collapsed, capped at FIELD_MAX characters. */
function field(v: unknown): string {
  const s = text(v).replace(/\s+/g, " ");
  return s.length > FIELD_MAX ? `${cut(s, FIELD_MAX - 1).trimEnd()}…` : s;
}

/** Cut to n UTF-16 units without splitting an emoji in half. */
function cut(s: string, n: number): string {
  if (s.length <= n) return s;
  let out = s.slice(0, Math.max(0, n));
  const last = out.charCodeAt(out.length - 1);
  if (last >= 0xd800 && last <= 0xdbff) out = out.slice(0, -1);
  return out;
}

/**
 * Phone in the "+1-212-555-0123" form Telegram turns into a tap to call link.
 * Anything that is not a plain US number is shown exactly as typed.
 */
export function telegramPhone(raw: unknown): string {
  const s = field(raw);
  if (!s) return "";
  const digits = s.replace(/\D/g, "");
  const us = digits.length === 10 ? digits : digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : "";
  if (us && /^[\d\s().+\-]+$/.test(s)) return `+1-${us.slice(0, 3)}-${us.slice(3, 6)}-${us.slice(6)}`;
  return s;
}

/** Same date wording as the owner email: the formatted date, or "date unclear (they wrote: ...)". */
export function alertDate(raw: unknown): string {
  const s = text(raw);
  if (!s) return "";
  return parseEventDate(s) ? eventDateForAlert(s) : `${eventDateForAlert(s)} (they wrote: ${field(s)})`;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Link that opens this client in the CRM, or null when there is no deal to open. */
export function crmLink(dealId: unknown, email: unknown): string | null {
  const id = text(dealId);
  const mail = text(email).toLowerCase();
  if (!UUID.test(id) || !mail.includes("@")) return null;
  return `${CRM_URL}?tab=today&deal=${id}&email=${encodeURIComponent(mail)}`;
}

/** Characters Telegram counts once tags are removed and entities decoded. */
export function visibleLength(html: string): number {
  return html.replace(/<[^>]*>/g, "").replace(/&(amp|lt|gt|quot);/g, "x").length;
}

/** Build the alert. Lines with no detail are left out; nothing is invented. */
export function buildInquiryAlert(input: InquiryAlertInput): string {
  const e = escapeTelegramHtml;
  const lines: string[] = ["🐇 <b>New inquiry</b>"];
  const name = field(input.name);
  if (name) lines.push(`<b>${e(name)}</b>`);
  const phone = telegramPhone(input.phone);
  const email = field(input.email);
  const contact = [phone && `📞 ${e(phone)}`, email && `✉️ ${e(email)}`].filter(Boolean).join("  ");
  if (contact) lines.push(contact);
  const labelled: [string, string][] = [
    ["Client type", field(input.clientType)],
    ["Event", field(input.eventType)],
    ["Date", alertDate(input.date)],
    ["Guests", field(input.guestCount)],
    ["Budget", field(input.budget)],
    ["Location", field(input.location)],
    ["Found us", field(input.foundUs)],
  ];
  for (const [label, value] of labelled) if (value) lines.push(`${label}: ${e(value)}`);

  const link = crmLink(input.dealId, input.email);
  const footer = link ? `\n\n<a href="${e(link)}">Open in CRM</a>` : "";
  const header = lines.join("\n\n");
  const message = typeof input.message === "string" ? input.message.replace(/\r\n?/g, "\n").trim() : "";
  if (!message) return header + footer;

  const prefix = `${header}\n\nMessage:\n\n`;
  const room = TELEGRAM_LIMIT - visibleLength(prefix) - visibleLength(footer);
  const body = message.length <= room ? message : `${cut(message, room - CONTINUED.length).trimEnd()}${CONTINUED}`;
  return prefix + e(body) + footer;
}

/** Pull a "Label: value" line the booking quiz writes into the message. */
export function messageField(message: unknown, label: string): string {
  if (typeof message !== "string") return "";
  const re = new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:[ \\t]*(.+)$`, "im");
  return message.match(re)?.[1]?.trim() || "";
}

/** Same inquiry details give the same key, so a retry or a double submit alerts once. */
export async function inquiryAlertKey(input: InquiryAlertInput): Promise<string> {
  const norm = (v: unknown) => text(v).toLowerCase().replace(/\s+/g, " ");
  const parts = [
    norm(input.email), norm(input.name), text(input.phone).replace(/\D/g, ""),
    norm(input.eventType), norm(input.date), norm(input.location), norm(input.message),
  ];
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(parts)));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface AlertStore {
  /** Insert the claim row. "duplicate" when this key was already alerted. */
  claim(key: string): Promise<"claimed" | "duplicate" | "error">;
  /** Record the outcome while keeping the claim (sent, or timed out and maybe delivered). */
  finish(key: string, status: "sent" | "unknown", messageId: number | null): Promise<void>;
  /** Remove the claim after a definite failure so a later retry can still alert. */
  release(key: string): Promise<void>;
}

export interface AlertDeps {
  token?: string | null;
  chatId?: string | null;
  store: AlertStore;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  log?: (msg: string) => void;
}

export type AlertResult = { sent: boolean; reason?: string };

/**
 * Send one Telegram alert for an inquiry. Never throws and never takes longer
 * than the timeout once the claim is written. Failures are logged, never shown
 * to the visitor. The bot token is never logged.
 */
export async function notifyInquiryTelegram(input: InquiryAlertInput, deps: AlertDeps): Promise<AlertResult> {
  const log = deps.log ?? ((m: string) => console.error(m));
  const token = text(deps.token);
  const chatId = text(deps.chatId);
  let key = "";
  let claimed = false;
  try {
    if (!token || !chatId) {
      log("Telegram inquiry alert skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set");
      return { sent: false, reason: "not_configured" };
    }
    const alertText = buildInquiryAlert(input);
    key = await inquiryAlertKey(input);
    const claim = await deps.store.claim(key);
    if (claim === "duplicate") {
      log("Telegram inquiry alert skipped: already sent for this inquiry");
      return { sent: false, reason: "duplicate" };
    }
    if (claim !== "claimed") {
      log("Telegram inquiry alert skipped: could not record the alert");
      return { sent: false, reason: "claim_failed" };
    }
    claimed = true;

    const timeoutMs = deps.timeoutMs ?? TELEGRAM_TIMEOUT_MS;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timedOut = new Promise<"timeout">((resolve) => {
      timer = setTimeout(() => { controller.abort(); resolve("timeout"); }, timeoutMs);
    });
    const doFetch = deps.fetchImpl ?? fetch;
    const request = doFetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: alertText, parse_mode: "HTML", link_preview_options: { is_disabled: true } }),
      signal: controller.signal,
    }).then(async (res) => ({ res, data: await res.json().catch(() => ({})) as Record<string, unknown> }));
    request.catch(() => {}); // a late rejection after the timeout must not surface
    let outcome: Awaited<typeof request> | "timeout";
    try {
      outcome = await Promise.race([request, timedOut]);
    } finally {
      clearTimeout(timer);
    }

    if (outcome === "timeout") {
      // It may still have arrived, so keep the claim and do not risk a second ping.
      await deps.store.finish(key, "unknown", null).catch(() => {});
      log(`Telegram inquiry alert timed out after ${timeoutMs} ms`);
      return { sent: false, reason: "timeout" };
    }
    const { res, data } = outcome;
    if (!res.ok || data.ok !== true) {
      await deps.store.release(key).catch(() => {});
      log(`Telegram inquiry alert failed [${res.status}]: ${String(data.description ?? "no description")}`);
      return { sent: false, reason: "telegram_error" };
    }
    const result = data.result as { message_id?: unknown } | undefined;
    const messageId = typeof result?.message_id === "number" ? result.message_id : null;
    await deps.store.finish(key, "sent", messageId).catch(() => {});
    return { sent: true };
  } catch (err) {
    if (claimed && key) await deps.store.release(key).catch(() => {});
    const detail = err instanceof Error ? `${err.name}: ${err.message}` : "error";
    log(`Telegram inquiry alert failed: ${token ? detail.split(token).join("[token]") : detail}`);
    return { sent: false, reason: "send_exception" };
  }
}
