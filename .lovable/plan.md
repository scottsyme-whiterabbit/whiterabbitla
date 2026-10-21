# Client-panel email navigation

- Rename the reachable **Email activity** tile and section to **Emails**, with a count from the same sent and upcoming records displayed in the timeline.
- Keep the existing tile grid and make every label wrap rather than truncate.
- Confirm and report the mobile path **Back → More → Money → Email schedule**. The client panel covers the bottom navigation, so Back closes it first.
- Leave the network-first service worker unchanged: it requests fresh files before falling back to cached files.

## Technical details
- Limit application edits to the client panel and its email timeline; no email logic, services, data, deployments, or publication.
- Check the mobile UI at 390 × 844 with intercepted requests and sample records so no real service is invoked. Installed iPhone cache/update behavior remains a phone-only check.