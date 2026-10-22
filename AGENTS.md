# Project architecture rules

- Retired city routes use the exact-path set in retiredCityRoutes for redirects, data generation, sitemap output, and independent link lists so retirement never prunes unrelated editorial content.

- Client-panel Emails tile counts use the same loaded timeline records as the Sent and Upcoming sections, avoiding legacy-log count drift.

- Shared inquiry-email parsing and Pacific-time rules live in `supabase/functions/_shared/inquiry-email.ts` so instant and scheduled messages make identical eligibility decisions.
- Shared service-page CTAs use the optional `ctaLabel` data field so individual services can override the default "Inquire" label without branching the template.
- Customer-facing copy must place magic during cocktail hour, before or after meals, or only once plates are cleared, because Scott never performs while guests eat.
- Lost-stage UI transitions use LostReasonPicker; frontend and newsletter-admin share the pure lost-reason validator so cancellation and required reasons stay consistent.
- Normalize legacy proposal tier fields at editor/render boundaries without inventing pricing; empty arrays stay empty and do not render an empty pricing section.
- Agreement signing resolves tier identity against the stored proposal before writing; agreement name and price are server-authoritative to prevent browser price tampering.
- Public proposal and signing responses use explicit field allowlists; authenticated admin reads retain their existing shapes to keep internal data private without breaking editing.
- Browser-facing infrastructure failures use the shared safe-error payload with a per-request ID; real errors are logged only server side for traceable diagnostics.
- Manual Booked transitions share BookingPaymentModal and the pure manual-booking validator; a read-only admin guard endpoint checks agreements and active invoices before prompting, and payment validation precedes deal writes to avoid false paid records.
- Proposal event templates, event selectors and preview defaults resolve tiers through the shared pricing-set mapping and clone tier items, preventing stale duplicate prices and edits leaking into later presets.
- Admin new-proposal description defaults derive from the event-filtered standard line catalog, without changing pricing presets or applying new defaults to saved proposals; optional lines are dropdown-only.
- Stripe refund/dispute webhooks claim each event id in stripe_webhook_events and store absolute refund totals from the Charge, so retries and duplicate deliveries never double count; this path never writes to Stripe or emails clients.
- Email timing rules for invoice reminders, proposal follow-ups and post-show live as pure functions in supabase/functions/_shared/email-schedule.ts; the cron jobs and the admin email schedule preview both call them so the preview cannot drift from what actually sends. Every send attempt is logged to email_log from the send gate (and gmail-send), and logging failures are swallowed so they never block a send.
