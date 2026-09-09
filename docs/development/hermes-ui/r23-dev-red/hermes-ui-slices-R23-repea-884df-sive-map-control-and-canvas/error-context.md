# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: hermes-ui-slices.spec.ts >> R23 repeated public loads and cross-size imports retain one responsive map control and canvas
- Location: tests/gameplay/hermes-ui-slices.spec.ts:22:1

# Error details

```
Error: expect(locator).toBeEnabled() failed

Locator: getByRole('button', { name: 'Save campaign', exact: true })
Expected: enabled
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeEnabled" getByRole('button', { name: 'Save campaign', exact: true }) with timeout 5000ms
  - waiting for getByRole('button', { name: 'Save campaign', exact: true })

```

```yaml
- button "Import save file"
- banner:
  - text: The age of fracture
  - heading "Theandril" [level=1]
  - text: Your realm
  - strong: Ashen Compact
  - text: TREASURY
  - strong: 60 coin
  - text: KNOWLEDGE
  - strong: "0"
  - text: HEARTHS
  - strong: "0"
- navigation "Campaign navigation": Standard pace · 12 realms Recording the full campaign
- group: Campaign & settings
- main:
  - region "Strategic map":
    - text: SEED 20260909 · 256 × 160 Continents
    - navigation "Map management":
      - button "Armies & fleets"
      - button "Settlements"
      - button "Characters & agents": Characters
      - button "Realm progression": Research
      - button "Realm affairs": Diplomacy
      - button "Campaign journal"
      - button "World overview"
    - button "Zoom in": +
    - button "Zoom out": −
    - button "Focus selection"
    - button "Open map actions"
    - button "Map guide": "?"
    - group: World map · Terrain
- contentinfo:
  - text: Selected army
  - strong: Hearth caravan
  - text: 1 / 12 formations · 10 strength · 3 movement
  - button "Show selected orders"
  - button "Show on map"
  - region "Next-action navigation":
    - paragraph: 2 needing orders · 0 idle settlements
    - button "Previous army needing orders": ‹
    - button "Next army needing orders": Next army N
    - button "Previous idle settlement" [disabled]: ‹
    - button "Next idle settlement" [disabled]: Next town S
    - status
  - text: AGE OF FRACTURE
  - strong: Turn 1
  - button "End turn": End turn E
  - status: Your people await a hearth. Select the caravan and found your first settlement.
- button "Art Lab"
- text: Development asset inspector
```

# Test source

