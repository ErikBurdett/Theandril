# The AI-watch chronicle journey's victory turn under rules 47

`tests/gameplay/chronicles.spec.ts` pins the turn on which the generated
AI-watch campaign (seed 20260905, tiny, short pace, four realms) ends. It
read 55 since the glass-survey AI of 2026-10-30 and held at 55 under rules 46
(the first eight hearth events). Under rules 47 it ends on **56**.

[replay-watch-campaign.ts](replay-watch-campaign.ts) (the 2026-10-29 script,
rules 46 against current) replays the campaign headlessly with the worker's
planning loop ([output](chronicle-replay.txt)): rules 46 ends on 55, rules 47
on 56, and the first of 851 commands to differ is the Reedbound Council's
answer to its turn-40 hearth event — a kiln fire under rules 46 (*let it burn
out*), a drowned ledger under rules 47 (*dry the ledger*), because the second
catalogue changes which template the same draw lands on. Every command before
it is identical. The pin now reads 56 and names this note; no assertion was
weakened and no timeout changed.
