import { describe, expect, it } from 'vitest';
import { FACTIONS, FACTION_ECOLOGIES, UNITS, characterName, checksum } from '@theandril/content';
import { applyCommand, applyCommandForVersion, createGame, deserializeGame, getObservation, getSettlementLandObservation, serializeGame, serializeGameForVersion, stateHash, type GameCommand } from './index';

describe('versioned faction rosters and paid new-culture campaigns', () => {
  it('separates physical generator identity from four, six, twelve and twenty-four culture catalogs', () => {
    const options = { seed: 74, size: 'tiny', factionCount: 13, generatorVersion: 4 } as const;
    const four = createGame({ ...options, rosterVersion: 1 }), six = createGame({ ...options, rosterVersion: 2 }), twelve = createGame({ ...options, rosterVersion: 3 }), current = createGame(options);
    expect(twelve.rosterVersion).toBe(3);
    expect(four.factions[4]!.id).toBe('faction.ashen_compact.5');
    expect(six.factions[6]!.id).toBe('faction.ashen_compact.7');
    expect(twelve.factions[12]!.id).toBe('faction.ashen_compact.13');
    expect(new Set(twelve.factions.slice(0, 12).map(faction => faction.definitionId)).size).toBe(12);
    expect(current.rosterVersion).toBe(4); expect(current.factions[12]!.id).toBe('faction.cistern_assembly');
    for (const game of [four, six, twelve, current]) {
      expect(new Set(game.world.starts).size).toBe(13);
      expect(game.world.terrain).toEqual(twelve.world.terrain); expect(game.world.fertility).toEqual(twelve.world.fertility);
      expect(game.world.biome).toEqual(twelve.world.biome); expect(game.world.waterDepth).toEqual(twelve.world.waterDepth);
      expect(serializeGame(deserializeGame(serializeGame(game)))).toBe(serializeGame(game));
    }
    expect(() => createGame({ ...options, rosterVersion: 2, factionDefinitionId: 'faction.mire_courts' })).toThrow('historical roster');
    expect(() => createGame({ ...options, rosterVersion: 1, factionDefinitionId: 'faction.iron_covenant' })).toThrow('historical roster');
    expect(createGame({ ...options, generatorVersion: 1, factionDefinitionId: 'faction.morrow_spore' }).turnOwnerId).toBe('faction.morrow_spore');
  });

  it.each(FACTIONS.map(faction => faction.id))('%s founds, works, improves, cultivates and restores through ordinary paid commands', factionDefinitionId => {
    const game = createGame({ seed: 20260905, size: 'tiny', factionCount: 12, factionDefinitionId, pace: 'short', generatorVersion: 4 });
    const physical = structuredClone(game.world), mirror = deserializeGame(serializeGame(game)), factionId = game.turnOwnerId;
    const issue = (command: GameCommand) => {
      const result = applyCommand(game, command); expect(result.ok, result.error).toBe(true);
      expect(applyCommand(mirror, command)).toEqual(result);
      expect(stateHash(mirror)).toBe(stateHash(game));
    };
    const advance = () => issue({ type: 'endTurn', factionId });
    issue({ type: 'found', factionId, armyId: 'army.1', name: 'Living witness' });
    const townId = Object.keys(game.settlements)[0]!;
    const recruitment = getObservation(game, factionId).characterRecruitment.find(option => option.settlementId === townId && option.definitionId === 'character.surveyor');
    expect(recruitment?.canRecruit).toBe(true);
    const land = () => getSettlementLandObservation(game, factionId, townId)!;
    const site = land().cells.find(cell => cell.canWork && cell.improvementOptions.some(option => option.canStart))!;
    expect(site).toBeDefined();
    const option = site.improvementOptions.find(option => option.canStart)!;
    issue({ type: 'setWorkedTiles', factionId, settlementId: townId, cells: [site.cell] });
    const beforeCoin = game.factions[0]!.treasury;
    issue({ type: 'improveTile', factionId, settlementId: townId, cell: site.cell, improvementId: option.improvementId });
    expect(game.factions[0]!.treasury).toBe(beforeCoin - option.coinCost);
    expect(game.land.settlements[townId]!.work?.remainingTurns).toBe(option.turns);
    for (let turn = 0; turn < option.turns; turn++) advance();
    expect(game.land.settlements[townId]!.improvements[site.cell]).toBe(option.improvementId);
    const cultivation = () => land().cells.flatMap(cell => cell.terraformOptions.filter(option => option.canStart).map(option => ({ cell: cell.cell, option })))[0];
    for (let turn = 0; !cultivation() && turn < 40; turn++) advance();
    const chosen = cultivation(); expect(chosen).toBeDefined();
    const beforeCultivation = game.factions[0]!.treasury;
    issue({ type: 'terraformTile', factionId, settlementId: townId, cell: chosen!.cell, biome: chosen!.option.biome });
    expect(game.factions[0]!.treasury).toBe(beforeCultivation - chosen!.option.coinCost);
    advance();
    const pendingSave = serializeGame(game), resumed = deserializeGame(pendingSave);
    expect(serializeGame(resumed)).toBe(pendingSave); expect(game.land.settlements[townId]!.work?.kind).toBe('terraform');
    while (game.land.settlements[townId]!.work) {
      const command = { type: 'endTurn', factionId } as const;
      const result = applyCommand(resumed, command); issue(command); expect(result.ok).toBe(true);
      expect(stateHash(resumed)).toBe(stateHash(game));
    }
    expect(game.land.biomes[chosen!.cell]).toBe(chosen!.option.biome); expect(game.land.cultivation[factionId]).toBe(2);
    expect(game.world).toEqual(physical);
    const ecology = FACTION_ECOLOGIES[factionDefinitionId]!;
    for (const cell of land().cells.filter(cell => cell.claimed)) {
      expect(cell.yields.affinity).toEqual(ecology.affinities.find(item => item.biomeId === cell.biome)?.yields ?? { food: 0, industry: 0, coin: 0, knowledge: 0 });
    }
    const view = getObservation(game, factionId);
    expect(new Set(view.productionOptions.filter(option => option.settlementId === townId && option.itemId.startsWith('unit.')).map(option => option.itemId))).toEqual(new Set(UNITS.map(unit => unit.id)));
    expect(() => serializeGameForVersion(game, 9)).toThrow('frozen pre-expansion pack');
    // Removing unrelated modern growth must not make a roster4 save historical.
    const rosterProbe = deserializeGame(serializeGame(game));
    for (const land of Object.values(rosterProbe.land.settlements)) land.borderGrowth = 0;
    expect(() => serializeGameForVersion(rosterProbe, 9)).toThrow(/frozen.*(pack|roster)/);
    const hash = stateHash(game);
    expect(() => applyCommandForVersion(game, { type: 'endTurn', factionId }, 9)).toThrow('frozen roster');
    expect(stateHash(game)).toBe(hash);
  });

  it('rejects checksum-valid forged roster membership and missing or unknown canonical versions', () => {
    const game = createGame({ seed: 74, size: 'tiny', factionCount: 24 });
    const original = serializeGame(game), raw = JSON.parse(original) as { state: { rosterVersion?: number }; stateChecksum: string };
    for (const version of [1, 2, 3, 5, 0, 1.5, undefined]) {
      const changed = structuredClone(raw); changed.state.rosterVersion = version;
      changed.stateChecksum = checksum(JSON.stringify(changed.state));
      expect(() => deserializeGame(JSON.stringify(changed))).toThrow();
    }
    expect(serializeGame(game)).toBe(original);
  });

  it('creates 24 unique cultures, keeps 48-seat repetitions explicit and names a paid Vesper officer', () => {
    const game = createGame({ seed: 74, size: 'tiny', factionCount: 24, factionDefinitionId: 'faction.vesper_court' });
    expect(new Set(game.factions.map(faction => faction.definitionId)).size).toBe(24);
    expect(game.turnOwnerId).toBe('faction.vesper_court');
    expect(applyCommand(game, { type: 'found', factionId: game.turnOwnerId, armyId: 'army.1', name: 'Shuttered welcome' }).ok).toBe(true);
    const settlementId = Object.keys(game.settlements)[0]!, serial = game.nextId, beforeCoin = game.factions[0]!.treasury;
    expect(applyCommand(game, { type: 'recruitCharacter', factionId: game.turnOwnerId, settlementId, definitionId: 'character.marshal' }).ok).toBe(true);
    expect(game.characters[`character.${serial}`]!.name).toBe(characterName('faction.vesper_court', serial));
    expect(game.factions[0]!.treasury).toBeLessThan(beforeCoin);
    expect(serializeGame(deserializeGame(serializeGame(game)))).toBe(serializeGame(game));
    const many = createGame({ seed: 74, size: 'tiny', factionCount: 48 });
    expect(new Set(many.factions.map(faction => faction.id)).size).toBe(48);
    expect(new Set(many.factions.map(faction => faction.definitionId)).size).toBe(24);
    expect(many.factions[24]!.id).toBe('faction.ashen_compact.25');
  });
});
