import { expect, test } from 'vitest';
import { ARCANE_DISCOVERIES, BATTLE_SPELLS, BUILDINGS, checksum, MAX_CASTER_STRAIN } from '@theandril/content';
import { createArchive, applyRecordedCommand, replayArchive, createJournal } from '../../chronicle/src/index';
import { characterBattleCampaign } from '../../test-fixtures/src/character-fixture';
import { conquestCampaign } from '../../test-fixtures/src/conquest-fixture';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { applyCommand, createArmyFormation, deserializeGame, getBattleScene, getObservation, serializeGame, stateHash, type BattlePresentation, type GameCommand, type GameState } from './index';
import { chooseBattleOrder } from './combat';
import { relocateArmy } from './warfare';

const owner = 'faction.ashen_compact', enemy = 'faction.reedbound_council';
const issue = (state: GameState, command: GameCommand) => { const result = applyCommand(state, command); expect(result, JSON.stringify(command)).toMatchObject({ ok: true }); return result; };
const reject = (state: GameState, command: unknown) => { const before = serializeGame(state); expect(applyCommand(state, command).ok).toBe(false); expect(serializeGame(state)).toBe(before); };
function prepare() {
  const game = characterBattleCampaign();
  // Explicitly funded combat laboratory; archive, officer and knowledge purchases
  // below cross the real command boundary. No battle outcome or cast is injected.
  game.factions[0]!.knowledge = 300;
  const town = game.settlements['settlement.5']!;
  const before = game.factions[0]!.treasury;
  issue(game, { type: 'queue', factionId: owner, settlementId: town.id, itemId: 'building.archive' });
  expect(game.factions[0]!.treasury).toBe(before - BUILDINGS.find(item => item.id === 'building.archive')!.coinCost);
  for (let i = 0; i < 20 && !town.buildings.includes('building.archive'); i++) issue(game, { type: 'endTurn', factionId: owner });
  expect(town.buildings).toContain('building.archive');
  const casterId = `character.${game.nextId}`, purse = game.factions[0]!.treasury;
  issue(game, { type: 'recruitCharacter', factionId: owner, settlementId: town.id, definitionId: 'character.waykeeper' });
  expect(game.factions[0]!.treasury).toBe(purse - 40);
  issue(game, { type: 'assignCharacter', factionId: owner, characterId: casterId, armyId: 'army.2' });
  for (const discovery of ARCANE_DISCOVERIES) { const knowledge = game.factions[0]!.knowledge; issue(game, { type: 'researchArcane', factionId: owner, discoveryId: discovery.id }); expect(game.factions[0]!.knowledge).toBe(knowledge - discovery.knowledgeCost); }
  return { game: deserializeGame(serializeGame(game)), casterId };
}
function begin(game: GameState) {
  issue(game, { type: 'declareWar', factionId: owner, targetFactionId: enemy });
  issue(game, { type: 'attack', factionId: owner, armyId: 'army.2', targetArmyId: 'army.4' });
  expect(game.battle?.rulesVersion).toBe(9);
}
const use = (game: GameState, sourceId: string, abilityId: string, targetId?: string): GameCommand => ({ type: 'useBattleAbility', factionId: owner, battleId: game.battle!.id, sourceId, abilityId, ...(targetId ? { targetId } : {}) });

test('national Arcane Theory and personal aptitude are distinct, paid, detached and required', () => {
  const unprepared = characterBattleCampaign(), town = unprepared.settlements['settlement.5']!;
  reject(unprepared, { type: 'researchArcane', factionId: owner, discoveryId: ARCANE_DISCOVERIES[0]!.id });
  const { game, casterId } = prepare();
  expect(game.characters[casterId]!.aptitudes).toEqual({ 'path.flame': 1, 'path.rune': 1 });
  const before = stateHash(game), view = getObservation(game, owner);
  expect(view.characters.find(item => item.id === casterId)?.spellIds).toEqual(['spell.bound_ward', 'spell.cinder_thread']);
  view.characters.find(item => item.id === casterId)!.aptitudes!['path.flame'] = 3;
  view.arcaneResearch.discoveries.length = 0;
  expect(stateHash(game)).toBe(before);
  reject(game, { type: 'researchArcane', factionId: owner, discoveryId: ARCANE_DISCOVERIES[0]!.id });
  reject(game, { type: 'research', factionId: owner, technologyId: ARCANE_DISCOVERIES[0]!.id });
  // Authored personal limitation: national discovery alone cannot supply Flame.
  game.characters[casterId]!.aptitudes = { 'path.rune': 1 };
  const restored = deserializeGame(serializeGame(game)); begin(restored);
  expect(restored.battle!.characterSnapshots.find(item => item.characterId === casterId)?.spellIds).toEqual(['spell.bound_ward']);
  expect(getObservation(restored, owner).battleAbilities.some(item => item.sourceId === casterId && item.abilityId === 'spell.cinder_thread')).toBe(false);
  expect(town.id).toBe('settlement.5');
});

