# Client Context Panel on the Deals Board

One panel per deal that shows the Gmail conversation, the invoice and payment status, and the two settlement controls, without leaving the pipeline.

## Gmail feasibility verdict: YES, confirmed working

This is not theoretical. `supabase/functions/gmail-sync/index.ts` already reads Gmail through the connector gateway with exactly the credentials this panel needs:

- Base URL `https://connector-gateway.lovable.dev/google_mail/gmail/v1`
- Headers `Authorization: Bearer LOVABLE_API_KEY` and `X-Connection-Api-Key: GOOGLE_MAIL_API_KEY`
- Calls `users/me/messages?q=(from:EMAIL OR to:EMAIL) newer_than:90d`, then `users/me/messages/{id}?format=full`, and parses From/To/Subject/Date headers plus the base64url body

I ran a live read against Scott's Gmail connection during this investigation and it returned HTTP 200 with message ids. Both sent and received mail are covered, because the `from: OR to:` query searches the whole mailbox, and the sync already assigns `direction` by comparing the From address against `scott.syme@whiterabbitla.com`.

Because messages are already synced into `deal_email_messages` and `deal_email_threads`, the panel does not need to hit Gmail on every open. It reads the stored thread instantly and offers a "Sync now" button that triggers the existing on-demand sync for that one deal.

## Current structure (what I found)

- The deals board is `src/components/PipelineTab.tsx`, rendered inside `src/pages/AdminNewsletter.tsx`. Deals are Kanban cards grouped by the eight stages.
- There are already two dialogs on that board: an Edit Deal form and a "Post-Show Emails" panel. Both are shadcn `Dialog`. Clicking a card body calls `openEdit(deal)`; a small mail icon calls `openEmailPanel(deal)`. So there is a place to hook into, but no unified client view yet.
- A deal's client is `deals.contact_email`. Invoices link back through `event_invoices.deal_id`.
- `src/components/DealInboxTab.tsx` already renders a two-way message list from the `get_deal_threads` admin action and can send a Gmail reply. That component is the working model for the thread UI; the panel reuses its shape rather than inventing one.
- Payment controls already exist in `src/components/admin/PaymentsTab.tsx`, calling `invoice-api` with an `x-admin-password` header for `mark_paid` and `set_email_pause`.

## Plan

### Phase 1: the panel, with payments

1. New action `get_deal_invoices` in `newsletter-admin`: given a `deal_id`, return that deal's `event_invoices` rows, and also match by `client_email` against the deal's `contact_email` so invoices created before the deal link existed still appear.
2. New component `src/components/admin/ClientContextPanel.tsx`. A full-height dialog with the client name, email, stage and event details in the header, then three sections: Conversation, Payments, Actions.
3. Payments section lists each invoice with total, amount paid, remaining balance, status, and the settled method ("Paid · Check", falling back to "Paid · Stripe"), plus an "Emails paused" badge.
4. Actions: the "Mark paid outside Stripe" inline form (amount prefilled with the remaining balance, method dropdown, optional note) and the "Pause client emails" switch, both calling `invoice-api` with `x-admin-password`, same as the Payments tab does today.
5. Open it from the deal card: the card body opens this panel instead of jumping straight to the edit form, and the panel keeps an "Edit deal details" button through to the existing form. Nothing existing is removed.

### Phase 2: the Gmail thread

6. Conversation section loads the stored thread via the existing `get_deal_threads` action: messages in chronological order, inbound and outbound visually distinct, showing from, to, date, subject and snippet, with the body expandable.
7. A "Sync now" button calls the existing `trigger_gmail_sync` action with this `deal_id`, which runs the proven 90-day `from:/to:` search for just that contact and refreshes the panel when it returns.
8. If the stored thread is empty on first open, auto-trigger one sync so the panel is never blank for a client who has real email history.
9. Optional in this phase: a reply box, reusing the `send_gmail_reply` action that `DealInboxTab` already calls.

### Technical notes

- New action, if a live pull is preferred over the stored one: `get_client_emails` in `newsletter-admin`, taking a contact email, running the same gateway query, and returning a normalized list of `{direction, from, to, date, subject, snippet}` without writing to the database. The stored-plus-sync route is the recommended default because it is faster and already battle-tested; this stays as a fallback.
- Auth: the panel uses the same `adminPassword` prop the pipeline already threads through for `newsletter-admin`, and the `x-admin-password` header for `invoice-api`. No new auth surface.
- No migration needed. Every column this uses already exists: `event_invoices.deal_id`, `payment_method`, `external_note`, `client_emails_paused`, and the `deal_email_*` tables.
- Files changed: `src/components/PipelineTab.tsx` (open the panel), `supabase/functions/newsletter-admin/index.ts` (one new action). Files added: `src/components/admin/ClientContextPanel.tsx`.

## Risks and unknowns

- **Gmail scope.** The read path is confirmed live, and a sync-only panel needs nothing more. Adding a reply button relies on `gmail-send`, which is already deployed, so it should be fine, but a missing send scope surfaces as HTTP 403 and would need a one-click reconnect.
- **Matching by email address.** The `from:/to:` search misses a thread where the client wrote from a second address, or where Scott was only cc'd. Threads are also attributed to whichever deal shares that contact email, so two deals for the same person share one conversation.
- **90-day window.** The existing sync only looks back 90 days. Older history will not appear unless that window is widened for on-demand panel syncs.
- **Rate limits and speed.** A sync fetches each message individually, so a chatty client can mean twenty round trips and a few seconds of waiting. This is why the panel reads stored data first and treats syncing as an explicit action.
- **Body rendering.** Stored bodies are plain text truncated at 20,000 characters, and quoted reply chains make long messages repetitive. The panel should collapse bodies by default.
