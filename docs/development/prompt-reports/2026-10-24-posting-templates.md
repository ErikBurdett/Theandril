# Project orientation and reusable posting policies

## Prompt

“get familiar with this project and continue working towards a complete 1.0.”

## Delivered

The army registry now keeps a personal library of named posting policies. Save
hold/join and current-position/owned-hearth choices, recall them across browser
sessions and campaigns, choose a fresh hearth when required, then explicitly
post selected armies. Existing group controls accept up to 128 armies; the new
browser acceptance journey applies and replays one hundred actual commands.

A missing selected hearth no longer silently changes the order to hold each
army at its current location. The player must choose a new destination and may
still clear existing postings. Template storage errors preserve stored data and
leave ordinary posting controls available.

## Changed

- UI: `apps/web/src/posting-templates.tsx`, group posting integration, lifetime
  tests and lost-hearth destination regression.
- Preferences: `packages/persistence/src/posting-templates.ts`, strict bounded
  transactional CRUD, dedicated library tests and package export.
- Browsers: six new gameplay journeys and one production journey, alongside
  existing group posting/recovery scenarios. Native screenshots cover desktop,
  390px and 130% text scale.
- Records: architecture 0047, canonical implementation status and M3 checkpoint,
  a draft developer dispatch, source/image manifests and independent review.

See the [work packet](../2026-10-24-posting-templates/README.md) for owned paths,
exact source bytes, design decisions and retained evidence. Base revision is
`d06ba4b`; changes remain local and uncommitted in the primary checkout.

## Verified

- [Full local suite](../2026-10-24-posting-templates/full-tests.log): **2,162 tests
  across 268 files**, 60.69 seconds, four workers and unchanged test limits.
- [Affected gameplay](../2026-10-24-posting-templates/browser.log): **10 journeys**,
  56.2 seconds, including actual save/export/replay and storage failure recovery.
- [Built production](../2026-10-24-posting-templates/production.log): **2 journeys**,
  7.8 seconds, generated campaigns and no development hooks.
- [Enlarged-text follow-up](../2026-10-24-posting-templates/production-text.log):
  one overlapping journey, 5.8 seconds; scroll, bounds, keyboard recall and delete.
- [Transfer evidence rerun](../2026-10-24-posting-templates/transfer-browser.log):
  one overlapping journey, 20.1 seconds; retains the one-publication JSON on disk.
- [Typecheck](../2026-10-24-posting-templates/typecheck.log),
  [lint](../2026-10-24-posting-templates/lint.log),
  [content validation](../2026-10-24-posting-templates/content.log) and
  [production build](../2026-10-24-posting-templates/build.log) pass.
- [Independent source/evidence/image review](../2026-10-24-posting-templates/source-review.md):
  no blocking findings. The initial clipped enlarged-text capture is retained;
  additional native lower-controls evidence closes that review gap.

Overlapping checks are not additive. The hundred-army realm is an explicitly
authored Legendary fixture, not an organically developed empire. Its 4,401,207-byte
worker publication and approximately 1.9 ms command phase are one browser sample,
not full-turn, rendering or sustained-memory acceptance.

## Not done / blocked / caveats

This advances **ACT-32/M3** without completing it. Rules/save **34**, content
**`015468d1`**, simulation, AI and worker protocol are unchanged; no pacing change
or new pacing measurement is claimed. **DH-021 remains open. All fifteen release
gates remain open.** No scope or quantitative content target was removed.

No commit, push, deployment, public journal publication or external tracker edit
was performed. The existing published journal is pinned to its reviewed source;
the new dispatch stays in docs as required for drafts. No primary-checkout sync
was needed because the work was local in that checkout. Non-Chromium certification,
organic scale acceptance and multi-step army programs are not established here.

## Follow-ups

Next dependency-ready M3 outcome: bounded patrol or escort orders with explicit
interruption/override behavior, AI use and saved continuation. Measure headline
campaign pacing for any rule or AI change. Wider governor decisions, recurring
trade, politics, deeper magic and the third victory path, authored content breadth,
online campaigns and full release certification remain part of the accepted 1.0
scope. An authorized publication would add the reviewed dispatch to the existing
journal and update the same catalogue item with pinned source evidence.
