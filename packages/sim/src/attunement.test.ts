import { describe, expect, it } from 'vitest';
import { ATTUNEMENT_VICTORY, CAMPAIGN_PACES, CONTENT_HASH, SCHEMA43_ATTUNEMENT_VICTORY } from '@theandril/content';
import { withRules } from './rules';
import { PRE_SEAM_PRICING_CONTENT_HASH } from './save';
import { attunementCampaign } from '../../test-fixtures/src/victory-fixture';
import { applyCommand, applyCommandForVersion, deserializeGame, getObservation, serializeGame, serializeGameForVersion, stateHash, stateHashForVersion, type GameState } from './index';
import { characterSpellIds } from './magic';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';

const endTurn = (state: GameState) => expect(applyCommand(state, { type: 'endTurn', factionId: state.turnOwnerId })).toMatchObject({ ok: true });
const working = (state: GameState) => state.projects.find(project => project.projectId === ATTUNEMENT_VICTORY.id);
const casterOf = (state: GameState) => Object.values(state.characters).find(character => character.factionId === state.turnOwnerId && character.definitionId === 'character.waykeeper')!;
const hostOf = (state: GameState) => Object.values(state.settlements).find(town => town.factionId === state.turnOwnerId)!;
const start = (state: GameState) => applyCommand(state, { type: 'startAttunement', factionId: state.turnOwnerId, settlementId: hostOf(state).id, characterId: casterOf(state).id });
const window = CAMPAIGN_PACES.short.projectActiveTurns;

