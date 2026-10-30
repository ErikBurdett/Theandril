# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: chronicles.spec.ts >> AI watch plays a whole generated campaign, survives a save, and binds both complete chronicles at victory
- Location: tests/gameplay/chronicles.spec.ts:8:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 60
Received: 55
```

# Page snapshot

```yaml
- generic [ref=f1e3]:
  - button "Import save file"
  - generic [ref=f1e4]:
    - banner [ref=f1e5]:
      - generic [ref=f1e11]:
        - generic [ref=f1e12]: The age of fracture
        - heading "Theandril" [level=1] [ref=f1e13]
      - generic [ref=f1e14]:
        - generic [ref=f1e15]: Your realm
        - strong [ref=f1e16]: Ashen Compact
      - generic [ref=f1e17]:
        - generic [ref=f1e18]:
          - generic [ref=f1e19]: TREASURY
          - strong [ref=f1e20]: 138 coin
        - generic [ref=f1e21]:
          - generic [ref=f1e22]: KNOWLEDGE
          - strong [ref=f1e23]: "140"
        - generic [ref=f1e24]:
          - generic [ref=f1e25]: HEARTHS
          - strong [ref=f1e26]: "4"
    - navigation "Campaign navigation" [ref=f1e27]:
      - generic [ref=f1e28]:
        - text: Short pace ·
        - generic [ref=f1e29]: 4 realms
      - region "AI watch controls" [ref=f1e30]:
        - generic [ref=f1e31]: AI watch complete
        - button "Resume AI watch" [disabled] [ref=f1e32]
        - button "Step one round" [disabled] [ref=f1e33]
        - button "Reveal spectator map" [ref=f1e34] [cursor=pointer]
        - generic [ref=f1e35]: Map follows your realm’s sight. AI always uses its own faction sight. Changing fog pauses AI watch; resume when ready.
      - generic [ref=f1e36]: Recording the full campaign
      - button "Campaign chronicles" [ref=f1e37] [cursor=pointer]
    - group [ref=f1e38]:
      - generic "Campaign & settings" [ref=f1e39] [cursor=pointer]
  - region "Campaign result" [ref=f1e40]:
    - generic [ref=f1e41]: The witnesses seal the book
    - heading "Ashen Compact achieved Prosperity" [level=2] [ref=f1e42]
    - paragraph [ref=f1e43]: Turn 55 · The Hearth Exchange is complete. Campaign orders have ended.
    - button "Read campaign chronicles" [ref=f1e44] [cursor=pointer]
  - main [ref=f1e45]:
    - region "Strategic map" [ref=f1e46]:
      - generic: SEED 20260905 · 48 × 32Continents
      - generic "World map. Select an army then click a highlighted hex to move or an enemy to attack. Hover to preview routes. Drag to pan; scroll to zoom all the way to world overview. Arrow keys pan; plus and minus zoom. Focus selection returns to local detail. Enter opens map actions for the selection. Escape closes map actions before clearing selection. The army panel has keyboard and touch route controls." [ref=f1e47]
      - navigation "Map management" [ref=f1e49]:
        - button "Armies & fleets" [ref=f1e50] [cursor=pointer]
        - button "Settlements" [ref=f1e54] [cursor=pointer]
        - button "Characters & agents" [ref=f1e58] [cursor=pointer]:
          - generic [ref=f1e61]: Characters
        - button "Realm progression" [ref=f1e62] [cursor=pointer]:
          - generic [ref=f1e65]: Research
        - button "Realm affairs" [ref=f1e66] [cursor=pointer]:
          - generic [ref=f1e69]: Diplomacy
        - button "Campaign journal" [ref=f1e70] [cursor=pointer]
        - button "World overview" [ref=f1e74] [cursor=pointer]
      - generic [ref=f1e78]:
        - button "Zoom in" [ref=f1e79] [cursor=pointer]: +
        - button "Zoom out" [ref=f1e80] [cursor=pointer]: −
        - button "Focus selection" [ref=f1e81] [cursor=pointer]
        - button "Open map actions" [ref=f1e82] [cursor=pointer]
        - button "Map guide" [ref=f1e83] [cursor=pointer]: "?"
      - group:
        - generic "World map · Terrain" [ref=f1e84] [cursor=pointer]
  - contentinfo [ref=f1e85]:
    - generic [ref=f1e88]:
      - generic [ref=f1e89]: Selected army
      - strong [ref=f1e90]: Wayfinder
      - generic [ref=f1e91]: 1 / 12 formations · 10 strength · 5 movement
      - generic [ref=f1e92]:
        - button "Show selected orders" [ref=f1e93] [cursor=pointer]
        - button "Show on map" [ref=f1e94] [cursor=pointer]
    - region "Next-action navigation" [ref=f1e95]:
      - paragraph [ref=f1e96]: 10 needing orders · 0 idle settlements
      - generic [ref=f1e97]:
        - button "Previous army needing orders" [disabled] [ref=f1e98]: ‹
        - button "Next army needing orders" [disabled] [ref=f1e99]: Next army N
        - button "Previous idle settlement" [disabled] [ref=f1e100]: ‹
        - button "Next idle settlement" [disabled] [ref=f1e101]: Next town S
      - paragraph [ref=f1e102]: "Labor: 0 unassigned households · 0 settlements"
      - generic [ref=f1e103]:
        - button "Previous settlement with unassigned households" [disabled] [ref=f1e104]: ‹
        - button "Next settlement with unassigned households" [disabled] [ref=f1e105]: Review households
      - group [ref=f1e106]:
        - generic "What wants a decision 2 kinds" [ref=f1e107] [cursor=pointer]:
          - text: What wants a decision
          - generic [ref=f1e108]: 2 kinds
      - status
    - generic [ref=f1e109]:
      - generic [ref=f1e110]:
        - generic [ref=f1e111]: AGE OF FRACTURE
        - strong [ref=f1e112]: Turn 55
      - button "End turn" [disabled] [ref=f1e113]:
        - text: End turn
        - generic [ref=f1e114]: E
    - status [ref=f1e115]:
      - generic [aria-hidden] [ref=f1e116]: ◆
      - text: The campaign has ended. Its two chronicles are ready to read. Autosaved.
  - generic [ref=f1e117]:
    - button "Art Lab" [ref=f1e118] [cursor=pointer]
    - generic [ref=f1e119]: Development asset inspector
  - dialog [ref=f1e120]:
    - generic [ref=f1e121]:
      - generic [ref=f1e122]:
        - generic [ref=f1e123]: The record of a realm
        - heading "Campaign chronicles" [level=2] [ref=f1e124]
      - button "Close campaign chronicles" [active] [ref=f1e125] [cursor=pointer]: Close ×
    - paragraph [ref=f1e126]: The campaign has ended. These records reveal every faction’s recorded commands and events, including those hidden during play.
    - tablist "Chronicle format" [ref=f1e127]:
      - tab "History tome" [selected] [ref=f1e128] [cursor=pointer]
      - tab "Technical log" [ref=f1e129] [cursor=pointer]
    - tabpanel "History tome" [ref=f1e130]:
      - generic [ref=f1e131]:
        - generic [ref=f1e132]: The history tome
        - heading "The Book of Rekindled Hearths" [level=3] [ref=f1e133]
        - paragraph [ref=f1e134]: A chronicle of world 20260905
        - paragraph [ref=f1e135]: "Complete record: generated start on turn 1 through victory on turn 55."
      - generic [ref=f1e136]:
        - generic [ref=f1e137]:
          - text: Chapter
          - combobox "History chapter" [ref=f1e138]:
            - option "1. Prologue — The scattered hearths" [selected]
            - option "2. Turn 1 — New hearths"
            - option "3. Turn 2 — The annals of the realms"
            - option "4. Turn 3 — The annals of the realms"
            - option "5. Turn 4 — The annals of the realms"
            - option "6. Turn 5 — The annals of the realms"
            - option "7. Turn 6 — The annals of the realms"
            - option "8. Turn 7 — The annals of the realms"
            - option "9. Turn 8 — The annals of the realms"
            - option "10. Turn 9 — The annals of the realms"
            - option "11. Turn 10 — The annals of the realms"
            - option "12. Turn 11 — The annals of the realms"
            - option "13. Turn 12 — The annals of the realms"
            - option "14. Turn 13 — The annals of the realms"
            - option "15. Turn 14 — The annals of the realms"
            - option "16. Turn 15 — The annals of the realms"
            - option "17. Turn 16 — The annals of the realms"
            - option "18. Turn 17 — The annals of the realms"
            - option "19. Turn 18 — New hearths"
            - option "20. Turn 19 — The reckoning of arms"
            - option "21. Turn 20 — The reckoning of arms"
            - option "22. Turn 21 — The reckoning of arms"
            - option "23. Turn 22 — The reckoning of arms"
            - option "24. Turn 23 — The reckoning of arms"
            - option "25. Turn 24 — The reckoning of arms"
            - option "26. Turn 25 — The reckoning of arms"
            - option "27. Turn 26 — The reckoning of arms"
            - option "28. Turn 27 — The annals of the realms"
            - option "29. Turn 28 — The annals of the realms"
            - option "30. Turn 29 — The annals of the realms"
            - option "31. Turn 30 — The annals of the realms"
            - option "32. Turn 31 — The annals of the realms"
            - option "33. Turn 32 — New hearths"
            - option "34. Turn 33 — The annals of the realms"
            - option "35. Turn 34 — The annals of the realms"
            - option "36. Turn 35 — The annals of the realms"
            - option "37. Turn 36 — The annals of the realms"
            - option "38. Turn 37 — New hearths"
            - option "39. Turn 38 — The annals of the realms"
            - option "40. Turn 39 — New hearths"
            - option "41. Turn 40 — The broken peace"
            - option "42. Turn 41 — Hearths under new banners"
            - option "43. Turn 42 — The reckoning of arms"
            - option "44. Turn 43 — The annals of the realms"
            - option "45. Turn 44 — The annals of the realms"
            - option "46. Turn 45 — The annals of the realms"
            - option "47. Turn 46 — The reckoning of arms"
            - option "48. Turn 47 — The reckoning of arms"
            - option "49. Turn 48 — The reckoning of arms"
            - option "50. Turn 49 — The reckoning of arms"
            - option "51. Turn 50 — The reckoning of arms"
            - option "52. Turn 51 — New hearths"
            - option "53. Turn 52 — The annals of the realms"
            - option "54. Turn 53 — The annals of the realms"
            - option "55. Turn 54 — The annals of the realms"
            - option "56. Turn 55 — The closing of the book"
            - option "57. Epilogue — The seal of the witnesses"
        - generic [ref=f1e139]:
          - button "Previous chapter" [disabled] [ref=f1e140]
          - button "Next chapter" [ref=f1e141] [cursor=pointer]
      - generic "History chapter text" [ref=f1e142]:
        - article [ref=f1e143]:
          - generic [ref=f1e144]: Chapter 1 of 57 · Turns 1–1
          - heading "Prologue — The scattered hearths" [level=4] [ref=f1e145]
          - paragraph [ref=f1e146]: The Witness Roads had failed, and distant bargains no longer bound the hearthlands. In this campaign, new communities set their claims upon the land.
          - paragraph [ref=f1e147]: The record opens with Ashen Compact, Reedbound Council, Cinder March, Glass Tide. Its world bears the seed 20260905.
          - paragraph [ref=f1e148]: "Complete record: generated start on turn 1 through victory on turn 55."
      - generic [ref=f1e149]:
        - generic [ref=f1e150]: The full text contains every chapter.
        - button "Download history text" [ref=f1e151] [cursor=pointer]
