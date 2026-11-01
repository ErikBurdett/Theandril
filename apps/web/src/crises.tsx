import { blightWords, MIGRATION_MIN_POPULATION, MIGRATION_RANGE, type GameCommand, type Observation } from '@theandril/sim';

type IssueOrder = (command: GameCommand) => void;

/** Rules 53: the crisis that stands, with the realm's own shelter quote. The
 * simulation names the toll, the term and the price; this card only issues
 * the shelter as an ordinary command. */
export function Crisis({ view, busy, issue }: { view: Observation; busy: boolean; issue: IssueOrder }) {
  const crisis = view.crisis;
  if (!crisis) return null;
  return <section className="crisis" aria-label={`Crisis: ${crisis.name}`} data-testid="crisis">
    <h3>{crisis.name} <small>since turn {crisis.startedTurn}, {crisis.turnsLeft} turn{crisis.turnsLeft === 1 ? '' : 's'} to go</small></h3>
    <p>{crisis.description}</p>
    <p className="muted">Every unsheltered hearth loses {blightWords(crisis.blight)} each turn until turn {crisis.endsTurn}.</p>
    {crisis.shelteredRealms && <p className="muted" data-testid="crisis-migration">{crisis.shelteredRealms.length} realm{crisis.shelteredRealms.length === 1 ? ' has' : 's have'} sheltered. When the crisis passes, every hearth of {MIGRATION_MIN_POPULATION} or more people that bore the whole toll loses a household to the nearest sheltered hearth within {MIGRATION_RANGE} hexes.</p>}
    {crisis.sheltered
      ? <p data-testid="crisis-sheltered"><strong>The realm’s hearths are sheltered.</strong> {crisis.shelter}</p>
      : <div className="offer-responses">
        <button className="primary" disabled={busy || Boolean(crisis.shelterBlocker)} title={crisis.shelterBlocker ?? crisis.shelter}
          aria-label={`Shelter the hearths from ${crisis.name}`}
          onClick={() => issue({ type: 'shelterFromCrisis', factionId: view.factionId, crisisId: crisis.id })}>Shelter the hearths for {crisis.shelterCost} coin</button>
        <span className="muted">{crisis.shelterBlocker ?? crisis.shelter}</span>
      </div>}
  </section>;
}
