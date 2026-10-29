# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: patrol-recovery.spec.ts >> production AI watch reviews a genuinely stalled patrol and preserves the resumed history through save recovery
- Location: tests/production/patrol-recovery.spec.ts:8:1

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
      - img "Ashen Compact crest · generic presentation. Failed to fetch"
      - heading "Ashen Compact" [level=4]
      - paragraph: Keep the hearth. Keep the oath.
    - article:
      - img "Reedbound Council crest · generic presentation. Failed to fetch"
      - heading "Reedbound Council" [level=4]
      - paragraph: No river belongs to one shore.
    - article:
      - img "Cinder March crest · generic presentation. Failed to fetch"
      - heading "Cinder March" [level=4]
      - paragraph: We hold what the fire spared.
    - article:
      - img "Glass Tide crest · generic presentation. Failed to fetch"
      - heading "Glass Tide" [level=4]
      - paragraph: Every horizon is a promise.
    - article:
      - img "Iron Covenant crest · generic presentation. Failed to fetch"
      - heading "Iron Covenant" [level=4]
      - paragraph: The hold endures. The valley is owed.
    - article:
      - img "Sepulchral Synod crest · generic presentation. Failed to fetch"
      - heading "Sepulchral Synod" [level=4]
      - paragraph: No measure ends at the grave.
    - article:
      - img "Mire Courts crest · generic presentation. Failed to fetch"
      - heading "Mire Courts" [level=4]
      - paragraph: The season returns. The court remembers.
    - article:
      - img "Saltwind Remnant crest · generic presentation. Failed to fetch"
      - heading "Saltwind Remnant" [level=4]
      - paragraph: A keel is pledged only once.
    - article:
      - img "Wardhall Remnant crest · generic presentation. Failed to fetch"
      - heading "Wardhall Remnant" [level=4]
      - paragraph: Let the work stand witness.
    - article:
      - img "Rimehorn Clans crest · generic presentation. Failed to fetch"
      - heading "Rimehorn Clans" [level=4]
      - paragraph: Share the shelter. Answer the horn.
    - article:
      - img "Sable Steppe crest · generic presentation. Failed to fetch"
      - heading "Sable Steppe" [level=4]
      - paragraph: The road moves with the camp.
    - article:
      - img "Morrow Spore crest · generic presentation. Failed to fetch"
      - heading "Morrow Spore" [level=4]
      - paragraph: What falls shall feed what follows.
    - article:
      - img "Cistern Assembly crest · generic presentation. Failed to fetch"
      - heading "Cistern Assembly" [level=4]
      - paragraph: Read the measure. Share the draw.
    - article:
      - img "Unsealed Companies crest · generic presentation. Failed to fetch"
      - heading "Unsealed Companies" [level=4]
      - paragraph: The living make their own terms.
    - article:
      - img "Lantern Hospices crest · generic presentation. Failed to fetch"
      - heading "Lantern Hospices" [level=4]
      - paragraph: Keep a place beside the lamp.
    - article:
      - img "Cairnwing Concord crest · generic presentation. Failed to fetch"
      - heading "Cairnwing Concord" [level=4]
      - paragraph: No ledge stands without the lift.
    - article:
      - img "Red Sluice Directorate crest · generic presentation. Failed to fetch"
      - heading "Red Sluice Directorate" [level=4]
      - paragraph: Count the harvest. Answer the banks.
    - article:
      - img "Velvet Meridian crest · generic presentation. Failed to fetch"
      - heading "Velvet Meridian" [level=4]
      - paragraph: A measure is not the final word.
    - article:
      - img "Brine Choir crest · generic presentation. Failed to fetch"
      - heading "Brine Choir" [level=4]
      - paragraph: Let every shore be heard.
    - article:
      - img "Emberwake Convocation crest · generic presentation. Failed to fetch"
      - heading "Emberwake Convocation" [level=4]
      - paragraph: Keep the seed. Account for the fire.
    - article:
      - img "Underhush Exchange crest · generic presentation. Failed to fetch"
      - heading "Underhush Exchange" [level=4]
      - paragraph: Leave room for those who dwell.
    - article:
      - img "Vesper Court crest · generic presentation. Failed to fetch"
      - heading "Vesper Court" [level=4]
      - paragraph: Hospitality must have an ending.
    - article:
      - img "Manytrack Moot crest · generic presentation. Failed to fetch"
      - heading "Manytrack Moot" [level=4]
      - paragraph: Unlike tracks may share a road.
    - article:
      - img "Margin Observance crest · generic presentation. Failed to fetch"
      - heading "Margin Observance" [level=4]
      - paragraph: Keep the gap beside the record.
