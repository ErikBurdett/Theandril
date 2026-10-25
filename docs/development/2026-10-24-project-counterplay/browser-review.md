# Production worker and native image review

The first production invocation of `tests/production/project-counterplay.spec.ts` passes **four journeys in 12.7 seconds**. [browser-first.log](browser-first.log) retains player incoming 3.5s, player no-offer 2.8s, Watch incoming 2.7s and Watch no-initial-offer 2.8s. No browser assertions or fixture inputs were changed after this run. Parent supplied the frozen candidate build; no runtime edits or builds were performed by this reviewer.

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium ./node_modules/.bin/playwright test --config playwright.pages.config.ts tests/production/project-counterplay.spec.ts --output docs/development/2026-10-24-project-counterplay/browser-results
```

This is authored Short-pace acceptance from the strictly loaded turn-27 `near-complete.theandril`, canonical hash `c705fc04`, raw SHA-256 `f77d05d363e8065bbcc263632100797afd8ee1502b47df2bf9f5149413ed1a4a`. Infrastructure, initial budgets and guard placement were authored; project purchases/progress and war duration use the retained ordinary commands. It is not an organic campaign or a headline pacing attribution. Each imported archive declares `from-save` coverage rather than claiming the missing earlier campaign history.

## Actual command order

I read every retained branch's command JSON. [browser-evidence.json](browser-evidence.json) records the source hashes, branch identities, command sequences and artifact hashes. All recorded commands in all four branches are accepted. Each reaches turn 28 with the Ashen project paused at 4/5, war continuing, no binding treaty and no victory. The accepted siege precedes the first `endTurn` record; no synthetic second planning call is used by these browser tests.

| Actual branch | Recorded sequence | Records | Final hash |
| --- | --- | ---: | --- |
| Player sends the real zero-coin offer, then End turn | propose 1 → reject 2 → siege 3 → end turn 4 | 4 | `0446e522` |
| Player End turn with no offer | siege 1 → end turn 2 | 2 | `e9ea15d5` |
| Watch imports a recorded zero-coin offer, then Step one round | setup propose 1 → ordinary Ashen AI work 2–12 → reject 13 → siege 14 → end turn 15 | 15 | `9b036fae` |
| Watch imports no offer, then Step one round | Ashen AI proposes 40 coin at 1 → Reedbound rejects 2 → siege 3 → end turn 4 | 4 | `0446e522` |

The final Watch branch genuinely creates an offer during the round. It therefore proves the complete worker branch, not an isolated outgoing decision by Reedbound. The player no-offer branch isolates that outgoing choice. Watch's explicit incoming case records the ordinary setup offer in its imported archive because Watch does not expose player diplomacy orders. The player incoming case uses the public peace form, its existing preview and Send peace offer button.

Every branch exports through the public menu and exactly replays its canonical archive. Manual save/reload then preserves the entire archive and state hash, and each final portable save is retained beside the JSON. All four explicitly verify that development hooks are absent. The public status comes from the real project read model; no browser mutation supplies the victory, project or siege state.

## Final native pixels

I opened all six distinct native images: desktop and narrow for player incoming, Watch incoming and Watch no-initial-offer. The player no-offer PNG pair is byte-identical to the inspected player incoming pair. All eight retained files and hashes appear in [browser-evidence.json](browser-evidence.json).

- [Player desktop](browser-results/production-project-counter-8ab02-ance-with-an-incoming-offer/project-paused-desktop.png) and [390×844 at 130% text](browser-results/production-project-counter-8ab02-ance-with-an-incoming-offer/project-paused-narrow.png): the Ashen observer's public project reads “Paused · 4/5 Active Turns” and explains that its host is under siege. The desktop also names Reedbound as the besieger and shows turn 28. Hashes: `708a0431cfb186befed590eed05a36f54cb540a213299e95e8b579241c11342c` and `0fac8fad76d738b914e03418b3a1c0cb3b52e380abdc357eacbbcf9a63510a38`.
- [Watch incoming desktop](browser-results/production-project-counter-cd961-ance-with-an-incoming-offer/project-paused-desktop.png) and [narrow](browser-results/production-project-counter-cd961-ance-with-an-incoming-offer/project-paused-narrow.png): the same paused project remains legible, while player diplomacy and End turn controls are visibly unavailable under Watch. Its additional real Ashen work changes treasury, knowledge and defending strength; these are not forced to match the player branch. Hashes: `36f967017f21e3020c729a3a4db111e1c22f05cab5e0bdd15a4d252b947ed291` and `58aeac8c56866bab412866111a07260f639e6bf8238a8938d9bceb2e6691fc90`.
- [Watch no-initial-offer desktop](browser-results/production-project-counter-54c61-vance-with-no-initial-offer/project-paused-desktop.png) and [narrow](browser-results/production-project-counter-54c61-vance-with-no-initial-offer/project-paused-narrow.png): project state and siege explanation are readable in both layouts. Hashes: `72de12f60cadbc8c07e1c2cc564a48127294dc47e27ebf8cdda29d043915e060` and `743286812f57014674385694defb142441ec4b462e7214e40cd5daec3049a23d`.

These are scrolled Realm affairs viewports, not full-page images or independent proof of a command sequence. The desktop is 1440×1000; narrow captures are 390×844 with the public 130% text setting. Project text, progress, canonical reason and Locate project control fit without horizontal overflow. No crop, resize or re-encoding was used for review.

## Scope and unresolved boundary

No blocker was found for the tested **first-round immediate interruption**. This run deliberately does not claim a sustained siege policy, subsequent-turn treaty valuation, whole-campaign counterplay, overall pacing acceptance or publication. Parent/AI review of an already paused project and existing siege is separate and remains unresolved at this review checkpoint. A successful initial interruption must not be reported as proof that an AI will preserve it indefinitely.

Browser source SHA-256 is `99127c957444aeacd7f26e03aa7e46e820aef3c2fa5c041ba67e89103e70d87b`; the reviewed counterplay module is `a86f74abc3417ee9f4e483b65b24a68cf04856b783902d17a6c9a797cc4aecac`. The complete recorded source list is in the evidence JSON. Final source pin, independent implementation review, full-suite/benchmark/pacing interpretation and publication remain parent-owned.
