import { describe, expect, it } from 'vitest';
import { CONTENT_HASH, landmarkKind, relicDefinition, relicOfLandmarkKind } from '@theandril/content';
import { applyCommand, createGame, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState } from './index';
import { attunementCampaign } from '../../test-fixtures/src/victory-fixture';
import { hexDistance } from '@theandril/mapgen';
import { withRules } from './rules';
import { PRE_RELICS_CONTENT_HASH, serializeGameForVersion } from './save';
import { landmarks } from './landmarks';
import { advanceRelics, bestowBlocker, relicLeadership, validateRelics } from './relics';
import { armyCharacterLeadership } from './characters';

const issue = (state: GameState, command: GameCommand) => { const result = applyCommand(state, command); expect(result.ok, result.error).toBe(true); return result; };
/** The fixture's host hearth made to work a landmark's hex by the ordinary rules: the border is
 * carried to the landmark one legal claim at a time, and the hex is then worked. */
const working = () => {
  const state = attunementCampaign(), player = state.turnOwnerId, host = Object.values(state.settlements).find(town => town.factionId === player)!;
  const width = state.world.width;
  const site = [...landmarks(state.world)].sort((a, b) => hexDistance(a.cell, host.cell, width) - hexDistance(b.cell, host.cell, width) || a.cell - b.cell)[0]!;
  state.factions.find(faction => faction.id === player)!.treasury = 5000;
  for (let step = 0; step < 24; step++) {
    const land = getObservation(state, player).land.settlements.find(item => item.settlementId === host.id)!;
    if (land.claimed.includes(site.cell)) break;
    const next = land.cells.filter(cell => !cell.claimed && cell.claim.canStart).sort((a, b) => hexDistance(a.cell, site.cell, width) - hexDistance(b.cell, site.cell, width) || a.cell - b.cell)[0];
    if (!next) throw new Error('no claim toward the landmark');
    issue(state, { type: 'claimCell', factionId: player, settlementId: host.id, cell: next.cell });
  }
  host.population = Math.max(host.population, 6);
  issue(state, { type: 'setWorkedTiles', factionId: player, settlementId: host.id, cells: [site.cell] });
  expect(state.land.settlements[host.id]!.worked).toContain(site.cell);
  return { state, player, host, site };
};

