# Worker stewardship, deployed — 2026-10-25

## Prompt

“Continue.” Standing instruction: continue toward 1.0 and commit/deploy each feature
or fix to the GitHub Pages development site.

## Delivered

Hearths can retain Balanced, Food, Industry, Coin or Knowledge worker priorities.
Assignments update immediately and after growth/land completion for the next
harvest. A successful direct worker order returns control to the player; removing
a policy preserves current assignments. Siege/occupation waits; ownership loss
removes the policy. Policies use legal claimed land without spending or building.

Individual controls and checked registry groups support application/removal,
saved selections, per-hearth receipts and safe restoration after uncertain replies.
The group limit is 128 hearths, with no silent truncation or implicit batch autosave.

Feature `97b248e` and the reviewed journal/feedback correction `c026d3d` are
separately deployed and publicly verified. [Play](https://erikburdett.github.io/Theandril/)
and [read dispatch 21](https://erikburdett.github.io/Theandril/updates/dispatches/?dispatch=worker-stewardship).
ACT-32/M3 advances; no tracked issue or release gate is declared closed.

## Changed

- `packages/sim`: canonical policies, commands, allocation, ownership cleanup,
  observations, rules/save 36 and preserved historical 35 seals. Content 015468d1
  is unchanged. Allocation scans all governed claims using a bounded top-k heap.
- `packages/ai`: conservative full-employment adoption; scarce-worker, material
  extraction and fiscal decisions remain with the existing strategic planner.
- `packages/chronicle` and `packages/persistence`: version 36 compatibility and
  historical/mixed replay verification.
- `apps/web`: individual/group forms, worker transport and correlated receipts,
  stale-intent checks, uncertain-publication recovery and corrected plural feedback.
- Production browser scenarios, pacing/scale tools, genuine prechange fixtures,
  ADR0054, status/roadmap, reviewed dispatch and exact native screenshot provenance.

## Verified

[Implementation packet](../2026-10-25-worker-stewardship/README.md) and
[publication packet](../2026-10-25-worker-stewardship-publication/README.md):

- [Final full suite](../2026-10-25-worker-stewardship-publication/tests-final.log):
  **2,434 tests / 294 files pass in 62.45 seconds**. Typecheck, lint, content/art
  validation and the production Pages build pass.
- [Whole local Pages suite](../2026-10-25-worker-stewardship-publication/browser-final.log):
  **all 72 cases pass in 4.9 minutes**. [Final public suite](../2026-10-25-worker-stewardship-publication/live.log):
  **all 16 journal/policy cases pass in 1.4 minutes** without retries. These scopes
  overlap earlier targeted/local/live runs and are not additive.
- Both exact-commit GitHub workflows and public byte/source/image/roadmap readback
  pass for each publication. The journal pins reviewed source 97b248e and preserves
  historical entries and image bytes.
- [Original 35 fixture metadata](../2026-10-25-worker-stewardship/prechange-metadata.json)
  and strict migration tests preserve genuine prechange archive bytes/seals, with
  exact new-version continuation. No historical fixture seal was replaced.
- A real generated hearth grows to population 2 and workers 2 through ordinary
  commands. Narrow manual takeover, thirty-hearth batches and three actual-worker
  reply faults preserve exact exported replay/restoration and checked selections.
- [Final headline pacing](../2026-10-25-worker-stewardship/pacing-after.json)
  remains 219/329/374 turns on the standard-map twelve-realm seed. The retained
  broad-adoption experiment slowed campaigns; narrowing AI adoption restored
  baseline pacing without changing prices or proxy bounds. Only Epic installs
  policies in this final sample, so matching turns are not universal equivalence.
- [Authored scale benchmark](../2026-10-25-worker-stewardship/benchmark.json):
  fifteen-turn exact saved mirrors for 32/40 hearths and a 10,000-claim estate.
  Isolated idempotent policy rescans have p95 times 1.27/1.49/8.35 ms; complete turns
  are measured separately. This excludes AI planning, browser, disk and organic
  maximum-scale acceptance.
- Independent sim/AI, group-transport and individual-UI reviews pass. Independent
  editorial/layout review checks pinned evidence and sixteen actual journal
  captures across four viewport/text settings. Exact native screenshot bytes are
  retained; numeric art validation alone is not visual approval.

Initial synthetic-history, historical-hash, benchmark-fixture and browser/type
failures are retained with corrections. The first whole Pages run had 71 passes
and one stale historical-hash assertion; the final 72-case run passes. An interrupted
Git upload succeeded on unchanged retry. No test was disabled or runtime schema
relaxed to achieve publication.

## Not done / caveats

Paid land automation, budgets, broader governor decisions, organic mature-realm
acceptance and wider browser acceptance remain open. Resource extraction is
separate from yield priorities: reallocating workers can stop material output.
The small journal strip requires its readable caption/inspection link on mobile.

DH-021 remains open: headline Long 329 is still late against the roughly 300-turn
target, and earlier adverse seeds were not rerun in this slice. ACT-32/M3, R06
and all fifteen release gates remain open. Deployment is development availability,
not 1.0 acceptance or a completion percentage.

## Follow-ups and checkout

Continue M3 with paid land-work choices, explicit budgets/interruption behavior,
material consequences and AI use; then prove combined delegation in an organically
developed mature realm. Preserve manual overrides and exact historical replay.

At report authoring, the primary checkout `/home/telephoneheater/Work/Theandril`
is on master with HEAD and origin/master at published
`c026d3dc8ac86dba9deb56d5287714e247fd04b6`; only this documentation/evidence follow-up
is uncommitted. Its final checkout/deployment verification is reported in the
completion response to avoid a self-referential commit pin.
