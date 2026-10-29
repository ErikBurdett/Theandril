import { useEffect, useRef, useState } from 'react';
import type { GameCommand, Observation } from '@theandril/sim';
import { ATTUNEMENT_VICTORY, UNIFICATION_VICTORY } from '@theandril/content';
import { ArcaneResearch, ArcaneSeams } from './magic';
import { QueriedDevelopmentPanel } from './development-panel';
import { ResourcePanel } from './resource-panel';
import type { DevelopmentQuery } from './use-development-query';
import './progression.css';

type ProgressionTab = 'technology' | 'arcane' | 'institutions' | 'doctrine' | 'prosperity' | 'development' | 'resources';
const tabs: { id: ProgressionTab; label: string }[] = [
  { id: 'technology', label: 'Technology' }, { id: 'arcane', label: 'Arcane Theory' }, { id: 'institutions', label: 'Institutions' },
  { id: 'doctrine', label: 'Military doctrine' }, { id: 'development', label: 'Development' }, { id: 'resources', label: 'Resources' }, { id: 'prosperity', label: 'Victory' },
];
type TechnologyChoice = Observation['progression']['technologyChoices'][number];
const branchNames: Record<string, string> = { craft: 'Craft & construction', stewardship: 'Land stewardship', navigation: 'Navigation', civic: 'Civic knowledge' };

/** Layout depth only: canonical available/blocker values remain the purchase authority. */
export function researchDepths(choices: readonly Pick<TechnologyChoice, 'id' | 'requires'>[]): Map<string, number> {
  const byId = new Map(choices.map(choice => [choice.id, choice]));
  const depths = new Map<string, number>();
  const visit = (id: string, ancestors: ReadonlySet<string>): number => {
    const known = depths.get(id);
    if (known !== undefined) return known;
    if (ancestors.has(id)) return 0; // Defensive display fallback, never a legality decision.
    const parents = byId.get(id)?.requires.filter(required => byId.has(required)) ?? [];
    const next = new Set(ancestors); next.add(id);
    const depth = parents.length ? 1 + Math.max(...parents.map(required => visit(required, next))) : 0;
    depths.set(id, depth); return depth;
  };
  choices.forEach(choice => visit(choice.id, new Set()));
  return depths;
}

export function ResearchTree({ view, blocked, issue }: { view: Observation; blocked: boolean; issue: (command: GameCommand) => void }) {
  const choices = view.progression.technologyChoices;
  const depths = researchDepths(choices);
  const branches = [...new Set(choices.map(choice => choice.branch))];
  const cards = useRef(new Map<string, HTMLElement>());
  const researched = new Set(view.progression.technologies);
  const inspect = (id: string) => cards.current.get(id)?.focus();
  return <section aria-label="Research tree" data-testid="research-tree">
    <p className="research-key">◆ Researched · ◇ Available · ⊘ Locked. Follow the prerequisite links to plan a route; inspection never spends knowledge.</p>
    <nav aria-label="Research branches" className="research-branch-links">{branches.map(branch => <button type="button" key={branch} onClick={() => { const first = choices.find(choice => choice.branch === branch); if (first) inspect(first.id); }}>{branchNames[branch] ?? branch}</button>)}</nav>
    <div className="research-lanes">{branches.map(branch => <section className="research-lane" key={branch} aria-label={`${branchNames[branch] ?? branch} research`}>
      <h3>{branchNames[branch] ?? branch}</h3>
      <ol>{choices.filter(choice => choice.branch === branch).sort((a, b) => depths.get(a.id)! - depths.get(b.id)! || a.id.localeCompare(b.id)).map(choice => {
        const learned = researched.has(choice.id);
        const status = learned ? 'Researched' : choice.available ? 'Available' : 'Locked';
        return <li key={choice.id} data-depth={depths.get(choice.id)}><article className="progression-choice research-node" data-testid={`progression-${choice.id}`} data-state={status.toLowerCase()} tabIndex={-1} aria-label={`${choice.name} discovery`} ref={element => { if (element) cards.current.set(choice.id, element); else cards.current.delete(choice.id); }}>
          <span className="research-node-status">{learned ? '◆' : choice.available ? '◇' : '⊘'} {status} · {choice.requires.length ? `Stage ${depths.get(choice.id)! + 1}` : 'Root discovery'}</span>
          <h4>{choice.name}</h4><p>{choice.description}</p>
          {choice.requires.length ? <div className="research-prerequisites"><span>Requires all:</span>{choice.requires.map(requiredId => {
            const required = choices.find(item => item.id === requiredId);
            return required ? <button type="button" key={requiredId} aria-label={`View prerequisite ${required.name}`} onClick={() => inspect(requiredId)}>{required.name} · {researched.has(requiredId) ? 'researched' : 'not researched'}</button> : <span key={requiredId}>{requiredId} · not present in this campaign</span>;
          })}</div> : <p className="research-root">No discovery prerequisite.</p>}
          <span className="progression-cost">{choice.knowledgeCost} knowledge{learned ? ' · completed' : ''}</span>
          {choice.blocker && <p className="progression-blocker" id={`blocker-${choice.id}`}>{choice.blocker}</p>}
          <button className="primary wide" disabled={blocked || !choice.available} aria-describedby={choice.blocker ? `blocker-${choice.id}` : undefined} aria-label={`Research ${choice.name}`} onClick={() => { inspect(choice.id); issue({ type: 'research', factionId: view.factionId, technologyId: choice.id }); }}>Research discovery</button>
        </article></li>;
      })}</ol>
    </section>)}</div>
  </section>;
}

