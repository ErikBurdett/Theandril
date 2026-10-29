# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: seam-warding.spec.ts >> a besieger breaks the ward on its turn and the holder is jarred
- Location: tests/gameplay/seam-warding.spec.ts:63:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('dialog', { name: 'Characters & agents', exact: true }).getByTestId('character-sheet')
Expected substring: "wounded · 2 turns"
Received string:    "Sella KilnboundWaykeeper · character.7Glasswatch · hex 660Locate characterConditionwounded · 1 turnsAvailable experience0 · rank 2SpecializationNot chosenPersonal pathsFlame 2 · Rune 1National research does not grant these personal paths. A Waykeeper lodged in a hearth whose borders hold a surveyed seam studies it for one experience a turn; twenty-four experience deepens a path by a degree.Known workings: Bound ward, Cinder threadStrategic ritesA lodged Waykeeper of the rite’s path performs it at a hearth whose borders hold a surveyed seam of that path, paying ashglass from the realm stockpile. A ward holds while the caster stays lodged there and the seam is held.Ward breakingA Waykeeper of the second Rune degree riding with an army that besieges a warded hearth unbinds the seam from its walls, paying four ashglass: the ward ends at once and the caster who held it is jarred and cannot work for two turns. The realm must know Measured unbinding.4 ashglass · 0 turnsThis Waykeeper lacks the personal path for the rite.Perform riteSeam wardingA Rune-gifted Waykeeper lodged in a hearth whose borders hold a Rune seam binds the seam into its walls for ten turns, paying six ashglass. While the caster stays, siege works cannot wear the defenses down and sabotage fails. A lost seam, a caster who leaves or is wounded, or a hearth that changes hands ends the ward.6 ashglass · 10 turnsThis caster must recover from wounds.Perform riteSkills & command0 available experience. Purchases spend earned experience. A specialization is exclusive; later branches can be combined when their prerequisites are met.Learned: Flame deepeningTrace a branch, then inspect its cost and effects. Linked prerequisites can be inspected without spending experience.AttunementFlame deepeningTier 2 · LearnedRune deepeningTier 2 · LockedAttunement1 learnedTier 2 · LearnedFlame deepeningEarned practice deepens this Waykeeper’s personal Flame aptitude by one degree, to at most the third. Deeper paths reach workings that national research alone cannot, and the second degree of any path lets a caster seal an Attunement.Root skill · no learned prerequisite.24 experience spent on this skillLearnedTier 2 · LockedRune deepeningEarned practice deepens this Waykeeper’s personal Rune aptitude by one degree, to at most the third. Deeper paths reach workings that national research alone cannot, and the second degree of any path lets a caster seal an Attunement.Root skill · no learned prerequisite.24 experience to learnThis character must recover from wounds first.Learn skillArmy attachmentAppointments and transfers normally require the same hex. Officers can board an adjacent owned fleet from a harbor when the listed permission allows it, spending fleet movement. An army or fleet has one marshal and up to two agents. Review the destination and any restriction before changing an assignment.Assign to armyWayfinder · army.2This character must recover from wounds first.Assign characterReturn to settlementGlasswatchThis character must recover from wounds first.Return character"
Timeout: 5000ms

