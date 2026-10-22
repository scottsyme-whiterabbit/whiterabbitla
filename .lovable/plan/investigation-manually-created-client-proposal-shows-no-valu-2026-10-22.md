# Investigation: manually created client + proposal shows no value and does not count in revenue

Diagnosis only. No code or data was changed.

## 1. Where the money lives
- `deals.deal_value` (integer, **cents**): the only field the CRM shows and adds up.
- `proposals.tiers[].price` (text such as "$2,500"): proposals have no number column.
- `signed_agreements.tier_price` (text), `event_invoices.total_cents` / `amount_paid_cents` (cents).

## 2. Manual create paths
- Client/deal: PipelineTab.tsx "Add Deal" calls `create_deal` in newsletter-admin/index.ts (~line 979). It writes `deal_value: deal.deal_value || null`. The form already converts dollars to cents (dollars x 100), so a blank box saves **null**.
- Proposal: AdminProposals.tsx calls `create` / `update` in proposals-api/index.ts (lines 731-760). These only insert or update the `proposals` row. They **never set `deal_id`** and **never touch `deals.deal_value`**.

## 3. Normal send path
proposals-api/index.ts send handler (lines ~1105-1167): sets `sent_at`, finds or creates the deal by email (new deals have no `deal_value`), then sets `proposals.deal_id`. The value comes only from DB trigger `deal_value_from_proposal`. It reads the recommended tier's price, or the first tier's, through `parse_price_cents`. It fills `deal_value` only when **`sent_at` is set** AND a deal resolves (`deal_id`, else the newest deal with the same email) AND the current value is null/0. So sending and manual create use the same field. Manual create simply never sets `sent_at` or a link, so nothing fills it.

## 4. Display
Everything reads `deals.deal_value / 100`. This includes PipelineTab `formatCurrency` (85-88, card 569, column totals 499), the ClientContextPanel field (prefill /100, save x100; the Oct 20 bug is already fixed at lines 336-352), ActionListTab, CampaignCalendarTab, ShowCalendar and LeadAttributionTab. A null or 0 value displays as **blank**, so a missing value looks like "not displaying".

## 5. Revenue
`computeRevenueStats` in supabase/functions/newsletter-admin/revenue-stats.ts (`get_revenue_stats`, shown in RevenueTab/PipelineTab):
- Delivered counts `completed` deals in the current year: net paid on active invoices, else `deal_value`.
- Booked-ahead counts `booked` deals with a future event date: `deal_value`.
- `new`, `contacted`, `proposal_sent`, `negotiating` and `on_hold` are **never counted as revenue**. They only appear in `stageValues`.
- Square Import deals with no value are excluded.

So a manual deal adds to revenue only when it has a `deal_value` **and** sits in booked or completed.

## 6. Type and unit issues
- Price is text, so "From $5,000" and "$2,500" parse fine. A blank or non-numeric price gives null and the trigger silently skips it.
- `create_deal` uses `|| null`, so 0 or NaN become null, which is blank. The units are correct (cents).
- The trigger never overwrites a value that is already set, by design.

## 7. Evidence from live data
Of the 15 newest proposals, 13 linked deals have values and **2 are blank**: Elyse Rowan ($2,500 recommended, sent Oct 16) and Natasha Climer ($2,500, sent Sep 30). Both proposals are sent and linked, and both prices parse to 250000. The trigger is enabled. Most likely the value was later cleared by an edit, after the trigger's one fill (the trigger does not run again until the proposal is next edited). It is also possible the trigger skipped them; this is unconfirmed.

## Root-cause hypothesis
A hand-entered proposal never writes a number to the deal. The value is filled only as a side effect of **emailing** the proposal (the `sent_at` trigger), and the "create/update" save neither links the proposal to the deal nor copies its price. If Scott also leaves Deal value blank on the manual deal, `deal_value` stays null. It shows blank everywhere and adds nothing. Even with a value, the revenue counter includes it only once the deal is Booked or Completed. Proposal-stage money appears only as the pipeline/stage value, not as revenue.

## Related to the Oct 20 plan?
Same field, different bug. That plan fixed the client panel dollars/cents mix-up, and the fix is now in place (ClientContextPanel.tsx 336-352). It does not explain this issue.

## Proposed fix (needs approval, nothing done)
1. In proposals-api `create`/`update`: link the proposal to the matching deal by `recipient_email`, without creating a deal or sending email. Fill `deal_value` from the recommended tier price only when it is null/0. Never overwrite a value Scott set.
2. Change the trigger so it also fills for unsent proposals that have a linked deal (same never-overwrite rule).
3. Report Elyse and Natasha for Scott to confirm before any backfill.
4. Decide with Scott whether "revenue" should also show a proposed/pipeline total. Today it does not by design.
5. Add tests for parsing the price into cents and for never overwriting.

One question before building: should a proposal's value count in the **revenue** counter before the client signs, or only show on the deal and in the pipeline total?
