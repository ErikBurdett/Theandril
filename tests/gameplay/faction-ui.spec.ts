import { expect, test, type Page, type Locator } from '@playwright/test';
import { FACTIONS } from '@theandril/content';
import { factionArtId } from '@theandril/art-pipeline/runtime';
import { applyCommand, deserializeGame, serializeGame, stateHash } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { characterBattleCampaign, CHARACTER_FIXTURE } from '../../packages/test-fixtures/src/character-fixture';

const art = (scope: Page | Locator, id: string) => scope.locator(`[data-art-id="${id}"]`);
async function approved(icon: Locator): Promise<void> {
  await expect(icon).toHaveAttribute('data-art-state', 'ready');
  await expect(icon).toHaveCSS('background-repeat', 'no-repeat');
  expect(await icon.evaluate(element => getComputedStyle(element).backgroundImage)).toMatch(/^url\("?blob:/);
}
async function begin(page: Page): Promise<void> {
  await page.getByRole('textbox', { name: 'World seed', exact: true }).fill('20260905');
  await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption('tiny');
  await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 1');
}
async function unobstructed(element: Locator): Promise<void> {
  expect(await element.evaluate(node => {
    const rect = node.getBoundingClientRect();
    const inset = 3;
    return [[rect.left + inset, rect.top + inset], [rect.right - inset, rect.top + inset], [rect.left + inset, rect.bottom - inset], [rect.right - inset, rect.bottom - inset]].every(([x, y]) => {
      const target = document.elementFromPoint(x!, y!);
      return x! >= 0 && y! >= 0 && x! < innerWidth && y! < innerHeight && target !== null && (target === node || node.contains(target));
    });
  })).toBe(true);
}

test('six public culture crests are reference art, while campaign heraldry follows only observed faction definitions', async ({ page }, testInfo) => {
  const requests: string[] = [];
  page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/art/')) requests.push(new URL(request.url()).pathname); });
  await page.goto('/');
  const cultures = page.getByTestId('public-cultures');
  await expect(cultures).toContainText('not a player-seat selector');
  await expect(cultures.getByRole('button')).toHaveCount(0);
  await expect(cultures.locator('input,select')).toHaveCount(0);
  for (const faction of FACTIONS) {
    await approved(art(cultures, factionArtId('ui.crest', faction.id)!));
    await expect(cultures.getByRole('heading', { name: faction.name, exact: true })).toBeVisible();
  }
  await cultures.screenshot({ path: testInfo.outputPath('six-public-culture-crests.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  const cards = cultures.locator('article');
  for (let index = 0; index < FACTIONS.length; index++) {
    const card = cards.nth(index);
    await card.evaluate(element => element.scrollIntoView({ block: 'center' }));
    await unobstructed(card);
    await unobstructed(card.locator('[data-art-id]'));
    if (index % 2 === 1) await page.screenshot({ path: testInfo.outputPath(`six-public-culture-crests-narrow-pair-${(index + 1) / 2}.png`) });
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await begin(page);
  await expect(cultures).toHaveCount(0);
  const summary = await page.evaluate(() => window.__THEANDRIL__?.getSummary());
  const own = summary!.factions.find(faction => faction.id === summary!.factionId)!;
  await approved(art(page.locator('.realm-heading'), factionArtId('ui.crest', own.definitionId)!));
  await approved(art(page.locator('.inspector'), factionArtId('ui.banner', own.definitionId)!));
  const known = summary!.factions.filter(faction => faction.id !== summary!.factionId);
  const badges = page.getByTestId('faction-encounters').locator('[data-art-id]');
  await expect(badges).toHaveCount(known.length);
  expect(await badges.evaluateAll(elements => elements.map(element => element.getAttribute('data-art-definition')).sort())).toEqual(known.map(faction => faction.definitionId).sort());
  // One catalog request per DOM/map owner, never per visible UI ornament.
  expect(requests.filter(path => path === '/art/catalog.json').length).toBeLessThanOrEqual(2);
  expect(requests.some(path => path.includes('lab-catalog') || path.includes('preview-'))).toBe(false);
  const hash = await page.evaluate(() => window.__THEANDRIL__?.getStateHash());
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.evaluate(() => window.__THEANDRIL__?.getStateHash())).toBe(hash);
  await testInfo.attach('faction-ui-art-requests.json', { body: JSON.stringify({ requests, observedFactionDefinitions: summary!.factions.map(faction => faction.definitionId), canonicalHash: hash }, null, 2), contentType: 'application/json' });
});

test('renamed realms retain their authored family, real appointments gain role artwork, and hidden foreign characters stay private', async ({ page }, testInfo) => {
  let fixture = characterBattleCampaign();
  fixture.factions[0]!.name = 'Renamed Hearth Council';
  fixture.factions[1]!.name = 'Ashen Pretenders'; // Deliberately misleading: its definition remains Reedbound.
  fixture.factions[1]!.treasury = 200;
  const enemyHome = Object.values(fixture.settlements).find(town => town.factionId === fixture.factions[1]!.id)!;
  const recruited = applyCommand(fixture, { type: 'recruitCharacter', factionId: fixture.factions[1]!.id, settlementId: enemyHome.id, definitionId: 'character.engineer' });
  if (!recruited.ok) throw new Error(recruited.error);
  const hidden = Object.values(fixture.characters).find(character => character.factionId !== fixture.turnOwnerId)!;
  fixture = deserializeGame(serializeGame(fixture));
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'named-faction-art.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(fixture))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign.');
  expect(await page.evaluate(() => window.__THEANDRIL__?.getStateHash())).toBe(stateHash(fixture));
  await expect(page.locator('.realm-heading')).toContainText('Renamed Hearth Council');
  await approved(art(page.locator('.realm-heading'), 'ui.crest.ashen_compact'));
  await approved(art(page.getByTestId('faction-encounters'), 'ui.badge.reedbound_council'));
  await expect(page.getByTestId('faction-encounters')).toContainText('Ashen Pretenders');
  await expect(art(page.getByTestId('faction-encounters'), 'ui.badge.ashen_compact')).toHaveCount(0);
  await page.getByTestId('army-registry').getByRole('button', { name: /Witness column/ }).click();
  await approved(art(page.locator('.inspector'), 'ui.banner.ashen_compact'));
  const composition = page.getByTestId('army-composition');
  await composition.locator('summary').click();
  await approved(art(composition, 'unit.guard.ashen_compact'));
  await approved(art(composition, 'unit.spearman.ashen_compact'));
  await composition.screenshot({ path: testInfo.outputPath('faction-native-formation-art.png') });
  await page.getByRole('tab', { name: /Settlements/ }).click();
  await page.getByTestId('settlement-registry').getByRole('button', { name: new RegExp(CHARACTER_FIXTURE.homeName) }).click();
  const appointments = page.getByTestId('character-appointments');
  await appointments.locator('summary').click();
  for (const [name, definition] of [['Road witness', 'character.surveyor'], ['March engineer', 'character.engineer']] as const) {
    await approved(art(appointments, `${definition}.ashen_compact`));
    await page.getByRole('button', { name: `Appoint ${name}`, exact: true }).click();
    await expect.poll(() => page.evaluate(id => window.__THEANDRIL__?.getSummary()?.characters.some(character => character.definitionId === id), definition)).toBe(true);
  }
  for (const unit of ['colonist', 'scout', 'guard', 'spearman', 'heavy_infantry', 'cavalry']) await approved(art(page.locator('.inspector'), `unit.${unit}.ashen_compact`));
  await page.setViewportSize({ width: 390, height: 844 });
  const recruitment = page.getByTestId('production-land').locator('.faction-recruit-options');
  expect(await recruitment.evaluate(element => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length)).toBe(1);
  const outriders = page.getByRole('button', { name: 'Recruit Charter outriders', exact: true });
  await outriders.evaluate(element => element.scrollIntoView({ block: 'center' }));
  expect(await outriders.locator('.faction-art-card > span:last-child').evaluate(element => element.getBoundingClientRect().width)).toBeGreaterThanOrEqual(180);
  await unobstructed(outriders);
  await page.screenshot({ path: testInfo.outputPath('faction-recruitment-narrow.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator('.faction-recruit-options button').evaluateAll(elements => elements.every(element => element.scrollWidth <= element.clientWidth))).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('button', { name: 'Characters & agents', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Characters & agents', exact: true });
  await expect(dialog.getByTestId('character-roster').getByRole('button')).toHaveCount(3);
  const characters = await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.characters ?? []);
  expect(characters.some(character => character.id === hidden.id)).toBe(false);
  for (const character of characters) {
    await dialog.getByRole('button', { name: `Inspect ${character.name} (${character.id})`, exact: true }).click();
    await approved(art(dialog.getByTestId('character-sheet'), `${character.definitionId}.ashen_compact`));
  }
  await expect(page.locator('body')).not.toContainText(hidden.name);
  await dialog.screenshot({ path: testInfo.outputPath('faction-character-roles.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await dialog.getByRole('button', { name: 'Locate character', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('faction-character-narrow.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Declare war on Ashen Pretenders', exact: true }).click();
  await page.getByRole('button', { name: 'Negotiate peace with Ashen Pretenders', exact: true }).click();
  await approved(art(page.getByTestId('peace-builder'), 'ui.crest.reedbound_council'));
  await page.getByTestId('peace-builder').screenshot({ path: testInfo.outputPath('renamed-realm-diplomatic-crest.png') });
});

test('missing approved faction art is visibly generic without broken images or blocked campaign controls', async ({ page }) => {
  await page.route('**/art/catalog.json', route => route.fulfill({ status: 503, body: 'Approved art unavailable in this diagnostic.' }));
  await page.goto('/');
  const cultures = page.getByTestId('public-cultures');
  for (const faction of FACTIONS) {
    const icon = art(cultures, factionArtId('ui.crest', faction.id)!);
    await expect(icon).toHaveAttribute('data-art-state', 'fallback');
    await expect(icon).toContainText('Generic');
  }
  await begin(page);
  await expect(art(page.locator('.realm-heading'), 'ui.crest.ashen_compact')).toHaveAttribute('data-art-state', 'fallback');
  await expect(page.getByTestId('art-runtime-status')).toContainText('procedural fallback');
  await page.getByRole('textbox', { name: 'Settlement name', exact: true }).fill('Unpainted Hearth');
  await page.getByRole('button', { name: 'Found settlement', exact: true }).click();
  await expect(page.getByTestId('settlement-registry')).toContainText('Unpainted Hearth');
  await expect(page.locator('img')).toHaveCount(0);
});
