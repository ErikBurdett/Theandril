# Immediate victory-project interruption

24 October 2026. Decision for the current rules35 AI correction; implementation
and acceptance evidence: `docs/development/2026-10-24-project-counterplay/`.

An authored, strictly loadable campaign proves a specific loss: a realm accepts
or offers ten turns of peace while an enemy project is one turn from victory,
even though its adjacent free company can legally pause that project by siege.
This does not establish the cause of the open generated-campaign pacing gaps.

Canonical siege establishment stays in `packages/sim`. A shared pure blocker
preserves the command's existing refusal order and semantics. Its public
observation adapter returns legality and the same refusal, without pathfinding,
cloning canonical state, or access to hidden objects. Observation-owned primitive
indexes are shared across bounded queries. Command validation remains final.

Rules35 observations advertise the query capability and a generic strategic
command blocker. The latter supplies the dispatcher refusal during unrelated
private battle/capture phases without revealing participants, location or the
masked decision object. Historical observations omit these additions and keep
their previous AI policy. No canonical state/save field or rules change follows.

The AI considers at most eight imminent active enemy projects and makes at most
four public siege queries per diplomatic pass. It preserves direct and delegated
orders, missions, transport and binding agreements. It requires actual current
host sight and an available adjacent combat company; public project coordinates
alone cannot grant sight. An active own project finishing strictly sooner keeps
ordinary peace evaluation. No distant invasion or general treaty redesign is
part of this correction.

The real worker invokes a faction planner only once per round. A rejection alone
therefore cannot protect a project that will finish at the ensuing end turn.
Ordinary rejection removes only the offer and emits events; it changes no war,
treaty, movement or siege fact. The narrowly proved counterplay branch can
propose rejection followed by its already legal ordinary siege in that same
batch. Accepted peace still ends its pass. Every command is separately validated
and journaled; real browser turn-loop and saved replay evidence must verify the
ordered pair. No generic worker replan loop is introduced.

Acceptance requires canonical refusal/historical parity, ordinary paid-project
fixtures with negative controls, exact saves/replay, actual worker gameplay,
representative Huge/Legendary planner/query measurements and the unchanged
nine-campaign headline matrix. Prices and proxy bounds remain unchanged. This
slice does not close R06, DH-021, ACT-32/M3 or any 1.0 gate by itself.

## Retained follow-up changes the acceptance boundary

Before publication, a real once-per-realm Watch continuation exposed a second
failure: the first interruption paused the project, but at turn30 a new peace
offer released the existing siege and the rival won at turn31. Both initial
offer variants reproduce it with exact replay. The player branch instead offers
peace at turn28; if the human leaves it unanswered, the existing planner later
assaults. These are distinct outcomes, recorded in `following-rounds-evidence.json`.

An active-project-only filter is therefore insufficient for this delivered
counterplay loop. Extend the same bounded observation review to an imminent
paused project at an existing own siege. Preserve that siege through peace
review; its ordinary tactical/conquest planner still decides whether to assault
and its ordinary commands remain authoritative. Do not reinterpret a paused
project without that own-siege relationship, or a third party's siege, as the
same commitment. Keep the faster-own-project exception, diplomatic protection,
current sight and shared candidate/query bounds. No new canonical command,
worker replan loop or forced battle outcome is justified by this correction.

Final acceptance must rerun real subsequent rounds, saves/replay, full tests,
headline pacing and representative measurements. Earlier active-only evidence
remains an accurately labeled intermediate checkpoint, not final acceptance.
