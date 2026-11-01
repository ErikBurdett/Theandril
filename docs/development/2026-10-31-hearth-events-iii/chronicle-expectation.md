# The AI-watch chronicle journey's victory turn under rules 62

`tests/gameplay/chronicles.spec.ts` pins the turn on which the generated
AI-watch campaign (seed 20260905, tiny, short pace, four realms) ends: 54
under rules 57 through 61. Under rules 62 it ends on **53**.

[replay-watch-campaign.ts](replay-watch-campaign.ts) replays the campaign
headlessly with the worker's planning loop, rules 61 against current
([output](chronicle-replay.txt)): rules 61 ends on 54, rules 62 on 53, and
the first of 845 commands to differ is the Reedbound Council's answer to its
turn-40 hearth event: the same draw lands on *Pilgrims on the road* under the larger
catalogue where it landed on *A border fair* under rules 61. Every command before it is
identical. The pin now reads 53 and names this note; no assertion was
weakened and no timeout changed.
