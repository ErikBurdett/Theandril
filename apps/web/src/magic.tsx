import { BATTLE_SPELLS, MAGIC_PATHS } from '@theandril/content';
import type { CharacterView, GameCommand, Observation } from '@theandril/sim';

/** Rules 40: strategic rites a lodged Waykeeper may perform, with the exact
 * simulation blocker, and the wards standing over the realm's hearths. */
export function StrategicRites({ view, character, busy, issue }: { view: Observation; character: CharacterView; busy: boolean; issue: (command: GameCommand) => void }) {
  const rites = (view.rites ?? []).filter(rite => rite.characterId === character.id);
  if (!rites.length) return null;
  const wards = (view.wards ?? []).filter(ward => ward.casterId === character.id);
  return <section aria-label="Strategic rites" data-testid="strategic-rites"><h4>Strategic rites</h4>
    <p className="field-help">A lodged Waykeeper of the rite’s path performs it at a hearth whose borders hold a surveyed seam of that path, paying ashglass from the realm stockpile. A ward holds while the caster stays lodged there and the seam is held.</p>
    {wards.map(ward => <p key={ward.settlementId} data-testid={`ward-${ward.settlementId}`}><strong>{ward.riteName}</strong> stands over {ward.settlementName}: {ward.remainingTurns} {ward.remainingTurns === 1 ? 'turn' : 'turns'} remaining.</p>)}
    {rites.map(rite => <article className="character-mission" key={rite.riteId} data-testid={`rite-${rite.riteId}`}>
      <h4>{rite.name}</h4><p>{rite.description}</p><p>{rite.ashglassCost} ashglass · {rite.durationTurns} turns{rite.settlementId ? ` · at ${view.settlements.find(town => town.id === rite.settlementId)?.name ?? rite.settlementId}` : ''}</p>
      {rite.blocker && <p className="character-blocker">{rite.blocker}</p>}
      <button className="primary wide" disabled={busy || !rite.canPerform} aria-label={`Perform ${rite.name}`} onClick={() => issue({ type: 'performRite', factionId: view.factionId, characterId: character.id, riteId: rite.riteId })}>Perform rite</button>
    </article>)}
  </section>;
}

export function PersonalMagic({ character }: { character: CharacterView }) {
  if (!character.aptitudes) return null;
  return <section aria-label="Personal magical aptitude"><h4>Personal paths</h4><p>{Object.entries(character.aptitudes).map(([id, level]) => `${MAGIC_PATHS.find(path => path.id === id)?.name ?? id} ${level}`).join(' · ')}</p><p>National research does not grant these personal paths. A Waykeeper lodged in a hearth whose borders hold a surveyed seam studies it for one experience a turn; twenty-four experience deepens a path by a degree.</p><p>Known workings: {character.spellIds?.map(id => BATTLE_SPELLS.find(spell => spell.id === id)?.name ?? id).join(', ') || 'None researched for this practitioner.'}</p></section>;
}

/** Rules 23: Arcane Theory is studied from a seam the realm holds, so the panel
 * names the seams it has surveyed and whether any lies inside its borders. */
export function ArcaneSeams({ view, locate }: { view: Observation; locate?: (cell: number) => void }) {
  const seams = view.arcaneSites;
  return <section className="project-introduction" data-testid="arcane-seams" aria-label="Arcane seams">
    <span className="eyebrow">Where the Ashfall settled</span><h3>Arcane seams</h3>
    {seams.length === 0
      ? <p>Your realm has surveyed no arcane seam. Ashfall glass marks ground worth surveying; a company standing there can pay {view.arcaneSearchCoinCost} coin to look.</p>
      : <ul>{seams.map(seam => <li key={seam.id}>
          {seam.pathName} seam{seam.controlled ? ' — held, drawing ashglass' : ' — outside your borders'}
          {locate && <> · <button onClick={() => locate(seam.cell)} aria-label={`Locate ${seam.pathName} seam`}>Locate</button></>}
        </li>)}</ul>}
  </section>;
}

export function ArcaneResearch({ view, blocked, issue }: { view: Observation; blocked: boolean; issue: (command: GameCommand) => void }) {
  if (!view.arcaneResearch?.choices.length) return null;
  return <details className="arcane-research" data-testid="arcane-research"><summary>Arcane Theory · national discoveries, personal practitioners</summary><p>Research unlocks knowledge for the realm, not magical aptitude. Appoint and attach a personally qualified Waykeeper before using these workings in battle.</p><div className="progression-choices">{view.arcaneResearch.choices.map(choice => <article className="progression-choice" key={choice.id} data-testid={choice.id} tabIndex={-1}>
    <h3>{choice.name}</h3><p>{choice.description}</p><p>{choice.knowledgeCost} knowledge · {choice.researched ? 'Researched' : choice.canResearch ? 'Available' : 'Locked'}</p>
    {choice.spellIds.map(id => { const spell = BATTLE_SPELLS.find(item => item.id === id); return <p key={id}><strong>{spell?.name ?? id}</strong> · {spell?.description}</p>; })}
    {choice.blocker && <p className="progression-blocker">{choice.blocker}</p>}
    <button className="primary wide" disabled={blocked || !choice.canResearch} onClick={event => { event.currentTarget.closest('article')?.focus(); issue({ type: 'researchArcane', factionId: view.factionId, discoveryId: choice.id }); }}>Research {choice.name}</button>
    <h4>Your practitioners</h4>{choice.casters.length ? <ul>{choice.casters.map(caster => <li key={caster.characterId}>{caster.name}: {caster.canCast ? 'Personally qualified and attached' : caster.blocker}</li>)}</ul> : <p>No living Waykeeper appointed.</p>}
  </article>)}</div></details>;
}
