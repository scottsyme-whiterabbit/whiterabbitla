# Immediate branded inquiry confirmation

## Scope
- Extend the Gmail sender with an optional rich HTML body while preserving its current plain-text, signature, markdown, threading, activity-log, and stage behavior.
- Reorder inquiry handling so the inquiry and deal are attempted first, Scott receives the existing notification, and the client immediately receives the approved branded confirmation through Scott's Gmail.
- Make every data and email failure non-blocking. If Gmail fails, send the same confirmation through Resend and still mark the inquiry ready for follow-ups when its row exists.
- Record successful Gmail message and thread IDs in the inquiry and automated-send ledger so both later nudges stay in one conversation.
- Restore Scott's scannable notification subject without changing its body or reply address.
- Replace all three old calendar URLs in this inquiry system with the single approved calendar URL.
- Retire the redundant instant-reply function and delete only its disabled scheduled job. Keep the follow-up schedule disabled.

## Technical details
- Build the branded HTML and matching plain text from the same fixed copy and Pacific-time call-line choice. Pass `skip_signature: true` because the template includes its own sign-off.
- Keep the existing form validation, but return website success after accepted input even if storage or email delivery encounters an error.
- Preserve all inquiry-followup selection, suppression, timing, dry-run, atomic-claim, rollback, and threading rules; change only its calendar URL if needed.
- Update the architecture note to reflect that shared inquiry rules now support the immediate confirmation and follow-ups rather than a scheduled instant-reply function.

## Verification
- Check exact confirmation and follow-up bodies, apostrophe and punctuation-dash rules, URL allowlist, and removal of `auto-pilot`.
- Verify Gmail failure reaches the Resend fallback path and cannot block a successful form response.
- Confirm the instant-reply function and job are absent and `inquiry-followup-tuewedthu` remains `active=false`.
- Report every changed file and the single schedule-removal migration, then paste all three final plain-text messages.
