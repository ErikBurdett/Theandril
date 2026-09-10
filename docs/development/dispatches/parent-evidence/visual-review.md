# Parent visual and integration review

## Observed pixels

Inspected actual PNGs, not renderer counters:

- `../frontend-evidence/production-browser/updates-readable-journal-at-1366px-and-100-text/explore-top.png`: deliberate asymmetrical editorial feature; legible dark ink on parchment; walnut masthead; real hex-map illustration. No obvious overlap in the captured viewport. This image belongs to the separately hash-verified frontend snapshot.
- `pages-browser/gameplay-updates-readable-journal-at-390px-and-130-text/reader-chapter.png`: enlarged mobile chapter wraps within the parchment column without horizontal clipping; heading/body hierarchy and ink contrast remain readable. The lower paragraph continues below the viewport, not behind a fixed overlay.
- `pages-browser/production-deployment-asse-8b5b2--configured-deployment-base/deployment-new-campaign.png`: actual game terrain, water, forest, caravan, selection and HUD render. Unexplored dark space is fog, not a blank renderer. No obvious HUD/map overlap in this view.

## Execution evidence

`pages.json` records the actual combined production Pages suite at `/Theandril/`: 15 expected passes, zero skipped, unexpected or flaky tests, and no top-level runner errors. This includes the ten journal journeys, existing game production cases and popup/navigation preservation. The complete suite, rather than merely standalone frontend tests, now runs in the Pages workflow.

Static typecheck, repository-wide lint, content validation, art validation and combined Pages build exited zero; separate logs are retained here.

The first full unit run retained two failures: a new theme/layout boundary violation (corrected by keeping layout in campaign-hud.css and colors/focus styling in hearth-theme.css), and the existing long epic campaign exceeding its unchanged 60,000 ms timeout. The unchanged headless file subsequently passed both cases on a standalone run; the epic case took 58,783 ms. This is evidence of little timing margin, not an isolated performance certification. A complete serial unit run is separate evidence and must be read before claiming its outcome.

These are local development-deployment checks. Public hosting, remote commit and CI conclusions require separate verification. No overall 1.0, Firefox/WebKit, assistive-technology or long-campaign performance acceptance is claimed.
