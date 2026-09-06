# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: army.spec.ts >> mixed formation battles deploy each real role and preserve exact losses through a saved tactical round
- Location: tests/gameplay/army.spec.ts:87:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByTestId('feedback')
Expected substring: "Loaded campaign"
Received string:    "◆Campaign restored. Partial archive: earlier campaign history was not recorded in this save."
Timeout: 5000ms

Call log:
  - Expect "toContainText" getByTestId('feedback') with timeout 5000ms
  - waiting for getByTestId('feedback')
    3 × locator resolved to <div role="status" class="feedback " aria-live="polite" data-testid="feedback">…</div>
      - unexpected value "◆Resolving… A world of broken oaths awaits a new beginning."
    11 × locator resolved to <div role="status" class="feedback " aria-live="polite" data-testid="feedback">…</div>
       - unexpected value "◆Campaign restored. Partial archive: earlier campaign history was not recorded in this save."

```

```yaml
- status: "Campaign restored. Partial archive: earlier campaign history was not recorded in this save."
```

# Test source

```ts
  1   | import { expect, test, type Page } from '@playwright/test';
  2   | import { createArmyFormation, createGame, deserializeGame, serializeGame, type GameState } from '@theandril/sim';
  3   | import { exportSave } from '@theandril/persistence';
  4   | 
  5   | const ORIGIN = 500;
  6   | function formation(state: GameState, unitId: string) { return createArmyFormation(`army.${state.nextId++}`, unitId); }
  7   | /** Authored formations enter through the production save validator, never a browser mutation hook. */
  8   | function rosterCampaign(kind: 'reorganize' | 'battle' | 'capacity' = 'reorganize'): GameState {
  9   |   const state = createGame({ seed: 20260905, size: 'tiny', pace: 'short', factionCount: 2 });
  10  |   state.world.terrain.fill(1); state.world.biome.fill(1); state.world.fertility.fill(60);
  11  |   const first = state.armies['army.1']!; const second = state.armies['army.2']!;
  12  |   const guard = formation(state, 'unit.guard'); guard.strength = 40; guard.morale = 65; guard.fatigue = 7;
  13  |   Object.assign(first, { cell: ORIGIN, name: 'Roadguard column', movement: 3, formations: [guard, formation(state, 'unit.scout'), formation(state, 'unit.colonist')] });
  14  |   Object.assign(second, { cell: ORIGIN, name: 'Iron detachment', movement: 1, formations: [formation(state, 'unit.heavy_infantry')] });
  15  |   delete state.armies['army.3'];
  16  |   if (kind === 'battle') {
  17  |     first.formations = [guard, formation(state, 'unit.scout'), formation(state, 'unit.spearman'), formation(state, 'unit.cavalry')];
  18  |     Object.assign(state.armies['army.4']!, { cell: ORIGIN + 1, name: 'Reedbound rear guard', movement: 3, formations: [formation(state, 'unit.guard'), formation(state, 'unit.spearman')] });
  19  |   } else delete state.armies['army.4'];
  20  |   if (kind === 'capacity') {
  21  |     first.formations = [guard];
  22  |     second.formations = Array.from({ length: 12 }, () => formation(state, 'unit.guard'));
  23  |   }
  24  |   for (const army of Object.values(state.armies)) army.formations.sort((a, b) => a.id < b.id ? -1 : 1);
  25  |   for (const faction of state.factions) state.explored[faction.id] = new Set(Array.from({ length: state.world.width * state.world.height }, (_, cell) => cell));
  26  |   return deserializeGame(serializeGame(state));
  27  | }
  28  | async function importRoster(page: Page, state = rosterCampaign()) {
  29  |   await page.goto('/');
  30  |   await page.locator('input[type=file]').setInputFiles({ name: 'formation-column.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  31  |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  32  |   await page.getByTestId('army-registry').getByRole('button', { name: /Roadguard column/ }).click();
  33  | }
  34  | async function openComposition(page: Page) {
  35  |   const panel = page.getByTestId('army-composition');
  36  |   if (!await panel.evaluate(element => (element as HTMLDetailsElement).open)) await panel.locator('summary').click();
  37  |   return panel;
  38  | }
  39  | async function saveReload(page: Page): Promise<void> {
  40  |   await page.getByText('Campaign & settings', { exact: true }).click();
  41  |   await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  42  |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  43  |   const hash = await page.evaluate(() => window.__THEANDRIL__?.getStateHash());
  44  |   await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
> 45  |   await expect(page.getByTestId('feedback')).toContainText('Loaded campaign');
      |                                              ^ Error: expect(locator).toContainText(expected) failed
  46  |   expect(await page.evaluate(() => window.__THEANDRIL__?.getStateHash())).toBe(hash);
  47  | }
  48  | 
  49  | test('mixed armies merge, split and transfer stable formations without refreshing movement; an escorted caravan founds without consuming its scouts', async ({ page }, testInfo) => {
  50  |   const state = rosterCampaign(); const original = Object.values(state.armies).flatMap(army => army.formations).sort((a, b) => a.id.localeCompare(b.id));
  51  |   await importRoster(page, state);
  52  |   let panel = await openComposition(page);
  53  |   await expect(panel).toContainText('Oath guard'); await expect(panel).toContainText('Wayfinder');
  54  |   await panel.getByRole('combobox', { name: 'Other army at this hex', exact: true }).selectOption('army.2');
  55  |   await panel.getByRole('button', { name: 'Merge armies', exact: true }).click();
  56  |   await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ownArmies.length)).toBe(1);
  57  |   const merged = await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ownArmies[0]);
  58  |   expect(merged).toMatchObject({ id: 'army.2', movement: 1, maxMovement: 2, strength: 155, maxStrength: 175, upkeep: 7, canFound: true, canAttack: true });
  59  |   expect(merged?.formations).toEqual(original);
  60  |   panel = await openComposition(page);
  61  |   const scoutId = original.find(item => item.unitId === 'unit.scout')!.id;
  62  |   await panel.getByRole('checkbox', { name: `Select formation ${scoutId}`, exact: true }).check();
  63  |   await panel.getByRole('textbox', { name: 'New detachment name', exact: true }).fill('Farlook patrol');
  64  |   await panel.getByRole('button', { name: 'Split selected formations', exact: true }).click();
  65  |   await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ownArmies.length)).toBe(2);
  66  |   const patrol = await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ownArmies.find(army => army.name === 'Farlook patrol'));
  67  |   expect(patrol).toMatchObject({ movement: 1, maxMovement: 5, formations: [{ id: scoutId, unitId: 'unit.scout', strength: 20 }] });
  68  |   panel = await openComposition(page);
  69  |   await panel.getByRole('checkbox', { name: `Select formation ${original.find(item => item.unitId === 'unit.colonist')!.id}`, exact: true }).check();
  70  |   await panel.getByRole('combobox', { name: 'Other army at this hex', exact: true }).selectOption(patrol!.id);
  71  |   await panel.getByRole('button', { name: 'Transfer selected formations', exact: true }).click();
  72  |   await expect.poll(() => page.evaluate(id => window.__THEANDRIL__?.getSummary()?.ownArmies.find(army => army.id === id)?.formations.length, patrol!.id)).toBe(2);
  73  |   await saveReload(page);
  74  |   await page.getByTestId('army-registry').getByRole('button', { name: /Farlook patrol/ }).click();
  75  |   panel = await openComposition(page);
  76  |   await expect(panel).toContainText('Founding consumes one caravan formation only');
  77  |   await panel.screenshot({ path: testInfo.outputPath('mixed-army-roster.png') });
  78  |   await page.getByRole('textbox', { name: 'Settlement name', exact: true }).fill('Escort Hearth');
  79  |   await page.getByRole('button', { name: 'Found settlement', exact: true }).click();
  80  |   await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ownSettlements[0]?.name)).toBe('Escort Hearth');
  81  |   expect(await page.evaluate(id => window.__THEANDRIL__?.getSummary()?.ownArmies.find(army => army.id === id), patrol!.id)).toMatchObject({ movement: 0, formations: [{ id: scoutId, unitId: 'unit.scout', strength: 20 }] });
  82  |   await expect(page.getByRole('button', { name: 'Recruit Ash pike company', exact: true })).toBeEnabled();
  83  |   await expect(page.getByRole('button', { name: 'Recruit Cinder plate cohort', exact: true })).toBeEnabled();
  84  |   await expect(page.getByRole('button', { name: 'Recruit Charter outriders', exact: true })).toBeEnabled();
  85  | });
  86  | 
  87  | test('mixed formation battles deploy each real role and preserve exact losses through a saved tactical round', async ({ page }, testInfo) => {
  88  |   await importRoster(page, rosterCampaign('battle'));
  89  |   await page.getByRole('button', { name: 'Declare war on Reedbound Council', exact: true }).click();
  90  |   await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSummary()?.wars.length)).toBe(1);
  91  |   await page.getByRole('button', { name: 'Attack Reedbound rear guard (army.4)', exact: true }).click();
  92  |   const battle = page.getByTestId('battle-panel');
  93  |   await expect(battle).toBeVisible();
  94  |   await expect(battle.getByRole('table', { name: 'Attacking formations', exact: true }).locator('tbody tr')).toHaveCount(4);
  95  |   await expect(battle).toContainText('Ash pike company'); await expect(battle).toContainText('Charter outriders');
  96  |   await battle.getByRole('button', { name: 'Brace', exact: true }).click();
  97  |   await expect(page.getByTestId('battle-round')).toHaveText('1');
  98  |   await saveReload(page);
  99  |   await battle.screenshot({ path: testInfo.outputPath('mixed-formation-battle.png') });
  100 |   await battle.getByRole('button', { name: 'Auto-resolve battle', exact: true }).click();
  101 |   const report = page.getByTestId('battle-report'); await expect(report).toBeVisible();
  102 |   const record = await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.battleReports.at(-1));
  103 |   expect(record?.formationBindings).toHaveLength(6);
  104 |   for (const side of ['attacker', 'defender'] as const) {
  105 |     const combatIds = new Set(record!.combat[side].map(item => item.id));
  106 |     const ids = new Set(record!.formationBindings.filter(binding => combatIds.has(binding.battleFormationId)).map(binding => binding.formationId));
  107 |     const entered = record!.formationStrengths.filter(item => ids.has(item.formationId)).reduce((sum, item) => sum + item.strength, 0);
  108 |     const survivors = record!.formationAftermath.filter(item => ids.has(item.formationId)).reduce((sum, item) => sum + item.strength, 0);
  109 |     await expect(report).toContainText(`${entered - survivors} strength lost · ${survivors} survivors`);
  110 |   }
  111 | });
  112 | 
  113 | test('twelve-formation limits and proper-subset splitting stay explicit in the narrow keyboard roster', async ({ page }, testInfo) => {
  114 |   await page.setViewportSize({ width: 390, height: 844 });
  115 |   await importRoster(page, rosterCampaign('capacity'));
  116 |   let panel = await openComposition(page);
  117 |   await panel.getByRole('checkbox').check();
  118 |   await expect(panel.getByRole('button', { name: 'Merge armies', exact: true })).toBeDisabled();
  119 |   await expect(panel.getByRole('button', { name: 'Transfer selected formations', exact: true })).toBeDisabled();
  120 |   await expect(panel.getByRole('button', { name: 'Split selected formations', exact: true })).toBeDisabled();
  121 |   await expect(panel).toContainText('A full merge would exceed 12 formations');
  122 |   await page.getByTestId('army-registry').getByRole('button', { name: /Iron detachment/ }).click();
  123 |   panel = await openComposition(page);
  124 |   await expect(panel.getByRole('checkbox')).toHaveCount(12);
  125 |   for (const checkbox of await panel.getByRole('checkbox').all()) await checkbox.check();
  126 |   await expect(panel.getByRole('button', { name: 'Split selected formations', exact: true })).toBeDisabled();
  127 |   await panel.getByRole('checkbox').last().focus(); await page.keyboard.press('Space');
  128 |   await expect(panel.getByRole('button', { name: 'Split selected formations', exact: true })).toBeEnabled();
  129 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  130 |   await panel.screenshot({ path: testInfo.outputPath('army-capacity-narrow.png') });
  131 |   await testInfo.attach('roster-accessibility.json', { body: JSON.stringify({ viewport: '390x844', controls: 'real keyboard-operable formation checkboxes; twelve cap and proper subset enforced', hash: await page.evaluate(() => window.__THEANDRIL__?.getStateHash()) }), contentType: 'application/json' });
  132 | });
  133 | 
```