function UnificationStatus({ unification }: { unification: NonNullable<Observation['progression']['unification']> }) {
  return <section className="project-introduction" data-testid="unification-status" aria-label={unification.name}><span className="eyebrow">A second path to victory</span><h3>{unification.name}</h3><p>{unification.description}</p>
    <p>You hold {unification.held} of {unification.total} hearths{unification.pledged > 0 ? ` (${unification.own} your own and ${unification.pledged} pledged by your clients)` : ''}. More than two thirds, and at least {unification.minimum}, opens a public bid at your capital; hold it for {unification.requiredTurns} turns.</p>
    {unification.blockers.length > 0 ? <ul>{unification.blockers.map(blocker => <li key={blocker}>{blocker}</li>)}</ul> : <p>Your realm qualifies. A public bid opens at your capital when the round ends.</p>}
    <p className="field-help">Pledged hearths stand behind a bid only while the oath holds: a client that renounces, lapses or completes its term withdraws them, and a bid that falls below two thirds ends at the round’s close. A bid can be lost to politics as well as to arms.</p>
  </section>;
}

/** Rules 38: the sealed working rests on things rivals can take, and the
 * section names each one — seams, theory, host and caster — so a player sees
 * what is still missing before any knowledge is committed. */
export function AttunementStatus({ view, attunement, blocked, issue }: { view: Observation; attunement: NonNullable<Observation['progression']['attunement']>; blocked: boolean; issue: (command: GameCommand) => void }) {
  const [host, setHost] = useState('');
  const [caster, setCaster] = useState('');
  const selectedHost = attunement.eligibleSettlementIds.includes(host) ? host : attunement.eligibleSettlementIds[0] ?? '';
  const casters = attunement.casters.filter(item => item.qualified && item.settlementId === selectedHost);
  const selectedCaster = casters.some(item => item.characterId === caster) ? caster : casters[0]?.characterId ?? '';
  const nameOf = (id: string) => view.settlements.find(town => town.id === id)?.name ?? id;
  return <section className="project-introduction" data-testid="attunement-status" aria-label={attunement.name}><span className="eyebrow">A third path to victory</span><h3>{attunement.name}</h3><p>{attunement.description}</p>
    <p>{attunement.knowledgeCost} knowledge committed on starting · {attunement.requiredTurns} active turns required.</p>
    <ul data-testid="attunement-requirements">
      <li>Arcane Theory: {attunement.discoveries.researched} of {attunement.discoveries.total} discoveries researched.</li>
      {attunement.paths.map(path => <li key={path.pathId}>{path.pathName} seam: {path.held ? 'held inside your borders' : 'not held'}.</li>)}
      <li>Host hearths with a Witness archive: {attunement.hostSettlementIds.length ? attunement.hostSettlementIds.map(nameOf).join(', ') : 'none free of siege and occupation'}.</li>
      <li>Waykeepers: {attunement.casters.length ? attunement.casters.map(item => `${item.name} (degree ${item.degree}${item.settlementId ? `, at ${nameOf(item.settlementId)}` : ''}) — ${item.qualified ? 'ready to seal the working.' : item.blocker}`).join(' ') : 'none appointed.'}</li>
    </ul>
    {attunement.blockers.length > 0 && <section className="project-blockers" aria-label="Attunement requirements"><h4>Before the working can be sealed</h4><ul>{attunement.blockers.map(blocker => <li key={blocker}>{blocker}</li>)}</ul></section>}
    <form className="project-start" onSubmit={event => { event.preventDefault(); if (selectedHost && selectedCaster) issue({ type: 'startAttunement', factionId: view.factionId, settlementId: selectedHost, characterId: selectedCaster }); }}>
      <label>Working host<select value={selectedHost} disabled={blocked || !attunement.eligibleSettlementIds.length} onChange={event => setHost(event.target.value)}>{!attunement.eligibleSettlementIds.length && <option value="">No eligible hearth</option>}{attunement.eligibleSettlementIds.map(id => <option value={id} key={id}>{nameOf(id)}</option>)}</select></label>
      <label>Sealing caster<select value={selectedCaster} disabled={blocked || !casters.length} onChange={event => setCaster(event.target.value)}>{!casters.length && <option value="">No qualified Waykeeper at the host</option>}{casters.map(item => <option value={item.characterId} key={item.characterId}>{item.name} · degree {item.degree}</option>)}</select></label>
      <button className="primary" disabled={blocked || attunement.blockers.length > 0 || !selectedHost || !selectedCaster} type="submit">Seal the {attunement.name}</button>
    </form>
  </section>;
}

