// Frontend Stripe helpers — Bring-Your-Own-Key (BYOK) mode.
//
// The publishable key (VITE_STRIPE_PUBLISHABLE_KEY, pk_test_... / pk_live_...)
// is the only client-side credential. It is safe to expose in the browser
// bundle; the secret key never leaves the edge functions.

import { loadStripe, type Stripe } from "@stripe/stripe-js";

type StripeEnv = "sandbox" | "live";

const clientToken = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

function paymentsEnvironment(): StripeEnv {
  if (clientToken?.startsWith("pk_live_")) return "live";
  if (clientToken?.startsWith("pk_test_")) return "sandbox";
  throw new Error(
    "Stripe publishable key is not configured. Set VITE_STRIPE_PUBLISHABLE_KEY to enable checkout.",
  );
}

export function isStripeConfigured(): boolean {
  return Boolean(clientToken);
}

export function getStripe(): Promise<Stripe | null> {
  if (!clientToken) return Promise.resolve(null);
  return loadStripe(clientToken);
}

export function getStripeEnvironment(): StripeEnv {
  return paymentsEnvironment();
}

export function isStripeTestMode(): boolean {
  return paymentsEnvironment() === "sandbox";
}
