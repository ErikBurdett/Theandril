# The AI-watch chronicle journey's victory turn under rules 66

`tests/gameplay/chronicles.spec.ts` pins the turn on which the generated
AI-watch campaign (seed 20260905, tiny, short pace, four realms) ends: 57
under rules 64 and 65. Under rules 66 it ends on **56**.

[replay-watch-campaign.ts](replay-watch-campaign.ts) replays the campaign
headlessly with the worker's planning loop, rules 65 against current
([output](chronicle-replay.txt)): rules 65 ends on 57, rules 66 on 56, and
the first of 953 commands to differ is the 536th, the Reedbound Council's
answer to its turn-40 hearth event: the same draw lands on a template
answered *Repair the walls* under the larger catalogue where it was answered
*Open the gate* under rules 65. Every command before it is identical. The
pin now reads 56 and names this note; no assertion was weakened and no
timeout changed.
