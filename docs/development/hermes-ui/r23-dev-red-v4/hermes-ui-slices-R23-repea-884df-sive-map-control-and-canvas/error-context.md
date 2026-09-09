# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: hermes-ui-slices.spec.ts >> R23 repeated public loads and cross-size imports retain one responsive map control and canvas
- Location: tests/gameplay/hermes-ui-slices.spec.ts:22:1

# Error details

```
Error: load-1

expect(received).toBe(expected) // Object.is equality

Expected: 1
Received: 2
```

```
Error: load-2

expect(received).toBe(expected) // Object.is equality

Expected: 1
Received: 3
```

```
Error: load-3

expect(received).toBe(expected) // Object.is equality

Expected: 1
Received: 4
```

```
Error: load-4

expect(received).toBe(expected) // Object.is equality

Expected: 1
Received: 5
```

```
Error: import-1-small

expect(received).toBe(expected) // Object.is equality

Expected: 1
Received: 6
```

```
Error: import-2-tiny

expect(received).toBe(expected) // Object.is equality

Expected: 1
Received: 7
```

```
Error: import-3-small

expect(received).toBe(expected) // Object.is equality

Expected: 1
Received: 8
```

```
Error: import-4-tiny

expect(received).toBe(expected) // Object.is equality

Expected: 1
Received: 9
```

```
Error: failed-import

expect(received).toBe(expected) // Object.is equality

Expected: 1
Received: 9
```

