# Theandril implementation status

## Ward breaking: the counter-rite — 2026-10-29

Rules/save 41 makes seam warding contestable. A Waykeeper of the second Rune
degree riding with a company that besieges a warded hearth breaks the ward for
four ashglass once the realm knows Measured unbinding; the ward ends at once,
the caster who held it is jarred for two turns so the walls cannot be re-warded
immediately, and both realms read who broke it. The rite is quoted on the siege
side with its target and on the defending side with its reason. A besieging AI
realm with such a caster breaks the ward instead of lifting the siege. Save
version 41 changes no field; v40 envelopes migrate unchanged and rules 40
refuses the rite as unknown.

Verification: new sim, AI and content tests; unit **2,300 tests / 284 files**,
campaigns 57, lint, typecheck and build pass; headline campaigns remain
**362/327/227** with command and event counts identical to the seam-warding
packet, and the rules 40 projection reproduces that packet's seals exactly. The
breaking browser journey reached its last assertions once, where only the test's
wound count was wrong; after that fix every attempt failed before the campaign
loaded because the desktop's headless browser kept crashing, so the fixed
journey and the affected siege journeys are unverified in this checkpoint.
[Evidence](development/2026-10-29-ward-breaking/README.md),
[ADR0063](architecture/0063-ward-breaking.md).

## Seam warding: the first strategic rite — 2026-10-29

Rules/save 40 adds the first strategic rite. A Rune Waykeeper lodged in a hearth
whose borders hold a surveyed Rune seam binds the seam into the walls for ten
turns at six ashglass once the realm has researched Rune Binding: while the
caster stays lodged, the seam is held and the hearth keeps its owner, siege
works do not wear its defenses down and sabotage does no damage. The besieger
reads warded walls on its siege card, and every party reads why a ward ended.
The character sheet quotes the rite with its cost, term, host and exact blocker;
the siege ledger marks warded walls. A besieged AI realm performs the first rite
it can, and a besieger that cannot storm warded walls lifts the siege. Save
version 40 adds `wards`; older envelopes migrate empty and projection refuses a
standing ward. One rite of one path exists; counter-rituals remain open.

Verification: new sim, AI and UI tests and a browser journey through the real
character sheet and ledger; unit **2,298 tests / 284 files pass**, campaigns 57 and lint pass;
headline campaigns remain **362/327/227** with command and event counts
identical to the seam-study packet, and the rules 39 projection reproduces that
packet’s seals exactly, because no AI realm reaches a warded siege in organic
play. Browser journeys on this desktop had to be rerun around a headless browser
that crashed with increasing frequency; every affected gameplay case has a
passing result, the complete gameplay run was stopped by the tool at 39 passing
cases for low system memory, and 49 of 59 production cases pass while ten
crash-only cases stay unverified; all are classified in the packet. [Evidence](development/2026-10-29-seam-warding/README.md),
[ADR0062](architecture/0062-seam-warding.md).

Published as `52b8436` with both workflows and the live readback passing ([publication evidence](development/2026-10-29-publication-rites/README.md)).

## Registry inspection in AI watch and the complete browser suites — 2026-10-29

Before publication both browser suites were run end to end: the production suite
passes 59 cases on the rebuilt bundle, and the complete gameplay suite passes
242 of 248 on its first run, with four timeouts under concurrent load passing
alone and two pre-existing drifts corrected. One correction is a real fix: the
realm registry's browse, filter, sort and select controls were locked by the
same flag that locks orders, so nothing could be inspected during an AI watch.
`RealmRegistry` and `RealmRoster` now separate `inspectBusy` from `busy`; group
orders stay locked in watch. All 2,546 distinct vitest tests have passing
results. [Evidence](development/2026-10-29-full-gameplay/README.md).

## Seam study: a road to the third path for every culture — 2026-10-29

Rules/save 39 also lets a Waykeeper lodged in a hearth whose borders hold a
surveyed seam study it for one experience a turn, so a culture born without the
second degree can deepen a path in peace; a caster riding with an army, wounded
or on a mission does not study, and a hearth that loses its seam stops it. The
AI, at peace and holding a seam of every path, now appoints a Waykeeper at a
hearth that could host the working and keeps it lodged there instead of handing
it to a co-located battle army; the existing planners then deepen, finish Arcane
Theory and seal the working as each requirement is met. The personal-magic panel
says how study works. No save field changes; historical rules grant nothing.

Verification: new sim tests cover the study under rules 38 and 39, attachment,
wounds, a lost seam and exact save round trips; a new AI test covers the
peacetime appointment and the lodged caster left in place. Unit **2,292 tests /
281 files** and lint pass; headline campaigns remain **362/327/227** with
command and event counts identical to the previous slice, because no headline
realm holds a seam of every path, so the third path is still unreached by any AI
realm in organic play. [Evidence](development/2026-10-29-seam-study/README.md),
[ADR0061](architecture/0061-seam-study.md).

Published as `a7a4c16` with both workflows and the live readback passing ([publication evidence](development/2026-10-29-publication/README.md)).

## Ground in sight: natural features, remembered surveys and the AI's glass — 2026-10-29

Rules/save 39 also lets a realm see the natural features of ground in sight and
remember where it surveyed. Every explored cell currently in sight carries its
feature mask (zero masks and remembered ground omitted; historical readings
unchanged); the worker packet folds a seven-bit mask into spare terrain and
depth bits (packet versions 4–6) so a featured row costs no extra bytes; and
`arcaneSearches` records each realm's surveyed hexes, found or empty, oldest
first, bounded at 256, saved, validated, stripped from older projections and
migrated as empty from v38. The survey panel now says whether the hex underfoot
was already surveyed, shows Ashfall glass, or is a bet. The AI never pays twice
for the same ground, surveys further only when a free company already stands on
fresh glass, and marches at most one small company a turn up to four hexes to
glass it can see, only when the movement preview allows the order.

Two corrections are retained: the first glass march ignored the movement
preview and produced 176 refused orders on the Epic headline; and a per-world
feature cache returned stale bits for worlds mutated during generation and
broke the historical feature seals. Both were removed before measurement. A
third finding is the Huge starting-map packet: its 20,000-byte budget had 72
bytes of headroom and the rules-38 attunement standing had silently taken it
over, so the standing now travels only once a realm has begun the arcane road
(19,203 bytes against 19,156 under rules 37).

Verification: typecheck, lint, the full unit suite and campaign tests pass;
headline campaigns end on **362/327/227** with zero refused orders, surveys
down from 347/303/231 to 253/222/159, seams found up from 4/3/3 to 9/6/3 and
29/23/14 glass marches. No AI realm researched Arcane Theory or sealed a working
in those campaigns. Unit **2,290 tests / 281 files**, 57 campaign tests, the
production build and ten browser journeys pass, including the Huge starting-map
budget and the AI-watch chronicle.
[Evidence](development/2026-10-29-glass-in-sight/README.md),
[ADR0060](architecture/0060-ground-in-sight.md).

The map still draws no natural features; AI arcane research and the third path
remain unreached organically. Published as `a7a4c16` with both workflows and the live readback passing ([publication evidence](development/2026-10-29-publication/README.md)).

## Cession: a hearth passes between patron and client — 2026-10-29

Rules/save 39 also adds `cedeSettlement`: a realm gives one of its hearths to
its patron or one of its clients, in either direction, with nothing paid and no
consent asked, since the oath is the permission. The giver keeps its capital; a
besieged or occupied hearth, one hosting the giver's victory project, one with a
lodged officer or one with any army on its hex cannot pass until they leave.
The hearth keeps its people, buildings and land; production orders are cancelled
and its charter and muster end. Ownership, sight, policies, capitals, groups,
theaters, supply agreements, missions, roads and every realm's land memory follow
the capture reconciliation. The hearth panel lists each bound realm with the
first failing reason and confirms before ceding. No AI realm cedes a hearth.

Verification: new sim tests cover both directions, the exact kept population,
buildings and land, ended charters, unchanged treasuries, save round trips, every
refusal and the command's absence from older rules; a new browser journey cedes a
hearth through the real panel with a declined and then confirmed step and keeps
the result through save and reload. [Evidence](development/2026-10-29-cession/README.md),
[ADR0059](architecture/0059-cession.md). No pacing measurement was needed: the
AI issues no cession.

M1's "permitted transfers between patron and client" is delivered for humans; AI
use, and Gates G and H themselves, remain open. Published as `a7a4c16`
([publication evidence](development/2026-10-29-publication/README.md)).

## A unification bid lost to politics — 2026-10-29

Under the existing rules a client's hearths stand behind its patron's bid, and a
bid that falls below two thirds ends at the round's close, so an oath withdrawn
by renunciation, lapse or expiry can end a bid without a battle. This checkpoint
verifies that outcome, states it in the Victory tab, and gives the AI the
counterplay: a client realm renounces an oath whose patron holds a public active
unification bid, even at the price of a breach, and refuses a new patronage
offer from a bidding realm. The whole turn plan leads with the renunciation. No
canonical rule, save field, content or price changes; the AI reads only the
public ledger and its own oath.

Verification: a new sim test opens a bid carried by three pledged hearths and
ends it after the client renounces; a new AI test shows the acceptance,
renunciation and refusal decisions with an unchanged observation. Typecheck,
lint and the full unit suite (**2,283 tests / 278 files**) pass; headline
campaigns remain **219/329/374** with command and event counts identical to the
subject-rule runs, and the seven diplomacy and attunement browser journeys pass.
[Evidence](development/2026-10-29-bid-politics/README.md).

M1's "losing a bid to politics" is delivered as counterplay over the existing
pledge rule; patron–client hearth transfers remain. Published as `a7a4c16` with both workflows and the live readback
passing ([publication evidence](development/2026-10-29-publication/README.md)).

## Subject rule: a conquered capital bound rather than taken — 2026-10-29

Rules/save **39** adds **Make subject**, a fifth settlement-capture outcome. When a
realm's capital falls and the realm still holds another hearth, the capturer may
hand the capital back under an imposed oath: the war ends in a binding peace of
thirty turns, the defeated realm becomes the capturer's client with no subsidy
and tribute of three coin per hearth it holds, and its hearths stand behind the
patron's Unification bid. The hearth keeps its population and buildings with 10
devastation and one turn of recovery; other sieges between the pair lift. The
oath is an ordinary rules-22 bond, so tribute, lapse, release, lawful expiry and
early renunciation as a breach all follow the existing rules. The rules-22
patronage chain still applies, and when the outcome is absent the capture panel
names the reason (not a capital, no other hearth, an existing patron or clients,
the client limit). The AI keeps a capital it takes while fighting one war and
binds the realm instead when it is already at war elsewhere.

Rules 39 decisions carry `rulesVersion: 39` and five quoted outcomes; rules 16–38
decisions keep their frozen quote, so a v38 save with a pending capture loads
unchanged. Every older command schema keeps four outcomes. Projection to ≤38 is
refused only while a rules-39 decision is pending; a sworn bond projects as
ordinary state. Content **03ac0328** is unchanged, so no seal changes.

Verification: typecheck, lint and the production build pass; unit **2,281 tests /
278 files** pass with three new sim, one new AI and two new UI tests; campaign
tests pass. Headline twelve-realm campaigns end on **219/329/374** with command
and event counts identical to the rules 38 runs: no AI realm chose subject rule
there, so the outcome is proven by its fixture (the conquest fixture with a
second founded rival hearth) and real controls, not by organic AI play. Nine
browser journeys pass: the new subject journey (real capture panel, lifted war,
sworn oath in Realm affairs, exact save/reload) and the existing conquest and
diplomacy journeys. [Evidence](development/2026-10-29-subject-rule/README.md),
[ADR0058](architecture/0058-subject-rule.md).

M1's "client capture outcomes" is delivered; transfers between patron and client,
losing a bid to politics, Gates G and H and every other release gate remain
open. Published as `a7a4c16` with both workflows and the live readback passing ([publication evidence](development/2026-10-29-publication/README.md)). Next: patron–client hearth
transfers, then AI seam strategy for the third path.

## Attunement: the third victory path and personal path growth — 2026-10-29

Rules/save **38** adds **Attunement**, a victory mechanically distinct from
Prosperity and Unification. A realm that has researched every Arcane Theory
discovery, holds a surveyed seam of every magical path inside its borders and
keeps a Waykeeper of the second degree at an unoccupied, unbesieged hearth with
a Witness archive may seal a working there through the ordinary
`startAttunement` command. The pace's knowledge price (60/600/1,200/2,400) is
spent on starting and never refunded; the working advances one turn per round
through the pace's public window and ends the campaign with
`victory.path = 'attunement'`. It pauses while the host is occupied or besieged,
while any path's seam is no longer held, or while no qualified caster stands at
the host; it is cancelled when the host is conquered or razed. The project uses
the existing public ledger, so rivals see it as they see the other paths, and
the bounded immediate counterplay review already besieges an imminent working.

Two Waykeeper skills, Flame deepening and Rune deepening (24 experience, once
each, branch *Attunement*), raise a personal path by one degree to at most the
third. Cultures without a tradition can now reach Unbinding through practice;
a save recording a deepening below its second degree is rejected. The AI seals a
ready working at the safest eligible host, sends a qualified caster riding with a
land army home when the caster is all it lacks, finishes uncastable Arcane Theory
once every seam path is held, surveys further only from unsurveyed Ashfall glass
while a path is missing, and claims seams of paths it lacks.

Content **03ac0328** replaces **015468d1**: rules 24–37 envelopes keep their
original seal, load under the current pack and re-seal; `contentPackHash(…,
attunement = false)` reproduces the old seal exactly. Projecting a campaign to
version ≤37 refuses an attunement victory, project or learned deepening, and
historical command execution refuses the same; the new command is absent from
every older schema. Chronicle archives accept rules 38 and the epilogue names the
path.

Verification: typecheck, lint and content validation pass. Unit **2,275 tests /
276 files** pass with five new sim, four new AI and one new UI test; the campaign
project passes **57 tests / 10 files** including the unchanged pacing proxies.
The complete run has **2,528 of 2,529 tests / 306 of 307 files** passing; the
one failure is the existing Git-history changelog test timing out under full
concurrency, which passes unchanged in isolation, so all 2,529 distinct tests
have passing results.
Paired headline twelve-realm campaigns at seed 20260905 end on **219/329/374**
under both frozen rules 37 and current rules 38 with identical command and event
counts and zero refused orders; the rules 37 seals (`cfb8ef59`/`61983fb7`/
`fc0228a5`) match the 2026-10-25 evidence exactly. No AI realm reaches
Attunement in those campaigns: none holds a seam of both paths, so the third path
is proven by its authored brink fixture, not by organic AI play. Two new
Chromium journeys pass: a real seal through the Victory tab's host/caster
controls, five end turns to victory, the banner and the chronicle epilogue; and a
390px/130% unqualified-caster refusal. Of 22 affected existing journeys, 21 pass
and the AI-watch chronicle journey's turn-59 expectation proved stale on the
unchanged code (it ends on turn 60 under frozen rules 37 and current 38 alike);
it now reads 60 with retained evidence and passes. Production build passes.
[Evidence](development/2026-10-29-attunement-victory/README.md),
[ADR0057](architecture/0057-attunement-victory.md).

Gate B now has three implemented, human-playable, AI-pursued victory paths with
complete winning fixtures; the gate itself, Gate F2 and every other release gate
remain open. M7 begins; the M2 remainder narrows to reactive interception. Published as `a7a4c16` with both workflows and the live readback passing
([publication evidence](development/2026-10-29-publication/README.md)). Next: AI seam strategy and caster
protection for the third path, then reactive interception during an enemy cast.

## Personal land budget templates — 2026-10-28

The group commission form saves named improvement/allowance/reserve presets in a
separate browser preference library. Players can update, recall or delete them
across campaigns and reloads. Choosing a preset does not change the form; Recall
fills it for review; only explicit Apply issues existing paid commands. Template
deletion leaves commissioned work intact, and campaign restoration never restores
a deleted personal preference. Templates are excluded from campaign exports.

Strict versioned rows, known improvement IDs, safe nonnegative coin amounts,
transactional unique names and a 24-template library cap protect browser storage.
Corrupt or newer data is rejected without hidden repair. Storage denial can be
retried explicitly; started writes settle after unmount, and a successful write
followed by a failed reread is distinguished from an unsaved edit. Native writes
share the registry pending lock without self-locking the library.

Two production journeys pass, including two genuinely UI-started generated
campaigns, paid 22-coin work, exact save/replay, 390px/130% keyboard controls,
delete/load isolation, native pending locks and denied-storage recovery. Full
integration passes 2,519 tests / 305 files, typecheck, lint and production build.
Independent code/displayed review and all 81 production browser cases pass.
Feature 906138f is deployed: both workflows, exact public revision/asset readback
and seven scoped live gameplay cases pass first attempt.
[Evidence](development/2026-10-28-land-budget-templates/README.md).

Rules/save 37 and content 015468d1 are unchanged. Existing ACT-32/M3 advances;
broader paid land/cultivation strategy, whole-realm priorities, organic mature-
realm acceptance, DH-021, R06 and all release gates remain open. Next: extend
paid land strategy to deliberate cultivation choices with explicit budgets,
then prove the combined governor controls in a mature generated realm.

## Faster exact history reconstruction — 2026-10-28

The changelog builder now reconstructs every first-parent commit in bounded
32-SHA batches, with at most two Git stat children in flight. Output order still
follows Git metadata, independently of process completion. All reads are fresh;
no history, authored notes or deterministic comparison is cached or skipped.
Failures drain active children and reject the whole reconstruction. The reviewed
33MiB statistics bound preserves the old per-commit output capacity plus headers.

At baseline 7c003a0, all 116 entries / 91,905 bytes match the independently retained
old implementation exactly. Three final quiet runs have a median 4.867 seconds,
compared with the old 7.880 seconds, about 38% lower. Processes per build fall
from 117 to five. Focused tests retain root/merge/binary/empty/quoted-path behavior,
error propagation, exact notes and the existing 20-second history-test deadline.
Final integration passes 2,519 tests / 305 files, typecheck, lint and the production
build, including the unchanged history deadline. Tooling commit d60bdcb is deployed;
both workflows and exact public revision/asset readback pass.
[Evidence](development/2026-10-28-changelog-batching/README.md).

No gameplay, canonical/AI rules, save, content or CI test policy changes. This
addresses repeated local history-check timing pressure; it does not establish a
bound for arbitrary future history or close a release gate.

## Finding land commissions that need attention — 2026-10-27

A separate Land commission status filter combines with registry search and
Settlement orders. Players can find commissions, missing commissions, zero
allowances and reported waits before paging, retain off-filter checks, and revise
only chosen budgets through the existing group command. Counts overlap; zero
allowance can accompany paid work. A missing summary wait is not a promise that
land or funds permit a job. Selecting a hearth reveals its ordinary exact detail.

Detached owned-fact indexing replaces the prior policy-only map and is memoized
per observation. Historical observations without commissions hide and bypass the
selector. Shared pending locks and group receipts remain unchanged. No additional
land query, canonical/AI rule, save field or content change is introduced:
rules/save 37 and content 015468d1 remain intact.

The first production journey passes: thirty authored hearths, 128 armies and two
wars; eleven commissions, five zero allowances and eight reported waits. Browsing
leaves hash 6c3dffa5 and the archive unchanged. Five explicit budget replacements
spend 48 ordinary coin, preserve earlier paid work and replay/restore exactly at
7dbe8a11. At 390px/130% text the selector is 340×44px within its window, with no
page overflow. All 79 distinct local Pages cases pass across a retained
78-pass/one-old-help-locator failure and corrected two-journey rerun. All 2,497
distinct unit/campaign/repository tests pass across the full run (2,496 passes,
one existing Git-history timeout) and unchanged isolated six-test pass. No test
assertion or timeout was weakened. Independent code/displayed review passes;
**dd8736d is deployed**: both workflows, exact public-file readback and all five
live cases pass (48.7 seconds, first attempt). Repository history reconstruction
remains close to its existing test-time budget; batching Git reads is a tooling
follow-up, with exact historical output preserved.
[Evidence](development/2026-10-27-commission-filters/README.md).

ACT-32/M3, DH-021, R06 and all gates remain open. Broader paid land strategy,
whole-realm funding priorities and organic mature-realm acceptance remain next.

## Coordinated land commissions — 2026-10-26

The hearth registry applies or ends existing commissions for checked or saved
groups of up to 128 hearths. Exact total permission is allowance per hearth times
selected count, not escrow or a shared spending pot. Each ordinary command sees
the treasury left by earlier stable-ID orders. Accepted permission can wait for
suitable land or money. Outside-filter selections are disclosed; paged receipts
clear only confirmed acceptances. Removal retains paid work.

Strict whole-batch validation and the reviewed hash precede mutation. Ordinary
commands remain in the chronicle; one final worker publication has no implicit
autosave. Mismatched replies, recorder/publication failure and worker crashes
require saved-campaign recovery. The registry indexes existing compact policy
metadata without requesting all hearth tile quotes. Rules/save 37, content
015468d1 and canonical/AI behavior remain unchanged.

Local **2,486 tests / 300 files pass in 127.49 seconds** with two workers, alongside
typecheck, lint and the Pages build. The first full run passed 2,485 tests but hit
the existing 20-second Git-history test limit during concurrent browser work;
the unchanged isolated check and bounded-concurrency full rerun pass. No timeout
or assertion changed. Four new production journeys pass: an authored 30-hearth,
128-army, two-war realm spends 88 of 100 coin on four real works while 26 commissions
wait, followed by exact 61-record replay, removal and restoration; three generated
hearth reply-fault cases recover after actual payment. Source review passes. All 78 distinct local Pages cases have passing results
across the 76-pass/two-failure full run and seven-case affected rerun: an old
journal count and new capture scrolling were corrected without runtime changes,
assertion weakening or timeout changes. Exact narrow-form bounds and original
failures are retained. **Published as `cfd660c`**: both workflows, exact public
readback and all four live commission journeys pass (42.4 seconds, no retries).
Reviewed journal 23 integration passes 2,488 tests and 26 distinct affected local
browser cases across a retained stale-link failure and corrected roadmap rerun.
Reviewed journal **d65b016** is deployed: both workflows and exact public-file
readback pass. All 26 distinct affected live cases have passing results across
the retained 21-pass/five-network-failure run, four-pass/one-network-failure recovery
and final unchanged roadmap pass. No runtime, assertions or timeouts changed;
traces identify interrupted document/image/module loads, not a rule failure.
[Publication evidence](development/2026-10-26-group-land-commissions-publication/README.md).
[Evidence](development/2026-10-26-group-land-commissions/README.md),
[ADR0056](architecture/0056-group-land-commissions.md).

ACT-32/M3, DH-021, R06 and all fifteen gates remain open. Next: broader paid
land/cultivation strategy and combined delegation in organically developed mature
realms, preserving explicit budgets, material consequences and manual overrides.

## Budgeted land-work commissions — 2026-10-25

Rules/save **37** adds individual commissions for an exact existing improvement,
a remaining total coin allowance and a treasury reserve. They pay ordinary quotes
immediately when possible, then after upkeep and charters, without extra work
progress. Only suitable worked, unimproved cells qualify; existing sites and
mismatched deposits are protected. Successful direct work takes control back;
revocation retains paid work, while ownership loss removes the commission.
Selected detail gives the next quote or wait reason; compact summaries avoid
candidate scans. Content **015468d1** is unchanged.

Full local **2,461 tests / 298 files** pass in 67.00 seconds, with typecheck, lint
and Pages build. Genuine captured rules-36 history retains its original bytes
and seals through migration and mixed replay. Conservative AI uses exactly funded
one-job commissions for identical existing choices; headline Standard/Long/Epic
stays **219/329/374**, with 18/22/29 commission commands and no refused orders.
Three authored paid-phase benchmarks and fifteen-turn saved mirrors pass; they
do not establish organic empire, browser transfer or complete scale acceptance.
All **74 local Pages cases pass in 5.3 minutes**, including two paid works in a
generated hearth, exact saved restoration and narrow keyboard manual takeover.
Displayed controls are reviewed. **Published as `24a710a`**: both workflows,
exact public readback and both live commission journeys pass. The first live
navigation attempts failed before loading with ERR_NETWORK_CHANGED; the unchanged
rerun passes in 14.0 seconds. Reviewed dispatch 22 is published as **`3ae2ba6`**,
with both workflows and exact public readback passing. Publication integration
passes **2,463 tests / 298 files** and all nineteen affected local browser cases.
All nineteen distinct affected live cases pass across an initial sixteen-pass run
and unchanged three-case rerun; original interrupted navigation/asset/worker-start
traces are retained. No runtime or assertion changed for the live rerun.
[Publication evidence](development/2026-10-25-land-commissions-publication/README.md).
[Evidence](development/2026-10-25-land-commissions/README.md),
[ADR0055](architecture/0055-land-commissions.md).

ACT-32/M3, DH-021, R06 and all fifteen release gates remain open. Next work:
coordinated commission management, broader paid land/cultivation decisions and
combined delegation in organically developed mature realms. Preserve explicit
budgets, material consequences, manual overrides and historical replay.

## Standing worker stewardship — 2026-10-25

**Published as `97b248e`**: both workflows, exact public readback and all six
new live journeys pass (55.6seconds). Twelve targeted local production cases
pass. Reviewed dispatch21 and the group-feedback wording fix are published as
`c026d3d`: both workflows and exact public readback pass, followed by all sixteen
live journal/worker-policy journeys in1.4minutes. Final local **2,434tests /294files**
and **all72Pagescases** pass. [Publication evidence](development/2026-10-25-worker-stewardship-publication/README.md).
Five optional worker priorities apply now and after each turn's growth/land
completion for the next harvest. Direct worker orders take back control;
siege/occupation wait and capture/raze removes the policy. Registry batches use
up to128 checked hearths, saved selections, reviewed hashes, per-hearth receipts
and uncertain-result recovery. No paid land automation or implicit batch save.

Rules/save36 migrates empty policies and preserves the captured35 archive's
original seals. Content015468d1 is unchanged. All **2,432 tests /294files** pass
in65.00seconds, with typecheck, lint and Pages build. Final headline twelve-realm
Standard/Long/Epic remains219/329/374 after correcting a retained broad-adoption
AI experiment; only Epic installs policies in these runs. Three authored scale
samples include32/40hearths and10,000claims; every fifteen-turn saved mirror is
exact. [Evidence](development/2026-10-25-worker-stewardship/README.md),
[ADR0054](architecture/0054-worker-stewardship.md).
ACT-32/M3 stays partial. DH-021, R06 and all fifteen release gates remain open.
Next governor work: paid land-work choices with explicit budgets, interruptions,
material consequences and AI use, followed by organic mature-realm acceptance.
Keep the scarce-worker and fiscal decisions visible; do not relax pacing targets.

## Four-round continuation published and reviewed — 2026-10-25

All four rounds were committed, deployed and read back independently: reviewed
policy intent (`6c77de4`), group patrol assignment (`64b5d9e`), publication recovery
(`47e130f`) and named result review (`670a18a`). Reviewed dispatch 20 is published
as `1edc07f`, with **2,395 local tests / 290 files**, **all 66 local Pages cases**
in one run, both workflows, exact public readback and ten live journal cases.
Two native images preserve the existing cap and all historical records. Source
and displayed-layout reviews pass; retained failures/corrections remain explicit.
[Publication evidence](development/2026-10-25-four-round-publication/README.md),
[prompt report](development/prompt-reports/2026-10-25-four-development-rounds.md).
M3 stays partial; rules/save 35 and content 015468d1 remain unchanged. DH-021, R06
and all fifteen release gates remain open.

## Review every posting and charter result by name — 2026-10-25

**Published as `670a18a`**; both workflows, exact public readback and both live
result-review journeys pass. Round 4 adds shared, filtered 25-row result pages
for group postings and charters.
Refusals open first; accepted actors are inspectable too. Paging and filtering
leave selections and campaign records unchanged; a new submission resets review.
An authored 128-army capacity boundary gives 96 real successes and 32 refusals,
retains exactly the refused checks and replays all 128 records. A thirty-hearth
workflow grants/revokes charters with exact 60-record replay. Keyboard, last-row
visibility, empty filters and narrow 130% layout pass. Full **2,394 tests / 290
files**, typecheck, lint, build and eight affected Pages cases pass.
[Evidence](development/2026-10-25-group-policy-results/README.md). No canonical
rules, save fields, AI or pacing change; rules/save 35 and content 015468d1.
ACT-32/M3 remains partial; DH-021, R06 and all fifteen gates stay open.

## Recover after a group policy result cannot be published — 2026-10-25

**Published as `47e130f`**; both workflows and exact public readback pass. Both
live recovery cases pass after a retained pre-load network interruption.
Round 3 locks gameplay after posting/charter command execution begins and final
worker publication throws. Both old-worker and production-browser regressions
proved two accepted orders could leave End turn enabled without a recovery flag.
The fix requires saved restoration and preserves normal stale-request rejection
before mutation. Exact manual restoration and fresh retry replay pass. Autosave
policy, rules/save 35, content 015468d1 and AI behavior remain unchanged.
Full **2,386 tests / 289 files**, typecheck, lint, build and ten affected Pages
cases pass. [Evidence](development/2026-10-25-group-publication-recovery/README.md).
M3, DH-021, R06 and all fifteen gates remain open.

## Assign shared patrols across the army registry — 2026-10-25

**Published as `64b5d9e`**; both workflows, exact readback and both live journeys
pass. Round 2 of the four-round continuation assigns two shared explored points and
an explicit war option to up to 128 checked armies ashore. New policies start
enabled; existing paused/enabled states survive. Replacement resets the next
point while existing routes and postings keep priority. Ordinary simulation
refusals stay per actor; only accepted armies leave selection. Full **2,384 tests
/ 289 files** pass after correcting a registry assertion to count army checks
separately from the new war checkbox. Seven affected Pages cases pass, including
101 assignments preserving 50 paused policies/exact 206-record restoration and a
generated out-and-back patrol on turns 2/3. Typecheck, lint and build pass.
[Evidence](development/2026-10-25-group-patrol-assignment/README.md). Rules/save 35,
content 015468d1, M3 partial, DH-021/R06 and all fifteen gates remain unchanged.

## Bind group postings and charters to reviewed intent — 2026-10-25

**Published as `6c77de4`**; both workflows, exact public readback and both live
intent cases pass. Round 1 of the four-round continuation: both legacy policy batches carry the
reviewed campaign hash through form, main thread and worker. Stale or malformed
requests reject before mutation or recording; checks and form values remain for
review and retry. Controlled old-worker reproduction retained. Full local suite
passes **2,372 tests / 288 files**; typecheck, lint, Pages build and ten distinct
affected browser cases pass across the documented selector correction.
[Evidence](development/2026-10-25-group-intent/README.md). Rules/save 35 and content
015468d1 remain unchanged. M3, DH-021, R06 and all fifteen gates remain open.

