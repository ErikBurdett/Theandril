# The AI-watch chronicle journey's victory turn under rules 79

`tests/gameplay/chronicles.spec.ts` pins the turn on which the generated
AI-watch campaign (seed 20260905, tiny, short pace, four realms) ends: 57
under rules 78. Under rules 79 it still ends on **57**.

[replay-watch-campaign.ts](replay-watch-campaign.ts) replays the campaign
headlessly with the worker's planning loop, rules 78 against current
([output](chronicle-replay.txt)): the first of 953 commands to differ is the
536th, the Reedbound Council's answer to its turn-40 hearth event, whose
draw lands on *A foundling at the gate* (answered *Take the child in*) under
the larger catalogue where rules 78 drew *The long peace*; the campaigns
diverge from there (970 commands under rules 79) and both end on 57. The
pin is unchanged.
