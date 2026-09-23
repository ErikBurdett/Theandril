# Grouping the end-of-turn list by cause — 2026-09-22

## Prompt

“continue”, taking the last piece M3 names for attention: *group alerts by actionable cause and let players inspect exceptions instead of cycling every settlement.*

## What was missing

Rules 25 and 26 made hearths and armies answer for themselves, which cut the list down. What was left was still shapeless. The HUD reported two totals — *“100 needing orders · 40 idle settlements”* — and offered one way through them: press Next repeatedly and read each entity's reason as it arrived. On a wide realm the totals said how much work there was and nothing about what kind, and the only way to find the three interrupted routes hidden among a hundred idle companies was to walk all hundred.

## Delivered — no rules change

- **Every candidate carries its cause.** `movement`, `route-interrupted`, `posting-stalled`, `empty-queue`, `charter-stalled` and `households` — derived from the same observation the reason already came from, so nothing new is computed or stored.
- **A grouped summary names the shape of the work.** *“What wants a decision”* lists one row per cause, largest first: *100 companies with movement remaining*, *40 hearths with an empty production queue*, *3 companies with an interrupted route*.
- **Each row is its own queue.** Clicking a row jumps to the first entity of that cause, and the existing Next/Previous navigation cycles within it. Finding the interrupted routes is now one click rather than a hundred.
- **Nothing else moved.** The totals, the keyboard shortcuts, the wrap-around order and the spoken notice are unchanged; the grouped panel sits beside them and stays collapsed until opened.

This is a UI change over the existing read model. No command, no state, no rules or save version, and the content seal is untouched.

## Verified locally

- Typecheck, lint and build pass.
- `pnpm test`: 1,819/1,819.
- The hundred-army forty-town journey opens the panel, reads three causes, clicks the hearth row and lands on the first idle hearth with its own reason spoken.

## Not done

- Rows group by cause, not by region or distance; there is still no way to act on a whole group at once.
- The panel lives in the command bar, so it lists causes rather than a scrollable roster of the entities behind each one.
