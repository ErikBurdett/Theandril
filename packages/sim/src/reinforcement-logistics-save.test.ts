import { describe, expect, it } from 'vitest';
import { checksum } from '@theandril/content';
import { applyCommand, deserializeGame, serializeGame, stateHash } from './index';
import { historical33 } from '../../chronicle/src/fixtures/reinforcement-logistics33';

function current() {
  const game = deserializeGame(historical33('theaters-allocated').save), theater = game.theaters[0]!;
  expect(applyCommand(game, { type: 'setTheater', factionId: theater.factionId, theaterId: theater.id, name: theater.name,
    settlementIds: theater.settlementIds, armyIds: theater.armyIds, reserveCell: theater.reserveCell,
    guardsPerSettlement: theater.guardsPerSettlement, enabled: true, reinforcementLimit: 2 }).ok).toBe(true);
  return game;
}
const reseal = (raw: ReturnType<typeof JSON.parse>) => {
  raw.stateChecksum = checksum(JSON.stringify(raw.state)); return JSON.stringify(raw);
};
describe('strict current reinforcement and supply-access save boundary', () => {
  it('defaults only absent historical policy fields and refuses invalid null state during serialization', () => {
    const game = current();
    Object.assign(game.theaters[0]!, { reinforcementLimit: null });
    expect(() => serializeGame(game)).toThrow();
    Object.assign(game.theaters[0]!, { reinforcementLimit: 0, reinforcementHolds: null });
    expect(() => serializeGame(game)).toThrow();
  });
  it('hashes policy, legal holds and consumed supply identifiers, retaining exact current bytes', () => {
    const game = current(), original = stateHash(game), theater = game.theaters[0]!;
    theater.reinforcementHolds = [{ settlementId: theater.settlementIds[0]!, extraGuards: 2, untilTurn: game.turn + 1 }];
    const held = stateHash(game); expect(held).not.toBe(original);
    game.supplyAccess.nextId = 2; expect(stateHash(game)).not.toBe(held);
    const save = serializeGame(game), restored = deserializeGame(save);
    expect(JSON.parse(save).version).toBe(34);
    expect(restored.theaters).toEqual(game.theaters); expect(restored.supplyAccess).toEqual(game.supplyAccess);
    expect(serializeGame(restored)).toBe(save); expect(stateHash(restored)).toBe(stateHash(game));
  });

  it.each([
    ['missing supply register', (raw: ReturnType<typeof JSON.parse>) => { delete raw.state.supplyAccess; }],
    ['unknown supply field', (raw: ReturnType<typeof JSON.parse>) => { raw.state.supplyAccess.future = true; }],
    ['invalid supply counter', (raw: ReturnType<typeof JSON.parse>) => { raw.state.supplyAccess.nextId = 0; }],
    ['missing current policy', (raw: ReturnType<typeof JSON.parse>) => { delete raw.state.theaters[0].reinforcementLimit; }],
    ['missing current holds', (raw: ReturnType<typeof JSON.parse>) => { delete raw.state.theaters[0].reinforcementHolds; }],
    ['excess reinforcement', (raw: ReturnType<typeof JSON.parse>) => { raw.state.theaters[0].reinforcementLimit = 5; }],
    ['hold beyond policy', (raw: ReturnType<typeof JSON.parse>) => { raw.state.theaters[0].reinforcementHolds = [{ settlementId: raw.state.theaters[0].settlementIds[0], extraGuards: 3, untilTurn: raw.state.turn }]; }],
    ['future hold beyond one turn', (raw: ReturnType<typeof JSON.parse>) => { raw.state.theaters[0].reinforcementHolds = [{ settlementId: raw.state.theaters[0].settlementIds[0], extraGuards: 1, untilTurn: raw.state.turn + 2 }]; }],
    ['hold for unprotected hearth', (raw: ReturnType<typeof JSON.parse>) => { raw.state.theaters[0].reinforcementHolds = [{ settlementId: 'settlement.999999', extraGuards: 1, untilTurn: raw.state.turn }]; }],
    ['duplicate holds', (raw: ReturnType<typeof JSON.parse>) => { const hold = { settlementId: raw.state.theaters[0].settlementIds[0], extraGuards: 1, untilTurn: raw.state.turn }; raw.state.theaters[0].reinforcementHolds = [hold, hold]; }],
    ['hold on disabled theater', (raw: ReturnType<typeof JSON.parse>) => { raw.state.theaters[0].enabled = false; raw.state.theaters[0].reinforcementHolds = [{ settlementId: raw.state.theaters[0].settlementIds[0], extraGuards: 1, untilTurn: raw.state.turn }]; }],
  ] as const)('rejects resealed %s instead of repairing or discarding it', (_label, alter) => {
    const raw = JSON.parse(serializeGame(current())); alter(raw);
    expect(() => deserializeGame(reseal(raw))).toThrow();
  });
});
