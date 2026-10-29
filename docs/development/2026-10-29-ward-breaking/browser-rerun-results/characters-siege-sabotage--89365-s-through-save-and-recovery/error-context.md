# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: characters.spec.ts >> siege sabotage changes real defenses, and a failed mission preserves wounds through save and recovery
- Location: tests/gameplay/characters.spec.ts:215:1

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
    2 × locator resolved to <div role="status" class="feedback " aria-live="polite" data-testid="feedback">…</div>
      - unexpected value "◆Resolving… A world of broken oaths awaits a new beginning."
    12 × locator resolved to <div role="alert" aria-live="polite" class="feedback error" data-testid="feedback">…</div>
       - unexpected value "!The campaign worker stopped: Unexpected worker error. Restore a saved campaign to recover."

```

```yaml
- alert: "The campaign worker stopped: Unexpected worker error. Restore a saved campaign to recover."
```

# Test source

```ts
  1   | import { closeManagement, openRegistry, selectFromRegistry, openSelectedOrders, openRealmAffairs, openCampaignJournal } from './ui-navigation';
  2   | import { expect, test, type Page } from '@playwright/test';
  3   | import { applyCommand, deserializeGame, serializeGame } from '@theandril/sim';
  4   | import { exportSave } from '@theandril/persistence';
  5   | import { characterBattleCampaign, characterCampaign, CHARACTER_FIXTURE as FIXTURE } from '../../packages/test-fixtures/src/character-fixture';
  6   | import { conquestCampaign, CONQUEST_FIXTURE } from '../../packages/test-fixtures/src/conquest-fixture';
  7   | 
  8   | const roster = (page: Page) => page.getByRole('dialog', { name: 'Characters & agents', exact: true });
  9   | async function loadScenario(page: Page, state = characterCampaign()) {
  10  |   await page.goto('/');
  11  |   await page.locator('input[type=file]').setInputFiles({ name: 'witness-company.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
> 12  |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
      |                                              ^ Error: expect(locator).toContainText(expected) failed
  13  | }
  14  | async function inspect(page: Page, id: string) {
  15  |   if (!await roster(page).isVisible()) {
  16  |     await closeManagement(page);
  17  |     await page.getByRole('button', { name: 'Characters & agents', exact: true }).click();
  18  |   }
  19  |   const character = await page.evaluate(id => window.__THEANDRIL__?.getSummary()?.characters.find(item => item.id === id), id);
  20  |   if (!character) throw new Error('Missing observed scenario character');
  21  |   await roster(page).getByRole('searchbox', { name: 'Search characters', exact: true }).fill(character.name);
  22  |   await roster(page).getByRole('button', { name: `Inspect ${character.name} (${id})`, exact: true }).click();
  23  |   return character;
  24  | }
  25  | async function closeRoster(page: Page) { if (await roster(page).isVisible()) await roster(page).getByRole('button', { name: 'Close characters', exact: true }).click(); }
  26  | async function appoint(page: Page, name: string, definitionId: string) {
  27  |   await closeRoster(page);
  28  |   await openRegistry(page, 'settlements');
  29  |   await selectFromRegistry(page, 'settlements', new RegExp(FIXTURE.homeName)); await openSelectedOrders(page);
  30  |   const appointments = page.getByTestId('character-appointments');
  31  |   if (!await appointments.evaluate(element => (element as HTMLDetailsElement).open)) await appointments.locator('summary').click();
  32  |   const before = await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.characters.map(item => item.id) ?? []);
  33  |   await page.getByRole('button', { name: `Appoint ${name}`, exact: true }).click();
  34  |   await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSummary()?.characters.length)).toBe(before.length + 1);
  35  |   const character = await page.evaluate(({ before, definitionId }) => window.__THEANDRIL__?.getSummary()?.characters.find(item => item.definitionId === definitionId && !before.includes(item.id)), { before, definitionId });
  36  |   if (!character) throw new Error('The real appointment did not produce an observed named character');
  37  |   return character.id;
  38  | }
  39  | async function assign(page: Page, characterId: string, armyId: string = FIXTURE.armyId) {
  40  |   await inspect(page, characterId);
  41  |   await roster(page).getByRole('combobox', { name: 'Assign to army', exact: true }).selectOption(armyId);
  42  |   await roster(page).getByRole('button', { name: 'Assign character', exact: true }).click();
  43  |   await expect.poll(() => page.evaluate(id => window.__THEANDRIL__?.getSummary()?.characters.find(item => item.id === id)?.location, characterId)).toEqual({ kind: 'army', armyId });
  44  | }
  45  | async function startMission(page: Page, characterId: string, name: string) {
  46  |   await inspect(page, characterId);
  47  |   await roster(page).getByRole('combobox', { name: 'Choose mission', exact: true }).selectOption({ label: name });
  48  |   await roster(page).getByRole('button', { name: `Start ${name}`, exact: true }).click();
  49  |   await expect(roster(page).getByTestId('active-character-mission')).toContainText('2 stationary turns remaining');
  50  | }
  51  | async function endTurn(page: Page) {
  52  |   await closeRoster(page);
  53  |   const turn = await page.evaluate(() => window.__THEANDRIL__?.getTurn() ?? 0);
  54  |   await closeManagement(page);
  55  |   await page.getByRole('button', { name: 'End turn', exact: true }).click();
  56  |   await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${turn + 1}`);
  57  | }
  58  | async function saveReload(page: Page) {
  59  |   await closeRoster(page);
  60  |   await closeManagement(page);
  61  |   const settings = page.locator('.campaign-options');
  62  |   if (!await settings.evaluate(element => (element as HTMLDetailsElement).open)) await settings.locator('summary').click();
  63  |   await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  64  |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  65  |   const hash = await page.evaluate(() => window.__THEANDRIL__?.getStateHash());
  66  |   await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  67  |   await expect(page.getByTestId('feedback')).toContainText('Campaign restored');
  68  |   expect(await page.evaluate(() => window.__THEANDRIL__?.getStateHash())).toBe(hash);
  69  | }
  70  | 
  71  | test('locating an officer from full orders closes both native windows and returns focus to the unchanged army on the map', async ({ page }) => {
  72  |   await loadScenario(page, characterBattleCampaign());
  73  |   await selectFromRegistry(page, 'armies', FIXTURE.armyName);
  74  |   const selection = await page.evaluate(() => window.__THEANDRIL__!.getSelection());
  75  |   const hash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  76  |   expect(selection.armyId).toBe(FIXTURE.armyId);
  77  |   const orders = await openSelectedOrders(page);
  78  |   await orders.getByRole('button', { name: `Manage characters for ${FIXTURE.armyName}`, exact: true }).click();
  79  |   await expect(roster(page)).toBeVisible();
  80  |   // Verify the actual nested-window entry path, not the standalone HUD launcher.
  81  |   await expect(page.locator('dialog.campaign-window')).toHaveAttribute('open');
  82  |   await roster(page).getByRole('button', { name: 'Locate character', exact: true }).click();
  83  |   await expect(roster(page)).toHaveCount(0);
  84  |   await expect(page.locator('dialog.campaign-window')).toHaveCount(0);
  85  |   await expect(page.getByTestId('map-container')).toBeFocused();
  86  |   expect(await page.evaluate(() => window.__THEANDRIL__!.getSelection())).toEqual(selection);
  87  |   expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
  88  |   expect(await page.evaluate(cell => window.__THEANDRIL__!.getCellScreenPoint(cell)?.inViewport, selection.cell!)).toBe(true);
  89  | });
  90  | 
  91  | test('named appointments attach to a real army, cancel without refund, and preserve a terrain-only survey across save and recovery', async ({ page }, testInfo) => {
  92  |   await loadScenario(page);
  93  |   const marshal = await appoint(page, 'Hearth marshal', 'character.marshal');
  94  |   const surveyor = await appoint(page, 'Road witness', 'character.surveyor');
  95  |   const engineer = await appoint(page, 'March engineer', 'character.engineer');
  96  |   await assign(page, marshal); await assign(page, surveyor); await assign(page, engineer);
  97  |   const army = await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ownArmies.find(item => item.id === 'army.2'));
  98  |   expect(army?.commander?.id).toBe(marshal); expect(army?.agents.map(item => item.id).sort()).toEqual([surveyor, engineer].sort());
  99  |   const before = await page.evaluate(() => ({ coin: window.__THEANDRIL__?.getSummary()?.treasury, explored: window.__THEANDRIL__?.getSummary()?.exploredCells }));
  100 |   await startMission(page, surveyor, 'Survey the frontier');
  101 |   await expect(roster(page).getByRole('button', { name: 'Assign character', exact: true })).toBeDisabled();
  102 |   await roster(page).getByRole('button', { name: 'Cancel mission', exact: true }).click();
  103 |   await expect(roster(page).getByTestId('active-character-mission')).toHaveCount(0);
  104 |   expect(await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.treasury)).toBe(before.coin! - 4);
  105 |   expect(await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ownArmies.find(item => item.id === 'army.2')?.movement)).toBe(0);
  106 |   await startMission(page, surveyor, 'Survey the frontier');
  107 |   await endTurn(page); await inspect(page, surveyor);
  108 |   await expect(roster(page).getByTestId('active-character-mission')).toContainText('1 stationary turn remaining');
  109 |   await roster(page).screenshot({ path: testInfo.outputPath('named-survey-in-progress.png') });
  110 |   await saveReload(page); await inspect(page, surveyor);
  111 |   await expect(roster(page).getByTestId('active-character-mission')).toContainText('1 stationary turn remaining');
  112 |   await endTurn(page);
```