# Reusable posting policies — local work packet

Base revision: `d06ba4b`; local development for the October 24 request to become
familiar with the project and continue toward 1.0. Publication is not authorized.
Implementation source bytes are recorded in [source-manifest.json](source-manifest.json).
This is a verified local checkpoint; no commit, push or deployment was performed.

## Acceptance and ownership

The player can save, update, recall and delete a named army posting policy,
reuse it after reloading or in another campaign, choose a current owned hearth
when required, and explicitly post up to 128 checked armies through the existing
canonical commands. Choosing or recalling a template changes no campaign state,
selection or worker traffic. Applied postings retain ordinary save/replay and
individual override behavior. Preference failures preserve data and leave direct
orders usable. Keyboard and narrow-screen controls must work.

- Parent: `apps/web/src/group-postings.tsx`, posting template panel/lifetime tests,
  integration checks and status/report documentation.
- Persistence delegate: new posting template store/tests and package export.
- Browser delegate: new gameplay/production posting template journeys.
- Independent reviewer: source/evidence review in this packet.

Canonical sim, AI, worker/protocol commands, campaign schema, content and historical
evidence are prohibited modification paths for this slice. Rules/save stay 34;
content stays `015468d1`. No campaign pacing change is intended.

## Design

Templates store an arrival order (`hold`/`join`) and destination policy
(`current`/`hearth`), with a unique name. They store no army IDs, hearth IDs or
hexes. A recalled hearth policy clears the destination until the player chooses
an owned hearth. This prevents a personal preference from carrying map-specific
targets into unrelated campaigns. The separate IndexedDB library holds at most
24 rows and retains the existing preference-store validation and transaction
contract. It is not included in campaign saves or exports.

Inspection also found the existing group posting form silently substituted each
army's current hex when its selected hearth disappeared. The form now requires
an explicit replacement target; clearing existing postings remains independent
of the new-order destination. This is a presentation correction, not a change
to canonical posting legality.

No new per-frame or per-turn work is introduced. Library reads cap at 25 rows
(24 plus overflow detection); group posting still uses its existing 128-order
batch and one permitted worker publication.

## Verification

All commands ran locally. Browser runs used `/usr/bin/chromium`; runtime versions
are in [environment.json](environment.json). These overlapping scopes are not
additive test counts.

| Check | Result | Evidence |
| --- | --- | --- |
| `pnpm test --maxWorkers=4` | 2,162 tests / 268 files, 60.69 s; original budgets | [Full suite](full-tests.log) |
| Initial new persistence/panel and existing posting tests | 19 tests / 3 files | [Focused tests](focused-tests.log) |
| Posting destination regression, including lost hearth and cell zero | 5 tests / 1 file | [Destination regression](destination-regression.log) |
| `pnpm typecheck`, `pnpm lint` | Both exit 0 | [Typecheck](typecheck.log), [lint](lint.log) |
| `pnpm content:validate` | Valid; seal `015468d1` | [Content](content.log) |
| `pnpm build` | Exit 0; existing large-chunk warning retained | [Build](build.log) |
| Posting templates, existing group postings and damaged-response recovery | 10 Chromium journeys, 56.2 s | [Gameplay](browser.log) |
| Generated production template and existing group posting journeys | 2 journeys, 7.8 s | [Production](production.log) |
| Final production text-scale lower-controls coverage | 1 overlapping journey, 5.8 s | [Enlarged text](production-text.log) |
| Mature-realm rerun retaining the transfer JSON on disk | 1 overlapping journey, 20.1 s | [Transfer capture](transfer-browser.log) |

The two new unit files add fifteen tests, and the existing posting file adds the
lost-destination regression. No test was disabled, softened or given a longer
timeout. No sim/AI/campaign schema changed, so no pacing run or historical rules
fixture regeneration was needed. Existing historical/replay cases ran in the
full suite. The new browser journey independently exports and replays its actual
100 accepted posting commands to the applied hash.

The single authored Legendary application records **4,401,207 transferred bytes**,
one final worker publication and approximately **1.9 ms** for its existing command
phase. [Raw capture](transfer-results/posting-templates-a-recall-f7dd5-s-saved-recovery-and-replay/posting-template-transfer.json).
This is a single browser sample, not an end-to-end performance benchmark, sustained
memory result or release-scale budget acceptance. The library itself adds no
worker traffic before application. The fixture contains forty owned hearths,
one hundred owned armies and four thousand armies overall; it is authored, not
an organically earned empire.

### Review and visual evidence

[Independent source/evidence review](source-review.md) covers preference isolation,
strict/versioned storage, racing writes, panel lifetime, campaign resets,
destination safety and honest scope. Native PNGs are retained in the browser and
production result directories; [images.json](images.json) records paths, dimensions,
hashes and capture settings. There are no pixel edits, generated images or new
runtime art assets.

The first 130% text-scale locator screenshot was incomplete because the modal
scroll area clipped its lower controls. It remains as upper-panel evidence. A
follow-up native viewport capture scrolls Delete into view, verifies its whole
rectangle is inside the modal, and exercises deletion after keyboard Recall.
The [lower-actions capture](production-text-results/posting-templates-producti-66f94-rders-and-saved-restoration/production-posting-templates-text-scale-actions.png)
completes the visual review. This was an evidence gap, not a failed runtime check;
all test runs passed without retries.

## Remaining scope

This advances ACT-32/M3's reusable orders; it does not complete M3 or a release
gate. Patrol/escort behavior, multi-step army programs, governor decisions,
coordinated overseas wars, broader content/magic/politics, online campaigns and
integrated release acceptance remain open. All fifteen release gates remain open.
DH-021 remains open. This slice does not change the headline pacing measurements.

The [developer dispatch](dispatch-draft.md) remains draft, following the journal's
published-only content contract. The published catalogue remains pinned to its
reviewed September source until an authorized publication can update that same
catalogue with immutable October evidence. No competing roadmap was created.
