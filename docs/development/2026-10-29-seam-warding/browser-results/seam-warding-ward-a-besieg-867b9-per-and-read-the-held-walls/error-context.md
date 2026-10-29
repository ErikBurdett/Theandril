# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: seam-warding.spec.ts >> ward a besieged hearth through its lodged Waykeeper and read the held walls
- Location: tests/gameplay/seam-warding.spec.ts:14:1

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
  1  | import { expect, test, type Page } from '@playwright/test';
  2  | import { isPassable, neighbors } from '@theandril/mapgen';
  3  | import { applyCommand, serializeGame } from '@theandril/sim';
  4  | import { exportSave } from '@theandril/persistence';
  5  | import { attunementCampaign } from '../../packages/test-fixtures/src/victory-fixture';
  6  | import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';
  7  | import { closeManagement, openRealmAffairs } from './ui-navigation';
  8  | 
  9  | const roster = (page: Page) => page.getByRole('dialog', { name: 'Characters & agents', exact: true });
  10 | 
  11 | /** Rules 40: a besieged realm's lodged Waykeeper wards the hearth through the
  12 |  * real character sheet, the ashglass is spent, the ledger marks the walls and
  13 |  * the besieger's works fail to wear them down. */
  14 | test('ward a besieged hearth through its lodged Waykeeper and read the held walls', async ({ page }, testInfo) => {
  15 |   const errors: string[] = [];
  16 |   page.on('pageerror', error => errors.push(error.message));
  17 |   const state = attunementCampaign(), player = state.turnOwnerId, rival = state.factions[1]!.id;
  18 |   const host = Object.values(state.settlements).find(town => town.factionId === player)!;
  19 |   const caster = Object.values(state.characters).find(item => item.factionId === player && item.definitionId === 'character.waykeeper')!;
  20 |   state.resources.stockpiles[player]!['resource.ashglass'] = 20;
  21 |   const column = Object.values(state.armies).find(army => army.factionId === rival)!;
  22 |   column.cell = neighbors(host.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell] ?? 0) && Object.values(state.armies).every(army => army.cell !== cell))!;
  23 |   column.movement = 3; refreshAuthoredSight(state);
  24 |   expect(applyCommand(state, { type: 'declareWar', factionId: rival, targetFactionId: player })).toMatchObject({ ok: true });
  25 |   expect(applyCommand(state, { type: 'besiege', factionId: rival, armyId: column.id, settlementId: host.id })).toMatchObject({ ok: true });
  26 |   await page.goto('/');
  27 |   // The unbundled dev page and the module worker together exceed Chromium's in-flight request budget; let the page settle first.
  28 |   await page.waitForLoadState('networkidle');
  29 |   await page.locator('input[type=file]').setInputFiles({ name: 'warded-hearth.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
> 30 |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
     |                                              ^ Error: expect(locator).toContainText(expected) failed
  31 |   await closeManagement(page);
  32 | 
  33 |   await page.getByRole('button', { name: 'Characters & agents', exact: true }).click();
  34 |   await roster(page).getByRole('searchbox', { name: 'Search characters', exact: true }).fill(caster.name);
  35 |   await roster(page).getByRole('button', { name: `Inspect ${caster.name} (${caster.id})`, exact: true }).click();
  36 |   const rites = roster(page).getByTestId('strategic-rites');
  37 |   await expect(rites).toContainText('Seam warding');
  38 |   await expect(rites).toContainText(`6 ashglass · 10 turns · at ${host.name}`);
  39 |   await rites.screenshot({ path: testInfo.outputPath('rite-offered.png') });
  40 |   await rites.getByRole('button', { name: 'Perform Seam warding', exact: true }).click();
  41 |   await expect(rites.getByTestId(`ward-${host.id}`)).toContainText(`stands over ${host.name}: 10 turns remaining.`);
  42 |   await expect(rites).toContainText('This hearth is already warded.');
  43 |   await expect(rites.getByRole('button', { name: 'Perform Seam warding', exact: true })).toBeDisabled();
  44 |   await rites.screenshot({ path: testInfo.outputPath('rite-performed.png') });
  45 |   await roster(page).getByRole('button', { name: 'Close characters', exact: true }).click();
  46 | 
  47 |   // The ledger marks the warded walls; the besieger reads them too and, unable to storm them, lifts the siege on its turn.
  48 |   await openRealmAffairs(page);
  49 |   const ledger = page.getByLabel('Known sieges', { exact: true });
  50 |   await expect(ledger).toContainText(host.name);
  51 |   await expect(ledger).toContainText('30 · warded');
  52 |   await ledger.screenshot({ path: testInfo.outputPath('warded-ledger.png') });
  53 |   await closeManagement(page);
  54 |   await page.getByRole('button', { name: 'End turn', exact: true }).click();
  55 |   await expect(page.getByTestId('turn-counter')).toHaveText('Turn 2');
  56 |   expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.sieges.length)).toBe(0);
  57 |   expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.wards?.map(ward => ward.remainingTurns))).toEqual([9]);
  58 |   expect(errors).toEqual([]);
  59 | });
  60 | 
```