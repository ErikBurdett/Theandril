# The AI-watch chronicle journey's victory turn under rules 53

`tests/gameplay/chronicles.spec.ts` pins the turn on which the generated
AI-watch campaign (seed 20260905, tiny, short pace, four realms) ends: 55
under rules 48 through 52. Under rules 53 it ends on **53**.

[replay-watch-campaign.ts](replay-watch-campaign.ts) replays the campaign
headlessly with the worker's planning loop, rules 52 against current
([output](chronicle-replay.txt)): rules 52 ends on 55, rules 53 on 53, and
the first of 850 commands to differ is on turn 12, the turn the Age of Roads
begins and the Toll Wars come with it: the Ashen Compact and the Reedbound
Council each shelter their hearth for 10 coin, which rules 52 could not
offer, and the Ashen Compact's common store is developed a turn later. Every
command before it is identical. The pin now reads 53 and names this note; no
assertion was weakened and no timeout changed.
