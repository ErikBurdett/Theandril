import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IMPROVEMENTS, TECHNOLOGIES } from '@theandril/content';
import * as mapgen from '@theandril/mapgen';
import { applyCommandForVersion, createGame, deserializeGame, getLandObservation as readLand, getSettlementLandObservation as readTown, serializeGame, stateHash, stateHashForVersion, type GameState } from './index';
import { applyLandCommand, type LandCommand, type LandObservation } from './territory';
import { indexes } from './visibility';
import { rulesVersion, withRules } from './rules';

afterEach(() => vi.restoreAllMocks());
// This independent performance/seal oracle deliberately executes its captured
// rules11. Modern64-cell page behavior is covered by uncapped-growth tests.
const applyCommand = (state: GameState, input: unknown) => applyCommandForVersion(state, input, 11);
const getLandObservation = (...args: Parameters<typeof readLand>) => withRules(args[0], rulesVersion(args[0]) < 16 ? rulesVersion(args[0]) : 11, () => readLand(...args));
const getSettlementLandObservation = (...args: Parameters<typeof readTown>) => withRules(args[0], 11, () => readTown(...args));

/** Authored population/funding/research; all founding and 30 additional claims use real commands. */
function quoteCampaign(): GameState {
  let game = createGame({ rulesVersion: 11, seed: 103, size: 'tiny', factionCount: 2, pace: 'short', generatorVersion: 4, rosterVersion: 3 });
  for (const faction of game.factions) {
    const caravan = Object.values(game.armies).find(army => army.factionId === faction.id && army.formations.some(item => item.unitId === 'unit.colonist'))!;
    expect(applyCommand(game, { type: 'found', factionId: faction.id, armyId: caravan.id, name: 'Quote ' + faction.id }).ok).toBe(true);
  }
  const owner = game.turnOwnerId, town = Object.values(game.settlements).find(item => item.factionId === owner)!;
  town.population = 8; game.factions[0]!.treasury = 20_000;
  game.progression[owner]!.technologies = TECHNOLOGIES.map(item => item.id).sort();
  game = deserializeGame(serializeGame(game));
  for (let count = 0; count < 30; count++) {
    const cell = view(game).settlements[0]!.cells.find(item => item.claim.canStart);
    if (!cell) break;
    expect(applyCommand(game, { type: 'claimCell', factionId: owner, settlementId: town.id, cell: cell.cell }).ok).toBe(true);
  }
  expect(game.land.settlements[town.id]!.claimed).toHaveLength(37);
  return deserializeGame(serializeGame(game));
}
const view = (game: GameState): LandObservation => getLandObservation(game, game.turnOwnerId, indexes(game).visible.get(game.turnOwnerId)!);
const seal = (value: LandObservation) => {
  const text = JSON.stringify(value);
  return { sha: createHash('sha256').update(text).digest('hex'), bytes: Buffer.byteLength(text) };
};
// A later transport slice moved exactly this repeated caveat into one UI
// paragraph. Restore only that known text to compare the original byte seals;
// all prices, effects, references, blockers and ordering remain independently sealed.
function beforeTextCompaction(value: LandObservation) {
  const copy = structuredClone(value), suffix = ' Replaces any existing improvement on completion; benefits require a worked tile.';
  for (const town of copy.settlements) for (const cell of town.cells) for (const option of cell.improvementOptions) {
    if (option.effectText.endsWith(suffix)) continue;
    expect(option.effectText).toBe(IMPROVEMENTS.find(item => item.id === option.improvementId)!.description);
    option.effectText += suffix;
  }
  return seal(copy);
}
const busyCommand = { type: 'improveTile', factionId: 'faction.ashen_compact', settlementId: 'settlement.5', cell: 1115, improvementId: 'improvement.managed_woodlot' } as const;

