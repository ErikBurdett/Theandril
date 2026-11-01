# The AI-watch chronicle journey's victory turn under rules 54

`tests/gameplay/chronicles.spec.ts` pins the turn on which the generated
AI-watch campaign (seed 20260905, tiny, short pace, four realms) ends: 53
under rules 53. Under rules 54 it ends on **56**.

[replay-watch-campaign.ts](replay-watch-campaign.ts) replays the campaign
headlessly with the worker's planning loop, rules 53 against current
([output](chronicle-replay.txt)): rules 53 ends on 53, rules 54 on 56, and
the first of 693 commands to differ is on turn 12, the turn the Toll Wars
come with the Age of Roads: the Ashen Compact answers the crisis's own event,
*A toll at our own gate*, by barring the gate, an event rules 53 never
offered. Every command before it is identical. The pin now reads 56 and
names this note; no assertion was weakened and no timeout changed.
