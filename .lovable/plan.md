# Residency Proposal Builder

A second proposal type — pitching Scott to perform at restaurants, hotels, and venues as a recurring residency — built in the same editorial style as the existing client proposals.

## What you'll see when it's done

**Admin** (`/admin/proposals`)
- A toggle at the top: **Client Proposals** | **Residency Pitches**
- Each tab has its own list, "New" button, and editor
- Same login, same Face ID, same preview/send flow you already have

**Public link** (`/residency/:slug`)
- Standalone page (no navbar/footer) at the same polish level as `/proposal/:slug`
- Forest dark + cream + gold palette, Ogg headings, Montserrat body — identical brand feel
- Mobile-first, sticky CTA at the bottom on mobile

## Page structure (matches the spec you pasted)

1. **Hero** — eyebrow ("A residency proposal"), serif headline ("A magician in residence at [Venue]"), italic subhead, single signature image
2. **The Invitation** — short letter to the GM by name, with the Key Line callout ("…they talk about for years.")
3. **Why a residency works** — three stat blocks (140% / +1.3% dwell / 85% share) with sources
4. **What the night looks like** — format: one night/week, 2 hours, table-to-table, no mic
5. **The four-week pilot** — fee, what's included, the handshake clause
6. **About the work** — short bio paragraph, signature image, "short film available on request" line
7. **Past evenings** — up to 3 testimonials
8. **Let's walk the room** — primary CTA (Calendly/scheduling link), secondary CTA (tap-to-call 424-394-1850)
9. **Footer** — Scott Syme / Magician / phone / whiterabbitla.com, plus the private "Hand and Eye" closing line (residency pages only, per your brand rule)

## Editable fields per pitch

Venue name, GM name, submarket/city, hero subhead line, fee, hero image, testimonials (up to 3), intro letter paragraphs, pilot length (default 4 weeks), nights-per-week, fee, scheduling link, optional "press" line.

Everything has a sensible default so a half-filled pitch still ships clean.

## Technical details

**Database** — new `venue_pitches` table (separate from `proposals`, as you chose):
```text
id, slug (unique), venue_name, gm_name, gm_email, submarket,
hero_image, hero_subhead, intro_paragraphs (jsonb),
pilot_weeks (default 4), nights_per_week (default 1),
session_hours (default 2), fee_dollars,
testimonials (jsonb), press_line, scheduling_url,
sent_at, created_at, updated_at
```
- Service-role-only writes (matches existing `proposals` pattern)
- Public SELECT by slug (so the recipient can view the link)
- `proposal_views` table reused to log views (add nullable `venue_pitch_id` column)

**Edge function** — extend the existing `proposals-api` function with new actions (`list_venue`, `get_venue`, `save_venue`, `delete_venue`, `send_venue`) rather than spinning up a parallel function. Same admin password gate.

**Frontend files**
- `src/pages/ResidencyTemplate.tsx` — public renderer (mirrors `ProposalTemplate.tsx`)
- `src/components/admin/ResidencyEditor.tsx` — split out so `AdminProposals.tsx` stays readable
- `src/pages/AdminProposals.tsx` — add the type toggle and conditional list/editor swap
- `src/App.tsx` — register `/residency/:slug` and `/residency/template` preview route

**Brand guardrails I'll enforce**
- Never the words "elevate" / "transform"
- No italicized body text (subheads use real italic font weight via Ogg italic, not CSS italic)
- The "Hand and Eye" line only appears on residency pages, never on client proposals or anywhere public
- "White Rabbit LA" brand name in footer, not "White Rabbit Los Angeles"

## Build order

1. Database migration (`venue_pitches` table + RLS + view-log column) — needs your approval
2. Extend `proposals-api` edge function with venue actions
3. Build `ResidencyTemplate.tsx` (public view) + `/residency/template` preview route
4. Add type toggle + venue list/editor to `AdminProposals.tsx`
5. Wire send-pitch email (reuses your existing Resend setup)
6. QA on mobile + desktop preview

Step 1 will trigger a migration approval prompt. Everything after is code-only.
