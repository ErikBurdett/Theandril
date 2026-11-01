# The AI-watch chronicle journey's victory turn under rules 57

`tests/gameplay/chronicles.spec.ts` pins the turn on which the generated
AI-watch campaign (seed 20260905, tiny, short pace, four realms) ends: 56
under rules 54 through 56. Under rules 57 it ends on **54**.

[replay-watch-campaign.ts](replay-watch-campaign.ts) replays the campaign
headlessly with the worker's planning loop, rules 56 against current
([output](chronicle-replay.txt)): rules 56 ends on 56, rules 57 on 54, and
the first of 920 commands to differ is on turn 23, when the Ashen Compact's
second hearth sets its worked land: hex 486 instead of 487, because the
second landmark catalogue re-placed the landmarks of this tiny map and the
yield of the ground beside the hearth changed with them. Every command
before it is identical. The pin now reads 54 and names this note; no
assertion was weakened and no timeout changed.
