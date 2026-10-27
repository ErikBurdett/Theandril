import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { getObservation, stateHash } from '@theandril/sim';
import { theaterCampaign } from '../../../packages/test-fixtures/src/theater-fixture';
import { RealmRegistry } from './realm-navigation';

const forbidden = () => { throw new Error('Presentation must not navigate or issue orders.'); };

describe('land commission registry controls', () => {
  it('renders search-cohort counts, exact compact reasons and honest eligibility limits without commands', () => {
    const game = theaterCampaign(2), hash = stateHash(game), view = getObservation(game, game.turnOwnerId);
    const town = view.settlements.find(item => item.factionId === view.factionId)!;
    view.landPolicies = [{ factionId: view.factionId, settlementId: town.id, improvementId: 'improvement.terraced_fields',
      allowance: 0, reserve: 10, blocker: 'Existing paid land work must finish first.' }];
    const before = JSON.stringify(view);
    const html = renderToStaticMarkup(<RealmRegistry view={view} registry="settlements" search={town.id} force="all" selection={{}} select={forbidden} onGroupLandPolicy={async () => forbidden()}/>);
    expect(html).toContain('Land commission status<select');
    expect(html).toContain('<option value="commissioned">With commissions (1)</option>');
    expect(html).toContain('<option value="uncommissioned">Without commissions (0)</option>');
    expect(html).toContain('<option value="exhausted">Zero allowance (1)</option>');
    expect(html).toContain('<option value="waiting">Reported waits (1)</option>');
    expect(html).toContain('0 coin left · 10 reserve · Existing paid land work must finish first.');
    expect(html).toContain('Land commission counts follow your search and Settlement orders filter.');
    expect(html).toContain('No reported wait does not guarantee an affordable or suitable job.');
    expect(html).toContain('Zero allowance includes hearths with paid work still underway.');
    expect(JSON.stringify(view)).toBe(before); expect(stateHash(game)).toBe(hash);
  });

  it('locks the commission selector along with registry controls while orders are pending', () => {
    const game = theaterCampaign(2), view = getObservation(game, game.turnOwnerId);
    const html = renderToStaticMarkup(<RealmRegistry view={view} registry="settlements" search="" force="all" selection={{}} select={forbidden} busy/>);
    expect(html).toContain('Land commission status<select disabled=""');
    expect(html).toContain('Settlement orders<select disabled=""');
    expect(html).toContain('Registry order<select disabled=""');
  });

  it('hides unavailable historical commission controls and never exposes them in the army registry', () => {
    const game = theaterCampaign(2), view = getObservation(game, game.turnOwnerId);
    const army = renderToStaticMarkup(<RealmRegistry view={view} registry="armies" search="" force="all" selection={{}} select={forbidden}/>);
    expect(army).not.toContain('Land commission status');
    delete view.landPolicies;
    const historical = renderToStaticMarkup(<RealmRegistry view={view} registry="settlements" search="" force="all" selection={{}} select={forbidden}/>);
    expect(historical).not.toContain('Land commission status'); expect(historical).not.toContain('Without commissions');
    expect(historical).not.toContain('Land commission counts');
    expect(historical).toContain('Settlement orders'); expect(historical).toContain('class="registry-item ');
  });
});