describe('Attunement victory (rules 38)', () => {
  it('seals a working through a qualified caster and wins after sustaining it through the window', () => {
    const state = attunementCampaign(), player = state.turnOwnerId, rival = state.factions[1]!.id;
    const view = getObservation(state, player).progression.attunement!;
    expect(view).toMatchObject({ knowledgeCost: ATTUNEMENT_VICTORY.knowledgeCost.short, requiredTurns: window, discoveries: { researched: 3, total: 3 }, blockers: [], eligibleSettlementIds: [hostOf(state).id] });
    expect(view.paths.map(path => path.held)).toEqual([true, true]);
    expect(view.casters).toEqual([{ characterId: casterOf(state).id, name: casterOf(state).name, degree: expect.any(Number), settlementId: hostOf(state).id, qualified: true, blocker: null }]);
    expect(view.casters[0]!.degree).toBeGreaterThanOrEqual(2);
    // A realm with no arcane standing sees only that the path exists; its standing appears once it begins.
    expect(getObservation(state, rival).progression).toMatchObject({ attunementAvailable: true });
    expect(getObservation(state, rival).progression.attunement).toBeUndefined();
    const knowledge = state.factions[0]!.knowledge;
    expect(start(state)).toMatchObject({ ok: true });
    expect(state.factions[0]!.knowledge).toBe(knowledge - view.knowledgeCost);
    expect(working(state)).toMatchObject({ factionId: player, settlementId: hostOf(state).id, status: 'active', progress: 0, requiredTurns: window });
    expect(getObservation(state, player).progression.attunement!.blockers).toContain('This faction already has an ongoing Attunement.');
    // The working and its host are public to rivals, as every victory bid is.
    expect(getObservation(state, rival).projects.some(project => project.projectId === ATTUNEMENT_VICTORY.id && project.factionId === player)).toBe(true);
    endTurn(state);
    const resumed = deserializeGame(serializeGame(state));
    expect(stateHash(resumed)).toBe(stateHash(state));
    for (let turn = 1; turn < window; turn++) { endTurn(state); endTurn(resumed); }
    expect(state.victory).toMatchObject({ path: 'attunement', factionId: player, projectId: working(state)!.id, settlementId: hostOf(state).id });
    expect(working(state)).toMatchObject({ status: 'completed', progress: window });
    expect(stateHash(resumed)).toBe(stateHash(state));
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    expect(applyCommand(state, { type: 'endTurn', factionId: player })).toMatchObject({ ok: false, error: 'This campaign has ended in victory.' });
  });

  it('rests while the caster, a seam or the host is lost to the realm, and ends when the host falls', () => {
    const state = attunementCampaign(), player = state.turnOwnerId, rival = state.factions[1]!.id;
    expect(start(state)).toMatchObject({ ok: true });
    const caster = casterOf(state), host = hostOf(state);
    caster.woundedTurns = 2;
    endTurn(state);
    expect(working(state)).toMatchObject({ status: 'paused', statusReason: 'No Waykeeper of the second degree stands at the host.', progress: 0 });
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    caster.woundedTurns = 0;
    endTurn(state);
    expect(working(state)).toMatchObject({ status: 'active', statusReason: null, progress: 1 });

    const land = state.land.settlements[host.id]!;
    const flame = getObservation(state, player).arcaneSites.find(site => site.pathId === 'path.flame')!;
    land.claimed = land.claimed.filter(cell => cell !== flame.cell);
    endTurn(state);
    expect(working(state)).toMatchObject({ status: 'paused', statusReason: 'A surveyed Flame seam is no longer held.', progress: 1 });
    land.claimed = [...land.claimed, flame.cell].sort((a, b) => a - b);
    endTurn(state);
    expect(working(state)).toMatchObject({ status: 'active', progress: 2 });

    // Occupation counts down during the settlement phase, before the working is judged.
    host.occupationTurns = 3;
    endTurn(state);
    expect(working(state)).toMatchObject({ status: 'paused', statusReason: 'The host settlement is occupied.', progress: 2 });

    const fallen = deserializeGame(serializeGame(state));
    const knowledge = fallen.factions[0]!.knowledge;
    // Authored conquest: the garrison withdraws with the caster, then the hearth changes hands.
    const refuge = fallen.land.settlements[host.id]!.claimed.find(cell => cell !== host.cell)!;
    const garrison = Object.values(fallen.armies).filter(army => army.factionId === player && army.cell === host.cell);
    for (const army of garrison) army.cell = refuge;
    fallen.characters[caster.id]!.location = { kind: 'army', armyId: garrison[0]!.id };
    fallen.settlements[host.id]!.factionId = rival;
    fallen.land.capitals[player] = null;
    refreshAuthoredSight(fallen);
    endTurn(fallen);
    expect(working(fallen)).toMatchObject({ status: 'cancelled', statusReason: 'The host settlement was conquered or razed; the committed knowledge is lost.' });
    expect(fallen.factions[0]!.knowledge).toBe(knowledge);
    expect(fallen.victory).toBeNull();
    expect(stateHash(deserializeGame(serializeGame(fallen)))).toBe(stateHash(fallen));
  });

  it('refuses an unqualified or absent caster and the wrong host, and stays out of historical rules', () => {
    const state = attunementCampaign(), player = state.turnOwnerId;
    const caster = casterOf(state), host = hostOf(state);
    expect(applyCommand(state, { type: 'startAttunement', factionId: player, settlementId: 'settlement.999', characterId: caster.id })).toMatchObject({ ok: false, error: 'You do not control that settlement.' });
    const deepened = structuredClone(caster.aptitudes);
    caster.aptitudes = { 'path.flame': 1, 'path.rune': 1 };
    expect(getObservation(state, player).progression.attunement!.casters[0]).toMatchObject({ qualified: false, blocker: 'This Waykeeper has not reached the second degree of any path.', degree: 1 });
    expect(start(state)).toMatchObject({ ok: false });
    expect(working(state)).toBeUndefined();
    caster.aptitudes = deepened;
    // A caster riding away from the host cannot seal it from the road.
    const army = Object.values(state.armies).find(item => item.factionId === player)!;
    expect(applyCommand(state, { type: 'assignCharacter', factionId: player, characterId: caster.id, armyId: army.id })).toMatchObject({ ok: true });
    army.cell = state.land.settlements[host.id]!.claimed.find(cell => cell !== host.cell)!;
    refreshAuthoredSight(state);
    expect(getObservation(state, player).progression.attunement!.casters[0]).toMatchObject({ qualified: false, blocker: 'Bring this caster to a hearth that can host the working.', settlementId: null });
    expect(start(state)).toMatchObject({ ok: false });
    caster.location = { kind: 'settlement', settlementId: host.id };

    // A tradition-born second degree needs no deepening; without one, a rules-37
    // reading of the brink is identical, and the working itself cannot enter it.
    caster.learnedSkillIds = [];
    expect(stateHash(deserializeGame(serializeGameForVersion(state, 37)))).toBe(stateHash(state));
    expect(applyCommandForVersion(state, { type: 'startAttunement', factionId: player, settlementId: host.id, characterId: caster.id }, 37)).toMatchObject({ ok: false, error: expect.stringContaining('Malformed command') });
    expect(start(state)).toMatchObject({ ok: true });
    expect(() => serializeGameForVersion(state, 37)).toThrow('attunement');
    expect(() => stateHashForVersion(state, 37)).toThrow('attunement');
    expect(() => applyCommandForVersion(state, { type: 'endTurn', factionId: player }, 37)).toThrow('attunement');
  });
});

