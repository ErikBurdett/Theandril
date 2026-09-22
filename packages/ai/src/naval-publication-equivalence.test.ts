import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { deserializeGame, getObservation, type GameState } from '@theandril/sim';
import { aiObservationOptions } from './observation-options';
import { planNaval } from './naval';
import captured from '../../../docs/development/2026-09-21-epic-baseline/ai/complete-proposals-before.json';

const stringify = (value: unknown) => JSON.stringify(value, (_, entry) => entry instanceof Set ? [...entry] : entry);
const states = new Map<string, GameState>();
const stateFor = (item: typeof captured.originals[number]) => {
  let state = states.get(item.save);
  if (!state) {
    const compressed = readFileSync(item.save);
    expect(createHash('sha256').update(compressed).digest('hex')).toBe(item.saveSha256);
    state = deserializeGame(gunzipSync(compressed).toString('utf8')); states.set(item.save, state);
  }
  return state;
};

describe('lazy naval knowledge retains complete historical proposals', () => {
  it.each(captured.originals)('$key keeps commands, reasons, expenditure and held IDs exact', item => {
    const state = stateFor(item), factionId = item.key.slice(item.key.indexOf('/') + 1);
    const view = getObservation(state, factionId, aiObservationOptions(state.turn)), before = JSON.stringify(view);
    expect(createHash('sha256').update(before).digest('hex')).toBe(item.observationSha256);
    expect(stringify(planNaval(view, item.budget))).toBe(JSON.stringify(item.output));
    expect(JSON.stringify(view)).toBe(before);
  });

  it('reassesses held fleets and budgets on each call over the same detached view', () => {
    const item = captured.originals.find(item => item.key === 'turn-200/faction.reedbound_council')!;
    const state = stateFor(item), view = getObservation(state, 'faction.reedbound_council', aiObservationOptions(state.turn));
    const held = new Set(view.armies.filter(army => army.factionId === view.factionId && army.domain === 'naval').map(army => army.id));
    const first = planNaval(view, item.budget);
    for (const budget of [0, item.budget]) {
      expect(planNaval(view, budget, { heldArmyIds: held })).toStrictEqual(planNaval(structuredClone(view), budget, { heldArmyIds: new Set(held) }));
    }
    first.commands.length = 0; first.reasons.length = 0; first.heldArmyIds.clear(); first.queuedSettlementIds.clear(); held.clear();
    expect(stringify(planNaval(view, item.budget))).toBe(JSON.stringify(item.output));
  });
});
