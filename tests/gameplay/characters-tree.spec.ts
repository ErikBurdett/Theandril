import { expect, test, type Page } from '@playwright/test';
import { applyCommand, deserializeGame, serializeGame } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { characterCampaign, CHARACTER_FIXTURE as C } from '../../packages/test-fixtures/src/character-fixture';

async function preparedOfficer(page: Page, definitionId: string, experience: number) {
  let game = characterCampaign();
  const recruited = applyCommand(game, { type: 'recruitCharacter', factionId: game.turnOwnerId, settlementId: C.homeId, definitionId });
  if (!recruited.ok) throw new Error(recruited.error);
  const character = Object.values(game.characters)[0]!;
  character.experience = experience; // Authored veteran readiness; all tree purchases are actual UI commands.
  game = deserializeGame(serializeGame(game));
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'veteran-officer.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await page.getByRole('button', { name: 'Characters & agents', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Characters & agents', exact: true });
  await dialog.getByRole('button', { name: `Inspect ${character.name} (${character.id})`, exact: true }).click();
  await dialog.getByRole('combobox', { name: 'Assign to army', exact: true }).selectOption(C.armyId);
  await dialog.getByRole('button', { name: 'Assign character', exact: true }).click();
  await expect.poll(() => page.evaluate(id => window.__THEANDRIL__!.getSummary()!.characters.find(character => character.id === id)?.location, character.id)).toEqual({ kind: 'army', armyId: C.armyId });
  return { dialog, character, tree: dialog.getByTestId('character-skill-tree') };
}