test('manual targeted casts pay strain, spend finite uses, cannot heal or act twice in the same round, and resume exactly', () => {
  const { game, casterId } = prepare(); begin(game);
  const journal = createJournal(game, { mode: 'player', coverage: 'from-save' });
  const battle = game.battle!, target = battle.combat.attacker[0]!, foe = battle.combat.defender[0]!;
  const hp = target.strength;
  reject(game, use(game, casterId, 'spell.cinder_thread', target.id));
  reject(game, use(game, casterId, 'spell.bound_ward', foe.id));
  reject(game, use(game, casterId, 'spell.bound_ward', 'formation.missing'));
  reject(game, { ...use(game, casterId, 'spell.bound_ward', target.id), factionId: enemy });
  expect(journal.record(game, use(game, casterId, 'spell.bound_ward', target.id)).ok).toBe(true);
  expect(target.strength).toBe(hp); expect(target.ward).toBe(8);
  expect(battle.abilityState!.casters[0]).toMatchObject({ strain: 3, lastActedRound: 1 });
  reject(game, use(game, casterId, 'spell.cinder_thread', foe.id));
  let mirror = deserializeGame(serializeGame(game));
  const order: GameCommand = { type: 'battleOrder', factionId: owner, order: 'brace' };
  expect(journal.record(game, order)).toEqual(applyCommand(mirror, order));
  expect(serializeGame(game)).toBe(serializeGame(mirror));
  expect(game.battle!.abilityState!.casters[0]!.strain).toBe(3); // manual action reserves this round
  const victim = game.battle!.combat.defender.find(item => item.strength && item.morale)!;
  const cast = use(game, casterId, 'spell.cinder_thread', victim.id), old = victim.strength;
  expect(journal.record(game, cast)).toEqual(applyCommand(mirror, cast)); expect(victim.strength).toBeLessThan(old);
  expect(game.battle!.abilityState!.casters[0]!.strain).toBe(7);
  mirror = deserializeGame(serializeGame(mirror));
  const finish: GameCommand = { type: 'autoResolveBattle', factionId: owner };
  expect(journal.record(game, finish)).toEqual(applyCommand(mirror, finish));
  expect(serializeGame(game)).toBe(serializeGame(mirror));
  expect(game.battleReports.at(-1)!.abilityState!.casters[0]!.strain).toBeLessThanOrEqual(MAX_CASTER_STRAIN);
  expect(serializeGame(replayArchive(journal.materialize()))).toBe(serializeGame(game));
});

test('both sides automatically Rally and use enabled sources through the same manual/autoresolve kernel', () => {
  const { game } = prepare();
  // A paid enemy marshal is appointed at its actual town, then returns to the
  // authored battlefield. The two sides begin equally shaken.
  const army = game.armies['army.4']!, original = army.cell;
  const town = Object.values(game.settlements).find(item => item.factionId === enemy)!;
  game.factions.find(item => item.id === enemy)!.treasury = 200;
  relocateArmy(game, army, town.cell);
  const marshalId = `character.${game.nextId}`;
  issue(game, { type: 'recruitCharacter', factionId: enemy, settlementId: town.id, definitionId: 'character.marshal' });
  issue(game, { type: 'assignCharacter', factionId: enemy, characterId: marshalId, armyId: army.id });
  relocateArmy(game, army, original);
  for (const host of Object.values(game.armies)) for (const formation of host.formations) formation.morale = 30;
  refreshAuthoredSight(game); begin(game);
  const mirror = deserializeGame(serializeGame(game));
  const packets: BattlePresentation[] = [];
  while (game.battle) {
    const order = chooseBattleOrder(game.battle.combat, 'attacker');
    expect(applyCommand(game, { type: 'battleOrder', factionId: owner, order }, undefined, packet => packets.push(packet)).ok).toBe(true);
  }
  issue(mirror, { type: 'autoResolveBattle', factionId: owner });
  expect(game.battleReports).toEqual(mirror.battleReports);
  expect(game.armies).toEqual(mirror.armies);
  expect(new Set(packets.flatMap(packet => packet.events.filter(event => event.abilityId === 'ability.rally').map(event => event.sourceId))).size).toBe(2);
  expect(packets.flatMap(packet => packet.events).some(event => event.abilityId === 'ability.set_shields')).toBe(true);
});

