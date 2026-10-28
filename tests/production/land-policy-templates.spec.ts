import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { replayArchive, resumeJournal } from '@theandril/chronicle';
import { deserializeGame, getObservation, serializeGame, stateHash } from '@theandril/sim';
import { campaignMenu, exportedTravel } from '../gameplay/group-movement-fixture';
import { openRegistry, openSelectedOrders, selectFromRegistry } from '../gameplay/ui-navigation';

async function begin(page: Page, name: string) {
  await page.getByRole('textbox', { name: 'World seed', exact: true }).fill('20260905');
  await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption('tiny');
  await page.getByRole('combobox', { name: 'Campaign pace', exact: true }).selectOption('short');
  await page.getByRole('spinbutton', { name: 'Faction count', exact: true }).fill('2');
  await page.getByRole('spinbutton', { name: 'City-states', exact: true }).fill('0');
  await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  await selectFromRegistry(page, 'armies', /Hearth caravan/); await openSelectedOrders(page);
  await page.getByRole('textbox', { name: 'Settlement name', exact: true }).fill(name);
  await page.getByRole('button', { name: 'Found settlement', exact: true }).click();
  await selectFromRegistry(page, 'settlements', name); await openSelectedOrders(page);
  const workers = page.getByTestId('worker-policy'); await workers.locator(':scope > summary').click();
  await workers.getByRole('combobox', { name: 'Worker priority', exact: true }).selectOption('food');
  await workers.getByRole('button', { name: 'Apply worker policy', exact: true }).click();
  await expect(workers.locator(':scope > summary')).toContainText('Food');
}

async function libraryPanel(page: Page, select = false) {
  await openRegistry(page, 'settlements');
  if (select) await page.getByTestId('group-charters').getByRole('button', { name: 'Select matching hearths', exact: true }).click();
  const group = page.getByTestId('group-land-policies');
  if (await group.getAttribute('open') === null) await group.locator(':scope > summary').click();
  const library = page.getByTestId('land-policy-templates');
  if (await library.getAttribute('open') === null) await library.locator(':scope > summary').click();
  const saved = library.getByRole('combobox', { name: 'Saved land commission template', exact: true });
  await expect(saved).toBeEnabled();
  return { group, library, saved };
}

const allowance = (page: Page) => page.getByTestId('group-land-policies').getByRole('textbox', { name: 'Allowance per hearth · coin', exact: true });
const reserve = (page: Page) => page.getByTestId('group-land-policies').getByRole('textbox', { name: 'Shared treasury reserve · coin', exact: true });