Call log:
  - Expect "toContainText" getByRole('dialog', { name: 'Characters & agents', exact: true }).getByTestId('character-sheet') with timeout 5000ms
  - waiting for getByRole('dialog', { name: 'Characters & agents', exact: true }).getByTestId('character-sheet')
    14 × locator resolved to <section class="character-sheet" data-testid="character-sheet" aria-label="Selected character">…</section>
       - unexpected value "Sella KilnboundWaykeeper · character.7Glasswatch · hex 660Locate characterConditionwounded · 1 turnsAvailable experience0 · rank 2SpecializationNot chosenPersonal pathsFlame 2 · Rune 1National research does not grant these personal paths. A Waykeeper lodged in a hearth whose borders hold a surveyed seam studies it for one experience a turn; twenty-four experience deepens a path by a degree.Known workings: Bound ward, Cinder threadStrategic ritesA lodged Waykeeper of the rite’s path performs it at a hearth whose borders hold a surveyed seam of that path, paying ashglass from the realm stockpile. A ward holds while the caster stays lodged there and the seam is held.Ward breakingA Waykeeper of the second Rune degree riding with an army that besieges a warded hearth unbinds the seam from its walls, paying four ashglass: the ward ends at once and the caster who held it is jarred and cannot work for two turns. The realm must know Measured unbinding.4 ashglass · 0 turnsThis Waykeeper lacks the personal path for the rite.Perform riteSeam wardingA Rune-gifted Waykeeper lodged in a hearth whose borders hold a Rune seam binds the seam into its walls for ten turns, paying six ashglass. While the caster stays, siege works cannot wear the defenses down and sabotage fails. A lost seam, a caster who leaves or is wounded, or a hearth that changes hands ends the ward.6 ashglass · 10 turnsThis caster must recover from wounds.Perform riteSkills & command0 available experience. Purchases spend earned experience. A specialization is exclusive; later branches can be combined when their prerequisites are met.Learned: Flame deepeningTrace a branch, then inspect its cost and effects. Linked prerequisites can be inspected without spending experience.AttunementFlame deepeningTier 2 · LearnedRune deepeningTier 2 · LockedAttunement1 learnedTier 2 · LearnedFlame deepeningEarned practice deepens this Waykeeper’s personal Flame aptitude by one degree, to at most the third. Deeper paths reach workings that national research alone cannot, and the second degree of any path lets a caster seal an Attunement.Root skill · no learned prerequisite.24 experience spent on this skillLearnedTier 2 · LockedRune deepeningEarned practice deepens this Waykeeper’s personal Rune aptitude by one degree, to at most the third. Deeper paths reach workings that national research alone cannot, and the second degree of any path lets a caster seal an Attunement.Root skill · no learned prerequisite.24 experience to learnThis character must recover from wounds first.Learn skillArmy attachmentAppointments and transfers normally require the same hex. Officers can board an adjacent owned fleet from a harbor when the listed permission allows it, spending fleet movement. An army or fleet has one marshal and up to two agents. Review the destination and any restriction before changing an assignment.Assign to armyWayfinder · army.2This character must recover from wounds first.Assign characterReturn to settlementGlasswatchThis character must recover from wounds first.Return character"