test('per-source auto policy persists, manual use remains legal, and rejected policies are atomic', () => {
  const { game, casterId } = prepare(); begin(game);
  const policy: GameCommand = { type: 'setBattleAbilityAuto', factionId: owner, battleId: game.battle!.id, sourceId: casterId, abilityId: 'spell.bound_ward', automatic: false };
  issue(game, policy); reject(game, policy);
  const state = deserializeGame(serializeGame(game));
  expect(getObservation(state, owner).battleAbilities.find(item => item.sourceId === casterId && item.abilityId === policy.abilityId)?.automatic).toBe(false);
  issue(state, use(state, casterId, policy.abilityId, state.battle!.combat.attacker[0]!.id));
  expect(state.battle!.abilityState!.casters[0]!.strain).toBe(3);
});

test('pending/report observation and journal copies cannot mutate nested caster or automatic state, and nonparticipants stay private', () => {
  const { game, casterId } = prepare();
  const remoteId = `character.${game.nextId}`;
  issue(game, { type: 'recruitCharacter', factionId: owner, settlementId: 'settlement.5', definitionId: 'character.waykeeper' });
  begin(game);
  const journal = createJournal(game, { mode: 'player', coverage: 'from-save' });
  const corruptCopy = (battle: NonNullable<ReturnType<typeof getObservation>['battle']>) => {
    battle.abilityState!.sources[0]!.usesRemaining = 0;
    battle.abilityState!.identities[0]!.name = 'Changed copy';
    const caster = battle.characterSnapshots.find(item => item.characterId === casterId)!;
    caster.aptitudes!['path.flame'] = 3; caster.spellIds!.length = 0;
  };
  let before = serializeGame(game);
  corruptCopy(getObservation(game, owner).battle!);
  expect(serializeGame(game)).toBe(before);
  const foreign = getObservation(game, enemy);
  expect(foreign.characters).toEqual([]); expect(foreign.arcaneResearch.choices.every(choice => choice.casters.length === 0)).toBe(true);
  expect(foreign.battleScene!.characters.some(item => item.id === remoteId)).toBe(false);
  expect(foreign.battleScene!.characters.some(item => item.id === casterId)).toBe(true); // actual opposing field officer is witnessed
  expect(journal.record(game, { type: 'autoResolveBattle', factionId: owner }).ok).toBe(true);
  before = serializeGame(game); corruptCopy(getObservation(game, owner).battleReports.at(-1)!);
  const detached = journal.materialize(); corruptCopy(detached.records.at(-1)!.battles[0] as NonNullable<typeof game.battle>);
  expect(serializeGame(game)).toBe(before);
  expect(serializeGame(replayArchive(journal.materialize()))).toBe(before);
});

test('wounded casters have no enabled spell sources and a remaining ward protects real pursuit losses', () => {
  const wounded = prepare(); wounded.game.characters[wounded.casterId]!.woundedTurns = 2;
  begin(wounded.game);
  expect(getObservation(wounded.game, owner).battleAbilities.some(item => item.sourceId === wounded.casterId)).toBe(false);
  expect(serializeGame(deserializeGame(serializeGame(wounded.game)))).toBe(serializeGame(wounded.game));
  const { game, casterId } = prepare(); begin(game);
  const target = game.battle!.combat.attacker[0]!;
  issue(game, use(game, casterId, 'spell.bound_ward', target.id));
  const packets: BattlePresentation[] = [];
  expect(applyCommand(game, { type: 'battleOrder', factionId: owner, order: 'withdraw' }, undefined, packet => packets.push(packet)).ok).toBe(true);
  const pursuit = packets[0]!.events.find(event => event.type === 'pursuit' && event.targetIds.includes(target.id));
  expect(pursuit).toBeDefined(); expect(pursuit!.changes[0]!.wardDelta).toBeLessThan(0);
  expect(pursuit!.changes[0]!.strengthDelta).toBe(0);
});