describe('rules 63: relics of the old places', () => {
  it('is brought up once by the first hearth to work a landmark\u2019s hex, bestowed on a living character of the realm, borne into battle as leadership, and taken back', () => {
    const { state, player, host, site } = working();
    const relic = relicOfLandmarkKind(site.kindId)!;
    expect(state.relics).toEqual([]);
    const events: Parameters<typeof advanceRelics>[1] = [];
    advanceRelics(state, events);
    expect(state.relics).toEqual([{ id: site.id, relicId: relic.id, landmarkId: site.id, factionId: player, holderCharacterId: null, foundTurn: state.turn }]);
    expect(events).toEqual([expect.objectContaining({ type: 'relic_found', factionId: player, cell: site.cell })]);
    expect(events[0]!.message).toContain(`${host.name} have brought up ${relic.name} from ${landmarkKind(site.kindId)!.name}`);
    // Once only, whoever works it later.
    advanceRelics(state, events);
    expect(state.relics).toHaveLength(1);
    expect(getObservation(state, player).relics).toEqual([expect.objectContaining({ id: site.id, name: relic.name, landmarkName: landmarkKind(site.kindId)!.name, holderName: null, leadership: relic.leadership })]);
    expect(getObservation(state, state.factions.find(faction => faction.id !== player)!.id).relics).toEqual([]);
    // Bestowed on the realm's caster; the company they ride with leads better for it.
    const caster = Object.values(state.characters).find(character => character.factionId === player && !character.dead)!;
    const rivalFaction = state.factions.find(faction => faction.id !== player)!.id;
    const rivalHearth = Object.values(state.settlements).find(town => town.factionId === rivalFaction)!;
    const rival = { ...caster, id: `character.${state.nextId++}`, factionId: rivalFaction, location: { kind: 'settlement' as const, settlementId: rivalHearth.id }, mission: null };
    state.characters[rival.id] = rival;
    expect(bestowBlocker(state, player, site.id, rival.id)).toContain('your own realm');
    expect(bestowBlocker(state, player, site.id, null)).toContain('Nobody bears');
    expect(applyCommand(state, { type: 'bestowRelic', factionId: rival.factionId, relicId: site.id, bearerId: rival.id }).error).toContain('your own realm');
    const given = issue(state, { type: 'bestowRelic', factionId: player, relicId: site.id, bearerId: caster.id });
    expect(given.events[0]).toMatchObject({ type: 'relic_bestowed', factionId: player });
    expect(given.events[0]!.message).toContain(`${relic.name} goes to ${caster.name}`);
    expect(state.relics[0]!.holderCharacterId).toBe(caster.id);
    expect(relicLeadership(state, caster.id)).toEqual(relic.leadership);
    expect(getObservation(state, player).relics![0]!.holderName).toBe(caster.name);
    expect(bestowBlocker(state, player, site.id, caster.id)).toContain('bears it already');
    if (caster.location?.kind === 'army') {
      const plain = structuredClone(state); plain.relics[0]!.holderCharacterId = null;
      const before = armyCharacterLeadership(plain, caster.location.armyId), after = armyCharacterLeadership(state, caster.location.armyId);
      expect(after).toEqual({ attack: before.attack + relic.leadership.attack, armor: before.armor + relic.leadership.armor });
    }
    expect(() => validateRelics(state)).not.toThrow();
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    // Taken back; the dead bear nothing.
    const back = issue(state, { type: 'bestowRelic', factionId: player, relicId: site.id, bearerId: null });
    expect(back.events[0]).toMatchObject({ type: 'relic_taken_back' });
    expect(state.relics[0]!.holderCharacterId).toBeNull();
    expect(relicLeadership(state, caster.id)).toEqual({ attack: 0, armor: 0 });
    caster.dead = true;
    expect(bestowBlocker(state, player, site.id, caster.id)).toContain('dead');
    const broken = structuredClone(state); broken.relics[0]!.holderCharacterId = rival.id;
    expect(() => validateRelics(broken)).toThrow('another realm');
  });

  it('is nothing under older rules, cannot be sealed under them once found, and a v62 envelope loads with none', () => {
    const { state, player, site } = working();
    withRules(state, 62, () => {
      const events: Parameters<typeof advanceRelics>[1] = [];
      advanceRelics(state, events);
      expect(state.relics).toEqual([]);
      expect(getObservation(state, player).relics).toBeUndefined();
      expect(applyCommand(state, { type: 'bestowRelic', factionId: player, relicId: site.id, bearerId: null }).error).toContain('not part of these rules');
    });
    expect(() => serializeGameForVersion(state, 62)).not.toThrow();
    advanceRelics(state, []);
    expect(state.relics).toHaveLength(1);
    expect(() => serializeGameForVersion(state, 62)).toThrow('relics unavailable');
    const fresh = attunementCampaign();
    const sealed = serializeGameForVersion(fresh, 62);
    expect(JSON.parse(sealed)).toMatchObject({ version: 62, contentHash: PRE_RELICS_CONTENT_HASH });
    expect(JSON.parse(sealed).state.relics).toBeUndefined();
    const loaded = deserializeGame(sealed);
    expect(loaded.relics).toEqual([]);
    expect(stateHash(loaded)).toBe(stateHash(fresh));
    expect(JSON.parse(serializeGame(loaded))).toMatchObject({ version: 70, contentHash: CONTENT_HASH });
    expect(relicDefinition(relicOfLandmarkKind(site.kindId)!.id)).toBeDefined();
    const whole = createGame({ seed: 20260905, size: 'standard', factionCount: 12 });
    expect(whole.relics).toEqual([]);
  });
});
