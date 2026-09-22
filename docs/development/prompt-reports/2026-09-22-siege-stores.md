# Sieges eat stored food — 2026-09-22

## Prompt

“continue”. This is the second slice after Unification: the stored-food siege endurance mechanic from the design audit.

## Delivered

- Rules/save 20. Siege supplies are the turns of stored food a blockaded town has left; an empty store starves its militia's morale each turn.
- The siege panel shows food stores in turns. Historical rules keep the fixed three-turn count.

## Verified locally

- Typecheck, lint and build pass.
- `pnpm test`: 1,797/1,797.
- Calibration stays within the pace targets.
- A genuine rules-19 save and archive load, re-seal, replay and continue.

## Not done

- The AI does not yet weigh a target's food stores when choosing to assault or wait.
