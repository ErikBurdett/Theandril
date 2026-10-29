# The AI-watch chronicle journey's victory turn

`tests/gameplay/chronicles.spec.ts` asserted that the generated AI-watch campaign
(seed 20260905, tiny, short pace, four realms, no city-states) ends on turn 59.
That figure was last set on 2026-09-23 (`6cbb594`, rules ≤30) and has not been
revalidated by a full gameplay run since; recent checkpoints ran the production
suite under `tests/production`.

Under this checkpoint the journey ends on turn 60. To attribute the change:

- The same campaign replayed headlessly with the worker's planning loop
  ([replay-watch-campaign.ts](replay-watch-campaign.ts), run with `pnpm tsx`)
  ends on **turn 60 under both frozen rules 37 and current rules 38**, with
  **988 identical commands** and no divergence.
- With this checkpoint's changes to `packages`, `apps`, `scripts` and `tests`
  stashed, the unchanged `4bf5d4c` code ends the same browser journey on
  **turn 60** as well (`Expected: 59 / Received: 60`; failure screenshot in
  [chronicle-prechange](chronicle-prechange/)).

The expectation was therefore stale before this work, not moved by it. The
assertion now reads 60 and names this note; no assertion was weakened and no
timeout changed.