test.each([{ strength: 1, morale: 55, reason: 'formations destroyed' }, { strength: 20, morale: 1, reason: 'morale rout' }])('a manual terminal cast settles $reason immediately with the shared pursuit RNG and no free round', setup => {
  const { game, casterId } = prepare();
  // Authored vulnerable enemy, but both paths perform the same one paid cast.
  const foe = game.armies['army.4']!;
  foe.formations = [{ ...createArmyFormation(foe.id, 'unit.scout'), strength: setup.strength, morale: setup.morale }];
  foe.movement = 0; refreshAuthoredSight(game); begin(game);
  for (const source of getObservation(game, owner).battleAbilities) if (source.abilityId !== 'spell.cinder_thread') issue(game, { type: 'setBattleAbilityAuto', factionId: owner, battleId: game.battle!.id, sourceId: source.sourceId, abilityId: source.abilityId, automatic: false });
  const automatic = deserializeGame(serializeGame(game)), archive = createArchive(game, { mode: 'player', coverage: 'from-save' });
  const turn = game.turn, round = game.battle!.combat.round, rng = game.battle!.combat.rngState;
  const packets: BattlePresentation[] = [];
  expect(applyRecordedCommand(game, archive, use(game, casterId, 'spell.cinder_thread', game.battle!.combat.defender[0]!.id), undefined, packet => packets.push(packet)).ok).toBe(true);
  expect(game.battle).toBeNull(); expect(game.turn).toBe(turn);
  const report = game.battleReports.at(-1)!;
  expect(report.combat.round).toBe(round); expect(report.combat.result?.reason).toBe(setup.reason);
  expect(report.abilityState!.sources.filter(item => item.abilityId !== 'spell.cinder_thread').every(item => item.usesRemaining > 0)).toBe(true);
  issue(automatic, { type: 'autoResolveBattle', factionId: owner });
  const auto = automatic.battleReports.at(-1)!;
  expect(report.formationAftermath).toEqual(auto.formationAftermath);
  expect(report.combat.rngState).toBe(auto.combat.rngState);
  if (setup.strength === 1) expect(report.combat.rngState).toBe(rng);
  else expect(report.combat.rngState).not.toBe(rng);
  expect(packets[0]!.events.at(-1)?.type).toBe('result');
  expect(packets[0]!.after.result).toEqual(report.combat.result);
  expect(archive.records.at(-1)!.battles).toHaveLength(1);
  expect(serializeGame(replayArchive(archive))).toBe(serializeGame(game));
  expect(serializeGame(deserializeGame(serializeGame(game)))).toBe(serializeGame(game));
});

test('trace facts exactly reconstruct changed stats, are bounded and detached, and throwing observers do not affect gameplay or archive', () => {
  const { game } = prepare(); begin(game);
  const mirror = deserializeGame(serializeGame(game)), archive = createArchive(game, { mode: 'player', coverage: 'from-save' });
  const baseline = createArchive(mirror, { mode: 'player', coverage: 'from-save' }), packets: BattlePresentation[] = [];
  const order: GameCommand = { type: 'autoResolveBattle', factionId: owner };
  const result = applyRecordedCommand(game, archive, order, undefined, packet => {
    packets.push(structuredClone(packet));
    packet.before.formations[0]!.strength = 999; packet.after.formations.length = 0; packet.events[0]!.targetIds.push('hostile.alias');
    throw new Error('presentation failed deliberately');
  });
  expect(result.ok).toBe(true); expect(result.diagnostics?.[0]).toContain('presentation failed deliberately');
  expect(applyRecordedCommand(mirror, baseline, order).ok).toBe(true);
  expect(serializeGame(game)).toBe(serializeGame(mirror)); expect(archive).toEqual(baseline);
  const packet = packets[0]!, stats = new Map(packet.before.formations.map(item => [item.id, { ...item }]));
  expect(packet.events.length).toBeLessThan(4096);
  packet.events.forEach((event, sequence) => { expect(event.sequence).toBe(sequence); for (const change of event.changes) { const item = stats.get(change.formationId)!; item.strength += change.strengthDelta; item.morale += change.moraleDelta; item.fatigue += change.fatigueDelta; item.ward += change.wardDelta; } });
  for (const after of packet.after.formations) expect(stats.get(after.id)).toMatchObject({ strength: after.strength, morale: after.morale, fatigue: after.fatigue, ward: after.ward });
  expect(packet.events.at(-1)?.type).toBe('result');
  const scene = getBattleScene(game, game.battleReports.at(-1)!); scene.characters.length = 0;
  expect(serializeGame(game)).toBe(serializeGame(mirror));
});