## Find empty queues and waiting charters — 2026-10-25

**Published as `4e2c678`, implementation `5da6b62`.** Both workflows, exact public
readback and three targeted live journeys pass (37.7 seconds). Publication checks
pass 2,364 tests and 58 distinct local Pages cases across the initial run and a
corrected journal-expectation rerun; the retained first run was 57 passes/1 stale
assertion, followed by all ten journal cases passing. [Publication evidence](development/2026-10-25-settlement-publication/README.md).
The settlement registry filters
All hearths, No production, Without charters and Charters waiting. Overlapping
counts follow search before stable 25-row paging. Checked hearths survive filter
changes; group charter controls expose actors outside the current filter.
Canonical queue precedence, waiting reasons and next-work candidates remain
explicit. An expandable explanation and Map guide describe shared treasury and
why a completed building program or intentional limit can be a normal wait.

Full **2,362 tests / 288 files pass in 63.88 seconds**, with typecheck, lint and
Pages build. Four distinct affected production journeys pass across the initial
and refinement checks; the final new workflow takes 20.3 seconds. An authored
Huge realm with 30 owned hearths, 128 armies and two wars keeps its exact
30-record archive while browsing, then records six explicit charter changes.
The 36-record saved/reloaded outcome preserves queues, treasury, settlements,
armies, travel and standing army policies. Counts change from 30/24/10/5 to
30/24/9/0; these overlapping cohorts are not additive.
[Evidence](development/2026-10-25-settlement-order-filters/README.md).

The presentation index reads existing owned observation facts only. No canonical
rules, worker protocol, new query, saved fields, AI behavior or per-frame work
are added. Rules/save 35 and content 015468d1 remain unchanged; no pacing run or
new performance measurement is claimed. ACT-32/M3 advances but stays partial;
escorts, broader governors/programs, organic mature-realm acceptance, DH-021,
R06 and all fifteen release gates remain open.

## Correlate posting and charter results before accepting updates — 2026-10-25

**Published as `912b873`.** Both GitHub workflows, exact public readback and
all eight targeted live journeys pass (37.4 seconds). Group posting and
charter responses now match the exact submitted faction and ordered actor IDs
before adopting campaign state. Missing, duplicate, unrelated or malformed rows
require saved-restoration recovery, preserve checked actors and block gameplay.
Two actual old-build browser cases demonstrated false “2 accepted” results with
one actor left checked and End turn still enabled after real command execution.
The fix preserves the generic request primitive, worker/protocol, simulation,
rules/save 35 and content 015468d1. It adds bounded transport checks only, with no
new policy, world scan or pacing change. [Evidence](development/2026-10-25-group-response-review/README.md).
**Verification:** 2,352 tests / 286 files pass in 60.66 seconds; typecheck, lint,
Pages build and all 57 local Pages journeys pass. All twelve recovery exports
replay exactly. Independent source/image/export reviews find no scoped blocker.
M3, DH-021, R06 and all fifteen release gates remain open.

## Pause, resume and remove patrols together — 2026-10-24

**Published as `5cb7dc8`, implementation `8d880eb`.** Both GitHub workflows
succeed; exact public assets/source/catalogue match and all four new live patrol
journeys pass in 26.4 seconds. Publication acceptance passes 2,341 tests and all
51 local Pages journeys.
Group patrol controls use
existing registry checks to pause enabled policies, resume disabled policies or
remove policies. They preserve existing active/paused travel, armies, postings
and war-pause options. Unaffected and refused actors remain checked; only confirmed
accepted actors leave selection. Counts include checked armies outside the current
filter, and results remain paged to 25 rows. Ashore-only selection is explicit.

A strict 1–128-command worker envelope checks the current hash, one faction,
one action and distinct IDs before mutation. Ordinary simulation commands remain
authoritative, execute in stable order, produce one final state and autosave once.
Malformed/missing replies, recording interruptions and worker errors require
saved-restoration recovery; they never silently report success or retry. No new
canonical rule, schema, AI, price or automatic turn behavior is added. Rules/save
stay 35 and content stays 015468d1; no pacing rerun is warranted.

**Verification.** Full suite **2,339 tests / 285 files, 62.78 seconds**, typecheck,
lint and production build pass. All **seven affected production checks pass in
44.5 seconds**: the new workflow, three reply-failure recovery cases and three
existing registry/travel/posting journeys. The authored 101-army workflow applies
49/99/99 ordinary orders, retains 52/2/2 unaffected checks, preserves every army,
route and posting, and restores the exact 352-record archive. Independent source,
export and native-image reviews find no scoped blocker. Six Huge/Legendary
128-policy headless worker-module samples pass at 331–390 / 635–673 ms with exact
replay/autosave; these Node/fake-storage samples are not browser latency or
percentile claims. [Evidence](development/2026-10-24-group-patrols/README.md).

ACT-32/M3 advances but remains partial. Mobile escorts need target lifecycle and
coordinated movement; a fixed-cell follower alone does not prove protection.
Broader governors/programs, organic mature-realm acceptance, DH-021, R06 and all
fifteen release gates remain open.

## Find postings, waiting orders and paused patrols — 2026-10-24

**Published as `e0d8112`, implementation `da12978`.** Both GitHub workflows
succeed, exact public assets/source/catalogue match, and the live registry
journey passes in 12.8 seconds. Publication checks pass 2,320 tests and all
47 local Pages journeys. The army registry now offers
All forces, Postings and patrols, Orders waiting and Paused patrols. Counts compose
with existing search/domain filters before stable 25-row paging. Rows expose
actual posting destinations/reasons, patrol-policy state and travel interruptions
separately. Waiting does not imply a defect. Disabled policies remain findable
when their army has no movement or already has a travel route.

Filtering preserves checked armies, including those outside the new cohort, and
uses existing pending-review locks. Opening a row reaches the existing inspector;
reopening the registry resets its local filter to All forces. The projection
reads only already-supplied owned order facts, performs no geographical/path
search and issues no commands or new worker requests. It adds no canonical rule,
save field, AI behavior or per-turn/per-frame work; rules/save 35 and content
015468d1 remain unchanged. No campaign pacing rerun is warranted.

**Evidence.** Full suite **2,318 tests / 282 files, 75.04 seconds**, typecheck, lint
and production build pass; focused 36 tests cover new and existing registry/group
contracts. The production journey passes in 10.5 seconds through actual controls
on an authored 101-army fixture. Its eight ordinary setup commands genuinely
produce exhausted movement, active travel and a blocked patrol; strict import
and replay pass. Filter/navigation actions preserve hash `aa8eb3f5` and all eight
records. Only explicit Resume adds sequence 9, `setPatrolEnabled(true)`, producing
`099f7ee4`; all armies and all routes remain exact, with saved reload/replay.
Native desktop/narrow 130% text captures and an independent export/source review
find no scoped blocker. [Evidence](development/2026-10-24-army-order-filters/README.md).

This advances ACT-32/M3 and bounded Gate I/E evidence, not organic mature-realm
acceptance. Broader delegation, escorts, long programs, campaign pacing and all
fifteen release gates remain open.

## Interrupt and preserve imminent victory-project sieges — 2026-10-24

**Published as `a48755b`, implementation `bff9889`.** Both GitHub workflows
succeed; exact public assets/source/catalogue match, and four live counterplay
journeys pass in 18.7 seconds. AI now rejects peace
and issues an already legal adjacent siege in the same planning pass when a
currently visible enemy project can finish during the truce. It also preserves
an existing own siege pausing that project: incoming peace is rejected and
outgoing diplomacy skips that rival while ordinary conquest/economy planning
continues. A strictly sooner active own project retains ordinary peace evaluation.
Direct orders, delegated armies, missions and protected relationships remain
respected. Eight project candidates and four canonical quotes bound each pass.

The simulation-owned siege quote shares unchanged command predicates/refusal
order. A generic strategic blocker discloses no hidden battle/capture actors;
older observation capabilities retain historical AI choices. Rules/save **35**,
content **015468d1**, canonical state and prices are unchanged. Exact pre-refactor
rules 16/19/34/35 command seals, modern saves and replay pass.

**Verification.** Typecheck, lint, build and **2,304 tests  / 280 files in 65.18 seconds**
pass. Four production journeys pass in 17.0 seconds, including two actual five-round
Watch branches and exact saved archives. Both reject the fresh turn 30 offer and
hold through 31; one then captures/cancels the project, while the other genuinely
withdraws after combat and loses at 32. This corrects treaty decisions, not battle
outcomes. Original rejection-only, later-peace and harness failures remain in the
[evidence packet](development/2026-10-24-project-counterplay/README.md).

Ten final Huge/Legendary cases pass. New-interruption medians are 2.839/3.396 ms;
maintaining an own siege costs 2.416/2.540 ms in the isolated review. The earlier
30.600 ms outlier is retained, and full-turn/rendering costs are excluded.
The nine headline final hashes and all non-timing results are identical to the
retirement matrix. DH-021's Long/Epic gaps, R06, ACT-32/M3 and all fifteen gates
remain open. Distant counterplay, other paused causes and wider operations are
unfinished. Next: usable army-registry filters for postings, waiting orders and
paused patrol policies, then organic mature-realm acceptance.

## Posting and muster destination correction — 2026-10-24

The individual order forms now keep the displayed destination and submitted
command aligned. “Where it stands” resolves the latest army position; a named
hearth stays fixed. A missing current choice displays an explicit explanation
and requires a fresh selection. Existing canonical arbitrary-hex postings and
musters remain visible and clearable, including hex zero; clearing retains
existing travel under unchanged command semantics.

**Published as `c52ce3e`.** Both exact GitHub workflows succeed, public assets
match the build, and all five targeted live order journeys pass. All **2,253 tests / 277
files pass in 67.65 seconds**, plus typecheck, lint and the production build.
Four development journeys pass in 20.6 seconds and five related production
journeys pass in 25.8 seconds. The original browser failure really moved an army
from 500 to 501, displayed 501, then posted it to 500. Retained failures, exact
save/replay checks, narrow 130% text review and limitations are in the
[evidence packet](development/2026-10-24-posting-targets/implementation.md).
This changes UI intent only: rules/save **35**, content **015468d1**, AI and
campaign prices are unchanged. No pacing rerun is required. ACT-32/M3, DH-021
and all fifteen release gates remain open. Next: proved adjacent siege
counterplay against an imminent public rival victory project.

## Retire visibly obsolete home patrols — 2026-10-24

**Local verified correction after the published `04d1776` checkpoint.** A genuine
generated Long save shows Wardhall's company still reserved for a paused patrol
after its destination hearth was captured. AI control now issues ordinary
`clearPatrol` for an enabled persistent circuit with a matching paused single
leg, a currently visible foreign target, and an owned other hearth within six
hexes. Existing routes remain exact. The company stays reserved in that proposal
batch; a fresh observation releases only its patrol reservation. Disabled or
war-pause policies, direct overrides and other route shapes remain untouched.
An identical manually configured circuit can also be reviewed after AI takeover;
ordinary player turns do not retire policies automatically.

**Verification and cost.** Rules/save remain **35**, content **`015468d1`**.
The full suite passes **2,242 tests / 276 files in 60.78 seconds**, with unchanged
limits. Typecheck, lint and production build pass. Three production journeys
pass in 19.6 seconds; the new Watch journey records cleanup, actual movement on
the next round, and exact recovery/replay of a 179-record partial archive.
Independent source, factual and native-image reviews find no scoped blocker.
Retirement shares the existing four-command cap with safe recovery and uses no
route query. Fully charted Huge/Legendary isolated planner medians are
**1.832/2.794 ms** for four clears among 128 policies and 1,584/4,031 observed
armies; hidden/owned controls cost 0.248–0.455 ms and issue no commands. These
exclude observation creation, whole turns, worker transfer and rendering.
[Evidence and original failures](development/2026-10-24-patrol-retirement/README.md).

**Balance remains open.** The unchanged three-seed headline matrix ends at
Standard **219/194/201**, Long **329/309/287**, Epic **374/332/327**. The original
Long seed improves seven turns but remains eighteen later than retained rules34;
two Epic seeds remain below 350–400. All nine use ordinary cleanup, end through
prosperity and have zero refused submitted commands/theater routes. One Standard
run records an automatic patrol-route refusal, counted separately. Prices and
proxy bounds are unchanged. **DH-021, ACT-32/M3 and all fifteen release gates
remain open.** Next prove reachable victory-project counterplay using permitted
observations, then address wider obsolete circuits, escorts and delegation.
This correction is committed as **`68ef5fa7`**. The user has authorized deployment
after every completed feature or fix. Dispatch 15 and the current catalogue now
pin that implementation; publication integration passes 2,243 tests and 39 local
Pages journeys. The [publication packet](development/2026-10-24-retirement-publication/README.md)
records publication **`27a44f1`**: both exact workflows succeed, public built
assets match, and all **39 live Pages journeys pass in 3.5 minutes**.

## Posting policies and patrols publication — 2026-10-24

The user authorized committing and publishing the three reviewed checkpoints
below. Their implementation is committed as **`dee74cf9`**. Dispatch 14,
**Keep the watch moving**, and the current roadmap now describe that exact
source, retaining historical articles and the adverse pacing results. The
catalogue has 23 items (6 completed, 13 in progress, 4 pending), with 86 delivered
and 49 remaining acceptance statements; these are not completion percentages.
**ACT-32/M3, DH-021 and all fifteen release gates remain open.**

Publication integration passes **2,218 tests / 275 files in 59.08 seconds**,
typecheck, lint, content/art validation and the Pages-subpath production build.
The two native screenshots deliberately expand the journal image inventory
budget from 3 to 3.5 MiB: 327,562 added bytes, 3,473,083 bytes total. This changes
no gameplay performance budget. Source/image review, browser results and exact
deployment readback belong to the [publication packet](development/2026-10-24-patrol-publication/README.md).
All **38 local Pages journeys pass in 1.4 minutes**, including the new patrol,
recovery and posting-template production flows. Independent displayed-image
review finds no blocker. **Published as `04d1776`**: both exact GitHub workflows
succeed; all **38 live Pages journeys pass in 1.9 minutes**, and public HTML,
game/worker bundles, source pins, catalogue and native imagery match the build.
Primary `master` matches `origin/master` at that revision. Earlier local/draft
wording below describes historical checkpoints; subsequent development is local.

## AI review of interrupted patrols — 2026-10-24

**Local verified defect correction; campaign pacing remains unresolved.** A
generated Long campaign proved that an enabled patrol could remain reserved for
284 sampled turns after its route paused, despite peace and a legal short path.
The AI now explicitly reviews a matching single-leg home route and submits
ordinary Resume, bounded to four path queries and four commands per pass. Both
endpoints must remain owned hearths; actual supply, mobility, direct overrides
and observed wartime forces/settlements within sight are checked. Stable rotation
prevents fixed-ID starvation. Saved patrol configuration and actor reservations
remain intact. Player-controlled canonical movement never resumes itself.

**Authority and history.** This runs only when AI controls the realm. Identical
manually queued single legs cannot be distinguished by provenance and may also
be reviewed after AI takeover; disabled patrols, other destinations and larger
programs stay untouched. Rules/save remain **35**, content **`015468d1`**. Original
AI source, exact generated snapshots, the pre-change campaign trace and both
fail-before regressions are retained. Current ordinary commands reload and
replay exactly; no canonical schema or command semantics changed.

**Verification.** Full local suite: **2,217 tests / 275 files, 61.66 seconds**,
four workers, unchanged limits. Typecheck, lint and build pass. Two built-production
journeys pass in 11.2 seconds with no development hooks: a real Watch round
records the recovery, then restores its exact manual save/archive, while the
player patrol and narrow enlarged-text flow remain intact. Independent source
review finds no blocker. Huge/Legendary 128-patrol AI review medians are
0.666/0.984 ms for four safe resumes and 0.255/0.667 ms when nearby threats block
all reviews. These isolate short-route planning, not whole turns or organic scale.
[Evidence, failures and limits](development/2026-10-24-patrol-recovery/README.md).

**Pacing, including adverse results.** With fixed prices and seeds
20260905/20260906/20260907, Standard ends at **219/193/214**, Long at
**336/304/286**, Epic at **374/278/320**. The original Long seed is one turn
slower than the preceding patrol checkpoint, and two Epic seeds are now below
350–400. The original Long slowdown is not fixed. There are no refused submitted
commands or theater routes; one Standard automatic patrol route was blocked on
turn 81 and succeeded next turn. All nine campaigns reach prosperity. No price,
proxy bound or release target changed. **DH-021, ACT-32/M3 and all fifteen release
gates remain open.** Next investigate victory readiness, counterplay and funding
across these seeds with the corrected AI before deciding any deliberate repricing.
Obsolete circuits, escorts and broader delegation remain unfinished. Work is
local and uncommitted; the illustrated dispatch remains draft.

## Saved two-point land patrols — 2026-10-24

**Local behavior checkpoint; pacing unresolved. ACT-32/M3 remains in progress.**
Combat land armies ashore can now keep a two-point patrol through ordinary saved
commands. The army inspector shows the next point, actual blockers and explicit
update, pause, resume and remove controls. An optional saved policy pauses future
assignments when the realm is at war; peace never silently resumes it. Updating
that policy preserves an existing pause. Direct active/paused travel, postings,
transport, missions and sieges retain priority. Pause/remove preserves travel
already issued. No automatic attacks or declarations of war are added.

**AI and scale.** During peace, the AI may assign one spare single-company force
to a short circuit between owned hearths, retaining scouts, specialists, existing
assignments and its two strongest field armies. AI circuits persist through war;
the measured automatic-war-pause alternative produced worse campaign pacing.
All actor planners preserve enabled patrol assignments. Allocation permits eight
ordinary route attempts per realm per turn with deterministic rotation, within
128 patrols per realm and 8,192 globally. Isolated allocation medians for authored
Huge/Legendary workloads with 1,500/4,000 patrols are 4.588/6.281 ms; these short
routes do not certify full turns, worst-case searches, rendering or organic scale.

**History and verification.** Rules/save **35**, unchanged content **`015468d1`**.
Six genuine pre-change rules-34 save/archive checkpoints preserve original bytes,
replay and independent continuations. Frozen schemas reject patrol fields and
commands; older loads initialize an empty register and populated downgrades are
refused. Mixed history, reopened storage and portable recovery pass. The full
local suite passes **2,206 tests across 273 files in 56.85 seconds**, four workers
and unchanged limits. Eleven distinct affected gameplay journeys pass across
retained runs; three built-production journeys pass in 11.3 seconds without
development hooks. Typecheck, lint, content validation and build pass. Native
desktop, 390px and enlarged-text captures, independent source reviews, original
failures and exact source/image manifests are in the
[work packet](development/2026-10-24-patrols/README.md).

**Known pacing regression.** The final seed-20260905 Standard-map/twelve-realm
campaigns end at Standard **236**, Long **335**, Epic **374**, versus frozen
rules 34's **233/311/349**. All finish with no submitted or automatic refusals;
the Long campaign is **24 turns slower**. Epic is within its 350–400 target, but
Standard/Long remain above their approximate targets. The rejected wartime-pause
AI experiment ended at 243/375/427. Prices and proxy bounds are unchanged.
**DH-021 remains open**, now including the new Long drift; no balance acceptance
or release gate is claimed. Next: investigate patrol opportunity cost with fixed
prices and more headline seeds before expanding delegation. Escorts, longer
programs, broader governors and organic mature-realm acceptance remain open.
All fifteen release gates remain open. The dispatch stays draft; no commit,
push, deployment or public journal change was made.

## Reusable army posting policies — 2026-10-24

**Local, verified checkpoint. ACT-32/M3 remains in progress.** The army registry
now saves up to 24 named personal posting templates. Each stores hold/join and
either each army's current position or an owned-hearth destination policy.
Recall fills the form without changing checks or issuing orders; a hearth
policy requires a fresh owned target before explicit application to up to 128
armies. Templates survive browser reloads and campaign changes, remain separate
from campaign saves/exports, and preserve active postings when edited or deleted.
Denied, malformed or newer preference storage preserves records and leaves direct
posting controls usable. Retry opens a fresh connection.

**Destination safety.** A selected hearth becoming unavailable no longer silently
substitutes each army's current hex. The form requires a new target while still
allowing existing postings to be cleared. Ordinary travel, canonical legality,
partial refusals, individual overrides and worker recovery remain unchanged.

**Evidence.** The full local suite passes **2,162 tests across 268 files in
60.69 seconds** with four workers and unchanged budgets. Ten affected Chromium
gameplay journeys pass in 56.2 seconds; two built-production journeys pass in
7.8 seconds without development hooks. Typecheck, lint, content validation and
the production build pass. The authored Legendary fixture has 100 owned armies,
40 owned hearths and 4,000 armies overall. It verifies unchanged hash/traffic
before Apply, one final publication, real save restoration and exact 100-order
exported replay. A different-seed campaign verifies fresh hearth selection and
clearing while a target is unresolved. Native desktop, 390px, enlarged-text and
keyboard controls have source-linked evidence and independent review in the
[work packet](development/2026-10-24-posting-templates/README.md).

**Scope and compatibility.** Rules/save remain **34**, content **`015468d1`**.
No simulation, AI, worker protocol, campaign pacing or hot turn/frame path changes.
No new pacing measurement is claimed. This is the first reusable army posting
policy type; multi-step programs, patrol/escorts, broader governor decisions and
organic mature-realm acceptance remain open. All fifteen release gates and
DH-021 remain open. The [developer dispatch is draft](development/2026-10-24-posting-templates/dispatch-draft.md);
nothing was committed, pushed or deployed.

## Reinforcement, integrated delegation and negotiated supply — 2026-09-27

**Published and live-verified. ACT-32/M3 and ACT-33/M4 remain in progress.** Defensive theaters may request zero to four extra guards in response to visible wartime combat land armies within three hexes of their protected hearths. One quiet allocation retains extra coverage. Physical guard floors and direct active/paused routes, postings, voyages, missions and sieges retain priority. Threats count army containers, not combat strength; each theater retains its sixteen-attempt route budget. The registry exposes reinforcement settings and actual reports. Grouped theater exceptions open the affected watch, while delegated idle members leave generic movement prompts.

**Negotiated logistics.** A realm may request five to thirty turns of supply from one currently observed foreign hearth or harbor. Acceptance charges the offered fee once; the public quote is two coin per turn. Either participant may end service without refund. War, source loss or expiry ends the agreement; sieges and ordinary supply blockers can interrupt feeding. Canonical land/harbor reach replenishes loaded fleets and feeds land forces. The map uses disclosed, last-known contracted reach; own-army reports show actual supply. Agreements grant neither passage nor shared intelligence. The AI answers incoming offers and considers bounded purchases, preserves routes and reserves pending fees before discretionary peace payments.

**History and recovery.** Rules/save **34**, content **015468d1** unchanged. Ten genuine pre-change rules 33 save/archive checkpoints retain original bytes; 27 repeated accepted commands and seven continuations preserve old seals. Strict historical schemas reject future fields, while current loads initialize reinforcement off and supply registers empty. Mixed history, paid agreements, reopened storage, portable data and replay are covered. A review-discovered worker defect after AI acceptance inside End turn/watch is fixed: failed publication locks later commands/save/export until restoration, with exact payment and no duplicate acceptance. Both reproduced regressions pass unchanged; 54 checks across five affected worker/response files pass.

**Acceptance and limits.** The new naval browser journeys demonstrate request, AI/provider acceptance, refill, service termination, land attrition, renegotiation and exact saved recovery. The mature-realm journey uses an explicitly authored Huge state with 128 owned armies, thirty hearths and two wars; geometry isolates delegation from an unrelated tactical battle. It is not an organically earned empire. The integrated journey passes in 35.2 seconds, with all six native captures reviewed. Manual and portable restoration reproduce turn 4 and its 1,668-command replay exactly. The 44→8→0 shared purse leaves twenty-eight charters correctly waiting at their reserve while paid production advances. All 49 affected browser journeys pass in 5.8 minutes, and the full local suite passes 2,146 checks across 266 files in 56.51 seconds with four workers and unchanged limits. The two built-production journeys pass in 10.4 seconds. Typecheck, lint, content/art validation and the Pages build pass. Four isolated reinforcement allocator cases measure 1.600–9.466 ms median, and eight-import actual supply graphs measure 0.837/0.605 ms on Huge/Legendary. All eighteen paired headline campaigns finish at identical turns under rules 33/34, and old hashes/counts match the genuine baseline. Five accepted routes target held hearths without proving extra dispatch causation; no measured headline campaign buys supply. Timings and adoption remain bounded; see the [work packet](development/2026-09-27-reinforcement-logistics/README.md). Prior sandbox, selector, focus, tactical-fixture, concurrent timing and pacing-tool execution-context failures are retained. All fifteen release gates remain open; DH-021 remains open. Broader patrol/escort roles, reusable army orders, governor decisions, recurring trade and coordinated overseas wars remain unfinished.


**Publication.** Implementation `f33a816f3a853229695b902af007e4e3f3547275` backs reviewed dispatch 13 and the existing catalogue. Final publication verification passes 2,146/266 in 60.52 seconds and all 35 local production Pages journeys in 1.2 minutes, including narrow/text-scale and keyboard reader behavior. Historical stories and public image bytes remain unchanged. The catalogue retains 23 items (6 completed, 13 in progress, 4 pending) and now records 78 delivered / 49 remaining editorial statements; these are not a fixed-scope completion percentage. Published revision `abb2369fd289a549c59704fbbe4aa6fb8354bafb` passes both exact GitHub workflows, all 35 live Pages journeys in 1.4 minutes without retries, and exact game/worker/image/source/catalogue readback. DHARMA records ACT-32/M3 and ACT-33/M4 progress and the paired pacing evidence while retaining DH-021 open, ACT-36 done and DH-020 resolved. [Deployment and live evidence](development/2026-09-27-reinforcement-logistics/deployment.json) and [tracker readback](development/2026-09-27-reinforcement-logistics/tracker-readback.json). All fifteen release gates remain open.

[Architecture](architecture/0046-reinforcement-supply-access.md), [historical capture](development/2026-09-27-reinforcement-logistics/historical-capture-review.md), [supply UI review](development/2026-09-27-reinforcement-logistics/supply-ui-review.md), [worker recovery review](development/2026-09-27-reinforcement-logistics/worker-recovery-review.md) and [integration source review](development/2026-09-27-reinforcement-logistics/integrated-source-review.md).

## Defensive theaters — 2026-09-27

**Published and live-verified. ACT-32 remains doing and M3 remains in progress.** A named defensive theater assigns explicit combat land armies to protect owned hearths and gather surplus at a known reserve hex. Up to eight theaters per realm each retain sixteen hearths and 128 members, with a floor of one to four whole armies per hearth. The registry supports explicit drafts, membership replacement, individual detach, pause and delete; configuration follows canonical saves, journals and portable exports.

**Authority and overrides.** Allocation runs after ordinary travel and postings, issues at most sixteen ordinary route attempts per theater per turn, and counts both physical guards and active final destinations. Incoming promises suppress duplicate dispatch but never justify withdrawing the last physical guard. Nonmembers can satisfy coverage but are never commanded. Existing active or paused travel, postings, voyages, missions and sieges retain priority. Pause/delete/detach stop future assignments while existing routes continue. Captured hearths remain unavailable without leaking changed enemy facts; missing members are pruned. Latest actual refusals are inspectable, and route attempts never automatically attack or declare war.

**AI and history.** Rules/save **33**, content **015468d1** unchanged. Seven genuine pre-change rules 32 save/archive checkpoints, three exact old continuation seals, mixed 32→33 history, portable data and reopened IndexedDB are verified. AI may establish a small home watch through ordinary commands, preserving scouts and its two strongest field armies. At most four nearby hearth candidates and eight canonical movement previews prevent adoption onto an unreachable island. Existing theaters are not automatically rewritten or refilled. The island defect was found in complete campaigns, reproduced with identical hashes/traces and fixed with four failing-before/passing-after regressions; it was not hidden by changing prices or proxy bounds.

**Verification and limits.** The full local suite passes **2,075 tests across 258 files in 61.02 seconds**; all **270 AI tests** are included in that total. Thirty-three affected Chromium journeys pass in 4.2 minutes, including six new theater/recovery journeys. The final fixed-build production journey separately passes in 5.0 seconds (6.0 seconds for the run), with generated founding, canonical saves and portable restoration. Publication headless checks pass the same 2,075 tests / 258 files in 57.79 seconds; initial stale journal assertions and their corrections remain recorded. Native desktop and 390px views have independent review. Four authored Huge/Legendary allocator cases use one warmup and three identical-save samples: 100 assigned guards take 1.515/3.049ms median, while eight theaters with 1,024 members and 128 hearths take 8.814/8.527ms. These cover one active realm and bounded routes, not all 64 realms, full turns, worker transfer or rendering. Current headline campaigns finish Standard 233, Long 311 and Epic 349: Standard/Long remain above approximate 200/300 targets, and Epic is one turn below the nominal 350 lower edge. **DH-021 remains open.**

[Architecture](architecture/0045-defense-theaters.md), [implementation evidence and retained failures](development/2026-09-27-defense-theaters/README.md), [independent UI/recovery review](development/2026-09-27-defense-theaters/independent-ui-review.md), [full tests](development/2026-09-27-defense-theaters/tests-final.log) and [current pacing](development/2026-09-27-defense-theaters/pacing-fixed.log). Broader threat response, reinforcement, patrol/escort roles, reusable army orders, governor decisions and integrated mature-realm acceptance remain open. Dispatch 12 and the current catalogue are independently reviewed. All 34 local Pages journeys pass in 1.1 minutes, and the same 34 live journeys pass in 2.3 minutes without retries. Published revision `bce46a1442a0b2aa33487952b4d43e1d96cb8540` passes both exact workflows and game/worker/image/source/roadmap readback. DHARMA records ACT-32/M3 progress and final pacing while preserving ACT-36 done and DH-020 resolved. [Deployment](development/2026-09-27-defense-theaters/deployment.json) and [tracker readback](development/2026-09-27-defense-theaters/tracker-readback.json). **All fifteen release gates remain open.**

## Coordinated group travel — 2026-09-26