describe('Waykeeper path deepening (rules 38)', () => {
  it('raises one personal path a degree at a time, never past the third, and reaches deeper workings', () => {
    const state = attunementCampaign(), player = state.turnOwnerId, caster = casterOf(state);
    expect(caster.learnedSkillIds).toContain('skill.flame_deepening');
    expect(caster.aptitudes!['path.flame']).toBeGreaterThanOrEqual(2);
    const rune = caster.aptitudes!['path.rune']!;
    caster.experience = 24;
    expect(applyCommand(state, { type: 'promoteCharacter', factionId: player, characterId: caster.id, skillId: 'skill.flame_deepening' })).toMatchObject({ ok: false, error: 'This character has already learned that skill.' });
    expect(applyCommand(state, { type: 'promoteCharacter', factionId: player, characterId: caster.id, skillId: 'skill.rune_deepening' })).toMatchObject({ ok: true });
    expect(caster.aptitudes!['path.rune']).toBe(Math.min(3, rune + 1));
    expect(caster.experience).toBe(0);
    // Unbinding needs the second degree of Rune; the realm's research alone never granted it.
    expect(characterSpellIds(caster.aptitudes, state.arcaneResearch[player]!)).toContain('spell.unbinding');
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    // A deepened path never rests below the second degree in a save.
    const forged = JSON.parse(serializeGame(state));
    const record = forged.state.characters.find((item: { id: string }) => item.id === caster.id);
    record.aptitudes['path.rune'] = 1;
    expect(() => deserializeGame(JSON.stringify(forged))).toThrow();
  });

  it('is refused under historical rules and absent from their observations', () => {
    const state = attunementCampaign(), player = state.turnOwnerId;
    const fresh = Object.values(state.characters).find(character => character.factionId === player && character.definitionId === 'character.waykeeper')!;
    fresh.learnedSkillIds = []; fresh.aptitudes = { 'path.flame': 1, 'path.rune': 1 }; fresh.experience = 48;
    expect(applyCommandForVersion(state, { type: 'promoteCharacter', factionId: player, characterId: fresh.id, skillId: 'skill.rune_deepening' }, 37)).toMatchObject({ ok: false, error: 'That skill is not available under these historical rules.' });
    expect(applyCommandForVersion(state, { type: 'promoteCharacter', factionId: player, characterId: fresh.id, skillId: 'skill.rune_deepening' }, 38)).toMatchObject({ ok: true });
    expect(() => serializeGameForVersion(state, 37)).toThrow('attunement');
  });
});