test('checksum-valid forged sources, free protection, unspent strain and frozen personal profiles are rejected', () => {
  const { game } = prepare(); begin(game);
  const mutate = (edit: (state: GameState) => void) => { const bad = deserializeGame(serializeGame(game)); edit(bad); const envelope = JSON.parse(serializeGame(bad)) as { stateChecksum: string; state: unknown }; envelope.stateChecksum = checksum(JSON.stringify(envelope.state)); expect(() => deserializeGame(JSON.stringify(envelope))).toThrow(); };
  mutate(state => { state.battle!.abilityState!.sources[0]!.usesRemaining = 4; });
  mutate(state => { state.battle!.abilityState!.sources.reverse(); });
  mutate(state => { state.battle!.abilityState!.casters[0]!.strain = 3; });
  mutate(state => { state.battle!.combat.attacker[0]!.ward = 8; });
  mutate(state => { state.battle!.characterSnapshots.find(item => item.aptitudes)!.spellIds = [BATTLE_SPELLS[0]!.id]; });
});

test('siege assaults emit actual fortified militia facts through the same battle9 kernel', () => {
  const game = conquestCampaign();
  issue(game, { type: 'declareWar', factionId: owner, targetFactionId: enemy });
  issue(game, { type: 'besiege', factionId: owner, armyId: 'army.2', settlementId: 'settlement.6' });
  issue(game, { type: 'endTurn', factionId: owner });
  issue(game, { type: 'assault', factionId: owner, settlementId: 'settlement.6' });
  const packets: BattlePresentation[] = [];
  expect(applyCommand(game, { type: 'autoResolveBattle', factionId: owner }, undefined, packet => packets.push(packet)).ok).toBe(true);
  expect(packets[0]!.before.settlementId).toBe('settlement.6');
  expect(packets[0]!.events.some(event => event.type === 'attack')).toBe(true);
  expect(packets[0]!.before.formations.some(item => item.armyId === null && item.armyName === 'Settlement militia')).toBe(true);
  expect(serializeGame(deserializeGame(serializeGame(game)))).toBe(serializeGame(game));
});

test('twenty-by-twenty real formations remain bounded and loss-conserving with innate auto abilities', () => {
  // The smaller campaign proof above exercises actual appointment/research. This
  // authored scale case pays marshal promotions instead of bypassing capacity.
  const game = characterBattleCampaign();
  const army = game.armies['army.2']!, marshal = Object.values(game.characters)[0]!;
  marshal.experience = 100;
  for (const skillId of ['skill.decisive', 'skill.muster_rolls', 'skill.field_orders']) issue(game, { type: 'promoteCharacter', factionId: owner, characterId: marshal.id, skillId });
  while (army.formations.length < 20) army.formations.push(createArmyFormation(`army.${game.nextId++}`, 'unit.guard'));
  army.formations.sort((a, b) => a.id < b.id ? -1 : 1);
  // Defender co-located detachments collectively contribute twenty actual units.
  const foe = game.armies['army.4']!;
  for (let i = 1; i < 20; i++) { const id = `army.${game.nextId++}`; game.armies[id] = { ...foe, id, name: `Battle reserve ${i}`, formations: [createArmyFormation(id, 'unit.guard')] }; }
  refreshAuthoredSight(game);
  const restored = deserializeGame(serializeGame(game)); begin(restored);
  expect(restored.battle!.combat.attacker).toHaveLength(20); expect(restored.battle!.combat.defender).toHaveLength(20);
  const starting = restored.battle!.formationStrengths.reduce((sum, item) => sum + item.strength, 0);
  const packets: BattlePresentation[] = [];
  expect(applyCommand(restored, { type: 'autoResolveBattle', factionId: owner }, undefined, packet => packets.push(packet)).ok).toBe(true);
  expect(packets[0]!.events.length).toBeLessThan(4096);
  expect(restored.battleReports.at(-1)!.formationAftermath.reduce((sum, item) => sum + item.strength, 0)).toBeLessThan(starting);
  expect(serializeGame(deserializeGame(serializeGame(restored)))).toBe(serializeGame(restored));
});
