import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { applyCommand, getObservation, stateHash, type GameState } from '@theandril/sim';
import { isPassable, neighbors } from '@theandril/mapgen';
import { attunementCampaign } from '../../../packages/test-fixtures/src/victory-fixture';
import { refreshAuthoredSight } from '../../../packages/test-fixtures/src/authored-land';
import { StrategicRites } from './magic';
import { SiegeLedger } from './siege';

const render = (state: GameState, characterId: string) => {
  const view = getObservation(state, state.turnOwnerId);
  const character = view.characters.find(item => item.id === characterId)!;
  return renderToStaticMarkup(createElement(StrategicRites, { view, character, busy: false, issue: () => { throw new Error('Rendering issued an order.'); } }));
};

describe('strategic rites (rules 40)', () => {
  it('renders the quoted rite with its exact blocker, the standing ward and the warded siege without mutating state', () => {
    const state = attunementCampaign(), player = state.turnOwnerId, rival = state.factions[1]!.id;
    const caster = Object.values(state.characters).find(item => item.factionId === player && item.definitionId === 'character.waykeeper')!;
    const host = Object.values(state.settlements).find(town => town.factionId === player)!;
    state.resources.stockpiles[player]!['resource.ashglass'] = 5;
    refreshAuthoredSight(state);
    const before = stateHash(state);
    const starved = render(state, caster.id);
    expect(starved).toContain('Seam warding');
    expect(starved).toContain('6 ashglass · 10 turns · at ' + host.name);
    expect(starved).toContain('Requires 6 Ashglass in the realm stockpile.');
    expect(starved).toContain('disabled=""');
    expect(stateHash(state)).toBe(before);
    const other = Object.values(state.characters).find(item => item.factionId === player && item.definitionId !== 'character.waykeeper');
    if (other) expect(render(state, other.id)).toBe('');
    state.resources.stockpiles[player]!['resource.ashglass'] = 20;
    const column = Object.values(state.armies).find(army => army.factionId === rival)!;
    column.cell = neighbors(host.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell] ?? 0) && Object.values(state.armies).every(army => army.cell !== cell))!;
    column.movement = 3; refreshAuthoredSight(state);
    expect(applyCommand(state, { type: 'declareWar', factionId: rival, targetFactionId: player })).toMatchObject({ ok: true });
    expect(applyCommand(state, { type: 'besiege', factionId: rival, armyId: column.id, settlementId: host.id })).toMatchObject({ ok: true });
    expect(applyCommand(state, { type: 'performRite', factionId: player, characterId: caster.id, riteId: 'rite.seam_warding' })).toMatchObject({ ok: true });
    const warded = render(state, caster.id);
    expect(warded).toContain(`stands over ${host.name}: 10 turns remaining.`);
    expect(warded).toContain('This hearth is already warded.');
    const ledger = renderToStaticMarkup(createElement(SiegeLedger, { view: getObservation(state, rival), locate: () => undefined }));
    expect(ledger).toContain('30 · warded');
    // Rules 42: a kindled hearth reads as such in the same ledger.
    state.wards = []; state.characters[caster.id]!.aptitudes = { 'path.flame': 2, 'path.rune': 1 };
    expect(applyCommand(state, { type: 'performRite', factionId: player, characterId: caster.id, riteId: 'rite.seam_kindling' })).toMatchObject({ ok: true });
    expect(renderToStaticMarkup(createElement(SiegeLedger, { view: getObservation(state, rival), locate: () => undefined }))).toContain('30 · kindled');
  });
});
