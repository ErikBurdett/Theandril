# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: production/land-policy.spec.ts >> a generated hearth spends its commission allowance on two ordinary paid works and restores the exact saved policy
- Location: tests/production/land-policy.spec.ts:58:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByTestId('feedback')
Expected substring: "Imported campaign"
Received string:    "!The campaign worker stopped: Unexpected worker error. Restore a saved campaign to recover."
Timeout: 5000ms

Call log:
  - Expect "toContainText" getByTestId('feedback') with timeout 5000ms
  - waiting for getByTestId('feedback')
    3 × locator resolved to <div role="status" class="feedback " aria-live="polite" data-testid="feedback">…</div>
      - unexpected value "◆Resolving… A world of broken oaths awaits a new beginning."
    11 × locator resolved to <div role="alert" aria-live="polite" class="feedback error" data-testid="feedback">…</div>
       - unexpected value "!The campaign worker stopped: Unexpected worker error. Restore a saved campaign to recover."

```

```yaml
- alert: "The campaign worker stopped: Unexpected worker error. Restore a saved campaign to recover."
```

# Test source

```ts
  1   | import { mkdirSync, writeFileSync } from 'node:fs';
  2   | import { expect, test, type Page } from '@playwright/test';
  3   | import { createJournal } from '@theandril/chronicle';
  4   | import { applyCommand, commandSchema, createGame, getObservation, serializeGame, stateHash, type GameCommand } from '@theandril/sim';
  5   | import { exportSave, serializeCampaign } from '@theandril/persistence';
  6   | import { campaignMenu, exportedTravel } from '../gameplay/group-movement-fixture';
  7   | import { closeCampaignOptions, closeManagement, openSelectedOrders, selectFromRegistry } from '../gameplay/ui-navigation';
  8   | 
  9   | const improvementId = 'improvement.terraced_fields';
  10  | 
  11  | /** A generated realm, grown through ordinary food-funded turns. No authored
  12  |  * terrain, population, treasury, resources or completed work enters this setup. */
  13  | function commissionCampaign() {
  14  |   const game = createGame({ seed: 20260905, size: 'tiny', pace: 'short', factionCount: 2, cityStateCount: 0 });
  15  |   const factionId = game.turnOwnerId;
  16  |   const issue = (command: GameCommand) => expect(applyCommand(game, command).ok).toBe(true);
  17  |   issue({ type: 'found', factionId, armyId: 'army.1', name: 'Commissioned hearth' });
  18  |   const town = Object.values(game.settlements).find(item => item.factionId === factionId)!;
  19  |   issue({ type: 'setWorkerPolicy', factionId, settlementId: town.id, focus: 'food' });
  20  |   while (town.population < 2 && game.turn < 10) issue({ type: 'endTurn', factionId });
  21  |   expect(game.turn).toBe(3); expect(town.population).toBe(2);
  22  |   const land = getObservation(game, factionId).land.settlements.find(item => item.settlementId === town.id)!;
  23  |   const cells = land.cells.filter(cell => cell.claimed && cell.canWork && !cell.improvementId && !cell.resourceId
  24  |     && cell.improvementOptions.some(option => option.improvementId === improvementId && option.canStart)).map(cell => cell.cell).sort((a, b) => a - b).slice(0, 2);
  25  |   expect(cells).toEqual([1100, 1148]);
  26  |   issue({ type: 'setWorkedTiles', factionId, settlementId: town.id, cells });
  27  |   const archive = createJournal(game, { mode: 'player', coverage: 'from-save' }).materialize();
  28  |   return { game, archive, town, factionId, cells };
  29  | }
  30  | 
  31  | async function loadCommissionCampaign(page: Page, scene: ReturnType<typeof commissionCampaign>) {
  32  |   await page.goto('./');
  33  |   expect(await page.evaluate(() => '__THEANDRIL__' in window)).toBe(false);
  34  |   await page.getByLabel('Import save file').setInputFiles({ name: 'generated-land-commission.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeCampaign(scene.game, scene.archive))) });
> 35  |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
      |                                              ^ Error: expect(locator).toContainText(expected) failed
  36  | }
  37  | 
  38  | async function commissionPanel(page: Page) {
  39  |   await selectFromRegistry(page, 'settlements', 'Commissioned hearth'); await openSelectedOrders(page);
  40  |   await expect(page.getByTestId('land-panel')).toHaveAttribute('data-query-state', 'ready');
  41  |   const panel = page.getByTestId('land-policy');
  42  |   if (await panel.getAttribute('open') === null) await panel.locator(':scope > summary').click();
  43  |   return panel;
  44  | }
  45  | 
  46  | async function setCommission(page: Page, allowance: number, reserve: number, keyboard = false) {
  47  |   const panel = await commissionPanel(page);
  48  |   await panel.getByRole('combobox', { name: 'Commission improvement', exact: true }).selectOption(improvementId);
  49  |   await panel.getByRole('textbox', { name: 'Remaining allowance · coin', exact: true }).fill(String(allowance));
  50  |   await panel.getByRole('textbox', { name: 'Treasury reserve · coin', exact: true }).fill(String(reserve));
  51  |   const apply = panel.getByRole('button', { name: 'Apply land commission', exact: true });
  52  |   if (keyboard) { await apply.focus(); await page.keyboard.press('Enter'); } else await apply.click();
  53  |   await expect(panel.locator(':scope > summary')).toContainText('Terraced fields');
  54  |   await expect(page.getByTestId('land-panel')).toHaveAttribute('data-query-state', 'ready');
  55  |   return panel;
  56  | }
  57  | 
  58  | test('a generated hearth spends its commission allowance on two ordinary paid works and restores the exact saved policy', async ({ page }, testInfo) => {
  59  |   mkdirSync(testInfo.outputDir, { recursive: true });
  60  |   const scene = commissionCampaign(), initialTreasury = getObservation(scene.game, scene.factionId).treasury;
  61  |   expect(initialTreasury).toBe(70);
  62  |   const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  63  |   await loadCommissionCampaign(page, scene);
  64  |   await setCommission(page, 100, initialTreasury);
  65  |   await expect(page.getByTestId('land-policy-status')).toContainText(/reserve/i);
  66  |   const waiting = await exportedTravel(page);
  67  |   expect(waiting.game.landPolicies[0]).toMatchObject({ allowance: 100, reserve: initialTreasury, improvementId });
  68  |   expect(waiting.game.land.settlements[scene.town.id]!.work).toBeNull();
  69  |   expect(getObservation(waiting.game, scene.factionId).treasury).toBe(initialTreasury);
  70  | 
  71  |   // Replace the allowance with 50; do not add 50 to the waiting 100.
  72  |   const panel = await setCommission(page, 50, 0);
  73  |   await expect(panel.locator(':scope > summary')).toContainText('28 coin left');
  74  |   await expect(page.getByTestId('land-work')).toContainText('0 / 2 turns completed · 22 coin paid');
  75  |   const started = await exportedTravel(page);
  76  |   expect(started.game.landPolicies[0]).toMatchObject({ allowance: 28, reserve: 0 });
  77  |   expect(started.game.land.settlements[scene.town.id]!.work).toMatchObject({ cell: scene.cells[0], coinCost: 22, remainingTurns: 2 });
  78  |   expect(getObservation(started.game, scene.factionId).treasury).toBe(initialTreasury - 22);
  79  |   await campaignMenu(page); await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  80  |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  81  |   await commissionPanel(page);
  82  |   await panel.getByRole('button', { name: 'End land commission', exact: true }).click();
  83  |   await expect(panel.locator(':scope > summary')).toContainText('Direct construction');
  84  |   const ended = await exportedTravel(page);
  85  |   expect(ended.game.landPolicies).toEqual([]);
  86  |   expect(ended.game.land.settlements[scene.town.id]!.work).toEqual(started.game.land.settlements[scene.town.id]!.work);
  87  |   expect(ended.game.factions).toEqual(started.game.factions);
  88  |   await campaignMenu(page); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  89  |   await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  90  |   const restored = await exportedTravel(page);
  91  |   expect(serializeGame(restored.game)).toBe(serializeGame(started.game)); expect(restored.archive).toEqual(started.archive);
  92  | 
  93  |   for (let turn = scene.game.turn + 1; turn <= scene.game.turn + 4; turn++) {
  94  |     await closeManagement(page); await closeCampaignOptions(page);
  95  |     await page.getByRole('button', { name: 'End turn', exact: true }).click();
  96  |     await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${turn}`);
  97  |     await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  98  |   }
  99  |   const completed = await exportedTravel(page), land = completed.game.land.settlements[scene.town.id]!;
  100 |   expect(land.work).toBeNull();
  101 |   expect(land.improvements).toEqual(Object.fromEntries(scene.cells.map(cell => [cell, improvementId])));
  102 |   expect(land.worked).toEqual(scene.cells);
  103 |   expect(completed.game.landPolicies.find(policy => policy.settlementId === scene.town.id)).toMatchObject({ allowance: 3, reserve: 0, improvementId });
  104 |   expect(completed.archive.records.filter(record => commandSchema.parse(record.command).type === 'setLandPolicy' && commandSchema.parse(record.command).factionId === scene.factionId)).toHaveLength(2);
  105 |   await commissionPanel(page);
  106 |   await panel.screenshot({ path: testInfo.outputPath('land-commission-completed.png') });
  107 |   await panel.locator(':scope > summary').screenshot({ path: testInfo.outputPath('land-commission-summary-native.png') });
  108 |   writeFileSync(testInfo.outputPath('started.theandril'), started.bytes);
  109 |   writeFileSync(testInfo.outputPath('restored.theandril'), restored.bytes);
  110 |   writeFileSync(testInfo.outputPath('completed.theandril'), completed.bytes);
  111 |   writeFileSync(testInfo.outputPath('completion.json'), JSON.stringify({ setup: 'Generated seed20260905; ordinary founding, Food policy and two growth turns, then ordinary manual workers. From-save browser journal; no authored population, purse, terrain or deposits.', startTurn: scene.game.turn, completedTurn: completed.game.turn, cells: scene.cells, initialTreasury, initialAllowance: 50, orderCosts: [22, 25], remainingAllowance: 3, startedHash: stateHash(started.game), restoredHash: stateHash(restored.game), completedHash: stateHash(completed.game), records: completed.archive.records.length }, null, 2) + '\n');
  112 |   expect(errors).toEqual([]);
  113 | });
  114 | 
  115 | test('land commissions validate budgets and yield to real manual work at narrow width with exact replay', async ({ page }, testInfo) => {
  116 |   mkdirSync(testInfo.outputDir, { recursive: true });
  117 |   const scene = commissionCampaign(), errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  118 |   await loadCommissionCampaign(page, scene);
  119 |   await campaignMenu(page); await page.getByRole('combobox', { name: 'Text scale', exact: true }).selectOption('1.3');
  120 |   await page.setViewportSize({ width: 390, height: 844 });
  121 |   const panel = await commissionPanel(page), amount = panel.getByRole('textbox', { name: 'Remaining allowance · coin', exact: true });
  122 |   for (const invalid of ['', '-1', '3.2', '9007199254740992']) {
  123 |     await amount.fill(invalid);
  124 |     await expect(panel.getByRole('button', { name: 'Apply land commission', exact: true })).toBeDisabled();
  125 |     await expect(amount).toHaveAttribute('aria-invalid', 'true');
  126 |   }
  127 |   await setCommission(page, 50, 0, true);
  128 |   await expect(panel.locator(':scope > summary')).toContainText('28 coin left');
  129 |   const end = panel.getByRole('button', { name: 'End land commission', exact: true });
  130 |   await end.scrollIntoViewIfNeeded();
  131 |   expect(await end.evaluate(button => {
  132 |     const bounds = button.getBoundingClientRect(), frame = button.closest('.campaign-window-body')!.getBoundingClientRect();
  133 |     return bounds.height >= 44 && bounds.left >= frame.left && bounds.right <= frame.right && bounds.top >= frame.top && bounds.bottom <= frame.bottom;
  134 |   })).toBe(true);
  135 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
```