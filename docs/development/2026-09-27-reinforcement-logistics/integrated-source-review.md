# Independent integrated-delegation source review

Reviewed 2026-09-27: `packages/test-fixtures/src/empire-delegation-fixture.ts`, its mature-campaign and authored-land helpers, `tests/gameplay/empire-delegation.spec.ts`, and `integrated-acceptance.md`. No blocking source finding. The reviewer did not author this fixture or journey, and ran no constructor, test, browser, build or benchmark during this review. Final browser acceptance remains pending.

## Fixture and disclosure

The source correctly identifies a synthetic mature Huge/gen4/seed20260905 campaign. It authors 30 owned hearths, a finite purse, market infrastructure and 128 owned combat armies. The two surviving rival hearths do not mean only two rival factions or armies exist: the mature fixture's other factions and forces remain in the world. This is suitable for a joined workflow exercise, not evidence of organically earning an empire.

The disclosed 720-cell frontier patch is selected away from existing claimed land and foreign army positions. Former foreign garrisons are displaced to passable, non-owned-center cells before ownership changes. The three frontier hearths and local own companies are deliberately placed within the patch. Terrain/resource changes, the stranded reserve's water ring and the remaining threat's water ring are authored setup, not gameplay commands. The threat ring rejects occupied army/hearth cells before changing them. Land and sight are rebuilt using explicit authored helpers, and the final snapshot crosses the strict save loader.

War declarations require actual contact. The original interruption comes from ordinary queued travel, a real foreign move and End turn, and is asserted paused before subsequent isolation. Moving that interrupting patrol back home and isolating the remaining visible enemy are openly disclosed. Those changes intentionally remove an unrelated tactical interruption while retaining the paused route and a visible reinforcement input. They cannot support claims about enemy inability to attack, safe organic frontiers, or tactical combat acceptance.

## Joined workflow and continuation

The journey imports through the real portable-file control. It checks wars, a paged event journal, exception navigation, saved selection recall across a 25-row registry, a 30-hearth charter change preserving queues/coin, browser-local production-template recall, and finite shared-treasury production with exact paid prefixes and refusals. Travel review proves unchanged canonical hash and one preview request, followed by actual partial application preserving postings. The theater portion uses a 390px viewport and keyboard controls, requires the attention link to select/open/focus the correct theater, then checks actual visible-threat demand, accepted/refused allocation, a direct override and detachment preserving existing routes/postings.

The saved-continuation reference is an actual UI End turn, including ordinary AI orders. Both manual reload and portable reimport resume the same saved campaign and produce exactly the same serialized canonical future as that uninterrupted reference. Every exported campaign independently replays its complete available archive to the same serialized state. This avoids the earlier incorrect oracle of comparing an AI-inclusive UI round to only a bare simulation End turn. It proves this authored continuation, not every seed or historical archive.

## Observation and evidence limits

The development readback calls inspect summary/hash only. The worker subclass forwards each original message and transfer option unchanged, records request/reply metadata and the worker's existing numeric metrics, and adds no gameplay query or simulated reply. Its elapsed times include queueing, execution, cloning, browser assertions, screenshots and neighboring development work. They are correctly labeled observations rather than quiet benchmark or rendering-gate results.

The retained failed attempts disclose the exact-label selector error, real dialog focus-ordering defect, real AI tactical interruption and a later import timeout whose resource-contention cause remains a hypothesis. The focus assertion and timeouts remain intact. The parent's cancellable animation-frame correction is reviewed separately in `next-action-review.md`. A passing final browser run and reviewed native captures are still required; this source verdict closes no M3 or 1.0 gate.
