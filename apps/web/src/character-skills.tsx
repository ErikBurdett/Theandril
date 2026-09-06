import { useId, useState } from 'react';
import type { CharacterView, GameCommand } from '@theandril/sim';
import './character-skills.css';

const branchNames: Record<string, string> = { specialization: 'Specialization', command: 'Command', battlecraft: 'Battlecraft', survey: 'Survey', engineering: 'Engineering' };

/** Prerequisites and purchase eligibility are simulation read models, not a second skill engine. */
export function CharacterSkills({ character, factionId, busy, issue }: { character: CharacterView; factionId: string; busy: boolean; issue: (command: GameCommand) => void }) {
  const id = useId();
  const [selected, setSelected] = useState('specialization');
  const branches = [...new Set(character.promotions.map(option => option.branch))];
  const branch = branches.includes(selected) ? selected : branches[0];
  const name = (skillId: string) => character.promotions.find(option => option.skillId === skillId)?.name ?? skillId;
  const acquired = character.promotions.filter(option => option.acquired);
  if (!branches.length) return null;
  return <section className="character-skills" aria-label="Character skill tree" data-testid="character-skill-tree">
    <h4>Skills & command</h4>
    <p className="field-help"><strong data-testid="available-character-xp">{character.experience} available experience</strong>. Purchases spend earned experience. A specialization is exclusive; later branches can be combined when their prerequisites are met.</p>
    <p className="field-help">Learned: {acquired.length ? acquired.map(option => option.name).join(' · ') : 'No skills yet'}</p>
    <div className="skill-branches" role="tablist" aria-label="Skill branches">{branches.map((key, index) => <button key={key} role="tab" id={`${id}-${key}`} aria-controls={`${id}-panel`} aria-selected={branch === key} tabIndex={branch === key ? 0 : -1} onClick={() => setSelected(key)} onKeyDown={event => {
      const next = event.key === 'ArrowRight' ? (index + 1) % branches.length : event.key === 'ArrowLeft' ? (index + branches.length - 1) % branches.length : event.key === 'Home' ? 0 : event.key === 'End' ? branches.length - 1 : undefined;
      if (next === undefined) return;
      event.preventDefault(); setSelected(branches[next]!); document.getElementById(`${id}-${branches[next]}`)?.focus();
    }}>{branchNames[key] ?? key}<span>{character.promotions.filter(option => option.branch === key && option.acquired).length} learned</span></button>)}</div>
    <div className="skill-branch-panel" role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${branch}`} tabIndex={0}>
      {character.promotions.filter(option => option.branch === branch).sort((a, b) => a.tier - b.tier || a.skillId.localeCompare(b.skillId)).map(option => <article key={option.skillId} className={`character-promotion ${option.acquired ? 'skill-acquired' : ''}`} data-testid={`skill-${option.skillId}`}>
        <small>Tier {option.tier} · {option.acquired ? 'Learned' : option.canPromote ? 'Available' : 'Locked'}</small><strong>{option.name}</strong><p>{option.description}</p>
        {option.requiresAll.length > 0 && <p className="skill-prerequisite">Requires: {option.requiresAll.map(name).join(' and ')}.</p>}
        {option.requiresAny.length > 0 && <p className="skill-prerequisite">Requires either: {option.requiresAny.map(name).join(' or ')}.</p>}
        {option.exclusiveGroup && <p className="skill-prerequisite">Choose one specialization; its alternatives remain unavailable.</p>}
        <p>{option.experienceCost} experience{option.acquired ? ' spent on this skill' : ' to learn'}</p>
        {!option.acquired && option.blocker && <p className="character-blocker">{option.blocker}</p>}
        <button disabled={busy || option.acquired || !option.canPromote} aria-label={`Promote ${option.name}`} onClick={() => issue({ type: 'promoteCharacter', factionId, characterId: character.id, skillId: option.skillId })}>{option.acquired ? 'Learned' : option.exclusiveGroup ? 'Choose specialization' : 'Learn skill'}</button>
      </article>)}
    </div>
  </section>;
}