test('a veteran traces cross-branch prerequisites, spends experience once and retains focus and real command effects', async ({ page }, testInfo) => {
  const { dialog, character, tree } = await preparedOfficer(page, 'character.marshal', 96);
  const initialHash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  const roadmap = tree.getByRole('navigation', { name: 'Skill roadmap', exact: true });
  await expect(roadmap.getByRole('button')).toHaveCount(8);
  await expect(roadmap.getByRole('button', { name: 'Inspect skill Witnessed assault', exact: true })).toBeVisible();
  await expect(roadmap.getByRole('button', { name: 'Inspect skill Last standard', exact: true })).toBeVisible();
  await roadmap.scrollIntoViewIfNeeded();
  await dialog.screenshot({ path: testInfo.outputPath('commander-whole-skill-roadmap.png') });
  await tree.getByRole('button', { name: 'Inspect skill Field orders', exact: true }).focus();
  await page.keyboard.press('Enter');
  const field = tree.getByTestId('skill-skill.field_orders');
  await expect(field).toBeFocused();
  await expect(field).toHaveAttribute('data-state', 'locked');
  await field.getByRole('button', { name: 'View prerequisite Muster rolls', exact: true }).click();
  const muster = tree.getByTestId('skill-skill.muster_rolls');
  await expect(muster).toBeFocused();
  await expect(muster).toContainText('Requires either: Keeper of the line or Decisive orders');
  await muster.getByRole('button', { name: 'View prerequisite Decisive orders', exact: true }).click();
  const decisive = tree.getByTestId('skill-skill.decisive');
  await expect(decisive).toBeFocused();
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(initialHash);
  await decisive.getByRole('button', { name: 'Promote Decisive orders', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(decisive).toHaveAttribute('data-state', 'learned');
  await expect(decisive).toBeFocused();
  await expect(tree.getByTestId('skill-skill.steadfast')).toContainText('Permanently excluded by Decisive orders');
  await tree.getByRole('button', { name: 'Inspect skill Unbroken line', exact: true }).click();
  await expect(tree.getByTestId('skill-skill.unbroken_line')).toHaveAttribute('data-state', 'locked');
  await expect(tree.getByTestId('skill-skill.unbroken_line')).toContainText('Keeper of the line · excluded');
  for (const name of ['Muster rolls', 'Field orders', 'Measured advance', 'Witnessed assault']) {
    await tree.getByRole('button', { name: `Inspect skill ${name}`, exact: true }).click();
    await tree.getByRole('button', { name: `Promote ${name}`, exact: true }).click();
    await expect(tree.getByRole('button', { name: `Promote ${name}`, exact: true })).toBeDisabled();
  }
  await expect(tree.getByTestId('available-character-xp')).toHaveText('0 available experience');
  await tree.getByRole('button', { name: 'Inspect skill Field orders', exact: true }).click();
  await expect(field).toHaveAttribute('data-state', 'learned');
  const actual = await page.evaluate(id => ({ character: window.__THEANDRIL__!.getSummary()!.characters.find(character => character.id === id), army: window.__THEANDRIL__!.getSummary()!.ownArmies.find(army => army.id === 'army.2') }), character.id);
  expect(actual.character).toMatchObject({ experience: 0, skillId: 'skill.decisive', learnedSkillIds: ['skill.field_orders', 'skill.measured_advance', 'skill.muster_rolls', 'skill.witnessed_assault'] });
  expect(actual.army).toMatchObject({ formationCapacity: 20, commander: { id: character.id } });
  await dialog.screenshot({ path: testInfo.outputPath('commander-prerequisite-tree.png') });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Characters & agents', exact: true })).toBeFocused();
  await page.getByTestId('campaign-menu').locator('summary').click();
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  const hash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
});

test('a narrow engineering tree explains branch exclusion and its purchased workshop improves a real refit', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const { dialog, tree } = await preparedOfficer(page, 'character.engineer', 30);
  await tree.getByRole('button', { name: 'Inspect skill Column workshops', exact: true }).click();
  const workshops = tree.getByTestId('skill-skill.column_workshops');
  await expect(workshops).toBeFocused();
  await expect(workshops.getByRole('button', { name: 'Promote Column workshops', exact: true })).toBeDisabled();
  await workshops.getByRole('button', { name: 'View prerequisite Patient fieldcraft', exact: true }).click();
  const fieldcraft = tree.getByTestId('skill-skill.fieldcraft');
  await expect(fieldcraft).toBeFocused();
  await fieldcraft.getByRole('button', { name: 'Promote Patient fieldcraft', exact: true }).click();
  await expect(fieldcraft).toHaveAttribute('data-state', 'learned');
  await tree.getByRole('tab', { name: /^Specialization/ }).focus(); await page.keyboard.press('End');
  await expect(tree.getByRole('tab', { name: /^Engineering/ })).toBeFocused();
  const purchase = workshops.getByRole('button', { name: 'Promote Column workshops', exact: true });
  await purchase.scrollIntoViewIfNeeded();
  expect(await purchase.evaluate(element => { const rect = element.getBoundingClientRect(); const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2); return rect.height >= 44 && (hit === element || element.contains(hit)); })).toBe(true);
  await purchase.click(); await expect(workshops).toHaveAttribute('data-state', 'learned');
  await expect(workshops).toBeFocused();
  await expect(tree.getByTestId('available-character-xp')).toHaveText('0 available experience');
  await expect(tree.getByTestId('skill-skill.sapper_watch')).toContainText('Siege craft · excluded');
  expect(await tree.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await dialog.screenshot({ path: testInfo.outputPath('engineer-tree-narrow.png') });
  await dialog.getByRole('combobox', { name: 'Choose mission', exact: true }).selectOption({ label: 'Refit the column' });
  await expect(dialog.getByTestId('mission-preview')).toContainText('10');
  await dialog.getByRole('button', { name: 'Start Refit the column', exact: true }).click();
  await expect(dialog.getByTestId('active-character-mission')).toContainText('2 stationary turns remaining');
  await page.keyboard.press('Escape');
  for (let offset = 0; offset < 2; offset++) {
    const turn = await page.evaluate(() => window.__THEANDRIL__!.getTurn());
    await page.getByRole('button', { name: 'End turn', exact: true }).click();
    await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${turn + 1}`);
  }
  const formation = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.ownArmies.find(army => army.id === 'army.2')!.formations.find(formation => formation.unitId === 'unit.guard'));
  expect(formation?.strength).toBe(35);
});