```

```yaml
- region "Selected character":
  - img "Sella Kilnbound, Waykeeper · shared Waykeeper silhouette"
  - heading "Sella Kilnbound" [level=3]
  - paragraph: Waykeeper · character.7 Glasswatch · hex 660
  - button "Locate character"
  - term: Condition
  - definition: wounded · 1 turns
  - term: Available experience
  - definition: 0 · rank 2
  - term: Specialization
  - definition: Not chosen
  - region "Personal magical aptitude":
    - heading "Personal paths" [level=4]
    - paragraph: Flame 2 · Rune 1
    - paragraph: National research does not grant these personal paths. A Waykeeper lodged in a hearth whose borders hold a surveyed seam studies it for one experience a turn; twenty-four experience deepens a path by a degree.
    - paragraph: "Known workings: Bound ward, Cinder thread"
  - region "Strategic rites":
    - heading "Strategic rites" [level=4]
    - paragraph: A lodged Waykeeper of the rite’s path performs it at a hearth whose borders hold a surveyed seam of that path, paying ashglass from the realm stockpile. A ward holds while the caster stays lodged there and the seam is held.
    - article:
      - heading "Ward breaking" [level=4]
      - paragraph: "A Waykeeper of the second Rune degree riding with an army that besieges a warded hearth unbinds the seam from its walls, paying four ashglass: the ward ends at once and the caster who held it is jarred and cannot work for two turns. The realm must know Measured unbinding."
      - paragraph: 4 ashglass · 0 turns
      - paragraph: This Waykeeper lacks the personal path for the rite.
      - button "Perform Ward breaking" [disabled]: Perform rite
    - article:
      - heading "Seam warding" [level=4]
      - paragraph: A Rune-gifted Waykeeper lodged in a hearth whose borders hold a Rune seam binds the seam into its walls for ten turns, paying six ashglass. While the caster stays, siege works cannot wear the defenses down and sabotage fails. A lost seam, a caster who leaves or is wounded, or a hearth that changes hands ends the ward.
      - paragraph: 6 ashglass · 10 turns
      - paragraph: This caster must recover from wounds.
      - button "Perform Seam warding" [disabled]: Perform rite
  - region "Character skill tree":
    - heading "Skills & command" [level=4]
    - paragraph:
      - strong: 0 available experience
      - text: . Purchases spend earned experience. A specialization is exclusive; later branches can be combined when their prerequisites are met.
    - paragraph: "Learned: Flame deepening"
    - navigation "Skill roadmap":
      - paragraph: Trace a branch, then inspect its cost and effects. Linked prerequisites can be inspected without spending experience.
      - region "Attunement roadmap":
        - heading "Attunement" [level=5]
        - list:
          - listitem:
            - button "Inspect skill Flame deepening": Flame deepening Tier 2 · Learned
          - listitem:
            - button "Inspect skill Rune deepening": Rune deepening Tier 2 · Locked
    - tablist "Skill branches":
      - tab "Attunement 1 learned" [selected]
    - tabpanel "Attunement 1 learned":
      - article "Flame deepening skill":
        - text: Tier 2 · Learned
        - strong: Flame deepening
        - paragraph: Earned practice deepens this Waykeeper’s personal Flame aptitude by one degree, to at most the third. Deeper paths reach workings that national research alone cannot, and the second degree of any path lets a caster seal an Attunement.
        - paragraph: Root skill · no learned prerequisite.
        - paragraph: 24 experience spent on this skill
        - button "Promote Flame deepening" [disabled]: Learned
      - article "Rune deepening skill":
        - text: Tier 2 · Locked
        - strong: Rune deepening
        - paragraph: Earned practice deepens this Waykeeper’s personal Rune aptitude by one degree, to at most the third. Deeper paths reach workings that national research alone cannot, and the second degree of any path lets a caster seal an Attunement.
        - paragraph: Root skill · no learned prerequisite.
        - paragraph: 24 experience to learn
        - paragraph: This character must recover from wounds first.
        - button "Promote Rune deepening" [disabled]: Learn skill
  - heading "Army attachment" [level=4]
  - paragraph: Appointments and transfers normally require the same hex. Officers can board an adjacent owned fleet from a harbor when the listed permission allows it, spending fleet movement. An army or fleet has one marshal and up to two agents. Review the destination and any restriction before changing an assignment.
  - text: Assign to army
  - combobox "Assign to army":
    - option "Wayfinder · army.2" [selected]
  - paragraph: This character must recover from wounds first.
  - button "Assign character" [disabled]
  - text: Return to settlement
  - combobox "Return to settlement":
    - option "Glasswatch" [selected]
  - paragraph: This character must recover from wounds first.
  - button "Return character" [disabled]
