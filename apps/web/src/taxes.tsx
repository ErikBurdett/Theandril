import type { GameCommand, Observation } from '@theandril/sim';

/** Rules 70: the realm's tax rate, read and set from Realm affairs. */
export function TaxPolicy({ view, busy, issue }: { view: Observation; busy: boolean; issue: (command: GameCommand) => void }) {
  const taxes = view.tax;
  if (!taxes) return null;
  return <section aria-label="Taxes" data-testid="tax-policy"><h4>Taxes</h4>
    <p className="field-help" data-testid="tax-rate">{taxes.text}</p>
    <div className="offer-responses">
      {(['lean', 'steady', 'heavy'] as const).map(rate => <button key={rate} disabled={busy || taxes.rate === rate} aria-pressed={taxes.rate === rate} aria-label={`Set ${rate} taxes`} onClick={() => issue({ type: 'setTaxRate', factionId: view.factionId, rate })}>{rate[0]!.toUpperCase() + rate.slice(1)}</button>)}
    </div>
  </section>;
}
