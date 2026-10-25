# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: production/group-intent.spec.ts >> production stale group charter keeps the selection and allows a reviewed retry
- Location: tests/production/group-intent.spec.ts:11:3

# Error details

```
Test timeout of 45000ms exceeded.
```

```
Error: locator.selectOption: Test timeout of 45000ms exceeded.
Call log:
  - waiting for getByTestId('group-charters').getByLabel('Charter focus', { exact: true })

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - button "Import save file"
  - generic [ref=e4]:
    - banner [ref=e5]:
      - generic [ref=e11]:
        - generic [ref=e12]: The age of fracture
        - heading "Theandril" [level=1] [ref=e13]
      - generic [ref=e14]:
        - generic [ref=e15]: Your realm
        - strong [ref=e16]: Ashen Compact
      - generic [ref=e17]:
        - generic [ref=e18]:
          - generic [ref=e19]: TREASURY
          - strong [ref=e20]: 99989 coin
        - generic [ref=e21]:
          - generic [ref=e22]: KNOWLEDGE
          - strong [ref=e23]: "0"
        - generic [ref=e24]:
          - generic [ref=e25]: HEARTHS
          - strong [ref=e26]: "2"
    - navigation "Campaign navigation" [ref=e27]:
      - generic [ref=e28]:
        - text: Standard pace ·
        - generic [ref=e29]: 2 realms
      - generic [ref=e30]: Partial archive · earlier history unavailable
    - group [ref=e31]:
      - generic "Campaign & settings" [ref=e32] [cursor=pointer]
  - main [ref=e33]:
    - region "Strategic map" [ref=e34]:
      - generic: SEED 20260927 · 48 × 32Legacy geography
      - generic "World map. Select an army then click a highlighted hex to move or an enemy to attack. Hover to preview routes. Drag to pan; scroll to zoom all the way to world overview. Arrow keys pan; plus and minus zoom. Focus selection returns to local detail. Enter opens map actions for the selection. Escape closes map actions before clearing selection. The army panel has keyboard and touch route controls." [ref=e35]
      - navigation "Map management" [ref=e37]:
        - button "Armies & fleets" [ref=e38] [cursor=pointer]
        - button "Settlements" [ref=e42] [cursor=pointer]
        - button "Characters & agents" [ref=e46] [cursor=pointer]:
          - generic [ref=e49]: Characters
        - button "Realm progression" [ref=e50] [cursor=pointer]:
          - generic [ref=e53]: Research
        - button "Realm affairs" [ref=e54] [cursor=pointer]:
          - generic [ref=e57]: Diplomacy
        - button "Campaign journal" [ref=e58] [cursor=pointer]
        - button "World overview" [ref=e62] [cursor=pointer]
      - generic [ref=e66]:
        - button "Zoom in" [ref=e67] [cursor=pointer]: +
        - button "Zoom out" [ref=e68] [cursor=pointer]: −
        - button "Focus selection" [ref=e69] [cursor=pointer]
        - button "Open map actions" [ref=e70] [cursor=pointer]
        - button "Map guide" [ref=e71] [cursor=pointer]: "?"
      - group:
        - generic "World map · Terrain" [ref=e72] [cursor=pointer]
  - dialog [ref=e73]:
    - banner [ref=e74]:
      - generic [ref=e75]:
        - generic [ref=e76]: The realm's ledgers
        - heading "Realm registry" [level=2] [ref=e77]
        - paragraph [ref=e78]: Ashen Compact
      - button "Close Realm registry" [ref=e79] [cursor=pointer]: ×
    - generic [ref=e81]:
      - generic [ref=e82]:
        - img "Ashen Compact crest · approved faction artwork" [ref=e83]
        - generic [ref=e84]:
          - generic [ref=e85]: Your people
          - heading "Ashen Compact" [level=3] [ref=e86]
      - generic [ref=e88]:
        - tablist "Realm registry" [ref=e89]:
          - tab "Armies 2" [ref=e90] [cursor=pointer]
          - tab "Settlements 2" [selected] [ref=e91] [cursor=pointer]
        - button "Characters & agents" [ref=e92] [cursor=pointer]: Characters 0
      - generic [ref=e93]:
        - text: Search your realm
        - searchbox "Search your realm" [ref=e94]
      - tabpanel "Settlements 2" [ref=e95]:
        - generic [ref=e96]:
          - generic [ref=e98]:
            - text: Settlement orders
            - combobox "Settlement orders" [ref=e99]:
              - option "All hearths (2)" [selected]
              - option "No production (2)"
              - option "Without charters (2)"
              - option "Charters waiting (0)"
          - group [ref=e100]:
            - generic "How these filters work" [ref=e101] [cursor=pointer]
          - generic [ref=e102]:
            - generic [ref=e103]:
              - text: Registry order
              - combobox "Registry order" [ref=e104]:
                - option "Stable order" [selected]
                - option "Name A–Z"
            - generic [ref=e105]: 2 towns
          - group [ref=e106]:
            - generic "Saved hearth groups" [ref=e107] [cursor=pointer]
            - option "Choose a saved hearth group" [selected]
          - region "Group hearth charters" [ref=e108]:
            - generic [ref=e109]:
              - button "Select matching hearths" [disabled] [ref=e110]
              - button "Clear hearth selection" [ref=e111] [cursor=pointer]
            - status [ref=e112]: 2 hearths selected
            - paragraph [ref=e113]: Check hearths to give them standing charters together. Select up to 128 at a time; page, search and registry changes keep your selection.
            - generic [ref=e114]:
              - generic [ref=e115]:
                - text: Charter focus
                - combobox "Charter focus" [ref=e116]:
                  - option "Works" [selected]
                  - option "Wealth"
                  - option "Learning"
                  - option "Muster"
              - generic [ref=e117]:
                - text: Coin ceiling per hearth
                - spinbutton "Coin ceiling per hearth" [ref=e118]: "24"
            - paragraph [ref=e119]: Applying charters spends no coin now. Each hearth may spend up to its ceiling on one work whenever its queue is empty, once per turn after upkeep. All charters share your treasury and leave 40 coin in reserve.
            - paragraph [ref=e120]: Works, Wealth and Learning prioritize buildings; Muster raises land companies that add upkeep. Existing production orders stay in place. Revoking a charter stops future orders and keeps its current queue.
            - group [ref=e121]:
              - generic "Charter templates" [ref=e122] [cursor=pointer]
            - generic [ref=e123]:
              - button "Apply charters (2)" [ref=e124] [cursor=pointer]
              - button "Revoke charters (0)" [disabled] [ref=e125]
            - paragraph [ref=e126]: Revocation leaves the 2 selected hearths without charters unchanged.
          - group [ref=e127]:
            - generic "Production sequences" [ref=e128] [cursor=pointer]
            - option "Root cellar · 8 coin" [selected]
            - option "Cinder workshop · 12 coin"
            - option "Charter market · 10 coin"
            - option "Witness archive · 12 coin"
            - option "Charter harbor · 20 coin"
            - option "Hearth caravan · 16 coin"
            - option "Wayfinder · 8 coin"
            - option "Oath guard · 12 coin"
            - option "Ash pike company · 10 coin"
            - option "Cinder plate cohort · 22 coin"
            - option "Charter outriders · 18 coin"
            - option "Charter transport · 24 coin"
            - option "Coastwatch galley · 30 coin"
            - option "Deepwake warship · 48 coin"
            - option "Reed skirmishers · 14 coin"
            - option "Witness arbalesters · 22 coin"
            - option "Kiln halberdiers · 28 coin"
            - option "Road lancers · 32 coin"
          - generic [ref=e129]:
            - generic [ref=e130]:
              - checkbox "Select West watch for group orders" [checked] [ref=e132]
              - button "West watch 1 people · No production Direct orders · No charter." [ref=e133] [cursor=pointer]:
                - generic [aria-hidden] [ref=e134]: ⌂
                - generic [ref=e135]:
                  - strong [ref=e136]: West watch
                  - generic [ref=e137]: 1 people · No production
                  - generic [ref=e138]: Direct orders · No charter.
                - generic [aria-hidden] [ref=e139]: ›
            - generic [ref=e140]:
              - checkbox "Select East watch for group orders" [checked] [ref=e142]
              - button "East watch 1 people · No production Direct orders · No charter." [ref=e143] [cursor=pointer]:
                - generic [aria-hidden] [ref=e144]: ⌂
                - generic [ref=e145]:
                  - strong [ref=e146]: East watch
                  - generic [ref=e147]: 1 people · No production
                  - generic [ref=e148]: Direct orders · No charter.
                - generic [aria-hidden] [ref=e149]: ›
      - paragraph [ref=e150]: Choose an entry to locate it on the map. Use the bottom command tray for its orders.
  - contentinfo [ref=e151]:
    - generic [ref=e154]:
      - generic [ref=e155]: Selected army
      - strong [ref=e156]: Watch company 2
      - generic [ref=e157]: 1 / 12 formations · 60 strength · 3 movement
      - generic [ref=e158]:
        - button "Show selected orders" [ref=e159] [cursor=pointer]
        - button "Show on map" [ref=e160] [cursor=pointer]
    - region "Next-action navigation" [ref=e161]:
      - paragraph [ref=e162]: 2 needing orders · 2 idle settlements
      - generic [ref=e163]:
        - button "Previous army needing orders" [ref=e164] [cursor=pointer]: ‹
        - button "Next army needing orders" [ref=e165] [cursor=pointer]: Next army N
        - button "Previous idle settlement" [ref=e166] [cursor=pointer]: ‹
        - button "Next idle settlement" [ref=e167] [cursor=pointer]: Next town S
      - paragraph [ref=e168]: "Labor: 2 unassigned households · 2 settlements"
      - generic [ref=e169]:
        - button "Previous settlement with unassigned households" [ref=e170] [cursor=pointer]: ‹
        - button "Next settlement with unassigned households" [ref=e171] [cursor=pointer]: Review households
      - group [ref=e172]:
        - generic "What wants a decision 3 kinds" [ref=e173] [cursor=pointer]:
          - text: What wants a decision
          - generic [ref=e174]: 3 kinds
      - status
    - generic [ref=e175]:
      - generic [ref=e176]:
        - generic [ref=e177]: AGE OF FRACTURE
        - strong [ref=e178]: Turn 1
      - button "End turn" [ref=e179] [cursor=pointer]:
        - text: End turn
        - generic [ref=e180]: E
    - status [ref=e181]:
      - generic [aria-hidden] [ref=e182]: ◆
      - text: "Imported campaign. Partial archive: earlier campaign history was not recorded in this save."
```