test('personal land budgets cross generated campaigns and reloads without orders until explicit paid application, then deletion leaves exact saved work intact', async ({ page }, testInfo) => {
  mkdirSync(testInfo.outputDir, { recursive: true });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('./'); expect(await page.evaluate(() => '__THEANDRIL__' in window)).toBe(false);
  await begin(page, 'First budget hearth');
  const first = await exportedTravel(page);
  let { group, library, saved } = await libraryPanel(page);
  await expect(group).toContainText('0 hearths selected');
  await group.getByRole('combobox', { name: 'Group commission improvement', exact: true }).selectOption('improvement.terraced_fields');
  await allowance(page).fill('50'); await reserve(page).fill('10');
  await library.getByRole('textbox', { name: 'Template name', exact: true }).fill('Terraced farms');
  await library.getByRole('button', { name: 'Save new template', exact: true }).click();
  await expect(saved.getByRole('option', { name: 'Terraced farms', exact: true })).toHaveCount(1);
  const templateId = (await saved.inputValue()); expect(templateId).toBeTruthy();
  await allowance(page).fill('75'); await reserve(page).fill('12');
  await library.getByRole('textbox', { name: 'Template name', exact: true }).fill('Careful terraces');
  await page.getByTestId('group-charters').getByRole('button', { name: 'Select matching hearths', exact: true }).click();
  const applyBeforeWrite = group.getByRole('button', { name: 'Apply land commissions (1)', exact: true });
  const registryFilter = page.getByRole('combobox', { name: 'Land commission status', exact: true });
  await expect(applyBeforeWrite).toBeEnabled(); await expect(registryFilter).toBeEnabled();
  const sharedLock = Promise.all([applyBeforeWrite, registryFilter].map(control => control.evaluate(element => new Promise<boolean>((resolve, reject) => {
    const field = element as HTMLButtonElement | HTMLSelectElement;
    const observer = new MutationObserver(() => {
      if (field.disabled) { observer.disconnect(); clearTimeout(timeout); resolve(true); }
    });
    const timeout = setTimeout(() => { observer.disconnect(); reject(new Error('Native template write did not lock the shared order controls.')); }, 3000);
    observer.observe(field, { attributes: true, attributeFilter: ['disabled'] });
  }))));
  await library.getByRole('button', { name: 'Update template', exact: true }).click();
  expect(await sharedLock).toEqual([true, true]);
  await expect(applyBeforeWrite).toBeEnabled(); await expect(registryFilter).toBeEnabled();
  await expect(saved.getByRole('option', { name: 'Careful terraces', exact: true })).toHaveAttribute('value', templateId);
  await expect(saved.getByRole('option', { name: 'Terraced farms', exact: true })).toHaveCount(0);
  await allowance(page).fill('');
  await expect(library.getByRole('button', { name: 'Save new template', exact: true })).toBeDisabled();
  await library.getByRole('button', { name: 'Recall template', exact: true }).click();
  await expect(allowance(page)).toHaveValue('75'); await expect(reserve(page)).toHaveValue('12');
  await expect(library).toContainText('Apply land commissions');
  const untouched = await exportedTravel(page);
  expect(serializeGame(untouched.game)).toBe(serializeGame(first.game)); expect(untouched.archive).toEqual(first.archive);
  expect(serializeGame(untouched.game)).not.toContain(templateId); expect(JSON.stringify(untouched.archive)).not.toContain(templateId);

  await campaignMenu(page); await page.getByRole('button', { name: 'New campaign', exact: true }).click();
  await begin(page, 'Second budget hearth');
  const second = await exportedTravel(page);
  expect(stateHash(second.game)).not.toBe(stateHash(first.game));
  await campaignMenu(page); await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  ({ group, library, saved } = await libraryPanel(page, true));
  await saved.selectOption(templateId);
  await expect(allowance(page)).toHaveValue('100'); await expect(reserve(page)).toHaveValue('40');
  await library.getByRole('button', { name: 'Recall template', exact: true }).click();
  await expect(allowance(page)).toHaveValue('75'); await expect(reserve(page)).toHaveValue('12');
  await library.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('land-budget-template-desktop.png') });
  const recalled = await exportedTravel(page);
  expect(serializeGame(recalled.game)).toBe(serializeGame(second.game)); expect(recalled.archive).toEqual(second.archive);
  await campaignMenu(page); await page.getByRole('combobox', { name: 'Text scale', exact: true }).selectOption('1.3');
  await page.setViewportSize({ width: 390, height: 844 });
  ({ group, library, saved } = await libraryPanel(page, true));
  await saved.selectOption(templateId);
  const recall = library.getByRole('button', { name: 'Recall template', exact: true });
  await recall.focus(); await page.keyboard.press('Enter');
  await recall.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  const bounds = await recall.evaluate(element => {
    const control = element.getBoundingClientRect(), frame = element.closest('.campaign-window-body')!.getBoundingClientRect();
    return { control: control.toJSON(), frame: frame.toJSON(), overflow: document.documentElement.scrollWidth - innerWidth };
  });
  expect(bounds.control.height).toBeGreaterThanOrEqual(44); expect(bounds.overflow).toBeLessThanOrEqual(1);
  expect(bounds.control.left).toBeGreaterThanOrEqual(bounds.frame.left); expect(bounds.control.right).toBeLessThanOrEqual(bounds.frame.right);
  expect(bounds.control.top).toBeGreaterThanOrEqual(bounds.frame.top); expect(bounds.control.bottom).toBeLessThanOrEqual(bounds.frame.bottom);
  await page.screenshot({ path: testInfo.outputPath('land-budget-template-narrow-130.png') });
  await group.getByRole('button', { name: 'Apply land commissions (1)', exact: true }).click();
  await expect(page.getByTestId('group-land-policy-results')).toContainText('1 orders accepted · 0 refused');
  const paid = await exportedTravel(page), factionId = second.game.turnOwnerId;
  const town = Object.values(second.game.settlements).find(item => item.factionId === factionId)!;
  const expected = deserializeGame(serializeGame(second.game)), journal = resumeJournal(expected, second.archive);
  expect(journal.record(expected, { type: 'setLandPolicy', factionId, settlementId: town.id, improvementId: 'improvement.terraced_fields', allowance: 75, reserve: 12 }).ok).toBe(true);
  expect(serializeGame(paid.game)).toBe(serializeGame(expected)); expect(paid.archive).toEqual(journal.materialize());
  expect(serializeGame(replayArchive(paid.archive))).toBe(serializeGame(expected));
  const work = paid.game.land.settlements[town.id]!.work!; expect(work.coinCost).toBeGreaterThan(0);
  expect(getObservation(paid.game, factionId).treasury).toBe(getObservation(second.game, factionId).treasury - work.coinCost);
  expect(paid.game.landPolicies.find(policy => policy.settlementId === town.id)).toMatchObject({ allowance: 75 - work.coinCost, reserve: 12 });
  expect(paid.archive.records).toHaveLength(second.archive.records.length + 1);
  await campaignMenu(page); await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  ({ library, saved } = await libraryPanel(page));
  await saved.selectOption(templateId); await library.getByRole('button', { name: 'Delete template', exact: true }).click();
  await expect(saved.getByRole('option', { name: 'Careful terraces', exact: true })).toHaveCount(0);
  const deleted = await exportedTravel(page);
  expect(serializeGame(deleted.game)).toBe(serializeGame(paid.game)); expect(deleted.archive).toEqual(paid.archive);
  await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  ({ saved } = await libraryPanel(page));
  await expect(saved.getByRole('option', { name: 'Careful terraces', exact: true })).toHaveCount(0);
  const restored = await exportedTravel(page);
  expect(serializeGame(restored.game)).toBe(serializeGame(paid.game)); expect(restored.archive).toEqual(paid.archive);
  writeFileSync(testInfo.outputPath('land-budget-template-restored.theandril'), restored.bytes);
  writeFileSync(testInfo.outputPath('land-budget-template-evidence.json'), JSON.stringify({ generated: 'Two separate ordinary UI starts: seed20260905/tiny/short/two realms/no city-states; founding and Food worker orders, no authored campaign fields', firstHash: stateHash(first.game), untouchedHash: stateHash(untouched.game), secondHash: stateHash(second.game), recalledHash: stateHash(recalled.game), paidHash: stateHash(paid.game), restoredHash: stateHash(restored.game), templateId, allowance: 75, reserve: 12, paidCoin: work.coinCost, extraCampaignCommands: 1, templateExcludedFromCampaign: true, bounds }, null, 2) + '\n');
  expect(errors).toEqual([]);
});

