import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { applyCommand, deserializeGame, getObservation, getSettlementLandObservation, serializeGame, stateHash, type GameState, type ObservationOptions } from './index';
import { withRules, type RulesVersion } from './rules';
import type { LandCellWindow, LandDetails } from './territory';
import captured from '../../../docs/development/2026-09-21-campaign-continuation/observations/baseline.json';

interface CapturedVariant { factionId: string; version: RulesVersion; options: ObservationOptions; observation: string; direct: { settlementId: string; value: string }[] }
interface CapturedState { name: string; save: string; hash: string; variants: CapturedVariant[] }
const payload = gunzipSync(Buffer.from(captured.payload, 'base64')).toString('utf8');
if (createHash('sha256').update(payload).digest('hex') !== captured.payloadSha256) throw new Error('Observation baseline checksum differs.');
const snapshots = (JSON.parse(payload) as { snapshots: CapturedState[] }).snapshots;
const exact = (actual: string, expected: string, label: string): void => {
  let offset = 0;
  if (actual !== expected) while (offset < Math.min(actual.length, expected.length) && actual[offset] === expected[offset]) offset++;
  expect(actual === expected, `${label}: first differing byte ${offset}; actual ${actual.slice(offset, offset + 150)}; expected ${expected.slice(offset, offset + 150)}`).toBe(true);
};
const read = (state: GameState, variant: CapturedVariant) => withRules(state, variant.version, () => getObservation(state, variant.factionId, variant.options));

describe('observation publication keeps the captured full output', () => {
  it.each(snapshots)('$name retains every field, detail window, fog projection and key order', snapshot => {
    const state = deserializeGame(snapshot.save), before = serializeGame(state);
    expect(stateHash(state)).toBe(snapshot.hash);
    for (const variant of snapshot.variants) {
      exact(JSON.stringify(read(state, variant)), variant.observation, `${snapshot.name} rules${variant.version} ${JSON.stringify(variant.options)}`);
      for (const direct of variant.direct) {
        const actual = withRules(state, variant.version, () => getSettlementLandObservation(state, variant.factionId, direct.settlementId, { offset: 0, limit: 3 }));
        exact(JSON.stringify(actual), direct.value, `${snapshot.name} direct ${direct.settlementId}`);
      }
    }
    expect(serializeGame(state)).toBe(before);
  });

  it.each(snapshots)('$name never shares published cell, yield, quote or town arrays with future reads', snapshot => {
    const state = deserializeGame(snapshot.save), variant = snapshot.variants.find(item => item.version === 17 && Object.keys(item.options).length === 0)!;
    const before = serializeGame(state), observed = read(state, variant);
    if (observed.cells[0]) { observed.cells[0].biome = 11; observed.cells[0].resourceId = 'resource.changed'; }
    const town = observed.land.settlements.find(town => town.cells.length);
    if (town) {
      town.claimed.length = 0; town.worked.push(0); town.yields.food = -999;
      town.cells[0]!.yields.total.food = -999;
      if (town.cells[0]!.improvementOptions[0]) town.cells[0]!.improvementOptions[0].coinCost = -999;
      if (town.cells[0]!.terraformOptions[0]) town.cells[0]!.terraformOptions[0].effectText = 'changed';
      town.cells[0]!.claim.blocker = 'changed';
      if (town.work) town.work.remainingTurns = 99;
    }
    expect(serializeGame(state)).toBe(before);
    exact(JSON.stringify(read(state, variant)), variant.observation, `${snapshot.name} after caller mutation`);
  });

  it('refreshes paid construction, completion and remembered improvements without a publication cache', () => {
    const initial = snapshots.find(item => item.name === 'generated-grain-market')!, pending = snapshots.find(item => item.name === 'paid-grange-in-progress')!, completed = snapshots.find(item => item.name === 'paid-grange-completed')!;
    const state = deserializeGame(initial.save), variant = initial.variants[0]!, town = read(state, variant).land.settlements[0]!;
    const cell = town.cells.find(cell => cell.resourceId === 'resource.grain')!, quote = cell.improvementOptions.find(option => option.improvementId === 'improvement.grange')!;
    expect(quote.canStart).toBe(true);
    expect(applyCommand(state, { type: 'improveTile', factionId: variant.factionId, settlementId: town.settlementId, cell: cell.cell, improvementId: quote.improvementId }).ok).toBe(true);
    // The captures cross a save-schema parse, which orders event properties.
    // Compare all immediate values here; saved reads above also assert byte order.
    for (const output of pending.variants) expect(JSON.parse(JSON.stringify(read(state, output))) as unknown).toEqual(JSON.parse(output.observation) as unknown);
    const pendingRestored = deserializeGame(serializeGame(state));
    for (const output of pending.variants) exact(JSON.stringify(read(pendingRestored, output)), output.observation, 'saved paid construction');
    for (let turn = 0; turn < quote.turns; turn++) expect(applyCommand(state, { type: 'endTurn', factionId: variant.factionId }).ok).toBe(true);
    for (const output of completed.variants) expect(JSON.parse(JSON.stringify(read(state, output))) as unknown).toEqual(JSON.parse(output.observation) as unknown);
    const completedRestored = deserializeGame(serializeGame(state));
    for (const output of completed.variants) exact(JSON.stringify(read(completedRestored, output)), output.observation, 'saved completed construction');
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(completed.hash);
  });

  it('retains invalid-owner/window rejection and private-town lookup semantics', () => {
    const state = deserializeGame(snapshots.find(item => item.name === 'visible-foreign-hearth')!.save), owner = state.turnOwnerId;
    const own = Object.values(state.settlements).find(town => town.factionId === owner)!;
    const foreign = Object.values(state.settlements).find(town => town.factionId !== owner)!;
    const before = serializeGame(state);
    expect(() => getObservation(state, 'faction.missing')).toThrow('Unknown observation faction');
    for (const landDetails of [null, { offset: -1, limit: 1 }, { offset: 0, limit: -1 }, { offset: 0.5, limit: 1 }, { offset: Infinity, limit: 1 }, { offset: 0, limit: NaN }]) {
      expect(() => getObservation(state, owner, { landDetails: landDetails as LandDetails })).toThrow('Land detail window offset and limit must be nonnegative safe integers.');
    }
    for (const window of [{ offset: -1 }, { offset: 0, limit: 0 }, { offset: 0, cell: state.world.terrain.length }, { offset: NaN }]) {
      expect(() => getSettlementLandObservation(state, owner, own.id, window as LandCellWindow)).toThrow('Land cell window must use nonnegative safe integer positions and a positive limit.');
    }
    expect(getSettlementLandObservation(state, owner, foreign.id)).toBeNull();
    expect(getSettlementLandObservation(state, 'faction.missing', own.id)).toBeNull();
    expect(serializeGame(state)).toBe(before);
  });
});
