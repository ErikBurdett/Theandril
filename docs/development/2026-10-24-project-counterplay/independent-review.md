# Independent immediate-counterplay review

24 October 2026. Reviewed the original siege command/dispatcher, prepared query
and policy, actual worker turn loops, final runtime/query/test source and retained
command evidence. The reviewer did not author those implementation or regression
files. The reviewer is separately authoring the isolated benchmark; its fixture
verification is not independent approval of that benchmark.

**No scoped runtime or regression-test blocker found in the frozen source below.**
Whole-suite, pacing, benchmark and production browser acceptance remain separate
parent-owned integration steps. This verdict does not claim those pending checks
have passed, or close R06, DH-021, ACT-32/M3 or any release gate.

## Canonical command and observation boundary

The shared helper preserves the original local refusal order and exact strings:
army ownership; land/ashore; current target sight; war; attack capability;
adjacency; movement; existing target siege; existing actor siege. No morale,
fatigue, supply or mission rule was added to the canonical command. The state
adapter's lazy visibility/war/attack/siege facts retain short-circuit behavior
for earlier failures. Success still creates the same siege fields, spends the
same movement and emits the same events. The command dispatcher still owns its
global guards.

The public query uses only the supplied permitted observation. It shares the
same local helper, and checks the neutral strategic blocker first, in the
dispatcher's victory → pending capture → battle order. Rules35 observations
advertise the capability and that neutral refusal; older observations omit both.
An unrelated private battle/capture remains absent from the observer's detailed
objects. The new field reveals the existing generic command refusal, not its
actors, location or outcome. The query's historical fallback cannot discover an
unrelated masked global phase; the new policy therefore requires the capability.

Observation-keyed WeakMap entries copy army/town primitives and war/siege sets;
current visibility is built lazily only after early guards permit it. Fresh
detached observations are required after state changes. The query neither mutates
the view nor accesses canonical state or route search. Deliberately mutating an
observation after it has been queried is outside this immutable-view contract,
as with the existing movement-query cache. Visible third-party siege occupancy
uses the already public visible-settlement ID list without requiring private
siege records.

The new tests compare query refusal/success against ordinary commands in 18
strict-save-valid cases, including private third-party sieges and unrelated
battle/capture masking. Fatigue remains an AI preference, not a new human-command
restriction. The final defensive actor-already-sieging check is tested as pure
facts because canonically spaced towns cannot both be adjacent to one actor;
the tests do not manufacture an invalid two-town campaign for that branch.

Four pre-refactor authored command seals (rules16,19,34,35) retain their original
input/results/final bytes and a fixed seal-file SHA. They are current captures of
historical execution, not invented ancient campaign archives. The initial test
run's three capability-absence failures remain retained: its command replay had
already matched, but its observation was taken outside `withRules`. The final
test scopes that observation to the intended historical version rather than
weakening the expected omission or changing the retained seals.

## Actual planning schedule and incoming offers

The prepared draft manually requested a second fresh plan after rejection. Both
actual worker loops plan only once per faction before the round advances, so
that draft alone would lose the one-turn project. This reviewer and the UI
reviewer flagged the same discrepancy. The retained rejection-only branch proves
it: the rival wins at turn28. Architecture0050 records the chosen correction.

Final diplomacy returns exactly `[respondPeace(false), besiege]` when an incoming
valid offer overlaps an immediately available project interruption. This includes
an otherwise rejected unaffordable demand: preserving reject-only behavior there
would recreate the same lost-turn defect. Ordinary rejection requires no payment,
removes the offer and keeps war/treaty/movement facts intact; command-level
reconciliation does not invalidate the proved actor/host opportunity. Each
command still passes independent canonical validation and journal recording.
Accepted peace continues to end its pass, and no general worker replan loop is
introduced.

The new regression executes one full planner result and one actual end turn for
both white peace and unaffordable demand. It compares accepted results against
an independent loaded mirror, strict-saves each boundary, checks fresh siege
quote/relevant observed facts after rejection, and replays the journal. The
project remains paused at4/5 with no victory. This supports the one-pass command
batch; actual production-worker browser execution is still required separately.

With no incoming offer, one review precedes ordinary outgoing peace and runs
during offer cooldown. The direct result contains only the immediate siege, so
later optional plans cannot reuse its actor in the same batch. It spends no
coin; the existing promised-supply-fee purse adjustment remains before diplomacy.
An active own project finishing strictly sooner preserves ordinary peace; the
saved paid-project control demonstrates the resulting own victory. No economic
prices, project durations or shared human peace-assessment semantics changed.

## Bounds, reservations and knowledge

Only active enemy projects at war, within the applicable peace horizon, with an
observed correctly owned host and no strictly sooner active own project enter
review. Protected factions include binding truces, patron/client relationships,
supply agreements and the existing pending-supply constraint. Public project
coordinates do not supply current sight: the canonical query must still accept.

The policy excludes direct routes, postings, enabled theater/patrol reservations,
siege actors, stationary missions, carried/naval forces, founders, scouts,
attached agents, command/movement blockers, spent movement and exhausted forces.
Observed hostile host strength remains a conservative eligibility threshold; it
is not a claim about hidden defenders or assault success. A legal siege quote
permits interruption, not an automatic battle or declaration of war.

There is one review per diplomatic pass, not one per enemy in the existing
48-enemy peace loop. It considers at most eight candidates sorted by remaining
time and stable ID and makes at most four public quotes total. Army/cell indexes
are built once; local adjacent stacks yield at most24 representatives. Sorting
and filtering use detached collections. Reversed observation collections retain
the same result. The nineteen guard contracts distinguish authored observations
from loadable campaign histories. The 128-actor/four-query and128-project/eight-
candidate contracts prove caps without pretending the synthetic combination is
an organically occurring campaign.

