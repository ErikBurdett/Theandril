import { useState } from 'react';
import { IMPROVEMENTS, RESOURCES } from '@theandril/content';
import type { GameCommand, Observation } from '@theandril/sim';
import { MapArt } from './faction-art';
import './resource-panel.css';

export function ResourcePanel({ view, busy, issue }: { view: Observation; busy: boolean; issue: (command: GameCommand) => void }) {
  const [market, setMarket] = useState(''), [quantities, setQuantities] = useState<Record<string, number>>({});
  const resources = view.resources;
  if (!resources) return <p>Resource development is unavailable in this historical observation.</p>;
  const towns = new Map(view.settlements.map(town => [town.id, town]));
  const markets = resources.marketSettlementIds.flatMap(id => { const town = towns.get(id); return town ? [town] : []; });
  const selected = markets.find(town => town.id === market)?.id ?? markets[0]?.id;
  return <section className="resource-panel" aria-label="Realm resources" data-testid="resource-panel">
    <header><span className="eyebrow">Land and livelihood</span><h3>Realm resources</h3><p>Claim a deposit, finish its matching works, and assign a household to that tile. Its output enters your realm stockpile each turn. Siege and occupation suspend extraction.</p></header>
    {!resources.version && <p className="resource-legacy">This preserved older world has no resource deposits. Begin a new campaign to use the resource economy.</p>}
    <label className="resource-market">Contract market <select aria-label="Resource contract market" value={selected ?? ''} onChange={event => setMarket(event.target.value)} disabled={!markets.length}>
      {!markets.length && <option value="">Build a Charter market to sell surplus</option>}{markets.map(town => <option key={town.id} value={town.id}>{town.name}</option>)}
    </select></label>
    <div className="resource-grid">{resources.stockpiles.map(stock => {
      const definition = RESOURCES.find(item => item.id === stock.resourceId)!, works = IMPROVEMENTS.find(item => item.id === stock.improvementId)!;
      const quantity = quantities[stock.resourceId] ?? 1;
      const disabled = busy || !selected || quantity > stock.amount || !Number.isInteger(quantity) || quantity < 1 || quantity > 1_000_000;
      return <article key={stock.resourceId} className="resource-card" data-testid={`stockpile-${stock.resourceId}`}>
        <div className="resource-identity"><MapArt contentId={stock.resourceId} label={stock.name}/><div><span className="eyebrow">{definition.category}</span><h4>{stock.name}</h4><p>{definition.description}</p></div></div>
        <dl><div><dt>Stored</dt><dd>{stock.amount}</dd></div><div><dt>Worked output</dt><dd>+{stock.perTurn} / turn</dd></div></dl>
        <div className="resource-works"><MapArt contentId={works.id} label={works.name} compact/><div><strong>{works.name}</strong><span>{definition.extraction} per worked deposit / turn</span></div></div>
        <p>Advanced development commits these materials. Sell surplus for {stock.salePrice} coin each.</p>
        <div className="resource-contract"><label>Quantity<input aria-label={`${stock.name} sale quantity`} type="number" min={1} max={Math.min(1_000_000, Math.max(1, stock.amount))} value={quantity} onChange={event => setQuantities(previous => ({ ...previous, [stock.resourceId]: Number(event.target.value) }))}/></label>
          <button type="button" disabled={disabled} onClick={() => { if (selected) issue({ type: 'sellResource', factionId: view.factionId, settlementId: selected, resourceId: stock.resourceId, amount: quantity }); }}>Sell for {Number.isFinite(quantity) ? quantity * stock.salePrice : 0} coin</button></div>
      </article>;
    })}</div>
  </section>;
}
