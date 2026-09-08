import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BATTLE_SPELLS } from '@theandril/content';
import type { BattleOrder, BattlePresentationEvent, BattleSceneSnapshot, GameCommand, Observation } from '@theandril/sim';
import { battleSceneHeight, battleIsPortrait, battleLayout, battleActorBounds, type BattlePlaybackProgress, type BattleSceneView } from '@theandril/render';
import type { BattleTransfer } from './battle-transfer';
import { FormationTable } from './warfare';
import { CommanderBattleControls } from './characters';
import { battleRevealOffset, mayAdvanceBattleWatch } from './battle-playback';
import './battle.css';

const terrainNames = ['Water', 'Plains', 'Forest', 'Hills', 'Mountains'];
const orders: { id: BattleOrder; name: string; description: string }[] = [
  { id: 'advance', name: 'Advance', description: 'Engage the enemy line.' },
  { id: 'brace', name: 'Brace', description: 'Favor defense and preserve stamina.' },
  { id: 'flank', name: 'Flank', description: 'Pressure exposed formations; higher fatigue.' },
  { id: 'withdraw', name: 'Withdraw', description: 'Retreat; survivors face pursuit.' },
];

export function describeBattleEvent(event: BattlePresentationEvent, scene: BattleSceneSnapshot): string {
  const name = (id: string) => scene.characters.find(item => item.id === id)?.name ?? scene.formations.find(item => item.id === id)?.unitName ?? id;
  const source = event.sourceId ? name(event.sourceId) : '';
  const targets = event.targetIds.map(name).join(', ');
  const loss = -event.changes.reduce((sum, change) => sum + Math.min(0, change.strengthDelta), 0);
  if (event.type === 'attack' || event.type === 'pursuit') return `${source} ${event.attackKind === 'projectile' ? 'fires on' : 'strikes'} ${targets}${loss ? ` · ${loss} strength lost` : ' · no strength lost'}.`;
  if (event.type === 'ability') {
    const label = BATTLE_SPELLS.find(spell => spell.id === event.abilityId)?.name ?? (event.abilityId === 'ability.rally' ? 'Rally' : event.abilityId === 'ability.set_shields' ? 'Set shields' : event.abilityId?.replace(/^(ability|spell)\./, '').replaceAll('_', ' ') ?? 'Ability');
    return `${source} · ${label}${targets ? ` → ${targets}` : ''}${loss ? ` · ${loss} strength lost` : ''}.`;
  }
  if (event.type === 'result') return `${event.winner === 'attacker' ? 'Attacking forces victorious' : event.winner === 'defender' ? 'Defending forces victorious' : 'Draw'} · ${event.reason ?? 'Battle concluded'}.`;
  if (event.type === 'round') return `Round ${event.round}.`;
  return `${source || targets} · ${event.type}${event.reason ? ` · ${event.reason}` : ''}.`;
}

interface Props {
  view: Observation; transfer?: BattleTransfer; busy: boolean; error: boolean; replay: boolean; suspended?: boolean;
  issue: (command: GameCommand) => void; setScene: (scene: BattleSceneView | undefined) => void;
  keepReview: () => void; closeReview: () => void;
}

/** Commands advance the real battle. This component never derives hits, targets,
 * morale or spell effects from its animation clock. */