- contentinfo:
  - status: Resolving… A world of broken oaths awaits a new beginning.
```

# Test source

```ts
  1  | import { readFileSync } from 'node:fs';
  2  | import { expect, test } from '@playwright/test';
  3  | import { deserializeGame, stateHash, stateHashForVersion } from '@theandril/sim';
  4  | import { createArchive } from '@theandril/chronicle';
  5  | import { exportSave, serializeCampaign } from '@theandril/persistence';
  6  | import { campaignMenu, exportedTravel } from '../gameplay/group-movement-fixture';
  7  | 
  8  | test('production AI watch reviews a genuinely stalled patrol and preserves the resumed history through save recovery', async ({ page }, testInfo) => {
  9  |   const game = deserializeGame(readFileSync(new URL('../../docs/development/2026-10-24-patrol-recovery/diagnosis-long/snapshot-1-turn-58.json', import.meta.url), 'utf8'));
  10 |   expect(stateHashForVersion(game, 35)).toBe('17c538ce');
  11 |   // The generated snapshot is captured mid-round; watch explicitly starts a new
  12 |   // full planning round from it. This is not a claim of the original full history.
  13 |   const bytes = await exportSave(serializeCampaign(game, createArchive(game, { mode: 'watch', coverage: 'from-save' })));
  14 |   const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  15 |   await page.goto('./');
  16 |   expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  17 |   await page.getByLabel('Import save file').setInputFiles({ name: 'stalled-watch.theandril', mimeType: 'application/gzip', buffer: Buffer.from(bytes) });
  18 |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  19 |   await expect(page.getByTestId('watch-controls')).toContainText('AI watch paused');
  20 |   await expect(page.getByTestId('turn-counter')).toHaveText('Turn 58');
  21 |   await page.getByRole('button', { name: 'Step one round', exact: true }).click();
  22 |   await expect(page.getByTestId('turn-counter')).toHaveText('Turn 59');
  23 |   await expect(page.getByRole('button', { name: 'Step one round', exact: true })).toBeEnabled();
  24 |   const resumed = await exportedTravel(page);
  25 |   const recovery = resumed.archive.records.find(record => {
  26 |     const command = record.command;
  27 |     return command && typeof command === 'object' && 'type' in command && command.type === 'resumeMovement'
  28 |       && 'armyId' in command && command.armyId === 'army.198';
  29 |   });
  30 |   expect(recovery).toBeTruthy();
  31 |   expect(resumed.game.patrols.find(patrol => patrol.armyId === 'army.198')).toMatchObject({ enabled: true, pauseOnWar: false, firstCell: 10368, secondCell: 10149 });
  32 |   expect(resumed.game.armies['army.198']?.cell).not.toBe(10146);
  33 |   await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  34 |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  35 |   await page.reload();
  36 |   await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
> 37 |   await expect(page.getByTestId('watch-controls')).toContainText('AI watch paused');
     |                                                    ^ Error: expect(locator).toContainText(expected) failed
  38 |   const restored = await exportedTravel(page);
  39 |   expect(restored.archive).toEqual(resumed.archive);
  40 |   expect(stateHash(restored.game)).toBe(stateHash(resumed.game));
  41 |   await campaignMenu(page);
  42 |   await page.getByTestId('campaign-menu').locator(':scope > summary').click();
  43 |   await page.screenshot({ path: testInfo.outputPath('production-watch-patrol-recovered.png') });
  44 |   expect(errors).toEqual([]);
  45 | });
  46 | 
```