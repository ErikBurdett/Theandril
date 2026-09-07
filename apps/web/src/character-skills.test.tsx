import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CHARACTER_DEFINITIONS, CHARACTER_SKILLS } from '@theandril/content';
import { applyCommand, getObservation, stateHash } from '@theandril/sim';
import { characterCampaign, CHARACTER_FIXTURE } from '../../../packages/test-fixtures/src/character-fixture';
import { CharacterSkills, skillStatus } from './character-skills';

function appointed(definitionId = 'character.marshal', experience = 72) {
  const game = characterCampaign();
  expect(applyCommand(game, { type: 'recruitCharacter', factionId: game.turnOwnerId, settlementId: CHARACTER_FIXTURE.homeId, definitionId }).ok).toBe(true);
  const character = Object.values(game.characters)[0]!;
  character.experience = experience; // Explicit earned-XP scenario, not a browser mutation.
  return { game, character };
}
const markup = (game: ReturnType<typeof characterCampaign>) => renderToStaticMarkup(createElement(CharacterSkills, {
  character: getObservation(game, game.turnOwnerId).characters[0]!, factionId: game.turnOwnerId, busy: false, issue: () => { throw new Error('Rendering issued a command.'); },
}));

describe('real character skill trees', () => {
  it('covers exactly the eleven shipped skills through their three compatible roles', () => {
    const shown = new Set<string>();
    for (const definition of CHARACTER_DEFINITIONS) {
      const { game } = appointed(definition.id), before = stateHash(game), html = markup(game);
      for (const skill of CHARACTER_SKILLS) {
        if (definition.skillIds.includes(skill.id)) { expect(html).toContain(`aria-label="Inspect skill ${skill.name}"`); shown.add(skill.id); }
        else expect(html).not.toContain(`aria-label="Inspect skill ${skill.name}"`);
      }
      expect(html.match(/aria-label="Inspect skill /g)).toHaveLength(definition.skillIds.length);
      expect(html).toContain('Root skill · no learned prerequisite.');
      expect(stateHash(game)).toBe(before);
    }
    expect([...shown].sort()).toEqual(CHARACTER_SKILLS.map(skill => skill.id).sort());
    expect(shown.size).toBe(11);
  });
  it('distinguishes actual prerequisite locks, permanent exclusions and learned nodes', () => {
    const { game, character } = appointed();
    let options = getObservation(game, game.turnOwnerId).characters[0]!.promotions;
    expect(skillStatus(options.find(item => item.skillId === 'skill.field_orders')!, options)).toBe('Locked');
    expect(skillStatus(options.find(item => item.skillId === 'skill.decisive')!, options)).toBe('Available');
    expect(applyCommand(game, { type: 'promoteCharacter', factionId: game.turnOwnerId, characterId: character.id, skillId: 'skill.decisive' }).ok).toBe(true);
    options = getObservation(game, game.turnOwnerId).characters[0]!.promotions;
    expect(skillStatus(options.find(item => item.skillId === 'skill.decisive')!, options)).toBe('Learned');
    expect(skillStatus(options.find(item => item.skillId === 'skill.steadfast')!, options)).toBe('Excluded');
    expect(skillStatus(options.find(item => item.skillId === 'skill.muster_rolls')!, options)).toBe('Available');
    expect(skillStatus(options.find(item => item.skillId === 'skill.unbroken_line')!, options)).toBe('Locked');
    const html = markup(game);
    expect(html).toContain('60 available experience');
    expect(html).toContain('Permanently excluded by Decisive orders.');
    expect(html).toContain('12 experience spent on this skill');
    expect(html).toMatch(/<button disabled=""[^>]*aria-label="Promote Keeper of the line"/);
  });
  it('never enables wounds, death or insufficient experience by deriving its own rule', () => {
    for (const condition of ['wounded', 'dead', 'unfunded'] as const) {
      const { game, character } = appointed('character.engineer', condition === 'unfunded' ? 0 : 30);
      if (condition === 'wounded') character.woundedTurns = 2;
      if (condition === 'dead') { character.dead = true; character.location = null; }
      const view = getObservation(game, game.turnOwnerId).characters[0]!;
      expect(view.promotions.every(option => !option.canPromote)).toBe(true);
      for (const option of view.promotions) expect(skillStatus(option, view.promotions)).toBe('Locked');
      expect(markup(game)).toMatch(/<button disabled=""[^>]*aria-label="Promote Patient fieldcraft"/);
    }
  });
});