describe('seam study (rules 39)', () => {
  it('gives a lodged Waykeeper one experience a turn from a hearth that holds a seam, and nothing under older rules or away from the hearth', async () => {
    const { createGame } = await import('./index');
    const { holdSurveyedSeam, refreshAuthoredSight } = await import('../../test-fixtures/src/authored-land');
    const { getLandIndex } = await import('./territory');
    for (const rules of [38, 39] as const) {
      const state = createGame({ seed: 20260906, size: 'tiny', factionCount: 2, pace: 'short', rulesVersion: rules });
      const player = state.turnOwnerId;
      expect(applyCommand(state, { type: 'found', factionId: player, armyId: 'army.1', name: 'Glasswatch' })).toMatchObject({ ok: true });
      state.factions[0]!.treasury = 300;
      holdSurveyedSeam(state, player, 'path.flame');
      const host = Object.values(state.settlements).find(town => town.factionId === player)!;
      expect(applyCommand(state, { type: 'recruitCharacter', factionId: player, settlementId: host.id, definitionId: 'character.waykeeper' })).toMatchObject({ ok: true });
      const caster = Object.values(state.characters).find(character => character.definitionId === 'character.waykeeper')!;
      const run = (command: Parameters<typeof applyCommand>[1]) => rules === 39 ? applyCommand(state, command) : applyCommandForVersion(state, command, 38);
      expect(run({ type: 'endTurn', factionId: player })).toMatchObject({ ok: true });
      expect(caster.experience).toBe(rules === 39 ? 1 : 0);
      if (rules === 38) continue;
      // Attached to an army, wounded or on a mission, the caster does not study.
      const army = Object.values(state.armies).find(item => item.factionId === player)!;
      army.cell = host.cell; refreshAuthoredSight(state);
      expect(applyCommand(state, { type: 'assignCharacter', factionId: player, characterId: caster.id, armyId: army.id })).toMatchObject({ ok: true });
      expect(applyCommand(state, { type: 'endTurn', factionId: player })).toMatchObject({ ok: true });
      expect(caster.experience).toBe(1);
      expect(applyCommand(state, { type: 'unassignCharacter', factionId: player, characterId: caster.id, settlementId: host.id })).toMatchObject({ ok: true });
      caster.woundedTurns = 1;
      expect(applyCommand(state, { type: 'endTurn', factionId: player })).toMatchObject({ ok: true });
      expect(caster.experience).toBe(1);
      expect(applyCommand(state, { type: 'endTurn', factionId: player })).toMatchObject({ ok: true });
      expect(caster.experience).toBe(2);
      // A hearth that loses its seam stops the study; the state round-trips exactly.
      const land = state.land.settlements[host.id]!;
      const seam = state.arcaneSurveys[player]![0]!;
      land.claimed = land.claimed.filter(cell => cell !== seam); getLandIndex(state).delete(seam); refreshAuthoredSight(state);
      expect(applyCommand(state, { type: 'endTurn', factionId: player })).toMatchObject({ ok: true });
      expect(caster.experience).toBe(2);
      expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    }
  });
});

describe('rules 44 pricing', () => {
  it('re-prices the working from measured campaigns, keeps the rules 38–43 price for older campaigns, and loads a v43 envelope under the new pack', () => {
    const state = attunementCampaign(), player = state.turnOwnerId;
    state.pace = 'standard';
    const price = (version: 43 | 44) => withRules(state, version, () => getObservation(state, player).progression.attunement!.knowledgeCost);
    expect(price(44)).toBe(ATTUNEMENT_VICTORY.knowledgeCost.standard);
    expect(price(44)).toBe(3600);
    expect(price(43)).toBe(SCHEMA43_ATTUNEMENT_VICTORY.knowledgeCost.standard);
    expect(price(43)).toBe(600);
    // The working itself is unchanged: a rules 43 realm with 600 knowledge may start it, a rules 44 realm may not.
    state.factions[0]!.knowledge = 600;
    expect(withRules(state, 44, () => getObservation(state, player).progression.attunement!.blockers)).toContainEqual(expect.stringContaining('3600 knowledge'));
    expect(withRules(state, 43, () => getObservation(state, player).progression.attunement!.blockers)).toEqual([]);
    // A campaign sealed under the frozen rules 42–43 pack continues unchanged under rules 44.
    const sealed = serializeGameForVersion(state, 43);
    expect(JSON.parse(sealed)).toMatchObject({ version: 43, contentHash: PRE_SEAM_PRICING_CONTENT_HASH });
    const loaded = deserializeGame(sealed);
    expect(stateHash(loaded)).toBe(stateHash(state));
    expect(JSON.parse(serializeGame(loaded))).toMatchObject({ version: 44, contentHash: CONTENT_HASH });
    expect(getObservation(loaded, player).progression.attunement!.knowledgeCost).toBe(3600);
  });
});