**Published and live-verified. ACT-32 remains doing and M3 remains in progress.** Recall a saved army group or check up to 128 owned land armies ashore, choose a selected map hex, owned hearth or explicit destination, then explicitly review and apply individual travel orders together. Reviews show per-army steps, movement costs, blockers and search limits in paginated results. Changing the checked armies, destination, route mode or campaign invalidates the review; reviewing never issues an order.

**Player consequences.** Apply starts ordinary movement immediately in stable army-ID order. Armies travel independently, and an accepted order can arrive or pause; accepted rows report the final canonical event instead of promising an active journey. Refused armies remain selected. Replace redirects an existing route; append preserves its waypoints and paused status. Resume affects selected paused routes, and cancel affects selected existing routes. Standing postings remain intact and can send armies marching again next turn after cancellation or completion; the panel counts affected postings and directs players to clear them separately. Individual army controls remain available.

**Authority and recovery.** Compact explicit previews use permitted observations and omit full paths and reachable overlays. One validated worker batch records existing canonical `queueMovement`, `resumeMovement` or `cancelMovement` commands, checks the reviewed hash before mutation and publishes one final permitted observation. Completed batches with accepted orders attempt one autosave. Travel never automatically attacks or declares war. Main-thread correlation rejects incomplete or mismatched outcomes before installing a successful view, and uncertain recording/publication requires saved-campaign recovery. Independent review corrected a superseded preview error that could incorrectly set the recovery flag; only the current worker's active preview may now do so. [Architecture](architecture/0044-group-travel.md), [main-thread review](development/2026-09-26-group-travel/main-review.md) and [worker review](development/2026-09-26-group-travel/worker-review.md).

**Verified evidence and remaining acceptance.** The full local headless run passes **2,000 tests across 250 files in 63.19 seconds**. Focused worker and UI/request-ledger runs pass **10** and **24** tests respectively; these overlap the full suite and are not added together. Tests cover exact serial archives/replay, saved continuation, the 128-army bound, hidden occupants, visible attack refusal, paused travel, retained postings and recorder/publication/autosave failures. Typecheck and scoped lint pass. Twenty-one affected Chromium journeys pass in 2.6 minutes, including eight new travel/recovery scenarios; one generated-production journey passes separately in 5.3 seconds through ordinary controls and real manual/portable saves. Initial browser evidence retains six passes and one aggregate 45-second timeout; splitting the long journey preserved every assertion and the timeout while reducing test-only data transfer. Four authored Huge/Legendary single samples preserve exact serial archives, replay, autosaves and the canonical permitted view. Compact review payloads are 8,206–22,437 bytes; final states are 246,578–649,643 bytes and batch wall times including autosave/publication are 459–831 ms. These short-route samples do not establish maximum-search, rendering or full-turn performance. A separate six-case focused run passes four repeated travel scenarios and two omitted posting-recovery cases: 23 distinct affected journeys across the overlapping runs. The first narrow capture with missing list text is retained; fresh actual-control captures show readable rows and controls after layout settles, without a runtime CSS change. [Full run](development/2026-09-26-group-travel/tests-initial.log), [focused worker run](development/2026-09-26-group-travel/worker-final.log), [focused UI run](development/2026-09-26-group-travel/ui-tests.log) and [checkpoint evidence](development/2026-09-26-group-travel/README.md).

**Compatibility and scope.** Rules/save **32**, content **`015468d1`**, canonical movement rules, prices and AI remain unchanged. No new pacing measurement or campaign-resolution change is claimed. This advances existing ACT-32/M3 coordinated orders without adding or cutting gameplay obligations. Theater strategy, patrol/escorts, reusable army order templates, broader governor decisions and combined mature-realm acceptance remain open. Dispatch 11 is reviewed and the local Pages suite passes 33/33 in 1.0 minute. Final headless publication checks pass 2,000/250 in 53.68 seconds; immutable evidence, native imagery and four journal viewport/text settings are reviewed. The initial Pages run retained one stale-count assertion failure before correction. Published revision `7dfe0c6a587e019eeec2501d21d212928f6e0918` passes both exact GitHub workflows, all 33 live Pages journeys in 1.4 minutes, and exact game/worker/image/source/roadmap readback. [Deployment record](development/2026-09-26-group-travel/deployment.json). DHARMA records ACT-32/M3 progress with exact guarded readback, preserving ACT-36 done, DH-020 resolved and DH-021 open. **All fifteen release gates remain open.** Earlier checkpoint evidence below remains historical.

## Production sequences and personal templates — 2026-09-26

**Published and verified. ACT-32 advances; M3 remains in progress.** Reuse the registry's checked hearths or recall a saved group, compose one to five existing production items, reorder/remove them and explicitly apply the list to up to 128 owned hearths. Existing queues come first. Construction entries are unique within the editor; recruitment may repeat. The interface explains nominal cost, shared treasury, current blockers and immediate spending. Complete hearths leave the selection; partial/refused hearths retain their paid prefixes and remain checked for review. Applying again submits the current whole list, not an automatic resume.

**Personal library and canonical authority.** Up to 24 named templates persist in a separate browser/origin-local preference database, with names limited to 40 characters. Selecting or recalling a template issues no orders; Recall fills the editor and Apply remains explicit. Templates are excluded from campaign exports. Storage failures preserve rows and leave direct production controls usable; Retry uses a fresh connection. One bounded worker request journals ordinary canonical `queue` commands in stable hearth order, stops each hearth at its first refusal and publishes one final permitted result. It does not replace queues, change charters, roll back accepted work or automatically retry. Rules/save **32**, content **`015468d1`**, prices, AI and campaign-resolution rules remain unchanged.

**Recovery and measured costs.** Submitted-plan correlation rejects malformed/incomplete replies before success is announced. Review corrected the current-worker crash path so interrupted paid production ends pending work and keeps gameplay locked until saved-campaign recovery. Four authored generator-4 Huge/Legendary worker samples preserve recorded order, replay/hash and observed fog. Representative 32/40-hearth batches transfer about 1.79/4.40 MB; the 128-by-5 ceiling transfers about 2.27/4.84 MB. These are single headless samples, not full-turn, renderer or sustained-memory acceptance. [Measured scope and costs](PERFORMANCE.md#production-sequences--local-rules-32-candidate).

**Verification and publication.** Implementation `420219d278ae17f42a04871c6319ecf62a4af216` passes **1,975 tests / 247 files**; final journal verification passes **1,977 tests / 247 files** after two editorial checks were added. **30 affected Chromium journeys**, **32 local Pages journeys** and the separate generated production journey pass. Typecheck, lint, content/art validation and the Pages build pass. Published checkpoint `24cd30e309ca191181482b7525d3eac6aebb4fbf` passes both GitHub workflows, exact commit/source/image readback and **32/32 live Pages journeys** in 1.7 minutes. Initial live results (27 pass / 5 fail, then 4 pass / 1 fail on focused rerun) remain recorded. The asset test now verifies the application's completed atlas download before its existing readiness assertion; application code and timeout limits are unchanged. [Evidence, retained failures and independent reviews](development/2026-09-26-production-sequences/README.md).

**Tracker and remaining scope.** DHARMA records this checkpoint with ACT-32 doing and M3 in progress, preserving ACT-36 done and DH-020 resolved. Dispatch 10 and the existing catalogue now record production sequences and personal templates; editorial counts are not a fixed-scope completion percentage. No new pacing run is claimed. Theater strategy, patrol/escorts, reusable army order templates, broader governor decisions and combined mature-realm acceptance remain open. Standing repeat production, refunds/queue reordering and automatic per-hearth resume are not implemented by this slice. **All fifteen release gates remain open.**

## Saved realm groups — rules/save 32, 2026-09-25

**ACT-32 advances; M3 remains in progress.** Keep up to 24 named army/hearth groups per realm, with up to 128 members each, in the campaign's canonical saves, replay and exports. Create, rename, replace membership or delete from the registry. Choosing a group only chooses its record; Recall replaces that tab's eligible checks without orders or worker traffic. Apply postings/charters separately. Permanent member loss is pruned, while empty groups and temporarily embarked land armies remain. Updates explicitly explain removal of unchecked members. Personal charter templates retain their browser-local boundary.

**Authority and compatibility.** Ordinary atomic commands use a separate group-ID counter, preserving gameplay IDs, resources, queues and routes. Observations expose detached own groups only. Four genuine prechange rules-31 saves/archives retain exact bytes and replay; old migrations allocate fresh arrays and reject silent metadata downgrade. Review fixed shared migration defaults and a malformed-response path that could announce success before React failed. Interrupted recording/publication/display now ends pending work and requires saved-campaign recovery. Content remains `015468d1`; no AI, campaign-price or resolution-policy change is made.

**Scale repair and evidence.** Saturating 48/64 realms exposed and fixed an existing arcane-research save limit of 48 rows. Rules 32 now saves the already supported 64 seats; earlier schemas remain frozen. Generated 64 major realms and 40 major realms plus 24 city-states roundtrip. Synthetic 147,456/196,608 group-member references reconcile in about 3.3/4.2 ms median; own groups add about 36.5 KB to observation JSON. These are isolated metadata timings, not full turns or renderer measurements.

**Local verification.** 1,941 tests across 243 files, 20 affected Chromium journeys and one separate built-production journey pass. Typecheck, lint, content/art validation and the Pages build pass. The browser's initial new-campaign waits ran before generation finished; both failures remain documented, and the unchanged isolation assertion passes after waiting for terminal feedback, enabled End turn and the new seed. Independent code and visual reviews, screenshots, benchmark and historical evidence are in [the checkpoint report](development/2026-09-25-selection-groups/README.md). No new pacing measurement is claimed; prior headline Standard 234/Long 342/Epic 379 remains dated evidence. Theaters, patrol/escorts, army templates, production sequences, broader governors and combined mature-realm acceptance remain open. All fifteen release gates remain open; publication is recorded separately.

**Published checkpoint — 2026-09-26:** `676d56471cb806fb007fc0207ea16b0b638c467c` delivers saved realm groups, the 64-seat research save repair and dispatch 09. Final local suite: **1,943 tests / 243 files**, **20 affected gameplay journeys**, **31 local production Pages journeys**; **31/31 live Pages journeys** pass. Separate ordinary-control local and live 40-realm/24-city-state campaigns preserve exact state, all 64 research registers and replay through manual save/reload and portable import/export. GitHub build/Pages, exact commit/article/source/image readback and independent live review pass. [Deployment evidence](development/2026-09-25-selection-groups/deployment.json). DHARMA resolves **DH-020** and records ACT-32/M3 progress; ACT-36 closure follows final clean synchronized publication. All fifteen release gates remain open. First-turn 64-seat storage proof does not establish mature-campaign scale; the verifier explicitly retains a correlated automatic browser favicon 404 warning.

**Previous published checkpoint — 2026-09-25:** `1d256b09b5a7fe273d2e340b6c4014b722f9d49d` delivers reusable charter templates and dispatch 08. Final local verification passes **1,904 tests**, **16 affected gameplay journeys** and **30 production Pages journeys**. GitHub build/Pages and **30/30 live journeys** pass. Exact commit, article/source and image-byte readback pass. [Deployment evidence](development/2026-09-25-charter-templates/deployment.json) retains the corrected test-only typecheck and readback-helper issues. DHARMA records this checkpoint; ACT-32/M3 remain in progress and all fifteen gates remain open.

## Reusable charter templates — 2026-09-25

**ACT-32 advances; M3 remains in progress.** After selecting hearths in the registry, save up to 24 named charter policies, each holding a focus and a per-work coin ceiling. Update, recall or delete them in the same controls. Recall fills the form; Apply charters still explicitly issues ordinary commands. Editing a template leaves active charters unchanged. The in-game guide explains the workflow.

**Persistence boundary.** The personal library stays in this browser and origin across campaigns and reloads; it is excluded from campaign exports. Applied charters remain canonical saved state. Strict bounded records and atomic writes protect names, capacity and existing rows. Read/write failures are visible and leave direct charter controls usable. Review reproduced a cached failed-open connection preventing retry; retry now creates a fresh connection. No campaign rules, AI, worker protocol, content or save version changes: rules/save 31 and content `015468d1` remain.

**Local verification.** 1,902 tests across 237 files and 16 affected Chromium gameplay journeys pass. Browser checks retain exact campaign hash/worker totals for preference actions, separate export/history, forty-hearth application, individual override, saved restoration and denied/malformed storage recovery. Typecheck, lint, content/art validation and Pages-subpath build pass. Independent storage/UI reviews and exact desktop/narrow captures are retained in [the checkpoint evidence](development/2026-09-25-charter-templates/README.md). One additional built-production template journey passes without development hooks, covering reuse across two generated campaigns, reload, explicit assignment and narrow saved restoration. Publication checks are recorded separately. Named campaign groups, army order templates, production sequences, broader governors, theaters/patrol/escorts and combined mature-realm acceptance remain. All fifteen release gates remain open.

**Published checkpoint — 2026-09-24:** `ee12011edb9990e8a5948301174b039fbbb9c04d` delivers group hearth charters and dispatch 07, advancing ACT-32/M3. Final local verification passes **1,891 tests**, **12 affected gameplay journeys** and **29 production Pages journeys**. GitHub build/Pages and exact live commit/article/image readback pass. The live suite passes 28 scenarios; one existing crest-loading check exceeds its five-second limit during slow successful asset downloads and passes unchanged on focused rerun. [Deployment and live evidence](development/2026-09-24-group-charters/deployment.json) retain that failure. DHARMA records the new checkpoint; ACT-32 remains doing and all fifteen release gates remain open.

**Previous published checkpoint — 2026-09-23:** `36fea99729452651c09cc7d5ddae81bb1dca4db2` delivers fleet provisions, group army postings and dispatches 05/06. Final local suite: **1,878 tests**; production Pages suite: **28/28 locally and 28/28 on the live site**. The seven affected development journeys also pass. Build and Pages Actions pass; [deployment, live readback and tracker evidence](development/2026-09-23-deploy-and-group-postings/deployment.json) retain their separate scopes. ACT-35 is delivered; ACT-32/M3 and ACT-33/M4 remain partial. All fifteen release gates remain open.

## Group hearth charters — 2026-09-24

**ACT-32 advanced; M3 remains in progress.** Select up to 128 owned hearths across registry pages and search, then apply an existing Works/Wealth/Learning/Muster charter with a per-work coin ceiling or revoke current charters together. Army and hearth selections remain independent across tabs. Registry rows expose current policies and blockers. The form explains the shared 40-coin reserve, per-hearth spending and Muster upkeep. Existing production queues and treasury are unchanged by assignment/revocation; individual overrides still affect only one hearth.

**Authority and scale.** One strict bounded worker request records existing commands in stable settlement-ID order and returns one final permitted observation with partial refusal results. An authored 40-hearth comparison transfers 193,929 versus7,409,845 bytes with identical archives, replay and hash. Recording/display interruption settles pending work and requires saved-campaign recovery. Rules/save 31, content 015468d1, AI and pacing are unchanged.

**Local verification.** 1,889 tests across 235 files pass with four local test workers; 12 affected browser journeys pass. The authored 40-hearth/100-owned-army Legendary journey verifies cross-page/filter/tab selection, keyboard/narrow controls, preserved queues, individual override and exact save restoration. Separate cases verify canonical capacity refusal and damaged-response recovery. [Evidence, failed attempts and independent reviews](development/2026-09-24-group-charters/README.md); [architecture](architecture/0040-group-charters.md). Durable named groups, theaters/patrol/escorts, saved reusable templates and broader governor decisions remain. All fifteen gates remain open; publication is recorded separately.

## Group army postings — 2026-09-23

**ACT-32 advanced; M3 remains in progress.** Select up to 128 land armies ashore in the paginated realm registry, retain selection across search and pages, and assign Hold/Join postings at each army’s position or one owned hearth. Clear existing postings together; accepted armies leave the selection and refused armies remain with their canonical reason. Individual orders override one member independently. Selection is temporary; ordinary postings survive save/load.

**Scale and authority.** One bounded worker request records each existing command in stable army-ID order and publishes one final filtered observation. An authored100-army comparison transfers531,302 bytes versus51,416,921 for serial requests, with identical archives, replay and final hash. No rules, save, content, AI or pacing change. Invalid envelopes mutate nothing; valid groups report partial refusals. Recording or display interruption ends pending work and requires recovery without falsely promising rollback.

**Verification.**1,876 headless tests and seven affected browser journeys pass, including100 armies/40 hearths, individual override, real capacity refusal, save restoration, keyboard/narrow controls and two damaged-response recoveries. Typecheck, lint, content/art validation and production build pass. [Evidence and reviews](development/2026-09-23-deploy-and-group-postings/README.md); [architecture](architecture/0039-group-postings.md). Theater/patrol/escort roles, named groups, policy templates and combined mature-empire acceptance remain. All fifteen release gates remain open.

## Fleet provisions and naval staging — rules/save 31, 2026-09-23

**ACT-35 delivered.** Fleets carry eight turns of stores beyond friendly harbour supply. Their last ration feeds everyone aboard; a further turn at sea costs hulls and passengers four strength per formation, with the existing strength floor and reduced recovery. Returning to supply replenishes stores. Splits copy endurance and transfers/merges retain the shorter endurance, so reorganizing cannot refill a fleet. Selected fleet and passenger panels expose remaining turns and replenishment guidance; foreign stores stay private.

**AI.** Fleets plan a return through observed, permitted water, account for visibility-limited sailing, stop to refill, finish immediately safe landings and pay for staging harbours near depleted expeditions. Review reproduced and fixed a coastal ship choosing nearby deep-water supply over reachable shallows. The planner remains bounded to eight fleets/eight route queries per pass and two nearby return candidates; optimal harbour chains and every lost-port recovery are not proved.

**Measured, with prices unchanged.** The final Standard-map, twelve-realm Epic campaign ends at **379 turns**, inside 350–400, compared with 388 at rules 30. Long improves 367→342 but remains above its about 300 target; Standard moves 223→234 and remains above about 200. All seven headline/proxy measurements reach victory with zero refused orders. No price, timeout or proxy bound was changed. A separate generated 100-round island campaign records 2,819 accepted commands, 86 refills, six landings and two transported foundings; one fleet and its passengers each suffer one attrition turn. Its saved mirror is exact.

**Compatibility and verification.** Rules/save 31 adds optional canonical fleet stores; content remains `015468d1`. Six genuine rules 30 saves/archives retain original bytes and replay. Modern and mixed histories survive saving, local storage and compressed export/import. Typecheck, lint, content validation, Pages-subpath production build, **1,861/1,861 tests** and **9/9 affected browser journeys** pass. Desktop and 390px screenshots are inspected. Synthetic Huge/Legendary supply resolution measures 5.81/10.42ms median; naval planning 41.89/79.53ms, versus 33.77/63.04ms without the provision policy. This is added AI work, not a performance improvement or a full scale gate.

**Evidence and remaining work.** [Verification, historical comparison, benchmark, screenshots and reviews](development/2026-09-23-fleet-provisions/README.md); [architecture](architecture/0038-fleet-provisions.md); [draft dispatch](updates/fleet-provisions-work-packet.md). Material supply costs, trade, taxation, treaty access, coordinated escorts/reinforcement, broader naval recovery and Standard/Long pacing remain open. All fifteen release gates remain open. Published as `b623c2c91d4d852cba710f2d996c28a6b1b5d624`; GitHub Verify build and Pages deployment passed on 2026-09-23. Publication does not close a release gate.

## Pacing measurement is a tool, and CI stays build-only — 2026-09-23

**The tool.** `pnpm measure:pacing` plays AI campaigns to their victory and reports the turn each ended on, the victory path, depots standing and any order the planner asked for that the rules refused. Named cases: `headline` (a standard map with twelve realms - the campaign the 350-400 turn target actually describes), its Long and Standard siblings, and the four `proxy-*` cases the pacing tests play for speed.

**The standard.** `AGENTS.md` and the three pacing test files now state that the headline campaign is what a pacing change is judged against, that the tiny four-realm campaigns are proxies whose bounds are derived from the tool rather than defended, and that a genuine headline drift is resolved either by fixing the change - usually the AI not yet playing a new rule - or by re-pricing the pace deliberately with the current pack frozen, as rules 18, 21 and 22 each did. Tuning a constant until a proxy bound turns green is neither.

**CI stays build-only.** `Verify build` runs install, typecheck and the production build; Pages publishes it. No workflow has a test step and none should gain one. Every deep check - `pnpm test`, `pnpm test:gameplay`, `pnpm measure:pacing` - runs on the development machine, because hosted runners render WebGL in software and time out on long campaigns and browser journeys while the game is correct.

## The budget the planner offered twice — 2026-09-23

**The fix.** A turn's plan pays for an arcane survey, a supply depot and a patronage subsidy before it works out the budget for everything else, and that budget was computed from the treasury without subtracting any of them - so the planner could commit coin it had already spent and the simulation refused the order. The survey has leaked twenty-four coin a turn since rules 23 and the depot forty since rules 28; neither surfaced until a change moved campaign trajectories.

**Fleet provisions, built and reverted.** Fleets are supplied wherever they are. The intended fix - a fleet works a fixed number of turns beyond its realm's reach, then wastes until it returns inside a harbour's supply - was built, tested and measured, then reverted: the headline twelve-realm campaign ran 427 turns at eight provision turns and 412 at sixteen, against a 350-400 target and 388 without it. Provisioning lengthens campaigns because naval invasions fail, and they fail largely because the AI does not plan around fleet supply at all. Shipping it needs either AI naval staging measured back into band, or a deliberate Epic re-price with the current pace pack frozen.

**Measured.** The headline campaign measures 388 turns with the budget fix, unchanged and inside the target. No rules, save or content change; the seal stays `015468d1`.

## Harbours carry supply over water — rules/save 30, 2026-09-23

**The reach.** A hearth with a harbour carries its supply line out over the water - the same budget, the same road bonus, the same enemies cutting it - so a fleet or a landing near a friendly coast is fed without building a post. An ordinary hearth still stops at the shore and a depot is still a land post, so harbours gain a second reason to exist beyond launching hulls.

**Two clean passes.** Water-crossing previously depended on which line won a tie to a hex, which is the kind of order-dependence that produces a bug nobody can reproduce. Supply is now one land pass seeded from hearths and depots, then one water-capable pass seeded from harbours, merged so the first line to reach a hex feeds it.

**Additive.** Nothing that was fed stops being fed. Fleets remain exempt - a hull at sea is supplied wherever it is - and removing that exemption changes how naval wars are fought, so it belongs in its own measured slice.

**Measured.** The headline twelve-realm epic campaign runs 389 turns with seventeen harbours standing, identical to the 389 it ran before this change and inside the 350-400 target.

**Save compatibility.** Rules 30 changes behaviour, not state or content: the seal stays `015468d1`. A genuine rules-29 campaign and its archive from deployed `d70f18e` load at turn 61, re-seal to identical v29 bytes, replay exactly and round trip through a v30 envelope.

## Raiding a supply line — 2026-09-23

**The change.** A military company scoring a destination now counts a hostile depot within three hexes among its objectives, weighted below the ordinary approach to an enemy force: it takes a post that lies on its way and never marches for one. No rules, save or content change - the depot, its destruction and its reach were all built in rules 28, and this is the AI client learning to use them.

**Tuned to what the measurement said.** The first cut looked eight hexes out and weighted a depot at four times the pull of an enemy army. The headline twelve-realm campaign ran 446 turns against a 350-400 target with three hundred depots razed, because armies chased supply posts instead of fighting and both sides spent the campaign rebuilding. Narrowed to three hexes at a weight below the approach, the same campaign runs 389 turns - one off the 388 it ran without raiding - while still razing two hundred and thirty-eight depots.

## Seeing supply, playing supply, and what pacing measures — rules/save 29, 2026-09-23

**The overlay.** The ground a realm's hearths and depots can feed is drawn under everything else on the map, on by default and switchable from the map guide. `Observation.suppliedCells` carries the same search that already answers every army's supply status, computed once per observation.

**Abandoning.** Rules 28 let a realm create an upkeep obligation it could not end short of an enemy taking it. A realm may now pull down its own depot from the company standing on it.

**The AI plays supply.** A realm at war whose force is wasting outside supply raises a depot under it - one a turn, out of surplus, under the largest suffering force, never in peacetime. Measuring what happened rather than pass/fail found three real planner defects, each of which would have shipped: it ignored foreign land claims, it took a company the arcane survey had already spent, and it ignored the thirty-two-depot cap. All three are the same class of mistake - planning from one snapshot without reconciling against the rules or its own earlier orders.

**What pacing measures.** Two earlier reverts concluded that AI supply awareness shifts campaign length out of band. That was wrong: the pacing tests play a four-realm tiny map, while the 350-400 target describes a standard map with twelve realms. Measured under rules 29 with the AI playing supply and no content change: the headline epic campaign runs 388 turns, inside the target, at the unchanged Epic price; the tiny proxies run 201 (standard), 290 (long) and 296/464 (epic, two seeds). Sweeping the Epic price to 44,000 and 52,000 overshot the headline to 411 and 440, so the content pack is untouched and the proxy bounds are re-derived from measurement and labelled as proxies.

**Save compatibility.** Rules 29 adds one order and no content: the seal stays `015468d1`. A genuine rules-28 campaign and its archive from deployed `e8cb13e` load at turn 61, re-seal to identical v28 bytes, replay exactly, round trip through a v29 envelope and continue.

## Supply depots — rules/save 28, 2026-09-23

**The build.** A company spends its movement and forty coin to raise a depot where it stands. The depot feeds two hexes of open country around it, or four along a road - half a hearth's reach, seeded into the same search - so a realm can extend supply by building rather than only by conquering, including after a landing overseas.

**The cost and the risk.** Two coin a turn, charged with every other obligation. Depots of one realm keep three hexes apart and a realm may hold thirty-two, so reach is a network of posts rather than a carpet. Any enemy company that walks onto a depot razes it at the end of the turn, and both realms are told, so a supply network is a thing to raid and a thing to defend.

**Refusals.** An embarked army, a spent company, an empty purse, a hearth already on that ground, a depot already there, a neighbour's claim, then the spacing rule - and the UI offers them in the same order the rules do.

**Save compatibility.** Rules 28 adds state, not content: the seal stays `015468d1`. A genuine rules-27 campaign and its archive from deployed `b840150` load at turn 61, re-seal to identical v27 bytes, replay exactly, round trip through a v28 envelope and continue.

## Supply lines — rules/save 27, 2026-09-23

**The reach.** Every hearth feeds four hexes of open country around it, and twice as far along a built road. Supply is derived from the map on demand: nothing is stored and the save shape is unchanged. An enemy company standing on a hex stops supply through it, a foreign hearth blocks it, and a hearth under siege feeds nobody.

**The cost.** Each turn outside supply a company loses four strength, down to a fifth of its full strength and no further, and recovers morale and fatigue at a third of the ordinary rate. A force of fewer than three companies forages for itself, as does any expedition carrying a caravan and every army of a realm that holds no hearth - which is every realm's opening. Because supply follows hearths, taking a border town is what lets an invasion continue.

**What it says.** The selected force names the hearth that feeds it or what standing outside costs it, and a starving force is named in the turn list under its own heading ahead of ordinary idleness.

**Measured.** Two first-cut rules were wrong and the campaign suite caught both: attrition from two companies starved colonising expeditions and stopped AI expansion, and suppressing recovery entirely drove morale to one so no realm reached a victory in its window. An attempt to teach the AI to march worn unsupplied armies home pushed campaigns past their turn caps and was reverted.

**Save compatibility.** Rules 27 changes behaviour, not state or content: the seal stays `015468d1`. A genuine rules-26 campaign and its archive from deployed `bb6fa8d` load at turn 61, re-seal to identical v26 bytes, replay exactly, round trip through a v27 envelope and continue.

## Attention grouped by cause — 2026-09-22

**The grouping.** Every next-action candidate now carries the cause that put it there - movement remaining, an interrupted route, a stalled posting, an empty production queue, a stalled charter or unassigned households - derived from the same observation its reason already came from. The command bar lists one row per cause, largest first, and each row is its own navigable queue: clicking it jumps to the first entity of that cause and the existing Next/Previous controls cycle within it.

**Scope.** A UI change over the existing read model. No command, no state, no rules or save bump, and the content seal is untouched. Totals, shortcuts, wrap-around order and the spoken notice are unchanged.

## Standing postings and muster points — rules/save 26, 2026-09-22

**The order.** An army may be posted to a hex it has explored. Each turn it marches there under the ordinary travel order - same pathing, visibility and hostile-sighting pause - and then holds the hex or joins the force standing on it, merging the turn it arrives under the ordinary command-capacity rules. A posting only starts a march for an army with no travel order of its own, so an active route runs and a paused route keeps its reason.

**The muster point.** A hearth may name one. Every company it raises is posted there the turn it forms and joins what it finds, which removes the per-company marching and merging the production panel used to ask for by hand.

**Attention.** A posting states where it stands - marching, standing, the paused route's reason, no known route, nothing to join, or aboard a fleet - derived on demand rather than stored. An army under a working posting leaves the next-action list; a stalled one appears with the posting's own reason.

**Save compatibility.** Rules 26 adds state, not content: the seal stays `015468d1`. A genuine rules-25 campaign and its 2,181-order archive from deployed `a29ec80` load at turn 61, re-seal to identical v25 bytes, replay exactly, round trip through a v26 envelope and continue ten more turns. Older envelopes refuse a campaign holding a posting, and rules 25 refuses the commands.

## Standing charters — rules/save 25, 2026-09-22

**The policy.** A hearth may hold one standing charter. It places an order only when the queue is empty, so anything ordered by hand takes precedence; revoking returns the hearth to direct orders. A charter never spends more than its ceiling (4-64 coin) on a single work and never draws the treasury below 40 coin, and it is answered after upkeep is paid so a policy cannot starve a wage.

**What it builds.** Works, Wealth and Learning finish the same hearth and differ only in what they reach for first, with ties falling to the cheaper work; Muster raises the most capable company the ceiling allows, never a caravan or a hull. Every order goes through the ordinary production rules, and a hearth that changes hands ends its charter. The next work, or one of five plain refusals, is derived on demand rather than stored, so no explanation is ever stale in a save or a replay.

**Attention.** A hearth under a working charter leaves the next-action list entirely; a stalled one appears with the charter's own reason in place of the generic empty-queue notice. The AI leaves a Works charter on hearths a turn's orders could not reach, and never charters Muster.

**A latent cycle closed.** `save.ts` took `MAX_EVENTS` from `simulation.ts` while `simulation.ts` took `MAX_FACTIONS` back; `MAX_EVENTS` bounds a schema built at module scope, so any entry point that reached `simulation` first left that bound undefined and every save failed validation. `MAX_EVENTS` now lives beside `MAX_FACTIONS` in `save.ts`.

**Save compatibility.** Rules 25 adds state, not content: the seal stays `015468d1`. A genuine rules-24 campaign and its 2,589-order archive from deployed `0fd242a` load at turn 61, re-seal to identical v24 bytes, replay exactly, round trip through a v25 envelope and continue ten more turns. Older envelopes refuse a campaign holding a charter, and rules 24 refuses the command.

## Unbinding and culture traditions — rules/save 24, 2026-09-22

**The counter.** Unbinding strips the binding from one active enemy formation: any ward is undone and every Waykeeper escorting that formation loses the coming round. It costs five strain and may be used once a battle. A formation carrying neither a ward nor a caster is refused with a reason, and the interruption is ordinary saved state, so it survives save, replay and the chronicle.

**Faction asymmetry.** A Waykeeper takes the aptitudes of the culture that appoints them. The Cinder March and Emberwake Convocation reach the second degree of Flame; the Sepulchral Synod and Margin Observance reach the second degree of Rune, which is what Unbinding requires. Every other culture keeps the common training and cannot counter at all. A discovery inside a realm's own tradition is studied at three quarters of its price, so access and cost both depend on who you are.

**Content versioning.** Magic content is now versioned inside the content seal the way the pace table already was: a pack is sealed with the workings that campaign could reach. Every frozen pack still reproduces exactly — rules 17 `b79c78ed`, 18 `98b97bba`, 19-20 `3127e431`, 21 `f70d99d5`, 22-23 `f4076f55` — and rules 24 seals as `015468d1`.

**Save compatibility.** A genuine rules-23 save and its 1,944-order archive from deployed `ef7a831` load, re-seal to identical v23 bytes, replay exactly, re-seal into a v24 envelope and continue. Historical rules refuse the new theory and older envelopes refuse a campaign that researched it.

**Verification.** 1,812 tests pass; browser journeys pass.

## Arcane seams — rules/save 23, 2026-09-22

**The first half of M2.** The Ashfall left arcane seams under Ashfall-glass ground. Where a seam lies is derived from the world's seed like any other natural feature, so a save records only which realms have paid to survey them: a standard map hides fourteen seams among a hundred and sixty-two visible glass hexes, a tiny map three among twenty-three.

**A paid search.** Any company may spend its movement and 24 coin to survey the ground it stands on, revealing seams within two hexes to that realm alone. An empty survey says so and still costs. A surveyed seam inside a realm's borders draws two ashglass a turn beside the hearth's ordinary yield and falls with that hearth.

**Site-gated discovery.** Arcane Theory now needs a surveyed seam inside the realm's own borders, so magic begins with geography a realm must find, take and keep. Until this slice, ashglass — the one arcane-tagged resource — had no magical consumer at all.

**AI and UI.** A realm holding no seam surveys its own hinterland from surplus at most once every six turns, prefers a surveyed seam when its borders grow, and never marches a surveying company away in the same turn. The selected company offers a survey with its price and its refusal reason; the Arcane Theory tab lists surveyed seams and whether each is held.

**Save compatibility.** A genuine rules-22 save and its 1,993-order archive from deployed `6644f80` load, re-seal to identical v22 bytes, replay exactly, re-seal into a v23 envelope and continue. Content is unchanged; historical envelopes refuse arcane surveys.

**Measured.** A standard twelve-realm campaign with eight city-states ends on turn 231; six realms surveyed and held a seam and one completed Arcane Theory through it.

**Verification.** 1,810 tests pass; browser journeys pass, including a new survey journey.

## Campaign-safety scenarios re-run against the rules that ship — 2026-09-22

**Why.** The campaign-safety findings were corrected and independently reviewed under rules 17. Rules 18-22 then changed campaign pacing, added the Unification victory, made sieges consume stored food, seated city-states and added client obligations, so M0 could not close until those scenarios were proved again under the rules that actually ship.

**What the audit found.** Eight of the nine findings were already exercised at current rules: training morale (four of five tests; the fifth is a captured rule-16 evidence test and stays frozen), whole-army frontage, movement and quote parity, both storage durability defects, fresh current-version origins, and the two naval AI findings all run with ordinary commands on unpinned campaigns. One did not: the pending-assault regression built its garrison, siege and turn at rules 17 only, so the food-store siege model introduced at rules 20 never touched it.

**What changed.** That regression now builds its scenario under the rules being checked and proves the same invariant at rules 17 and at the shipping rules. The remaining rule-16 cases stay pinned on purpose: they are captured evidence that old envelopes still refuse what they refused.

**Result.** The retained set — ten files, 66 checks — passes against the shipping rules. No finding re-opened. The roadmap item now asks that each scenario keep running against the rules that ship rather than the rules it was first closed under.

**Verification.** 1,806 tests pass.

## Client states and negotiated unification — rules/save 22, 2026-09-22

**Patronage.** A realm may take another realm as its client: a subsidy paid on acceptance, tribute every turn for an agreed term, and no war between patron and client while the oath holds. The client keeps its own hearths, armies and orders. Every term is disclosed before consent; an offer that can no longer be funded says so rather than failing on acceptance. A patron may release a client; a client may renounce lawfully once the term ends, or as a breach that ends the binding peace between them and is remembered as a grievance. A client that cannot pay for three turns running falls out of its obligation. Patronage may not chain, cycle, duplicate or cross an active war.

**Negotiated unification.** A client's hearths stand behind its patron's bid, so the second victory path is reachable through diplomacy as well as conquest. The Victory tab separates hearths held from hearths pledged.

**AI.** Realms court weaker neighbours — city-states first — at most once every ten turns, weigh an offer against their own hearths, income and wars, and never plan a war on their own patron or client. Answering an offer ends the planning pass so the rest of the turn is planned from the new facts.

**Save compatibility.** A genuine rules-21 save and its 2,037-order archive from deployed `cce82cf` load, re-seal to identical v21 bytes, replay exactly, re-seal into a v22 envelope and continue. The rules-21 content pack is frozen as `f70d99d5`; historical envelopes refuse patronage.

**Balance.** Patronage keeps patrons and clients out of each other's wars, which lengthened the longest campaigns, so Long is now 32,000 and Epic 36,000. Standard/12 + 8 city-states ends on turn 205, 283 and 342 for Standard, Long and Epic; tiny Epic runs 302–412.

**Verification.** 1,805 tests pass; browser journeys pass.

## City-states, wider realms and forty-two-realm maps — rules/save 21, 2026-09-22

**City-states.** Twenty-four chartered single-hearth powers now settle the land between realms, each borrowing one culture's art and roster while keeping its own name, banner colour, motto and lore (`docs/lore/CITY_STATES.md`, a new book in the site's lore library). They found nothing beyond their one hearth, open no wars and pursue no victory, but they build, defend, hold territory and answer peace offers through the ordinary commands. A campaign seats up to twenty-four of them.