```ts
  1   | import { expect, test, type Page, type TestInfo } from '@playwright/test';
  2   | import { readFile, writeFile } from 'node:fs/promises';
  3   | import { deserializeGame, serializeGame, type GameState } from '@theandril/sim';
  4   | import { exportSave } from '@theandril/persistence';
  5   | import { FACTIONS } from '@theandril/content';
  6   | import { characterCampaign, CHARACTER_FIXTURE as C } from '../../packages/test-fixtures/src/character-fixture';
  7   | import { borderBattleCampaign } from '../../packages/test-fixtures/src/combat-fixture';
  8   | import { closeCampaignOptions, closeManagement, openRealmAffairs, openSelectedOrders, selectFromRegistry } from './ui-navigation';
  9   | 
  10  | async function importCampaign(page: Page, state: GameState) {
  11  |   await page.locator('input[type=file]').setInputFiles({ name: 'hermes-ui-slice.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  12  |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  13  | }
  14  | async function evidence(info: TestInfo, name: string, value: unknown) {
  15  |   await info.attach(name, { body: JSON.stringify(value, null, 2), contentType: 'application/json' });
  16  | }
  17  | async function settings(page: Page) {
  18  |   const menu = page.getByTestId('campaign-menu');
  19  |   if (await menu.getAttribute('open') === null) await menu.locator(':scope > summary').click();
  20  | }
  21  | 
  22  | test('R23 repeated public loads and cross-size imports retain one responsive map control and canvas', async ({ page, browser }, info) => {
  23  |   const consoleMessages: string[] = [], errors: string[] = [], records: unknown[] = [];
  24  |   page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') consoleMessages.push(message.text()); });
  25  |   page.on('pageerror', error => errors.push(error.message));
  26  |   const cdp = await page.context().newCDPSession(page);
  27  |   const saveEvidence = () => writeFile(info.outputPath('lifecycle.json'), JSON.stringify({ browser: browser.version(), consoleMessages, errors, records }, null, 2));
  28  |   let initialListeners: Record<string, number> | undefined;
  29  |   const capture = async (stage: string) => {
> 30  |     await expect(page.getByRole('button', { name: 'Save campaign', exact: true })).toBeEnabled();
      |                                                                                    ^ Error: expect(locator).toBeEnabled() failed
  31  |     const dom = await page.evaluate(() => ({ controls: document.querySelectorAll('[data-testid=faction-overview-control]').length, canvases: document.querySelectorAll('canvas').length, mapNodes: document.querySelector('[data-testid=map-container]')!.querySelectorAll('*').length, debugHookPresent: Boolean(window.__THEANDRIL__) }));
  32  |     const listeners: Record<string, number> = {};
  33  |     for (const expression of ['window', 'document', 'document.querySelector("canvas")']) {
  34  |       const { result } = await cdp.send('Runtime.evaluate', { expression });
  35  |       if (result.objectId) {
  36  |         listeners[expression] = (await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId })).listeners.length;
  37  |         await cdp.send('Runtime.releaseObject', { objectId: result.objectId });
  38  |       }
  39  |     }
  40  |     records.push({ stage, ...dom, listeners }); await saveEvidence();
  41  |     console.log(JSON.stringify({ stage, ...dom, listeners }));
  42  |     expect.soft(dom.controls, stage).toBe(1); expect.soft(dom.canvases, stage).toBe(1);
  43  |     initialListeners ??= listeners;
  44  |     expect.soft(listeners, `${stage} attached listener counts`).toEqual(initialListeners);
  45  |   };
  46  |   try {
  47  |     await page.goto('/');
  48  |     await page.getByRole('textbox', { name: 'World seed', exact: true }).fill('20260909');
  49  |     await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption('small');
  50  |     await page.getByRole('spinbutton', { name: 'Faction count', exact: true }).fill('12');
  51  |     await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  52  |     await expect(page.getByTestId('turn-counter')).toHaveText('Turn 1');
  53  |     const canvas = await page.locator('canvas').elementHandle();
  54  |     await capture('generated-small12'); await settings(page);
  55  |     await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  56  |     await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  57  |     const downloading = page.waitForEvent('download');
  58  |     await page.getByRole('button', { name: 'Export save file', exact: true }).click();
  59  |     const download = await downloading, downloadedPath = await download.path();
  60  |     if (!downloadedPath) throw new Error('Missing exported Small campaign');
  61  |     const small = await readFile(downloadedPath);
  62  |     for (let index = 1; index <= 4; index++) {
  63  |       await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  64  |       await expect(page.getByTestId('feedback')).toContainText('Campaign restored');
  65  |       await capture(`load-${index}`);
  66  |     }
  67  |     const tiny = Buffer.from(await exportSave(serializeGame(borderBattleCampaign())));
  68  |     for (let index = 1; index <= 4; index++) {
  69  |       await page.locator('input[type=file]').setInputFiles({ name: `replacement-${index}.theandril`, mimeType: 'application/gzip', buffer: index % 2 ? small : tiny });
  70  |       await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  71  |       await capture(`import-${index}-${index % 2 ? 'small' : 'tiny'}`);
  72  |     }
  73  |     await page.locator('input[type=file]').setInputFiles({ name: 'corrupt.theandril', mimeType: 'application/gzip', buffer: Buffer.from('not a save') });
  74  |     await expect(page.getByTestId('feedback')).toHaveClass(/error/);
  75  |     await capture('failed-import');
  76  |     await closeCampaignOptions(page);
  77  |     // Use the newest actual control even during RED, so all replacement counts
  78  |     // are retained instead of stopping at the first duplicate locator error.
  79  |     const control = page.getByTestId('faction-overview-control').last();
  80  |     await control.locator(':scope > summary').click();
  81  |     await control.getByRole('button', { name: 'Realms', exact: true }).click();
  82  |     await expect(control.getByRole('button', { name: 'Realms', exact: true })).toHaveAttribute('aria-pressed', 'true');
  83  |     await control.getByRole('button', { name: 'Clear realms', exact: true }).click();
  84  |     for (const checkbox of await control.getByRole('checkbox').all()) await expect(checkbox).not.toBeChecked();
  85  |     await control.getByRole('button', { name: 'All known realms', exact: true }).click();
  86  |     for (const checkbox of await control.getByRole('checkbox').all()) await expect(checkbox).toBeChecked();
  87  |     await control.locator(':scope > summary').click();
  88  |     await openRealmAffairs(page);
  89  |     await page.getByRole('button', { name: 'Declare war on Reedbound Council', exact: true }).click();
  90  |     await openSelectedOrders(page);
  91  |     await page.getByRole('button', { name: 'Attack Reedbound Watch (army.4)', exact: true }).click();
  92  |     await expect(page.getByTestId('battle-panel')).toBeVisible();
  93  |     await expect(control).toBeHidden();
  94  |     await page.getByRole('button', { name: 'Auto-resolve battle', exact: true }).click();
  95  |     await expect(page.getByTestId('battle-panel')).toHaveCount(0);
  96  |     await expect(control.locator(':scope > summary')).toContainText('Realms');
  97  |     await capture('after-battle');
  98  |     expect(await canvas!.evaluate(element => element === document.querySelector('canvas'))).toBe(true);
  99  |     await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
  100 |     await page.getByTestId('map-container').focus(); await page.keyboard.press('Enter');
  101 |     await expect(page.getByRole('dialog', { name: 'Map orders', exact: true })).toBeVisible();
  102 |     await page.keyboard.press('Escape');
  103 |     await page.screenshot({ path: info.outputPath('lifecycle-after-battle.png') });
  104 |     await page.setViewportSize({ width: 390, height: 844 });
  105 |     await control.locator(':scope > summary').click();
  106 |     await control.getByRole('button', { name: 'Terrain', exact: true }).click();
  107 |     await expect(control.getByRole('button', { name: 'Terrain', exact: true })).toHaveAttribute('aria-pressed', 'true');
  108 |     expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  109 |     await page.screenshot({ path: info.outputPath('lifecycle-controls-390.png') });
  110 |     expect.soft(consoleMessages.filter(message => /same key|Encountered two children/.test(message))).toEqual([]);
  111 |     expect(errors).toEqual([]);
  112 |   } finally { await saveEvidence(); await cdp.detach(); }
  113 | });
  114 | 
  115 | for (const definitionId of ['faction.ashen_compact', 'faction.reedbound_council']) {
  116 |   test(`R18 paid Waykeeper resolves shared art for ${definitionId}`, async ({ page }, info) => {
  117 |     const consoleMessages: string[] = [], errors: string[] = [], requests: string[] = [];
  118 |     page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') consoleMessages.push(message.text()); });
  119 |     page.on('pageerror', error => errors.push(error.message));
  120 |     page.on('request', request => { if (/\/art\/.*\.png/.test(request.url())) requests.push(new URL(request.url()).pathname); });
  121 |     // Authored funded/infrastructure fixture, not a natural campaign. Appointment,
  122 |     // attachment and all inspection below use public controls; no debug mutations.
  123 |     const game = characterCampaign();
  124 |     game.factions[0]!.definitionId = definitionId;
  125 |     game.factions[0]!.color = FACTIONS.find(faction => faction.id === definitionId)!.color;
  126 |     game.settlements[C.homeId]!.buildings.push('building.archive');
  127 |     const validated = deserializeGame(serializeGame(game));
  128 |     const catalog = JSON.parse(await readFile('apps/web/public/art/catalog.json', 'utf8'));
  129 |     const asset = catalog.assets.find((item: { id: string }) => item.id === 'character.waykeeper');
  130 |     const atlas = catalog.atlases.find((item: { id: string }) => item.id === asset.atlasId);
```