```

# Test source

```ts
  1   | import { expect, test, type Page } from '@playwright/test';
  2   | import { isPassable, neighbors } from '@theandril/mapgen';
  3   | import { applyCommand, serializeGame } from '@theandril/sim';
  4   | import { exportSave } from '@theandril/persistence';
  5   | import { attunementCampaign } from '../../packages/test-fixtures/src/victory-fixture';
  6   | import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';
  7   | import { closeManagement, openRealmAffairs } from './ui-navigation';
  8   | 
  9   | const roster = (page: Page) => page.getByRole('dialog', { name: 'Characters & agents', exact: true });
  10  | 
  11  | /** Rules 40: a besieged realm's lodged Waykeeper wards the hearth through the
  12  |  * real character sheet, the ashglass is spent, the ledger marks the walls and
  13  |  * the besieger's works fail to wear them down. */
  14  | test('ward a besieged hearth through its lodged Waykeeper and read the held walls', async ({ page }, testInfo) => {
  15  |   const errors: string[] = [];
  16  |   page.on('pageerror', error => errors.push(error.message));
  17  |   const state = attunementCampaign(), player = state.turnOwnerId, rival = state.factions[1]!.id;
  18  |   const host = Object.values(state.settlements).find(town => town.factionId === player)!;
  19  |   const caster = Object.values(state.characters).find(item => item.factionId === player && item.definitionId === 'character.waykeeper')!;
  20  |   state.resources.stockpiles[player]!['resource.ashglass'] = 20;
  21  |   const column = Object.values(state.armies).find(army => army.factionId === rival)!;
  22  |   column.cell = neighbors(host.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell] ?? 0) && Object.values(state.armies).every(army => army.cell !== cell))!;
  23  |   column.movement = 3; refreshAuthoredSight(state);
  24  |   expect(applyCommand(state, { type: 'declareWar', factionId: rival, targetFactionId: player })).toMatchObject({ ok: true });
  25  |   expect(applyCommand(state, { type: 'besiege', factionId: rival, armyId: column.id, settlementId: host.id })).toMatchObject({ ok: true });
  26  |   await page.goto('/');
  27  |   // The unbundled dev page and the module worker together exceed Chromium's in-flight request budget; let the page settle first.
  28  |   await page.waitForLoadState('networkidle');
  29  |   await page.locator('input[type=file]').setInputFiles({ name: 'warded-hearth.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  30  |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  31  |   await closeManagement(page);
  32  | 
  33  |   await page.getByRole('button', { name: 'Characters & agents', exact: true }).click();
  34  |   await roster(page).getByRole('searchbox', { name: 'Search characters', exact: true }).fill(caster.name);
  35  |   await roster(page).getByRole('button', { name: `Inspect ${caster.name} (${caster.id})`, exact: true }).click();
  36  |   const rites = roster(page).getByTestId('strategic-rites');
  37  |   await expect(rites).toContainText('Seam warding');
  38  |   await expect(rites).toContainText(`6 ashglass · 10 turns · at ${host.name}`);
  39  |   await rites.screenshot({ path: testInfo.outputPath('rite-offered.png') });
  40  |   await rites.getByRole('button', { name: 'Perform Seam warding', exact: true }).click();
  41  |   await expect(rites.getByTestId(`ward-${host.id}`)).toContainText(`stands over ${host.name}: 10 turns remaining.`);
  42  |   await expect(rites).toContainText('This hearth is already warded.');
  43  |   await expect(rites.getByRole('button', { name: 'Perform Seam warding', exact: true })).toBeDisabled();
  44  |   await rites.screenshot({ path: testInfo.outputPath('rite-performed.png') });
  45  |   await roster(page).getByRole('button', { name: 'Close characters', exact: true }).click();
  46  | 
  47  |   // The ledger marks the warded walls; the besieger reads them too and, unable to storm them, lifts the siege on its turn.
  48  |   await openRealmAffairs(page);
  49  |   const ledger = page.getByLabel('Known sieges', { exact: true });
  50  |   await expect(ledger).toContainText(host.name);
  51  |   await expect(ledger).toContainText('30 · warded');
  52  |   await ledger.screenshot({ path: testInfo.outputPath('warded-ledger.png') });
  53  |   await closeManagement(page);
  54  |   await page.getByRole('button', { name: 'End turn', exact: true }).click();
  55  |   await expect(page.getByTestId('turn-counter')).toHaveText('Turn 2');
  56  |   expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.sieges.length)).toBe(0);
  57  |   expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.wards?.map(ward => ward.remainingTurns))).toEqual([9]);
  58  |   expect(errors).toEqual([]);
  59  | });
  60  | 
  61  | /** Rules 41: the besieger's riding Rune caster breaks the ward on its turn; the
  62  |  * player reads the broken ward, the jarred caster and the resumed works. */
  63  | test('a besieger breaks the ward on its turn and the holder is jarred', async ({ page }, testInfo) => {
  64  |   const errors: string[] = [];
  65  |   page.on('pageerror', error => errors.push(error.message));
  66  |   const state = attunementCampaign(), player = state.turnOwnerId, rival = state.factions[1]!;
  67  |   const host = Object.values(state.settlements).find(town => town.factionId === player)!;
  68  |   const caster = Object.values(state.characters).find(item => item.factionId === player && item.definitionId === 'character.waykeeper')!;
  69  |   state.resources.stockpiles[player]!['resource.ashglass'] = 20;
  70  |   const column = Object.values(state.armies).find(army => army.factionId === rival.id)!;
  71  |   column.cell = neighbors(host.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell] ?? 0) && Object.values(state.armies).every(army => army.cell !== cell))!;
  72  |   column.movement = 3; refreshAuthoredSight(state);
  73  |   expect(applyCommand(state, { type: 'declareWar', factionId: rival.id, targetFactionId: player })).toMatchObject({ ok: true });
  74  |   expect(applyCommand(state, { type: 'besiege', factionId: rival.id, armyId: column.id, settlementId: host.id })).toMatchObject({ ok: true });
  75  |   const hearth = Object.values(state.settlements).find(town => town.factionId === rival.id)!;
  76  |   rival.treasury += 200; state.resources.stockpiles[rival.id] = { ...state.resources.stockpiles[rival.id], 'resource.ashglass': 10 };
  77  |   expect(applyCommand(state, { type: 'recruitCharacter', factionId: rival.id, settlementId: hearth.id, definitionId: 'character.waykeeper' })).toMatchObject({ ok: true });
  78  |   const breaker = Object.values(state.characters).find(item => item.factionId === rival.id && item.definitionId === 'character.waykeeper')!;
  79  |   breaker.aptitudes = { 'path.flame': 1, 'path.rune': 2 }; breaker.location = { kind: 'army', armyId: column.id };
  80  |   state.arcaneResearch[rival.id] = [...new Set([...(state.arcaneResearch[rival.id] ?? []), 'arcane.rune_binding', 'arcane.unbinding'])];
  81  |   await page.goto('/');
  82  |   await page.waitForLoadState('networkidle');
  83  |   await page.locator('input[type=file]').setInputFiles({ name: 'contested-ward.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  84  |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  85  |   await closeManagement(page);
  86  |   await page.getByRole('button', { name: 'Characters & agents', exact: true }).click();
  87  |   await roster(page).getByRole('searchbox', { name: 'Search characters', exact: true }).fill(caster.name);
  88  |   await roster(page).getByRole('button', { name: `Inspect ${caster.name} (${caster.id})`, exact: true }).click();
  89  |   const rites = roster(page).getByTestId('strategic-rites');
  90  |   await rites.getByRole('button', { name: 'Perform Seam warding', exact: true }).click();
  91  |   await expect(rites.getByTestId(`ward-${host.id}`)).toContainText('10 turns remaining');
  92  |   await roster(page).getByRole('button', { name: 'Close characters', exact: true }).click();
  93  | 
  94  |   await page.getByRole('button', { name: 'End turn', exact: true }).click();
  95  |   await expect(page.getByTestId('turn-counter')).toHaveText('Turn 2');
  96  |   expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.wards?.length ?? 0)).toBe(0);
  97  |   expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.sieges.map(siege => [siege.defenses, siege.warded ?? false]))).toEqual([[20, false]]);
  98  |   await page.getByRole('button', { name: 'Characters & agents', exact: true }).click();
  99  |   await roster(page).getByRole('searchbox', { name: 'Search characters', exact: true }).fill(caster.name);
  100 |   await roster(page).getByRole('button', { name: `Inspect ${caster.name} (${caster.id})`, exact: true }).click();
> 101 |   await expect(roster(page).getByTestId('character-sheet')).toContainText('wounded · 2 turns');
      |                                                             ^ Error: expect(locator).toContainText(expected) failed
  102 |   await expect(rites.getByTestId(`ward-${host.id}`)).toHaveCount(0);
  103 |   await expect(rites).toContainText('This caster must recover from wounds.');
  104 |   await rites.screenshot({ path: testInfo.outputPath('ward-broken.png') });
  105 |   expect(errors).toEqual([]);
  106 | });
  107 | 
```