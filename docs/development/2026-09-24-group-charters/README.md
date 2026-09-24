# Group hearth charters — 2026-09-24

Continued authorized development advances ACT-32/M3: select owned hearths across
search and 25-row registry pages, then apply or revoke existing standing charters
in groups of up to 128. Separate army/hearth selections survive tab changes.
The form explains per-work ceilings, shared treasury reserve, queue precedence
and Muster upkeep. Existing policies and canonical blockers appear in the rows.

Assignment and revocation do not spend coin or replace production queues.
Individual town orders still override only that town. Accepted commands leave
the selection; refused towns remain with their canonical reasons. Selections
are temporary; charter policies survive saving and loading.

## Authority and measured scope

Rules/save **31**, content **015468d1**, prices and AI are unchanged. The worker
reuses `setCharter`, strict bounded transport validation and normal journal
recording. One final observation is published after stable-ID execution. A
recording interruption reports actual partial state and requires recovery;
damaged response/display paths also release pending work and require restoration.

The authored Small/gen4 worker fixture applies 40 charters, including two hearths
with paid manual queues. Group and serial paths have identical archives, replay
and hash **e204a0e9**. Accounted response bytes are **193,929 versus 7,409,845**,
one versus 40 responses; the grouped results use 1,981 bytes. These measurements
include normal permitted summaries, not an entire world mirrored into React.
[Worker review](worker-review.md) separates one illustrative timing sample from
byte counts and from the larger browser fixture. It makes no full-campaign or
frame-time claim.

## Verification

- [Typecheck](typecheck.log) and [lint](lint.log) pass.
- [Content validation](content.log) and [art validation](art.log) pass.
- [Affected gameplay journeys](browser-final.log): **12/12**. The new flow uses
  the authored Legendary fixture with 40 owned hearths, 100 owned armies and
  4,000 total armies. It proves cross-page/filter/tab selection, keyboard input,
  one response, unchanged treasury/queues/fog, individual override, narrow
  revocation and exact manual-save restoration. Separate cases exercise real
  capacity refusal and two damaged-response recoveries. Existing charter,
  posting and registry scenarios remain covered.
- [Screenshots and provenance](screenshots/provenance.json): exact untransformed
  1440×1000 and 390×844 screenshots inspected. The narrow capture deliberately
  leaves the grant ceiling empty: grant is disabled while existing charters can
  still be revoked. This is an authored regression, not organic empire growth.
- [Independent integration review](integration-review.md) and
  [independent client review / worker evidence](worker-review.md) found no
  actionable defect; each states which code its reviewer authored.

[Whole-suite result](tests.log): **1,889/1,889 tests across 235 files**, run locally
with four workers in 71.70 seconds. These include the scoped tests above; counts
are not added. The [Pages-subpath build](build.log) passes. The new
[production charter journey](production-charters.log) passes through actual
founding, group assignment, individual inspection, save, narrow revocation and
restoration without development hooks. Full publication checks follow separately.

## Failed attempts and corrections

The first [browser run](browser-initial.log) had three selector timeouts:
`getByLabel(..., exact: true)` included dropdown option text. The tests now use
the actual accessible combobox name. No timeout or assertion was weakened.

The first [whole-suite run](tests-sandbox-failure.log) was blocked from spawning
Git and pnpm by the sandbox. The authorized retry encountered a
[Git-history test timeout under concurrent load](tests-contention.log). The
final local run limits test workers to four; test timeouts and assertions remain
unchanged. TypeScript content/art tools also required their ordinary local IPC
socket outside the sandbox.

## Remaining scope

Theater/patrol/escort roles, durable named groups, saved reusable templates,
broader governor decisions and combined mature-campaign acceptance remain.
No gameplay scope was added or cut. This advances the existing empire UI,
authority and save/replay obligations; **all fifteen release gates remain open**.
No pacing rerun is required for this UI/transport change. The unchanged latest
headline evidence still has Standard 234 and Long 342 above their approximate
targets, with Epic 379 inside 350–400.

Architecture: [0040](../../architecture/0040-group-charters.md).
Dispatch work packet: [group charters](../../updates/group-charters-work-packet.md).
