import { describe, expect, it } from 'vitest';
import { createArchive, applyRecordedCommand, parseArchive, replayArchive } from './index';
import { deserializeGame, serializeGame, stateHash, type GameCommand } from '@theandril/sim';
import { navalCampaign, NAVAL_FIXTURE as N } from '../../test-fixtures/src/naval-fixture';

describe('naval campaign evidence', () => {
  it('records a real officer, boarding, researched ocean route and landing across a saved voyage without rewriting history', () => {
    const game = navalCampaign({ enemyFleet: false }), factionId = game.turnOwnerId;
    const archive = createArchive(game, { mode: 'player', coverage: 'from-save' });
    const before = game.armies[N.cargoId]!.formations.map(item => item.id);
    const commands: GameCommand[] = [
      { type: 'assignCharacter', factionId, characterId: N.marshalId, armyId: N.cargoId },
      { type: 'research', factionId, technologyId: 'technology.ocean_navigation' },
      { type: 'embarkArmy', factionId, armyId: N.cargoId, fleetId: N.fleetId },
      { type: 'queueMovement', factionId, armyId: N.fleetId, target: N.landingWaterCell },
    ];
    for (const command of commands) expect(applyRecordedCommand(game, archive, command)).toMatchObject({ ok: true });
    const prior = structuredClone(archive.records), saved = deserializeGame(serializeGame(game));
    const mirror = parseArchive(structuredClone(archive), saved);
    const continuation: GameCommand[] = [{ type: 'endTurn', factionId }, { type: 'endTurn', factionId }, { type: 'disembarkArmy', factionId, armyId: N.cargoId, target: N.landingCell }];
    for (const command of continuation) {
      const result = applyRecordedCommand(game, archive, command);
      expect(result, JSON.stringify(command)).toMatchObject({ ok: true });
      expect(applyRecordedCommand(saved, mirror, command)).toEqual(result);
    }
    expect(game.armies[N.cargoId]!.formations.map(item => item.id)).toEqual(before);
    expect(game.characters[N.marshalId]).toMatchObject({ location: { kind: 'army', armyId: N.cargoId }, dead: false });
    expect(game.armies[N.cargoId]).toMatchObject({ cell: N.landingCell, movement: 0 });
    expect(archive.records.slice(0, prior.length)).toEqual(prior);
    expect(archive).toEqual(mirror); expect(stateHash(saved)).toBe(stateHash(game));
    expect(archive.records.flatMap(record => record.events).map(event => event.type)).toEqual(expect.arrayContaining(['army_embarked', 'army_disembarked', 'movement_completed', 'technology_researched']));
    expect(serializeGame(replayArchive(parseArchive(archive, game)))).toBe(serializeGame(game));
  });
});
