// Stripe shared utilities — Bring-Your-Own-Key (BYOK) mode.
//
// This project connects an EXISTING Stripe account via its secret key
// (STRIPE_SECRET_KEY). Calls go directly to api.stripe.com — no Lovable
// connector gateway is involved. Webhook signatures are verified with
// STRIPE_WEBHOOK_SECRET (the whsec_... value from the Stripe dashboard
// webhook endpoint).
//
// The Stripe environment (sandbox/test vs live) is derived from the
// secret key prefix so callers don't have to track two parallel configs.

import { encodeHex } from "https://deno.land/std@0.224.0/encoding/hex.ts";
import Stripe from "https://esm.sh/stripe@22.0.2";

const getEnv = (key: string): string => {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`${key} is not configured`);
  return value;
};

export type StripeEnv = "sandbox" | "live";

/**
 * The secret key actually in use. STRIPE_SECRET_KEY_LIVE (added manually in
 * Project Settings → Secrets) takes precedence; STRIPE_SECRET_KEY (the
 * integration-managed test key) is the fallback.
 */
function secretKey(): string {
  return Deno.env.get("STRIPE_SECRET_KEY_LIVE") || Deno.env.get("STRIPE_SECRET_KEY") || "";
}

/** Derive the Stripe environment from the prefix of the key actually in use. */
export function stripeEnvironment(): StripeEnv {
  return secretKey().startsWith("sk_live") ? "live" : "sandbox";
}

/**
 * Create a Stripe client bound to the secret key in use.
 * The `env` argument is accepted for call-site compatibility but is not
 * used to select between keys.
 */
export function createStripeClient(_env?: StripeEnv): Stripe {
  const key = secretKey();
  if (!key) throw new Error("STRIPE_SECRET_KEY_LIVE / STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, {
    apiVersion: "2026-03-25.dahlia",
  });
}

// ---------------------------------------------------------------------------
// Webhook signature verification (Stripe-Signature header).
// Uses STRIPE_WEBHOOK_SECRET (the whsec_... signing secret from the Stripe
// dashboard webhook endpoint).
// ---------------------------------------------------------------------------

type StripeWebhookEvent = {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
};

async function verifySignature(
  payload: string,
  header: string,
  secret: string,
): Promise<StripeWebhookEvent> {
  const parts = header.split(",").reduce<Record<string, string>>((acc, p) => {
    const [k, v] = p.split("=");
    acc[k.trim()] = v.trim();
    return acc;
  }, {});
  const timestamp = parseInt(parts["t"] || "0", 10);
  const signatures = parts["v1"] ? [parts["v1"]] : [];
  if (!timestamp || signatures.length === 0) {
    throw new Error("Invalid Stripe-Signature header");
  }

  // Reject replays older than 5 minutes.
  const age = Math.floor(Date.now() / 1000) - timestamp;
  if (age > 300) throw new Error("Stripe webhook timestamp too old");

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expected = encodeHex(
    new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload))),
  );
  if (!signatures.includes(expected)) throw new Error("Stripe webhook signature mismatch");

  return JSON.parse(payload) as StripeWebhookEvent;
}

export async function verifyWebhook(
  req: Request,
  _env?: StripeEnv,
): Promise<StripeWebhookEvent> {
  const signature = req.headers.get("stripe-signature");
  if (!signature) throw new Error("Missing Stripe-Signature header");
  const body = await req.text();
  const secret = getEnv("STRIPE_WEBHOOK_SECRET");
  return verifySignature(body, signature, secret);
}
