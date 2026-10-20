# Project architecture rules

- Shared inquiry-email parsing and Pacific-time rules live in `supabase/functions/_shared/inquiry-email.ts` so instant and scheduled messages make identical eligibility decisions.
- Shared service-page CTAs use the optional `ctaLabel` data field so individual services can override the default "Inquire" label without branching the template.
- Customer-facing copy must place magic during cocktail hour, before or after meals, or only once plates are cleared, because Scott never performs while guests eat.
- Lost-stage UI transitions use LostReasonPicker; frontend and newsletter-admin share the pure lost-reason validator so cancellation and required reasons stay consistent.
- Normalize legacy proposal tier fields at editor/render boundaries without inventing pricing; empty arrays stay empty and do not render an empty pricing section.
- Agreement signing resolves tier identity against the stored proposal before writing; agreement name and price are server-authoritative to prevent browser price tampering.
