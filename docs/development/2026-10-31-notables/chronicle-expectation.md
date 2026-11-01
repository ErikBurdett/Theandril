# The AI-watch chronicle journey's victory turn under rules 64

`tests/gameplay/chronicles.spec.ts` pins the turn on which the generated
AI-watch campaign (seed 20260905, tiny, short pace, four realms) ends: 53
under rules 62 and 63. Under rules 64 it ends on **57**.

[replay-watch-campaign.ts](replay-watch-campaign.ts) replays the campaign
headlessly with the worker's planning loop, rules 63 against current
([output](chronicle-replay.txt)): rules 63 ends on 53, rules 64 on 57, and
the first of 845 commands to differ is the 236th, on turn 22: the Reedbound
Council's army.27 moves toward hex 1114 where it moved toward 1163 before.
Every command before it is identical, among them the Council's appointment
of a surveyor on turn 17 and that surveyor's survey mission on turn 19
toward hex 1218: under rules 64 the appointment is Talen Fordkeeper, the
Council's notable figure, whose fieldcraft widens the survey's radius, so by
turn 22 the Council sees other ground and sends the army elsewhere. The pin
now reads 57 and names this note; no assertion was weakened and no timeout
changed.
