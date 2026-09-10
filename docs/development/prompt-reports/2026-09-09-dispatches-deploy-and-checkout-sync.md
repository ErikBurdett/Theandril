# Prompt report — 2026-09-09 — Developer dispatches, deployment and checkout sync

## Prompt
"Deploy the changes over to the deployment now and make sure that it shows on the github repo. Also, make me a devblog page … styled the same way as theandril-hearth-and-card … similar to No Man's Sky update pages but developer centric." Then: "How do I handle these changes on my local branch … a936fc3?" and "Can you fix the issue in my cursor for me?"

## Delivered
- Public developer journal **Theandril Dispatches** at https://erikburdett.github.io/Theandril/updates/ — three illustrated, source-linked dispatches (R17 campaign safety, R02 archive durability, twenty-four-culture baseline), searchable archive, story permalinks, chapter index, image dialogs, reference shelf, Road-to-1.0 scope ledger, contributor guidance. Hearth & Card walnut/parchment/brass materials reused (no new art).
- Game landing and Campaign & settings menu link to the journal in a new tab without discarding setup.
- Reusable authoring contract: `docs/updates/CONTRIBUTING.md`, `TEMPLATE.md`, `STRUCTURE.md`; AGENTS.md now asks for a dispatch on substantial chunks of work.
- Deployment: `master` fast-forwarded `b0a4cd8 → 9243b09 → 4790331`; Pages run 34426294825 succeeded; deployment 6362802702 at the live URL.
- Cursor fix: user checkout `/home/telephoneheater/Work/Theandril` aligned to `4790331` (0 ahead / 0 behind, clean). Original commit preserved on `backup/campaign-safety-r17-a936fc3`; oversized trace kept in place (ignored) with a hash-verified copy at `/home/telephoneheater/Work/Theandril-local-backups/a936fc3-4ltfhwyo/`.

## Changed
- Site: `apps/web/updates/index.html`, `apps/web/src/updates/**` (Journal, content, library, media, tests), `apps/web/public/updates/*.webp` + `provenance.json`.
- Game shell: `apps/web/src/main.tsx` (two links), `campaign-hud.css` (layout), `hearth-theme.css` (colour/focus only).
- Build/CI: `apps/web/vite.config.ts` (multi-entry), `.github/workflows/pages.yml` (journal gate, fetch-depth 0), `verify.yml` (fetch-depth 0), `playwright.pages.config.ts` (collects journal journeys), `eslint.config.js` (narrow immutable-evidence exclusion).
- Tests: `tests/tooling/{lint-boundaries,updates-build,pages-journal}.test.ts`, `tests/production/developer-navigation.spec.ts`, `tests/gameplay/updates.spec.ts`.
- Evidence: `docs/development/dispatches/**` (reference research, RED/GREEN logs, reviews, fixes, parent evidence).

## Verified
- Local: typecheck, lint, content:validate, art:validate, Pages build; full serial Vitest **1687/1687** (`docs/development/dispatches/parent-evidence/full-tests-final.json`); combined Pages Playwright **15/15** (`pages.json`, `post-review-pages.json`).
- Independent reviews: integration 12-file PASS (`review/integration-final.verdict.json`), journal original FAIL retained (`review/journal-original.verdict.json`) → three bounded fixes with RED/GREEN (`journal-fixes/`) → delta PASS (`review/journal-final.verdict.json`).
- Public: `PAGES_SMOKE_URL=https://erikburdett.github.io/Theandril/` Playwright **15/15**; live pixels inspected (`~/.hermes/artifacts/theandril-release-4790331/dispatches-live.png`).

## Not done / blocked / caveats
- First master push `9243b09` failed the Pages gate: `apps/web/updates/index.html` was intent-to-add only (empty blob in the commit). Fixed in `4790331`; failure log retained (`parent-evidence/pages-first-deployment-failure.log`).
- Verify-campaign CI on `4790331` is **red on four timeouts** (contact 24/32 seats @20s, epic chronicle @60s, epic pacing @60s) on the GitHub runner; all pass locally in serial. Not bypassed, not fixed in this prompt.
- The epic chronicle test ran 58.8 s locally against a 60 s budget — thin margin, not a performance certification.
- Existing AI review findings (queued harbors / chart scans) remain open; no 1.0 acceptance claimed.

## Follow-ups
- Decide whether CI runner timeouts should be raised for the long-form tests or the tests sharded; needs user decision (changes a gate).
- Add a dispatch for the journal launch itself once the next chunk of work lands.
