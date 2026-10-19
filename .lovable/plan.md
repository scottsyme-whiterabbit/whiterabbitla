# Deal value (cents) audit: findings, plus one proposed fix

Diagnosis only. Nothing has been edited. The database stores `deals.deal_value` in cents.

## Reads and displays

| Place | File:lines | Divides by 100? | Null / 0 handling |
|---|---|---|---|
| Pipeline helper `formatCurrency` | PipelineTab.tsx:85-88 | Yes | 0/null shows blank |
| Kanban card value | PipelineTab.tsx:569 | Yes (helper) | blank |
| Column header total | PipelineTab.tsx:499 | Yes (helper) | sums nulls as 0 |
| Pipeline value stat | PipelineTab.tsx:276-277 | Yes | every stage except completed and lost; nulls and 0s included as 0 |
| Avg deal value | PipelineTab.tsx:285-287 | Yes | divides by ALL active deals, so null and 0 deals drag the average down |
| Lost value | PipelineTab.tsx:290-313 | Yes | includes 0 |
| Revenue meter | PipelineTab.tsx:316-325 | Yes | booked = booked + completed; proposed = new, contacted, negotiating, proposal_sent (on_hold counted in neither) |
| Revenue tab summary | RevenueTab.tsx:62, 121-157 | Yes | booked and completed only, excludes 0/null and "Square Import"; gross revenue = completed only; avg excludes 0s |
| Revenue tab by source | RevenueTab.tsx:190 | Yes | booked + completed |
| Analytics attribution | AnalyticsTab.tsx:47, 146-157 | Yes | booked + completed, excludes Square Import |
| Action list | ActionListTab.tsx:144-147, 506, 924, 1048 | Yes | blank |
| Campaign calendar | CampaignCalendarTab.tsx:76-79, 89, 328, 338, 644 | Yes | upcoming booked total |
| Show calendar | ShowCalendar.tsx:49, 70, 295, 471 | Same helper pattern (not opened line by line) | upcoming booked total |
| Lead attribution list | LeadAttributionTab.tsx:258 | Yes | blank |
| Google Calendar description | newsletter-admin:237 | Yes | omitted |
| Invoice creation from deal | newsletter-admin:360 | Treated as cents, correct | 0 if null |
| Payments webhook write | payments-webhook:80 | Writes `total_cents`, correct | null if 0 |

## Manual entry (where Scott types a value)

| Form | File:lines | Prefill | Saved as | Correct? |
|---|---|---|---|---|
| Pipeline Edit/Add Deal | PipelineTab.tsx:245, 202, 693 | cents / 100 | dollars x 100 | Yes |
| Action list edit | ActionListTab.tsx:259, 281, 1201 | cents / 100 | dollars x 100 | Yes |
| Campaign calendar Add | CampaignCalendarTab.tsx:284, 426 | n/a | dollars x 100 | Yes |
| Lead attribution "log closed deal" | LeadAttributionTab.tsx:96 to newsletter-admin:1528 | n/a | server does x 100 | Yes |
| **Client panel edit** | ClientContextPanel.tsx:193, 296-320 to newsletter-admin:964-985 | **raw cents shown in a field labelled "dollars"** | **server `Math.round(n)`, no x 100** | **No: BUG** |

## The one bug

In the client panel, a $2,500 deal shows "250000" in the "Deal value (dollars)" box. Untouched, it is not resent, so nothing breaks. But if Scott types 2500, it saves as 2500 cents, which displays as $25 everywhere.

## Proposed fix (only if approved)

- ClientContextPanel.tsx: prefill `deal_value` as cents / 100, and send `Math.round(dollars * 100)` on save.
- No server change, so the existing raw cents path in `update_deal` stays as is.
- Query the database for any deal whose value may already have been saved wrong (small values under 10000 cents edited via the panel) and report them; nothing changed without Scott's say so.
