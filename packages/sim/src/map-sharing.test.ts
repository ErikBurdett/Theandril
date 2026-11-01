import { describe, expect, it } from 'vitest';
import { CONTENT_HASH } from '@theandril/content';
import { applyCommand, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState } from './index';
import { attunementCampaign } from '../../test-fixtures/src/victory-fixture';
import { withRules } from './rules';
import { PRE_EVENTS_V_CONTENT_HASH, serializeGameForVersion } from './save';
import { MAP_SHARE_COOLDOWN_TURNS, mapShareBlocker, validateMapShares } from './map-sharing';

const issue = (state: GameState, command: GameCommand) => { const result = applyCommand(state, command); expect(result.ok, result.error).toBe(true); return result; };
/** The fixture's two realms, allied. */
const allied = () => {
  const state = attunementCampaign(), a = state.turnOwnerId, b = state.factions.find(item => item.id !== a)!.id;
  issue(state, { type: 'proposeAlliance', factionId: a, targetFactionId: b, termTurns: 30 });
  issue(state, { type: 'respondAlliance', factionId: b, offerId: state.alliances.offers[0]!.id, accept: true });
  return { state, a, b };
};

describe('rules 72: allies share their maps', () => {
  it('gives each ally the other’s explored hexes once every twenty turns, is quoted per ally, is refused without an alliance or too soon, and is validated', () => {
    const { state, a, b } = allied();
    expect(getObservation(state, a).mapShares).toEqual([{ allyId: b, lastTurn: null, canShare: true, blocker: null }]);
    const mine = new Set(state.explored[a]), theirs = new Set(state.explored[b]);
    const learned = [...theirs].filter(cell => !mine.has(cell)).length, taught = [...mine].filter(cell => !theirs.has(cell)).length;
    expect(learned + taught).toBeGreaterThan(0);
    const shared = issue(state, { type: 'shareMaps', factionId: a, allyId: b });
    expect(shared.events.map(event => event.factionId).sort()).toEqual([a, b].sort());
    expect(shared.events[0]!.message).toContain(`learns ${learned} hexes`);
    expect(shared.events[0]!.message).toContain(`${taught}.`);
    expect(state.explored[a]!.size).toBe(mine.size + learned);
    expect(state.explored[b]!.size).toBe(theirs.size + taught);
    expect([...state.explored[a]!].every(cell => state.explored[b]!.has(cell))).toBe(true);
    expect(state.mapShares).toEqual([{ parties: [a, b].sort(), turn: state.turn }]);
    expect(getObservation(state, a).mapShares![0]).toMatchObject({ allyId: b, lastTurn: state.turn, canShare: false });
    expect(getObservation(state, b).mapShares![0]!.blocker).toContain(`shared again from turn ${state.turn + MAP_SHARE_COOLDOWN_TURNS}`);
    expect(mapShareBlocker(state, b, a)).toContain('shared again from turn');
    expect(mapShareBlocker(state, a, a)).toContain('with an ally');
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    // Twenty turns on the pair may share again; the record is replaced, not repeated.
    state.turn += MAP_SHARE_COOLDOWN_TURNS;
    expect(mapShareBlocker(state, b, a)).toBeNull();
    issue(state, { type: 'shareMaps', factionId: b, allyId: a });
    expect(state.mapShares).toEqual([{ parties: [a, b].sort(), turn: state.turn }]);
    expect(() => validateMapShares(state)).not.toThrow();
    const broken = structuredClone(state); broken.mapShares = [{ parties: [b, a].sort().reverse() as [string, string], turn: state.turn }];
    expect(() => validateMapShares(broken)).toThrow('unordered pair');
    // Without an alliance there is nothing to share.
    issue(state, { type: 'renounceAlliance', factionId: a, allyId: b });
    expect(mapShareBlocker(state, a, b)).toContain('with an ally');
    expect(getObservation(state, a).mapShares).toEqual([]);
  });

  it('is nothing under rules 71, cannot be sealed under them once shared, and a v71 envelope loads with none', () => {
    const { state, a, b } = allied();
    withRules(state, 71, () => {
      expect(applyCommand(state, { type: 'shareMaps', factionId: a, allyId: b }).error).toContain('not part of these rules');
      expect(getObservation(state, a).mapShares).toBeUndefined();
    });
    const sealed = serializeGameForVersion(state, 71);
    expect(JSON.parse(sealed)).toMatchObject({ version: 71, contentHash: PRE_EVENTS_V_CONTENT_HASH });
    expect(JSON.parse(sealed).state.mapShares).toBeUndefined();
    const loaded = deserializeGame(sealed);
    expect(loaded.mapShares).toEqual([]);
    expect(stateHash(loaded)).toBe(stateHash(state));
    expect(JSON.parse(serializeGame(loaded))).toMatchObject({ version: 79, contentHash: CONTENT_HASH });
    issue(state, { type: 'shareMaps', factionId: a, allyId: b });
    expect(() => serializeGameForVersion(state, 71)).toThrow('shared maps unavailable');
    expect(applyCommand(state, { type: 'endTurn', factionId: a })).toMatchObject({ ok: true });
  });
});
