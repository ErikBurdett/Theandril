# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: supply-access.spec.ts >> built production negotiates foreign harbor supply through portable import, pays once and restores the replenished agreement without development hooks
- Location: tests/production/supply-access.spec.ts:8:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByTestId('feedback')
Expected substring: "Imported campaign"
Received string:    "!The map could not start WebGL: TypeError: Failed to fetch dynamically imported module: http://127.0.0.1:4174/assets/WebGLRenderer-CvYmRMFw.js"
Timeout: 5000ms

Call log:
  - Expect "toContainText" getByTestId('feedback') with timeout 5000ms
  - waiting for getByTestId('feedback')
    3 × locator resolved to <div role="status" class="feedback " aria-live="polite" data-testid="feedback">…</div>
      - unexpected value "◆Resolving… A world of broken oaths awaits a new beginning."
    11 × locator resolved to <div role="alert" aria-live="polite" class="feedback error" data-testid="feedback">…</div>
       - unexpected value "!The map could not start WebGL: TypeError: Failed to fetch dynamically imported module: http://127.0.0.1:4174/assets/WebGLRenderer-CvYmRMFw.js"

```

```yaml
- alert: "The map could not start WebGL: TypeError: Failed to fetch dynamically imported module: http://127.0.0.1:4174/assets/WebGLRenderer-CvYmRMFw.js"
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | import { applyCommand, deserializeGame, getObservation, serializeGame, stateHash } from '@theandril/sim';
  3  | import { exportSave } from '@theandril/persistence';
  4  | import { supplyAccessCampaign } from '../../packages/test-fixtures/src/supply-access-fixture';
  5  | import { exportedTravel } from '../gameplay/group-movement-fixture';
  6  | import { closeCampaignOptions, closeManagement, openRealmAffairs } from '../gameplay/ui-navigation';
  7  | 
  8  | test('built production negotiates foreign harbor supply through portable import, pays once and restores the replenished agreement without development hooks', async ({ page }, testInfo) => {
  9  |   const fixture = supplyAccessCampaign(), errors: string[] = [];
  10 |   page.on('pageerror', error => errors.push(error.message));
  11 |   // This is an explicitly authored overseas position, imported through the
  12 |   // shipped portable-save control. No request, payment or refill is injected.
  13 |   const bytes = Buffer.from(await exportSave(serializeGame(fixture.state)));
  14 |   await page.goto('./');
  15 |   await page.getByLabel('Import save file').setInputFiles({ name: 'overseas-supply.theandril', mimeType: 'application/gzip', buffer: bytes });
  16 |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  17 |   await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  18 |   expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  19 |   const initial = await exportedTravel(page), owner = fixture.buyerId;
  20 |   expect(serializeGame(initial.game)).toBe(serializeGame(fixture.state));
  21 |   expect(initial.archive.records).toHaveLength(0);
  22 |   const originalSupply = getObservation(initial.game, owner).supply;
  23 |   expect(originalSupply.find(row => row.armyId === fixture.fleetId)).toMatchObject({ supplied: false, fleetProvisions: { remaining: 0, refilling: false } });
  24 |   expect(originalSupply.find(row => row.armyId === fixture.fieldId)?.supplied).toBe(false);
  25 | 
  26 |   await page.setViewportSize({ width: 390, height: 844 });
  27 |   await openRealmAffairs(page);
  28 |   const panel = page.getByTestId('supply-access');
  29 |   await panel.getByRole('combobox', { name: 'Supply hearth or harbor', exact: true }).selectOption(fixture.sourceId);
  30 |   await panel.getByRole('spinbutton', { name: 'Supply fee', exact: true }).fill('20');
  31 |   await panel.getByRole('spinbutton', { name: 'Supply term in turns', exact: true }).fill('10');
  32 |   await panel.getByRole('button', { name: 'Review supply terms', exact: true }).focus(); await page.keyboard.press('Enter');
  33 |   await expect(panel.getByTestId('supply-assessment')).toContainText('appears likely');
  34 |   await panel.getByRole('button', { name: 'Send supply request', exact: true }).focus(); await page.keyboard.press('Enter');
  35 |   await expect(panel).toContainText('20 coin across 1 pending requests');
  36 |   const pending = await exportedTravel(page);
  37 |   expect(pending.archive.records.map(record => record.command)).toEqual([fixture.proposal]);
  38 |   expect(pending.game.supplyAccess.agreements).toEqual([]);
  39 |   expect(pending.game.supplyAccess.offers).toHaveLength(1);
  40 |   expect(pending.game.factions.map(faction => faction.treasury)).toEqual(initial.game.factions.map(faction => faction.treasury));
  41 | 
  42 |   await closeManagement(page); await closeCampaignOptions(page);
  43 |   await page.getByRole('button', { name: 'End turn', exact: true }).click();
  44 |   await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${pending.game.turn + 1}`);
  45 |   await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  46 |   const active = await exportedTravel(page), agreement = active.game.supplyAccess.agreements[0]!;
  47 |   const accepted = { type: 'respondSupplyAccess' as const, factionId: fixture.providerId, offerId: pending.game.supplyAccess.offers[0]!.id, accept: true };
  48 |   expect(active.archive.records.slice(pending.archive.records.length).map(record => record.command)).toEqual([
  49 |     accepted, { type: 'endTurn', factionId: owner },
  50 |   ]);
  51 |   // End turn includes ordinary income/upkeep. Reproduce its actual archived
  52 |   // commands to verify the exact payment before those economic changes.
  53 |   const serial = deserializeGame(serializeGame(pending.game));
  54 |   const buyerBefore = serial.factions.find(faction => faction.id === owner)!.treasury;
  55 |   const providerBefore = serial.factions.find(faction => faction.id === fixture.providerId)!.treasury;
  56 |   expect(applyCommand(serial, accepted).ok).toBe(true);
  57 |   expect(serial.factions.find(faction => faction.id === owner)!.treasury).toBe(buyerBefore - 20);
  58 |   expect(serial.factions.find(faction => faction.id === fixture.providerId)!.treasury).toBe(providerBefore + 20);
  59 |   expect(applyCommand(serial, { type: 'endTurn', factionId: owner }).ok).toBe(true);
  60 |   expect(serializeGame(active.game)).toBe(serializeGame(serial));
  61 |   expect(active.game.supplyAccess.offers).toEqual([]);
  62 |   expect(active.game.supplyAccess.agreements).toHaveLength(1);
  63 |   expect(agreement).toMatchObject({ buyerId: owner, providerId: fixture.providerId, feeCoin: 20, termTurns: 10,
  64 |     startedTurn: pending.game.turn, expiresTurn: pending.game.turn + 10,
  65 |     source: { settlementId: fixture.sourceId, name: initial.game.settlements[fixture.sourceId]!.name, cell: initial.game.settlements[fixture.sourceId]!.cell, harbor: true } });
  66 |   const supplied = getObservation(active.game, owner).supply;
  67 |   for (const armyId of [fixture.fleetId, fixture.cargoId, fixture.fieldId]) expect(supplied.find(row => row.armyId === armyId)).toMatchObject({ supplied: true, sourceSettlementId: fixture.sourceId });
  68 |   for (const armyId of [fixture.fleetId, fixture.cargoId]) expect(supplied.find(row => row.armyId === armyId)?.fleetProvisions).toMatchObject({ remaining: 8, refilling: true });
  69 |   expect(active.game.armies[fixture.fieldId]!.formations.map(formation => formation.strength)).toEqual(pending.game.armies[fixture.fieldId]!.formations.map(formation => formation.strength));
  70 | 
  71 |   await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  72 |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  73 |   await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  74 |   await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  75 |   const restored = await exportedTravel(page);
  76 |   expect(stateHash(restored.game)).toBe(stateHash(active.game)); expect(restored.archive).toEqual(active.archive);
  77 |   await page.reload();
  78 |   await page.getByLabel('Import save file').setInputFiles({ name: 'paid-supply.theandril', mimeType: 'application/gzip', buffer: active.bytes });
> 79 |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
     |                                              ^ Error: expect(locator).toContainText(expected) failed
  80 |   const portable = await exportedTravel(page);
  81 |   expect(serializeGame(portable.game)).toBe(serializeGame(active.game)); expect(portable.archive).toEqual(active.archive);
  82 |   await openRealmAffairs(page);
  83 |   const card = page.getByTestId(`supply-agreement-${agreement.id}`);
  84 |   await expect(card).toContainText('20 coin paid');
  85 |   await expect(card).toContainText(`ends before supply is resolved on turn ${agreement.expiresTurn}`);
  86 |   await card.scrollIntoViewIfNeeded();
  87 |   await page.screenshot({ path: testInfo.outputPath('production-supply-agreement-restored-narrow.png') });
  88 |   expect(await panel.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  89 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  90 |   expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  91 |   expect(errors).toEqual([]);
  92 | });
  93 | 
```