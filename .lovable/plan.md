# Calendar hold lifecycle (read-only findings, no changes proposed)

All calendar writes go through one helper: `syncDealToGoogleCalendar(supabase, dealId)` in `supabase/functions/newsletter-admin/index.ts:81`. No database trigger touches the calendar (the deals triggers only validate stage, set updated_at, and stop the inquiry sequence).

Stage sets (`newsletter-admin/index.ts:21-27`):
```ts
const GCAL_BOOKED_STAGES = new Set(["booked", "completed"]);
const GCAL_HOLD_STAGES = new Set(["proposal_sent", "negotiating", "on_hold"]);
const GCAL_CANCEL_STAGES = new Set(["lost"]);
const GCAL_OWNED_PREFIX = "🎩";
```

## How the hold is created
`proposals-api/index.ts:1191-1212` (send path): links proposal to deal, then POSTs `action: "sync_deal_calendar"` to newsletter-admin, which calls the helper (`newsletter-admin/index.ts:1186-1188`). Summary built at line 217: `${isBooked ? "🎩 BOOKED" : "🎩 HOLD"}: ...`. Existing id is PATCHed, otherwise POSTed (lines 267-330).

## Lost: the hold is DELETED
`newsletter-admin/index.ts:97-134`:
```ts
// Deal died: pull the hold off the calendar so the night frees up again.
if (GCAL_CANCEL_STAGES.has(deal.stage) && deal.calendar_event_id) {
  ...
  owned = foreignSummary.startsWith(GCAL_OWNED_PREFIX);
  if (owned) {
    await fetch(eventUrl, { method: "DELETE", headers: gcalHeaders })
  } else { console.warn(`... skipping DELETE of foreign or unreadable event ...`) }
  await supabase.from("deals").update({ calendar_event_id: null, last_calendar_sync_at: ... })
  return;
}
```
Every Lost path reaches it:
- `update_deal` fast path (ClientContextPanel): line 1082-1086 `await syncDealToGoogleCalendar(supabase, data.id);`
- `update_deal` full-deal form path: line 1118-1121, same call.
- `update_deal_stage` (Pipeline board): line 1216-1230 `.update({ stage, ...lost_reason })` then `await syncDealToGoogleCalendar(supabase, dealId);`

Caveats: deleted only if the event title starts with 🎩 (a renamed event is left on the calendar, id cleared); if `calendar_event_id` is already null, nothing is deleted. Failures are swallowed (`.catch(() => {})`). `calendar-sync` reconciliation (`calendar-sync/index.ts:257-262`) only selects booked/completed/proposal_sent/negotiating/on_hold, so it never recreates a hold for a Lost deal.

## Proposal declined
No such outcome exists. There is no decline action or status in `proposals-api` or anywhere in the functions; a decline only matters once you move the deal to Lost (above).

## Proposal expired (hold_until passes)
Left alone. `hold_until` is set at send (`proposals-api/index.ts:1135-1143`) and `set_hold` (824-861) only updates the proposal row and emails. `proposal-followup` sends "The hold on ... comes off today." (`proposal-followup/index.ts:217`) but makes no calendar call and changes no stage. The hold date only appears as text in the event description: `Hold expires: ${proposalHoldUntil}` (`newsletter-admin/index.ts:231`), refreshed only on the next sync.

## Deal booked: UPDATED in place (HOLD to BOOKED)
- Signing: `proposals-api/index.ts:532-549` sets stage booked, then calls newsletter-admin `update_deal_stage` with `stage: "booked"`, which runs the helper and PATCHes the same event, renamed `🎩 BOOKED`.
- Manual Booked via `update_deal` / `update_deal_stage`: same helper.
- Stripe payment: `payments-webhook/index.ts:185-196` and `invoice-api/index.ts:247-258` call `update_deal_stage`, same result.
- Exception: `autoBookPaidDeals` (`newsletter-admin/index.ts:424-436`, run from `get_revenue_stats`) updates stage to booked directly and does NOT call the helper, so the event keeps the HOLD title until some later sync.
- `calendar-sync/index.ts:193-198` moves past events to completed directly with no helper call; the event is left as is.

## Deal deleted: LEFT ALONE (orphaned)
`newsletter-admin/index.ts:1251-1259`:
```ts
case "delete_deal": {
  const { error } = await supabase.from("deals").delete().eq("id", dealId);
```
No calendar call, no trigger. The 🎩 HOLD stays on your Google Calendar with nothing pointing to it.

## Summary
| Outcome | Calendar hold |
|---|---|
| Lost (any path) | Deleted if title starts with 🎩 |
| Declined | Not a concept; nothing |
| Hold expired | Left alone |
| Booked | Renamed to BOOKED in place (except revenue-stats auto-book) |
| Deleted | Left alone, orphaned |

No code changes proposed. If you want, a follow-up could delete the hold on deal delete and sync after auto-book.