test('denied personal-template storage reports an error and an explicit retry recovers without campaign orders', async ({ page }, testInfo) => {
  mkdirSync(testInfo.outputDir, { recursive: true });
  await page.addInitScript(() => {
    const original = indexedDB.open.bind(indexedDB);
    (window as unknown as { denyLandTemplates: boolean }).denyLandTemplates = true;
    indexedDB.open = ((name: string, version?: number) => {
      if (name === 'theandril-land-policy-templates' && (window as unknown as { denyLandTemplates: boolean }).denyLandTemplates) throw new DOMException('Deliberate template-storage denial', 'SecurityError');
      return version === undefined ? original(name) : original(name, version);
    }) as typeof indexedDB.open;
  });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('./'); await begin(page, 'Storage recovery hearth');
  const before = await exportedTravel(page);
  await openRegistry(page, 'settlements');
  const group = page.getByTestId('group-land-policies'); await group.locator(':scope > summary').click();
  const library = page.getByTestId('land-policy-templates'); await library.locator(':scope > summary').click();
  await expect(library.getByRole('alert')).toContainText('could not be loaded');
  await expect(library.getByRole('button', { name: 'Save new template', exact: true })).toBeDisabled();
  await expect(allowance(page)).toBeEnabled();
  await expect(page.getByRole('combobox', { name: 'Land commission status', exact: true })).toBeEnabled();
  await page.evaluate(() => { (window as unknown as { denyLandTemplates: boolean }).denyLandTemplates = false; });
  await library.getByRole('button', { name: 'Retry templates', exact: true }).click();
  await expect(library.getByRole('combobox', { name: 'Saved land commission template', exact: true })).toBeEnabled();
  await expect(library.getByRole('alert')).toHaveCount(0);
  await allowance(page).fill('0'); await reserve(page).fill('0');
  await library.getByRole('textbox', { name: 'Template name', exact: true }).fill('Paused spending');
  await library.getByRole('button', { name: 'Save new template', exact: true }).click();
  await expect(library.getByRole('option', { name: 'Paused spending', exact: true })).toHaveCount(1);
  await library.scrollIntoViewIfNeeded(); await page.screenshot({ path: testInfo.outputPath('land-budget-storage-recovered.png') });
  const after = await exportedTravel(page);
  expect(serializeGame(after.game)).toBe(serializeGame(before.game)); expect(after.archive).toEqual(before.archive);
  writeFileSync(testInfo.outputPath('land-budget-storage-evidence.json'), JSON.stringify({ fault: 'Only personal land-template indexedDB.open throws SecurityError until explicit restoration/retry; campaign DB remains native', beforeHash: stateHash(before.game), afterHash: stateHash(after.game), campaignOrdersAdded: 0, zeroBudgetSaved: true }, null, 2) + '\n');
  expect(errors).toEqual([]);
});
