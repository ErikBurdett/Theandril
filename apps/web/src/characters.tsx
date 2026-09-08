import { useEffect, useRef, useState } from 'react';
import { CHARACTER_DEFINITIONS, CHARACTER_MISSIONS, CHARACTER_SKILLS } from '@theandril/content';
import type { CharacterView, GameCommand, Observation } from '@theandril/sim';
import { FactionArt } from './faction-art';
import { CharacterSkills } from './character-skills';
import { PersonalMagic } from './magic';
import './characters.css';

type Issue = (command: GameCommand) => void;
const PAGE_SIZE = 25;
const roles = { marshal: 'Marshal', surveyor: 'Surveyor', engineer: 'Engineer', waykeeper: 'Waykeeper' };
const definitionName = (id: string) => CHARACTER_DEFINITIONS.find(item => item.id === id)?.name ?? id;
const skillName = (id: string) => CHARACTER_SKILLS.find(item => item.id === id)?.name ?? id;
function locationName(character: CharacterView, view: Observation): string {
  const location = character.location;
  if (!location) return character.dead ? 'Memorial record' : 'No assigned location';
  return location.kind === 'army' ? view.armies.find(army => army.id === location.armyId)?.name ?? location.armyId
    : view.settlements.find(town => town.id === location.settlementId)?.name ?? location.settlementId;
}

export function ArmyCharacters({ army, open }: { army: Observation['armies'][number]; open: (characterId?: string) => void }) {
  return <section className="army-characters" aria-label="Army commander and agents">
    <p>Commander: {army.commander ? `${army.commander.name} · ${army.commander.status}` : 'No marshal assigned'}</p>
    <p data-testid="army-command-capacity">Command: {army.formations.length} / {army.formationCapacity} formations. {army.capacityReason}</p>
    {army.commandBlocker && <p className="character-blocker army-command-warning" role="status">{army.commandBlocker} Use Army composition to detach or transfer surplus formations.</p>}
    <p>Agents: {army.agents.length ? army.agents.map(agent => `${agent.name} (${agent.status})`).join('; ') : 'None attached'}</p>
    {army.movementBlocker && <p className="character-blocker">{army.movementBlocker}</p>}
    <button aria-label={`Manage characters for ${army.name}`} onClick={() => open(army.commander?.id ?? army.agents[0]?.id)}>Manage army characters</button>
  </section>;
}

export function CharacterAppointments({ view, settlementId, busy, issue, open }: { view: Observation; settlementId: string; busy: boolean; issue: Issue; open: () => void }) {
  const choices = view.characterRecruitment.filter(choice => choice.settlementId === settlementId);
  return <details className="character-appointments" data-testid="character-appointments">
    <summary>Appoint characters & officers</summary>
    <p className="field-help">Appoint a named specialist here, then attach them to an army at this hex. A commander and agents are people with their own assignments, not unit formations.</p>
    <div className="build-options">{choices.map(choice => <button key={choice.definitionId} disabled={busy || !choice.canRecruit} aria-label={`Appoint ${choice.name}`} aria-describedby={choice.blocker ? `appointment-${settlementId}-${choice.definitionId}` : undefined} onClick={() => issue({ type: 'recruitCharacter', factionId: view.factionId, settlementId, definitionId: choice.definitionId })}>
      <span className="faction-art-card"><FactionArt contentId={choice.definitionId} definitionId={view.factions.find(faction => faction.id === view.factionId)?.definitionId} label={choice.name} decorative/><span>
        <strong>{choice.name}</strong><small>{roles[choice.role]} · {choice.coinCost} coin · {choice.upkeep} upkeep</small>
        <small>{CHARACTER_DEFINITIONS.find(item => item.id === choice.definitionId)?.description}</small>
        {choice.blocker && <small id={`appointment-${settlementId}-${choice.definitionId}`}>{choice.blocker}</small>}
      </span></span>
    </button>)}</div>
    <button className="wide" onClick={open}>Open character roster</button>
  </details>;
}