```
Error: after-battle

expect(received).toBe(expected) // Object.is equality

Expected: 1
Received: 9
```

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('dialog', { name: 'Map orders', exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('dialog', { name: 'Map orders', exact: true }) with timeout 5000ms
  - waiting for getByRole('dialog', { name: 'Map orders', exact: true })

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
  - strong: "1"
- navigation "Campaign navigation": Standard pace · 2 realms Partial archive · earlier history unavailable
- group: Campaign & settings
- main:
  - region "Strategic map":
    - text: SEED 20260905 · 48 × 32 Legacy geography
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
    - group: World map · Terrain
    - group: World map · Terrain
    - group: World map · Terrain
    - group: World map · Terrain
    - group: World map · Terrain
    - group: World map · Terrain
    - group: World map · Terrain
    - group: World map · Realms
- contentinfo:
  - text: Selected army
  - strong: Ashen Vanguard
  - text: 1 / 12 formations · 35 strength · 0 movement
  - button "Show selected orders"
  - button "Show on map"
  - region "Next-action navigation":
    - paragraph: 0 needing orders · 1 idle settlements
    - button "Previous army needing orders" [disabled]: ‹
    - button "Next army needing orders" [disabled]: Next army N
    - button "Previous idle settlement": ‹
    - button "Next idle settlement": Next town S
    - status
  - text: AGE OF FRACTURE
  - strong: Turn 1
  - button "End turn": End turn E
  - status: "Ashen Compact prevailed at hex 537: ordered withdrawal. Autosaved."
- button "Art Lab"
- text: Development asset inspector
- dialog "Ashen Vanguard":
  - banner:
    - heading "Ashen Vanguard" [level=2]
    - button "Close map actions": ×
  - text: At this location
  - combobox "Inspect at this location":
    - option "Army — Ashen Vanguard" [selected]
    - option "Tile — Hex 537"
  - paragraph: Army · 1 formations
  - paragraph: 1 / 12 formations · 35 strength · 0 movement
  - tablist "Selected entity management":
    - tab "Actions" [selected]
    - tab "Composition"
    - tab "Officers"
    - tab "Route"
    - tab "Battle"
    - tab "Transport"
    - tab "Hex"
    - tab "Diplomacy"
  - tabpanel "Actions":
    - group:
      - button "Move on map"
      - button "Plan a route"
      - button "Battle orders"
  - contentinfo:
    - button "Open full orders"
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
  30  |     await expect(page.getByRole('button', { name: 'Save campaign', exact: true, includeHidden: true })).toBeEnabled();
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
  58  |     await page.getByRole('button', { name: 'Export campaign', exact: true }).click();
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
> 101 |     await expect(page.getByRole('dialog', { name: 'Map orders', exact: true })).toBeVisible();
      |                                                                                 ^ Error: expect(locator).toBeVisible() failed
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
  131 |     expect(atlas.width * atlas.height * 4).toBe(4 * 1024 * 1024);
  132 |     await page.goto('/'); await importCampaign(page, validated);
  133 |     await selectFromRegistry(page, 'settlements', C.homeName); await openSelectedOrders(page);
  134 |     await page.getByTestId('character-appointments').locator('summary').click();
  135 |     const before = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.treasury);
  136 |     await page.getByRole('button', { name: 'Appoint Waykeeper', exact: true }).click();
  137 |     await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.characters.filter(item => item.definitionId === 'character.waykeeper').length)).toBe(1);
  138 |     expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.treasury)).toBe(before - 40);
  139 |     await page.getByRole('button', { name: 'Open character roster', exact: true }).click();
  140 |     const caster = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.characters.find(item => item.definitionId === 'character.waykeeper')!);
  141 |     const roster = page.getByRole('dialog', { name: 'Characters & agents', exact: true });
  142 |     await roster.getByRole('button', { name: `Inspect ${caster.name} (${caster.id})`, exact: true }).click();
  143 |     const art = roster.locator('[data-art-content-id="character.waykeeper"]');
  144 |     await expect(art).toHaveCount(2);
  145 |     for (const icon of await art.all()) {
  146 |       await expect(icon).toHaveAttribute('data-art-state', 'shared');
  147 |       await expect(icon).toHaveAttribute('data-art-rendered-id', 'character.waykeeper');
  148 |       await expect(icon).toHaveAttribute('title', /shared Waykeeper silhouette/);
  149 |       await expect(icon).not.toContainText('Generic');
  150 |     }
  151 |     await expect(roster.getByRole('img', { name: /shared Waykeeper silhouette/ })).toHaveCount(1);
  152 |     await roster.screenshot({ path: info.outputPath('waykeeper-paid-desktop.png') });
  153 |     const hash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  154 |     await page.setViewportSize({ width: 390, height: 844 });
  155 |     await roster.getByRole('combobox', { name: 'Assign to army', exact: true }).selectOption(C.armyId);
  156 |     await roster.getByRole('button', { name: 'Assign character', exact: true }).click();
  157 |     await expect.poll(() => page.evaluate(id => window.__THEANDRIL__!.getSummary()!.characters.find(item => item.id === id)?.location, caster.id)).toEqual({ kind: 'army', armyId: C.armyId });
  158 |     expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).not.toBe(hash);
  159 |     expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  160 |     await roster.screenshot({ path: info.outputPath('waykeeper-assigned-390.png') });
  161 |     await roster.getByRole('button', { name: 'Close characters', exact: true }).click();
  162 |     await closeManagement(page); await closeCampaignOptions(page);
  163 |     await page.getByRole('button', { name: 'Characters & agents', exact: true }).click();
  164 |     await expect(roster.locator('[data-art-content-id="character.waykeeper"][data-art-state="shared"]').first()).toBeVisible();
  165 |     expect(requests.filter(url => url === atlas.imageUrl)).toHaveLength(1);
  166 |     const otherBattlePages = catalog.atlases.filter((item: { id: string }) => item.id.startsWith('battle') && item.id !== atlas.id);
  167 |     for (const other of otherBattlePages) expect(requests).not.toContain(other.imageUrl);
  168 |     expect(errors).toEqual([]);
  169 |     await evidence(info, 'waykeeper-evidence', { definitionId, caster, paidCoin: 40, atlas, requests, consoleMessages, errors });
  170 |   });
  171 | }
  172 | 
```