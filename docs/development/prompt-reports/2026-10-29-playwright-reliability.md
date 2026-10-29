# Playwright crash mitigation — October 29, 2026

## Prompt

“How can we fix those playwright crashes?” The Theandril portion of a
workstation-wide diagnosis and fix.

## Delivered

Theandril's three normal Playwright entry points now avoid quota-limited shared
temporary storage by default and select supported full bundled Chromium. The
previously blocked ward-breaking browser journey and production restoration
journeys passed in repeated local runs.

## Changed

- `scripts/playwright-runtime.ts`: private disk-backed `TMPDIR`, supported
  Chromium channel, explicit executable and temporary-directory overrides.
- `playwright.config.ts`, `playwright.production.config.ts`,
  `playwright.pages.config.ts`: share that runtime; retain one worker and existing
  safety/assertion/trace behavior.
- `docs/IMPLEMENTATION_STATUS.md` and
  `docs/development/2026-10-29-playwright-reliability/`: evidence and limitations.

## Verified

Four seam-warding attempts and four production sequence/group restoration
attempts passed (four distinct journeys, each repeated twice). Typecheck and
scoped lint passed. The temporary directory is 0700 and the executable override
remains effective. [Commands, logs and failed probes](../2026-10-29-playwright-reliability/README.md).

## Not done / blocked / caveats

No commit, push, deployment, game change, process cleanup or personal-browser
change. The exact historical Chromium assertion is unresolved. Combined
mitigation and an isolated fresh development server were validated; this is not
proof of a single cause, full-suite success or release acceptance.

## Follow-ups

Use the normal configurations for later browser suites and watch for renewed
renderer failures. Explicitly choosing `/tmp` as an override can reintroduce the
quota problem. The other projects' changes are handled by the parent task.