describe('call-local territory quote derivation', () => {
  it('retains genuine pre-optimization observation bytes, including historical filters, fog and blocker ordering', () => {
    // SHA-256/UTF-8 lengths captured from the unoptimized schema-11 selector before this change.
    const game = quoteCampaign(), save = serializeGame(game);
    expect(stateHashForVersion(game, 11)).toBe('14e7f89e');
    expect(beforeTextCompaction(view(game))).toEqual({ sha: '9393b44496daebd51f59834ab73f0cb1b24abe1715d85c55a73dfe6230a6c5b4', bytes: 208693 });
    expect(withRules(game, 10, () => seal(view(game)))).toEqual({ sha: '945f8e14f2eafbccd0db66ade4239a8dd9a166a3b85f0db254a8f761f7dd8865', bytes: 124995 });
    expect(beforeTextCompaction(getLandObservation(game, game.turnOwnerId, { has: cell => indexes(game).visible.get(game.turnOwnerId)!.has(cell) && cell % 2 === 0 })))
      .toEqual({ sha: 'ae80bd820b3a18d74ae533ea632bd36563f4f2088a89c57305821ef984668eca', bytes: 102026 });
    const poor = deserializeGame(save);
    poor.factions[0]!.treasury = 0; poor.land.cultivation[poor.turnOwnerId] = 17; poor.progression[poor.turnOwnerId]!.technologies = [];
    expect(beforeTextCompaction(view(poor))).toEqual({ sha: '8a38d313487dce794d14a5df7a2134c25a67c473599cc6dcb94e984dbd1279b9', bytes: 208878 });
    const busy = deserializeGame(save);
    expect(applyCommand(busy, busyCommand).ok).toBe(true);
    expect(beforeTextCompaction(view(busy))).toEqual({ sha: '6b17c1e5d6273614b01eb50a8109e82d7997d5b60c8b5420dbb7138f78ed2b9d', bytes: 199766 });
    expect(stateHashForVersion(busy, 11)).toBe('69ab5224');
    expect(serializeGame(game)).toBe(save);
  });

  it('derives features once per detailed cell and resolves the owner only once, not once per option', () => {
    const game = quoteCampaign(), owner = game.turnOwnerId, town = Object.values(game.settlements).find(item => item.factionId === owner)!;
    const features = vi.spyOn(mapgen, 'naturalFeatures'), ownerLookup = vi.spyOn(game.factions, 'find');
    const detailed = view(game);
    expect(detailed.settlements[0]!.cells).toHaveLength(37);
    expect(detailed.settlements[0]!.cells.every(cell => cell.improvementOptions.length === 10)).toBe(true);
    expect(seal(detailed).bytes).toBeLessThan(200_000);
    expect(features).toHaveBeenCalledTimes(37);
    expect(ownerLookup).toHaveBeenCalledTimes(1);
    features.mockClear(); ownerLookup.mockClear();
    expect(getSettlementLandObservation(game, owner, town.id)).toEqual(detailed.settlements[0]);
    expect(features).toHaveBeenCalledTimes(37); expect(ownerLookup).toHaveBeenCalledTimes(1);
    features.mockClear(); ownerLookup.mockClear();
    const summary = getLandObservation(game, owner, indexes(game).visible.get(owner)!, 'none');
    expect(summary.settlements[0]!.cells).toEqual([]);
    expect(features).toHaveBeenCalledTimes(1); expect(ownerLookup).toHaveBeenCalledTimes(1);
    features.mockClear();
    expect(getLandObservation(game, owner, { has: () => false }).settlements[0]!.cells).toEqual([]);
    // Own center's existing economic summary is retained; no hidden candidate is derived.
    expect(features.mock.calls.map(call => call[1])).toEqual([town.cell]);
  });

  it('agrees with uncached command quotes for all 370 site options and every cultivation option', () => {
    const game = quoteCampaign(), owner = game.turnOwnerId, land = view(game).settlements[0]!, save = serializeGame(game);
    for (const cell of land.cells) {
      const candidates: { command: LandCommand; quote: { coinCost: number; canStart: boolean; blocker: string | null } }[] = [
        { command: { type: 'claimCell', factionId: owner, settlementId: land.settlementId, cell: cell.cell }, quote: cell.claim },
        ...cell.improvementOptions.map(quote => ({ command: { type: 'improveTile', factionId: owner, settlementId: land.settlementId, cell: cell.cell, improvementId: quote.improvementId } as const, quote })),
        ...cell.terraformOptions.map(quote => ({ command: { type: 'terraformTile', factionId: owner, settlementId: land.settlementId, cell: cell.cell, biome: quote.biome } as const, quote })),
      ];
      for (const { command, quote } of candidates) {
        const copy = structuredClone(game), before = copy.factions[0]!.treasury;
        const error = applyLandCommand(copy, command);
        expect(error, JSON.stringify(command)).toBe(quote.blocker);
        expect(error === null).toBe(quote.canStart);
        expect(copy.factions[0]!.treasury).toBe(before - (error ? 0 : quote.coinCost));
      }
    }
    expect(serializeGame(game)).toBe(save);
  });

  it('drops all derived context after a read and detaches returned components across command/save continuation', () => {
    const game = quoteCampaign(), first = view(game), before = seal(first);
    first.settlements[0]!.cells[0]!.yields.affinity.food = -100;
    first.settlements[0]!.cells[0]!.improvementOptions[0]!.coinCost = 1;
    expect(seal(view(game))).toEqual(before);
    expect(applyCommand(game, busyCommand).ok).toBe(true);
    const mirror = deserializeGame(serializeGame(game));
    expect(seal(view(mirror))).toEqual(seal(view(game)));
    for (let turn = 0; turn < 3; turn++) {
      const command = { type: 'endTurn', factionId: game.turnOwnerId } as const;
      expect(applyCommand(game, command)).toEqual(applyCommand(mirror, command));
      expect(stateHash(game)).toBe(stateHash(mirror));
      expect(seal(view(game))).toEqual(seal(view(mirror)));
    }
    expect(game.land.settlements[busyCommand.settlementId]!.improvements[busyCommand.cell]).toBe(busyCommand.improvementId);
    expect(seal(view(game))).not.toEqual(before);
  });
});
