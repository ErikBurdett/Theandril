import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { CharacterView, GameCommand } from '@theandril/sim';
import './character-skills.css';

const branchNames: Record<string, string> = { specialization: 'Specialization', command: 'Command', battlecraft: 'Battlecraft', survey: 'Survey', engineering: 'Engineering' };
type Skill = CharacterView['promotions'][number];

/** Labels describe the observed choices; only canPromote authorizes a purchase. */
export function skillStatus(option: Skill, options: readonly Skill[]): 'Learned' | 'Available' | 'Excluded' | 'Locked' {
  if (option.acquired) return 'Learned';
  if (option.exclusiveGroup && options.some(other => other.acquired && other.exclusiveGroup === option.exclusiveGroup)) return 'Excluded';
  return option.canPromote ? 'Available' : 'Locked';
}

/** Prerequisites and purchase eligibility are simulation read models, not a second skill engine. */
export function CharacterSkills({ character, factionId, busy, issue }: { character: CharacterView; factionId: string; busy: boolean; issue: (command: GameCommand) => void }) {
  const id = useId();
  const [selected, setSelected] = useState('specialization');
  const [inspection, setInspection] = useState<string | null>(null);
  const focusRequest = useRef<string | null>(null);
  const cards = useRef(new Map<string, HTMLElement>());
  const branches = [...new Set(character.promotions.map(option => option.branch))];
  const branch = branches.includes(selected) ? selected : branches[0];
  const name = (skillId: string) => character.promotions.find(option => option.skillId === skillId)?.name ?? skillId;
  const acquired = character.promotions.filter(option => option.acquired);
  const inspect = (skillId: string) => {
    const option = character.promotions.find(item => item.skillId === skillId);
    if (!option) return;
    focusRequest.current = skillId;
    setSelected(option.branch);
    setInspection(skillId);
    // A repeated click on the same inspected node needs no state transition.
    cards.current.get(skillId)?.focus();
  };
  useLayoutEffect(() => {
    if (!focusRequest.current) return;
    cards.current.get(focusRequest.current)?.focus();
    focusRequest.current = null;
  }, [branch, inspection]);
  const requirement = (skillId: string) => {
    const required = character.promotions.find(item => item.skillId === skillId);
    return <button type="button" className="skill-dependency" key={skillId} aria-label={`View prerequisite ${name(skillId)}`} onClick={() => inspect(skillId)}>{name(skillId)} <span>· {required ? skillStatus(required, character.promotions) === 'Learned' ? 'learned' : skillStatus(required, character.promotions) === 'Excluded' ? 'excluded' : 'not learned' : 'not available in this role'}</span></button>;
  };
  if (!branches.length) return null;
  return <section className="character-skills" aria-label="Character skill tree" data-testid="character-skill-tree">
    <h4>Skills & command</h4>
    <p className="field-help"><strong data-testid="available-character-xp">{character.experience} available experience</strong>. Purchases spend earned experience. A specialization is exclusive; later branches can be combined when their prerequisites are met.</p>
    <p className="field-help">Learned: {acquired.length ? acquired.map(option => option.name).join(' · ') : 'No skills yet'}</p>
    <nav className="skill-roadmap" aria-label="Skill roadmap">
      <p>Trace a branch, then inspect its cost and effects. Linked prerequisites can be inspected without spending experience.</p>
      {branches.map(key => <section key={key} aria-label={`${branchNames[key] ?? key} roadmap`}><h5>{branchNames[key] ?? key}</h5><ol>{character.promotions.filter(option => option.branch === key).sort((a, b) => a.tier - b.tier || a.skillId.localeCompare(b.skillId)).map(option => <li key={option.skillId} data-tier={option.tier}><button type="button" data-state={skillStatus(option, character.promotions).toLowerCase()} aria-label={`Inspect skill ${option.name}`} onClick={() => inspect(option.skillId)}><span>{option.requiresAll.length || option.requiresAny.length ? '↳ ' : ''}{option.name}</span><small>Tier {option.tier} · {skillStatus(option, character.promotions)}</small></button></li>)}</ol></section>)}
    </nav>
    <div className="skill-branches" role="tablist" aria-label="Skill branches">{branches.map((key, index) => <button key={key} role="tab" id={`${id}-${key}`} aria-controls={`${id}-panel`} aria-selected={branch === key} tabIndex={branch === key ? 0 : -1} onClick={() => setSelected(key)} onKeyDown={event => {
      const next = event.key === 'ArrowRight' ? (index + 1) % branches.length : event.key === 'ArrowLeft' ? (index + branches.length - 1) % branches.length : event.key === 'Home' ? 0 : event.key === 'End' ? branches.length - 1 : undefined;
      if (next === undefined) return;
      event.preventDefault(); setSelected(branches[next]!); document.getElementById(`${id}-${branches[next]}`)?.focus();
    }}>{branchNames[key] ?? key}<span>{character.promotions.filter(option => option.branch === key && option.acquired).length} learned</span></button>)}</div>
    <div className="skill-branch-panel" role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${branch}`} tabIndex={0}>
      {character.promotions.filter(option => option.branch === branch).sort((a, b) => a.tier - b.tier || a.skillId.localeCompare(b.skillId)).map(option => <article key={option.skillId} ref={element => { if (element) cards.current.set(option.skillId, element); else cards.current.delete(option.skillId); }} tabIndex={-1} aria-label={`${option.name} skill`} className={`character-promotion ${option.acquired ? 'skill-acquired' : ''}`} data-state={skillStatus(option, character.promotions).toLowerCase()} data-testid={`skill-${option.skillId}`}>
        <small>Tier {option.tier} · {skillStatus(option, character.promotions)}</small><strong>{option.name}</strong><p>{option.description}</p>
        {option.requiresAll.length > 0 && <p className="skill-prerequisite">Requires: {option.requiresAll.map(name).join(' and ')}.</p>}
        {option.requiresAny.length > 0 && <p className="skill-prerequisite">Requires either: {option.requiresAny.map(name).join(' or ')}.</p>}
        {(option.requiresAll.length > 0 || option.requiresAny.length > 0) && <div className="skill-dependencies" aria-label={`Prerequisite status for ${option.name}`}>{[...option.requiresAll, ...option.requiresAny].map(requirement)}</div>}
        {!option.requiresAll.length && !option.requiresAny.length && <p className="skill-prerequisite">Root skill · no learned prerequisite.</p>}
        {option.exclusiveGroup && <p className="skill-prerequisite">{skillStatus(option, character.promotions) === 'Excluded' ? `Permanently excluded by ${character.promotions.find(other => other.acquired && other.exclusiveGroup === option.exclusiveGroup)!.name}.` : `Permanent specialization${character.promotions.some(other => other.skillId !== option.skillId && other.exclusiveGroup === option.exclusiveGroup) ? ` · excludes ${character.promotions.filter(other => other.skillId !== option.skillId && other.exclusiveGroup === option.exclusiveGroup).map(other => other.name).join(' and ')}` : ''}.`}</p>}
        <p>{option.experienceCost} experience{option.acquired ? ' spent on this skill' : ' to learn'}</p>
        {!option.acquired && option.blocker && <p className="character-blocker" id={`${id}-${option.skillId}-blocker`}>{option.blocker}</p>}
        <button disabled={busy || option.acquired || !option.canPromote} aria-describedby={!option.acquired && option.blocker ? `${id}-${option.skillId}-blocker` : undefined} aria-label={`Promote ${option.name}`} onClick={() => { cards.current.get(option.skillId)?.focus(); issue({ type: 'promoteCharacter', factionId, characterId: character.id, skillId: option.skillId }); }}>{option.acquired ? 'Learned' : option.exclusiveGroup ? 'Choose specialization' : 'Learn skill'}</button>
      </article>)}
    </div>
  </section>;
}
