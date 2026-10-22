# Approved city-page SEO cleanup

## Changes
- Add the supplied 184 exact redirects without changing their entries.
- Register them before the dynamic blog and area routes, preserving existing redirects.
- Filter retired paths from city-page generation, service areas, sitemap output, and internal links using exact Set membership.
- Reuse the service pages’ existing Near You section for the seven specified kept city links.
- Preserve editorial article data, existing copy, styling, and layouts. Empty area regions already hide automatically.

## Technical details
- Use `src/data/retiredCityRoutes.ts` as the shared exact-path source of truth.
- Audit hardcoded links and filter only retired destinations; retain surrounding text where links occur within editorial content.
- Add focused retirement/retention tests and run the test suite; verify public redirects and links in the browser.
- No publication, deployment, email actions, or database changes.

<!-- Previous investigation retained below for historical context only. -->

# Missing "Booking Inquiry: Meeta Singh" alert — findings and proposed fix

Investigation only. Nothing was edited, sent, invoked, or changed.

## 1. Who sends what

Both emails come from a single function, `supabase/functions/send-inquiry/index.ts`, which the booking quiz (`src/components/BookingQuiz.tsx`) calls. The steps run in this order:

1. Save the inquiry and the deal (lines ~270-326).
2. **Scott alert** (lines 329-351): sent through Resend via `gatedSend(...)` with the label `inquiry-notification`. `gatedSend` comes from `supabase/functions/_shared/send-gate.ts`.
3. **Instant reply** (lines 354-430): sent through `gmail-send`, with Resend as a fallback.

A failure in step 2 is caught and only logged, so step 3 still runs. That matches what happened: Meeta got her reply and Scott got nothing.

## 2. Logs for 19:05-19:08 UTC

- The function logs no longer go back that far. Neither `send-inquiry` nor the edge log table returns anything for that window, so the logs give no evidence either way.
- The `email_log` table did not exist until about 20:25 UTC. That was migration 0007; its live logging went in at 20:25-20:29 UTC. The only rows for that window were rebuilt from older records afterwards: Meeta's instant reply at 19:06:22 and a calendar booking notice at 19:08:38. There is no row for the alert, so it was never handed to Gmail or recorded as sent.

## 3. Root cause (confirmed by data and history; the log line itself has expired)

**The new send safety check blocked the alert because Scott's own address is on the unsubscribe list.**

- `email_unsubscribes` has one row for `scott.syme@whiterabbitla.com`. It was added on 2026-09-03 at 18:55 UTC from a desktop Chrome browser, with source `list_unsubscribe_header_get`. Most likely an unsubscribe link in one of our own marketing emails was opened or prefetched from his inbox.
- Two changes went in today at **17:54-17:55 UTC**, both part of the bounce/suppression work:
  - `84d40c20` made the shared check `blockReason()` refuse any address found in `email_unsubscribes`.
  - `d2014322` sent the Scott alert in `send-inquiry` through `gatedSend` for the first time.
- After that, `blockReason("scott.syme@whiterabbitla.com")` returns `"unsubscribed"`. `gatedSend` then logs `[send-gate] inquiry-notification: not sent ... (unsubscribed)` and skips the send. `send-inquiry` writes "Resend notification not sent: unsubscribed" and moves on to the instant reply, which goes to Meeta's address and is not blocked.
- Meeta (19:06 UTC) is the **first inquiry since 17:55 UTC**. The one before her, Alex Hazen on 10/20 at 22:12 UTC, came in before the check existed. That explains why every earlier alert arrived.
- The edits you listed from 18:23-19:55 UTC did **not** touch this path. Commit `bf945e07` at 18:23 changed only the invoice reminder wording, `proposalAssets` and `ProposalTemplate`. No commit touched `send-inquiry` or `_shared` between 18:23 and 20:26 UTC. A deploy in progress is not needed to explain this; the cause is the 17:55 change working as written.

**Wider effect, not yet tested one by one:** any other alert to Scott that now goes through the same check is blocked the same way. The private-feedback alert in `send-inquiry` is one. The same check also appears in `proposals-api`, `gmail-send`, `proposal-followup`, `post-show-sequence`, `inquiry-followup` and `invoice-email`. Every new inquiry will keep losing its alert until this is fixed.

## 4. Proposed minimal fix

The rule: alerts sent to the business's own inbox skip the unsubscribe check. The unsubscribe list is a client's marketing opt-out and should not apply to Scott's own alerts. They still respect real hard bounces and the suppression list, and get one retry if Resend fails. Client emails behave exactly as they do now.

I am not deleting Scott's unsubscribe row, because that would be a data change. You can choose to remove it separately. That would also fix the problem, but it could happen again the next time a link is prefetched.

### Diff — `supabase/functions/_shared/send-gate.ts`

```diff
+// The business's own inbox. A marketing unsubscribe must never silence internal alerts.
+const OWNER_INBOXES = new Set(["scott.syme@whiterabbitla.com"]);
+
 export async function gatedSend(
-  opts: { to: unknown; subject: unknown; label: string; supabase?: any | null },
+  opts: { to: unknown; subject: unknown; label: string; supabase?: any | null; internalAlert?: boolean },
   send: (to: string, subject: string) => Promise<Response>,
 ): Promise<GateResult> {
   const to = cleanHeader(opts.to);
   const subject = cleanHeader(opts.subject);
-  const blocked = await blockReason(to, opts.supabase);
+  let blocked = await blockReason(to, opts.supabase);
+  if (opts.internalAlert && OWNER_INBOXES.has(bareEmail(to)) && (blocked === "unsubscribed" || blocked === "gate_unavailable")) {
+    console.warn(`[send-gate] ${opts.label}: owner inbox override (${blocked})`);
+    blocked = null;
+  }
   if (blocked) {
```

### Diff — `supabase/functions/send-inquiry/index.ts` (Scott alert block only)

```diff
-        const notification = await gatedSend(
-          { to: "scott.syme@whiterabbitla.com", subject: `Booking Inquiry: ${name} (${eventType})`, label: "inquiry-notification", supabase },
-          (to, subject) => fetch("https://api.resend.com/emails", { ... }),
-        );
+        const sendAlert = () => gatedSend(
+          { to: "scott.syme@whiterabbitla.com", subject: `Booking Inquiry: ${name} (${eventType})`, label: "inquiry-notification", supabase, internalAlert: true },
+          (to, subject) => fetch("https://api.resend.com/emails", { ... unchanged ... }),
+        );
+        let notification = await sendAlert();
+        if (!notification.sent && (notification.reason === "provider_error" || notification.reason === "send_exception")) {
+          await new Promise((r) => setTimeout(r, 1500));
+          notification = await sendAlert();
+        }
         if (!notification.sent) console.error("Resend notification not sent:", notification.reason);
```

Nothing else changes: not the instant reply, not the inquiry email copy, not timing or cron jobs, and not any client-facing send.

### Tests to add

In `src/test/`, against the pure gate logic:

- The owner address on the unsubscribe list plus `internalAlert` is sent.
- The same address without `internalAlert` is blocked.
- A client address on the unsubscribe list plus `internalAlert` is still blocked.
- The owner address with a hard bounce plus `internalAlert` is still blocked.

### Deploy

Redeploy `send-inquiry` only. The shared file is bundled into each function when it is deployed, so other functions keep today's behaviour until they are redeployed.

## Open decision for Scott

- Should the same owner override also cover the private-feedback alert in `send-inquiry` and any proposal or signing alerts to Scott in `proposals-api`? That means adding `internalAlert: true` at those calls and redeploying `proposals-api`. The plan leaves them out unless you say yes.
