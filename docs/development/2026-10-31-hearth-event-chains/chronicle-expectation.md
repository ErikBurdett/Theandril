# The AI-watch chronicle journey's victory turn under rules 48

`tests/gameplay/chronicles.spec.ts` pins the turn on which the generated
AI-watch campaign (seed 20260905, tiny, short pace, four realms) ends: 55
under rules 46, 56 under rules 47. Under rules 48 it ends on **55** again.

[replay-watch-campaign.ts](replay-watch-campaign.ts) replays the campaign
headlessly with the worker's planning loop, rules 47 against current
([output](chronicle-replay.txt); the script's labels print the rules 47
block under the heading `48:`): rules 47 ends on 56, rules 48 on 55, and the
first of 887 commands to differ is again the Reedbound Council's answer to its
turn-40 hearth event, because the third catalogue changes which template the
same draw lands on. Every command before it is identical. The pin now reads 55
and names this note; no assertion was weakened and no timeout changed.
