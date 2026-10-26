# 0056 — Coordinated land commissions

The hearth registry can grant or end existing land commissions for a checked or
saved selection. This extends M3's management surface without changing rules/save
37, content 015468d1, AI plans or the simulation's existing command semantics.

## Explicit spending permission

The form chooses one exact improvement, a remaining allowance **per hearth** and
one reserve level against the shared treasury. The displayed aggregate is exact
integer multiplication, even when that sum exceeds JavaScript's safe Number range.
It is total permission, not escrow, an affordability guarantee or a purchase quote.
Each assignment replaces the existing allowance. It can immediately pay for one
ordinary work; subsequent commissions observe the reduced treasury. A commission
may be accepted while waiting for funds, suitable land, siege or existing work.

Removal targets only current policy holders, leaves other selected hearths
checked, and retains paid work. Successful manual land orders keep their existing
priority. Ownership, fog, prices and resource-site eligibility remain canonical.

## Transport and failure boundary

`groupLandPolicy` carries a reviewed state hash and at most 128 distinct hearth
commands for one faction and uniform improvement/allowance/reserve. This is a
batch transport bound, not a gameplay empire limit. The worker validates the whole
envelope before mutation, sorts by stable settlement ID and records each existing
`setLandPolicy` command through the chronicle. Canonical refusal is reported per
hearth; accepted peers remain applied. There is one final state publication and
no implicit batch autosave. The archive contains ordinary individual commands,
not a new canonical batch command or history schema.

The main thread correlates every receipt with the submitted IDs and faction
before installing it. Missing, duplicate, foreign or mismatched results cannot
masquerade as success. Recorder or publication uncertainty, malformed replies and
worker failure lock later orders until a saved campaign is restored. Selection is
cleared only for confirmed accepted results. Pending batch controls lock sibling
orders and group selection; restoring a campaign resets the local batch context.

## Bounded observation and verification

The registry uses the existing compact owned policy summaries; it does not fetch
all selected hearths' tile detail pages or compute speculative prices in React.
A memoized policy map avoids repeated policy-array scans per visible row. Receipts
paginate at 25 rows and preserve the worker's stable order.

Verification covers exact ordinary-command replay, strict paid treasury changes,
reserve waits, partial refusals, malformed/stale envelopes, the 128 boundary,
paid recorder/publication failures, production browser controls, selection outside
filters, narrow keyboard use and restoration. Authored large-realm fixtures are
identified separately from generated-hearth recovery. No turn-resolution or AI
path changes, so prior pacing evidence is retained rather than reinterpreted.
Whole-realm budgeting, richer land strategy, organic mature-realm acceptance and
all existing release gates remain open.
