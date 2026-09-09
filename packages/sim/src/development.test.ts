import { describe, expect, it } from 'vitest';
import { UNITS } from '@theandril/content';
import { characterBattleCampaign, characterCampaign, CHARACTER_FIXTURE } from '../../test-fixtures/src/character-fixture';
import { applyCommand, createGame, deserializeGame, getObservation, serializeGame, settlementYields, stateHash, type GameCommand, type GameState } from './index';
import { characterSkillEffects, getCharacterObservation, validateCharacterTraining } from './characters';
import { withRules } from './rules';
import { chooseDevelopment, factionDevelopmentEffects, factionDevelopmentUpkeep, formationBattleEffects, getDevelopmentEntity, getDevelopmentObservation, hearthDevelopmentEffects, hearthDevelopmentUpkeep, planDevelopment, pruneDevelopment, validateDevelopment, type DevelopmentCommand } from './development';

const issue = (state: GameState, command: GameCommand) => { const result = applyCommand(state, command); expect(result, `${command.type}: ${result.error ?? ''}`).toMatchObject({ ok: true }); return result; };
const end = (state: GameState) => issue(state, { type: 'endTurn', factionId: state.turnOwnerId });
const reject = (state: GameState, command: GameCommand) => { const before = stateHash(state), result = applyCommand(state, command); expect(result.ok).toBe(false); expect(stateHash(state)).toBe(before); return result.error!; };
const restore = (state: GameState) => { const copy = deserializeGame(serializeGame(state)); expect(stateHash(copy)).toBe(stateHash(state)); return copy; };
const develop = (state: GameState, scope: DevelopmentCommand['scope'], entityId: string, nodeId: string): DevelopmentCommand => ({ type: 'develop', factionId: state.turnOwnerId, scope, entityId, nodeId });

function growingHearth() {
  const state = createGame({ generatorVersion: 4, seed: 17, size: 'tiny', factionCount: 1, pace: 'short' });
  state.factions[0]!.treasury = 2000;
  issue(state, { type: 'found', factionId: state.turnOwnerId, armyId: 'army.1', name: 'Civic Witness' });
  const hearth = Object.values(state.settlements)[0]!;
  // Population and initial funding are authored; construction, elapsed active
  // turns, civic income, acquisitions and resulting yields are real commands.
  hearth.population = 8; hearth.food = 0;
  issue(state, { type: 'queue', factionId: state.turnOwnerId, settlementId: hearth.id, itemId: 'building.granary' });
  for (let rounds = 0; rounds < 20 && !hearth.buildings.includes('building.granary'); rounds++) end(state);
  expect(hearth.buildings).toContain('building.granary');
  return { state, hearth };
}

