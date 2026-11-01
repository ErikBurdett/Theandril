# The AI-watch chronicle journey's victory turn under rules 78

`tests/gameplay/chronicles.spec.ts` pins the turn on which the generated
AI-watch campaign (seed 20260905, tiny, short pace, four realms) ends: 56
under rules 66 through 77. Under rules 78 it ends on **57**.

[replay-watch-campaign.ts](replay-watch-campaign.ts) replays the campaign
headlessly with the worker's planning loop, rules 77 against current
([output](chronicle-replay.txt)): rules 77 ends on 56, rules 78 on 57, and
the first of 916 commands to differ is the 536th, the Reedbound Council's
answer to its turn-40 hearth event: the same draw lands on *The long peace*
(answered *Let them*) under the larger catalogue where it landed on
*Rumours of glass* (answered *Send surveyors*) under rules 77. Every command
before it is identical. The pin now reads 57 and names this note; no
assertion was weakened and no timeout changed.