**Wider realms.** Founding costs less as a realm grows, civic borders grow in a handful of turns instead of dozens, and administration and territory upkeep are gentler, so realms plant and keep many more hearths. Seats past the authored roster take their own epithet and colour, and the renderer washes their borrowed art in that colour, so a crowded map never shows two identical banners. Campaigns seat up to forty-two realms plus their city-states.

**Save compatibility.** A genuine rules-20 save and its 1,192-order archive from deployed `c7089f1` load, re-seal to identical v20 bytes, replay exactly, re-seal into a v21 envelope and continue. Rules 19–20 content is frozen as `3127e431`; historical envelopes refuse city-states.

**Balance.** Standard/12 + 8 city-states now ends on turn 199 (Standard), 303 (Long) and 447 (Epic); tiny Epic runs 398. The map is painted by the end: 42 realms and 12 city-states claim 88% of the standard map's land by turn 193, and the Epic twelve-realm campaign reaches 89%. Unification now needs two thirds of the world's hearths and at least eight.

**Fixed.** The growth panel quoted founding and upkeep at rules-16 prices while the turn charged rules-21 prices. The AI could also reserve more coin for its victory project than it actually had free, cancelling the caravan and hull it had already protected.

**Verification.** 1,798 tests and 182 browser journeys pass.

## Sieges eat stored food — rules/save 20, 2026-09-22

**The change.** A blockaded town's food yield is cut off while its people keep eating, so siege supplies now count the whole turns its actual food store lasts. Only when the store is empty does the militia lose morale each turn. Well-fed, developed towns hold out longer. Attackers choose between an early assault on a high-morale garrison and starving it out. The siege panel shows "Food stores: N turns". Defenses still fall over three turns. Historical rules keep the fixed three-turn count, and older envelopes refuse stores above 3.

**Save compatibility.** Content is unchanged (`3127e431`). A genuine rules-19 save and archive from `a7bf367` load, re-seal identically, replay and continue.

**Balance.** Pacing still holds on Standard/12: 207, 267 and 316 turns for Standard, Long and Epic. Tiny Epic runs 363–416 turns.

**Verification.** 1,797 tests pass.

## Unification victory — rules/save 19, 2026-09-22

**The second victory path.** A realm that holds more than half of the world's hearths (at least 6) opens a public Unification bid at its capital when a round ends. Holding the majority and that capital through the pace's response window (20, 40 or 60 turns) wins. Rivals see the bid on the public ledger, and the AI already targets rival victory hosts. Losing the capital or the majority ends the bid.

- The Victory tab (renamed from Prosperity) shows hearths held versus needed and what still blocks a bid.
- The chronicle epilogue and the victory banner name the path.

**Save compatibility.** Rules 18 content is frozen as `98b97bba`. A genuine rules-18 save and its 2,990-order archive written by deployed `4483219` load under rules 19. They re-seal to identical v18 bytes, replay to the same hash and continue 20 rounds. Historical rules never open bids and older envelopes refuse them.

**Balance.** AI campaigns still conclude through Prosperity within the pace targets; AIs rarely reach a world majority.

**Verification.** 1,796 tests in about 26 s, including `unification.test.ts`; 23/23 affected browser journeys. This delivers M1's unification path; client states remain pending.

## Civilization-scale campaigns, new map types and build-only CI — 2026-09-22

The owner redirected the game toward a manageable, Civilization-like scale. They also asked for a simpler test suite, CI that only checks the build, and a deployed working build.

- **Rules/save 18 pacing.** Only the Long and Epic Prosperity prices changed; response windows and civic prices are unchanged. On generator 8 Standard maps with 12 AI realms:
  - Standard concludes at turns 211–230.
  - Long concludes at turns 259–295; all seven map types fall between 259 and 322.
  - Epic concludes at turns 329–389.

  **Save compatibility:** rules 16–17 saves load under the frozen `b79c78ed` pack and continue. Their envelopes re-seal to identical bytes, and a 22,914-order rules-17 archive replays unchanged. Rules 17 and earlier cannot execute generator-8 worlds.
- **Generator 8.** Maps are somewhat smaller: Standard is 224×140 with 12 recommended realms, and sizes run from Tiny 48×32 to 352×220. There are seven map types: Continents, Pangaea, Fractal, Islands, Archipelago, Earth-like (with latitude climate bands) and Inland Sea. Starts are shared out across landmasses. Generators 1–7 stay byte-identical, pinned by `historical-seals.test.ts`. The new-campaign form offers a Map type choice and defaults to Standard with 12 realms.
- **AI fix.** At peace, recruiting each newly unlocked unit role no longer starves expansion. Previously some cultures never funded a second caravan on certain maps.
- **Tests.** The full local suite has 1,793 tests and takes about 27 seconds (it was 81 seconds). Pinned refactor captures and duplicated historical regeneration were removed. There is now one campaign per pace, sampled seeds and cultures, and a mapgen suite that runs in 6 seconds. Seed-specific scenarios pin the generator-7 geography they were designed for.
- **CI.** Verify only typechecks and builds. Pages typechecks, regenerates the change feed, builds and deploys. Unit, campaign and browser tests run locally (`pnpm test`, `pnpm test:gameplay`).

## Campaign cost and test restructuring — local continuation, 2026-09-22

This continues **ACT-18 / DH-015 / M0** on the same local branch, following the user's request to continue toward 1.0 and to simplify the code, improve efficiency and trim test cost. Rules/save stay **17** and content stays **`b79c78ed`**. No gameplay, schema, timeout or worker change was made.

**Engine changes** are all exact. [Evidence](development/2026-09-22-campaign-cost/README.md).
- **Route previewer:** 94% of the naval AI's route previews were repeated searches to unreachable water. A sim `createRoutePreviewer` now answers those from the first search that proves the army's reachable area.
- **State hash:** it references remembered-land records that are already canonical instead of re-parsing them (54% of save bytes).
- **Battle reports:** finished reports are sealed (deep-frozen) and their validated copy is reused.
- **AI planners:** they share one observed-cell index.
- **Observations:** they use the typed explored-cell sort.

**Equivalence:** nine generated campaigns (125,026 AI commands, including all three Epic runs and the Standard/24 and Huge/32 contact maps) have **identical** command/result streams, per-turn hashes, final seals and save bytes compared with the pre-change candidate. In sequential idle runs, the archive Epic workload went from 23.7 s to 17.4 s and pacing Epic seed 74 from 31.2 s to 25.2 s. The Huge/32 contact workload went from 8.5 s to 8.0 s.

**Tests:**
- The Epic archive test's second full replay is replaced by an identity proof of the technical export.
- Pacing campaigns are split into parallel files.
- Contact probes skip unused land quotes.
- The changelog reuses one git feed build.
- Vitest now has `unit`, `campaigns` and `repository` projects. `pnpm test` still runs everything; `pnpm test:unit` is a fast loop (1,691 tests in 13.9 s locally).
- 28 new regressions cover the previewer, the land fast path and sealed reports.

**Results:** typecheck, lint, content validation and production build pass. The full Chromium gameplay suite passes 180/182. Its two failures also occur on the pre-change baseline: a lore React key bug, now fixed, and a stale menu keyboard-order test, now updated. Afterwards the affected journeys pass 4/4, the public-site journeys 18/18 and the Pages smoke 27/27. Two consecutive full runs pass **1,966/1,966** in 46.6 s and 47.3 s (baseline 80.6 s). Epic archive took **42.2 s and 43.3 s**, and the untouched original Epic test file also passes, at **48.5 s**, against 60 s.

**Still open.** No hosted CI run or commit exists. The last hosted run measured the long tests 2.4–3.3× slower than local runs, so hosted per-test budgets are still at risk. **ACT-18, DH-015, M0 and all fifteen gates remain open.** The [design audit](development/2026-09-22-campaign-cost/design-audit.md) records simplification, efficiency and gameplay-depth proposals for M1 and M3 planning. Next:
- Decide how hosted CI schedules the long campaign project.
- Obtain an authorized hosted run.
- Continue with M1: client contracts and contestable unification.

## Campaign verification cost — local continuation, 2026-09-21

The user's “okay go ahead” continues **ACT-18 / DH-015 / M0** on local branch `fix/campaign-verification-cost`, based on deployed `4ce95ae`. Three independently reviewed optimizations now reduce movement-query indexing, reuse the sight update's local disk, and select an AI destination without sorting the full candidate list when its comparison is pure and finite. Paths, blockers, callback behavior, fog memories, search budgets and saved results retain their captured contracts. **79 new regressions** cover those boundaries. Rules/save stay **17**, content stays **`b79c78ed`**; no gameplay, schema, dependency or art change. [Methods, measurements, rejected experiments and source manifest](development/2026-09-21-verification-cost/README.md).

Final typecheck, lint, content/art validation and production build pass. The unchanged full headless suite is **1,937/1,938 tests across 223/224 files**, with Epic archive the sole failure at **60.606 seconds against 60**; the run takes 82.48 seconds overall. All **25/25 affected Chromium gameplay journeys** and **27/27 rebuilt production Pages checks** pass, including real saved movement, naval transport, territory, contact and chronicles. These are scoped local browser results, not full gameplay, cross-browser, hosted CI or release acceptance. [Full log](development/2026-09-21-verification-cost/full-headless-c.log), [gameplay](development/2026-09-21-verification-cost/browser-gameplay.log), [production Pages](development/2026-09-21-verification-cost/browser-pages.log).

**M0, DH-015 and all fifteen whole gates remain open.** No timeout, worker cap, campaign activity requirement, workflow or historical seal was relaxed. DHARMA now marks **ACT-18 doing** and retains **DH-015 open**, with the actual local evidence. This checkpoint remains local and uncommitted; the public deployment remains `4ce95ae`, with no new hosted result. The [new developer packet](updates/campaign-verification-work-packet.md) is draft and the published journal's historical claims remain intact. Next: remove sufficient remaining Epic verification cost to obtain two consecutive unchanged full local passes and complete authorized hosted verification, then implement **M1 client contracts and contestable unification** under the [existing roadmap](1.0-DEVELOPMENT.md#active-development-roadmap). [Prompt report](development/prompt-reports/2026-09-21-verification-cost.md).

## Authorized development release — 2026-09-21

The user's DHARMA tracker request now explicitly authorizes committing, reconciling branches and deploying the completed work. Implementation checkpoint **`1e41ec24965e46e8035c57b4f54632a690b8b712`** contains the reviewed September 21 naval fixes, deterministic campaign optimizations, regression fixtures and retained evidence. The fourth developer dispatch and existing roadmap now describe that checkpoint, while the three historical dispatches keep their original source pins. This is a development release; **M0, DH-015 and all fifteen whole 1.0 gates remain open**. Rules/save remain **17**, content remains **`b79c78ed`**. No new client-state, unification, magic, multiplayer or runtime-art feature is claimed.

Fresh candidate verification passes typecheck, lint, content/art validation and the production build. The unchanged full headless suite passes **1,858/1,859 tests across 220/221 files**, with Epic archive verification the sole failure at **66.513 seconds against 60**. All **27/27 production Pages browser checks** pass at the actual `/Theandril/` base, including the current journal, roadmap and real game/save journeys. These scoped Chromium results do not clear full campaign or cross-browser acceptance. [Release evidence and independent review](development/2026-09-21-release-reconciliation/README.md).

The obsolete campaign checkpoint and developer-dispatch branches were already merged. The original backup contains no missing gameplay changes and is retained in a verified local Git bundle before pruning; its oversized trace is not restored to published history. The old release worktree remains detached at its original commit with **all 547 unreviewed modified files preserved byte-for-byte**, plus a local recovery archive. Those art-report/screenshot changes are not part of this deployment. The remote checkpoint branch is pruned; only remote `master` remains. [Branch inventory](development/2026-09-21-release-reconciliation/branches.md), [recovery metadata](development/2026-09-21-release-reconciliation/recovery.json).

