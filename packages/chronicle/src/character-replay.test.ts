import { describe, expect, it } from 'vitest';
import { UNITS } from '@theandril/content';
import { createGame, deserializeGame, serializeGame, stateHash } from '@theandril/sim';
import type { GameCommand, GameState } from '@theandril/sim';
import { applyRecordedCommand, createArchive, parseArchive, replayArchive } from './index';
import type { CampaignArchive } from './index';
import captured from './fixtures/v6-archives.json';

function issue(game: GameState, archive: CampaignArchive, command: GameCommand): void {
  const result = applyRecordedCommand(game, archive, command);
  expect(result.ok, JSON.stringify(command) + ': ' + result.error).toBe(true);
}
function recruit(game: GameState, archive: CampaignArchive, settlementId: string, definitionId: string): string {
  const before = new Set(Object.keys(game.characters));
  issue(game, archive, { type: 'recruitCharacter', factionId: game.turnOwnerId, settlementId, definitionId });
  const added = Object.keys(game.characters).filter(id => !before.has(id));
  expect(added).toHaveLength(1);
  return added[0]!;
}
function resume(game: GameState, archive: CampaignArchive): { game: GameState; archive: CampaignArchive } {
  const restored = deserializeGame(serializeGame(game));
  const history = parseArchive(structuredClone(archive), restored);
  expect(stateHash(restored)).toBe(stateHash(game));
  expect(history).toEqual(archive);
  return { game: restored, archive: history };
}

describe('character commands survive complete archive replay', () => {
  it('records a generated-start named surveyor and a real saved mission that extends geographic knowledge', () => {
    const game = createGame({ seed: 74, size: 'tiny', factionCount: 1, pace: 'short' });
    const archive = createArchive(game, { mode: 'player' });
    const factionId = game.turnOwnerId;
    issue(game, archive, { type: 'found', factionId, armyId: 'army.1', name: 'Witness hearth' });
    const town = Object.values(game.settlements)[0]!;
    const characterId = recruit(game, archive, town.id, 'character.surveyor');
    issue(game, archive, { type: 'assignCharacter', factionId, characterId, armyId: 'army.2' });
    const before = game.explored[factionId]!.size;
    issue(game, archive, { type: 'startCharacterMission', factionId, characterId, missionId: 'mission.survey', targetCell: game.armies['army.2']!.cell });
    issue(game, archive, { type: 'endTurn', factionId });
    expect(game.characters[characterId]?.mission).toMatchObject({ definitionId: 'mission.survey', armyId: 'army.2', remainingTurns: 1 });
    expect(game.armies['army.2']!.movement).toBe(0);
    const mirrored = resume(game, archive);
    const end = { type: 'endTurn' as const, factionId };
    issue(game, archive, end); issue(mirrored.game, mirrored.archive, end);
    expect(game.explored[factionId]!.size).toBeGreaterThan(before);
    expect(game.characters[characterId]).toMatchObject({ experience: 4, mission: null, dead: false });
    expect(archive).toEqual(mirrored.archive);
    expect(stateHash(game)).toBe(stateHash(mirrored.game));
    expect(serializeGame(replayArchive(parseArchive(archive, game)))).toBe(serializeGame(game));
    expect(archive.records.some(record => (record.command as { type: string }).type === 'startCharacterMission')).toBe(true);
  });

  it('records actual marshal leadership, Rally and per-character battle aftermath across a saved tactical round', () => {
    // A disclosed authored border fixture supplies the opposing mixed rosters; no fake result.
    let game = deserializeGame(captured.battle.archive.initialSave);
    for (const formation of game.armies['army.2']!.formations) formation.morale = 30;
    game = deserializeGame(serializeGame(game));
    const archive = createArchive(game, { mode: 'player', coverage: 'from-save' });
    const factionId = game.turnOwnerId;
    const town = Object.values(game.settlements).find(town => town.factionId === factionId)!;
    const originalCell = game.armies['army.2']!.cell;
    issue(game, archive, { type: 'moveTo', factionId, armyId: 'army.2', target: town.cell });
    const characterId = recruit(game, archive, town.id, 'character.marshal');
    issue(game, archive, { type: 'assignCharacter', factionId, characterId, armyId: 'army.2' });
    issue(game, archive, { type: 'endTurn', factionId });
    issue(game, archive, { type: 'moveTo', factionId, armyId: 'army.2', target: originalCell });
    issue(game, archive, { type: 'declareWar', factionId, targetFactionId: game.factions[1]!.id });
    issue(game, archive, { type: 'attack', factionId, armyId: 'army.2', targetArmyId: 'army.4' });
    expect(game.battle?.characterSnapshots).toHaveLength(1);
    for (const formation of game.battle!.combat.attacker) {
      expect(formation.attack).toBe(UNITS.find(unit => unit.id === formation.unitId)!.attack + 1);
    }
    const rng = game.battle!.combat.rngState;
    const morale = game.battle!.combat.attacker.reduce((sum, formation) => sum + formation.morale, 0);
    issue(game, archive, { type: 'useCommanderAbility', factionId, characterId, abilityId: 'ability.rally' });
    expect(game.battle!.combat.attacker.reduce((sum, formation) => sum + formation.morale, 0)).toBeGreaterThan(morale);
    expect(game.battle!.combat.rngState).toBe(rng);
    issue(game, archive, { type: 'battleOrder', factionId, order: 'brace' });
    expect(game.battle).not.toBeNull();
    const mirrored = resume(game, archive);
    for (const command of [{ type: 'autoResolveBattle' as const, factionId }, { type: 'endTurn' as const, factionId }]) {
      issue(game, archive, command); issue(mirrored.game, mirrored.archive, command);
    }
    const report = game.battleReports.at(-1)!;
    expect(report.characterSnapshots).toHaveLength(1);
    expect(report.characterAftermath).toHaveLength(1);
    expect(report.usedAbilities).toEqual([{ characterId, abilityId: 'ability.rally' }]);
    expect(archive).toEqual(mirrored.archive);
    expect(serializeGame(replayArchive(parseArchive(archive, game)))).toBe(serializeGame(game));
    expect(stateHash(game)).toBe(stateHash(mirrored.game));
  });
});
