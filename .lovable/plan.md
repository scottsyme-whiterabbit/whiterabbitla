# Switching Stripe from TEST to LIVE — safe procedure

No changes have been made. This is the procedure and the risks.

## Short answers

**1. Changing STRIPE_SECRET_KEY (sk_test to sk_live).**
`STRIPE_SECRET_KEY` is flagged in this project as "cannot be deleted or updated via secrets tools" — it was created by the Stripe integration, so it is owned by that integration, not by the plain Secrets store. Neither I nor the Secrets UI can overwrite it in place. The intended path is exactly the one you named: **Payments → ... → Disconnect Stripe, then reconnect providing the live secret key.** Disconnect deletes the integration-owned key from the project (your Stripe account, products, customers, and payments are untouched), and reconnect writes the new value. There is no supported "edit in place" for an integration-managed secret.

Fallback if you would rather not disconnect: switch the code to read a *different*, plain secret name (for example `STRIPE_SECRET_KEY_LIVE`) that you add yourself in Project Settings → Secrets, with `_shared/stripe.ts` preferring it and falling back to `STRIPE_SECRET_KEY`. This avoids touching the integration at all and is fully reversible by removing the new secret. It is a code change, so it only happens if you approve it.

**2. Does disconnect/reconnect touch STRIPE_WEBHOOK_SECRET?**
In this project the webhook is entirely manual: you created the LIVE endpoint in the Stripe dashboard yourself, and `STRIPE_WEBHOOK_SECRET` is listed as a **plain** secret (no "managed by connector" marker), i.e. it is not owned by the Stripe integration. Disconnect removes the integration's own key material; it does not create a Stripe webhook endpoint for you and does not manage a signing secret in this self-managed setup. So the expectation is that your live `whsec_...` survives.

Because that is an expectation and not something I can guarantee from inside the code, treat it as a verification step, not an assumption: after reconnecting, confirm `STRIPE_WEBHOOK_SECRET` is still present in Project Settings → Secrets, and be ready to re-paste the live signing secret from the Stripe dashboard endpoint page (Stripe shows it again on demand). Also confirm the reconnect flow did not silently register a second webhook endpoint in your Stripe dashboard — if it did, two endpoints means two different signing secrets and half your events would fail verification. Delete or disable any endpoint you did not create.

**3. The frontend publishable key.**
It is not in Cloud → Secrets because it is a Vite build-time variable, not a runtime secret. It lives in two project files:

- `.env` line 4: `VITE_STRIPE_PUBLISHABLE_KEY="pk_test_51TyiGT..."` — used for production builds and publish.
- `.env.development` line 1: the same `pk_test_...` value — used only by the local/preview dev server, and it overrides `.env` there.

`src/lib/stripe.ts` reads `import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY` and derives the environment purely from the prefix: `pk_live_` yields `live`, `pk_test_` yields `sandbox`. That derived string is sent to the backend as the `environment` field from `PayInvoice.tsx` and `SignAgreementModal.tsx`, and it also drives the orange "test mode" banner.

To go live: set `.env`'s `VITE_STRIPE_PUBLISHABLE_KEY` to your `pk_live_...`, leave `.env.development` on `pk_test_...` if you want preview to stay in test (see the mismatch risk below), then Publish. The key is baked into the bundle at build time, so **nothing changes on the live site until you publish again** — editing the file alone is not enough.

**4. Is env alone sufficient to be live?**
Yes on the backend. `supabase/functions/_shared/stripe.ts` reads `Deno.env.get("STRIPE_SECRET_KEY")` and `Deno.env.get("STRIPE_WEBHOOK_SECRET")` and nothing else — no gateway, no connection lookup. `stripeEnvironment()` derives live/sandbox from the `sk_live` prefix. So the moment those two env values are the live key and the live signing secret, every charge and every webhook verification is live, regardless of what the Lovable "connection" state says. The connection state only matters because it is what controls whether you can write `STRIPE_SECRET_KEY`.

Important consequence: the `environment` value the frontend posts to `invoice-api` is validated but **not** used to pick a key — `createStripeClient` ignores its argument. So a stale `pk_test_` frontend against an `sk_live_` backend will not fail loudly; it will quietly take real money while showing the orange "test mode" banner. The two sides must be flipped together.

## Recommended order of operations

1. In the Stripe dashboard (live mode), confirm exactly one webhook endpoint points at `/functions/v1/payments-webhook`, and that it subscribes to `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Copy its `whsec_...` and keep it to hand.
2. Make sure no invoice is mid-checkout. Anyone on a hosted Stripe page during the swap will be completing against the old key.
3. Payments → ... → Disconnect Stripe.
4. Reconnect with the live secret key (`sk_live_...`).
5. Verify in Project Settings → Secrets that `STRIPE_WEBHOOK_SECRET` still holds the live `whsec_`; re-paste if it is gone or was replaced.
6. Verify in the Stripe dashboard that no extra webhook endpoint was created.
7. Update `VITE_STRIPE_PUBLISHABLE_KEY` in `.env` to `pk_live_...` (and decide on `.env.development`).
8. Publish. Confirm the orange test-mode banner is gone on `/pay/<token>` in production.
9. Smoke test with a real, small invoice (a $1 test invoice you refund) — a real card, since test cards are rejected by live keys. Confirm: hosted checkout opens, the webhook fires 200 in the Stripe dashboard's endpoint log, `event_invoices` records the payment, and the receipt email arrives.

## Risks

- **Window with no working key.** Between disconnect and reconnect, `getEnv("STRIPE_SECRET_KEY")` throws and `invoice-api` returns 500 on any checkout attempt. Do this off-hours; it should be minutes.
- **Silent live charges under a test banner** if the publishable key is not flipped in the same window (see above).
- **Webhook secret mismatch** is the most likely failure: signature verification throws, `payments-webhook` returns 400, Stripe retries, and invoices stay unpaid in the database even though the money moved. The Stripe endpoint log makes this obvious — check it during the smoke test.
- **Test-mode data does not migrate.** Any `event_invoices` rows with sandbox `stripe_session_id` / `stripe_payment_intent_id` are now orphaned relative to the live account. Nothing breaks, but do not expect old test sessions to resolve.
- **`.env.development` left on `pk_test_`** means preview still says sandbox while production is live. That is usually what you want, but the backend is single-key: a preview checkout would hit the live key with a live charge. If anyone tests in preview, keep this in mind — the safest choice is to stop taking real-money paths in preview entirely.
- **ACH.** `us_bank_account` is the primary method; live ACH requires the payment method to be enabled on the live account and settles asynchronously via `checkout.session.async_payment_succeeded`. Confirm it is enabled in the live dashboard before the first real invoice.

## If you want the no-disconnect alternative instead

Say so and I will plan the small change to `supabase/functions/_shared/stripe.ts` to prefer a self-added `STRIPE_SECRET_KEY_LIVE`, leaving the Stripe integration and its test key untouched and making rollback a single secret deletion.
