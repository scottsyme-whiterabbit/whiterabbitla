// PostHog product analytics for the public site.
//
// Rules this file enforces:
// - PostHog loads only after the visitor clicks Accept on the cookie banner
//   (stored as "accepted" under wr-cookie-consent). Until then nothing is
//   downloaded and nothing is sent. Decline keeps it off for good.
// - It never runs on internal pages (CRM, admin, proposal editor and client
//   proposal pages, residency pages, invoice pay pages, unsubscribe).
// - Custom events carry only the fixed, non personal properties listed in
//   EVENT_PROPERTIES; anything else is dropped before it is sent. Page
//   addresses lose every query value except ad campaign tags.
import type { PostHog, CaptureResult, PostHogConfig } from "posthog-js";
import { supabase } from "@/integrations/supabase/client";

export const CONSENT_KEY = "wr-cookie-consent";
export const POSTHOG_API_HOST = "https://us.i.posthog.com";

/** Path prefixes PostHog must never load on or send from. */
export const INTERNAL_PATH_PREFIXES = [
  "/admin",
  "/proposal",
  "/proposals",
  "/residency",
  "/pay",
  "/unsubscribe",
] as const;

export function isInternalPath(pathname: string): boolean {
  const path = (pathname || "/").toLowerCase();
  return INTERNAL_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

/** Query values that may stay on a page address: ad campaign tags only. */
const KEPT_QUERY_PARAMS = new Set(["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"]);

/** Strips every query value except campaign tags, and drops the #hash. */
export function sanitizeUrl(value: unknown): unknown {
  if (typeof value !== "string" || !value) return value;
  try {
    const url = new URL(value);
    for (const key of [...url.searchParams.keys()]) {
      if (!KEPT_QUERY_PARAMS.has(key.toLowerCase())) url.searchParams.delete(key);
    }
    url.hash = "";
    return url.toString();
  } catch {
    return value.split(/[?#]/)[0];
  }
}

const URL_LIKE = /^https?:\/\//i;

/**
 * Cleans every page address PostHog attaches, wherever it sits (session entry
 * url, heatmap keys, web vitals, replay page changes), not only $current_url.
 */
export function deepCleanUrls(value: unknown, depth = 0): unknown {
  if (typeof value === "string") return URL_LIKE.test(value) && /[?#]/.test(value) ? sanitizeUrl(value) : value;
  if (depth > 6 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) value[i] = deepCleanUrls(value[i], depth + 1);
    return value;
  }
  const obj = value as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    const cleaned = deepCleanUrls(obj[key], depth + 1);
    const cleanKey = URL_LIKE.test(key) && /[?#]/.test(key) ? String(sanitizeUrl(key)) : key;
    if (cleanKey !== key) delete obj[key];
    obj[cleanKey] = cleaned;
  }
  return obj;
}

function pathOf(props: Record<string, unknown> | undefined): string {
  const path = props?.$pathname;
  if (typeof path === "string") return path;
  const current = props?.$current_url;
  if (typeof current === "string") {
    try { return new URL(current).pathname; } catch { /* fall through */ }
  }
  return typeof window !== "undefined" ? window.location.pathname : "/";
}

// ---------------------------------------------------------------------------
// Custom events and the only properties each may carry.
// ---------------------------------------------------------------------------

export const EVENT_PROPERTIES = {
  hero_cta_clicked: ["label"],
  quiz_started: [],
  quiz_step_viewed: ["step_number", "step_name"],
  quiz_abandoned: ["step_number", "step_name"],
  inquiry_submitted: ["event_type", "guest_count_range"],
  review_link_clicked: ["destination"],
  phone_or_email_clicked: ["channel"],
} as const;

export type ProjectEvent = keyof typeof EVENT_PROPERTIES;
type Primitive = string | number | boolean;

/** Keeps only the allowed properties for an event, and only plain short values. */
export function allowedProperties(event: string, props: Record<string, unknown> = {}): Record<string, Primitive> | null {
  const allowed = (EVENT_PROPERTIES as Record<string, readonly string[]>)[event];
  if (!allowed) return null;
  const out: Record<string, Primitive> = {};
  for (const key of allowed) {
    const v = props[key];
    if (typeof v === "number" || typeof v === "boolean") out[key] = v;
    else if (typeof v === "string" && v.length <= 40 && !v.includes("@")) out[key] = v;
  }
  return out;
}

/** Fields PostHog itself adds to every event (identity, token, page title, campaign tags). */
const SDK_KEYS = /^(distinct_id|token|title|utm_[a-z]+|li_fat_id|gad_source|mc_cid|gclid|gclsrc|dclid|gbraid|wbraid|fbclid|msclkid|twclid|igshid|ttclid|rdt_cid|epik|qclid|sccid|oppref|bfcid|irclid|_kx)$/;

/** Last line of defence on every event PostHog sends. */
export function beforeSend(event: CaptureResult | null): CaptureResult | null {
  if (!event) return null;
  if (isInternalPath(pathOf(event.properties))) return null;
  // Our own events: strip anything not on the allowlist. PostHog's own fields
  // ($ fields, distinct_id, token, campaign tags) stay.
  const allowed = (EVENT_PROPERTIES as Record<string, readonly string[]>)[event.event];
  if (allowed) {
    for (const key of Object.keys(event.properties)) {
      if (!key.startsWith("$") && !allowed.includes(key) && !SDK_KEYS.test(key)) delete event.properties[key];
    }
  }
  deepCleanUrls(event.properties);
  if (event.$set) deepCleanUrls(event.$set);
  if (event.$set_once) deepCleanUrls(event.$set_once);
  return event;
}

export const POSTHOG_OPTIONS: Partial<PostHogConfig> = {
  api_host: POSTHOG_API_HOST,
  person_profiles: "identified_only",
  capture_pageview: "history_change",
  autocapture: true,
  disable_session_recording: false,
  session_recording: { maskAllInputs: true },
  opt_out_capturing_by_default: true,
  disable_capture_url_hashes: true,
  before_send: beforeSend,
};

// ---------------------------------------------------------------------------
// Value helpers for event properties (fixed buckets, never free text).
// ---------------------------------------------------------------------------

const GUEST_RANGES: Record<string, string> = {
  intimate: "under_30",
  medium: "30_75",
  large: "75_150",
  xlarge: "150_plus",
};

/** Booking quiz guest choice to a range bucket. The exact typed count is never sent. */
export function guestCountRange(choiceId: string | undefined | null): string {
  return (choiceId && GUEST_RANGES[choiceId]) || "unknown";
}

const QUIZ_EVENT_TYPES = new Set(["corporate", "wedding", "private", "parlor", "other"]);

export function quizEventType(id: string | undefined | null): string {
  return id && QUIZ_EVENT_TYPES.has(id) ? id : "other";
}

/** The Contact form's event type is typed by hand, so map it to a fixed bucket. */
export function contactEventType(text: string | undefined | null): string {
  const t = (text || "").toLowerCase();
  if (!t.trim()) return "unknown";
  if (/wedding|rehearsal|reception|bride|engagement/.test(t)) return "wedding";
  if (/corporate|company|brand|conference|gala|launch|holiday|offsite|trade|team|client/.test(t)) return "corporate";
  if (/parlor|parlour|show/.test(t)) return "parlor";
  if (/birthday|party|private|anniversary|celebration|dinner|bar mitzvah|bat mitzvah|graduation/.test(t)) return "private";
  return "other";
}

const GOOGLE_REVIEW_HOSTS = ["g.page", "search.google.com", "maps.google.com", "www.google.com", "google.com", "maps.app.goo.gl"];

/** What a clicked link is, for the click events. */
export function classifyLink(href: string, origin: string): { event: ProjectEvent; props: Record<string, Primitive> } | null {
  const h = (href || "").trim().toLowerCase();
  if (h.startsWith("tel:") || h.startsWith("sms:")) return { event: "phone_or_email_clicked", props: { channel: "phone" } };
  if (h.startsWith("mailto:")) return { event: "phone_or_email_clicked", props: { channel: "email" } };
  let url: URL;
  try { url = new URL(href, origin); } catch { return null; }
  if (url.origin === origin && url.pathname.replace(/\/+$/, "") === "/reviews") {
    return { event: "review_link_clicked", props: { destination: "reviews_page" } };
  }
  if (url.hostname === "g.page" && url.pathname.toLowerCase().startsWith("/r/")) {
    return { event: "review_link_clicked", props: { destination: "google" } };
  }
  if (GOOGLE_REVIEW_HOSTS.includes(url.hostname) && /review/i.test(url.pathname + url.search)) {
    return { event: "review_link_clicked", props: { destination: "google" } };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Loading and consent.
// ---------------------------------------------------------------------------

export function readConsent(): "accepted" | "declined" | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "accepted" || v === "declined" ? v : null;
  } catch {
    return null;
  }
}

let client: PostHog | null = null;
let loading: Promise<PostHog | null> | null = null;
let listenerInstalled = false;
const queue: Array<{ event: ProjectEvent; props: Record<string, Primitive>; beacon: boolean }> = [];

function currentPath() {
  return typeof window !== "undefined" ? window.location.pathname : "/";
}

async function fetchToken(): Promise<string | null> {
  try {
    const cached = sessionStorage.getItem("wr-ph-token");
    if (cached) return cached;
  } catch { /* ignore */ }
  const { data, error } = await supabase.functions.invoke("posthog-config", { method: "GET" });
  const token = !error && data && typeof data.token === "string" ? data.token : null;
  if (token) {
    try { sessionStorage.setItem("wr-ph-token", token); } catch { /* ignore */ }
  }
  return token;
}

function load(): Promise<PostHog | null> {
  if (client) return Promise.resolve(client);
  if (loading) return loading;
  loading = (async () => {
    try {
      const token = await fetchToken();
      if (!token) return null;
      const { default: posthog } = await import("posthog-js");
      // Consent or page may have changed while loading.
      if (readConsent() !== "accepted" || isInternalPath(currentPath())) return null;
      posthog.init(token, POSTHOG_OPTIONS);
      posthog.opt_in_capturing();
      client = posthog;
      flushQueue();
      return posthog;
    } catch (err) {
      console.warn("PostHog did not load", err);
      return null;
    } finally {
      loading = null;
    }
  })();
  return loading;
}

function flushQueue() {
  if (!client) return;
  while (queue.length) {
    const item = queue.shift()!;
    client.capture(item.event, item.props, item.beacon ? { transport: "sendBeacon" } : undefined);
  }
}

function installClickListener() {
  if (listenerInstalled || typeof document === "undefined") return;
  listenerInstalled = true;
  document.addEventListener(
    "click",
    (e) => {
      const target = e.target as Element | null;
      const link = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link) return;
      const hit = classifyLink(link.getAttribute("href") || "", window.location.origin);
      if (hit) track(hit.event, hit.props);
    },
    true,
  );
}

/** Called once from the app entry. Loads PostHog only for visitors who accepted, on public pages. */
export function initPostHog() {
  if (typeof window === "undefined") return;
  installClickListener();
  syncPostHogWithRoute(currentPath());
}

/** Called on every page change: loads on public pages after consent, pauses replay on internal ones. */
export function syncPostHogWithRoute(pathname: string) {
  if (readConsent() !== "accepted") return;
  if (isInternalPath(pathname)) {
    client?.stopSessionRecording();
    return;
  }
  if (client) {
    if (!client.sessionRecordingStarted()) client.startSessionRecording();
    return;
  }
  void load();
}

/** Cookie banner Accept. */
export function optInPostHog() {
  installClickListener();
  if (client) {
    client.opt_in_capturing();
    if (!isInternalPath(currentPath())) client.startSessionRecording();
    return;
  }
  if (!isInternalPath(currentPath())) void load();
}

/** Cookie banner Decline. */
export function optOutPostHog() {
  queue.length = 0;
  if (client) {
    client.stopSessionRecording();
    client.opt_out_capturing();
  }
}

/** Sends one custom event, if the visitor accepted and this is a public page. */
export function track(event: ProjectEvent, props: Record<string, unknown> = {}, options: { beacon?: boolean } = {}) {
  if (typeof window === "undefined") return;
  if (readConsent() !== "accepted" || isInternalPath(currentPath())) return;
  const clean = allowedProperties(event, props);
  if (!clean) return;
  if (client) {
    client.capture(event, clean, options.beacon ? { transport: "sendBeacon" } : undefined);
    return;
  }
  if (queue.length < 20) queue.push({ event, props: clean, beacon: !!options.beacon });
  void load();
}

/** Test hook: forget the loaded client. */
export function __resetPostHogForTests() {
  client = null;
  loading = null;
  queue.length = 0;
}
