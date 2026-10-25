# 0055 — Budgeted land-work commissions

Rules/save 37 extends M3 delegation with a paid improvement policy for an owned
hearth. The player selects an exact improvement, a total remaining allowance and
a treasury reserve. Existing improvement definitions and ordinary construction
quotes remain authoritative; no content or price changes are introduced.

## Payment and selection

`setLandPolicy` installs/replaces `{settlementId, factionId, improvementId,
allowance, reserve}`. The allowance is permission to spend, not escrow. Reapplying
explicitly replaces the remaining allowance. Installation may immediately start
one order. A blocked commission waits, including when prior paid work exists.
At turn resolution, commissions run after harvest, growth, worker reassignment,
upkeep and existing production charters. New orders gain no progress that turn.

Only charted, legal, currently worked and unimproved claims qualify; the free
center does not. Resource-bearing cells require their deposit's matching
extraction improvement. Commissions never replace existing sites, claim territory
or cultivate a biome. Among legal affordable orders they choose the lowest real
coin quote, then numeric cell ID. A quote must fit both the remaining allowance
and treasury above reserve. The shared ordinary construction path validates and
pays once, records actual work and emits its normal event; the commission then
decrements its allowance by exactly that payment. No recurring allowance refill
or refund is implicit.

## Control and ownership

Successful direct `improveTile`, `terraformTile` and `cancelLandWork` orders end
that hearth's commission after validation; failed commands retain both policy
and hash. Worker changes and land purchases keep it. Explicit commission removal
preserves active paid work. Siege and occupation pause starts using the ordinary
land blockers; existing paid work retains its existing pause/cancellation rules.
Capture, liberation and razing remove the former owner's commission immediately,
so recapture cannot resurrect permission to spend.

## Observation and cost

The owned `landPolicies` observation is compact, detached metadata plus cheap
current-work, occupation, siege, reserve or exhausted-allowance reasons. It never
constructs candidate tile quotes for every published UI summary. A requested
hearth land-detail result includes `landPolicyChoice`: actual next cell, coin,
turns and blocker across all worked cells, regardless of the UI's tile page.
No-policy detail requests do not compute a speculative form preview.

Selection runs in O(worked cells) time with O(1) candidate memory, sharing owner
read contexts across commissions. Treasury refreshes before each policy, so
previous spending cannot make a later quote reuse a stale purse. Geometry is not
cached for every one-time candidate. State capacity is the finite 350,000-cell
world, not an artificial empire-development ceiling.

## History and acceptance

Save 37 migrates older campaigns with independent empty policy arrays. Strict
rules/save 36 rejects future fields and commands, retains its byte projection,
and cannot silently discard nonempty land policies. The genuine prechange 36
save/archive captured at `657a4a5` preserve original bytes, checksums, worker
policies and recorded outcomes. Mixed 36-to-37 continuation remains explicit.

The AI remains a client of the command API. Its policy adoption must preserve
observed strategic selection and current funding constraints; humans can grant
multi-order allowances. No hidden-resource knowledge enters either consumer.

This slice does not complete M3 or a release gate. Paid claims, cultivation,
replacement decisions, whole-realm budgets and organically matured empire
acceptance retain their existing obligations. Local benchmark and browser evidence
belong to the implementation packet; this ADR alone is not acceptance evidence.
