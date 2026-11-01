import { describe, expect, it } from 'vitest';
import { characterName, CONTENT_HASH, NOTABLE_CHARACTERS } from '@theandril/content';
import { applyCommand, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState } from './index';
import { attunementCampaign } from '../../test-fixtures/src/victory-fixture';
import { withRules } from './rules';
import { PRE_NOTABLES_CONTENT_HASH, serializeGameForVersion } from './save';
import { assertNoNotables, rebuildCharacterIndexes } from './characters';

const issue = (state: GameState, command: GameCommand) => { const result = applyCommand(state, command); expect(result.ok, result.error).toBe(true); return result; };
const serial = (id: string) => Number(id.slice('character.'.length));
/** The fixture's player realm, paid enough to appoint whoever it likes, and its culture's figure of the age. */
const realm = () => {
  const state = attunementCampaign(), player = state.turnOwnerId;
  const faction = state.factions.find(item => item.id === player)!; faction.treasury = 5000;
  const town = Object.values(state.settlements).find(item => item.factionId === player)!;
  const figure = NOTABLE_CHARACTERS.find(item => item.factionId === faction.definitionId)!;
  const appoint = (definitionId = figure.definitionId) => { const before = new Set(Object.keys(state.characters)); issue(state, { type: 'recruitCharacter', factionId: player, settlementId: town.id, definitionId }); return Object.values(state.characters).find(item => !before.has(item.id))!; };
  return { state, player, faction, town, figure, appoint };
};

describe('rules 64: notable characters', () => {
  it('names the first appointment of a culture’s notable role, once in the campaign, with their specialization already theirs', () => {
    const { state, player, faction, town, figure, appoint } = realm();
    const result = applyCommand(state, { type: 'recruitCharacter', factionId: player, settlementId: town.id, definitionId: figure.definitionId });
    expect(result.ok, result.error).toBe(true);
    const first = Object.values(state.characters).find(item => item.notableId === figure.id)!;
    expect(first).toMatchObject({ name: figure.name, skillId: figure.skillId, definitionId: figure.definitionId, factionId: player, experience: 0, learnedSkillIds: [] });
    expect(result.events[0]!.message).toContain(`${figure.name}, whose name is known beyond the realm, was appointed`);
    const view = getObservation(state, player).characters.find(item => item.id === first.id)!;
    expect(view.notable).toEqual({ id: figure.id, lore: figure.lore });
    expect(view.rank).toBe(2);
    expect(view.promotions.find(item => item.skillId === figure.skillId)).toMatchObject({ acquired: true });
    // A second appointment of the role is an ordinary one, and so is any other role.
    const second = appoint();
    expect(second).toMatchObject({ name: characterName(faction.definitionId, serial(second.id)), skillId: null });
    expect(second.notableId).toBeUndefined();
    expect(getObservation(state, player).characters.find(item => item.id === second.id)!.notable).toBeUndefined();
    const otherRole = NOTABLE_CHARACTERS.find(item => item.factionId !== faction.definitionId && item.definitionId !== figure.definitionId)!.definitionId;
    expect(appoint(otherRole).notableId).toBeUndefined();
    // Dead, the figure does not answer again.
    first.dead = true; first.location = null; first.mission = null; first.woundedTurns = 0; rebuildCharacterIndexes(state);
    expect(appoint().notableId).toBeUndefined();
    expect(Object.values(state.characters).filter(item => item.notableId === figure.id)).toHaveLength(1);
    // The living figure's loss is seen in the sheet as any death is; the record keeps the name.
    expect(getObservation(state, player).characters.find(item => item.id === first.id)).toMatchObject({ status: 'dead', name: figure.name, notable: { id: figure.id } });
  });

  it('is nothing under rules 63, seals a campaign without figures under the rules 63 pack, and refuses to seal one with a figure under older rules', () => {
    const { state, player, faction, figure, appoint } = realm();
    withRules(state, 63, () => { const older = appoint(); expect(older).toMatchObject({ name: characterName(faction.definitionId, serial(older.id)), skillId: null }); expect(older.notableId).toBeUndefined(); });
    expect(() => assertNoNotables(state)).not.toThrow();
    const sealed = serializeGameForVersion(state, 63);
    expect(JSON.parse(sealed)).toMatchObject({ version: 63, contentHash: PRE_NOTABLES_CONTENT_HASH });
    const older = deserializeGame(sealed);
    expect(stateHash(older)).toBe(stateHash(state));
    expect(JSON.parse(serializeGame(older))).toMatchObject({ version: 64, contentHash: CONTENT_HASH });
    // A v63 envelope cannot name a figure.
    const forged = JSON.parse(sealed) as { state: { characters: { notableId?: string }[] } };
    forged.state.characters[0]!.notableId = figure.id;
    expect(() => deserializeGame(JSON.stringify(forged))).toThrow();
    // Appointed under rules 64, the figure rides through an exact save and cannot be sealed under rules 63.
    const first = appoint();
    expect(first.notableId).toBe(figure.id);
    const loaded = deserializeGame(serializeGame(state));
    expect(stateHash(loaded)).toBe(stateHash(state));
    expect(loaded.characters[first.id]).toMatchObject({ name: figure.name, notableId: figure.id, skillId: figure.skillId });
    expect(() => serializeGameForVersion(state, 63)).toThrow('notable characters unavailable in historical rules');
    expect(() => assertNoNotables(state)).toThrow();
    // A figure of another culture, or a second of the same, is an invalid save.
    const stranger = NOTABLE_CHARACTERS.find(item => item.factionId !== faction.definitionId)!;
    state.characters[first.id]!.notableId = stranger.id;
    expect(() => deserializeGame(serializeGame(state))).toThrow('invalid notable character');
    state.characters[first.id]!.notableId = figure.id;
    const twin = appoint(); twin.notableId = figure.id; twin.name = figure.name;
    expect(() => deserializeGame(serializeGame(state))).toThrow('invalid notable character');
    delete twin.notableId; twin.name = characterName(faction.definitionId, serial(twin.id));
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    expect(applyCommand(state, { type: 'endTurn', factionId: player })).toMatchObject({ ok: true });
  });
});
