# Project architecture rules

- Shared inquiry-email parsing and Pacific-time rules live in `supabase/functions/_shared/inquiry-email.ts` so instant and scheduled messages make identical eligibility decisions.
- Shared service-page CTAs use the optional `ctaLabel` data field so individual services can override the default "Inquire" label without branching the template.
- Customer-facing copy must place magic during cocktail hour, before or after meals, or only once plates are cleared, because Scott never performs while guests eat.
