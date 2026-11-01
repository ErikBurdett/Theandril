import { expect, test } from 'vitest';
import { relicOfLandmarkKind } from '@theandril/content';
import { applyCommand, getObservation, landmarks } from '@theandril/sim';
import { attunementCampaign } from '../../test-fixtures/src/victory-fixture';
import { planRelics } from './relics';
import { planTurnWithReasons } from './index';

test('a relic waiting in the hearth goes to the character riding with the strongest company, once a turn, and a borne relic is left alone', () => {
  const state = attunementCampaign(), player = state.turnOwnerId;
  const site = landmarks(state.world)[0]!, relic = relicOfLandmarkKind(site.kindId)!;
  state.relics = [{ id: site.id, relicId: relic.id, landmarkId: site.id, factionId: player, holderCharacterId: null, foundTurn: state.turn }];
  const view = getObservation(state, player);
  const plan = planRelics(view)!;
  const bearer = view.characters.find(character => character.id === (plan.commands[0] as { bearerId: string }).bearerId)!;
  expect(plan.commands[0]).toMatchObject({ type: 'bestowRelic', factionId: player, relicId: site.id });
  expect(bearer.factionId).toBe(player);
  expect(bearer.dead).toBe(false);
  // The strongest company's rider, if any character rides.
  const riding = view.characters.filter(character => character.factionId === player && !character.dead && character.location?.kind === 'army');
  if (riding.length) {
    const strength = (armyId: string) => view.armies.find(army => army.id === armyId)!.formations.reduce((sum, item) => sum + item.strength, 0);
    expect(bearer.location?.kind).toBe('army');
    expect(riding.every(character => strength((character.location as { armyId: string }).armyId) <= strength((bearer.location as { armyId: string }).armyId))).toBe(true);
  }
  expect(plan.reasons[0]).toContain(`Bestow ${relic.name} on ${bearer.name}`);
  expect(planTurnWithReasons(view).commands).toContainEqual(plan.commands[0]);
  expect(applyCommand(state, plan.commands[0]!).ok).toBe(true);
  expect(planRelics(getObservation(state, player))).toBeNull();
  expect(planRelics({ ...view, relics: [] })).toBeNull();
  expect(planRelics({ ...view, relics: undefined })).toBeNull();
});