# Test source

```ts
  1  | import { mkdirSync, writeFileSync } from 'node:fs';
  2  | import { expect, test } from '@playwright/test';
  3  | import { createJournal, replayArchive } from '@theandril/chronicle';
  4  | import { exportSave, serializeCampaign } from '@theandril/persistence';
  5  | import { serializeGame, stateHash } from '@theandril/sim';
  6  | import { theaterCampaign } from '../../packages/test-fixtures/src/theater-fixture';
  7  | import { exportedTravel } from '../gameplay/group-movement-fixture';
  8  | import { openRegistry } from '../gameplay/ui-navigation';
  9  | 
  10 | for (const kind of ['posting', 'charter'] as const) {
  11 |   test(`production stale group ${kind} keeps the selection and allows a reviewed retry`, async ({ page }, testInfo) => {
  12 |     mkdirSync(testInfo.outputDir, { recursive: true });
  13 |     const game = theaterCampaign(2), initial = serializeGame(game);
  14 |     const archive = createJournal(game, { mode: 'player', coverage: 'from-save' }).materialize();
  15 |     // Controlled transport fault: replace only the first outgoing intent hash.
  16 |     // The actual production worker performs validation and all game mutations.
  17 |     await page.addInitScript(({ type, initialHash }) => {
  18 |       const NativeWorker = window.Worker;
  19 |       let altered = false;
  20 |       window.Worker = class extends NativeWorker {
  21 |         override postMessage(message: unknown, options?: StructuredSerializeOptions | Transferable[]) {
  22 |           const request = message as Record<string, unknown>;
  23 |           if (!altered && request.type === type) {
  24 |             altered = true;
  25 |             (window as unknown as { __INTENT_HASH__: unknown }).__INTENT_HASH__ = request.expectedHash;
  26 |             super.postMessage({ ...request, expectedHash: initialHash === 'ffffffff' ? '00000000' : 'ffffffff' }, Array.isArray(options) ? { transfer: options } : options);
  27 |           } else super.postMessage(message, Array.isArray(options) ? { transfer: options } : options);
  28 |         }
  29 |       };
  30 |     }, { type: kind === 'posting' ? 'groupPosting' : 'groupCharter', initialHash: stateHash(game) });
  31 |     const errors: string[] = [];
  32 |     page.on('pageerror', error => errors.push(error.message));
  33 |     await page.goto('./');
  34 |     expect(await page.evaluate(() => '__THEANDRIL__' in window)).toBe(false);
  35 |     await page.getByLabel('Import save file').setInputFiles({ name: 'intent.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeCampaign(game, archive))) });
  36 |     await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  37 |     await openRegistry(page, kind === 'posting' ? 'armies' : 'settlements');
  38 |     const panel = page.getByTestId(kind === 'posting' ? 'group-postings' : 'group-charters');
  39 |     await panel.getByRole('button', { name: kind === 'posting' ? 'Select matching armies' : 'Select matching hearths', exact: true }).click();
> 40 |     if (kind === 'charter') {
     |                                                                ^ Error: locator.selectOption: Test timeout of 45000ms exceeded.
  41 |       await panel.getByLabel('Charter focus', { exact: true }).selectOption('wealth');
  42 |       await panel.getByLabel('Coin ceiling per hearth', { exact: true }).fill('24');
  43 |     }
  44 |     const submit = panel.getByRole('button', { name: kind === 'posting' ? 'Post selected armies (2)' : 'Apply charters (2)', exact: true });
  45 |     await submit.click();
  46 |     expect(await page.evaluate(() => (window as unknown as { __INTENT_HASH__: unknown }).__INTENT_HASH__)).toBe(stateHash(game));
  47 |     await expect(panel.getByRole('alert')).toContainText(/campaign changed/i);
  48 |     await expect(panel).toContainText(kind === 'posting' ? '2 armies selected' : '2 hearths selected');
  49 |     await expect(submit).toBeEnabled();
  50 |     await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  51 |     if (kind === 'charter') await expect(panel.getByLabel('Charter focus', { exact: true })).toHaveValue('wealth');
  52 |     await page.screenshot({ path: testInfo.outputPath(`${kind}-stale.png`) });
  53 |     const rejected = await exportedTravel(page);
  54 |     expect(serializeGame(rejected.game)).toBe(initial);
  55 |     expect(rejected.archive).toEqual(archive);
  56 |     await openRegistry(page, kind === 'posting' ? 'armies' : 'settlements');
  57 |     // Export closes the registry, so explicitly reselect after reopening.
  58 |     await panel.getByRole('button', { name: kind === 'posting' ? 'Select matching armies' : 'Select matching hearths', exact: true }).click();
  59 |     if (kind === 'charter') await panel.getByLabel('Charter focus', { exact: true }).selectOption('wealth');
  60 |     await submit.click();
  61 |     await expect(page.getByTestId(kind === 'posting' ? 'group-posting-results' : 'group-charter-results')).toContainText('2 orders accepted · 0 refused');
  62 |     const retried = await exportedTravel(page);
  63 |     expect(retried.archive.records).toHaveLength(2);
  64 |     expect(serializeGame(replayArchive(retried.archive))).toBe(serializeGame(retried.game));
  65 |     expect(retried.game.armies).toEqual(game.armies);
  66 |     expect(retried.game.routes).toEqual(game.routes);
  67 |     writeFileSync(testInfo.outputPath(`${kind}-intent.json`), JSON.stringify({ initialHash: stateHash(game), rejectedHash: stateHash(rejected.game), rejectedRecords: rejected.archive.records.length, retryHash: stateHash(retried.game), retryRecords: retried.archive.records.length }, null, 2) + '\n');
  68 |     expect(errors).toEqual([]);
  69 |   });
  70 | }
  71 | 
```