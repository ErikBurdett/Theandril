# Victory readiness and the next counterplay slice

Date: 2026-10-24. Read-only review during publication verification. No runtime
source changes, campaign runs, authored state changes or policy experiments were
performed. Reviewed core/simulation/AI instructions and the committed corrected
patrol campaign evidence. This is a candidate diagnosis, not a completed fix.

Follow-up: the competing-adjacent-town probe suggested below was ruled out by
canonical settlement spacing before a fixture was written. See
[endpoint-retirement-diagnosis.md](endpoint-retirement-diagnosis.md) for that
correction and the subsequently reproduced, dependency-ready patrol defect.

## Finding: no demonstrated persistent funded-project starvation

The readiness and actual proposal streams do not support moving project starts
ahead of all diplomacy or changing prices to repair a current starvation bug.

| Retained campaign | Realm | First fully eligible and funded observation | Actual start | Intervening ordinary decision |
| --- | --- | ---: | ---: | --- |
| Earlier Long, before patrol recovery | Saltwind Remnant | 293,32,023coin | 295 | Two outgoing40coin peace offers, turns293/294 |
| Corrected Long | Glass Tide | 296,32,208coin | 296 | None |
| Corrected Long | Saltwind Remnant | 296,32,059coin | 296 | None |
| Corrected Standard | Saltwind Remnant | 199,18,032coin | 199 | None |
| Corrected Standard | Glass Tide | 213,18,002coin | 214 | Answers an incoming peace offer on213 |

Sources: [pre-recovery Long](../2026-10-24-patrol-recovery/diagnosis-long/summary.json),
[corrected Long](../2026-10-24-patrol-recovery/diagnosis-recovered/summary.json),
[corrected Standard](../2026-10-24-patrol-recovery/diagnosis-standard/summary.json),
and each directory's `readiness.jsonl` and `proposals.jsonl`. Corrected Long is
turn336/hash`bb2a4ca1`, Glass Tide prosperity; Standard is
turn219/hash`f570049e`, Saltwind prosperity. Their earlier equivalence records
tie them to the parent's pacing matrix.

Corrected Long proposal sequences3558/3562 start both projects immediately on296.
Standard sequence2400 starts Saltwind's project on199; Glass sequence2567 accepts
peace on213 and2579 starts on214. Review covered every realm's readiness rows,
not only the eventual winner. Changed eligibility/affordability is always logged;
the between-row state can be carried forward to the next ordinary plan. Raw coin
balances between rows are not inferred.

The source explains finite interruptions:

- `packages/ai/src/index.ts:37` reserves outstanding supply fees before any
  discretionary work; a legally funded project need not have a free policy
  purse. Existing `supply-access.test.ts:156` explicitly protects that promise.
- `index.ts:41` returns the diplomatic decision, followed by patronage/supply
  answers and siege decisions through49. A newly accepted peace needs fresh
  facts before any attack proposals; that early-return design is intentional.
- `packages/ai/src/progression.ts:93` chooses a host from actual public
  eligibility, and94–95 starts a funded project as soon as that planner runs.
- `packages/ai/src/diplomacy.ts:35` considers at most48enemy relations, enforces
  duration/cooldown and one pending offer, then returns one proposal. This can
  consume passes, but the corrected evidence does not show indefinite funded
  suppression.

The older two-turn interruption is genuine, but finite. The corrected Glass
one-turn incoming-response interruption is consistent with the existing
fresh-observation rule. Neither establishes the main source of the long funding
interval or warrants removing diplomacy from the turn to meet one pacing target.

## Counterplay evidence and its limits

The corrected Long projects start at296 in settlement532/13775 (Glass Tide) and
settlement55/19619 (Saltwind). During their remaining campaign window, other
realms propose two wars and one peace against Glass, and four wars and three
peaces against Saltwind. Neither host receives a recorded direct `moveTo`,
`queueMovement`, `besiege` or `assault` proposal. The winning project completes
40/40; Saltwind's other project is39/40 when that victory stops the campaign.

In corrected Standard, Saltwind starts at199 in settlement55 and wins at219.
Opponents propose five wars and one peace against it in that window, with no
recorded direct movement destination, siege or assault naming its host. Glass
starts its project at214; that host likewise receives no such proposal before
the other realm wins.