export function CharacterRegistry({ view, busy, working, initialCharacterId, initialArmyId, feedback, error, issue, locate, close }: {
  view: Observation; busy: boolean; working: boolean; initialCharacterId?: string; initialArmyId?: string; feedback: string; error: boolean; issue: Issue;
  locate: (character: CharacterView) => void; close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [role, setRole] = useState('all');
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState(initialCharacterId ?? '');
  useEffect(() => {
    const element = dialog.current; const previous = document.activeElement;
    element?.showModal();
    return () => { element?.close(); if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, []);
  const needle = search.trim().toLowerCase();
  const filtered = view.characters.filter(character => (status === 'all' || character.status === status) && (role === 'all' || character.role === role)
    && `${character.name} ${character.id} ${roles[character.role]} ${locationName(character, view)}`.toLowerCase().includes(needle));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages - 1);
  const character = filtered.find(item => item.id === selectedId) ?? filtered[0];
  const locked = busy || Boolean(view.battle || view.pendingCapture || view.victory);
  return <dialog className="progression-dialog character-dialog" ref={dialog} aria-labelledby="character-title" onCancel={event => { event.preventDefault(); close(); }}>
    <div className="chronicles-header"><div><span className="eyebrow">Those who carry the oath</span><h2 id="character-title">Characters & agents</h2></div><button onClick={close} aria-label="Close characters">Close ×</button></div>
    <div className="character-tools">
      <label>Search characters<input type="search" value={search} placeholder="Name, role or assigned location" onChange={event => { setSearch(event.target.value); setPage(0); }}/></label>
      <label>Character status<select value={status} onChange={event => { setStatus(event.target.value); setPage(0); }}><option value="all">All statuses</option><option value="ready">Ready</option><option value="mission">On mission</option><option value="wounded">Wounded</option><option value="dead">Memorials</option></select></label>
      <label>Character role<select value={role} onChange={event => { setRole(event.target.value); setPage(0); }}><option value="all">All roles</option>{Object.entries(roles).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
    </div>
    <div className="character-layout">
      <div className="character-directory"><nav className="character-list" aria-label="Character roster" data-testid="character-roster">
        {filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE).map(item => <button className="character-row" key={item.id} aria-pressed={character?.id === item.id} aria-label={`Inspect ${item.name} (${item.id})`} onClick={() => setSelectedId(item.id)}><FactionArt contentId={item.definitionId} definitionId={view.factions.find(faction => faction.id === item.factionId)?.definitionId} label={`${item.name}, ${roles[item.role]}`} compact decorative/><strong>{item.name}</strong><small>{roles[item.role]} · {item.status} · rank {item.rank}{item.mission ? ` · ${item.mission.remainingTurns} turns left` : ''}</small><small>{locationName(item, view)}</small></button>)}
        {!filtered.length && <p className="field-help">{view.characters.length ? 'No characters match these filters.' : 'Appoint a marshal or specialist at one of your safe settlements.'}</p>}
      </nav><div className="character-pagination"><button aria-label="Previous characters" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous</button><span aria-live="polite">{filtered.length} records · {currentPage + 1} / {pages}</span><button aria-label="Next characters" disabled={currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)}>Next</button></div></div>
      {character ? <CharacterSheet key={character.id} character={character} view={view} busy={locked} initialArmyId={initialArmyId} issue={issue} locate={locate}/>
        : <div className="character-sheet"><h3>The company of the realm</h3><p className="field-help">Characters have names, assignments and persistent experience. They accompany existing armies; they do not create independent map units.</p></div>}
    </div>
    <p className={error ? 'character-blocker' : 'field-help'} role={error ? 'alert' : 'status'} aria-live="polite" data-testid="character-feedback">{working ? 'Resolving character orders…' : feedback}</p>
  </dialog>;
}

function CharacterSheet({ character, view, busy, initialArmyId, issue, locate }: { character: CharacterView; view: Observation; busy: boolean; initialArmyId?: string; issue: Issue; locate: (character: CharacterView) => void }) {
  const [armyId, setArmyId] = useState(initialArmyId ?? '');
  const [settlementId, setSettlementId] = useState('');
  const [missionKey, setMissionKey] = useState('');
  const assignment = character.assignmentOptions.find(option => option.armyId === armyId) ?? character.assignmentOptions[0];
  const unassignment = character.unassignmentOptions.find(option => option.settlementId === settlementId) ?? character.unassignmentOptions[0];
  const missionId = (option: CharacterView['missions'][number]) => `${option.missionId}:${option.targetCell ?? ''}:${option.settlementId ?? ''}`;
  const mission = character.missions.find(option => missionId(option) === missionKey) ?? character.missions[0];
  return <section className="character-sheet" aria-label="Selected character" data-testid="character-sheet">
    <div className="character-identity"><div className="faction-art-heading"><FactionArt contentId={character.definitionId} definitionId={view.factions.find(faction => faction.id === character.factionId)?.definitionId} label={`${character.name}, ${definitionName(character.definitionId)}`}/><div><h3>{character.name}</h3><p className="field-help">{definitionName(character.definitionId)} · {character.id}<br/>{locationName(character, view)}{character.cell === null ? '' : ` · hex ${character.cell}`}</p></div></div><button disabled={character.cell === null} onClick={() => locate(character)}>Locate character</button></div>
    <dl className="character-values"><div><dt>Condition</dt><dd>{character.status}{character.woundedTurns ? ` · ${character.woundedTurns} turns` : ''}</dd></div><div><dt>Available experience</dt><dd>{character.experience} · rank {character.rank}</dd></div><div><dt>Specialization</dt><dd>{character.skillId ? skillName(character.skillId) : 'Not chosen'}</dd></div></dl>
    {character.dead && <p className="character-blocker">This character has died. Their record remains; no further appointments, missions or promotions are possible.</p>}
    <PersonalMagic character={character}/>
    {character.mission && <ActiveMission character={character} busy={busy} factionId={view.factionId} issue={issue}/>}
    <CharacterSkills character={character} factionId={view.factionId} busy={busy || character.dead} issue={issue}/>
    {!character.dead && <>
      <h4>Army attachment</h4><p className="field-help">Appointments and transfers normally require the same hex. Officers can board an adjacent owned fleet from a harbor when the listed permission allows it, spending fleet movement. An army or fleet has one marshal and up to two agents. Review the destination and any restriction before changing an assignment.</p>
      <div className="character-actions">
        <div className="character-action"><label>Assign to army<select value={assignment?.armyId ?? ''} disabled={busy || !character.assignmentOptions.length} onChange={event => setArmyId(event.target.value)}>{character.assignmentOptions.length ? character.assignmentOptions.map(option => <option key={option.armyId} value={option.armyId}>{option.label} · {option.armyId}</option>) : <option value="">No co-located army</option>}</select></label>{assignment?.blocker && <p className="character-blocker" id={`assignment-blocker-${character.id}`}>{assignment.blocker}</p>}<button aria-describedby={assignment?.blocker ? `assignment-blocker-${character.id}` : undefined} disabled={busy || !assignment?.canAssign} onClick={() => { if (assignment) issue({ type: 'assignCharacter', factionId: view.factionId, characterId: character.id, armyId: assignment.armyId }); }}>Assign character</button></div>
        <div className="character-action"><label>Return to settlement<select value={unassignment?.settlementId ?? ''} disabled={busy || !character.unassignmentOptions.length} onChange={event => setSettlementId(event.target.value)}>{character.unassignmentOptions.length ? character.unassignmentOptions.map(option => <option key={option.settlementId} value={option.settlementId}>{option.label}</option>) : <option value="">No co-located settlement</option>}</select></label>{unassignment?.blocker && <p className="character-blocker">{unassignment.blocker}</p>}<button disabled={busy || !unassignment?.canUnassign} onClick={() => { if (unassignment) issue({ type: 'unassignCharacter', factionId: view.factionId, characterId: character.id, settlementId: unassignment.settlementId }); }}>Return character</button></div>
      </div>
      {character.missions.length > 0 && <><h4>Field missions</h4><div className="character-action"><label>Choose mission<select value={mission ? missionId(mission) : ''} disabled={busy} onChange={event => setMissionKey(event.target.value)}>{character.missions.map(option => <option value={missionId(option)} key={missionId(option)}>{option.name}{option.settlementId ? ` · ${view.settlements.find(town => town.id === option.settlementId)?.name ?? option.settlementId}` : ''}</option>)}</select></label></div>{mission && <article className="character-mission" data-testid="mission-preview"><h4>{mission.name}</h4><p>{mission.description}</p><p>{mission.duration} turns · {mission.coinCost} coin · {mission.risk} risk</p><p>{mission.riskText}</p><p>{mission.effectText}</p><p>The army holds position while this work proceeds. Cancellation or interruption does not refund its cost.</p>{mission.blocker && <p className="character-blocker">{mission.blocker}</p>}<button className="primary wide" disabled={busy || !mission.canStart} aria-label={`Start ${mission.name}`} onClick={() => issue({ type: 'startCharacterMission', factionId: view.factionId, characterId: character.id, missionId: mission.missionId, ...(mission.targetCell !== undefined ? { targetCell: mission.targetCell } : {}), ...(mission.settlementId !== undefined ? { settlementId: mission.settlementId } : {}) })}>Start mission</button></article>}</>}
    </>}
  </section>;
}

function ActiveMission({ character, busy, factionId, issue }: { character: CharacterView; busy: boolean; factionId: string; issue: Issue }) {
  const mission = character.mission;
  if (!mission) return null;
  const definition = CHARACTER_MISSIONS.find(item => item.id === mission.definitionId);
  return <section className="character-mission" data-testid="active-character-mission"><h4>{definition?.name ?? mission.definitionId}</h4><p>{mission.remainingTurns} stationary {mission.remainingTurns === 1 ? 'turn' : 'turns'} remaining · anchored at hex {mission.anchorCell}</p>{definition && <progress aria-label="Mission progress" max={definition.duration} value={definition.duration - mission.remainingTurns}/>}<p>The attached army is holding position. Cancel the mission before changing its movement or composition.</p><button className="danger" disabled={busy} onClick={() => issue({ type: 'cancelCharacterMission', factionId, characterId: character.id })}>Cancel mission</button><p>Cancellation stops the work without refunding spent coin or restoring spent movement.</p></section>;
}

export function CommanderBattleControls({ view, busy, issue, controls = true }: { view: Observation; busy: boolean; issue: Issue; controls?: boolean }) {
  const battle = view.battle;
  if (!battle?.characterSnapshots.length) return null;
  const commanders = battle.characterSnapshots.filter(character => CHARACTER_DEFINITIONS.find(definition => definition.id === character.definitionId)?.role === 'marshal');
  if (!commanders.length) return null;
  return <section className="commander-battle" aria-label="Commanders on the field" data-testid="commander-battle"><h3>Commanders on the field</h3>{commanders.map(commander => {
    const ability = view.commanderAbilities.find(option => option.characterId === commander.characterId && option.abilityId === 'ability.rally');
    return <article key={commander.characterId}><p><strong>{commander.name}</strong> · {commander.factionId === view.factionId ? 'Your commander' : 'Opposing commander'} · {commander.armyId}</p><p>Battle leadership: +{commander.leadership.attack} attack · +{commander.leadership.armor} armor.{commander.woundedTurns ? ' Wounds suppress this commander’s contribution.' : ''}</p>{ability && <><p>{ability.effectText}</p>{ability.blocker && <p className="character-blocker">{ability.blocker}</p>}{controls && <button className="primary" disabled={busy || !ability.canUse} aria-label={`Rally the line (${commander.characterId})`} onClick={() => issue({ type: 'useCommanderAbility', factionId: view.factionId, characterId: commander.characterId, abilityId: 'ability.rally' })}>{ability.used ? 'Rally already used' : 'Rally the line'}</button>}</>}</article>;
  })}<p>These values were committed when the battle began. Autoresolve uses the same commander effects and Rally rules.</p></section>;
}
