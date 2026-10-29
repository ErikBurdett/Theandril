# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: conquest.spec.ts >> besiege and assault a town, save the capture decision, and apply distinct occupation or sack outcomes
- Location: tests/gameplay/conquest.spec.ts:33:1

# Error details

```
Test timeout of 45000ms exceeded.
```

```
Error: locator.setInputFiles: Test timeout of 45000ms exceeded.
Call log:
  - waiting for locator('input[type=file]')

```

# Test source

```ts
  1   | import { closeManagement, openRegistry, selectFromRegistry, openSelectedOrders, openRealmAffairs, openCampaignJournal, openProduction } from './ui-navigation';
  2   | import { expect, test, type Page } from '@playwright/test';
  3   | import { serializeGame, type GameState } from '@theandril/sim';
  4   | import { exportSave } from '@theandril/persistence';
  5   | import { isPassable, neighbors } from '@theandril/mapgen';
  6   | import { CONQUEST_FIXTURE, conquestCampaign } from '../../packages/test-fixtures/src/conquest-fixture';
  7   | 
  8   | async function beginSiege(page: Page): Promise<GameState> {
  9   |   const fixture = conquestCampaign();
  10  |   await page.goto('/');
> 11  |   await page.locator('input[type=file]').setInputFiles({ name: 'reedwatch.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(fixture))) });
      |   ^ Error: locator.setInputFiles: Test timeout of 45000ms exceeded.
  12  |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  13  |   await openRealmAffairs(page);
  14  |   await page.getByRole('button', { name: 'Declare war on Reedbound Council', exact: true }).click();
  15  |   await openSelectedOrders(page);
  16  |   await page.getByRole('button', { name: 'Besiege Reedwatch', exact: true }).click();
  17  |   await expect(page.getByTestId(`siege-${CONQUEST_FIXTURE.settlementId}`)).toContainText('Besieging Reedwatch');
  18  |   for (let turn = 2; turn <= 4; turn++) {
  19  |     await closeManagement(page);
  20  |     await page.getByRole('button', { name: 'End turn', exact: true }).click();
  21  |     await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${turn}`);
  22  |   }
  23  |   expect(await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.sieges[0]?.defenses)).toBe(0);
  24  |   await openSelectedOrders(page);
  25  |   await page.getByRole('button', { name: 'Assault Reedwatch', exact: true }).click();
  26  |   await expect(page.getByTestId('battle-panel')).toBeVisible();
  27  |   await page.getByRole('button', { name: 'Auto-resolve battle', exact: true }).click();
  28  |   await expect(page.getByTestId('capture-panel')).toContainText('Reedwatch has fallen');
  29  |   await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeDisabled();
  30  |   return fixture;
  31  | }
  32  | 
  33  | test('besiege and assault a town, save the capture decision, and apply distinct occupation or sack outcomes', async ({ page }, testInfo) => {
  34  |   const errors: string[] = [];
  35  |   page.on('pageerror', error => errors.push(error.message));
  36  |   await beginSiege(page);
  37  |   await page.screenshot({ path: testInfo.outputPath('capture-choices.png'), fullPage: true });
  38  |   await closeManagement(page);
  39  |   await page.getByText('Campaign & settings', { exact: true }).click();
  40  |   await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  41  |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  42  |   const decisionHash = await page.evaluate(() => window.__THEANDRIL__?.getStateHash());
  43  |   await page.getByRole('button', { name: 'Occupy settlement', exact: true }).click();
  44  |   await expect(page.getByTestId('capture-panel')).toHaveCount(0);
  45  |   const occupied = await page.evaluate(id => window.__THEANDRIL__?.getSummary()?.ownSettlements.find(town => town.id === id), CONQUEST_FIXTURE.settlementId);
  46  |   expect(occupied?.occupationTurns).toBe(3);
  47  |   expect(occupied?.devastation).toBe(20);
  48  |   expect(occupied?.buildings).toHaveLength(2);
  49  |   await page.reload();
  50  |   await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  51  |   await expect(page.getByTestId('capture-panel')).toBeVisible();
  52  |   expect(await page.evaluate(() => window.__THEANDRIL__?.getStateHash())).toBe(decisionHash);
  53  |   const before = await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.treasury);
  54  |   const loot = await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.pendingCapture?.options.find(option => option.outcome === 'sack')?.coinGain);
  55  |   await page.getByRole('button', { name: 'Sack settlement', exact: true }).click();
  56  |   await expect(page.getByTestId('capture-panel')).toHaveCount(0);
  57  |   const sacked = await page.evaluate(id => window.__THEANDRIL__?.getSummary()?.ownSettlements.find(town => town.id === id), CONQUEST_FIXTURE.settlementId);
  58  |   expect(sacked?.population).toBe(1);
  59  |   expect(sacked?.buildings).toHaveLength(1);
  60  |   expect(sacked?.devastation).toBe(60);
  61  |   expect(sacked?.occupationTurns).toBe(5);
  62  |   expect(await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.treasury)).toBe(before! + loot!);
  63  |   await openRegistry(page, 'settlements');
  64  |   await selectFromRegistry(page, 'settlements', /Reedwatch/); await openSelectedOrders(page);
  65  |   await expect(page.getByTestId('settlement-defense')).toContainText('60/100');
  66  |   await page.screenshot({ path: testInfo.outputPath('occupied-town.png'), fullPage: true });
  67  |   await page.setViewportSize({ width: 390, height: 844 });
  68  |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  69  |   await page.screenshot({ path: testInfo.outputPath('conquest-narrow.png'), fullPage: true });
  70  |   expect(errors).toEqual([]);
  71  | });
  72  | 
  73  | test('confirm razing and resettle the visible ruins with a normally recruited caravan', async ({ page }, testInfo) => {
  74  |   const fixture = await beginSiege(page);
  75  |   const ruinCell = fixture.settlements[CONQUEST_FIXTURE.settlementId]!.cell;
  76  |   const home = Object.values(fixture.settlements).find(town => town.factionId === fixture.turnOwnerId)!;
  77  |   await page.getByRole('button', { name: 'Raze settlement', exact: true }).click();
  78  |   await expect(page.getByRole('group', { name: 'Confirm settlement destruction' })).toBeVisible();
  79  |   await page.getByRole('button', { name: 'Keep settlement', exact: true }).click();
  80  |   await expect(page.getByTestId('capture-panel')).toBeVisible();
  81  |   await page.getByRole('button', { name: 'Raze settlement', exact: true }).click();
  82  |   await page.getByRole('button', { name: 'Confirm raze', exact: true }).click();
  83  |   await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ruins.length)).toBe(1);
  84  |   await selectFromRegistry(page, 'armies', /Ashen Vanguard/); await openSelectedOrders(page);
  85  |   await expect(page.getByTestId('ruin-inspection')).toContainText('Reedwatch');
  86  |   await page.screenshot({ path: testInfo.outputPath('reedwatch-ruins.png'), fullPage: true });
  87  |   await openRegistry(page, 'settlements');
  88  |   await selectFromRegistry(page, 'settlements', /Ashen Hearth/); await openSelectedOrders(page);
  89  |   await openProduction(page, 'land');
  90  |   await page.getByRole('button', { name: 'Recruit Hearth caravan', exact: true }).click();
  91  |   let turn = 4;
  92  |   for (let i = 0; i < 5; i++) {
  93  |     await closeManagement(page);
  94  |     await page.getByRole('button', { name: 'End turn', exact: true }).click();
  95  |     await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${++turn}`);
  96  |   }
  97  |   await openRegistry(page, 'armies');
  98  |   await selectFromRegistry(page, 'armies', /Hearth caravan/); await openSelectedOrders(page);
  99  |   const paths = new Map<number, number[]>([[home.cell, []]]);
  100 |   const frontier = [home.cell];
  101 |   for (let cursor = 0; cursor < frontier.length && !paths.has(ruinCell); cursor++) {
  102 |     const current = frontier[cursor]!;
  103 |     for (const cell of neighbors(current, fixture.world.width, fixture.world.height)) {
  104 |       if (paths.has(cell) || !isPassable(fixture.world.terrain[cell]!)) continue;
  105 |       paths.set(cell, [...paths.get(current)!, cell]); frontier.push(cell);
  106 |     }
  107 |   }
  108 |   const route = paths.get(ruinCell);
  109 |   expect(route).toBeTruthy();
  110 |   for (const cell of route!) {
  111 |     const cost = [2, 3].includes(fixture.world.terrain[cell]!) ? 2 : 1;
```