These counts demonstrate uncontested host records in the retained proposals,
not a proven available attack that the AI refused. Ordinary approach moves can
target an adjacent hex rather than the host itself. The diagnostic does not
retain every opponent's army positions, movement preview, siege quote, fatigue,
binding treaties and incoming-offer identities at each project-window decision.
Therefore it cannot prove that any particular peace was strategically wrong,
that a counterattack could arrive before victory, or that project targeting is
absent. It would be misleading to call this a reproduced campaign counterplay
defect without that additional local witness.

## Concrete source lead

The AI already recognizes known project hosts. `packages/ai/src/index.ts:128`
ranks active/paused foreign project hosts ahead of other **known** enemy towns.
The local movement score at348 gives a project host a1000bonus, alongside
distance costs of500per hex; the objective neighborhood at337 is18hexes. These
are bounded existing heuristics, not a complete durable operation. At320 the
adjacent siege choice uses neighbor order and does not carry that project-host
priority into the immediate target choice. This is a second narrow regression
candidate if two legal adjacent objectives compete.

The most focused first candidate is **project-aware peace decisions when a
real, immediate counterplay option exists**:

- `packages/ai/src/diplomacy.ts:24–25` accepts solely from the shared peace
  assessment. Its outgoing-offer branch at35–47 considers war duration,
  exhaustion, observed strength and treasury, but never `view.projects`.
- `packages/sim/src/diplomacy.ts:181–201` likewise considers no public victory
  project; at199 it rewards a ten-turn binding peace as recovery time regardless
  of whether the opponent's active project could finish within that interval.
- `index.ts:41–42` gives this choice priority over the existing military/project
  logic. A peace may therefore protect a public enemy bid even when the actor
  could legally interrupt its host now. This is a source-supported hypothesis;
  the retained campaign logs do not by themselves provide the missing reachability
  witness.

## Recommended minimal playable slice after live verification

Begin with an ordinary-command regression, not policy tuning:

1. Use the existing prosperity and combat fixture facilities to establish an
   active enemy project through paid research, institution and project commands.
   Position a capable owned company next to its observed host, establish war
   through a legal declaration, and advance the project through actual turns.
   Supply a real affordable peace offer whose truce covers the remaining project
   interval. Preserve the exact failing state and current planner result.
2. Prove a legal immediate host-interruption command using the canonical query
   and then execute it on a separate saved copy. If that proof fails, do not
   label refusal of peace the correct policy. Avoid inventing hidden terrain,
   hostile strength, affordability or siege eligibility in the observation.
3. The narrow desired behavior is to retain a currently legal opportunity to
   interrupt an imminent public enemy project when deciding whether to offer or
   accept a protective truce. Do not indiscriminately reject peace with every
   realm that has a project. Test unavailable routes, exhausted forces, blocked
   hosts, already-binding treaties, and a faster own project as counterexamples.
4. Carry the actual chosen ordinary commands through project interruption,
   player-visible reasoning, save/reload and journal replay. Keep the existing
   one-decision/fresh-observation rule for agreement responses. If shared player
   peace assessment changes, treat its history/UI implications explicitly; do
   not hide a new canonical rule inside AI or silently alter old-rules behavior.
5. Preserve current prices, command/search caps and proxy bounds. Run relevant
   diplomacy/progression/warfare tests, historical execution evidence and the
   unchanged headline multi-seed pacing matrix before accepting the slice.

If the first authored regression does not demonstrate the suspected behavior,
the next bounded probe is the adjacent-target priority case at`index.ts:320`:
two legally investable enemy hearths, one hosting a public imminent project,
with ordinary neighbor ordering favoring the unrelated hearth. Establish the
failing real command choice before modifying that preference.

This advances the existing R06 executed project-counterplay obligation rather
than adding a competing roadmap. It is deliberately smaller than a generalized
saved war-operation system. The current evidence supports this next regression
and playable counterplay slice; it does **not** support claiming funded-victory
starvation, eliminating peace, fixing DH-021, or completing R06/1.0.