```

# Test source

```ts
  1   | import { expect, test } from '@playwright/test';
  2   | import { readFile } from 'node:fs/promises';
  3   | import { serializeGame, stateHash } from '@theandril/sim';
  4   | import { exportSave } from '@theandril/persistence';
  5   | import { replayArchive, type ArchiveRecord, type ArchiveRulesVersion } from '@theandril/chronicle';
  6   | import { prosperityCampaign } from '../../packages/test-fixtures/src/victory-fixture';
  7   | 
  8   | test('AI watch plays a whole generated campaign, survives a save, and binds both complete chronicles at victory', { tag: '@scale' }, async ({ page }, testInfo) => {
  9   |   const errors: string[] = [];
  10  |   page.on('pageerror', error => errors.push(error.message));
  11  |   await page.goto('/');
  12  |   await page.getByLabel('World seed').fill('20260905');
  13  |   await page.getByLabel('World size').selectOption('tiny');
  14  |   await page.getByLabel('Campaign pace').selectOption('short');
  15  |   await page.getByLabel('Campaign mode').selectOption('watch');
  16  |   await page.getByRole('spinbutton', { name: 'City-states', exact: true }).fill('0');
  17  |   await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  18  |   await expect(page.getByTestId('watch-controls')).toContainText('AI watch paused');
  19  |   await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeDisabled();
  20  |   await expect(page.getByRole('button', { name: 'Campaign chronicles', exact: true })).toHaveCount(0);
  21  |   await page.getByRole('button', { name: 'Step one round', exact: true }).click();
  22  |   await expect(page.getByTestId('turn-counter')).toHaveText('Turn 2');
  23  |   await expect(page.getByTestId('watch-controls')).toContainText('AI watch paused');
  24  |   const earlyHash = await page.evaluate(() => window.__THEANDRIL__?.getStateHash());
  25  |   await page.getByText('Campaign & settings', { exact: true }).click();
  26  |   await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  27  |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  28  |   await page.reload();
  29  |   await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  30  |   await expect(page.getByTestId('watch-controls')).toContainText('AI watch paused');
  31  |   expect(await page.evaluate(() => window.__THEANDRIL__?.getStateHash())).toBe(earlyHash);
  32  |   const started = Date.now();
  33  |   await page.getByRole('button', { name: 'Resume AI watch', exact: true }).click();
  34  |   // Real worker rounds with a 250ms UI yield between rounds; current mixed-army AI is active.
  35  |   const dialog = page.getByRole('dialog', { name: 'Campaign chronicles', exact: true });
  36  |   await expect(dialog).toBeVisible({ timeout: 25000 });
  37  |   const watchMs = Date.now() - started;
  38  |   await expect(dialog).toContainText('Complete record: generated start on turn 1');
  39  |   await expect(page.getByTestId('victory-result')).toContainText('achieved Prosperity');
  40  |   const finalHash = await page.evaluate(() => window.__THEANDRIL__?.getStateHash());
  41  |   const victory = await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.victory);
  42  |   // Current rules-38 AI on generator 8 (the rules 30 figure was 59; the unchanged pre-change
  43  |   // code already ends on 60 under rules 37 and 38, see docs/development/2026-10-29-attunement-victory/
  44  |   // chronicle-expectation.md). Genuine historical archive seals remain separately tested.
> 45  |   expect(victory?.turn).toBe(60);
      |                         ^ Error: expect(received).toBe(expected) // Object.is equality
  46  |   await dialog.getByLabel('History chapter', { exact: true }).selectOption('1');
  47  |   await expect(page.getByTestId('history-chapter')).toContainText('was founded');
  48  |   await page.screenshot({ path: testInfo.outputPath('history-tome.png'), fullPage: true });
  49  |   const historyDownload = page.waitForEvent('download');
  50  |   await dialog.getByRole('button', { name: 'Download history text', exact: true }).click();
  51  |   const historyPath = await (await historyDownload).path();
  52  |   if (!historyPath) throw new Error('History download missing');
  53  |   const history = await readFile(historyPath, 'utf8');
  54  |   expect(history).toContain('Turn 1 — New hearths');
  55  |   expect(history).toContain(`Turn ${victory!.turn} — The closing of the book`);
  56  |   expect(history).toContain('achieved Prosperity');
  57  |   await dialog.getByRole('tab', { name: 'History tome', exact: true }).focus();
  58  |   await page.keyboard.press('ArrowRight');
  59  |   await expect(dialog.getByRole('tab', { name: 'Technical log', exact: true })).toHaveAttribute('aria-selected', 'true');
  60  |   await expect(dialog.getByLabel('Technical log preview', { exact: true })).toContainText('Order 1');
  61  |   await dialog.getByLabel('Technical turn', { exact: true }).selectOption(String(victory!.turn - 1));
  62  |   await expect(dialog.getByLabel('Technical log preview', { exact: true })).toContainText('campaign_victory');
  63  |   const technicalDownload = page.waitForEvent('download');
  64  |   await dialog.getByRole('button', { name: 'Download technical JSON', exact: true }).click();
  65  |   const technicalPath = await (await technicalDownload).path();
  66  |   if (!technicalPath) throw new Error('Technical download missing');
  67  |   const technical = JSON.parse(await readFile(technicalPath, 'utf8')) as { initialSnapshot: unknown; initialHash: string; initialSaveVersion: ArchiveRulesVersion; records: ArchiveRecord[]; finalHash: string; finalHashVersion: ArchiveRulesVersion; victory: unknown };
  68  |   expect(technical.finalHash).toBe(finalHash);
  69  |   expect(technical.victory).toEqual(victory);
  70  |   expect(technical.records[0]?.turn).toBe(1);
  71  |   expect(technical.records.filter(record => !record.ok)).toHaveLength(0);
  72  |   expect(technical.records.flatMap(record => record.events).length).toBeGreaterThan(200);
  73  |   const replayed = replayArchive({ version: 2, mode: 'watch', coverage: 'complete', initialSave: JSON.stringify(technical.initialSnapshot), initialHash: technical.initialHash, initialSaveVersion: technical.initialSaveVersion, initialTurn: 1, records: technical.records, finalHash: technical.finalHash, finalHashVersion: technical.finalHashVersion });
  74  |   expect(stateHash(replayed)).toBe(finalHash);
  75  |   await page.screenshot({ path: testInfo.outputPath('technical-ledger.png'), fullPage: true });
  76  |   await page.setViewportSize({ width: 390, height: 844 });
  77  |   await dialog.getByRole('tab', { name: 'History tome', exact: true }).click();
  78  |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  79  |   expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  80  |   await dialog.screenshot({ path: testInfo.outputPath('history-narrow.png') });
  81  |   await page.keyboard.press('Escape');
  82  |   await expect(dialog).not.toBeVisible();
  83  |   await expect(page.getByRole('button', { name: 'Step one round', exact: true })).toBeDisabled();
  84  |   await page.getByRole('button', { name: 'Campaign chronicles', exact: true }).click();
  85  |   await expect(dialog).toBeVisible();
  86  |   await page.keyboard.press('Escape');
  87  |   await expect(page.getByRole('button', { name: 'Campaign chronicles', exact: true })).toBeFocused();
  88  |   await testInfo.attach('watch-performance.json', { body: JSON.stringify({ generatedStartToVictoryAfterReloadMs: watchMs, turn: victory?.turn, orders: technical.records.length, finalHash }, null, 2), contentType: 'application/json' });
  89  |   expect(errors).toEqual([]);
  90  | });
  91  | 
  92  | test('a human researches, adopts distinct policies, starts a public project and reads an honestly partial imported history', async ({ page }, testInfo) => {
  93  |   const prepared = prosperityCampaign();
  94  |   await page.goto('/');
  95  |   await page.locator('input[type=file]').setInputFiles({ name: 'prepared-hearths.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(prepared))) });
  96  |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  97  |   await page.getByRole('button', { name: 'Realm progression', exact: true }).click();
  98  |   const progression = page.getByRole('dialog', { name: 'Realm progression', exact: true });
  99  |   await progression.getByRole('button', { name: 'Research Civic accounts', exact: true }).click();
  100 |   await expect(progression.getByRole('button', { name: 'Research Civic accounts', exact: true })).toBeDisabled();
  101 |   await progression.getByRole('tab', { name: 'Institutions', exact: true }).click();
  102 |   await progression.getByRole('button', { name: 'Adopt Common stewardship', exact: true }).click();
  103 |   await expect(progression.getByRole('button', { name: 'Adopt Charter compact', exact: true })).toBeDisabled();
  104 |   await progression.getByRole('tab', { name: 'Military doctrine', exact: true }).click();
  105 |   await progression.getByRole('button', { name: 'Adopt March columns', exact: true }).click();
  106 |   await expect(progression.getByRole('button', { name: 'Adopt Shield cohesion', exact: true })).toBeDisabled();
  107 |   await progression.getByRole('tab', { name: 'Victory', exact: true }).click();
  108 |   await expect(progression.getByTestId('unification-status')).toContainText('Hold at least 8 hearths (you hold 3).');
  109 |   await progression.getByLabel('Project settlement').selectOption('settlement.5');
  110 |   await progression.getByRole('button', { name: 'Start Hearth Exchange', exact: true }).click();
  111 |   await expect(progression.getByTestId('public-projects')).toContainText('active · 0/5');
  112 |   await progression.screenshot({ path: testInfo.outputPath('prosperity-project.png') });
  113 |   await page.keyboard.press('Escape');
  114 |   for (let offset = 1; offset <= 5; offset++) {
  115 |     await page.getByRole('button', { name: 'End turn', exact: true }).click();
  116 |     await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${prepared.turn + offset}`);
  117 |   }
  118 |   const chronicles = page.getByRole('dialog', { name: 'Campaign chronicles', exact: true });
  119 |   await expect(chronicles).toBeVisible();
  120 |   await expect(chronicles).toContainText(`Partial record: this campaign was imported on turn ${prepared.turn}`);
  121 |   await expect(page.getByTestId('victory-result')).toContainText('Ashen Compact achieved Prosperity');
  122 |   expect(await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.progression)).toMatchObject({ technologies: ['technology.civic_accounts'], institutionId: 'institution.common_stewardship', doctrineId: 'doctrine.march_columns' });
  123 | });
  124 | 
```