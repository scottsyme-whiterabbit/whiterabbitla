# Destination city FAQ fix

## Implementation
- Classify a city as local only when its existing data says California and Southern California.
- Keep all five current FAQ questions and answers unchanged for local cities.
- Substitute only the requested travel question, travel answer, and event-area phrase for destination cities.
- Leave the legacy page unchanged because it contains no FAQ section or travel-fee wording.

## Verification
- Confirm the displayed FAQ and FAQ schema share the same generated array.
- Check the build and inspect local and destination city pages in the browser.
- Report the complete local and destination slug lists derived from the existing service-area data.

## Technical details
- Add `isLocalCity(content)` beside the existing FAQ builder in `CityPage.tsx`.
- Pass the existing city content object into `buildFaqs`; no data, routing, SEO, or page-section changes.
