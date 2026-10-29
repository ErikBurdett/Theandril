# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: patrol-retirement.spec.ts >> production AI watch retires a genuinely captured hearth patrol and saves its subsequent ordinary movement
- Location: tests/production/patrol-retirement.spec.ts:16:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByTestId('watch-controls')
Expected substring: "AI watch paused"
Error: element(s) not found

Call log:
  - Expect "toContainText" getByTestId('watch-controls') with timeout 5000ms
  - waiting for getByTestId('watch-controls')
  - Protocol error (Runtime.callFunctionOn): Page crashed.

```

```yaml
- button "Import save file"
- banner:
  - text: The age of fracture
  - heading "Theandril" [level=1]
- group: Campaign & settings
- main:
  - text: Keep the hearth. Keep the oath.
  - heading "From the ashes, a new dominion." [level=2]
  - paragraph: "The old roads end in wilderness. Lead your chosen people beyond their last milestones: chart the forests, raise a settlement, and give your people a future."
  - paragraph: Found a hearth. Work its land. Send wayfinders into the unknown.
  - paragraph:
    - link "Developer updates (opens in a new tab)":
      - /url: /updates/
      - text: Developer updates
  - text: A chronicle begins
  - heading "Establish your campaign" [level=2]
  - heading "Ashen Compact" [level=3]
  - paragraph: Your chosen player seat
  - region "Player culture":
    - text: Player faction
    - combobox "Player faction":
      - option "Ashen Compact" [selected]
      - option "Reedbound Council"
      - option "Cinder March"
      - option "Glass Tide"
      - option "Iron Covenant"
      - option "Sepulchral Synod"
      - option "Mire Courts"
      - option "Saltwind Remnant"
      - option "Wardhall Remnant"
      - option "Rimehorn Clans"
      - option "Sable Steppe"
      - option "Morrow Spore"
      - option "Cistern Assembly"
      - option "Unsealed Companies"
      - option "Lantern Hospices"
      - option "Cairnwing Concord"
      - option "Red Sluice Directorate"
      - option "Velvet Meridian"
      - option "Brine Choir"
      - option "Emberwake Convocation"
      - option "Underhush Exchange"
      - option "Vesper Court"
      - option "Manytrack Moot"
      - option "Margin Observance"
    - paragraph: Keep the hearth. Keep the oath.
    - paragraph: Public hearth councils rebuild reliable workshops while frontier households contest their share of the common grain.
    - paragraph:
      - strong: Worked-land strengths & drawbacks
    - list "Biome affinities":
      - listitem:
        - strong: Temperate grassland
        - text: ": +1 food per worked tile"
      - listitem:
        - strong: Temperate forest
        - text: ": +1 industry per worked tile"
      - listitem:
        - strong: Tundra
        - text: ": −1 food per worked tile"
      - listitem:
        - strong: Desert
        - text: ": −1 food per worked tile"
    - paragraph: Unlisted biomes are neutral. These contributions modify worked tiles, not movement or combat.
    - paragraph: "Cultivation traditions: Temperate grassland, Temperate forest. Cultivation is paid work, not free conversion."
    - group: Recruitment tendencies
  - text: World seed
  - textbox "World seed":
    - /placeholder: Random for each new campaign
  - paragraph: Leave blank for a fresh random world. Enter a seed to revisit a world; its seed is shown above the map.
  - text: World size
  - combobox "World size":
    - option "Tiny · 1,536 hexes · 4 realms"
    - option "Small · 19,360 hexes · 8 realms"
    - option "Standard · 31,360 hexes · 12 realms" [selected]
    - option "Large · 51,840 hexes · 16 realms"
    - option "Huge · 77,440 hexes · 20 realms"
  - text: Faction count
  - spinbutton "Faction count": "12"
  - text: City-states
  - spinbutton "City-states": "8"
  - paragraph: "Independent single-city powers that settle the land between realms and can be conquered like any neighbour. Recommended here: 8. They borrow a culture's art under their own banner colour."
  - paragraph: "Recommended for this size: 12 realms. Changing world size resets this recommendation; you can override it. 24 introductory faction templates are authored. Additional seats are generated variants, not additional authored nations. Extreme crowding is not balanced."
  - text: Map type
  - combobox "Map type":
    - option "Continents" [selected]
    - option "Pangaea"
    - option "Fractal"
    - option "Islands"
    - option "Archipelago"
    - option "Earth-like"
    - option "Inland Sea"
  - paragraph: Two or three large continents separated by open ocean, with offshore islands.
  - text: Campaign pace
  - combobox "Campaign pace":
    - option "Short · test/skirmish"
    - option "Standard · about 200 turns" [selected]
    - option "Long · about 300 turns"
    - option "Epic · about 350–400 turns"
  - paragraph: A full campaign aiming for about two hundred turns, with a twenty-turn window to oppose public projects. Actual length depends on play. Pace changes economic costs and the public response window, not AI strength. Campaign length varies with play.
  - text: Campaign mode
  - combobox "Campaign mode":
    - option "Lead a realm" [selected]
    - option "AI watch"
  - paragraph: The same seed, size, map type and faction count create the same world within a generator version. Larger maps need more realms to create nearby rivals; terrain can still separate them.
  - button "Begin campaign" [disabled]
  - button "Load campaign" [disabled]
  - button "Restore autosave" [disabled]
  - button "Import campaign" [disabled]
  - region "Introductory cultures":
    - heading "Introductory cultures" [level=3]
    - paragraph: Public culture reference, not a player-seat selector. Generated realms reuse these traditions; their locations and forces must still be discovered.
    - article:
      - img "Ashen Compact crest · generic presentation. The source image cannot be decoded."
      - heading "Ashen Compact" [level=4]
      - paragraph: Keep the hearth. Keep the oath.
    - article:
      - img "Reedbound Council crest · generic presentation. The source image cannot be decoded."
      - heading "Reedbound Council" [level=4]
      - paragraph: No river belongs to one shore.
    - article:
      - img "Cinder March crest · generic presentation. The source image cannot be decoded."
      - heading "Cinder March" [level=4]
      - paragraph: We hold what the fire spared.
    - article:
      - img "Glass Tide crest · generic presentation. The source image cannot be decoded."
      - heading "Glass Tide" [level=4]
      - paragraph: Every horizon is a promise.
    - article:
      - img "Iron Covenant crest · generic presentation. The source image cannot be decoded."
      - heading "Iron Covenant" [level=4]
      - paragraph: The hold endures. The valley is owed.
    - article:
      - img "Sepulchral Synod crest · generic presentation. The source image cannot be decoded."
      - heading "Sepulchral Synod" [level=4]
      - paragraph: No measure ends at the grave.
    - article:
      - img "Mire Courts crest · generic presentation. The source image cannot be decoded."
      - heading "Mire Courts" [level=4]
      - paragraph: The season returns. The court remembers.
    - article:
      - img "Saltwind Remnant crest · generic presentation. The source image cannot be decoded."
      - heading "Saltwind Remnant" [level=4]
      - paragraph: A keel is pledged only once.
    - article:
      - img "Wardhall Remnant crest · generic presentation. The source image cannot be decoded."
      - heading "Wardhall Remnant" [level=4]
      - paragraph: Let the work stand witness.
    - article:
      - img "Rimehorn Clans crest · generic presentation. The source image cannot be decoded."
      - heading "Rimehorn Clans" [level=4]
      - paragraph: Share the shelter. Answer the horn.
    - article:
      - img "Sable Steppe crest · generic presentation. The source image cannot be decoded."
      - heading "Sable Steppe" [level=4]
      - paragraph: The road moves with the camp.
    - article:
      - img "Morrow Spore crest · generic presentation. The source image cannot be decoded."
      - heading "Morrow Spore" [level=4]
      - paragraph: What falls shall feed what follows.
    - article:
      - img "Cistern Assembly crest · generic presentation. The source image cannot be decoded."
      - heading "Cistern Assembly" [level=4]
      - paragraph: Read the measure. Share the draw.
    - article:
      - img "Unsealed Companies crest · generic presentation. The source image cannot be decoded."
      - heading "Unsealed Companies" [level=4]
      - paragraph: The living make their own terms.
    - article:
      - img "Lantern Hospices crest · generic presentation. The source image cannot be decoded."
      - heading "Lantern Hospices" [level=4]
      - paragraph: Keep a place beside the lamp.
    - article:
      - img "Cairnwing Concord crest · generic presentation. The source image cannot be decoded."
      - heading "Cairnwing Concord" [level=4]
      - paragraph: No ledge stands without the lift.
    - article:
      - img "Red Sluice Directorate crest · generic presentation. The source image cannot be decoded."
      - heading "Red Sluice Directorate" [level=4]
      - paragraph: Count the harvest. Answer the banks.
    - article:
      - img "Velvet Meridian crest · generic presentation. The source image cannot be decoded."
      - heading "Velvet Meridian" [level=4]
      - paragraph: A measure is not the final word.
    - article:
      - img "Brine Choir crest · generic presentation. The source image cannot be decoded."
      - heading "Brine Choir" [level=4]
      - paragraph: Let every shore be heard.
    - article:
      - img "Emberwake Convocation crest · generic presentation. The source image cannot be decoded."
      - heading "Emberwake Convocation" [level=4]
      - paragraph: Keep the seed. Account for the fire.
    - article:
      - img "Underhush Exchange crest · generic presentation. The source image cannot be decoded."
      - heading "Underhush Exchange" [level=4]
      - paragraph: Leave room for those who dwell.
    - article:
      - img "Vesper Court crest · generic presentation. The source image cannot be decoded."
      - heading "Vesper Court" [level=4]
      - paragraph: Hospitality must have an ending.
    - article:
      - img "Manytrack Moot crest · generic presentation. The source image cannot be decoded."
      - heading "Manytrack Moot" [level=4]
      - paragraph: Unlike tracks may share a road.
    - article:
      - img "Margin Observance crest · generic presentation. The source image cannot be decoded."
      - heading "Margin Observance" [level=4]
      - paragraph: Keep the gap beside the record.