const projectName = (projectId: string): string => projectId === UNIFICATION_VICTORY.id ? UNIFICATION_VICTORY.name : projectId === ATTUNEMENT_VICTORY.id ? ATTUNEMENT_VICTORY.name : 'Prosperity';
const projectTestId = (project: Observation['projects'][number]): string => `${project.projectId === UNIFICATION_VICTORY.id ? 'unification' : project.projectId === ATTUNEMENT_VICTORY.id ? 'attunement' : 'project'}-${project.factionId}`;

export function PublicProjects({ view, locate }: { view: Observation; locate: (cell: number) => void }) {
  if (!view.projects.length) return null;
  return <section className="public-projects" data-testid="public-projects" aria-label="Public victory projects"><h3>The race for victory</h3>{view.projects.map(project => <article key={project.id} className="public-project" data-testid={projectTestId(project)}>
    <strong>{view.factions.find(faction => faction.id === project.factionId)?.name ?? project.factionId} · {projectName(project.projectId)}</strong><span>{project.settlementName} · hex {project.cell}</span>
    <label>{project.status} · {project.progress}/{project.requiredTurns} {project.projectId === UNIFICATION_VICTORY.id ? 'turns held' : 'active turns'}<progress max={project.requiredTurns} value={project.progress}/></label>
    {project.statusReason && <p>{project.statusReason}</p>}
    <button aria-label={`Locate project ${project.settlementName}`} onClick={() => locate(project.cell)}>Locate project</button>
  </article>)}<p className="field-help">Victory bids are public; the surrounding land stays hidden until explored. Besiege a Prosperity or Attunement host to halt it and conquer it to cancel it; taking a hearth whose borders hold a seam, or wounding the sealing Waykeeper, also halts an Attunement. A Unification bid ends if its capital falls or its realm drops below two thirds of the world's hearths.</p></section>;
}

