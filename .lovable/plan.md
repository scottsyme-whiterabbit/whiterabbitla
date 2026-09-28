# Mobile-first CRM refinement

## Goal
Make the full White Rabbit Concierge experience comfortable and efficient on a phone when launched from the home-screen app, while preserving every CRM feature, tab, route, automation, and existing workflow.

## What will change

1. **Phone navigation and app frame**
   - Keep the five primary destinations in a persistent, safe-area-aware bottom navigation.
   - Make the More menu, global search, quick-add flow, refresh/sign-out controls, and active-screen title easier to reach and understand on a small screen.
   - Prevent fixed controls from covering content and preserve deep links such as `?tab=`.

2. **Daily work and client files**
   - Tighten the Today screen into thumb-friendly rows with clear hierarchy and protected secondary actions.
   - Keep the client file full-height, independently scrollable, back-gesture friendly, and usable with the on-screen keyboard.
   - Standardize phone-sized controls, folder switching, long text wrapping, and bottom safe-area spacing.

3. **Pipeline, contacts, money, and proposals**
   - Replace phone-only horizontal board/table dependence with compact card or stacked-list views; retain the existing desktop board and tables.
   - Make stage changes, filters, search, payment actions, proposal editing, and forms fit one phone width with at least 44px touch targets.
   - Keep every current field and action available; no records, stages, or routes are removed.

4. **More-menu tools**
   - Apply shared mobile patterns to Actions, Inbox, Follow-ups, Activity, outreach campaigns, calendars, analytics, Re-engage, payments, and agreements.
   - Collapse dense toolbars and metric grids cleanly, wrap long labels, and provide phone card views where tables are not practical.
   - Keep complex reports horizontally scrollable only where the data genuinely requires side-by-side comparison.

5. **PWA polish and verification**
   - Respect iPhone/Android safe areas, avoid sideways page scrolling, use stable viewport heights, and keep text inputs at 16px to prevent iPhone zoom.
   - Verify the main CRM journey at 390px: Today → client file, Pipeline, Proposals, Money, Contacts, More, and representative outreach/reporting screens.
   - Check taps, scrolling, dialogs, the back gesture, keyboard-visible forms, and the supervised build output.

## Technical details
- Add a small set of reusable mobile CRM layout styles/components rather than duplicating one-off fixes across every tab.
- Preserve desktop layouts behind existing breakpoints and introduce phone-specific renderings only where a desktop table or board cannot adapt safely.
- Do not alter follow-up timing, hold dates, signing, invoice behavior, drips, Re-engage logic, authentication, email copy, or backend behavior.
- Update the existing installable app presentation only if viewport/safe-area metadata needs correction; do not replace its current offline behavior.

## Acceptance checks
- No page-level horizontal overflow at 390px.
- Primary navigation and More remain reachable with the home indicator present.
- All important actions have reliable touch targets and no clipped labels.
- Client files and dialogs open, scroll, and close without leaving the current CRM screen.
- Every existing tab and `?tab=` link still works.
- Desktop behavior remains intact.
