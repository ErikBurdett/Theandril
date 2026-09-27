import { describe, expect, it } from 'vitest';
import { checksum } from '@theandril/content';
import { applyCommand, createGame, deserializeGame, serializeGame, stateHash } from './index';

function delegated() {
  const game = createGame({ seed: 20260927, size: 'tiny', generatorVersion: 4, factionCount: 2, cityStateCount: 0 });
  const factionId = game.turnOwnerId;
  expect(applyCommand(game, { type: 'found', factionId, armyId: 'army.1', name: 'Saveward' }).ok).toBe(true);
  expect(applyCommand(game, { type: 'setTheater', factionId, name: 'Saveward defense', settlementIds: Object.keys(game.settlements),
    armyIds: ['army.2'], reserveCell: game.armies['army.2']!.cell, guardsPerSettlement: 2, enabled: true }).ok).toBe(true);
  return game;
}
function reseal(envelope: ReturnType<typeof JSON.parse>) {
  envelope.stateChecksum = checksum(JSON.stringify(envelope.state));
  return JSON.stringify(envelope);
}

describe('strict rules33 theater persistence', () => {
  it('retains the independent counter, delegated configuration and factual bounded dispatch report in the current hash', () => {
    const game = delegated(), before = stateHash(game);
    expect(applyCommand(game, { type: 'endTurn', factionId: game.turnOwnerId }).ok).toBe(true);
    expect(game.theaters[0]?.lastRunTurn).toBe(game.turn);
    expect(stateHash(game)).not.toBe(before);
    const save = serializeGame(game), loaded = deserializeGame(save);
    expect(JSON.parse(save).version).toBe(33);
    expect(loaded.theaters).toEqual(game.theaters); expect(loaded.nextTheaterId).toBe(2);
    expect(serializeGame(loaded)).toBe(save); expect(stateHash(loaded)).toBe(stateHash(game));
    loaded.theaters[0]!.name = 'A distinct saved policy';
    expect(stateHash(loaded)).not.toBe(stateHash(game));
  });

  it.each([
    ['unknown theater field', (raw: ReturnType<typeof JSON.parse>) => { raw.state.theaters[0].futurePolicy = true; }],
    ['missing register', (raw: ReturnType<typeof JSON.parse>) => { delete raw.state.theaters; }],
    ['missing counter', (raw: ReturnType<typeof JSON.parse>) => { delete raw.state.nextTheaterId; }],
    ['consumed counter mismatch', (raw: ReturnType<typeof JSON.parse>) => { raw.state.nextTheaterId = 1; }],
    ['duplicate members', (raw: ReturnType<typeof JSON.parse>) => { raw.state.theaters[0].armyIds.push('army.2'); }],
    ['duplicate hearths', (raw: ReturnType<typeof JSON.parse>) => { raw.state.theaters[0].settlementIds.push(raw.state.theaters[0].settlementIds[0]); }],
    ['out of bounds reserve', (raw: ReturnType<typeof JSON.parse>) => { raw.state.theaters[0].reserveCell = raw.state.world.width * raw.state.world.height; }],
    ['future dispatch turn', (raw: ReturnType<typeof JSON.parse>) => { raw.state.theaters[0].lastRunTurn = raw.state.turn + 1; }],
    ['unknown owner', (raw: ReturnType<typeof JSON.parse>) => { raw.state.theaters[0].factionId = 'faction.missing'; }],
    ['missing protected hearths', (raw: ReturnType<typeof JSON.parse>) => { raw.state.theaters[0].settlementIds = []; }],
    ['too many guards', (raw: ReturnType<typeof JSON.parse>) => { raw.state.theaters[0].guardsPerSettlement = 5; }],
  ] as const)('rejects resealed %s without silently dropping the invalid data', (_label, alter) => {
    const raw = JSON.parse(serializeGame(delegated())); alter(raw);
    expect(() => deserializeGame(reseal(raw))).toThrow();
  });

  it('retains unavailable historical references and dispatch facts without turning them into ownership claims', () => {
    const game = delegated(), theater = game.theaters[0]!, targetCell = game.armies['army.2']!.cell;
    theater.settlementIds = ['settlement.999999'];
    theater.armyIds = [];
    theater.lastRunTurn = game.turn;
    theater.lastDispatches = [{ armyId: 'army.999999', targetCell, accepted: true, message: 'This departed company previously received its route.' }];
    const save = serializeGame(game), restored = deserializeGame(save);
    expect(restored.theaters).toEqual(game.theaters); expect(serializeGame(restored)).toBe(save);
    expect(restored.theaters[0]!.armyIds).toEqual([]);
    expect(restored.theaters[0]!.settlementIds).toEqual(['settlement.999999']);
  });
});
