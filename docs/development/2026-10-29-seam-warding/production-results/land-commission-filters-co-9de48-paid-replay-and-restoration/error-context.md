# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: land-commission-filters.spec.ts >> commission filters find zero allowances beyond page one and revise only those budgets with exact paid replay and restoration
- Location: tests/production/land-commission-filters.spec.ts:12:1

# Error details

```
Error: locator.click: Target crashed 
Call log:
  - waiting for getByTestId('group-charters').getByRole('button', { name: 'Select matching hearths', exact: true })
    - locator resolved to <button>Select matching hearths</button>
  - attempting click action
    - waiting for element to be visible, enabled and stable

```

# Test source

```ts
  1   | import { mkdirSync, writeFileSync } from 'node:fs';
  2   | import { expect, test } from '@playwright/test';
  3   | import { createJournal, replayArchive, resumeJournal } from '@theandril/chronicle';
  4   | import { applyCommand, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand } from '@theandril/sim';
  5   | import { exportSave, serializeCampaign } from '@theandril/persistence';
  6   | import { empireDelegationCampaign } from '../../packages/test-fixtures/src/empire-delegation-fixture';
  7   | import { campaignMenu, exportedTravel } from '../gameplay/group-movement-fixture';
  8   | import { openRegistry, openSelectedOrders } from '../gameplay/ui-navigation';
  9   | 
  10  | const improvementId = 'improvement.terraced_fields';
  11  | 
  12  | test('commission filters find zero allowances beyond page one and revise only those budgets with exact paid replay and restoration', async ({ page }, testInfo) => {
  13  |   mkdirSync(testInfo.outputDir, { recursive: true });
  14  |   const fixture = empireDelegationCampaign(), game = fixture.game, factionId = game.turnOwnerId;
  15  |   const towns = Object.values(game.settlements).filter(town => town.factionId === factionId).sort((a, b) => a.id.localeCompare(b.id));
  16  |   const issue = (command: GameCommand) => expect(applyCommand(game, command).ok).toBe(true);
  17  |   // Disclosed authored mature realm and finite purse. Every worker and policy
  18  |   // below is installed through an ordinary command; paid works are not authored.
  19  |   game.factions.find(faction => faction.id === factionId)!.treasury = 100;
  20  |   for (const town of towns) issue({ type: 'setWorkerPolicy', factionId, settlementId: town.id, focus: 'food' });
  21  |   const zeroTowns = [towns[0]!, towns[1]!, ...towns.slice(27)];
  22  |   for (const town of zeroTowns.slice(1)) issue({ type: 'setLandPolicy', factionId, settlementId: town.id, improvementId, allowance: 0, reserve: 10 });
  23  |   for (const town of towns.slice(21, 24)) issue({ type: 'setLandPolicy', factionId, settlementId: town.id, improvementId, allowance: 100, reserve: 100 });
  24  |   for (const town of towns.slice(24, 27)) issue({ type: 'setLandPolicy', factionId, settlementId: town.id, improvementId, allowance: 1, reserve: 0 });
  25  |   issue({ type: 'setLandPolicy', factionId, settlementId: towns[0]!.id, improvementId, allowance: 22, reserve: 0 });
  26  |   expect(game.land.settlements[towns[0]!.id]!.work?.coinCost).toBe(22);
  27  |   const initialView = getObservation(game, factionId, { landDetails: 'none', developmentCandidates: false });
  28  |   expect(initialView.treasury).toBe(78);
  29  |   expect(initialView.landPolicies).toHaveLength(11);
  30  |   expect(initialView.landPolicies!.filter(policy => policy.allowance === 0)).toHaveLength(5);
  31  |   expect(initialView.landPolicies!.filter(policy => policy.blocker !== null)).toHaveLength(8);
  32  |   expect(initialView.landPolicies!.find(policy => policy.settlementId === towns[24]!.id)?.blocker).toBeNull();
  33  |   const archive = createJournal(game, { mode: 'player', coverage: 'from-save' }).materialize();
  34  |   const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  35  |   await page.goto('./');
  36  |   expect(await page.evaluate(() => '__THEANDRIL__' in window)).toBe(false);
  37  |   await page.getByLabel('Import save file').setInputFiles({ name: 'commission-filter-realm.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeCampaign(game, archive))) });
  38  |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  39  |   await openRegistry(page, 'settlements');
  40  |   const filter = page.getByRole('combobox', { name: 'Land commission status', exact: true });
  41  |   const production = page.getByRole('combobox', { name: 'Settlement orders', exact: true });
  42  |   const search = page.getByRole('searchbox', { name: 'Search your realm', exact: true });
  43  |   const registry = page.getByTestId('settlement-registry');
  44  |   const group = page.getByTestId('group-charters'), policies = page.getByTestId('group-land-policies');
  45  |   const counts = ['All hearths (30)', 'With commissions (11)', 'Without commissions (19)', 'Zero allowance (5)', 'Reported waits (8)'];
  46  |   await expect(filter.locator('option')).toHaveText(counts);
  47  |   await expect(registry.getByRole('button')).toHaveCount(25);
  48  |   await expect(registry.getByRole('button', { name: new RegExp(towns[29]!.name) })).toHaveCount(0);
  49  |   await registry.getByRole('checkbox', { name: `Select ${towns[24]!.name} for group orders`, exact: true }).check();
  50  |   await filter.focus(); await page.keyboard.press('End'); await page.keyboard.press('ArrowUp'); await page.keyboard.press('Enter');
  51  |   await expect(filter).toHaveValue('exhausted');
  52  |   await expect(registry.getByRole('button')).toHaveCount(5);
  53  |   await expect(registry).toContainText(towns[29]!.name);
  54  |   await expect(registry).toContainText('Existing paid land work must finish first.');
  55  |   await group.getByRole('button', { name: 'Select matching hearths', exact: true }).click();
  56  |   await expect(policies).toContainText('6 hearths selected · 1 outside this filter');
  57  |   await filter.selectOption('waiting');
  58  |   await expect(registry.getByRole('button')).toHaveCount(8);
  59  |   await expect(registry).toContainText('100 coin reserve');
  60  |   await expect(registry).not.toContainText(towns[24]!.name);
  61  |   await production.selectOption('unchartered');
  62  |   await expect(filter.locator('option')).toHaveText(['All hearths (0)', 'With commissions (0)', 'Without commissions (0)', 'Zero allowance (0)', 'Reported waits (0)']);
  63  |   await expect(registry).toContainText('No matching entries');
  64  |   await expect(policies).toContainText('6 hearths selected · 6 outside this filter');
  65  |   await production.selectOption('all'); await filter.selectOption('exhausted');
  66  |   await search.fill(towns[29]!.name);
  67  |   await expect(filter.locator('option')).toHaveText(['All hearths (1)', 'With commissions (1)', 'Without commissions (0)', 'Zero allowance (1)', 'Reported waits (1)']);
  68  |   await expect(policies).toContainText('6 hearths selected · 5 outside this filter');
  69  |   await search.fill('');
  70  |   await filter.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  71  |   await page.screenshot({ path: testInfo.outputPath('commission-filter-desktop.png') });
  72  |   // Browsing/filtering cannot issue orders or alter the journal.
  73  |   const browsed = await exportedTravel(page);
  74  |   expect(serializeGame(browsed.game)).toBe(serializeGame(game)); expect(browsed.archive).toEqual(archive);
  75  | 
  76  |   // A null compact blocker is not an affordability promise. Inspect the ordinary
  77  |   // selected-hearth query, including when no suitable tile currently exists.
  78  |   await openRegistry(page, 'settlements'); await filter.selectOption('commissioned');
  79  |   await search.fill(towns[24]!.name); await registry.getByRole('button', { name: new RegExp(towns[24]!.name) }).click();
  80  |   await openSelectedOrders(page);
  81  |   await expect(page.getByTestId('land-panel')).toHaveAttribute('data-query-state', 'ready');
  82  |   const detail = page.getByTestId('land-policy'); await detail.locator(':scope > summary').click();
  83  |   const exactReason = getObservation(game, factionId).land.settlements.find(town => town.settlementId === towns[24]!.id)!.landPolicyChoice!.blocker!;
  84  |   expect(exactReason).toBeTruthy(); await expect(page.getByTestId('land-policy-status')).toContainText(exactReason);
  85  | 
  86  |   await campaignMenu(page); await page.getByRole('combobox', { name: 'Text scale', exact: true }).selectOption('1.3');
  87  |   await page.setViewportSize({ width: 390, height: 844 });
  88  |   await openRegistry(page, 'settlements'); await search.fill(''); await filter.selectOption('exhausted');
> 89  |   await group.getByRole('button', { name: 'Select matching hearths', exact: true }).click();
      |                                                                                     ^ Error: locator.click: Target crashed 
  90  |   await expect(policies).toContainText('5 hearths selected');
  91  |   await filter.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  92  |   const bounds = await filter.evaluate(element => {
  93  |     const control = element.getBoundingClientRect(), frame = element.closest('.campaign-window-body')!.getBoundingClientRect();
  94  |     return { control: control.toJSON(), frame: frame.toJSON(), overflow: document.documentElement.scrollWidth - innerWidth };
  95  |   });
  96  |   expect(bounds.control.height).toBeGreaterThanOrEqual(44);
  97  |   expect(bounds.control.left).toBeGreaterThanOrEqual(bounds.frame.left); expect(bounds.control.right).toBeLessThanOrEqual(bounds.frame.right);
  98  |   expect(bounds.control.top).toBeGreaterThanOrEqual(bounds.frame.top); expect(bounds.control.bottom).toBeLessThanOrEqual(bounds.frame.bottom);
  99  |   expect(bounds.overflow).toBeLessThanOrEqual(1);
  100 |   await page.screenshot({ path: testInfo.outputPath('commission-filter-narrow-130.png') });
  101 |   await policies.locator(':scope > summary').click();
  102 |   await policies.getByRole('textbox', { name: 'Allowance per hearth · coin', exact: true }).fill('100');
  103 |   await policies.getByRole('textbox', { name: 'Shared treasury reserve · coin', exact: true }).fill('10');
  104 |   const pending = filter.evaluate(element => new Promise<boolean>((resolve, reject) => {
  105 |     const control = element as HTMLSelectElement;
  106 |     const observer = new MutationObserver(() => { if (control.disabled) { observer.disconnect(); clearTimeout(timeout); resolve(true); } });
  107 |     const timeout = setTimeout(() => { observer.disconnect(); reject(new Error('Commission filter did not lock during paid group order.')); }, 3000);
  108 |     observer.observe(control, { attributes: true, attributeFilter: ['disabled'] });
  109 |   }));
  110 |   await policies.getByRole('button', { name: 'Apply land commissions (5)', exact: true }).click();
  111 |   expect(await pending).toBe(true);
  112 |   await expect(page.getByTestId('group-land-policy-results')).toContainText('5 orders accepted · 0 refused');
  113 |   await expect(filter).toBeEnabled(); await expect(registry).toContainText('No matching entries');
  114 |   await expect(filter.locator('option[value="exhausted"]')).toHaveText('Zero allowance (0)');
  115 |   await expect(policies).toContainText('0 hearths selected');
  116 |   const expected = deserializeGame(serializeGame(game)), journal = resumeJournal(expected, archive);
  117 |   for (const town of zeroTowns.sort((a, b) => a.id.localeCompare(b.id))) expect(journal.record(expected, { type: 'setLandPolicy', factionId, settlementId: town.id, improvementId, allowance: 100, reserve: 10 }).ok).toBe(true);
  118 |   const changed = await exportedTravel(page);
  119 |   expect(serializeGame(changed.game)).toBe(serializeGame(expected)); expect(changed.archive).toEqual(journal.materialize());
  120 |   expect(changed.archive.records).toHaveLength(5);
  121 |   expect(serializeGame(replayArchive(changed.archive))).toBe(serializeGame(expected));
  122 |   expect(changed.game.land.settlements[towns[0]!.id]!.work).toEqual(game.land.settlements[towns[0]!.id]!.work);
  123 |   expect(changed.game.land.settlements[towns[1]!.id]!.work?.coinCost).toBe(22);
  124 |   expect(changed.game.landPolicies.find(policy => policy.settlementId === towns[24]!.id)).toEqual(game.landPolicies.find(policy => policy.settlementId === towns[24]!.id));
  125 |   await campaignMenu(page); await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  126 |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  127 |   await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  128 |   await expect(page.getByTestId('feedback')).toContainText('Campaign restored');
  129 |   await openRegistry(page, 'settlements'); await expect(filter).toHaveValue('all');
  130 |   await expect(filter.locator('option[value="exhausted"]')).toHaveText('Zero allowance (0)');
  131 |   const restored = await exportedTravel(page);
  132 |   expect(serializeGame(restored.game)).toBe(serializeGame(expected)); expect(restored.archive).toEqual(changed.archive);
  133 |   writeFileSync(testInfo.outputPath('commission-filter-restored.theandril'), restored.bytes);
  134 |   writeFileSync(testInfo.outputPath('commission-filter-evidence.json'), JSON.stringify({ authored: fixture.authored, extraSetup: '100 coin authored purse; ordinary Food worker policies and eleven ordinary land commissions; first work paid22 before from-save archive', counts, initialHash: stateHash(game), browsedHash: stateHash(browsed.game), finalHash: stateHash(restored.game), submittedIds: zeroTowns.map(town => town.id), records: changed.archive.records.length, initialTreasury: 78, finalTreasury: getObservation(restored.game, factionId).treasury, exactReason, bounds, canonicalAndArchiveUnchangedByBrowsing: true, exactReplay: true }, null, 2) + '\n');
  135 |   expect(errors).toEqual([]);
  136 | });
  137 | 
```