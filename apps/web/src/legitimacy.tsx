import type { Observation } from '@theandril/sim';

/** Rules 82: the realm's legitimacy, read in Realm affairs with its reasons. */
export function Legitimacy({ view }: { view: Observation }) {
  const legitimacy = view.legitimacy;
  if (!legitimacy) return null;
  return <section aria-label="Legitimacy" data-testid="legitimacy"><h4>Legitimacy</h4>
    <p className="field-help" data-testid="legitimacy-text">{legitimacy.text}</p>
    <ul className="field-help">{legitimacy.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>
  </section>;
}
