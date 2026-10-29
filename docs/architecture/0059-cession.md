# 0059 — Cession: a hearth passes between patron and client

Rules/save **39** (the same local version as subject rule) adds `cedeSettlement`:
a realm gives one of its hearths to the realm its oath binds it to, in either
direction. It is the "permitted settlement transfer" the M1 roadmap and Gate G
list beside client rule. Nothing is paid and no consent is asked: the oath is
the permission, and a hearth is never a burden its receiver may refuse.

## Conditions

The hearth must be owned by the giver and the receiver must be the giver's
patron or one of its clients. The giver keeps its capital. A besieged or
occupied hearth, one hosting the giver's own victory project, one with an
officer lodged in it, or one with any army on its hex cannot pass: everything
standing on it leaves first, so no army or officer is ever found inside another
realm's walls. The hearth panel lists each bound realm with the first failing
reason, and the control only appears when an oath exists.

## Consequences

The hearth keeps its people, buildings, devastation and land; production orders
are cancelled and its charter and muster end with the old rule. Ownership,
sight, worker and land policies, the capital of a realm that lost one, standing
groups and theaters, supply agreements, character missions, roads and every
realm's land memory follow the same post-command reconciliation that a capture
uses. Both realms receive a `settlement_ceded` event. Pledged hearth counts for
Unification follow ownership: a patron that cedes a hearth to its client still
counts it, a client that cedes one to its patron counts it as the patron's own.

## AI

No AI realm cedes a hearth. The planner neither proposes nor evaluates cession;
only human players use it, which is recorded as a limit of this checkpoint.

## Compatibility

The command exists only in the rules-39 command schema; older rules never accept
it. No canonical field is added, so saves, seals and projections are unchanged.
