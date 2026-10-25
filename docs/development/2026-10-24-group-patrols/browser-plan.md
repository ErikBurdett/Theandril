# Group patrol production journey

Prepared fixture and collected one production journey; browser execution awaits the parent's production build/window. No browser pass claimed here.

- Source: [fixture](../../../tests/gameplay/group-patrol-fixture.ts), [journey](../../../tests/production/group-patrols.spec.ts).
- Setup uses the previously reviewed authored open-terrain `theaterCampaign(101)` infrastructure, including two hearths, treasury and named companies. This is authored scale infrastructure, not earned recruitment/conquest. The foreign obstruction guard is authored before the initial archive; its blocking move is an ordinary command.
- All 105 setup records are ordinary canonical orders: the registry fixture's eight commands followed by 97 `setPatrol` commands. Initial hash `c6f43460`; 101 owned companies, 99 policies, 49 enabled and 50 disabled, one enabled `pauseOnWar` policy, two companies with postings and no patrol. Strict save and exact replay assertions passed in [fixture log](browser-fixture.log).
- One route is genuinely paused after the foreign guard moves across its next step. Another remains active with movement genuinely exhausted by `queueMovement`. No route status, blocker or movement value is fabricated.
- Planned actions accept 49 Pause, 99 Resume and 99 Remove commands. Skip counts are 52/2/2. Selection deliberately includes companies outside the current filter, including a zero-row paused filter before Remove. All accepted actors leave selection; unaffected actors remain. Result pages are exercised at 25 rows.
- Public import/export, menu save/load, native keyboard controls, 390px at 130% text, and actual pending DOM lock observation. No worker interception, development hooks or manufactured canonical refusals.
- Every batch export must exactly match the corresponding independent ordinary command journal, preserve all army/route/posting values, and replay exactly. Final expected archive: 352 records. Existing `pauseOnWar` survives Pause/Resume and is removed only by Remove.
- Native viewport and action-selector captures will be retained. Pixel review and byte dimensions remain pending execution; captures are not resized or transformed.

Collection and scoped lint passed: [collection](browser-collection.log), [lint](browser-source-lint.log). Planned parent-coordinated command:

```sh
./node_modules/.bin/playwright test --config playwright.pages.config.ts tests/production/group-patrols.spec.ts --output docs/development/2026-10-24-group-patrols/browser-results
```

Retain the first run's complete output as `browser-first.log`, even if it fails. The production build must include the reviewed group-patrol protocol/UI source; this fixture and journey do not authorize a build or claim deployment.
