# Inquiry email hyperlink and copy update

## Scope
- Extend `gmail-send` so approved markdown links render as safe anchors in HTML and as `text (URL)` in plain text.
- Preserve the existing bare URL linkifier without relinking URLs already inside anchors.
- Replace only the approved instant reply paragraph, instant reply call lines, and day 3 follow-up closing line.
- Leave day 9 unchanged and keep both inquiry schedules disabled.

## Verification
- Add focused rendering checks for valid links, invalid links, trailing punctuation, and no double processing.
- Verify the exact three message bodies and generated call-line HTML.
- Deploy only the three affected email functions and confirm both inquiry schedules remain off.
