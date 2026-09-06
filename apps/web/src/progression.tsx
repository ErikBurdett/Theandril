import { useEffect, useRef, useState } from 'react';
import type { GameCommand, Observation } from '@theandril/sim';

type ProgressionTab = 'technology' | 'institutions' | 'doctrine' | 'prosperity';
const tabs: { id: ProgressionTab; label: string }[] = [
  { id: 'technology', label: 'Technology' }, { id: 'institutions', label: 'Institutions' },
  { id: 'doctrine', label: 'Military doctrine' }, { id: 'prosperity', label: 'Prosperity' },
];

export function PublicProjects({ view, locate }: { view: Observation; locate: (cell: number) => void }) {
  if (!view.projects.length) return null;
  return <section className="public-projects" data-testid="public-projects" aria-label="Public victory projects"><h3>The race for prosperity</h3>{view.projects.map(project => <article key={project.id} className="public-project" data-testid={`project-${project.factionId}`}>
    <strong>{view.factions.find(faction => faction.id === project.factionId)?.name ?? project.factionId}</strong><span>{project.settlementName} · hex {project.cell}</span>
    <label>{project.status} · {project.progress}/{project.requiredTurns} active turns<progress max={project.requiredTurns} value={project.progress}/></label>
    {project.statusReason && <p>{project.statusReason}</p>}
    <button aria-label={`Locate project ${project.settlementName}`} onClick={() => locate(project.cell)}>Locate project</button>
  </article>)}<p className="field-help">Project locations and progress are public. The surrounding land remains hidden until explored. Besiege the host to halt progress; conquer it to cancel the project.</p></section>;
}

export function CampaignProgression({ view, busy, issue, locate, close }: { view: Observation; busy: boolean; issue: (command: GameCommand) => void; locate: (cell: number) => void; close: () => void }) {
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
  const choices = tab === 'technology' ? progression.technologyChoices : tab === 'institutions' ? progression.institutionChoices : progression.doctrineChoices;
  const selectTab = (id: ProgressionTab) => { setTab(id); document.getElementById(`progression-${id}-tab`)?.focus(); };
  return <dialog ref={dialog} className="progression-dialog" aria-labelledby="progression-title" onCancel={event => { event.preventDefault(); close(); }}>
    <div className="chronicles-header"><div><span className="eyebrow">The work of generations</span><h2 id="progression-title">Realm progression</h2></div><button onClick={close} aria-label="Close realm progression">Close ×</button></div>
    <p className="progression-resources">{view.knowledge} knowledge · {view.treasury} coin</p>
    <div role="tablist" aria-label="Advancement systems" className="progression-tabs" onKeyDown={event => {
      const index = tabs.findIndex(item => item.id === tab);
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); selectTab(tabs[(index + (event.key === 'ArrowLeft' ? 3 : 1)) % tabs.length]!.id); }
      if (event.key === 'Home') { event.preventDefault(); selectTab('technology'); }
      if (event.key === 'End') { event.preventDefault(); selectTab('prosperity'); }
    }}>{tabs.map(item => <button role="tab" id={`progression-${item.id}-tab`} aria-controls="progression-panel" aria-selected={tab === item.id} tabIndex={tab === item.id ? 0 : -1} key={item.id} onClick={() => setTab(item.id)}>{item.label}</button>)}</div>
    <section className="progression-panel" role="tabpanel" id="progression-panel" aria-labelledby={`progression-${tab}-tab`}>
      {tab !== 'prosperity' ? <>
        <p className="progression-explanation">{tab === 'technology' ? 'Spend accumulated knowledge on permanent practical discoveries. Their effects add to the realm’s existing capabilities.' : tab === 'institutions' ? 'Choose how your society is organized. Adopt one institution with coin; this choice permanently excludes the other institution.' : 'Choose how your armies fight and march. Adopt one doctrine with coin; this choice permanently excludes the other doctrine.'}</p>
        <div className="progression-choices">{choices.map(choice => <article className="progression-choice" key={choice.id} data-testid={`progression-${choice.id}`}>
          <h3>{choice.name}</h3>{(tab === 'technology' ? progression.technologies.includes(choice.id) : tab === 'institutions' ? progression.institutionId === choice.id : progression.doctrineId === choice.id) && <span className="progression-cost">◆ {tab === 'technology' ? 'Researched' : 'Adopted'}</span>}<p>{choice.description}</p><span className="progression-cost">{'knowledgeCost' in choice ? `${choice.knowledgeCost} knowledge` : `${choice.coinCost} coin`}</span>
          {choice.blocker && <p className="progression-blocker" id={`blocker-${choice.id}`}>{choice.blocker}</p>}
          <button className="primary wide" disabled={blocked || !choice.available} aria-describedby={choice.blocker ? `blocker-${choice.id}` : undefined} aria-label={`${tab === 'technology' ? 'Research' : 'Adopt'} ${choice.name}`} onClick={() => issue(tab === 'technology' ? { type: 'research', factionId: view.factionId, technologyId: choice.id } : tab === 'institutions' ? { type: 'adoptInstitution', factionId: view.factionId, institutionId: choice.id } : { type: 'adoptDoctrine', factionId: view.factionId, doctrineId: choice.id })}>{tab === 'technology' ? 'Research discovery' : tab === 'institutions' ? 'Adopt institution' : 'Adopt doctrine'}</button>
        </article>)}</div>
      </> : <>
        <div className="project-introduction"><span className="eyebrow">A public path to victory</span><h3>{project.name}</h3><p>{project.description}</p><p>{project.coinCost} coin committed on starting · {project.activeTurns} active turns required.</p><p>Blockades or lost infrastructure pause progress. Conquest of the host cancels the project; the original commitment is not refunded.</p></div>
        {project.blockers.length > 0 && <section className="project-blockers" aria-label="Victory project requirements"><h4>Before the exchange can begin</h4><ul>{project.blockers.map(blocker => <li key={blocker}>{blocker}</li>)}</ul></section>}
        <form className="project-start" onSubmit={event => { event.preventDefault(); if (selectedHost) issue({ type: 'startVictoryProject', factionId: view.factionId, settlementId: selectedHost }); }}>
          <label>Project settlement<select value={selectedHost} disabled={blocked || !project.eligibleSettlementIds.length} onChange={event => setHost(event.target.value)}>{!project.eligibleSettlementIds.length && <option value="">No eligible settlement</option>}{project.eligibleSettlementIds.map(id => <option value={id} key={id}>{view.settlements.find(town => town.id === id)?.name ?? id}</option>)}</select></label>
          <button className="primary" disabled={blocked || project.blockers.length > 0 || !selectedHost} type="submit">Start {project.name}</button>
        </form>
        <PublicProjects view={view} locate={cell => { close(); locate(cell); }}/>
      </>}
    </section>
  </dialog>;
}