**Deployed and verified:** `274d0e28c1ab9de4fc7fc43fde9f0579fc48fee4` is live after [Pages run 35675919748](https://github.com/ErikBurdett/Theandril/actions/runs/35675919748). The actual public site passes **27/27 production browser checks in 40.7 seconds**; its change ledger independently confirms the exact deployed revision. [Live evidence](development/2026-09-21-release-reconciliation/live-identity.json), [browser log](development/2026-09-21-release-reconciliation/browser-live.log). The same commit's [Verify campaign run 35675919711](https://github.com/ErikBurdett/Theandril/actions/runs/35675919711) remains red at **1,855/1,859 tests**: Epic archive (149.966 s / 60 s), Standard/24 contact (20.938 s / 20 s), Huge/32 contact (33.253 s / 20 s), and Epic seed-74 pacing (96.892 s / 60 s) time out. Later art/build/gameplay/benchmark steps in that workflow are skipped. These are reported timeouts, not failed contact/victory assertions. [Exact hosted results](development/2026-09-21-release-reconciliation/deployment-summary.json).

The primary checkout is on synchronized `master`; the temporary integration branch is pruned too. DHARMA now marks **ACT-17 done**, **ACT-18 next**, **DH-015 open**, and **ACT-21 backlog** because the preserved worktree and separate Hearth & Card retirement scope remain. Its local site and Markdown were rebuilt with the actual deployment evidence. Next development remains **ACT-18 / DH-015: make unchanged Epic verification pass twice locally and complete hosted verification**, then **M1 client contracts and a contestable unification victory**, followed by **M2 magic discovery/casters/counterplay** and **M3 empire delegation** in the [existing roadmap](1.0-DEVELOPMENT.md#active-development-roadmap). [Prompt report](development/prompt-reports/2026-09-21-release-reconciliation.md). The sections below retain their dated pre-publication results; their former no-commit/no-publication statements describe those earlier passes.

## Epic baseline continuation — 2026-09-21

This local pass retains two independently reviewed optimizations: movement searches reuse a search-local neighbor buffer and omit unused range predecessors; naval planning prepares observed geography and navigation only when consumed within the current plan. Routes, node budgets, command ordering, expenditure and held armies retain their captured results. **39 new regressions** cover neighbor topology and complete naval proposals; the authored paid voyage still preserves all 22 accepted commands and final hash `fa29672f`. Query improvements are modest and mixed, and the naval sample is a detached-observation benchmark, not a whole-campaign speedup. [Evidence and scoped reviews](development/2026-09-21-epic-baseline/README.md).

The unchanged default full headless suite passes **1,857/1,858 tests across 220/221 files** in **87.84 seconds**. Epic archive verification remains the sole failure at **64.779 seconds against 60**. Eight-worker and four-worker diagnostics also fail Epic, at 64.474 and 63.069 seconds respectively; neither runner policy is adopted, and test configuration remains unchanged. [Default result](development/2026-09-21-epic-baseline/runner/default-b.summary.json), [runner review](development/2026-09-21-epic-baseline/review/runner.md). Final Node 22.23.2 typecheck, lint, content/art validation and the [production build](development/2026-09-21-epic-baseline/build.log) pass. Affected Chromium gameplay passes **25/25** in 2.6 minutes; rebuilt production Pages passes **27/27** in 28.9 seconds. [Gameplay log](development/2026-09-21-epic-baseline/browser-gameplay.log), [Pages log](development/2026-09-21-epic-baseline/browser-pages.log). These checks cover scoped Chromium journeys, not the complete gameplay or cross-browser gates. A test-only capture-path correction now writes compendium screenshots to the current test output instead of overwriting historical documentation evidence; its assertions and runtime behavior are unchanged.

**M0 and all fifteen whole release gates remain open.** Hash-kernel, validation-wrapper and alternate-heap experiments were not adopted; archive command reuse and a shared preview session were not introduced. Rules/save remain **17**, content remains **`b79c78ed`**, and no schema, gameplay-rule or art change is included. Read-only M1 interface plans supplement the retained rules-17 diplomacy fixture; client states and unification are still not implemented. Next, resolve actual Epic archive runtime under the existing gates, then implement M1 across canonical rules, human controls, AI and saved replay. The [developer packet](updates/campaign-foundation-work-packet.md) remains a local draft. No commit, publication or deployment has occurred.

## Historical campaign continuation — 2026-09-21

This local pass adds independently reviewed exact-output optimizations for explored-cell sorting, observation construction and technical-record formatting. Naval AI also requests an exact target preview without constructing its unused reachable overlay. The new API preserves the complete preliminary range search and shared 4,096-node budget; three callers change, while full map/UI queries retain all results. Captured observations, original sort/render oracles, historical records and an eight-turn paid voyage retain their complete results. The voyage preserves all 22 accepted commands and final hash `fa29672f`. [Implementation, measurements and reviews](development/2026-09-21-campaign-continuation/README.md).

Final Node 22.23.2 typecheck, lint, content/art validation and the Pages production build pass. Affected Chromium gameplay passes **25/25**; the rebuilt production Pages suite passes **27/27**. The unchanged full headless run passes **1,818/1,819 tests across 218/219 files** in 90.01 seconds; Epic archive verification remains the sole failure at **64.312 seconds** against 60. [Final log](development/2026-09-21-campaign-continuation/full-headless-final.log). The preceding 65.905-second failure and isolated 50.45-second pass remain retained; isolated and narrow benchmark gains do not clear the default or hosted gate. No timeout, scheduling, activity requirement or assertion was relaxed. M0 and all fifteen whole release gates remain open; these browser checks are scoped Chromium coverage, not a complete gameplay or cross-browser certification.

An encoded land/report cache was evaluated and rejected: changing-land whole hashes regressed by up to 45%, serialization-hook compatibility remained unresolved, and retained-memory costs were unproven. No experimental cache is imported by production. Rules/save remain **17** and content remains **`b79c78ed`**, with no migration or art change. A pre-change [diplomacy archive fixture](development/2026-09-21-campaign-continuation/m1-fixture/README.md) preserves real paid treaty and pending-offer behavior for M1; its authored initial contact placement is disclosed. Client contracts and unification are not implemented. Next, resolve the remaining repeated hash/pathfinding cost in the actual Epic archive workload, then carry M1 through rules, human controls, AI and saved replay. The existing [developer packet](updates/campaign-foundation-work-packet.md) remains a local draft. No commit, publication or deployment has occurred.

## Roadmap implementation started — 2026-09-21

The [existing 1.0 development workflow](1.0-DEVELOPMENT.md#active-development-roadmap) now orders the accepted work into M0–M10: stabilization, client states/unification, magical discovery, empire delegation, supply/trade/operations, independent powers/politics, epochs/crises, progression and a third victory, authored breadth, online campaigns and integrated release proof. Each milestone maps the existing public catalogue IDs to dependencies, owners, playable outcomes and acceptance. No release scope or quantitative target was cut. The public catalogue retains its bounded completion states and historical evidence pin; local delivery evidence is retained separately until publication is authorized.

The user's instruction to begin completing the roadmap authorizes the local AI fixes and verification that earlier reviews paused. Both original naval P2 findings now have independently reviewed corrections: paid queued harbors count toward the two-outlet commitment limit, and sparse-outlet founder selection precedes shared geography assessment. New regressions cover real payments, blocked/queued scout reserve release, saved travel through arrival/founding, and bounded chart work. The 61-cell synthetic chart now records 337 reads at each of 1/8/32/128 founders, instead of rising from 398 to 8,145. The 3,169-cell/128-founder whole-plan median is 59.257 → 1.353 ms; this is an idle detached-observation benchmark, not a campaign or renderer result. [Naval evidence](development/2026-09-21-roadmap-start/naval/README.md), [independent review](development/2026-09-21-roadmap-start/review/naval.md).

Profile-guided movement pruning skips edges that cannot improve a route and preserves all captured paths, costs, blockers and search-budget results. A generated Epic campaign before/after this and the naval correction retains 22,914 commands, 249 battles, zero refusals and final hash `1e4534db`, with campaign time 32.443 → 27.161 seconds in the retained local samples. A subsequent replay-only structural JSON comparison avoids encoding both complete event/battle trees while preserving corruption rejection and unchanged technical serialization. A custom-omission edge found during review was corrected and regression-tested. Neither optimization changes canonical rules, schemas, historical seals or test budgets. Rules/save remain **17** and content hash remains **`b79c78ed`**. [Performance evidence](development/2026-09-21-roadmap-start/performance/README.md), [movement review](development/2026-09-21-roadmap-start/review/movement.md), [replay review](development/2026-09-21-roadmap-start/review/chronicle.md).

**M0 remains in progress.** Final Node 22.23.2 typecheck, lint, content/art validation and the Pages production build pass. The unchanged full headless suite passes **1,768/1,769 tests across 215/216 files**; Epic archive verification takes **66.351 seconds** against its unchanged 60-second limit. Standard/24 contact, Huge/32 contact and Epic seed-74 pacing pass locally. The isolated Epic run passes in 52.03 seconds, which does not close the parallel or hosted gate. Earlier failed logs remain retained, and overlapping targeted tests are not added to the full count. [Final full-suite result](development/2026-09-21-roadmap-start/full-headless.log). No whole 1.0 gate is signed off; client states and the new victory remain the next feature after the foundation checkpoint.

Affected Chromium gameplay scenarios pass **20/20**; the rebuilt Pages suite passes **27/27** at `/Theandril/`, including roadmap keyboard/narrow-screen journeys and actual production game checks. This is scoped gameplay coverage plus the complete Pages suite, not a complete gameplay or cross-browser certification. [Verification and retained screenshots](development/2026-09-21-roadmap-start/README.md). The [developer dispatch](updates/campaign-foundation-work-packet.md) remains a local draft; no commit, publication or deployment was performed.

## Status readback — 2026-09-21

Local `master` and GitHub `master` both resolve to `f07024fe23ad3386874656d48fbbc33a5380d979` (September 12). At that revision, [Pages publication passed](https://github.com/ErikBurdett/Theandril/actions/runs/34724815655), while [Verify campaign failed](https://github.com/ErikBurdett/Theandril/actions/runs/34724815613): **1,712/1,716 tests passed**, with timeouts in Epic archive victory, Standard/24 contact, Huge/32 contact and Epic seed-74 pacing. These are existing hosted results read back today, not a new local test run or evidence that the contact assertions failed.

The current assessment remains a substantial playable development build with all fifteen release gates open. Close the two outstanding AI review findings and obtain fresh integrated verification first; the recommended next feature is client-state diplomacy with a distinct, contestable unification/conquest victory, followed by a complete magical-site/caster/counter-magic loop and empire delegation. This review changes no gameplay, acceptance verdict or scope. The current slice-28 and roadmap records supersede conflicting descriptions in older milestone sections below. See the [status-review prompt report](development/prompt-reports/2026-09-21-project-status-and-next-development.md) for evidence and limits.

## Public roadmap and development helper — September 2026

The existing developer journal now exposes a dedicated [roadmap](https://erikburdett.github.io/Theandril/updates/roadmap/) at `/updates/roadmap/`, with **Completed** checkmarks, **In progress** and **Pending** labels. Its twenty-three bounded items follow four ordered stages: delivered foundations, partial playable systems, missing release systems and integrated release proof. Six delivered checkpoints are checked; eleven items are in progress and six are pending. Counts describe these editorial items, not a percentage of the game. Every one of the fifteen canonical 1.0 gates remains visibly open.

The roadmap extends `apps/web/src/updates/library.ts`, alongside the journal's existing scope ledger. Each item has a stable ID, immutable source evidence, affected gates, delivered behavior and explicit remaining acceptance. Search includes remaining work and exact named gate references; status/search filters survive refresh. Item permalinks open the relevant evidence and focus its heading context, and the release-gate reference remains available even when a filter has no results. Home, shared navigation and the dispatch scope section link to this same catalog. The authoring contract now requires maintaining roadmap and implementation status together; historical dispatch claims keep their original snapshots.

Gameplay claims were reconciled against source `fcae402da6c290b93a9a6933510c74538477ad04` on 2026-09-12. The page preserves the rule-17 checkpoint boundary: backend, storage and UI have scoped review approval; AI review and full integration are open. There are no simulation, save/schema, content-rule or runtime-art changes. Missing independent powers, full magic, politics/world crises, supply, multiplayer, cross-browser certification and final release proof remain visible; publishing this helper does not complete them.

Local verification: typecheck and lint pass; all **48/48 journal and site-tooling tests across 18 files** pass, including actual Git evidence resolution and full gate coverage. Content validation passes with unchanged hash `b79c78ed`. The parent's broad headless invocation passes **1,715/1,716 tests across 212/213 files**; the existing Epic chronicle-victory test exceeds its 60-second budget at 69.21 seconds. This retains the documented parallel Epic timing limitation, with no skipped test, relaxed budget or simulation change. These overlapping test sets are not added into a larger total. The production Pages build passes with the existing Zod annotation and main-bundle size warnings. The final rebuilt **27/27 Pages browser cases** pass, including all seven roadmap journeys and the existing actual-game production checks. Independent code/content/visual review is approved after reproducing and fixing same-document Back/Forward state restoration. Screenshots, source hashes and the failed broad-run log are retained in [roadmap evidence](development/roadmap/README.md); the [work packet](updates/roadmap-work-packet.md) keeps publication separate from release acceptance. The source snapshot describes game progress, while the current public change ledger records this helper's eventual publication commit.

## Current local development — audit remediation / slice 28

The premium audit at `b0a4cd86cdb30cd9e2d3a1f0c8a78da38f7987cd` remains a historical **NO SHIP** finding, not a live completion checklist. Use [the 1.0 development workflow](1.0-DEVELOPMENT.md), the ranked audit IDs and [campaign-safety decisions](architecture/0037-campaign-safety.md) for the current work.

**Current acceptance: backend, storage and UI checkpoints independently approved; overall integration remains blocked by AI authorization and incomplete final verification.** The capped-morale correction, fresh rule-17 origins, pending-assault correction and both original storage-durability corrections are independently approved at their reviewed postimages. Prior failed verdicts remain failed historical evidence, not relabeled green. Both bounded-reconnaissance defects remain unchanged. Exact prior verdicts are retained in `docs/development/integrated-review/{backend,ai,persistence}.verdict.json`; byte-faithful post-fix captures, new passing verdicts and scoped reconciliation are separate in `docs/development/post-fix-review/`.

- **Storage, original high/medium findings CLOSED:** full-prefix verification refuses unsafe no-op/append publication without losing the last readable generation or advancing its cursor. GC derives references from digest-verified payload links/manifests, including orphan-successor leases, before deletion rather than trusting a resealed undercount. Independent re-review passed **52/52 tests across five files and 14/14 additional probes**. The parent retained all seven temporary evidence files byte-for-byte and recounted those results; it did not rerun the probes or browser. See `post-fix-review/persistence.verdict.json` and `retained-persistence-evidence.json`. Approval is scoped durability correctness, not authentication or broad crash/performance certification.
- **Assault validation, original P2 finding CLOSED:** the loader uses untargeted stable-ID selection for settlement assaults, retaining field `defenderId` priority and original-envelope rule-16 whole-stack validation. Independent re-review passed **152/152 tests across 14 files**, including resealed 13-versus-16-formation omission rejection, valid continuation and unchanged twenty-formation limits. A supplemental in-memory script passed its decisive assault assertions before an invalid duplicate-ID historical fixture stopped it; its corrected retry was consent-blocked and was not run. Later assertions in that script did not execute, though the corresponding Vitest regressions passed. See `post-fix-review/backend.verdict.json`.
- **AI, P2:** queued second-harbor construction is not counted as funded, and the cargo filter rebuilds observed geography per founder before the fleet cap. The reviewer's additional probe was authorization-blocked; the parent clarification timed out without a response. AI checks/fixes are paused pending explicit authorization, not retried through another tool.

Current campaign rules/save version is **17**, with the same content, generator, roster and tactical battle-10 kernel. The real trained-battle save failure now round-trips after each accepted command; independently captured rule-16 hashes still match. Bounded whole-army defending contingents make oversized stacks contestable while leaving reserves intact, including naval cargo separation and settlement capture only after its garrison is actually cleared. Army and siege observations expose canonical committed/reserve counts. Invalid historical saves are not silently repaired.

Backend checkpoint before the latest review-fix cycle: **1,008/1,008 tests across 94 simulation/AI/chronicle/persistence files**, zero pending (`docs/development/stable-backend-tests.{json,log}`). The independent capped-training finding is fixed: campaign-17 aftermath removes only the training actually granted under the tactical cap; the parent rerun passes **5/5**, including morale **85 → 85** and the frozen rule-16 trace. Version-17 persistence manifests have fresh-origin manual/autosave coverage. Current movement queries and executable routes now share defending-frontage selection with direct attacks; AI consumes the canonical preview without discounting strategic reserves. Historical rule-16 over-cap rejection remains explicit. The earlier 698-test checkpoint and failed review remain retained, not relabeled green.

After the assault/storage corrections, the parent reran **753/753 simulation/chronicle/persistence/worker tests across 67 files**, zero pending, and all **125,150 historical rule-16 commands across eight campaigns** again match their exact results and final bytes. One originally invalid historical final save remains rejected. These are fresh non-AI checks, not a combined full-suite total or a retry of blocked AI probes. See `docs/development/review-fix-2/parent-post-fix-verification.json` and `legacy-replays-post-fix-2/summary.json`.

Storage safety has a documented cost: append/no-op saves read/hash/parse O(prefix bytes) inside the publication transaction, and queued-GC proof scans all stored payloads/manifests; the **64** cap limits deletions only. Single retained Chromium samples are **2217.0 ms cold / 1504.4 ms no-op / 1570.6 ms append**, not performance certification; large-store GC proof was not separately benchmarked. An unverifiable unrelated branch can atomically refuse an otherwise valid save when GC is queued; this preserves history at an availability cost. Overcounts without queued garbage are not proactively scrubbed. The large append records one real **refused** post-victory order, not fabricated extra gameplay. Full retained-archive equality and original hashes were rechecked; its large full replay was not rerun in this fix pass or independent re-review, and the re-review did not rerun Chromium. Exact evidence and limitations are in `docs/development/review-fix-2/persistence-REPORT.md`, `parent-persistence-evidence-check.json` and `post-fix-review/persistence.verdict.json`. Temporary review probes are preserved, not yet promoted to permanent regression tests; this is a follow-up suggestion, not an added release gate.

Both fresh stable-source campaigns complete with exact battle-boundary saves, midpoint continuation, final loading and full replay: Tiny/4 seed99 policy C ends with Glass Tide on turn **217** (6,804 commands, 120 battles, 33 captures); Standard/24 seed74 production AI ends with Mire Courts on turn **225** (49,998 commands, 581 battles, 74 captures). Zero refusals or source changes in either run. The parent recounted compressed command traces, verified saved-byte hashes and confirmed every retained gameplay source matched at that checkpoint; the new review-fix cycle requires fresh acceptance evidence. All **125,150 historical commands across eight campaigns** also replay exactly; one originally invalid historical final save remains rejected rather than silently repaired. See `docs/development/stable-checkpoint.json` and `legacy-replays-stable/summary.json`.

The bounded archive slice retains **114,244 orders / 1,496 battles** from the original Standard/24 Long campaign, with its rule-16 seal **`0f0b85f5`**. Actual Chromium IndexedDB save/load, downloaded portable export/re-import and full historical replay have retained evidence in `docs/development/hermes-archive/README.md`. The parent verified the exact original and both backup hashes/byte counts (`parent-artifact-check.json`). Manifest v2 reuses immutable chunks and atomic rotation; larger portable envelopes use bounded `TAC2` gzip, not implicit truncation or unlimited capacity. Large-case UI controls, other browsers, real quota/process-kill durability and mobile/sustained-memory certification remain unverified.

Evidence limits: the campaign harness's retrospective `summary.checkpoints` aliases nested live arrays; use contemporaneous `metrics.jsonl` for historical war/progression readings. This does not invalidate the verified final saves or command replays. Contact regression gates are scenario-specific: the Standard/24 seed74 campaign's latest entity-observed first contact is turn **72**, not universally within 60. Concurrent instrumented timings are not isolated performance certification. Synthetic co-located-stack diagnostics record current-rule owner-observation p95 of about **7.74 ms at 200** and **182.77 ms at 1,000** single-formation defenders; that is a scaling caveat, not renderer FPS or an organic-campaign benchmark (`docs/development/frontage-costs-stable/`).

Game/factory guidance updates are validated. The first independent archive review found no blocker in the persistence patch, but failed the then-current morale dependency; retain its verdict and **3,203,680 KiB RSS** replay caveat in `docs/development/persistence-review-initial-verdict.json`. The later independent integration review found the storage defects now closed by the separate post-fix review; neither older failed verdict is overwritten.

The narrow UI follow-up is now parent-verified and independently approved at its captured checkpoint: **28/28 development UI cases and 4/4 built-production cases**, with no failures, skips or flakes. Occupation completes at **390×844 and 100%/130% text**, with real pointer-hit evidence and canonical ownership/save outcomes; the capture panel is above map tools at `z-index: 7`. The parent inspected the fresh post-occupation PNG and the exact earlier desktop lifecycle PNG: both contain rendered terrain and entities, so the older desktop “blank renderer” assessment is corrected rather than counted as a renderer fix. All **17 captured UI source/test hashes** remained unchanged. Root typecheck, lint, content validation and production build pass at this checkpoint; existing Zod annotation and bundle-size warnings remain. Evidence: `docs/development/ui-review-current/parent-verification.json` and `parent-visual-review.md`. The first independent UI review found no additional source logic/security blocker but failed closed because the supplied diff had lost hunk whitespace and section separators. That failed verdict and corrupt capture remain retained in `ui-review-current/`, not relabeled green. The parent regenerated a separate byte-faithful `ui-review-v2/ui.diff`; independent re-review `deleg_491c7acd` subsequently passed. It validated all **17 sections / 33 hunks**, exact raw Git bytes, successful parse/reverse-check and reconstructed postimages against both manifests and the source present during review. Its verdict is retained as `ui-review-v2/ui.verdict.json`. The repair changes only **11 whitespace/newline bytes** in the evidence artifact, not UI code. An additional final Git-status/all-artifact freshness sweep was consent-blocked and was not executed or retried; no result or broader freshness guarantee is claimed for that step. This closes the sole UI capture-integrity blocker, not release, AI, persistence-durability or art approval.

The delivered backend, storage and UI review outcomes are reconciled in `docs/development/post-fix-review/summary.json`. Remaining acceptance work is explicitly authorization-blocked AI checks/fixes and full integrated verification after any further source changes. Scoped independent approvals and overlapping passing test sets are not a full-repository total or broad accessibility, performance, archive-capacity or release certification. The separately consent-blocked final freshness sweep and corrected supplemental backend probe remain unexecuted and must not be recreated through another tool or delegate without authorization. Both parent-owned QA ports (5193/4174) were verified free after the earlier cleanup; user 5173 was not stopped. No commit, push, deployment or art publication is authorized by this development pass.

## Previous milestone baseline — slice 27

Updated: 2026-09-08. Original project commit: `59c6dbe`; this local development slice started from clean `a57b463` and preserves the preceding integrated game.
Game: 0.1.0 development. Slice 27 adds uncapped economic expansion, eight resource economies, branching company/hearth/faction development, individual soldier battles, thirteen animated battle roles and a faction-filtered world overview. Twenty-four cultures remain playable. Schema/rules: 16 (new battles: 10), independent faction-roster version: 4, physical generator: 7. Campaign envelope: 1; archive/technical log: 2. Local IndexedDB schema: 2.
Validated content hash: `b79c78ed`; frozen schema-15: `eec4003a`, schema-14: `b6e3bce2`, schema-13: `07a58d4f`, schema-12: `3c54fb02`, schema-10: `4c2fed32`, schema-9: `9418e598`. Historical save/replay definitions remain versioned. This slice is local development; no commit, push or deployment was requested or performed. Online protocol remains unimplemented.

## Growth, resources, development and individual battles — slice 27

Implemented and locally verified. Settlement count, population and connected claims now grow through increasing costs and upkeep; old rules retain their exact ceilings. Land queries are paged, and owned-claim sight has a canonical command-bound migration. The AI uses observed spacing and sustainable operating costs. Eight generated resources have their own deposits and paid extraction buildings, worked-tile production, private stocks, material costs and market contracts. New worlds use resource layer 1; imported older worlds remain empty.

Twenty-five development nodes cover company training, hearth specialization and faction traditions. Six advanced officer skills extend character progression to seventeen. Individual battle rules track real soldier identities, cohesion, movement and exact casualties, with one actor per naval hull and no embarked passenger actors. Thirteen editable Blender animation sets add 832 frames; sixteen independent generated resource/works sprites complete the map economy. Published artwork totals 545 assets / 1,427 frames, with unchanged foundation pixels and 17 MiB map / 53 MiB map-plus-battle atlas residency.

The world overview offers Terrain/Realms modes and known-faction filters without changing commands, state, exploration or worker traffic; its selections survive a battle. Battle inspection adds Fit, 2×–4× detail, selected-company focus and bounded pan, including correct pointer selection on narrow screens.

Whole typecheck, lint, content validation and build pass. Final headless is **1,603/1,604 across 184 files** with zero skips: all new systems, saves and historical replay pass; the previously documented Standard/four-seat contact failure remains. The new Standard/24-seat and Huge/32-seat contact regressions are fixed through paid expedition/research budgeting, with all seats meeting their unchanged 60-turn gates. The rebuilt production bundle passes **4/4**. All **149** gameplay scenarios have passing evidence across the **141/149** full checkpoint, **22/23** follow-up and **9/9** final correction; this is not one 149/149 invocation. Individual-battle/render and camera follow-ups also pass **7/7** and **5/5**.

Player summaries omit unused AI development trees, reducing the generated Huge startup packet from 24,503 to 18,275 bytes under its unchanged budget. The land inspector uses 24-cell pages, preserves arbitrary tile access and reuses loaded quotes; every page of a 109-candidate hearth stays below 200 kB. Canonical ownership and the query API's 64-cell maximum are unchanged. The matched Huge map has warmed frame p95 16.7–16.8 ms, 17 MiB atlas residency and up to 72 MiB estimated cached backing in its measured camera workload.

The actual 2,240-soldier SwiftShader workload measures **50 ms median / 66.7 ms p95**, not 60 FPS; full-field mobile ranks remain dense and magnified labels soften. Current verification and retained visual evidence are recorded in [slice 27 evidence](performance/0039-growth-resources-and-battles.md); implementation and compatibility contracts are in [the architecture record](architecture/0036-growth-resources-development-and-individual-battles.md). Do not treat the following slice-26 evidence as validation of the newer rules.

## Random campaigns, readable armies and developed hearths — slice 26

An empty optional seed samples browser entropy when Begin is pressed. Each new campaign clears the field and avoids repeating the current campaign's seed. Explicit seeds, including zero and the full uint32 range, remain reproducible. Loaded worlds keep their stored seed; deterministic generation and simulation never sample browser randomness.

Army art preserves its native aspect ratio and a bounded screen size across zoom levels. Quiet ground backing improves separation from terrain. Far armies and towns use readable 44-pixel heraldry; co-located garrisons have a separate offset. Their actual visible bounds select the exact entity, including foreign inspection while another army is selected, without creating accidental movement orders. Deliberate movement and waypoint input retain the existing command path. The world overview remains a bounded raster.

Population spreads culture-specific housing through observed claimed tiles. Completed cellars, workshops, markets, archives and harbors add actual civic artwork; harbors reserve shoreline plots first. Active paid building/tile orders show scaffolding and cultivation, worked plots change the ground, and completed improvements replace those work cues. Sparse district lanes and quieter clearings tie the neighborhoods together. These are derived visual districts inside the existing 37-claim limit, not new canonical buildings, roads, movement bonuses or a new hearth level. Existing improvements and active work reserve their cells. Only currently visible cells and town centers contribute; private foreign queues stay hidden, including in the explicit spectator projection.

Ten original, individually reviewed assets now cover all five advanced improvements and all five civic buildings. Exact reviewed native pixels, editable Aseprite sources, raw generation sources, briefs and provenance are retained. Cached all-frame opaque geometry fits all fifteen civic/improvement assets inside their hexes. The first flat civic/grey-ground/dense-street version was rejected and replaced after actual screenshot review. Publication is **516 approved assets / 579 frames**. The foundation PNG is byte-identical; one additional 512² map-works page adds **36,079 PNG bytes / 1 MiB RGBA**. Map atlas residency is **17 MiB**, or **21 MiB** with the lazy battlefield page, separately from cached terrain backing. [Native and source review](art/reviews/HEARTH_IMPROVEMENTS.md), [runtime review](art/reviews/slice26/README.md), [renderer architecture](architecture/0034-hearth-development-and-map-scale.md).

Four paid research-gated troops join the existing nine: Reed skirmishers, Witness arbalesters, Kiln halberdiers and Road lancers. Their prerequisites, costs, ranges and combat roles are real content, with ordinary recruitment, AI choices, army merging, saves and replay support. This totals **ten land and three naval definitions**. They deliberately share appropriate approved scout/spear/cavalry art across all twenty-four cultures; these are additional mechanical roles, not four new independent sprite families. Rules 15 retains a frozen original nine-unit schema-14 content projection and a genuinely captured pre-change replay fixture. [Roster and historical compatibility](architecture/0035-specialist-roster-and-replay.md).

Whole typecheck, lint, content validation and the final build pass. Final full headless is **1,495/1,497 across 163 files** with four workers in **79.83 s**: Standard/four-seat contact and the existing Epic 60-second replay budget remain open. The one-file Short/Epic continuation/replay follow-up passes **2/2 in58.72 s**, while the parallel duration gate remains open. All **140** current Chromium gameplay scenarios have passing evidence across the **130/139** broad checkpoint, **35/35** frozen-source follow-up and **3/3** final evidence run; this is not one 140/140 invocation. The rebuilt production bundle passes **4/4 in 15.8 s**, including paid work, exact saved battle outcomes, real worker/assets and spectator fog.

The expanded roster exposed a real ocean-scout funding conflict and a passenger transport routing regression. Preserving one legal scout quote through optional officers and the caravan reserve, using spare research knowledge at ready ocean harbors, and retaining established transport tie behavior restores **all24 Standard and all32 Huge contacts** inside their unchanged 60-turn gates. Actual saved command mirrors pass. The earlier intermediate Huge30/32 result is retained as rejected integration evidence. Standard/four-seat contact remains unfinished; this is not completed long-range strategic AI.

The matched-camera Huge renderer keeps 1,769,695 packed cell bytes, at most 18 cached chunks /72 MiB backing, and warmed rolling p95 **16.7–16.8 ms**. The separate fully visible 1,500-army/18,000-formation fixture still has **33.4 ms** samples and24 chunks /96 MiB; these are not universal60fps or thousand-turn mature-city measurements. [Complete verification, retained failures and performance limits](performance/0038-hearth-map-and-roster.md). Repo mapgen, terrain, rendering, UI, lore and art-integration skills now distinguish setup entropy from deterministic simulation, screen-sized markers from contained tile art, observed cosmetic districts from private state, exact opaque fitting from canvas padding, and shared silhouettes from new artwork. No release target or test timeout is relaxed.

## Automatic GitHub Pages development publication

The repository's Pages source is configured for GitHub Actions with HTTPS at [erikburdett.github.io/Theandril](https://erikburdett.github.io/Theandril/). Every push to `master` builds and verifies a production artifact before deployment; manual workflow reruns remain available. This publishes the existing single-player/AI-watch game, not multiplayer or a 1.0 release. [Deployment and recovery](DEPLOYMENT.md), [architecture boundary](architecture/0033-static-pages-deployment.md).

The web shell supplies a deployment base to Vite and public-file requests; Turbo forwards that variable and includes it in its cache key. The renderer receives an optional URL resolver, without a web/Vite dependency. Approved catalog declarations, atlas hashes, lazy battlefield verification, simulation-worker authority and all canonical rules/saves remain unchanged. Ordinary root hosting still defaults to `/`.

Whole typecheck, lint and content validation pass, including the unchanged `b6e3bce2` hash. Deployment-focused unit tests pass **15/15 across three files**. Actual production browser scenarios pass **4/4 at `/Theandril/` (11.0 s)** and **4/4 at `/` (10.5 s)**: real worker campaign creation, exact approved pack/material bytes, spectator fog, paid map work with save/cancel/restore, and identical tactical battle outcomes after restoring a saved round. No development hooks, asset mocks, canonical changes or relaxed gameplay assertions are used.

The Pages build completes in **3.219 s** (Vite 2.80 s); main JS is **913.43 kB / 281.26 kB gzip**, CSS **95.40 kB / 18.89 kB gzip**, worker **606.86 kB**. The independent root build takes **4.928 s** and has the identical worker chunk. These are single local build samples and bundler sizes, not network or frame-time percentiles. Published output is approximately **6.2 MiB** on disk and excludes development previews, Art Lab, editable art sources and review galleries. The existing chunk-size and upstream Zod annotation warnings remain visible. No render hot path changed; the latest isolated Huge frame/cache measurements remain the slice-25 evidence below.

The full `verify.yml` workflow is unchanged and separate from development publication. The latest complete headless baseline remains **1,434/1,437** with the three documented Standard contact, Huge contact and Epic parallel-duration failures below; publication does not waive them. Production smoke failures block a new Pages upload without removing the prior successful site.

Commit preparation retains all integrated game code, lore, fixtures, approved art and reproducible source/provenance. Fifty-three previously tracked disposable browser-result files are removed from the index and ignored going forward; their local copies and Git history remain recoverable. No reviewed artwork is deleted. Core, release-QA and art-integration skills guided the deployment boundary, real built-game checks and unchanged approval hashes. The local development server is not stopped or replaced.

## Layered campaign HUD and tile-filling towns — slice 25

The map now spans the application width between a top identity/treasury/navigation bar and a bottom selected-entity/next-action/turn tray. Floating labelled buttons open actual paginated army/settlement registries, characters, research, diplomacy and campaign journal windows. Native modal headers remain accessible while their bodies scroll. Full orders reuse the real former inspector controls; selecting a roster entry returns to its map location. Settings is a bounded top overlay with outside-click/Escape dismissal. Battles, captures, save recovery and AI watch retain their existing authority and input guards.

Army map popups use a 320-pixel compact shell with movement/founding and on-demand route/battle/transport controls. Composition and officers retain separate tabs. The existing 420-pixel town popup is preserved. All popup bounds reserve the measured top HUD and complete bottom tray, including enlarged-text and feedback rows. Paid actions still use ordinary worker commands with one active land-query consumer; inspection does not alter campaign state.

Town art now fits its actual opaque silhouette rather than its padded transparent canvas. Cached exact-identity geometry covers all 75 approved settlement variants, including whole opaque pixel corners and the union of every animation frame. Village/town/city use 82%/92%/100% of the inset hex: Ashen visible widths increase from 21.667/23.438/28.422 to 36.979/40.529/42.427 world units. Selection contours share the transform. Improvements, ruins, armies, fleets and far banners retain their previous sizing. No atlas, approved sprite, content ID, save field or canonical rule changes.

The local **Theandril: Hearth & Card** checkout was inspected read-only. Its reviewed walnut/parchment/brass material language, original static corner decoration and typography now tie together the campaign controls and windows. Three byte-identical WebPs add 68,784 DOM download bytes, with source approvals/hashes and separate artwork license retained; they do not enlarge either Pixi atlas. Main review corrected a narrow full-orders float that squeezed text into a thin column. [Architecture](architecture/0032-layered-campaign-hud.md), [visual review](art/reviews/slice25-hud-and-towns.md), [material provenance](art/reviews/slice25-hearth-materials.json).

Whole typecheck, lint, content validation and production build pass. Final headless is **1,434/1,437 across 154 files**, zero skips, **68.28 s**: the same Standard/four-seat contact, Huge/32-seat contact (31/32) and Epic parallel 60-second budget remain open. Browser verification is **114/125**, then **51/52** corrected/expanded cases, then **3/3** final renderer/registry checks; every current 129 scenario has passing evidence across these runs, not one 129/129 invocation. Real focus defects were fixed without weakening assertions: removed popup openers fall back to the map, explicit Show on map/registry selection defer focus until modal teardown, and character Locate closes both nested windows. Actual production is **3/3**, including paid map work, cancellation/save restoration, exact battle outcomes and absence of development hooks.

The final isolated Huge renderer sample keeps exact `b14aa18a` and identical worker bytes, with rolling frame p95 **16.7–16.8 ms**. The full-width canvas changes from 890×786 to 1440×696; maximum cached backing changes from 26 chunks/104 MiB to 18 chunks/72 MiB. This is changed viewport geometry, not a matched-camera optimization claim. The foundation atlas remains 16 MiB. All 75 settlement geometries, four 24-culture gallery partitions, equal-2.2× town stages and 390-pixel controls have actual test/review evidence. [Complete verification and limits](performance/0037-layered-hud.md).

Repository UI-scale, rendering-performance, pixel-art integration and art-QA skills guided file-owned parallel implementation, single-query ownership, visible-pixel sizing, material provenance and retained screenshot review. No new skill or raster generation was needed. No contact target, assertion scope or timeout was weakened. Five advanced improvement sprites, darker-terrain contrast, broad animation, large-map contact, long-campaign timing/balance and the earlier 1.0 requirements remain unfinished. This slice is not a 1.0 signoff.

## Map-first management and contained tile artwork — slice 24

Clicking an army, town or tile now opens a bounded, non-modal map inspector. Its location chooser distinguishes co-located armies, the managing settlement and the tile itself. Actual construction/recruitment, compact tile work, composition, transport, siege/attack, officers and encountered-faction diplomacy reuse the same controls and ordinary commands as the side inspector. Only one active pane/query consumer mounts. Players can hide management panels for a wider map, turn off automatic map menus, or return the same selection to the traditional inspector.

Move on map dismisses the popup while preserving the selected army for destination clicks; long journeys open real route confirmation. Escape closes the popup before clearing selection, native dialogs retain input ownership, keyboard tabs reset on entity changes, and Enter opens the selected location. Read-only foreign inspection survives diplomatic updates without switching to an unrelated army. Waypoint inspection keeps the travelling army; moved/removed entities, battles, captures and campaign replacement dismiss stale contexts. Final route-confirmation focus waits for the new surface rather than scrolling an obsolete sidebar. Narrow 130% text controls clear the actual footer, including its feedback row, and map text buttons no longer inherit the old zoom-button width.

Settlements, ruins and all ten improvement presentations fit within their existing hexes with uniform scale and no texture crop or body tint. Village/town/city caps are 26/30/34 world units; improvements 30 and ruins 28, inside an inset radius-29 hex. Armies and fleets retain their prior scale. Selection contours follow the fitted artwork. Tests cover all 75 published settlement variants and approved alpha bounds; actual camera screenshots compare the three stages at the same 2.2× zoom. Far glyphs and raster overview now report separate diagnostic modes. The 506-asset/569-frame publication and both atlas PNGs are unchanged; five advanced works still use explicit procedural glyphs.

Whole typecheck, lint, content validation and production build pass. The final headless run is **1,418/1,421 across 152 files**, zero skips, 69.12 s. The same Standard/four-seat contact, Huge/32-seat contact (31/32) and Epic parallel 60-second budget remain open. The full browser checkpoint is **117/122**, followed by **19/19** corrected/expanded UI, movement, tile and naval cases; every scenario has passing evidence across those runs, not a single 122/122 invocation. The built bundle passes **3/3**, including paid map construction, a real save → cancellation → restoration, exact battlefield outcomes and absence of development hooks. No canonical rule, save field, content hash, test timeout or contact target changed.

The isolated matched Huge renderer check passes with the same `b14aa18a` state hash and worker bytes before/after. Rolling frame p95 remains **16.7–16.8 ms**; maximum cache backing stays **26 chunks / 104 MiB**, separate from the **16 MiB** foundation atlas. It uses 1,500 global armies with ordinary visible-entity fog, not a dense mature-turn or physical-GPU signoff. [Verification, measurements and limits](performance/0036-map-management.md), [architecture](architecture/0031-map-first-management.md), [tile review](art/reviews/slice24-tile-footprints.md), [map UI review](art/reviews/slice24-map-management.md).

Repository UI-scale, rendering, territory/army, diplomacy and art-QA skills guided shared controls, single current-hash query ownership, file-owned parallel work and actual screenshot review. No new skill or raster generation was necessary. Remaining visual polish includes disabled-card clutter, tiny far heraldry, narrow map-control occlusion and finished artwork for five advanced sites. The earlier contact, long-campaign, battlefield performance and broader 1.0 requirements remain unfinished; this slice is not a 1.0 signoff.

## Battlefield, bounded spells and Blender animation — slice 23

Field battles, fortified assaults and naval combat now show actual deployed formations and attached officers in the shared renderer. Watch, pause, ½×–4× speed, single-round orders, skip, autoresolve and latest witnessed replay are implemented. Figures can be inspected by pointer or accessible controls; full formation tables remain in a disclosure. Naval passengers do not become independent hull combatants. Loading restores the current battle pose without inventing unrecorded attacks. Animation and replay cannot spend resources, roll randomness or apply damage.

Automatic abilities are the default, with saved per-source policies and manual legal targets. Oath guard's Set shields and marshal Rally remain mundane actions; existing passive skills keep their original effects. A paid Waykeeper has explicit personal Flame/Rune aptitudes and uses an agent slot. Separate national Arcane Theory requires a functioning Witness archive and knowledge. Cinder thread and Bound ward enforce range, charges, shared strain and one caster action per upcoming round. This is a small usable magic foundation, not the complete path/ritual/faction-spell scope. AI pays the same costs and prefers locally available fighting stacks and research matching an actual caster's aptitude.

Six Blender-authored clips are individually inspected, processed and approved: melee/projectile/ember/ward/rally and one southeast Waykeeper cast, each eight 100 ms frames. Editable scenes, dependencies, raw renders, fixed pivots, exact palette normalization, actual Pixel Snapper/Aseprite outputs and native 1×/4× reviews are retained. Rejected sources remain recoverable. Existing faction artwork is unchanged; preparation/lunge/recoil reuses approved sprites, not newly authored attack poses for every culture.

Publication contains 506 approved assets / 569 frames. The 2048² foundation PNG remains byte-identical to slice 22 (`e32c73be1b8789f8c554eea7c6b7204d40fae20e3347be36ccbd76de8a9740de`); a separately validated 1024² battle page loads lazily in the same context. Normal atlas residency stays 16 MiB; first battle adds 4 MiB, excluding chunks, DOM decodes and other GPU allocations. Both pages rebuild identically in reverse input order; total PNG bytes are 2,654,401.

Whole typecheck, lint, content validation and production build pass. The final headless checkpoint is **1,393/1,396 across 148 files**, zero skips, 71.85 s. Historical saves, new ability rules, exact-art reconstruction and persistence checks pass. Three release gates remain in the default parallel run: Standard/four-seat contact, Huge/32-seat contact (31/32), and Epic's unchanged 60-second full-archive test budget. The final Short/Epic file passes **2/2 in isolation**, 57.78 s combined test time / 58.59 s invocation, after replacing expensive matcher wrappers with Node's stricter deep comparisons of the same complete results and chronicles. This is test-harness improvement, not a simulation speedup or parallel-suite signoff. No assertion coverage, turn targets or timeouts were reduced. [Final headless evidence](performance/0035-headless-final-ux.txt), [isolated exact archive tests](performance/0035-epic-strict-comparison.txt).

Genuine pre-change schema-13 captures cover 11 field/siege/generated-24-culture history states. Exact bytes, original checksums and full replay survive migration; old pending battles retain their original combat results. A normal Tiny/Standard seed-99 generator-5 campaign finishes at turn 205 with 5,361 accepted commands, zero refusals and exact complete replay `d4f393d3`. An initially early turn-188 finish led to fixing caster placement/research eligibility, not changing prices or weakening the 200-turn gate. [Campaign evidence](performance/0035-standard-pacing-after.json).

A separate complete Tiny/four-realm Epic campaign reaches actual victory at **turn 1,020**, with 23,123 accepted ordinary commands, zero refusals and 593 archived battle reports. Save/load, compressed export/import and full replay agree at `b128dc55`; campaign execution takes 27.825 s and final replay 10.178 s. This demonstrates long-duration correctness, not a mature 24-culture large-world soak or the integration test's additional turn-500 mirror. [Full Epic campaign](performance/0035-epic-campaign.json).

The full Chromium suite passes **116/116** in 8.4 minutes. The final offscreen-target reveal and portrait-title changes then pass **17/17** focused scenarios, and the actual production bundle passes **2/2**, including manual abilities, exact approved battle PNG, complete saved outcome equality and absence of development hooks. Main review corrected ship/cavalry overlap with strength labels and a narrow sticky-footer obstruction. Native sprite, annotation and movement bounds have non-overlap coverage down to 320 px. [Full browser evidence](performance/0035-browser-full.txt), [final UX follow-up](performance/0035-browser-final-ux.txt), [production evidence](performance/0035-production-final.txt), [visual review](art/reviews/slice23-battlefield.md).

Final isolated 20-versus-20 rendering passes its functional/boundedness checks, but frame p95 is **33.4 ms**, not a 60 fps signoff. The actual context reports Chromium WebGL2 via ANGLE/Vulkan **SwiftShader**, not a physical GPU. It retains one renderer/context, 46 actors, at most five active effects/six pooled sprites and 20 MiB atlas residency; animation/pause/skip leave canonical state unchanged. The larger non-overlapping field costs more than the earlier crowded layout's 16.7 ms sample. Huge-world settled samples remain 16.7–16.8 ms, with a 33.3 ms initial sample. Battlefield optimization and physical-GPU measurement remain open. [Measurements and limits](performance/0035-battlefield.md).

The repository's `/unlazy`, combat/magic, sprite-animation and Blender factory/QA workflows guided file-owned implementation, pre-change archive captures, retained editable exports, actual visual review and measured verification. [Architecture](architecture/0030-battlefield-presentation.md), [source factory](../tools/art/blender-battle/README.md), [play controls](../README.md). This slice does not complete Theandril 1.0.

## Twenty-four cultures and complete original art kits — slice 22

Twelve distinct definitions join the existing twelve: Cistern Assembly, Unsealed Companies, Lantern Hospices, Cairnwing Concord, Red Sluice Directorate, Velvet Meridian, Brine Choir, Emberwake Convocation, Underhush Exchange, Vesper Court, Manytrack Moot and Margin Observance. Each has its own worked-biome bonuses and penalties, paid cultivation targets, eight given/eight family names and weighted recruitment preferences over the existing shared troop rules. Vesper is a blood-dependent vampiric court with living households and retainers, not a renamed Synod; its forest/taiga economy and paid heavy/cavalry preference are implemented. Feeding, life-steal, sunlight and unique supernatural troops are not implemented merely by its lore or artwork.

Independent roster 4 includes all 24 cultures before repeated campaign seats. The first twelve definitions and rosters 1–3 remain byte-exact; schema 13 preserves genuine prior saves, generated origins and complete archives. Six genuine schema-12/generator-7 origin/developed archives were captured before expansion, in addition to the earlier generator-6 and active faction-history captures. Historical schema-10–12 inputs reject forged roster-4/new-culture payloads instead of discarding information.

Whole typecheck, lint, content validation and production build pass. The final default headless run passes 1,318/1,321 with zero skipped tests; full exact-pixel/provenance/uniqueness coverage now passes after replacing expensive recursive Buffer assertions with exact native byte comparisons. Synthetic naval fixtures cover all 72 sources without touching the canvas edge. Remaining failures are Standard/four-seat contact, Huge/32-seat contact (31/32), and Epic's 62.280-second parallel execution against its unchanged 60-second limit. No AI gate was relaxed. [Original run](performance/0034-final-headless.txt), [corrected full run](performance/0034-headless-corrected.txt).

The published pack contains 500 individually approved assets / 521 frames, including 432 culture-qualified roles and 72 naval hulls. Each additional culture has 18 distinct original sprites, not a recolor or duplicate kit. There were 224 actual built-in generation calls for 216 selected originals; eight rejected sources remain retained and excluded. Root inspected every selected original, native 1x and enlarged processed family before exact-input approval. The independent [provenance audit](art/reviews/slice22-faction-provenance.json) verifies all 216 unique original hashes, exact bindings, approval receipts and public/runtime publication copies. The atlas remains one 2048²/16 MiB page, PNG 2,628,301 bytes, SHA256 `e32c73be1b8789f8c554eea7c6b7204d40fae20e3347be36ccbd76de8a9740de`; reverse-order rebuild is byte-identical. Other 431 faction assets remain static beside the four-frame Ashen scout. [Main in-game review and visual limits](art/reviews/slice22-faction-gameplay.md).

A generated Standard/24/Continents seed-74 campaign runs 100 complete rounds with 17,282 accepted ordinary AI orders, zero refusals and exact origin replay, save/load and continuation after 30 rounds to seal `a7fb3c16`. All 24 cultures meet another faction by sampled turn 76; only 22/24 do so by 60 rounds. It ends with 168 towns, 366 armies/635 formations, 133 unique battles and 15 captures. It records 32 landings, 23 on a landmass different from the landing faction's homeland, and 21 paid transported colonies, 18 with recorded deep-water passage. Those 23 landings do not mean 23 distinct islands. The report explicitly corrects participant notifications into unique battle/capture counts. This is a bounded correctness/voyage checkpoint, not long-campaign balance or all-difficulty victory evidence. [Raw campaign evidence](performance/0034-cohort24-campaign.json).

The full Chromium run passes 109/111; all culture, naval, UI, save, skill-tree, selected-scout, terrain and actual victory-chronicle cases pass. The later 10/10 corrected follow-up preserves an actual transient foreign-entity contact witness independently of post-pause visibility, and replaces obsolete full-hex selection assertions with asset-local/fog/focus checks. Runtime code and time limits are unchanged between these browser runs. Thus all 111 scenarios have passing evidence, not a single 111/111 invocation. Production watch-only fog controls/no-development-hook smoke passes 1/1. [Original browser checkpoint](performance/0034-browser-checkpoint.txt), [corrected browser evidence](performance/0034-browser-corrected.txt).

The isolated Huge renderer check passes 1/1: rolling frame p95 16.7–16.8 ms, at most 26 cached chunks/104 MiB estimated backing, one 16 MiB map atlas and packed/total worker bytes 1,769,695/1,973,677. Current seal `6effe876` differs from the historical schema/roster fixture; the authored geometry and count workload are comparable, not byte-identical saves. Warm seven-sample offline validation/packing+encode/decode medians grow to 148.745/304.906/74.174 ms for the larger pack. Source reads are excluded; compiler process max RSS 609.570 MiB is not GPU residency. [Raw renderer](performance/0034-art-render.json), [offline compiler](performance/0034-art-factions.json).

The `/unlazy`, lore and art-factory skills guided file-owned implementation, pre-change compatibility captures and original/native/gameplay review. Twenty-four distinct cultures are now a playable baseline, not 1.0 completion: deeper asymmetric unit/research mechanics, faction balance over long campaigns, broad animation and the recorded release gates remain unfinished.

Final evidence retention reruns the contact and 24-culture land gallery files successfully (4/4, 1.1 minutes), writing actual JSON files as well as screenshots. [Land/town/strategic identities](performance/0034-faction-art-inspection.json), [turn-47 Cairnwing army witness](performance/0034-contact-witness.json), and [separate post-pause observation](performance/0034-contact-post-pause.json) remain durable outside test caches. The unchanged Short/Epic archive file also passes both cases in isolation (58.66 seconds total), including turn-500 mirrored continuation and full replay/log equality. This does not close its full-parallel timing failure. [Exact isolated run](performance/0034-epic-isolated.txt).

## Asset-local selection and first faction animation — slice 21 final graphics checkpoint

Selected armies and towns use a faction-colored alpha contour and at most three slow4.8-second glints, without recoloring the art or outlining the entire selected hex. Empty-cell targeting, range, routes and hover remain distinct map controls. Reduced motion/far zoom hold the contour steady; unknown and carried entities never receive an effect. Terrain is static.

The approved Ashen scout has four genuine250ms idle poses. A bounded frame-aware silhouette cache follows the actual atlas frame; the live four-frame test retains five masks/92,480 CPU pixel-buffer bytes, no chunk rebuilds during150 samples and an unchanged campaign seal. Other215 culture assets remain static. Units, towns/ruins and animated improvement props have near-idle playback support, but unused clip consumers are not claimed as visually validated production animation.

Final targeted Chromium verification passes16/16, including all36 biome bindings, selection/fog/save behavior, all four live scout frames, native Art Lab playback and reduced-motion/far freezing. The separate matched Huge art-render measurement passes1/1: frame p95 remains16.7–16.8ms, at most26 cached chunks/104MiB estimated backing and one16MiB atlas; packed/total worker bytes remain1,769,695/1,973,677. First-art CPU is50.8ms versus39.6ms in the earlier single capture, not a startup speedup. Final publication is284 assets/305 frames,1,520,156 PNG bytes. Typecheck/lint/content/build and all284 approved inputs pass.

The broad headless checkpoint is1,204/1,209 before correcting one obsolete static-scout coverage assertion; its corrected focused coverage passes6/6. Three unchanged contact gates and Epic's parallel timing remain open. No complete final headless/browser rerun is implied by focused passes. The later9/9 genuine generator7 compatibility capture tests also pass. Raw checkpoints remain in [0033 headless](performance/0033-final-headless.txt) and [art processing](performance/0033-art-animation.json).

## Biome variation and larger inland seas — slice 21

All twelve existing biomes now have the original tile plus two independently generated originals: 24 new approved assets, 36 stable terrain bindings. Selection depends only on world seed, cell and biome, not camera, turn, catalog order or a mutable random stream. Missing variants use only their original biome tile; terrain stays static. Every selected source and processed native/enlarged mixed-repeat was inspected before exact-input approval. Two rejected originals remain retained: a projecting alpine peak and a marsh source with a tiny enclosed alpha-threshold pocket on its outer fringe. Publication is 284 assets / 302 frames, one 2048² page, 1,511,898 PNG bytes and 16 MiB decoded atlas. Native 64² tiles retain the unchanged 56×64 ground footprint. Original bright desert/snow tiles still contrast visibly with quieter new variants; these are not seamless transition assets or complete palette unification.

Physical generator 7 creates larger enclosed saltwater basins according to the size of their host mainland, with separate layout budgets, intact land margins, a land floor and verified usable shores. Tiny maps deliberately retain generator-6 physical results; explicit generators 1–6 are frozen. At seed 20260905, Continents' largest inland sea grows from 97→1,074 cells on Small, 844→5,155 on Huge and 1,276→7,973 on Legendary. Existing freshwater lakes and valid downstream river outlets remain separate from these salt seas. The three main-reviewed before/after overview sheets retain exterior coastlines; basin shapes are still visibly smooth/rounded, not erosion simulation. Sixty isolated generation samples reproduce exactly; Huge layout means are 338.5–356.6 ms and Legendary 525.8–560.4 ms. Five observations per layout/size do not establish a robust tail percentile.

Six genuine generator-6 origin/developed saves and complete histories were captured before the switch; strict save/start reconstruction/full replay/continued-history tests preserve them exactly. Separate genuine schema-12 faction-history captures retain a selected non-default culture, paid land work, attached surveyor, active mission and developed campaign for future roster migration. No new culture/content/schema is claimed by those fixtures. Twelve cultures are playable; twelve more remain proposed in the faction bible.

AI basin knowledge now uses one shared call-local adaptive search budget, at most 8,192 observed nodes, and explicit open/enclosed/unknown and connected/separate/unknown answers. Unknown water never proves a basin closed or fleets connected. The real 1,074-cell sea is fully provable when charted, while a missing shoreline remains unknown; cached queries add no further expansion. An initial port-policy regression was corrected: unknown existing ports no longer divert founders as though proven enclosed. Three final generator-7 campaigns found real paid overseas colonies at turns 38/41/33 with zero rejected orders and exact saved-mirror/full replays. This is not strategic naval-AI completion: Standard/four-seat contact still misses the unchanged 100-turn gate (all four meet by turn 118 in a bounded diagnostic); dense contact remains open.

Verification checkpoint: 102 mapgen tests pass; broad headless run 1,177/1,182 precedes the narrow port-policy correction. Final focused AI/pacing tests pass 34/34 and isolated Short/Epic archives 2/2, without raising the 60-second limit. The initial broad failures were Standard/four-seat contact, two dense contact checks, the corrected pacing regression, and parallel Epic timing. Do not read the later focused passes as a complete rerun. Thirteen targeted Chromium scenarios pass after terrain publication and asset-local selection implementation, covering all 36 terrain bindings, saved restoration, fog, missing variants, selected contours, reduced motion and existing Art Lab/terrain cases. Full final integration is still pending the animation slice. [Raw headless/AI evidence](performance/0032-headless-checkpoint.txt), [generation samples](../packages/mapgen/diagnostics/v7-inland-seas.json), [art before](performance/0032-art-before.json), [art after](performance/0032-art-after.json), [individual visual decisions](art/reviews/slice21-biome-decisions.json).

## World-fit zoom, army size and climate geography — slice 20

The user-directed follow-up extends wheel/minus zoom continuously to the entire world. A bounded cartographic level of detail replaces local chunks before distant zoom would expose excessive terrain; zooming back and Focus selection restore local inspection. Near armies use one, two or three existing approved figures for one, two–five or six-plus actual formations. Co-located forces of the same realm/domain share a group with a near-only ×N count: selected army first, otherwise the largest with stable-ID ties. Its own roster determines figure count; the separate armies are not merged. Real map clicks still cycle them, fleets stay separate and embarked passengers are not drawn twice. Far zoom retains aggregate badges. Spectator maps add only formation counts, not private rosters. Split/save/cycling, naval cargo and narrow-screen controls have passing Chromium evidence.

Generator 6 adds offshore groups on every layout, asymmetric coasts and peninsulas, inland waters, larger connected river trunks, traversable mountain saddles and relief-aware climate. Prevailing ocean moisture, leeward drying, upland cooling and actual freshwater corridors refine the existing twelve biomes; no additional biome IDs or art pack are invented. Six genuine generator-5 origin/developed saves and complete ordinary-command histories were captured before switching generation. Nine new compatibility cases preserve their original bytes, hashes, regenerated starts, full replays and appended continuation. Generator 5 and the sixteen older physical-world seals remain protected. The save shape remains schema 12; the independently versioned generator changes new campaigns only. All 60 isolated generation samples reproduce exactly. Huge generation means are 338.6–352.4 ms and Legendary 532.2–544.0 ms across layouts; the additional geography costs more than generator 5. [Geography, compatibility and measurement scope](performance/0028-world-scale-readability.md).

The final Huge/32/archipelago renderer workflow retains 16.7–16.8 ms rolling frame p95, one 3,148,800-byte whole-world texture and at most 22 cached chunks/88 MiB estimated backing, separate from the 16 MiB atlas. The matched crowded-army correction preserves all 1,500 armies/18,000 formations but replaces 4,500 redundant near figures with 273 representatives plus 91 count badges. Restored-focus rolling p95 falls from 83.4 to 16.8 ms; initial near p95 is still 33.3 ms including startup frames. Whole worker traffic remains 10,299,100 bytes: this is a rendering improvement, not a roster-transfer reduction or whole-GPU-memory proof. [Exact before/after evidence and screenshots](performance/0028-world-scale-readability.md).

An earlier Epic regression genuinely exceeded 1,400 turns with its paid project incomplete. Goal-aware worker allocation now favors coin only in developed idle towns still saving for the actual price, retaining normal food/production and paid-improvement scoring. Final generator-6 Epic benchmarking reaches real victory at turn **1061**, with 24,782 accepted orders, 871 archived battles and exact save/compressed-import/full-replay seal `61b6aee7`. The separate unchanged archive integration test passes in isolation, including turn-500 continuation and two complete replays, but exceeds its 60-second limit in the broad parallel run. Four 100-turn Huge/Legendary young/mature workloads also retain zero rejections and exact 50-turn midpoint continuations; complete-round means are 120.4–217.1 ms, excluding saves/archives/browser work. [Campaign scale](performance/0029-campaign-scale.json), [actual long-form victory](performance/0031-epic-geography.json).

AI now distinguishes proven enclosed water from unknown seas using bounded, observation-only searches. Port production quotes expose the currently legal visible launch hex, without reserving it or altering saved state; production rechecks the berth. Enclosed-sea ferries can land settlers on another suitable shore, while completed inland fleets no longer satisfy an unrelated ocean port's needs. Maritime research reserves knowledge for its actual prerequisite-ready goal rather than repeatedly spending it on cheaper land techniques. Three untouched generated starts achieve paid colonies on separate landmasses at turns 38/41/33; two require deep-ocean passage. All 1,893 orders replay exactly with saved voyage mirrors. These corrections do not constitute completed strategic naval AI: Standard/24 and Huge/32 still reach only 22/24 and 30/32 factions with entity contact by turn 60. Standard/4 passes its original all-seat 100-turn gate. [Actual voyages](performance/0029-overseas-ai.json).

Final verification: **1,106/1,109 tests across 123 files**; the two dense contact checks and Epic's 64.961-second parallel execution remain open, with no disabled tests or raised time limits. The isolated Short/Epic file passes both cases in 57.47 seconds total. All 93 final gameplay scenarios have passing evidence: the final full Chromium run is 92/93 in 5.9 minutes, followed by 4/4 Art Lab scenarios after correcting its obsolete simultaneous-co-located-sprite expectation; no runtime code changed between those runs. Full typecheck, lint, content validation, 260 asset validations and production build pass. The actual production preview also passes its watch-only fog-console/no-development-hook scenario (1/1); ports 4173/4174 were used without stopping the user's 5173 server. [Detailed checkpoints and limits](performance/0028-world-scale-readability.md).

## Geography, gradual roads and spectator exploration — slice 19

New campaigns select Continents, Islands or Archipelago. Generator 5 creates unequal branching mainlands, bays, peninsulas, offshore islets, curved island chains, connected mountain relief, enclosed inland seas and freshwater upland lakes with actual river outlets. A single packed hydrology byte per cell records lake identity, directed drainage and river size; validation rejects broken outlets, cycles and invalid topology. Starts are distributed among viable land regions with fresh water nearby and reachable salt-water coast. Natural freshwater contributes the existing spring feature. Rivers currently do not impose movement penalties or require bridges. Old worlds are not regenerated.

Road projects link an owned town to an older nearby owned town over charted passable land. Surveying rotates one town per faction per turn; each search is bounded to 4,096 known nodes, eight endpoint candidates and 128 edges. Ordinary turns build one work point; plains/forest/hills segments require two/three/four. **Hasten road** spends the exact quoted crowns (treasury coin) for the next segment, with connection length increasing its price. Sight at the work front, foreign claims/armies, siege and occupation constrain construction. Completed symmetric edges reduce land entry to one movement point and remain after conquest or razing; invalidated endpoint projects are cancelled. Direct movement, previews, queues and AI use shared costs. Sparse last-seen road memory prevents hidden construction from leaking through an observation.

AI-watch has explicit **Reveal spectator map** / **Restore fog of war** controls and the production console command `await window.theandril.toggleFogOfWar()`; `setWatchFog(false)` reveals and `true` restores. Fog changes pause watch and replace map knowledge even when the canonical hash is unchanged. AI, queries, registries, archives and saves continue to use ordinary faction observations. A separate minimal map projection reveals public map identities, not private troop rosters or officer missions. Loading/replacing a campaign restores fog. **World overview** uses one bounded raster from permitted cells instead of generating detailed chunks for the whole planet; focus/zoom restores local sprites. Connected rivers and completed roads draw inside cached chunks, with road detail suppressed at distant zoom.

Schema 12 adds strict hydrology/road validation. Fourteen genuine schema-11 generated-start and ordinary-command saves/archives were captured before mutation, including active work, research, missions and completed victory. All original save SHA256 values and replay seals remain exact; old rules cannot issue new road orders or masquerade as a generator-5 origin. Sixteen separate generator-1–4 physical-world seals remain unchanged. Authored terrain fixtures explicitly retain generator 4 so overwriting a marsh or corridor cannot leave invalid modern drainage behind; original historical golden values are preserved, not recomputed.

Historical generator-5 checkpoint: 70 mapgen tests passed, with exact repeated generation and strict topology checks. Review corrected Tiny archipelago plate merging using actual sea straits; seed 74 now has eight physically separate islands and four distinct starting landmasses. All sixteen legacy seals and eleven unaffected measured v5 layouts remain exact. Final isolated warm generation means for Continents/Islands/Archipelago are Tiny 3.905/3.870/3.346 ms, Small 69.691/68.776/62.695 ms, Huge 288.714/298.741/292.291 ms and Legendary 462.679/452.510/455.581 ms (five samples each; stricter lake validation included, diagnostic hashing excluded). Main-agent-inspected overview sheets and [final raw generation evidence](../packages/mapgen/diagnostics/v5-geography-final.json) are retained separately from the provisional measurements.

**All 89 Chromium scenarios passed on frozen source in 5.3 minutes**, including revised rivers/lakes, Tiny island separation, whole-world fog restoration, roads, existing military/naval controls and actual AI victory chronicles. Whole typecheck and lint also passed. Follow-up independent review reproduced and fixed road-assisted attacks disagreeing with their previews and shared-road segments charging twice. Three failing-before regressions now pass; siege assaults also use the shared version-gated cost. Road reuse is free, explicitly blocked from duplicate hiring, and emits actual reuse/completion events. New Huge geography performance and production-build console smoke scenarios are prepared. The slice-20 checkpoint above supersedes this earlier run with final road/render measurements, production smoke, long-form replay and explicitly open dense-contact/parallel-timing gates. [Detailed evidence and open checks](performance/0026-geography-roads-watch.md).

The existing `/unlazy`, mapgen, simulation/AI, armies/fleets, territory, rendering/UI and QA skills guided file-owned parallel implementation, genuine compatibility capture, observation-only maritime decisions and separate performance evidence. No raster asset or new faction is claimed in this slice; twelve playable cultures and their preceding 260-asset pack remain. [Architecture and compatibility boundaries](architecture/0026-geography-roads-spectating.md).

## Realm navigation, map clarity and thirty-six naval hulls — slice 18

The campaign header now contains a single army/settlement navigator, character access, current selection and direct map/orders jumps. The searchable registry renders at most 25 rows per page with stable-ID/name sorting and land/naval/embarked filters. Rows expose actual formation, movement, commander and journey information. Selection follows map/next-order navigation; campaign replacement resets pages, filters and the active tab even when imported IDs are identical. With no army active, clicking an owned claim opens its town inspector using only observed ownership; friendly-army selection and active move/attack/waypoint clicks retain priority. Navigation itself issues no orders. Construction, land recruitment and fleet recruitment are separate native disclosures above detailed land management; realm affairs and chronicle start compact, while incoming diplomatic offers remain prominent. Narrow scrolling accounts for the measured sticky turn-bar height, retaining reachable recruitment controls without hiding the footer.

The renderer removes the ambient hex grid and internal ownership strokes in favor of outer realm perimeters. Movement uses a soft reachable fill and range perimeter; attacks, hover and selection retain stronger cues. Unselected forces use quiet ownership marks. Only settlement names and selected/hovered army names are eligible for collision-filtered map labels, bounded to 32; complete names remain in the registry. Physical terrain, fog, picking, authoritative costs and canonical state are unchanged. Repetitive terrain stamps and fractional pixel fit remain limitations.

All twelve **playable** cultures now have independent Charter transport, Coastwatch galley and Deepwake warship art: 36 approved static southeast hulls at native 96×96, pivot (48,80). Actual built-in generation made 37 calls; one clipped Synod original was rejected and retained before a replacement. Exact prompts, raw sources, source hashes, real Pixel Snapper/Aseprite processing, native/enlarged reviews and individual input-bound approvals are retained. Near-map and troop/recruitment UI consumers resolve the actual faction definition; missing variants remain honest ship fallbacks. This is not 24 playable cultures or completed naval animation.

The published pack is 260 assets / 278 frames / 243 current bindings, retaining 17 future-only assets, on one 2048² page (1,333,608 PNG bytes; SHA-256 `05a92bd0da46c4321138a075105cc941b278364d8ef0e6ca72584ad365b111fa`). All asset validations and reversed-input reconstruction pass. Warm compiler medians change from 67.34→77.84 ms validation, 152.91→178.70 ms packing/encode and 52.48→59.50 ms decode as coverage grows; decoded map atlas remains 16 MiB, not total presentation memory. [Before](performance/0025-art-before.json), [after](performance/0025-art-after.json).

Final slice checkpoint: typecheck, lint, content validation and production build pass, as do **all 82 Chromium gameplay scenarios** on frozen source (5.6 minutes, no skips). The broad automated run passes **965/966 tests across 100 files**; the unchanged Epic 60-second integration budget still fails under parallel load (71.133 seconds). Its isolated file passes both Short and Epic, including turn-500 continuation and both full replays, in 61.13 seconds total / 60.28 seconds combined test time. Current-schema hash folding avoids joining a full outer envelope while retaining strict canonical validation, both checksums, exact saves and legacy paths; large-fixture median hashes improve 3.35–3.50%, not a demonstrated whole-campaign speedup. Final browser coverage includes all naval art, own-claim navigation, same-ID import/tab reset, paginated hundred-army/forty-town selection, land-save queries, narrow unobstructed recruitment, transport, naval combat, research/character trees and complete victory chronicles. [Implementation, screenshots, measurements and open gates](performance/0025-ui-navies.md). No overall visual or 1.0 signoff is claimed. Current menu captures do not show the old ghost, but the map is below those viewports, so the earlier painting artifact is not declared fixed by their absence.

The existing `/unlazy`, UI-scale, renderer/QA and art-factory skills guided concrete implementation, independent file-owned reviews, exact native approvals, frozen-source browser correction and separate performance windows. No new skill was necessary. Remaining priorities include the broad Epic time budget, more varied terrain/animation, five researched-site production sprites, fuller long-range campaign strategy and the additional twelve proposed playable cultures.

## City growth, research trees and the twenty-four-faction bible — slice 17

[The faction bible](lore/FACTION_BIBLE.md) now gives all twelve registered cultures base lore, conflicts, diplomacy, supernatural outlooks, ecological/material identity and two character seeds each, plus twelve explicitly proposed societies toward twenty-four. Planned entries are not registered factions, completed art kits or implemented supernatural powers. The Book's RR 2447 chronology and the distinction between surviving Iron/Mire/Synod institutions and fallen League/Throne successors remain intact. The next recommended playable cohort is Cistern Assembly and Unsealed Companies. The current twelve retain their independently authored static kits; no new faction sprite family is claimed in this slice.

Settlements now accumulate saved civic border progress, with threshold `12 + 4 × claimed tiles`. Population, actual markets/archives and researched Surveyed estates affect the rate. Expansion claims at most one charted, connected, currently visible non-deep-water tile within population-based reach; it never grants workers, improvements or yields. Siege and occupation pause growth, exhausted local reach stops accumulation, capture resets progress, and razing releases claims. Manual purchases remain available and increase the next threshold. The settlement panel exposes the actual progress, next candidate, expected active turns and blockers. Queries remain sparse; the 37-claim and six-worker limits are unchanged.

Research grows from four to ten actual technologies across craft, stewardship, navigation and civic branches. Five new paid constructions—Spring garden, Polder, Grove archive, Oreworks and Tide observatory—require specific research and suitable terrain/features, with signed yield tradeoffs and real work durations. Conquered completed sites remain useful without granting the captor their technology. AI chooses relevant observed research and worthwhile upgrades through ordinary commands and respects its knowledge/coin budgets. The ten-node research interface and existing eleven earned character skills now expose linked prerequisites, branches, costs, exclusive lockouts and keyboard-stable purchase focus. Institutions, military doctrine and personal skills remain separate; this is not an implementation of Arcane Theory, caster Paths or spells.

Before changing content, fourteen genuine schema-10 generated-start/ordinary-command checkpoints and full archives were captured, including paid improvement/cultivation, queued construction, research, earned fieldcraft and active missions. Schema 11 validates the old checksum/content seal before initializing civic progress to zero; old commands retain their original rules and cannot acquire new IDs. Historical exports reject unrepresentable progress/content rather than discard it. All captured schema-4–10 replay seals pass focused verification. Database/envelope/archive formats remain unchanged.

Verification checkpoint before slice 18: typecheck, lint, content validation and production build passed, as did all six new research/character/city Chromium scenarios with inspected desktop/narrow evidence. The contact test's premature stopping condition and stale historical-subset assertions were corrected without increasing limits; all four recorded-seed factions make contact by turn 67. Review also fixed repeated garden/oreworks replacement spending and research demand for a blocked frontier. The final serial broad check passed 941/942 tests; the unchanged Epic integration budget failed at 61.556 seconds. The browser checkpoint was 76/77, with one character-inspector reset while a sibling edited worker source; slice 18 reruns frozen source. Canonical payloads serialize once, AI details exactly its existing rotating eight-town planning window, and bounded call-local navigation reuse preserves proposals and budgets. The final Epic benchmark reaches actual victory on turn 1,244 with 27,843 orders, zero refusals, exact replay and unchanged portable bytes; its benchmark does not include the integration test's turn-500 continuation mirror. [Investigation and evidence](performance/0024-city-research.md), [final Epic](performance/0024-epic-after.json), [matched 100-turn workload](performance/0024-city-research-after.json), [AI detail-window measurements](performance/0024-ai-land-window.json).

All ten improvements have a tested map identifier. The five new sites currently use distinct, bounded procedural glyphs, not approved sprite art; the missing-art warning remains honest. Their production sprite approvals and genuine directional/action animations remain outstanding; slice 18 separately supplies the thirty-six naval hulls. The prior narrow campaign-menu painting issue was not declared fixed by slice 17.

## Top campaign menu and twelve-culture expansion — slices 15–16

The single native Campaign & settings disclosure now sits immediately below campaign navigation, before the game window (below the masthead on setup). Existing save/load/import/export, replacement-world cancellation and shortcut handlers are retained. Controls remain in normal document flow; narrow touch controls have 44-pixel targets. Three new Chromium scenarios pass, exercising keyboard disclosure/tab order, real manual/autosave/export/import restoration, 390-pixel layout at 130% text scale, unchanged setup return and cancellation of a real replacement worker. Whole typecheck and lint pass at the current source checkpoint.

Six new playable definitions bring the roster to twelve: Mire Courts, Saltwind Remnant, Wardhall Remnant, Rimehorn Clans, Sable Steppe and Morrow Spore. They have distinct signed biome affinities, paid cultivation targets, character name pools and weighted AI recruitment preferences over the existing shared units. Setup and owned-town stewardship expose actual mechanical differences. No exclusive troops, caster powers or completed 24-faction roster are claimed. The historical League and Null Throne are not silently restored; new successors are distinguished in the [cohort lore](lore/FACTION_COHORT_12.md).

Independent roster identity prevents appending definitions from changing old generated origins: versions 1/2 freeze four/six cultures; version 3 selects twelve before repeated seat suffixes. Genuine pre-change schema-9 sources retain seven raw-save SHA256 records and exact seals `1754cd12`, `62246794`, `1e1b8012`, `5af80213`, `72356a62`, `58aa6b37`, `19a1afaf`, including eight-seat generated origins and active paid work. Earlier schema-4–8 fixtures also remain exact. New six cultures execute paid improvement/cultivation with saved continuations; persistence now accepts schema-10 journal headers without changing its database schema.

Final source/art checkpoint: **802 tests across 80 files and all 71 Chromium gameplay scenarios pass**, with no skips, plus full typecheck, lint, content validation and production build. The last full browser run takes 3.9 minutes. All 224 approvals validate, and 90 individually reviewed additions are published alongside untouched earlier assets: 242 frames on one 2048² page, 1,076,255 PNG bytes, SHA-256 `f9ac4d64680b436311cc6c27a0d253ced11a56fe2a440cb1fdd420a9e43c9d4b`. Ninety-five actual generation calls produced ninety selected originals and five retained rejections/replacements. Each has genuine source/prompt/hash records, actual Pixel Snapper/Aseprite processing, native/enlarged inspection and a byte-bound approval. New poses remain static; thirty-six culture-qualified naval hull assets remain absent.

Root inspected and retained all eight unobstructed twelve-culture gallery views, public crests, narrow profiles, saved Morrow stewardship and fully explored Huge rendering. Real camera movement clears the first town from the map hint without hiding UI or changing zoom. All six additions found, build, save, load and import through real controls; repeated seats remain correctly distinguished from authored cultures. Matched art publication keeps one 16 MiB map page; the tested final camera reaches 26 cached chunks / 104 MiB estimated backing separately, with 16.7–16.8 ms frame p95 and no canonical change. [Static-art integration and exact measurements](performance/0022-faction-art.md).

**Open visual issue:** the 390-pixel, 130% menu screenshot contains stale duplicate control pixels beneath the disclosure, including after ordinary wheel scrolling. DOM geometry, all ten control hit/focus checks and raw opaque canvas pixels are correct; surface and CDP captures still show the defect. Containment, isolation, grid, a button-disclosure replacement and layer trials did not fix it and are not retained. A headed comparison did not launch because approval remained pending; no cross-browser cause or live-device result is claimed. This leaves menu presentation acceptance open despite green functional tests. [Reproduction, rejected trials and retained evidence](performance/0023-menu-paint.md).

The reserved twelve-culture 100-round campaign executes 4,774 orders with zero refusals, 343 battle resolutions, 32 capture decisions and all 66 permitted entity-contact pairs. Turn-51 saved continuation and complete replay agree at `c38e2946`. Huge/Legendary twelve-/twenty-four-seat origin and freshly founded-town measurements remain explicitly distinct from mature campaign throughput. The full original-four-culture Epic regression reaches victory on turn 863 with 18,935 orders and 888 battles; final envelope, compressed import and full archive replay agree at `a39584dc`. No new turn-500 archive-resume measurement is claimed. [Headless workloads and limits](PERFORMANCE.md), [roster report](performance/0020-faction-roster.json), [Epic report](performance/0021-roster-epic.json).

The existing `/unlazy`, core/simulation/AI, territory, UI-scale, lore and pixel-art/factory QA skills guided complete player/AI/save boundaries, independent package ownership, five actual source rejections, byte-bound approvals, matched measurements and the refusal to mark a visible menu defect fixed merely because control tests pass. No new skill was needed for these slices. Twelve additional authored cultures and substantial 1.0 systems remain; no release gate is marked complete.

Previous integrated checkpoint (slices 13–14): **717 tests across 75 files and all 60 Chromium gameplay scenarios passed**, with no skipped tests. Final typecheck, full lint, content validation and production build passed; ten built JavaScript chunks exclude development hooks and Art Lab. No art pixels, content definitions, rules or save versions changed. The full Epic campaign still reached turn 863 with identical portable save/log sizes and replay seal `177160fb`. All browser workflows passed together in 3.2 minutes, including the real worker boundary, 32-town land inspection, 100-army/40-town navigation, persisted shortcuts, touch controls and the existing military/naval/storage/victory workflows. [Integrated browser evidence](performance/0019-large-empire-ui.md), [matched land reads](performance/0018-read-models.md), [packed cells](performance/0017-cell-transfer.md), [navigation measurements](performance/0019-next-action.md).

Previous integrated checkpoint (slice 12): **638 tests across 70 files and all 54 Chromium gameplay scenarios passed**, with no skipped tests. Typecheck, full lint, content validation and production build passed. All 134 art approvals validated; the existing 97 images remained unchanged. The full Epic campaign reached turn 863, with exact turn-500 continuation, complete chronicles, compressed save and independent technical replay. Browser coverage (2.8 minutes) included saved land work, capital designation, real faction selection, all six art families, all twelve biomes, all five improvements and the military/naval/storage/victory workflows. [Integrated measurements](performance/0016-territory-integration.md) and [dedicated mature-land measurements](performance/0015-territory.md) were captured in separate reserved windows. Earlier slice counts and performance figures below are historical, not current totals.

## Scoped land inspection and compact map updates — slice 13

Implemented summary-only player publications and an on-demand owned-town selector, retaining the default full observation for unchanged AI behavior. The human panel fetches only the selected town, preserves detailed controls, reuses same-town tile inspection, and invalidates quotes across state/selection/worker changes. Pure queries do not enter the archive. Fresh typed-array packets carry only permitted changed cells; decoding precedes map updates and never stores world cells in React. Packet/ownership/fog/purity and stale-response regressions include the actual production worker with real structured-clone transfers, ordered paid commands and exact exported archive comparisons.

Matched Huge/Legendary 32/40-town measurements reduce ordinary land data from 3.93/4.93 MB to 25.2/32.0 KB, with exact one-town detail around 123 KB and 0.13 ms. Full observations still include expensive army/character/naval options. The separate fully explored codec workload reduces cell payloads about 89% and preserves actual movement, fog and saved continuation. [Scoped read evidence](performance/0018-read-models.md), [packed-cell evidence](performance/0017-cell-transfer.md). Content/save/archive versions and canonical outcomes remain unchanged; this is not a claim that all giant-scale debt is resolved.

First integrated checkpoint: **709 tests across 74 files and all 57 Chromium gameplay scenarios passed**, with no skips. Full typecheck, lint, content validation and build passed before continuing to the next UI slice. Browser coverage includes same-turn land quotes, saved paid work, rapid town switching and a 32-town empire with summary-only publications. Inspected screenshots retain [current narrow quotes](screenshots/slice13-current-land-quotes-narrow.png), [selected mature-town detail](screenshots/slice13-mature-empire-selected-town.png) and [fully explored near rendering](screenshots/slice13-packed-fully-explored-near.png). The fully explored Huge browser payload falls from the prior 16,554,000 bytes to 1,970,720 bytes, including 1,769,695 packed-cell bytes; its canonical seal remains `cff84c09`. The final 60-scenario run retains those exact bytes and seal, with 16.7–16.8 ms frame p95. An actual sparse-dictionary validation hole found in review now has a failing-before/fixed regression; cached movement and canonical world buffers survive real transfer detachment.

## Next-action army and town navigation — slice 14

Next/previous buttons and remappable N/S shortcuts select and center an owned army needing orders or an empty-queue town with an authoritative legal production option. Navigation clears registry filters, wraps stable IDs and issues no orders. Active journeys, standing sieges, embarked armies and stationary officer missions are excluded; interrupted routes remain actionable review items even with no movement. Selection uses the existing current-town query path, not cached prices or another map state.

Shift selects the previous entry; touch has explicit previous buttons. Distinct A–Z bindings for army, town and End turn persist separately in local browser settings, with corruption/storage-error feedback. Typing, composition, repeats, modifiers, dialogs and locked campaigns suppress navigation. Review caught and fixed siege-duty misclassification and the Shift+digit ambiguity; the accepted letter-only bindings work in both directions. New publications clear old navigation explanations.

The pure helper benchmark scans 1,500/4,000 observed armies but selects only 47/100 owned forces and 32/40 towns. Candidate construction means are 0.024/0.050 ms, excluding observation generation, React and camera/worker latency; exact observation/save bytes and canonical seals remain unchanged. [Measured workload](performance/0019-next-action.md). Final **717 tests / 75 files and all 60 Chromium scenarios pass**, with typecheck, full lint and build green. Browser scenarios exercise stable forward/back wrapping, filter clearing, input/modal ownership, real interrupted/active routes, a paid stationary refit, embarked troops, saved remapping and actual narrow-screen taps without navigation changing the canonical hash. Inspected screenshots retain [the 100-army/40-town empire](screenshots/slice14-large-empire-next-orders.png) and [390-pixel touch controls](screenshots/slice14-next-orders-touch-narrow.png).

The existing `/unlazy`, UI-scale, simulation and QA skills guided implementation through actual worker/UI/save boundaries, separate performance windows, independent review fixes and continuation after the first green checkpoint. No new skill was needed. This is next-action navigation, not completed army automation or registry virtualization; no 1.0 gate is marked complete.

## Faction ecology and worked territory — slice 12

Iron Covenant and Sepulchral Synod join the four original cultures from the existing Book. Ash scrub/chalkland bring the biome count to twelve; six explicit affinity traditions define benefits, drawbacks and cultivation targets. Generated starts favor suitable existing sites without changing physical geography. The setup selector chooses the actual player culture, retained through save/load and complete technical replay.

Colony (population 1–2), settlement (3–7) and city (8+) expand claim reach from one to three hexes, bounded at 37 claims. Capital designation is an independent paid choice with deterministic succession. The center works automatically; up to six population-supported workers gather from claimed tiles. Seven natural features, culture affinity and five improvements contribute signed yields before zero clamping. The panel explains each contribution and exact current costs/blockers; map clicks and keyboard tile controls use the same observations. Heavy faction borders and thin internal town borders allocate land, not military access rights.

Paid cultivation changes an eligible owned tile toward a faction's biome traditions. Sparse canonical overlays leave physical relief, movement terrain, natural features and ocean depths unchanged. Each town has one land work order separate from its building queue. Costs grow with distance, completed faction works and off-affinity adaptation; siege/occupation pause progress, capture cancels unfinished work without refund, and cultivated biomes persist after razing. Improvements transfer with a captured town but are removed by razing. AI rotates worker assignments and real paid land orders through the public command boundary, without hidden grants.

Genuine schema-8 saves and complete/from-save archives were captured before changes, retaining seals `5d7cc9d7`, `6e539669`, `3e96296f`, `59436979`, `4dcb29a8`, `97d13b69`. Every original command/checkpoint and exact old save byte survives migration and historical replay; modern continuation can append paid land work. Modern saves reject inconsistent visible land memory instead of repairing it. Explicit authored fixtures seed their relocated territory/sight. Review also caught and fixed an out-of-range claim-refusal leak: the same rejected probe now returns identical errors before/after an unseen rival purchase, without mutating state.

The reviewed art factory generated and published **37 new assets**: two complete fifteen-role culture kits, two biome stamps and five improvement props. All 134 assets / 152 frames fit one 2048² atlas (692,034 PNG bytes, 16 MiB map texture; potential DOM decode counted separately). There are 117 actual map/UI/fallback bindings and 17 future-only assets. Sources, two rejected attempts, real Pixel Snapper/Aseprite exports and individual native/enlarged approvals are retained. New culture poses are static; eighteen faction-specific hull variants remain unqualified and use honest procedural ship silhouettes.

Browser review found a real rendering regression: empty border Graphics at world origin inflated distant chunk cache bounds and produced black terrain. Empty leaves are now omitted, with actual Pixi bounds regressions. The corrected fully explored Huge scenario keeps cached bounds at most 837×712 pixels and rolling frame p95 at 16.7–16.8 ms. Its 26 observed cached chunks use an estimated 104 MiB of power-of-two backing, separate from the map atlas/DOM and not a complete GPU-memory proof. Inspected screenshots retain [six cultures](screenshots/slice12-six-cultures-near.png), [territory and improvements](screenshots/slice12-territory-and-improvement.png), [narrow yield/cultivation controls](screenshots/slice12-worked-territory-narrow.png), [five paid improvements](screenshots/slice12-five-approved-improvements.png), and [corrected near](screenshots/slice12-fully-explored-near.png)/[strategic](screenshots/slice12-fully-explored-strategic.png) views. The rejected black-cache image is retained separately for diagnosis, not approval.

The richer economy initially shortened the Epic fixture to turn 557. Measured 120,000/240,000-coin counterfactuals reached 652/863; modern Standard/Long/Epic commitments are now 18,000/80,000/240,000, with original knowledge/response windows and frozen rules 4–8 prices. Four multi-seed Standard/Epic duration/mirror cases and the full Epic turn-500 archive continuation pass; no minimum-turn lock was added. The final complete Epic run records 18,935 orders, 54,448 events and 888 battles with zero rejects. Its 16,991,736-byte envelope compresses to 1,475,486 bytes; restore and complete replay agree at `177160fb`. This is not a completed difficulty or long-campaign variety gate.

Four 100-turn Huge/Legendary benchmarks pass all midpoint/final-save mirrors with zero rejected orders. Mean complete rounds are 106.754/78.901 ms (Huge young/mature) and 137.785/162.484 ms (Legendary). All 512-army travel mirrors and battle/conquest workloads pass. A separate six-culture 100-round campaign completes real paid improvements/cultivation amid 139 battles and 23 captures; mature Huge/Legendary cohorts verify 1,184/1,480 claims and 59/69 completed paid works without changing geography. Large-empire observations remain a concrete scale concern: 32/40-own-town land options are 3.93/4.93 MB and full observations 5.62/8.96 MB. These are not optimization improvements or a thousand-turn giant-empire memory proof. [Workloads and limits](performance/0016-territory-integration.md).

The explicitly requested `/unlazy` discipline and new validated [territory/ecology skill](../.agents/skills/theandril-territory-ecology/SKILL.md) kept implementation, player/AI parity, fog-safe refusals, genuine historical replay, native/in-game art review and measured outcomes in one slice. The skill records the discovered hidden-claim probe and many-own-town query pitfalls. Scope and done gates now include the user's land-development requirements; no 1.0 gate is marked complete.

Previous combined checkpoint (slices 8–10): **458 tests / 52 files and all 43 Chromium gameplay scenarios passed**, with full typecheck/lint/content validation/production build and all 97 art approvals validated. This integrated [named characters](#named-officers-and-field-missions--slice-8), [incremental local saves](#incremental-local-archives--slice-9) and the user-requested 60 faction assets. Native/in-game screenshot review found and corrected a narrow recruitment CSS issue; that 43-scenario run (2.3 minutes) included stronger layout and unobstructed-control assertions. Its inspected screenshots and [performance measurements](performance/0010-faction-art.md) are retained.

## Repository audit

The initial commit contains only the design handoff and repository skills. There is no prior game implementation, package manifest, test suite, or implementation-status file. The handoff has now been installed at the repository root as directed by its README; the original handoff remains available.

## Verified campaign foundation

The strict TypeScript/pnpm/Turborepo workspace runs a real React/Vite application. A dedicated worker owns `packages/sim`; Pixi v8 renders a filtered map from cell deltas. A player can generate a seeded world, select armies, move/explore, found a settlement (consuming a caravan), grow, construct five buildings, recruit six land and three naval unit types into composed armies/fleets, resolve turns with AI factions, save/load, recover autosaves and export/import compressed campaigns. Chromium gameplay tests exercise those controls directly.

World presets contain 1,536 (test Tiny), 40,960, 98,304, 196,608 and 307,200 cells. World generation has coherent continental envelopes, five physical terrain classes, twelve climate biome identities, seven local yield features, suitable spaced starts and frozen versioned fixtures. It does not yet have hydrology/rivers, strategic resource inventories, named regions or wrapping.

Simulation has validated atomic commands, integer food/industry/coin/knowledge rules, stable ID iteration, local indexed visibility with explored/current distinctions, bounded event history, strict reference-validated saves, accidental-corruption checksums, and replay. Schema 3 migrates schema 2 (including pending field battles) and adds settlement consequences, sieges, capture decisions, ruins and diplomacy. The foundation schema-1 and synthetic pre-release v0 chains remain tested; v0 is not evidence of a historical released format. Online protocol/server do not exist yet.

The AI uses faction observations and command proposals to settle, construct, recruit, expand, engage favorable nearby enemies, invest visible towns, choose capture outcomes and negotiate bilateral peace. It purchases progression, funds the first victory project, assigns workers, improves tiles and cultivates its cultural biomes. Planning rotates its budget across large registries, prevents redundant colonists and respects visible terrain/movement. Siege/objective candidates are bounded; this remains local planning, not a theater, long-distance invasion or full research strategy. Twelve authored faction identities exist toward the requested twenty-four. Larger-seat scenarios reuse these definitions and do not increase the authored content count; historical fixtures retain their original versioned rosters.

## Validation after slice 1

2026-09-05: dependency install and frozen workspace layout established; typecheck, lint, content validator, 75 unit/property/scenario tests, production build and all 3 Chromium Playwright gameplay scenarios pass. Four 100-turn Huge/Legendary young/mature fixtures complete and preserve save hashes. The mature fixtures begin with 1,500/4,000 actual armies; they exercise current rules, not the absent military/diplomatic systems. See `PERFORMANCE.md`.

Screenshots inspected at 1440×1000 and 390×844: no horizontal clipping; the command bar and map remain usable. The Huge browser camera test is a fog-limited starting view, not a mature explored-world rendering proof.

Review fixes: stable processing across canonical save ordering; gzip CRC and forged-length rejection; required state checksums; preflight end-turn validation before AI; rotating autosave transaction recovery. No tests are disabled.

## Verified field combat — slice 2

Players can meet a visible faction, declare war, attack adjacent armies, choose Advance/Brace/Flank/Withdraw, or autoresolve using the exact same deterministic battle engine. Terrain, ranks/range, morale, fatigue, initiative, armor and pursuit affect results. Casualties, retreat positions, destroyed/trapped forces, advancement and morale/fatigue persist. The UI reports actual entering strength and strategic survivors; reports are bounded to 20. A pending battle blocks normal commands and can be saved, loaded, exported and resumed.

AI attacks on the player pause for human tactical orders; unrelated AI battles resolve through commands. After a human battle interrupts End turn, the player ends the turn again and AI replans within remaining legal resources/movement. There is no persisted turn-phase cursor yet.

Validation: 104 unit/property/scenario tests and all six Chromium gameplay scenarios pass, along with typecheck, lint, content validation, frozen dependency install and production build. Browser scenarios cover the economic loop, compressed imports/corruption, Huge camera/narrow layout, mid-battle save/autoresolve hash equality, withdrawal/pursuit and defending an AI attack. Screenshots were inspected for both tactical controls and the aftermath report. Production output contains no development observation hook or mutation API.

All four 100-turn scale fixtures also verify a 50-turn continuation from a midpoint save against uninterrupted play. No proposed AI commands were rejected in those fixtures. At slice 2, full-turn means excluding saves were Huge mature 25.93 ms and Legendary mature 66.36 ms. These fixtures do not encounter battles during their 100 turns; a separate reproducible 200-battle benchmark covers 12 versus 12 formations. Current measurements are in `PERFORMANCE.md`.

## Verified conquest and negotiated peace — slice 3

Players can blockade adjacent hostile towns, reduce their defenses and stores over turns, assault fortified stationed garrisons or empty-town militia through the existing tactical engine, and relieve a siege by defeating its besieger. Blockades suppress real settlement yields. A successful assault pauses for a saved capture choice: occupation, sack, raze, or liberation to a distinct original founder when applicable. Outcomes alter ownership, treasury, population, buildings, production queues, devastation and recovery. Razed settlements leave visible, saved ruins; a normally recruited caravan can resettle them through the founding command.

The negotiation builder reviews complete coin-for-peace packages and returns qualitative reasons and objections. Offers expire after three turns and are limited per pair; payments are rechecked atomically on acceptance, not escrowed. Accepted terms exchange coin, end the war and its blockades, preserve settlement ownership, and prevent a new declaration until the binding truce expires. Pair-level trust/respect/grievances persist; this is not the full relationship/politics system. AI proposes/responds through observations and commands, invests visible towns, chooses assaults and scores capture consequences. Human siege defense pauses correctly; AI capture decisions resolve through fresh command proposals.

Schema 3 preserves pending sieges, tactical rounds, capture choices, ruins and diplomacy. Schema-2 migration verifies the original checksum/content before adding defaults, including during a pending field battle; earlier migration chains still pass. Unknown fields and invalid references fail rather than being repaired silently.

Validation: **147 tests across 16 files**, typecheck, full lint, content validation and production build pass. All **12 Chromium gameplay scenarios** pass. New browser coverage includes siege/assault, saved capture choices with distinct occupation/sack outcomes, confirmed raze and recruited-caravan resettlement, human defense of an AI assault, negotiated peace with AI acceptance, human acceptance of an incoming offer, and rejection of unfundable terms. Desktop capture controls, ruin glyphs, acceptance explanations and 390-pixel settlement layout screenshots were inspected. Production output contains no development observation/mutation hook.

An additional 100-turn AI-led frontier scenario records actual siege, capture and accepted-peace events, with no rejected commands, save/load hashes checked every turn and a midpoint mirror for the final 50 turns. The four established Huge/Legendary 100-turn fixtures still pass their midpoint replay and final-save checks. A new repeatable conquest/peace benchmark separately exercises blockade, assault, capture, payments and treaty expiry; current measurements and scope caveats are in `PERFORMANCE.md`.

Review fixes include treasury-cap-safe sack loot, strict pending-capture provenance, prohibiting field attacks from bypassing town defenses, names for authorized liberation recipients, correct loaded-seat labels, and unfundable-offer rejection. Offers now expose only a qualitative funding blocker, so the AI does not repeatedly attempt an impossible acceptance or learn another treasury balance. Repository skills kept canonical rules in simulation, tactical/autoresolve parity intact, and ruin rendering in the existing culled marker layer. No new skill was needed for this slice.

## Verified progression, victory, long pacing and chronicles — slice 4

Two practical technologies, two mutually exclusive permanent institutions and two mutually exclusive permanent military doctrines have distinct commands, costs and real yield/armor/movement effects. Technology does not stand in for caster aptitude. The first victory path is Prosperity: research Civic accounts, adopt either institution, prepare three unoccupied settlements with markets and archives, and commit coin to a map-hosted Hearth Exchange. Location and progress are public; surrounding terrain and armies remain fog-filtered. Siege or loss of supporting infrastructure pauses progress; conquest/raze of the host cancels the commitment without refund. Canonical victory ends further orders. Other victory paths are unfinished.

Campaign pace is canonical and saved, defaulting to **Standard**, not the short testing profile. Short/Standard/Long/Epic respectively require 40/400/800/1,600 knowledge for Civic accounts, 120/10,000/24,000/60,000 coin for the project, and 5/20/40/60 active response turns. Early economy is unchanged; there is no minimum-turn victory lock or hidden AI resource grant. Three generated four-AI seeds measured Standard victories on turns **233–252**, Long **479–498**, and Epic **996–1,021**, with zero rejected commands. Pace is not a completed difficulty system, and these duration results do not prove hundreds of turns of sufficient strategic variety. The user requirement for long, engaging campaigns and postgame records is now explicit in scope/release gates.

New campaigns can be led by a player or watched with every faction controlled by AI through ordinary observations and commands. AI watch begins paused, supports one-round stepping and response-driven resume/pause, restores paused, and stops at real victory. The archive starts at generation and records every submitted simulation order/result, every emitted event, completed tactical reports and turn hash checkpoints. The bounded 200-event/20-report HUD feeds remain unchanged. A checksummed envelope saves canonical state, archive and controller mode atomically; older raw saves are supported with an explicit partial-history warning rather than invented past events.

Victory automatically opens **Campaign chronicles**: a chaptered original history tome and a separate technical ledger browsable by turn, with complete text/JSON downloads. The technical download includes the initial snapshot and replay material. The historical narrative summarizes routine marches/commissions and chronicles recorded foundations, discoveries, institutions, warfare, conquest, diplomacy and victory without inventing motives. All-faction archives are unavailable as mid-game intelligence. Full documents cross the worker boundary only when requested after victory, not in normal observation deltas. Both readers have keyboard tabs, Escape/focus restoration and narrow-screen layouts.

Schema 4 adds progression, pace, public projects, victory and doctrine metadata to battle snapshots. v0–v3 migration chains validate old content/checksums; older prototype campaigns migrate to Short pacing. Pending v3 assaults and capture decisions preserve exact continuation. Canonical rules stay in simulation; the archive is a passive command observer in its own package, not a competing rules engine.

Final validation: **215 unit/property/scenario tests across 22 files**, full typecheck/lint, content validation, frozen dependency install and production build pass. All **14 Chromium gameplay scenarios** pass (35.6 seconds). New browser scenarios play a generated Short AI campaign through victory, save/reload mid-campaign, download both logs, replay the actual downloaded technical record to the exact final hash, browse technical turns, inspect 390-pixel layout, and exercise human technology/institution/doctrine/project commands with an honestly partial imported history. Desktop tome, technical reader, progression and narrow screenshots were inspected. Production output has no development observation or mutation hook.

Headless archived Epic victory reaches turn **1,006**, retaining **26,163 orders, 37,843 events and 1,491 completed battles**. A turn-500 archive save continues to identical final logs; complete technical replay and compressed export/import also match final hash `4e74ba32`. The entire envelope is 12,704,134 UTF-8 bytes, compressed to 923,252 bytes. Four 100-turn Huge/Legendary scale fixtures retain midpoint continuation with no rejected commands; terminal project proposals are explicitly deferred only in these fixed-length performance workloads. Separate generated-start archived Huge/Legendary victories and Standard/Epic duration runs use actual victory rules. Measurements and workload limits are in `PERFORMANCE.md`.

Review fixes: omitted tactical reports cannot pass archive replay; latest checkpoints/empty origins must match saved state; save/export limits use UTF-8 bytes consistently with gzip decoding; recorder exceptions latch the worker into recovery-only mode. Cold Vite dependency optimization no longer reloads a just-started campaign. Extended runs found and fixed duplicate town names after conquest, zero-movement caravan founding and attempts to invest a third-party blockade. The latter exposes only currently visible siege presence, not another participant’s private siege strength/stores. Repository core/simulation/research/AI/UI/lore/QA skills guided package boundaries, original factual prose, deterministic fixtures and screenshot review; no new skill was needed.

## Verified travel, biomes and pixel-art contract — slice 5

The latest user-directed priority was movement/navigation, persistent travel, biome diversity and preparation for a gritty pixel-sprite update. Actual Git history still contains only the initial handoff commit; existing uncommitted implementation was inspected and preserved. Simulation, mapgen and UI/render work used explicit independent ownership with parent integration.

Clicking an army selects it; repeated clicks cycle a friendly stack. Clicking a reachable hex follows a deterministic multi-step path within remaining movement; clicking an observed reachable hostile army approaches and initiates the existing tactical battle. Range and path/cost previews come from simulation queries. No click declares war or bypasses siege defenses. Dragging pans, Escape clears selection, and numeric destination review/waypoint mode provide keyboard and touch alternatives.

Queued travel spends current movement immediately, persists up to eight waypoints/256 path hexes, and follows remaining steps after turn refresh. New local hostile sightings, foreign blockers, combat, siege duty or displacement pause travel with a saved explanation; destroyed armies lose their orders. Resume deliberately replans, cancellation stops travel, and manual orders override it. Queues never auto-attack. Army registry badges expose interruptions. There is no separate world-event/crisis system yet; future event effects must invalidate travel through canonical simulation boundaries.

Range and route queries share a 4,096-node expansion budget, stable ties and permitted explored geography. Limit exhaustion asks for a nearer waypoint rather than claiming impossibility. Queries reuse one worker observation until state changes; hover updates only small hints/inspector views and dirty overlays, not full React registries or terrain chunks. Saved routes do not run a global search each turn. This is bounded routing, not completed hierarchical AI invasion planning.

Generator 2 adds Ocean, Temperate grassland, Temperate forest, Taiga, Tundra, Desert, Steppe, Marsh, Rainforest and Alpine. Seeded climate fields produce coherent regions; all ten occur in tested Huge/Legendary seeds, with over 88% matching land-neighbor biome classifications. Physical terrain/fertility/starts remain byte-identical to generator 1, preserving costs and pacing. Biome-specific yields, resources and rivers remain unfinished. Names/colors/motifs are visible in the procedural renderer, not sprite artwork.

Save schema 5 persists biome/generator identity and canonical routes, with strict v4 and earlier migration chains. Archive format 2 retains raw older origins, every order/result/event and old seals, tagging command rules and checksum versions. Mixed legacy/modern continuation and historically rejected future command names replay correctly. A generated legacy Short campaign matches the independently recorded pre-change turn-46 seal `a7a7b987`; the fixture is reconstructed against that prior benchmark golden, not presented as a preserved raw historical file.

The new `.agents/skills/theandril-pixel-art` defines original weathered-fantasy direction, native asset-family dimensions, hex/ground anchors, directional sheets, animation timing, atlas/provenance metadata, LOD and performance acceptance. Skill creation guidance and an independent artist-handoff test improved transition edge numbering, narrow vignette sizes and the unbuilt tactical-camera contract. Its structural validator passes. MASTER_PROMPT reflects the user-directed pixel technique; actual sprite conversion and atlas importer remain future work.

Final verification: **257 tests across 26 files**, full typecheck/lint, content validation, frozen offline install and production build pass. All **20 Chromium gameplay scenarios** pass sequentially (46.5 seconds), including six real canvas/queue/touch scenarios. Earlier overlapping runs collided only in trace output; clean sequential runs resolved this without disabling tests. Desktop and 390-pixel screenshots were inspected. Follow-on navigation polish places travel controls above optional single-step shortcuts, prioritizes interruption reasons and Resume/Cancel, removes the misleading adjacent-only selected-hex button, and asserts both interruption controls are in the desktop viewport. No simulation/worker rules changed in that polish; deterministic/scale measurements remain applicable. Final production output has no development observation or mutation hook; main chunk 643.71 kB (197.13 kB gzip), worker 329.48 kB. Existing chunk-size and upstream Zod annotation warnings remain.

Four 100-turn Huge/Legendary AI workloads preserve 50-turn midpoint mirrors with no rejections. Fully explored movement workloads verify 512 queued armies on each giant preset, all arrivals, and 20 saved continuation turns. Warm preview p95 was 0.178/0.098 ms; cold observation indexing was 16.5/36.8 ms in the worker. Five active 512-army travel phases had median 71.1/67.0 ms; subsequent idle turns are reported separately. Mature complete-turn means were 17.17/48.24 ms, compared with prior 17.42/46.36 ms; biome-bearing snapshots increase save/hash/archive costs. Epic archived victory remains turn 1,006 with all 26,163 orders, 37,843 events and 1,491 battle reports. See PERFORMANCE.md for scope and remaining scale costs.

## Verified art factory foundation — slice 6

2026-09-05: inspected the user-supplied THEANDRIL_ASTRA_ART_FACTORY_PACK, actual implementation and initial-only Git history. Installed its art architecture/style/done/schema documents and seven complementary repository skills, preserving and extending the existing pixel-art skill and references. A new offline `packages/art-pipeline` owns strict manifests, bounded PNG decoding, palette/animation/hex-mask checks, hash-bound visual approval, deterministic contact sheets and padded/extruded atlases. Simulation, content IDs, save schema and archive rules remain unchanged.

The existing Steam Aseprite 1.3.18.3 runs headlessly. A project-local, ignored installation of Sprite Fusion Pixel Snapper 1.0.0 is verified; no Steam files or global shell configuration were replaced. Provider adapters report supported capabilities and missing credentials; built-in generation produced four original source sheets and a corrected revenant for 29 generated-art briefs, supplemented by eight original code-native overlays. Native 1 px re-snapping visibly degraded detail, so processing uses integer 4× clusters before real Snapper and validates the native canvas. A checkerboard alpha correction and detached-tablet revenant were rejected; version 2 was regenerated/reviewed. Source prompts/hashes, editable Aseprite exports, processing records, rejected inputs and exact visual-review evidence are durable outside the cache.

Published **37 individually reviewed assets / 55 frames** in one deterministic 1024² atlas (217,073 PNG bytes / 4 MiB RGBA). **17 actual gameplay consumers** cover current guards/scouts/caravans, town-density stages, ruins and ten biomes; 20 future assets do not create unimplemented gameplay. Nearest-sampled pooled sprites, cached terrain, separate ownership/range overlays, static/far LOD and reduced-motion behavior preserve observation/input boundaries. DEV-only Art Lab inspects native 1/2/4/8×, real clips/stepping, alpha/palette/bounds/pivots, atlas rectangles, terrain repeats and manifest/review data. Stale/malformed/oversized images fail visibly before measurement/decode; invalid runtime art keeps a playable fallback. Production excludes Lab code/catalog and debug hooks.

Full **311 tests / 33 files**, typecheck/lint, content validation, frozen offline install, production build and **25 Chromium gameplay scenarios** pass. All eight art skills pass structural validation. Real four-frame Aseprite sources retain tags/250 ms timing; repeated native exports and reversed-input atlas builds are byte-identical. Native/enlarged and actual map/Lab screenshots were inspected and retained. Warm approved-pack validation/atlas-build medians are 14.96/33.05 ms. Fully explored Huge rendering (196,608 cells / synthetic 1,500 global armies) uses 9–16 chunks, 48 visible entities / 47 near idle animations, and 16.8 ms frame p95 in the tested browser. Initial full-world transfer is 13.36 MB and first art render 34.9 ms; these costs are explicitly recorded, not claimed solved.

Four 100-turn scale workloads and 512-army queued-travel mirrors preserve every prior final hash with zero AI rejections. True Epic AI victory remains turn **1,006**, with complete 26,163-order / 37,843-event / 1,491-battle logs, restored/gzip/full replay hash `04e10fd5`. Existing movement, combat, diplomacy, save and victory-log browser scenarios pass with sprites enabled. See [art gates and screenshots](art/ART_IMPLEMENTATION_STATUS.md), [operator guide](art/README.md), [coverage](art/ASSET_CATALOG.md), [architecture](architecture/0013-art-factory.md) and [measurements](performance/0006-art-factory.md).

This is an exercised source-to-runtime foundation, not full art-production signoff: other provider credentials/models are unconfigured, full directional/faction states and biome/shore/road variants remain incomplete, repeated terrain stamps are visible, and current regular-hex fit is fractional rather than pixel-perfect gameplay zoom. Art skills influenced actual rejection/revision, provenance boundaries and visual/performance review, not just documentation.

## Campaign contact and composed armies — slice 7

Inspected the user's local recording and reproduced seed `748291`, Standard/Long, four factions exactly: victory on turn 551, no contacts, wars or battles, final hash `50092025`. All six start pairs were connected. The browser always requested four factions, the AI inspected neighbors already inside its sight radius (zero exploration score), and one-step orders left 67.1% of available movement unused. Geography and generator versions were not changed to manufacture contact.

New-game setup exposes 2–48 faction seats and size recommendations Tiny/Small/Standard/Huge/Legendary = 4/12/24/32/40. Four authored introductory cultures remain distinct from generated faction seats; no false content-count claim. Existing explicitly counted games retain their counts. Movement proposals use the public range query, score actual newly revealed sight, and use a shared 8,192-node fallback frontier-search budget. Immediate journeys are proved on currently visible land so another friendly scout's discoveries cannot invalidate an old route proposal. Treaty, recovery and visible threat constraints remain; settlement-space reservations prevent two same-batch caravans founding too close together.

Schema 6 introduces real 1–12-formation army containers with stable formation IDs, individual losses/morale/fatigue, summed upkeep/strength, best sight and shared slowest-unit movement. Co-located owned armies can merge, transfer selected formations or split a named detachment through atomic commands. Reorganization never restores spent movement and pauses affected travel. Founding consumes one caravan formation without deleting its escorts. Field/siege battles receive actual formations through the existing deterministic tactical kernel; a surviving container keeps its remaining formations, and saved reports preserve both army and formation aftermath. Oversized defending stacks are rejected explicitly, not truncated.

Recruitable Ash pike companies, Cinder plate cohorts and Charter outriders join the original caravan/Wayfinder/Oath guard definitions. Their reach, armor/morale/slow movement, and speed/initiative/light armor respectively create distinct existing-rule tradeoffs; no unimplemented anti-cavalry or character ability is claimed. AI budgets varied recruitment, assembles co-located detachments, preserves an independent scout, advances toward visible objectives and avoids nearby superior wartime threats. Expansion targets respond to map area per faction. Named commanders, characters, agents and missions remain the next real-system slice, not empty decorative slots.

Old raw schema-4/5 origins and archive seals remain immutable. Frozen historical planner fixtures plus real pre-change queued-travel and battle captures verify exact old command outcomes, pending-battle continuation and versioned hashes. Numeric archive rules permit 4→5→6, never a downgrade. Modern formation operations/new content cannot masquerade as old singleton snapshots. The content change explicitly recognizes the previous `3139d4e7` pack.

The renderer consumes three already-reviewed troop sprites (20 live assets, still 37 approvals / 55 frames). Approved pixels and PNG hash are unchanged. Small hill ridges replace the obsolete solid triangle obscuring biome art; fallback physical-terrain markers and Alpine identity remain. Army composition controls expose actual rosters, shared capabilities, selection-based transfers, capacity constraints and recruitment instructions.

On the recorded seed, every faction now has at least one contact by turn 80 in Standard/4, turn 41 in Standard/24 and turn 52 in Huge/32; the player's first contact is respectively 80/30/28. These fixtures run real commands, battles/captures and save mirrors with zero rejected proposals. A complete Standard/Long/24 campaign reaches victory on turn **341**, recording **55,282 orders / 155,293 events / 2,335 battles**, with both full logs and exact envelope/gzip/technical replay at `148564e1`. The full archived Epic fixture reaches turn **970**, with **16,192 orders / 45,579 events / 1,174 battles** and exact turn-500 continuation and replay at `92409cfa`. Stronger conquest can earn shorter victories; no minimum-turn lock, hidden income or movement multiplier was introduced. Pace remains separate from the unfinished difficulty system.

Final verification: **367 tests across 41 files**, full typecheck/lint, content validation and production build pass. All **32 Chromium gameplay scenarios pass** sequentially (1.6 minutes), including recorded-seed AI-watch contact, actual formation merge/split/transfer, escorted founding, per-formation saved tactical losses, 12-formation limits, keyboard controls at 390 pixels and all previous gameplay/log-download/replay scenarios. Successful escorted founding now selects the new town without overriding a later player selection. Modern Short replay uses its actual turn-43 result; the independent legacy turn-46 golden is unchanged. Desktop and actual narrow viewport screenshots were inspected and [retained](art/ART_IMPLEMENTATION_STATUS.md#slice-7-integration-verification).

Four isolated 100-turn Huge/Legendary young/mature workloads preserve every midpoint command/result/event and final-save hash with zero refusals. Full-turn means range **47.741–118.276 ms**, excluding archives/browser/persistence. All 512 queued journeys finish with exact 20-turn save mirrors. Fully explored Huge rendering remains viewport-bounded with **16.8 ms frame p95**, one 4 MiB atlas and no canonical change during camera motion. Initial observation is still 13.37 MB and first sprite render 32.5 ms; whole-envelope archives remain a scale risk (44.4 MB in the recorded-seed completed campaign). Production excludes development hooks and Art Lab; main chunk 690.37 kB / 211.38 kB gzip, worker 346.34 kB. Existing build warnings remain non-fatal. See [measurements and workload limits](performance/0007-contact-and-armies.md) and [decision 0014](architecture/0014-contact-and-army-composition.md).

Repository simulation/AI/QA skills guided observation-only planning, canonical formations and immutable legacy replay; art integration/terrain skills kept reviewed pixels separate from relief overlays and required real sprite/fallback screenshot review. No new skill was needed for this slice.

## Named officers and field missions — slice 8

Paid named Hearth marshals, Road witnesses and March engineers join armies at the same hex, with one marshal/two companions per army. The searchable 25-row roster exposes exact costs, attachment options and blockers, mission progress, wounds, memorials and earned specialization. Marshals contribute frozen battle leadership and one Rally per battle; manual play and autoresolve use the same ability primitive. Rally cannot restore routed formations, heal strength or reduce above-base morale. Battle experience, retreat wounds, destruction and frozen named aftermath persist.

Survey, refit and siege sabotage are actual two-turn stationary commitments with coin costs. Survey charts remembered terrain without exposing hidden armies; refit heals surviving formations only; sabotage removes real defenses and can fail with three-turn wounds. Cancellation, combat/displacement or loss of the siege interrupts work without refund. Completion occurs before the normal movement refresh. Four mutually exclusive role-compatible specializations cost earned experience; Siege craft improves sabotage reliability. Fortified assaults remain legal before defenses reach zero—sabotage changes their defenses, not an invented assault prerequisite.

Observation-only AI normally appoints, attaches, promotes, surveys, refits and attempts sabotage, reserving mission carriers and discretionary coin without starving routine construction/expansion. Foreign officers/agents are private in normal strategic observations; witnessed battles disclose participating field officers and their aftermath, not unrelated people/missions. Canonical living/memorial limits are 64/32 per faction, distinct from the smaller current AI recruitment policy. Casters, covert agents, offices, loyalty and a full character progression tree remain absent.

Schema 7 preserves genuine pre-change schema-6 travel/split archive `90ffebed` and mixed-battle archive `31b14677`, plus older 4/5 fixtures. New mission/battle save continuations and complete replay pass. The character checkpoint passed 405 tests across 46 files, full typecheck/lint/content validation/build. Its fifth browser scenario exposed two test assumptions (fortified assault eligibility and a reset mission selector); both were corrected from actual rules/controls. All five character scenarios subsequently passed together, including sabotage success/failure, saved wounds and three-turn recovery. Retained inspected screenshots: [narrow roster](screenshots/slice8-characters-narrow.png), [earned fieldcraft](screenshots/slice8-field-engineer.png), [Rally](screenshots/slice8-rally.png), [wounded engineer](screenshots/slice8-wounded-engineer.png).

Four isolated 100-turn Huge/Legendary young/mature fixtures verify every midpoint continuation and final save with zero refusals; full-turn means 50.073–120.315 ms, excluding archives/storage/browser. A loaded character cohort exercises 1,024/1,280 paid characters and 320/400 completed refits with exact healing and mid-mission mirrors. The full seeded Epic campaign wins at turn **868**, with 14,723 orders, 43,354 events, 1,069 battles, 465 completed missions and 177 Rallies; turn-500 continuation and both final records agree at `c7dae7ca`. The user's Standard/Long seed 748291 with 24 seats wins at turn **392**, retaining 2,925 battles and a 50.58 MB complete envelope, replay hash `24b04c5f`. An earned conquest-driven Epic seed 99 finishes at 648; regression exceptions additionally require substantial battles/captures and a larger winning empire. Pace costs and the independent 800–1,400-turn Epic regression remain unchanged.

The requested repository-local [Unlazy skill](../.agents/skills/unlazy/SKILL.md) was created, structurally validated and used: explicit package ownership, preserved pre-change evidence, correction of reproducible failures, complete player/AI/save integration, measured workloads, and continuation into the storage bottleneck below. Core/simulation/AI/combat/UI/QA/lore skills maintained canonical rules, honest field-officer disclosure and original naming. [Performance evidence](performance/0008-characters-and-missions.md), [decision 0015](architecture/0015-characters-and-field-missions.md). This is a playable foundation, not a completed character or campaign gate.

## Incremental local archives — slice 9

A private, game-bound campaign journal owns append-only evidence. Autosave and manual save encode only the uncommitted suffix; full archive materialization is reserved for explicit exports and post-victory readers. Local DB2 manifests reference immutable SHA-256 history chunks (256-record/256-KiB bounds, continuation fragments for larger legitimate records). Three independent payload replicas protect shared prefixes; atomic three-generation rotation and checksummed reference metadata prevent failed saves from evicting valid recovery. Cleanup is bounded to 64 orphaned blobs per commit. Old DB1 text rows, raw saves, portable envelopes and archive formats remain supported.

Thirteen journal tests and twenty persistence tests pass, covering detached ownership, old 4–7 evidence, saved missions/victory seals, suffix/no-op work, retries, quota rollback, exact UTF-8 size accounting, legacy upgrade, corruption/replica recovery, branches and bounded cleanup. The real browser save scenario passes: actual End turn/manual controls produce shared chunk manifests; a deliberately corrupted newest manual manifest falls back to the older exact hash, and its downloaded portable archive replays and imports identically. All five character workflows also pass through the new store. The full 43-scenario faction-art integration run passes these workflows together.

Isolated storage benchmarks use real AI prefixes with identical mirrored commands and complete reconstructed replay. At Tiny Epic turn 511 (8.37 MB), mean incremental save is 13.56 ms versus 198.07 ms for the previous full-envelope path; at Standard/Long/24 turn 261 (34.04 MB), 210.66 versus 1,049.78 ms. These use fake-indexeddb and measure algorithm/serialization/emulated transactions, **not browser disk latency**. A no-op writes zero history payloads; larger-case no-op still costs 207.36 ms for current snapshot/transaction work. Full in-memory history, explicit full export and the 64 MiB logical cap remain; three replicas are a recovery choice, not a threefold space reduction. Raw heap reached 2,109 MiB including both journals, emulated storage and complete replay/materialization temporaries, with no retained-memory proof. [Measured storage evidence](performance/0009-incremental-storage.md), [decision 0016](architecture/0016-incremental-local-archives.md).

## Faction artwork — slice 10

All four implemented faction definitions now have distinct, individually reviewed kits: six troop roles, three character roles, three town stages and crest/banner/badge per family. Generated seats use the actual definition ID, never name suffixes or skin/metal tint. Observation exposes that public identity only for known factions. Near map sprites, culture buildings, grouped far-view badges/town banners, public reference crests, encountered factions, negotiations, army composition/recruitment and own character controls use the approved variants. Missing packs/roles fail visibly into generic/procedural fallbacks without revealing hidden entities.

All 60 new sprites passed real Pixel Snapper and Aseprite processing, individual native/enlarged reviews and exact approval seals. Source revisions/rejections, component-isolation evidence, palette/alpha/pivots and editable exports remain durable. Source-bound crop reviews and recomputed component metadata prevent stale approval reuse; every alpha≥128 source pixel is retained once. The first 45 processed sprites remained byte-identical when provenance was strengthened. The complete 97-asset / 115-frame pack fits the same 1024² atlas: 492,790 PNG bytes / 4 MiB map texture, plus a separately accounted potential 4 MiB DOM decode. [Coverage](art/FACTION_ASSET_CATALOG.md), [decision 0017](architecture/0017-faction-art-families.md).

Five new browser scenarios pass alongside all previous workflows. They exercise all 24 faction/troop combinations, real character roles, each heraldic consumer, renamed factions, private enemy/character omission, actual map selection, near/far/narrow views and missing variants. Full save/replay/AI-victory/chronicle/storage scenarios pass with unchanged canonical content hash. The native kits are static, not fabricated idle animations; generic fallback animations remain tested. Screenshot review corrected cramped narrow recruitment cards; computed one-column layout, readable description width and unobstructed culture cards now pass with the real sticky footer enabled. [Retained visual evidence](art/ART_IMPLEMENTATION_STATUS.md#slice-10-integration-verification) includes both native-sized UI and map views. The current world camera remains fractional; terrain stamp repetition and dense map labels still need production readability work.

The isolated offline 97-asset validation/packing/decode medians are 33.63/68.60/14.04 ms. The final synthetic fully explored Huge browser workload retains one 4 MiB map page, 9–16 cached chunks, 1,024–2,304 drawn terrain cells and 16.7–16.8 ms rolling frame p95. Near view has 48 static entity sprites; far home view uses two grouped heraldic sprites. First art render CPU is 26.6 ms and initial observation remains 13,375,621 bytes; camera interaction preserves `727da879`. These are renderer measurements, not late-game strategy throughput or complete memory proof. [Workload and raw measurements](performance/0010-faction-art.md).

## Generals and fleets — slice 11

Modern unled armies accept up to twelve formations. A healthy attached marshal commands sixteen, with earned command-tree nodes raising the limit to eighteen/twenty. The eleven skill definitions include the four existing exclusive specializations and seven prerequisite-based earned nodes with actual command, combat or field-mission effects. Losing/reassigning/wounding the general preserves all formations, clamps an oversized army to one movement and exposes reorganization/replacement blockers. Modern battles support twenty formations per side on four ranks; historical kernels and archive rules retain their original twelve-formation semantics.

Generator 3 adds explicit shallow shelves (two water hexes from land) and deep ocean without changing existing land/biome/fertility/start layouts. Coastal navigation, a coastal Charter harbor and paid recruitment produce three real naval hull types. Every surviving transport formation carries eight land formations. Ocean navigation and an ocean-capable hull in every fleet formation are both required for deep water. Boarding, sailing, unloading, sight, queued route interruption and hull/cargo losses are canonical; carried troops/officers retain identity but cannot act independently or reveal private cargo to opponents. Modern battle snapshots retain cargo provenance and validate losses against surviving hull capacity. Human controls and observation-only expedition AI pay for ships, board actual troops, sail, land and resume land objectives.

The new repository-local [armies/fleets skill](../.agents/skills/theandril-armies-fleets/SKILL.md) and existing `/unlazy` skill require this combined player/AI/save/fog/performance verification rather than stopping at schemas. Genuine pre-change schema-7 archives retain exact seals `1af2d228`, `7980882d` and `d14195b3`; modern continuation appends schema-8 evidence without rewriting originals. [Design and boundaries](architecture/0018-generals-and-sea-travel.md). The existing sixty faction assets remain approved and unchanged; the three new hull roles currently use explicit procedural ship silhouettes, not falsely approved infantry artwork. Twelve faction-specific hull variants and naval animation are pending art work.

Isolated final-content military measurements and exact mirrors pass; see [workloads and limits](performance/0012-armies-fleets.md). Twenty-versus-twenty kernel resolution measures 0.497 ms median / 1.024 ms p95. Synthetic Huge/Legendary cohorts retain 18,908/25,760 formations and 1,024/1,280 marshals through 27 mirrored turns; median idle turns are 1.695/3.694 ms, seat observations 2.806/5.129 ms. Untruncated assignment choices increase seat payloads to 662,636/1,148,794 bytes; strict canonical load medians are 139.386/202.365 ms. A real saved cargo voyage conserves identities through island landing. These are separate kernel, idle and short-voyage workloads, not an invasion or archived-campaign throughput claim.

The stronger modern economy shortened the independent Epic fixture to turn 714. Three-seed diagnostics retained unsuccessful funding hypotheses and exposed first-ID project-host selection. AI now compares bounded observed threats, local garrisons and friendly settlement depth only when actually able to start. Schema 8 raises Epic's project commitment to 75,000 coin; historical rules4–7 retain 60,000, with fifteen version/budget regressions covering quotes, atomic refusals and exact spending. The unchanged 60-turn response window, early economy and victory rules have no minimum-turn lock or hidden AI grants. Final policy diagnostics finish seeds 20260905/74/99 at **1,111 / 897 / 700**; seed99's existing earned-conquest exception includes twenty winning towns, 688 battles and 163 captures. Full archived turn-500 continuation and both technical replays pass for the 1,111-turn case. [Retained diagnostic evidence and failed hypotheses](performance/0013-pacing-diagnostics.md). The long integration test now has a scoped 60-second wall-time budget (about31 seconds measured); its 800–1,400-turn gate and all replay/log assertions remain intact.

Review fixes preserve valid paused deep-water routes after a coastal hull merge while making explicit resume recheck current capability; reject modern content IDs forged into schema7; retain every legal crowded-town character destination; and keep selection/focus intact when Escape closes an officer window after assignment disables its focused button. The armies/fleets skill now records these concrete pitfalls. Persistent naval invasions, supply, difficulty, admiral politics and final naval sprite families remain unfinished.

Final integrated measurements: four 100-turn Huge/Legendary young/mature campaigns preserve all fifty-turn midpoint continuations and final save seals with zero rejected AI commands. Mean full turns excluding saves/archive/browser are 71.022/56.759 ms (Huge young/mature) and 87.264/140.561 ms (Legendary); these changed command mixes are not pure optimization comparisons. All 512 queued land journeys retain exact twenty-turn mirrors. The full Epic archive holds 21,176 orders, 61,057 events and 1,116 battles; envelope/gzip/technical replay agree at `4e68cc88`. Its 19,801,442-byte envelope compresses to 1,690,022 bytes. Fully explored Huge rendering draws 1,024–2,304 terrain cells with one 4 MiB map atlas and 16.7–16.8 ms frame p95; initial transfer is now 16,499,620 bytes, so packed static transfers remain a real scale priority. These do not prove a thousand-turn giant mature empire's memory or strategic variety. [Complete workload evidence](performance/0014-integrated-military-campaigns.md).

Final screenshots were inspected and retained: [skill branches](screenshots/slice11-general-command-skills.png), [wounded-general repair at 390 px](screenshots/slice11-wounded-general-narrow.png), [twenty-formation battle](screenshots/slice11-twenty-formation-battle.png), [shallow/deep water and fleets](screenshots/slice11-coastal-depths-fleets.png), [narrow landing controls](screenshots/slice11-transport-landing-narrow.png), [marshal-led fleet](screenshots/slice11-marshal-led-fleet.png) and [actual passenger losses](screenshots/slice11-passenger-losses.png). The existing `/unlazy` discipline and new armies/fleets skill kept canonical rules, human controls, AI, immutable history, transport/privacy checks and measured player outcomes in one verified slice. The new skill is structurally validated; scope/done gates now explicitly include the user's general and sea-travel requirements.

## Release status

No overall1.0 gate signoff is claimed. This is a substantial playable alpha, not a feature-complete beta awaiting polish. The integrated loop supports exploration, founding, worked territory, paid construction/cultivation, practical research, composed armies/officers, conquest, peace, naval transport, saved journeys and one Prosperity victory with complete AI chronicles; slice23 adds battlefield presentation and a small paid magic loop. Counted definitions are24 authored cultures,13 shared unit types (ten land/three naval),5 buildings,10 technologies,2 institutions,2 doctrines,11 earned officer skills,1 Rally ability,1 innate shield drill,4 character roles/3 mission kinds,10 improvements,2 Arcane Theory discoveries,2 personal magical paths and2 battle spells. Art variants and repeated realm seats are not additional gameplay factions or unit definitions.

The release now has24 authored playable cultures and unique18-role art kits, but still requires much broader independent/content/progression coverage and at least three distinct tested victory paths. The new paid caster, two personal aptitudes and two national discoveries are a small battle-magic foundation; magical path growth, rituals, items and counter-magic remain absent. Existing diplomacy enforces coin-plus-truce peace and relationship memory, but not trade/access/alliance/client relationships. Politics, difficulty-aware strategy, epochs/crises, supply, theater operations and deeper empire delegation remain unfinished. Combat has general-led formations, branching skills, Rally, naval combat/passenger losses and the new battlefield/ability interface, but lacks editable deployment, attacking army groups/reinforcements and broad faction-specific abilities. No multiplayer server/rooms/seat authentication/reconnect flow exists; Firefox/WebKit release testing and thousand-turn giant mature-empire memory evidence remain open. One reachable victory and long funding profiles are not a complete1.0 campaign; a single completion percentage would conceal these whole-system gaps.

## Verification

Current known limits: land/shallow/deep routing is bounded to explored geography, 4,096 search nodes and 256 route hexes; there is no hierarchical routing. Sight remains radius-based. There is no economic starvation/population decline outside capture consequences; text scaling is session-local while validated letter shortcuts persist in local browser settings; no server; large registries are not virtualized. Field attacks/assaults initiate with one composed army and support at most twenty actual formations per side; larger defending stacks are explicitly rejected. Peace covers coin and a binding truce, not settlement transfers, alliances, access or client rule. Siege sabotage and field engineers exist, but defenses/stores and empty-town militia remain basic, without naval bombardment, reinforcement orders or civilian migration. Occupation is a timed yield penalty with reconstruction, not full culture/stability/resistance. AI explores frontiers, concentrates formations, uses paid officers/skills/missions and sails real expeditions, but lacks persistent theaters/invasion logistics, full difficulty behavior and long-campaign variety. Local saves commit incremental history chunks; full in-memory journals and complete portable envelopes retain a 64 MiB UTF-8 policy and still need memory/export profiling for 1,000-turn giant mature empires. Oversized saves fail visibly without evicting valid generations; no archive is silently truncated. Technical per-turn UI previews cap exceptional pages at 200,000 characters while downloads retain all data. Checksums detect accidental corruption, not maliciously rewritten history. Production retains non-fatal large-main-chunk and upstream Zod annotation warnings; the final production main is 813.28 kB / 248.72 kB gzip, worker 562.92 kB and CSS 67.70 kB / 13.20 kB gzip. All ten built JavaScript chunks exclude Art Lab/debug hooks. Browser coverage is Chromium 151.0.7922.173 on Arch Linux; Firefox/WebKit remain unverified.

## Next work

Finish the remaining sparse Standard/four-seat contact and parallel Epic timing gates; the Standard24 and Huge32 contact gates now pass. All24 cultures have definitions, name pools, approved unique18-role kits and roster integration; deepen their mechanically meaningful troop/magic asymmetry and long-campaign balance. All ten improvements and five civic buildings now have original approved artwork; the four new specialist troop roles still share appropriate existing silhouettes. All72 culture-specific naval hulls exist; true faction-wide action/directional clips remain unfinished beside the Ashen scout idle and single shared Waykeeper cast pilot. Keep the narrow campaign-menu painting issue open until a verified fix or browser-specific diagnosis exists; successful control/hit tests do not close that visual gate.

After completing the current geography/zoom/army verification, the highest-leverage gameplay slices are client-state diplomacy with a genuinely distinct unification/conquest victory; a small complete caster/site/research/counter-magic loop with faction asymmetry; and delegated empire operations through production policies, grouped alerts and bounded theater/rally orders. Practical research and earned officer trees are not magical progression. Long campaigns also need difficulty-aware strategy, epochs/crises, richer expansion/economy and persistent long-distance military/naval operations. Extend commands/save migrations/AI/UI/tests together. Multiplayer is a separate major release blocker, not a UI toggle.

Local incremental history is implemented, but streamed exports/archive memory profiling, the remaining army/character/naval observation costs, saturated renderer-cache measurements, hierarchical routing, persistent turn-phase continuation and mature-empire registry virtualization remain scale priorities. Other art follow-up is real directional/action animation, terrain variants/transitions and remaining painting/readability issues, not additional copies of the current static land families. Rivers currently provide freshwater geography/yields and presentation, not navigable river fleets or a bridge/ford crossing system; passes use actual existing passable terrain. New map diversity does not itself complete strategic resources, trade logistics or geopolitical AI.