Read `implementation-focused-first.log`: **41 tests in three files pass**. The
18-case parity matrix is one of those tests; matrix rows are not added to the
test count. No test run was launched by this reviewer while parent integration
and pacing occupied the machine.

## Initial reviewed source identity

| File | SHA-256 |
| --- | --- |
| `packages/sim/src/siege-establishment.ts` | `561e00534fee33fe39eb3b7bed205a65db1f254c58583460b329b719bb680167` |
| `packages/sim/src/siege.ts` | `1ced7a2bdb9ff4f0f24aaa699e580fc702529acd07bc62deeebe2c9e4352fe60` |
| `packages/sim/src/simulation.ts` | `68a208ff19af7ad1ddf0e27fa32a044fa449ff4335f20e6629ca848e4cc9dcc1` |
| `packages/sim/src/types.ts` | `b31db6b5395606936a6f34bccc55fb76abedcc5cbc05e5260d4731854ada2193` |
| `packages/ai/src/project-counterplay.ts` | `a86f74abc3417ee9f4e483b65b24a68cf04856b783902d17a6c9a797cc4aecac` |
| `packages/ai/src/diplomacy.ts` | `1037e7b5e54a6445705f7b52c22ef1a8209f220cbd1b8fa41e3ee2e7c2e498f8` |
| `packages/ai/src/index.ts` | `579c1f300b0b0322e3ae83c9b2d1807b38846abfad73dcc7609da87b5ebadd16` |
| `packages/ai/src/project-counterplay.test.ts` | `4e19b592b7dee0d42d9284a2d4a7d9dc05143cee82e7fd195bb2afa0712575d6` |
| `packages/sim/src/siege-establishment.test.ts` | `675a1b16dde6c9c107b72851c6d1d52003e8d6b567ecdc9459cd830f35a168df` |

## Follow-up: preserving an existing project interruption

The initial scope above did not cover a later offer while our siege already
paused the project. The retained `following-watch-incoming-archive.json` and
`following-watch-no-offer-archive.json` expose that defect in actual once-per-round
Watch continuation: at turn30 the AI accepts peace, lifting its siege; the rival
then completes its project at turn31. The initial query, command batch and first
eight benchmark results remain valid evidence for their narrower scope. They do
not establish that the AI maintains the interruption on later turns.

The extension adds a bounded `peaceBlockedFactionIds` result. A paused project
qualifies only when an actual observed siege belongs to our faction, matches its
currently visible correctly owned host, and that host is unoccupied. Canonical
occupation precedes siege as the pause cause, so the occupation exclusion matters.
No reason-string parsing, foreign siege, unrelated siege or merely public project
coordinate establishes this condition. Existing war, protected faction, horizon,
capability, global phase and strictly-faster-own-project guards still apply.

An incoming offer from the affected rival is rejected with one ordinary command;
no siege is reissued. Outgoing peace skips only the affected faction, and normal
planning continues, including optional research, assaults and other work. This is
not a generic refusal of peace with all project owners. Direct attack, movement,
leader and delegated-order eligibility remain requirements for establishing a
new siege; maintaining a valid existing siege does not require a second idle actor.

Active and qualifying paused projects share the same stable eight-candidate
cohort. New siege quotes share the existing four-query cap. Exhausting those
quotes continues scanning the bounded cohort for existing own sieges instead of
returning early. The blocked faction list is deduplicated and bounded by eight;
paused checks issue zero quotes. Permitted cell visibility is indexed at most once
per review. A successful new siege still ends that pass before any peace proposal.
Observation collections remain unmodified. No canonical rules or save schema changed.

The 15 maintenance regressions include an actual paid faster-own-project peace
and victory control, nine explicitly authored negative observation contracts,
four-refused-quotes-before-maintenance and 128-paused-record bounds. The synthetic
contracts are not loadable organic campaign histories. The full five-round Watch
tests execute every ordinary proposal and actual battle/capture resolution, then
strict-save and exactly replay their journals; they do not suppress optional
commands to keep the siege alive.

Both Watch branches keep the rival paused at4/5 through turn31. Without the initial
offer, the host is captured and its project cancelled at turn32. With that offer,
an actual assault ends in mutual withdrawal, lifts the siege and allows the rival
to win at turn32. That retained adverse battle result is not a peace-policy failure
or a promise that every interruption wins the campaign. Separate player-mode
continuations stop at the real player battle boundary at turn28.

Read `maintenance-focused-second.log`: **51 tests in three files pass**, including
the 15 maintenance tests. These overlapping runs are not additive to the original
41. The source review finds **no scoped blocker in the extension**. Final whole
suite, pacing, ten-case measurements and browser evidence remain separately
owned integration checks; this review does not independently certify their runs.

| Changed/added file | Final reviewed SHA-256 |
| --- | --- |
| `packages/ai/src/project-counterplay.ts` | `9bf7dcf423417fa6f1dc827de673a7d74735cd8ae110f828287298ecaaaabc0b` |
| `packages/ai/src/diplomacy.ts` | `9be08ca4e52f7cbaa08cbef6245fc0afff19ee70164a4473770ab53aad1b4d37` |
| `packages/ai/src/project-counterplay-maintenance.test.ts` | `641810b0263f96cf462d836cdc81174d7deca1cd0667cd2a3f6dd0db3181ab7b` |

The original counterplay and canonical query tests and the canonical implementation
retain their initial reviewed identities above. Original measured source bytes
are also retained under `initial-benchmark-source/` and checked against all twelve
hashes recorded in `counterplay-benchmark.json` before copying.
