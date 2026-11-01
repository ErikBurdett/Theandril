import { expect, test } from 'vitest';
import { applyCommand, getObservation } from '@theandril/sim';
import { attunementCampaign } from '../../test-fixtures/src/victory-fixture';
import { EASE_TAX_TREASURY, HEAVY_TAX_TREASURY, LEAN_TAX_TREASURY, planTaxes, UNREST_EASE, UNREST_RESTRAINT } from './taxes';
import { planTurnWithReasons } from './index';

test('a realm short of coin sets heavy taxes, a rich one with scarred hearths sets lean ones, and one neither keeps steady taxes without a command', () => {
  const state = attunementCampaign(), player = state.turnOwnerId;
  const view = getObservation(state, player);
  expect(view.tax).toMatchObject({ rate: 'steady' });
  expect(view.growth).toBeDefined();
  // Short of coin and running short each turn: heavy.
  const short = { ...view, treasury: HEAVY_TAX_TREASURY - 1, growth: { ...view.growth!, economy: { ...view.growth!.economy, net: -3 } } };
  const heavy = planTaxes(short)!;
  expect(heavy.commands).toEqual([{ type: 'setTaxRate', factionId: player, rate: 'heavy' }]);
  expect(heavy.reasons[0]).toContain('Heavy taxes');
  expect(planTurnWithReasons(short).commands).toContainEqual(heavy.commands[0]);
  // Rich, ahead each turn and a hearth scarred: lean.
  const scarred = { ...view, treasury: LEAN_TAX_TREASURY, growth: { ...view.growth!, economy: { ...view.growth!.economy, net: 5 } }, settlements: view.settlements.map(town => town.factionId === player ? { ...town, devastation: 15 } : town) };
  expect(planTaxes(scarred)!.commands).toEqual([{ type: 'setTaxRate', factionId: player, rate: 'lean' }]);
  // Rich but unscarred, or short but solvent: steady, and nothing proposed while steady stands.
  expect(planTaxes({ ...scarred, settlements: view.settlements })).toBeNull();
  expect(planTaxes({ ...short, growth: { ...view.growth!, economy: { ...view.growth!.economy, net: 2 } } })).toBeNull();
  expect(planTaxes({ ...view, tax: undefined })).toBeNull();
  // Rules 71: restless lanes are not pressed harder, and are eased when the treasury allows.
  const host = view.settlements.find(town => town.factionId === player)!;
  const restless = { ...short, unrest: [{ settlementId: host.id, level: UNREST_RESTRAINT, pressures: ['heavy taxes'], halved: false }] };
  expect(planTaxes(restless)).toBeNull();
  const eased = planTaxes({ ...view, treasury: EASE_TAX_TREASURY, unrest: [{ settlementId: host.id, level: UNREST_EASE, pressures: ['occupation'], halved: true }] })!;
  expect(eased.commands).toEqual([{ type: 'setTaxRate', factionId: player, rate: 'lean' }]);
  expect(eased.reasons[0]).toContain(`unrest stands at ${UNREST_EASE}`);
  expect(planTaxes({ ...view, treasury: EASE_TAX_TREASURY - 1, unrest: [{ settlementId: host.id, level: UNREST_EASE, pressures: [], halved: true }] })).toBeNull();
  // Taken for real, then the planner proposes nothing while the rate fits, and steady again when the coin returns.
  expect(applyCommand(state, heavy.commands[0]!)).toMatchObject({ ok: true });
  const after = getObservation(state, player);
  expect(after.tax!.rate).toBe('heavy');
  expect(planTaxes({ ...after, treasury: HEAVY_TAX_TREASURY - 1, growth: { ...after.growth!, economy: { ...after.growth!.economy, net: -3 } } })).toBeNull();
  const back = planTaxes({ ...after, treasury: 200, growth: { ...after.growth!, economy: { ...after.growth!.economy, net: 2 } } })!;
  expect(back.commands).toEqual([{ type: 'setTaxRate', factionId: player, rate: 'steady' }]);
});