export function CampaignProgression({ view, busy, issue, locate, close, developmentQuery, stateHash = '', queryEpoch = 0, queryEnabled = true }: { view: Observation; busy: boolean; issue: (command: GameCommand) => void; locate: (cell: number) => void; close: () => void; developmentQuery?: DevelopmentQuery; stateHash?: string; queryEpoch?: number; queryEnabled?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<ProgressionTab>('technology');
  const [host, setHost] = useState('');
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    element?.showModal();
    return () => { element?.close(); if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, []);
  const progression = view.progression;
  const blocked = busy || Boolean(view.battle || view.pendingCapture || view.victory);
  const project = progression.project;
  const selectedHost = project.eligibleSettlementIds.includes(host) ? host : project.eligibleSettlementIds[0] ?? '';
  const choices = tab === 'institutions' ? progression.institutionChoices : progression.doctrineChoices;
  const selectTab = (id: ProgressionTab) => { setTab(id); document.getElementById(`progression-${id}-tab`)?.focus(); };
  return <dialog ref={dialog} className="progression-dialog" aria-labelledby="progression-title" onCancel={event => { event.preventDefault(); close(); }}>
    <div className="chronicles-header"><div><span className="eyebrow">The work of generations</span><h2 id="progression-title">Realm progression</h2></div><button onClick={close} aria-label="Close realm progression">Close ×</button></div>
    <p className="progression-resources">{view.knowledge} knowledge · {view.treasury} coin</p>
    <div role="tablist" aria-label="Advancement systems" className="progression-tabs" onKeyDown={event => {
      const index = tabs.findIndex(item => item.id === tab);
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); selectTab(tabs[(index + (event.key === 'ArrowLeft' ? tabs.length - 1 : 1)) % tabs.length]!.id); }
      if (event.key === 'Home') { event.preventDefault(); selectTab('technology'); }
      if (event.key === 'End') { event.preventDefault(); selectTab('prosperity'); }
    }}>{tabs.map(item => <button role="tab" id={`progression-${item.id}-tab`} aria-controls="progression-panel" aria-selected={tab === item.id} tabIndex={tab === item.id ? 0 : -1} key={item.id} onClick={() => setTab(item.id)}>{item.label}</button>)}</div>
    <section className="progression-panel" role="tabpanel" id="progression-panel" aria-labelledby={`progression-${tab}-tab`}>
      {tab === 'resources' ? <ResourcePanel view={view} busy={blocked} issue={issue}/> : tab === 'development' ? <QueriedDevelopmentPanel view={view} busy={blocked} issue={issue} query={developmentQuery} hash={stateHash} epoch={queryEpoch} enabled={queryEnabled}/> : tab === 'arcane' ? view.arcaneResearch?.choices.length ? <><ArcaneSeams view={view} locate={locate}/><ArcaneResearch view={view} blocked={blocked} issue={issue}/></> : <p>Arcane Theory is unavailable under this campaign’s historical rules.</p> : tab !== 'prosperity' ? <>
        <p className="progression-explanation">{tab === 'technology' ? 'Spend accumulated knowledge on permanent practical discoveries. Their effects add to the realm’s existing capabilities.' : tab === 'institutions' ? 'Choose how your society is organized. Adopt one institution with coin; this choice permanently excludes the other institution.' : 'Choose how your armies fight and march. Adopt one doctrine with coin; this choice permanently excludes the other doctrine.'}</p>
        {tab === 'technology' ? <ResearchTree view={view} blocked={blocked} issue={issue}/> : <div className="progression-choices">{choices.map(choice => <article className="progression-choice" key={choice.id} data-testid={`progression-${choice.id}`} tabIndex={-1} aria-label={`${choice.name} policy`} data-state={(tab === 'institutions' ? progression.institutionId === choice.id : progression.doctrineId === choice.id) ? 'adopted' : (tab === 'institutions' ? progression.institutionId : progression.doctrineId) ? 'excluded' : choice.available ? 'available' : 'locked'}>
          <h3>{choice.name}</h3><span className="research-node-status">{(tab === 'institutions' ? progression.institutionId === choice.id : progression.doctrineId === choice.id) ? '◆ Adopted' : (tab === 'institutions' ? progression.institutionId : progression.doctrineId) ? '⊘ Excluded' : choice.available ? '◇ Available' : '⊘ Locked'}</span><p>{choice.description}</p><span className="progression-cost">{choice.coinCost} coin</span>
          {(tab === 'institutions' ? progression.institutionId && progression.institutionId !== choice.id : progression.doctrineId && progression.doctrineId !== choice.id) && <p className="policy-exclusion">⊘ Permanently excluded by {choices.find(item => item.id === (tab === 'institutions' ? progression.institutionId : progression.doctrineId))?.name}.</p>}
          {choice.blocker && <p className="progression-blocker" id={`blocker-${choice.id}`}>{choice.blocker}</p>}
          <button className="primary wide" disabled={blocked || !choice.available} aria-describedby={choice.blocker ? `blocker-${choice.id}` : undefined} aria-label={`Adopt ${choice.name}`} onClick={event => { event.currentTarget.closest('article')?.focus(); issue(tab === 'institutions' ? { type: 'adoptInstitution', factionId: view.factionId, institutionId: choice.id } : { type: 'adoptDoctrine', factionId: view.factionId, doctrineId: choice.id }); }}>{tab === 'institutions' ? 'Adopt institution' : 'Adopt doctrine'}</button>
        </article>)}</div>}
      </> : <>
        <div className="project-introduction"><span className="eyebrow">A public path to victory</span><h3>{project.name}</h3><p>{project.description}</p><p>{project.coinCost} coin committed on starting · {project.activeTurns} active turns required.</p><p>Blockades or lost infrastructure pause progress. Conquest of the host cancels the project; the original commitment is not refunded.</p></div>
        {project.blockers.length > 0 && <section className="project-blockers" aria-label="Victory project requirements"><h4>Before the exchange can begin</h4><ul>{project.blockers.map(blocker => <li key={blocker}>{blocker}</li>)}</ul></section>}
        <form className="project-start" onSubmit={event => { event.preventDefault(); if (selectedHost) issue({ type: 'startVictoryProject', factionId: view.factionId, settlementId: selectedHost }); }}>
          <label>Project settlement<select value={selectedHost} disabled={blocked || !project.eligibleSettlementIds.length} onChange={event => setHost(event.target.value)}>{!project.eligibleSettlementIds.length && <option value="">No eligible settlement</option>}{project.eligibleSettlementIds.map(id => <option value={id} key={id}>{view.settlements.find(town => town.id === id)?.name ?? id}</option>)}</select></label>
          <button className="primary" disabled={blocked || project.blockers.length > 0 || !selectedHost} type="submit">Start {project.name}</button>
        </form>
        {progression.unification && <UnificationStatus unification={progression.unification}/>}
        {progression.attunement ? <AttunementStatus view={view} attunement={progression.attunement} blocked={blocked} issue={issue}/>
          : progression.attunementAvailable && <section className="project-introduction" data-testid="attunement-status" aria-label={ATTUNEMENT_VICTORY.name}><span className="eyebrow">A third path to victory</span><h3>{ATTUNEMENT_VICTORY.name}</h3><p>{ATTUNEMENT_VICTORY.description}</p>
            <p className="field-help">Your realm has not yet begun the arcane road. Survey a seam, research Arcane Theory or appoint a Waykeeper, and this section will show exactly what the working still lacks.</p></section>}
        <PublicProjects view={view} locate={cell => { close(); locate(cell); }}/>
      </>}
    </section>
  </dialog>;
}
