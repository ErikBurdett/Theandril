import type { GameCommand, Observation } from '@theandril/sim';

type IssueOrder = (command: GameCommand) => void;

/** Rules 46: the realm's pending hearth events, each with its quoted answers.
 * The simulation names the hearth, the term and every effect; this panel only
 * issues the chosen answer as an ordinary command. */
export function HearthEvents({ view, busy, issue }: { view: Observation; busy: boolean; issue: IssueOrder }) {
  const events = view.hearthEvents ?? [];
  if (!events.length) return null;
  return <section className="hearth-events" aria-label="Hearth events" data-testid="hearth-events">
    <h3>Hearth events</h3>
    {events.map(event => <article key={event.id} className="hearth-event" aria-label={`${event.name} at ${event.settlementName}`}>
      <h4>{event.name} <small>at {event.settlementName}, turn {event.turn}</small></h4>
      <p>{event.text}</p>
      <p className="muted">Answer by turn {event.expiresTurn}; left unanswered, {event.choices[0]!.label.toLowerCase()} is taken.</p>
      <div className="offer-responses">
        {event.choices.map((choice, index) => <button key={choice.id} className={index === 0 ? 'primary' : undefined} disabled={busy || Boolean(choice.blocker)} title={choice.blocker ?? choice.description}
          aria-label={`${choice.label}: ${event.name} at ${event.settlementName}`} aria-describedby={`${event.id}-${choice.id}`}
          onClick={() => issue({ type: 'resolveHearthEvent', factionId: view.factionId, eventId: event.id, choiceId: choice.id })}>{choice.label}</button>)}
      </div>
      <ul className="hearth-event-answers">
        {event.choices.map(choice => <li key={choice.id} id={`${event.id}-${choice.id}`}><strong>{choice.label}.</strong> {choice.description} <em>{choice.summary}.</em>{choice.blocker && <span className="muted"> {choice.blocker}</span>}</li>)}
      </ul>
    </article>)}
  </section>;
}