- contentinfo:
  - status: Resolving… A world of broken oaths awaits a new beginning.
```

# Test source

```ts
  1  | import { createHash } from 'node:crypto';
  2  | import { readFileSync, writeFileSync } from 'node:fs';
  3  | import { expect, test } from '@playwright/test';
  4  | import { deserializeGame, getObservation, stateHash, stateHashForVersion } from '@theandril/sim';
  5  | import { createArchive, type ArchiveRecord } from '@theandril/chronicle';
  6  | import { exportSave, serializeCampaign } from '@theandril/persistence';
  7  | import { campaignMenu, exportedTravel } from '../gameplay/group-movement-fixture';
  8  | 
  9  | const armyId = 'army.408', factionId = 'faction.wardhall_remnant';
  10 | const armyOrder = (record: ArchiveRecord, type: string) => {
  11 |   const command = record.command;
  12 |   return command && typeof command === 'object' && 'type' in command && command.type === type
  13 |     && 'armyId' in command && command.armyId === armyId && 'factionId' in command && command.factionId === factionId;
  14 | };
  15 | 
  16 | test('production AI watch retires a genuinely captured hearth patrol and saves its subsequent ordinary movement', async ({ page }, testInfo) => {
  17 |   const snapshot = readFileSync(new URL('../../docs/development/2026-10-24-patrol-recovery/diagnosis-recovered/snapshot-3-turn-150.json', import.meta.url), 'utf8');
  18 |   const snapshotSha256 = createHash('sha256').update(snapshot).digest('hex');
  19 |   expect(snapshotSha256).toBe('e8b68f936e8f7042f04465f879e669ef038cc27a9c927781fe368075a9e92b25');
  20 |   const game = deserializeGame(snapshot), initialHash = stateHash(game), historicalHash = stateHashForVersion(game, 35);
  21 |   expect(historicalHash).toBe('4f60f2e3');
  22 |   expect(game.patrols.find(patrol => patrol.armyId === armyId)).toMatchObject({ enabled: true, pauseOnWar: false, firstCell: 8431, secondCell: 9108, target: 'second' });
  23 |   expect(game.routes[armyId]).toMatchObject({ status: 'paused', waypoints: [9108] });
  24 |   const view = getObservation(game, factionId);
  25 |   expect(view.settlements.find(town => town.cell === 9108)).toMatchObject({ id: 'settlement.517', factionId: 'faction.ashen_compact' });
  26 |   expect(view.cells.find(cell => cell.cell === 9108)?.visible).toBe(true);
  27 |   expect(view.settlements.find(town => town.cell === 8431)?.factionId).toBe(factionId);
  28 |   const initialCell = game.armies[armyId]!.cell;
  29 |   expect(initialCell).toBe(8659);
  30 |   // This genuine campaign snapshot was captured mid-round. Import starts a new
  31 |   // full Watch planning round and records history from this save, not before it.
  32 |   const bytes = await exportSave(serializeCampaign(game, createArchive(game, { mode: 'watch', coverage: 'from-save' })));
  33 |   const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  34 |   await page.goto('./');
  35 |   expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  36 |   await page.getByLabel('Import save file').setInputFiles({ name: 'captured-hearth-watch.theandril', mimeType: 'application/gzip', buffer: Buffer.from(bytes) });
  37 |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  38 |   await expect(page.getByTestId('watch-controls')).toContainText('AI watch paused');
  39 |   await expect(page.getByTestId('turn-counter')).toHaveText('Turn 150');
  40 |   await page.getByRole('button', { name: 'Step one round', exact: true }).click();
  41 |   await expect(page.getByTestId('turn-counter')).toHaveText('Turn 151');
  42 |   await expect(page.getByRole('button', { name: 'Step one round', exact: true })).toBeEnabled();
  43 |   let retired = await exportedTravel(page);
  44 |   const clear = retired.archive.records.find(record => armyOrder(record, 'clearPatrol'));
  45 |   expect(clear).toMatchObject({ ok: true, error: null });
  46 |   expect(retired.game.patrols.some(patrol => patrol.armyId === armyId)).toBe(false);
  47 |   const rounds = [{ turn: retired.game.turn, cell: retired.game.armies[armyId]?.cell, hash: stateHash(retired.game) }];
  48 |   const movement = () => retired.archive.records.find(record => armyOrder(record, 'moveTo') && record.ok && record.sequence > clear!.sequence);
  49 |   // The cleanup batch retains its reservation. Let subsequent real Watch rounds
  50 |   // observe the released army and issue ordinary orders; never inject a move.
  51 |   for (let round = 0; round < 2 && (!movement() || retired.game.armies[armyId]?.cell === initialCell); round++) {
  52 |     await page.getByTestId('campaign-menu').locator(':scope > summary').click();
  53 |     await page.getByRole('button', { name: 'Step one round', exact: true }).click();
  54 |     await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${152 + round}`);
  55 |     await expect(page.getByRole('button', { name: 'Step one round', exact: true })).toBeEnabled();
  56 |     retired = await exportedTravel(page);
  57 |     rounds.push({ turn: retired.game.turn, cell: retired.game.armies[armyId]?.cell, hash: stateHash(retired.game) });
  58 |   }
  59 |   expect(movement()).toBeTruthy();
  60 |   expect(retired.game.armies[armyId]).toBeDefined();
  61 |   expect(retired.game.armies[armyId]!.cell).not.toBe(initialCell);
  62 |   expect(retired.game.patrols.some(patrol => patrol.armyId === armyId)).toBe(false);
  63 |   await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  64 |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  65 |   await page.reload();
  66 |   await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
> 67 |   await expect(page.getByTestId('watch-controls')).toContainText('AI watch paused');
     |                                                    ^ Error: expect(locator).toContainText(expected) failed
  68 |   const restored = await exportedTravel(page);
  69 |   expect(restored.archive).toEqual(retired.archive);
  70 |   expect(stateHash(restored.game)).toBe(stateHash(retired.game));
  71 |   writeFileSync(testInfo.outputPath('production-watch-patrol-retired.theandril'), restored.bytes);
  72 |   writeFileSync(testInfo.outputPath('production-watch-patrol-retirement.json'), `${JSON.stringify({ snapshotSha256, historicalHash, initialHash, initialCell,
  73 |     coverage: restored.archive.coverage, rounds, clear, movement: movement(), finalHash: stateHash(restored.game), records: restored.archive.records.length }, null, 2)}\n`);
  74 |   await campaignMenu(page);
  75 |   await page.getByTestId('campaign-menu').locator(':scope > summary').click();
  76 |   // The visible realm is the Ashen observer; the exported archive proves the
  77 |   // Wardhall orders. This screenshot is not a claim to reveal foreign controls.
  78 |   await page.screenshot({ path: testInfo.outputPath('production-watch-patrol-retired.png') });
  79 |   expect(errors).toEqual([]);
  80 | });
  81 | 
```