# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: conquest.spec.ts >> defending a settlement pauses the AI assault and resolves the AI capture after human withdrawal
- Location: tests/gameplay/conquest.spec.ts:136:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  getByTestId('battle-panel')
Expected: visible
Received: undefined

Call log:
  - Expect "toBeVisible" getByTestId('battle-panel') with timeout 5000ms
  - waiting for getByTestId('battle-panel')
  - Protocol error (Runtime.callFunctionOn): Page crashed.

```

# Test source

```ts
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
  112 |     const movement = await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ownArmies.find(army => army.unitId === 'unit.colonist')?.movement);
  113 |     if (movement! < cost) {
  114 |       await closeManagement(page);
  115 |       await page.getByRole('button', { name: 'End turn', exact: true }).click();
  116 |       await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${++turn}`);
  117 |     }
  118 |     await openSelectedOrders(page);
  119 |     await page.getByRole('button', { name: `Move to cell ${cell}`, exact: true }).click();
  120 |     await expect(page.getByTestId('feedback')).toContainText(`explored hex ${cell}`);
  121 |   }
  122 |   await closeManagement(page);
  123 |   await page.getByRole('button', { name: 'End turn', exact: true }).click();
  124 |   await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${++turn}`);
  125 |   await openSelectedOrders(page);
  126 |   await page.getByLabel('Settlement name', { exact: true }).fill('New Reedwatch');
  127 |   await page.getByRole('button', { name: 'Found settlement', exact: true }).click();
  128 |   await openRegistry(page, 'settlements');
  129 |   await expect(page.getByTestId('settlement-registry')).toContainText('New Reedwatch');
  130 |   expect(await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ruins.length)).toBe(0);
  131 |   const rebuilt = await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ownSettlements.find(town => town.name === 'New Reedwatch'));
  132 |   expect(rebuilt?.cell).toBe(ruinCell);
  133 |   expect(rebuilt?.founderFactionId).toBe(fixture.turnOwnerId);
  134 | });
  135 | 
  136 | test('defending a settlement pauses the AI assault and resolves the AI capture after human withdrawal', async ({ page }) => {
  137 |   const fixture = conquestCampaign();
  138 |   // Swap the human seat in this authored fixture; every siege/battle/capture remains a real order.
  139 |   fixture.turnOwnerId = CONQUEST_FIXTURE.enemyFactionId;
  140 |   await page.goto('/');
  141 |   await page.locator('input[type=file]').setInputFiles({ name: 'defend-reedwatch.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(fixture))) });
  142 |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  143 |   // Modern ranks retain braced cohesion behind walls. The ordinary-strength
  144 |   // besieger waits for three real siege ticks, then interrupts the fourth click
  145 |   // for the human's defense before the campaign round advances.
  146 |   for (let turn = 2; turn <= 4; turn++) {
  147 |     await closeManagement(page);
  148 |     await page.getByRole('button', { name: 'End turn', exact: true }).click();
  149 |     await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${turn}`);
  150 |     await expect(page.getByTestId('battle-panel')).toHaveCount(0);
  151 |   }
  152 |   await closeManagement(page);
  153 |   await page.getByRole('button', { name: 'End turn', exact: true }).click();
> 154 |   await expect(page.getByTestId('battle-panel')).toBeVisible();
      |                                                  ^ Error: expect(locator).toBeVisible() failed
  155 |   const battle = await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.battle);
  156 |   await expect(page.getByTestId('turn-counter')).toHaveText('Turn 4');
  157 |   expect(battle?.settlementId).toBe(CONQUEST_FIXTURE.settlementId);
  158 |   expect(battle?.defenderFactionId).toBe(fixture.turnOwnerId);
  159 |   expect(battle?.fortification).toBe(0);
  160 |   await page.getByRole('button', { name: 'Withdraw', exact: true }).click();
  161 |   await expect(page.getByTestId('battle-panel')).toHaveCount(0);
  162 |   await expect(page.getByTestId('capture-panel')).toHaveCount(0);
  163 |   await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ownSettlements.length)).toBe(0);
  164 |   await openCampaignJournal(page);
  165 |   await expect(page.getByTestId('chronicle')).toContainText(/Reedwatch: occupy|Reedwatch: sack/);
  166 |   await closeManagement(page);
  167 |   await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  168 | });
  169 | 
```