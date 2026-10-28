# Keep a land budget ready for the next hearth

## Identity

- Stable slug: land-budget-templates
- Publication state: draft, not in the public catalogue
- Source revision: pending verified feature commit; baseline 7c003a0
- Campaign/save/content: unchanged rules/save 37 and content 015468d1
- Categories: realm management, campaign safety, release tooling

## Player outcome

The group land-commission form can keep named presets for an improvement, a
remaining allowance per hearth and a shared treasury reserve. Save or update a
preset, then recall it in another campaign or after reopening the browser. Recall
fills the form for review. The player still chooses **Apply land commissions**
before any ordinary work is purchased.

The library belongs to this browser, not a faction or campaign archive. Removing
a preset does not cancel commissions already installed, undo paid work or refund
coin. Restoring a campaign does not restore a deleted personal preset. Denied
browser storage produces a visible error and an explicit Retry action; ordinary
manual commission controls remain available after the failed load.

## Real example and imagery

Two separate campaigns are started through the production UI with generated tiny
worlds, ordinary founding and Food worker policies. A preset is created and
renamed to **Careful terraces**, with 75 coin per hearth and a 12 coin reserve.
Saving and recalling it leave both campaign state and journal unchanged. In the
second campaign an explicit Apply pays 22 coin for genuine work and leaves
53 allowance. Its one new command replays and restores exactly. Deleting the
personal preset leaves that paid campaign untouched.

Native desktop, 390px/130% and storage-recovery screenshots, exported campaign and
JSON evidence are retained in [the work packet](../../development/2026-10-28-land-budget-templates/README.md).
No public media addition or image transform is proposed in this draft. The narrow
capture shows the 44px Recall control inside the scrollable window; it is not
proof that all form content fits at once. Displayed review records exact hashes.

## Developer explanation

A separate version-one IndexedDB preference database accepts at most 24 personal
templates with unique names, exact improvement IDs and safe nonnegative whole
coin amounts. It rejects malformed or newer data without destructive repair.
Transactions keep duplicate names and the final library slot safe across browser
connections. Personal UUIDs never enter canonical state or command history.

The library loads lazily and shares the registry's pending lock. Started writes
settle safely after navigation. Retry rereads storage rather than replaying an
uncertain write. Templates do not change ordinary simulation prices, eligibility,
reserves, save schemas, AI behavior or replay rules.

The same work session also improves the history builder's repeated Git reads,
preserving exact historical output and the existing determinism timeout. Its
separate source, benchmark, review and deployment are recorded in
[the tooling packet](../../development/2026-10-28-changelog-batching/README.md).

## Scope and road to 1.0

This advances existing ACT-32/M3 and Gate I's reusable realm controls, with
release-tooling reliability supporting Gate N. No new gameplay scope is added.
Presets are deliberate player inputs; they do not constitute automatic land
strategy, cultivation planning or whole-realm funding priorities. Organic mature-
realm acceptance, DH-021, R06 and all fifteen gates remain open.

The draft awaits a source pin and editorial/catalogue review before a public
edition. Actual test, review and deployment results belong in the linked packets;
publication alone never establishes release acceptance.
