# Unification victory — 2026-09-22

## Prompt

“continue” — keep developing toward 1.0 after the Civilization-scale release.

## Delivered

- A second victory path. Hold more than half of the world's hearths (at least 6) and your capital through the pace's response window to win Unification. The bid is public and ends if the capital falls or the majority is lost.
- The Victory tab shows Unification progress and blockers. The chronicle and victory banner name the path.
- Rules/save 19. Rules 18 saves and archives from the deployed build load, re-seal identically, replay and continue.

## Verified locally

- Typecheck, lint, content validation (`3127e431`) and build pass.
- `pnpm test`: 1,796/1,796.
- 23/23 browser journeys touching progression and victory pass.
- A genuine rules-18 save and archive from `4483219` load, re-seal identically, replay and continue for 20 rounds.

## Not done

- Client states and diplomatic obligations (the rest of M1).
- The AI does not yet deliberately pursue Unification; it contests rival bids through its existing targeting of victory hosts.