describe('canonical development', () => {
  it('earns local civic work, pays exact costs and upkeep, changes actual yields and resumes a saved branch', () => {
    const { state, hearth } = growingHearth(), focus = { scope: 'hearth' as const, entityId: hearth.id };
    expect(reject(state, develop(state, 'hearth', hearth.id, 'hearth.seed_exchange'))).toMatch(/Requires/);
    while ((state.development.hearths[hearth.id]?.civicPoints ?? 0) < 4) end(state);
    const coins = state.factions[0]!.treasury, civic = state.development.hearths[hearth.id]!.civicPoints, before = settlementYields(state, hearth);
    expect(getDevelopmentEntity(state, state.turnOwnerId, focus)?.choices.find(node => node.id === 'hearth.common_store')?.available).toBe(true);
    issue(state, develop(state, 'hearth', hearth.id, 'hearth.common_store'));
    expect(state.factions[0]!.treasury).toBe(coins - 24); expect(state.development.hearths[hearth.id]!.civicPoints).toBe(civic - 4);
    expect(settlementYields(state, hearth).food).toBe(before.food + 2); expect(hearthDevelopmentUpkeep(state, hearth.id)).toBe(1);
    expect(reject(state, develop(state, 'hearth', hearth.id, 'hearth.common_store'))).toMatch(/Already/);
    const copy = restore(state); end(state); end(copy); expect(stateHash(copy)).toBe(stateHash(state));
    const previous = state.development.hearths[hearth.id]!.civicPoints;
    hearth.occupationTurns = 3; end(state); expect(state.development.hearths[hearth.id]!.civicPoints).toBe(previous);
    expect(getDevelopmentEntity(state, state.turnOwnerId, focus)?.choices.every(node => !node.available)).toBe(true);
    // Losing infrastructure suspends its effect, rather than erasing paid
    // civic history or silently retaining production from a vanished building.
    hearth.buildings = hearth.buildings.filter(id => id !== 'building.granary');
    expect(hearthDevelopmentEffects(state, hearth).food).toBe(0);
    expect(getDevelopmentEntity(state, state.turnOwnerId, focus)?.choices.find(node => node.id === 'hearth.common_store')).toMatchObject({ acquired: true, active: false });
    validateDevelopment(state);
  });

  it('charges materials atomically, preserves company identity through transfers, and rejects incompatible branches', () => {
    const state = characterCampaign(), army = state.armies[CHARACTER_FIXTURE.armyId]!, formation = army.formations[0]!;
    // Explicit experienced-company fixture; the next test independently earns
    // these points from a real saved tactical battle.
    state.development.formations[formation.id] = { experience: 40, nodeIds: [] };
    issue(state, develop(state, 'formation', formation.id, 'training.field_habits'));
    issue(state, develop(state, 'formation', formation.id, 'training.pressure_drill'));
    const order = develop(state, 'formation', formation.id, 'training.breakthrough');
    expect(reject(state, order)).toMatch(/Ironstone|Hearthgrain/);
    state.resources.stockpiles[state.turnOwnerId]!['resource.iron'] = 4;
    expect(reject(state, order)).toMatch(/Hearthgrain/);
    state.resources.stockpiles[state.turnOwnerId]!['resource.grain'] = 2;
    const strength = formation.strength, movement = army.movement, coins = state.factions[0]!.treasury;
    issue(state, order);
    expect(state.resources.stockpiles[state.turnOwnerId]?.['resource.iron'] ?? 0).toBe(0);
    expect(state.resources.stockpiles[state.turnOwnerId]?.['resource.grain'] ?? 0).toBe(0);
    expect(state.factions[0]!.treasury).toBe(coins - 28); expect(state.development.formations[formation.id]!.experience).toBe(24);
    expect(formation.strength).toBe(strength); expect(army.movement).toBe(movement);
    expect(formationBattleEffects(state, state.turnOwnerId, formation.id)).toMatchObject({ attack: 5, initiative: 1, morale: 4 });
    expect(reject(state, develop(state, 'formation', formation.id, 'training.shield_partners'))).toMatch(/permanently excludes/);
    const target = Object.values(state.armies).find(item => item.id !== army.id && item.factionId === army.factionId)!;
    issue(state, { type: 'transferFormations', factionId: state.turnOwnerId, sourceArmyId: army.id, targetArmyId: target.id, formationIds: [formation.id] });
    pruneDevelopment(state);
    expect(target.formations.some(item => item.id === formation.id)).toBe(true);
    expect(getDevelopmentEntity(state, state.turnOwnerId, { scope: 'formation', entityId: formation.id })?.armyId).toBe(target.id);
    expect(formationBattleEffects(state, state.turnOwnerId, formation.id).attack).toBe(5);
    restore(state);
    const forged = structuredClone(state.development);
    state.development.formations[formation.id]!.nodeIds.push('training.shield_partners'); state.development.formations[formation.id]!.nodeIds.sort();
    expect(() => validateDevelopment(state)).toThrow('exclusivity'); state.development = forged;
  });

  it('earns realm influence from functioning civic infrastructure and extends an actual permanent policy', () => {
    const { state, hearth } = growingHearth(), factionId = state.turnOwnerId;
    issue(state, { type: 'queue', factionId, settlementId: hearth.id, itemId: 'building.market' });
    for (let rounds = 0; rounds < 30 && (state.development.factions[factionId]?.influence ?? 0) < 6; rounds++) end(state);
    expect(hearth.buildings).toContain('building.market'); expect(state.development.factions[factionId]!.influence).toBeGreaterThanOrEqual(6);
    const order = develop(state, 'faction', factionId, 'tradition.open_ledgers');
    expect(reject(state, order)).toMatch(/Charter compact/);
    issue(state, { type: 'adoptInstitution', factionId, institutionId: 'institution.charter_compact' });
    const before = settlementYields(state, hearth), knowledge = state.factions[0]!.knowledge, coin = state.factions[0]!.treasury, influence = state.development.factions[factionId]!.influence;
    issue(state, order);
    expect(state.factions[0]!.treasury).toBe(coin - 60); expect(state.factions[0]!.knowledge).toBe(knowledge);
    expect(state.development.factions[factionId]!.influence).toBe(influence - 6);
    expect(factionDevelopmentEffects(state, factionId)).toMatchObject({ coin: 2, knowledge: 1 });
    expect(settlementYields(state, hearth)).toMatchObject({ coin: before.coin + 2, knowledge: before.knowledge + 1 });
    expect(factionDevelopmentUpkeep(state, factionId)).toBe(2);
    expect(reject(state, develop(state, 'faction', factionId, 'tradition.store_pledges'))).toMatch(/Common stewardship/);
    const copy = restore(state); end(state); end(copy); expect(stateHash(copy)).toBe(stateHash(state));
  });

  it('earns experience only for actual surviving combatants and retains exact saved-battle continuation', () => {
    const state = characterBattleCampaign(), attacker = state.armies[CHARACTER_FIXTURE.armyId]!;
    issue(state, { type: 'declareWar', factionId: state.turnOwnerId, targetFactionId: CHARACTER_FIXTURE.enemyFactionId });
    issue(state, { type: 'attack', factionId: state.turnOwnerId, armyId: attacker.id, targetArmyId: CHARACTER_FIXTURE.enemyArmyId });
    expect(state.development.formations).toEqual({});
    const pending = state.battle!, bindings = pending.formationBindings.map(binding => ({ ...binding }));
    const copy = restore(state);
    const first = issue(state, { type: 'autoResolveBattle', factionId: state.turnOwnerId }), second = issue(copy, { type: 'autoResolveBattle', factionId: copy.turnOwnerId });
    expect(second).toEqual(first); expect(stateHash(copy)).toBe(stateHash(state));
    const report = state.battleReports.at(-1)!;
    expect(first.events.some(event => event.type === 'formation_experience')).toBe(true);
    let survivors = 0;
    for (const binding of bindings) {
      const army = binding.armyId ? state.armies[binding.armyId] : undefined, formation = army?.formations.find(item => item.id === binding.formationId);
      if (!formation) { expect(state.development.formations[binding.formationId]).toBeUndefined(); continue; }
      survivors++;
      const side = binding.armyId === report.attackerId ? 'attacker' : 'defender';
      expect(state.development.formations[formation.id]?.experience).toBe(report.combat.result!.winner === side ? 3 : 1);
    }
    expect(survivors).toBeGreaterThan(0); expect(Object.keys(state.development.formations)).toHaveLength(survivors);
    restore(state);
  });

  it('applies training to canonical tactical stats while historical battle rules ignore future training', () => {
    const state = characterBattleCampaign(), baseline = restore(state), army = state.armies[CHARACTER_FIXTURE.armyId]!, formation = army.formations[0]!;
    state.development.formations[formation.id] = { experience: 8, nodeIds: [] };
    issue(state, develop(state, 'formation', formation.id, 'training.field_habits'));
    issue(state, develop(state, 'formation', formation.id, 'training.pressure_drill'));
    for (const campaign of [state, baseline]) {
      issue(campaign, { type: 'declareWar', factionId: campaign.turnOwnerId, targetFactionId: CHARACTER_FIXTURE.enemyFactionId });
      issue(campaign, { type: 'attack', factionId: campaign.turnOwnerId, armyId: army.id, targetArmyId: CHARACTER_FIXTURE.enemyArmyId });
    }
    const trained = state.battle!.combat.attacker.find(item => item.id === formation.id)!, original = baseline.battle!.combat.attacker.find(item => item.id === formation.id)!;
    expect(trained.attack).toBe(original.attack + 2); expect(trained.morale).toBe(original.morale + 4); expect(trained.strength).toBe(original.strength);
    expect(withRules(state, 15, () => formationBattleEffects(state, state.turnOwnerId, formation.id))).toEqual({ food: 0, industry: 0, coin: 0, knowledge: 0, attack: 0, armor: 0, initiative: 0, range: 0, morale: 0 });
  });

  it('bounds default quotes while retaining arbitrary company access and observation-only AI choices', () => {
    const state = characterCampaign(100), own = Object.values(state.armies).filter(army => army.factionId === state.turnOwnerId);
    for (const army of own) for (const formation of army.formations) state.development.formations[formation.id] = { experience: 3, nodeIds: [] };
    const hash = stateHash(state), observed = getDevelopmentObservation(state, state.turnOwnerId)!;
    const planningView = getObservation(state, state.turnOwnerId, { landDetails: 'none' });
    const playerView = getObservation(state, state.turnOwnerId, { landDetails: 'none', developmentCandidates: false });
    expect(planningView.development!.candidates.length).toBeGreaterThan(0);
    expect(playerView).toEqual({ ...planningView, development: { ...planningView.development, candidates: [] } });
    for (const candidate of planningView.development!.candidates) expect(getDevelopmentEntity(state, state.turnOwnerId, candidate)).toEqual(candidate);
    expect(observed.candidates.length).toBeLessThanOrEqual(4);
    expect(observed.candidates.reduce((sum, entity) => sum + entity.choices.length, observed.faction.choices.length)).toBeLessThanOrEqual(42);
    const last = own.at(-1)!, formation = last.formations[0]!;
    expect(getDevelopmentEntity(state, state.turnOwnerId, { scope: 'formation', entityId: formation.id })?.armyId).toBe(last.id);
    expect(getDevelopmentEntity(state, CHARACTER_FIXTURE.enemyFactionId, { scope: 'formation', entityId: formation.id })).toBeNull();
    expect(stateHash(state)).toBe(hash);
    const plan = planDevelopment({ development: observed, treasury: state.factions[0]!.treasury, factionId: state.turnOwnerId }, 200);
    expect(plan.commands).toHaveLength(1); expect(plan.coinSpent).toBe(8);
    expect(chooseDevelopment(state, plan.commands[0]!).ok).toBe(true);
    expect(planDevelopment({ development: observed, treasury: 200, factionId: state.turnOwnerId }, 200).commands).toEqual([]);
    expect(withRules(state, 15, () => getDevelopmentObservation(state, state.turnOwnerId))).toBeUndefined();
  });

  it('honors remaining recurring obligations while preserving canonically affordable development quotes', () => {
    const { state, hearth } = growingHearth();
    while ((state.development.hearths[hearth.id]?.civicPoints ?? 0) < 4) end(state);
    const view = { development: getDevelopmentObservation(state, state.turnOwnerId), treasury: state.factions[0]!.treasury, factionId: state.turnOwnerId };
    const choice = view.development!.candidates.find(entity => entity.entityId === hearth.id)!.choices.find(node => node.id === 'hearth.common_store')!;
    expect(choice).toMatchObject({ available: true, upkeep: 1 });
    const original = structuredClone(view), hash = stateHash(state);
    expect(planDevelopment(view, 0, 0).commands).toEqual([]);
    expect(planDevelopment(view, 0, -3).commands).toEqual([]);
    const paid = planDevelopment(view, 0, 1);
    expect(paid.commands).toEqual([develop(state, 'hearth', hearth.id, 'hearth.common_store')]);
    expect(view).toEqual(original); expect(stateHash(state)).toBe(hash);
    issue(state, paid.commands[0]!);
    expect(hearthDevelopmentUpkeep(state, hearth.id)).toBe(1);
    expect(state.factions[0]!.treasury).toBe(view.treasury - paid.coinSpent);
  });

  it('spends earned mission experience on advanced officer skills and gates them out of historical projections', () => {
    const state = characterCampaign(), army = state.armies[CHARACTER_FIXTURE.armyId]!;
    issue(state, { type: 'recruitCharacter', factionId: state.turnOwnerId, settlementId: CHARACTER_FIXTURE.homeId, definitionId: 'character.engineer' });
    const engineer = Object.values(state.characters)[0]!;
    issue(state, { type: 'assignCharacter', factionId: state.turnOwnerId, characterId: engineer.id, armyId: army.id });
    // Repeated authored losses let real paid refits earn the entire skill path.
    // No experience value, skill, mission result or dice outcome is assigned.
    const earn = (cost: number) => {
      while (engineer.experience < cost) {
        for (const formation of army.formations) formation.strength = Math.min(formation.strength, UNITS.find(unit => unit.id === formation.unitId)!.strength - 20);
        issue(state, { type: 'startCharacterMission', factionId: state.turnOwnerId, characterId: engineer.id, missionId: 'mission.refit' });
        end(state); end(state);
      }
    };
    const promote = (skillId: string) => ({ type: 'promoteCharacter' as const, factionId: state.turnOwnerId, characterId: engineer.id, skillId });
    expect(reject(state, promote('skill.traveling_arsenal'))).toMatch(/required earlier/);
    for (const [skillId, cost] of [['skill.fieldcraft', 12], ['skill.column_workshops', 18], ['skill.traveling_arsenal', 24]] as const) {
      earn(cost); const previous = engineer.experience; issue(state, promote(skillId)); expect(engineer.experience).toBe(previous - cost);
    }
    expect(characterSkillEffects(engineer, 16).refitBonus).toBe(9);
    expect(characterSkillEffects(engineer, 15).refitBonus).toBe(5);
    const hidden = withRules(state, 15, () => getCharacterObservation(state, state.turnOwnerId));
    expect(hidden.characters.find(character => character.id === engineer.id)?.promotions.some(choice => choice.skillId === 'skill.traveling_arsenal')).toBe(false);
    expect(() => validateCharacterTraining(engineer, 15)).toThrow('invalid learned');
    const target = army.formations[0]!; target.strength = 1;
    issue(state, { type: 'startCharacterMission', factionId: state.turnOwnerId, characterId: engineer.id, missionId: 'mission.refit' }); end(state); end(state);
    expect(target.strength).toBe(15);
    restore(state);
  });
});
