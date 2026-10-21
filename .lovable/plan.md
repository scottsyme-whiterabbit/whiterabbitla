Read-only search finished. No changes are proposed. This plan only reports what was found.

Client-visible matches:
- src/pages/ProposalTemplate.tsx:388 — "A 50% deposit locks it in. The balance is due the day before, and I take it from there." (proposal page, timeline)
- src/pages/ProposalTemplate.tsx:593 — "The remaining 50% is due the day before the event." (proposal page, payment paragraph)
- src/components/SignAgreementModal.tsx:78 — "The remaining 50% is due the day before the event, unless otherwise agreed upon in writing." (Sign and Reserve agreement, and the signed agreement PDF)
- src/components/SignAgreementModal.tsx:79 — "...late fee of $200 will be added to the total amount owed." (same agreement, and the PDF)

Internal only:
- supabase/functions/invoice-reminders/index.ts:142 — code comment
- supabase/functions/_shared/event-date.ts:3 — code comment

The agreement PDF has no wording of its own. It prints the agreement text it receives. public/ has no matches.
