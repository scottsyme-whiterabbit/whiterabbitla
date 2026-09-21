# Roadmap

## Open
- [ ] Log the free/donated show in the pipeline — waiting on details from Scott (date, occasion, venue, client name/email, how to record the value).
- [ ] Homepage brand logos: swap current block for actual businesses performed for (long-standing request).

## In progress
- [ ] PART A: Google sign-in for all admin pages (phase 1, alongside password)
  - [ ] Enable Google provider, disable open email signups
  - [ ] Shared AdminAuthProvider used by all admin pages; memory-only password fallback
  - [ ] Remove localStorage/sessionStorage password persistence
  - [ ] `_shared/require-admin.ts` helper (bearer token + ADMIN_EMAILS allowlist OR password)
  - [ ] Swap every browser-facing admin check to the helper
  - [ ] Frontend sends Authorization: Bearer <token>
  - [ ] Acceptance checks
- [ ] PART B: Harden public `sign` action in proposals-api
  - [ ] Require real stored proposal (else {ok:true, preview:true})
  - [ ] Remove client tier_price fallback
  - [ ] Idempotent signing returns existing invoice
  - [ ] 5 sign attempts/IP/hour + email format validation
  - [ ] No unique constraint yet

## Done
- Proposal follow-up ladder, invoice reminders, manual-booked client emails, reviews page updates.

## Admin Google sign-in (phase 1) — DONE 2026-09-21
- Google provider enabled, open email signups off, ADMIN_EMAILS set.
- _shared/require-admin.ts used by all browser-facing admin functions.
- AdminAuthProvider + AdminGate on /admin/newsletter, /admin/proposals, /admin/social.
- Password path kept in memory only; biometric unlock removed (it persisted the password).
- Phase 2 (remove password path) pending Scott's confirmation on laptop + phone.