export function BattlefieldPanel({ view, transfer, busy, error, replay, suspended = false, issue, setScene, keepReview, closeReview }: Props) {
  const battle = view.battle;
  const packet = transfer && (battle?.id === transfer.packet.battleId || replay) ? transfer.packet : undefined;
  const snapshot = battle?.id ? view.battleScene : replay ? packet?.after : undefined;
  const battleId = battle?.id ?? (replay ? packet?.battleId : undefined);
  const revision = packet ? transfer!.revision : 0;
  const heading = useRef<HTMLHeadingElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const [watching, setWatching] = useState(false);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [stance, setStance] = useState<BattleOrder>('advance');
  const [selectedId, setSelectedId] = useState<string>();
  const [seekEnd, setSeekEnd] = useState(0);
  const [progress, setProgress] = useState<BattlePlaybackProgress>();
  const issueRef = useRef(issue); issueRef.current = issue;
  const [targets, setTargets] = useState<Record<string, string>>({});
  const onProgress = useCallback((next: BattlePlaybackProgress) => setProgress(previous => previous?.revision === next.revision && previous.eventCount === next.eventCount && previous.completed === next.completed ? previous : next), []);
  const onSelect = useCallback((id: string) => setSelectedId(id), []);
  useLayoutEffect(() => {
    const window = windowRef.current, section = window?.closest<HTMLElement>('.map-section');
    if (!window || !section) return;
    const measure = () => {
      section.style.setProperty('--battlefield-top', `${window.getBoundingClientRect().top - section.getBoundingClientRect().top}px`);
      if (snapshot) {
        section.style.setProperty('--battlefield-height', `${battleSceneHeight(snapshot, window.clientWidth)}px`);
        window.dataset.portrait = String(battleIsPortrait(snapshot, window.clientWidth));
      }
    };
    measure(); const observer = new ResizeObserver(measure);
    observer.observe(window.parentElement!); observer.observe(window);
    return () => { observer.disconnect(); section.style.removeProperty('--battlefield-top'); };
  }, [battleId, snapshot]);
  useEffect(() => { setWatching(false); setPaused(false); setSeekEnd(0); setSelectedId(undefined); setProgress(undefined); setTargets({}); heading.current?.focus(); }, [battleId]);
  useEffect(() => { setPaused(false); setSeekEnd(0); setProgress(undefined); }, [revision]);
  useEffect(() => { if (suspended) { setWatching(false); setPaused(true); } }, [suspended]);
  useEffect(() => {
    const hide = () => { if (document.hidden) { setWatching(false); setPaused(true); } };
    document.addEventListener('visibilitychange', hide); return () => document.removeEventListener('visibilitychange', hide);
  }, []);
  useEffect(() => { if (error) { setWatching(false); setPaused(true); } }, [error]);
  useEffect(() => {
    if (!battleId || !snapshot) { setScene(undefined); return; }
    setScene({ battleId, snapshot, packet, revision, paused: paused || suspended, speed, selectedId, seekEnd, onProgress, onSelect });
  }, [battleId, snapshot, packet, revision, paused, suspended, speed, selectedId, seekEnd, onProgress, onSelect, setScene]);
  useEffect(() => () => setScene(undefined), [setScene]);
  const playing = Boolean(packet && (!progress || progress.revision !== revision || !progress.completed));
  useEffect(() => {
    if (!mayAdvanceBattleWatch({ watching, paused, busy, error, suspended, battle: Boolean(battle), playing })) return;
    const timer = setTimeout(() => { if (!document.hidden) issueRef.current({ type: 'battleOrder', factionId: view.factionId, order: stance }); }, 300);
    return () => clearTimeout(timer);
  }, [watching, paused, busy, error, suspended, battle, playing, stance, view.factionId]);
  if (!battleId || !snapshot) return null;
  const ownSide = battle?.attackerFactionId === view.factionId ? 'attacker' : 'defender';
  const chosen = snapshot.formations.find(item => item.id === selectedId);
  const character = snapshot.characters.find(item => item.id === selectedId);
  const abilities = view.battleAbilities ?? [];
  const revealField = (targetId?: string) => {
    const field = windowRef.current; if (!field) return;
    const layout = battleLayout(snapshot, field.clientWidth, field.clientHeight);
    const entity = snapshot.formations.find(item => item.id === targetId || item.armyId === targetId) ?? snapshot.characters.find(item => item.id === targetId);
    const point = entity && layout.points.get(entity.id);
    const target = entity && point ? battleActorBounds('unitId' in entity ? entity.unitId : entity.definitionId, point, layout.scale) : { y: 0, height: field.clientHeight };
    const top = battleRevealOffset(field.getBoundingClientRect().top + target.y, target.height, window.innerHeight);
    if (Math.abs(top) > 1) window.scrollBy({ top, behavior: 'instant' });
  };
  const manual = (order: BattleOrder) => { revealField(); setWatching(false); setSeekEnd(value => value + 1); issue({ type: 'battleOrder', factionId: view.factionId, order }); };
  return <section className="battle-workspace" data-testid={battle ? 'battle-panel' : 'battle-replay'} aria-labelledby="battle-heading">
    <header className="battlefield-heading"><div><span className="eyebrow">{battle ? 'Orders before the clash' : 'Witnessed battle · recorded actions'}</span><h2 id="battle-heading" tabIndex={-1} ref={heading}>{snapshot.domain === 'naval' ? 'Naval battle' : snapshot.settlementId ? 'Settlement assault' : 'Field battle'}{battle ? ` at hex ${battle.defenderCell}` : ''}</h2></div><span className="battle-round">ROUND <strong data-testid="battle-round">{snapshot.round}</strong></span></header>
    <p className="battlefield-context">{terrainNames[snapshot.terrain]}{snapshot.settlementId ? ` · Fortification ${snapshot.fortification}` : ''}{battle ? ` · You command the ${ownSide === 'attacker' ? 'attacking' : 'defending'} forces.` : ' · Read-only playback.'}{snapshot.domain === 'naval' && ' Passengers do not fight; destroyed carrying capacity can drown them.'}</p>
    <div className="battlefield-transport" aria-label="Battle playback">
      {battle && <><button className="primary" disabled={busy} onClick={() => { if (watching) { setWatching(false); setPaused(true); } else { revealField(); keepReview(); setWatching(true); setPaused(false); } }}>{watching ? 'Pause battle watch' : 'Watch battle'}</button><label>Watch stance<select value={stance} onChange={event => setStance(event.target.value as BattleOrder)}>{orders.filter(order => order.id !== 'withdraw').map(order => <option key={order.id} value={order.id}>{order.name}</option>)}</select></label><button disabled={busy || watching} onClick={() => manual(stance)}>Step one battle round</button></>}
      <button disabled={!playing} onClick={() => { setPaused(value => !value); setWatching(false); }}>{paused ? 'Play actions' : 'Pause actions'}</button>
      <label>Playback speed<select value={speed} onChange={event => setSpeed(Number(event.target.value))}><option value="0.5">½×</option><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option></select></label>
      <button disabled={!playing} onClick={() => setSeekEnd(value => value + 1)}>Skip animations</button>
      {battle ? <button disabled={busy} onClick={() => { setWatching(false); closeReview(); issue({ type: 'autoResolveBattle', factionId: view.factionId }); }}>Auto-resolve battle</button> : <button className="primary" onClick={closeReview}>Return to campaign</button>}
    </div>
    <div className="battlefield-window" ref={windowRef} aria-hidden="true"><span>DEFENDERS</span><span data-testid="battle-attacker-label">ATTACKERS</span></div>
    <div className="battlefield-footnote"><span>One sprite per actual formation; number = remaining strength. Deployment is schematic, not free movement.</span><span role="status">{watching ? 'Watching · ordinary rounds advance automatically.' : battle ? 'Paused for your orders.' : 'Playback does not change the campaign.'}{playing ? ` Action ${progress?.eventCount ?? 0} / ${packet?.events.length ?? 0}.` : ''}</span></div>
    <div className="battlefield-inspection"><label>Inspect formation or officer<select value={selectedId ?? ''} onChange={event => setSelectedId(event.target.value || undefined)}><option value="">Select a battlefield figure</option>{snapshot.formations.map(item => <option key={item.id} value={item.id}>{item.side === 'attacker' ? 'Attacker' : 'Defender'} · {item.unitName} · {item.id}</option>)}{snapshot.characters.map(item => <option key={item.id} value={item.id}>{item.name} · {item.side}</option>)}</select></label>{chosen && <p><strong>{chosen.unitName}</strong> · {chosen.armyName} · {chosen.strength}/{chosen.maxStrength} strength · {chosen.morale} morale · {chosen.fatigue} fatigue · {chosen.ward} ward · rank {chosen.row + 1}, file {chosen.column + 1}</p>}{character && <p><strong>{character.name}</strong> · {character.strain}/{character.maxStrain} strain · {character.side}</p>}</div>
    {battle && <><div className="battlefield-orders" aria-label="Tactical orders">{orders.map(order => <button key={order.id} disabled={busy || watching} className={order.id === 'withdraw' ? 'danger' : ''} aria-label={order.name} title={order.description} onClick={() => manual(order.id)}><strong>{order.name}</strong><small>{order.description}</small></button>)}</div>
      <CommanderBattleControls view={view} busy={busy} issue={issue} controls={!abilities.length}/>{abilities.length > 0 && <details className="battlefield-abilities" open><summary>Abilities · automatic by default</summary><p>Each source follows its own policy. Manual triggers use the same costs, strain, targets and remaining uses as automatic use.</p><div className="battlefield-ability-list">{abilities.map(ability => {
        const key = `${ability.sourceId}:${ability.abilityId}`;
        const targetId = targets[key] ?? ability.targets.find(target => target.canTarget)?.targetId ?? ability.targets[0]?.targetId;
        const target = ability.targets.find(item => item.targetId === targetId);
        const sourceName = snapshot.characters.find(item => item.id === ability.sourceId)?.name ?? snapshot.formations.find(item => item.id === ability.sourceId)?.unitName ?? ability.sourceId;
        return <article key={key}><h3>{ability.name} <small>{sourceName}</small></h3><p>{ability.description}</p><p>{ability.usesRemaining} uses remaining · {ability.strainCost} strain per use · {ability.currentStrain} current strain</p><label><input type="checkbox" checked={ability.automatic} disabled={busy} onChange={event => issue({ type: 'setBattleAbilityAuto', factionId: view.factionId, battleId, sourceId: ability.sourceId, abilityId: ability.abilityId, automatic: event.target.checked })}/>Automatic {ability.name} ({ability.sourceId})</label>{ability.targets.length > 0 && <label>Target for {ability.name} ({ability.sourceId})<select value={targetId ?? ''} onChange={event => setTargets(previous => ({ ...previous, [key]: event.target.value }))}>{ability.targets.map(target => <option key={target.targetId} value={target.targetId}>{target.label}{target.canTarget ? '' : ` — ${target.blocker}`}</option>)}</select></label>}<button disabled={busy || !ability.canUse || Boolean(target && !target.canTarget)} aria-label={`${ability.abilityId === 'ability.rally' ? 'Rally the line' : ability.name} (${ability.sourceId})`} onClick={() => { revealField(targetId ?? ability.sourceId); setWatching(false); issue({ type: 'useBattleAbility', factionId: view.factionId, battleId, sourceId: ability.sourceId, abilityId: ability.abilityId, ...(targetId ? { targetId } : {}) }); }}>Use {ability.name}</button>{(!ability.canUse || target && !target.canTarget) && <p className="field-help">{ability.blocker ?? target?.blocker}</p>}</article>;
      })}</div></details>}</>}
    {packet && <details open className="battlefield-account"><summary>Recorded actions ({packet.events.length})</summary><ol aria-label="Recorded battle actions">{packet.events.slice(Math.max(0, (progress?.eventCount ?? 0) - 5), progress?.eventCount ?? 0).map(event => <li key={event.sequence}>{describeBattleEvent(event, packet.before)}</li>)}</ol></details>}
    <details className="battlefield-tables"><summary>Formation details & round account</summary><div className="battle-sides"><FormationTable formations={snapshot.formations.filter(item => item.side === 'attacker')} label="Attacking formations"/><FormationTable formations={snapshot.formations.filter(item => item.side === 'defender')} label="Defending formations"/></div>{battle && <ol>{battle.combat.log.slice(-12).map((line, index) => <li key={index}>{line}</li>)}</ol>}</details>
    {!packet && <p className="field-help">Current saved deployment. Earlier attack animations are not stored in campaign saves.</p>}
  </section>;
}
