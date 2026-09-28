# Project architecture rules

- Shared inquiry-email parsing and Pacific-time rules live in `supabase/functions/_shared/inquiry-email.ts` so instant and scheduled messages make identical eligibility decisions.