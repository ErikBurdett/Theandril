import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { FACTIONS } from '@theandril/content';
import { hexDistance, isPassable } from '@theandril/mapgen';
import { applyCommand, applyCommandForVersion, createArmyFormation, deserializeGame, getBesiegePreview, getObservation, serializeGame, serializeGameForVersion, stateHash, type GameCommand, type GameState, type RulesVersion } from './index';
import { refreshAuthoredSight, rebaseAuthoredLand } from '../../test-fixtures/src/authored-land';
import { conquestCampaign, CONQUEST_FIXTURE as C } from '../../test-fixtures/src/conquest-fixture';
import { borderBattleCampaign } from '../../test-fixtures/src/combat-fixture';
import { navalCampaign, NAVAL_FIXTURE as N } from '../../test-fixtures/src/naval-fixture';
import { siegeEstablishmentBlocker } from './siege-establishment';
import { withRules } from './rules';
it('matches the actual human command across 18 legal and refused cases, including private global decisions', () => {
    const dir = new URL('../../../docs/development/2026-10-24-project-counterplay/', import.meta.url), initial = readFileSync(new URL('near-complete.theandril', dir), 'utf8');
    const actor = 'faction.reedbound_council', rival = 'faction.ashen_compact', armyId = 'army.4', settlementId = 'settlement.5';
    const issue = (game: GameState, command: GameCommand) => { const result = applyCommand(game, command); assert(result.ok, JSON.stringify({ command, result })); };
    const observe = getObservation;
    const rows: unknown[] = [];
    function parity(name: string, game: GameState, factionId = actor, id = armyId, townId = settlementId) {
        const stable = deserializeGame(serializeGame(game)), view = observe(stable, factionId), before = structuredClone(view), hash = stateHash(stable);
        const preview = getBesiegePreview(view, id, townId);
        assert.deepEqual(view, before);
        assert.equal(stateHash(stable), hash);
        const result = applyCommand(stable, { type: 'besiege', factionId, armyId: id, settlementId: townId });
        assert.equal(preview.canBesiege, result.ok, name);
        assert.equal(preview.blocker, result.error ?? null, name);
        assert.equal(stateHash(deserializeGame(serializeGame(stable))), stateHash(stable));
        rows.push({ name, preview, result, sourceHash: hash, finalHash: stateHash(stable) });
        return { view, preview };
    }
    const base = () => deserializeGame(initial);
    parity('legal-adjacent-project-interruption', base());
    parity('missing-army-before-missing-town', base(), actor, 'army.999999', 'settlement.999999');
    parity('foreign-army', base(), actor, 'army.2');
    parity('missing-town', base(), actor, armyId, 'settlement.999999');
    const peaceful = base();
    issue(peaceful, { type: 'proposePeace', factionId: rival, targetFactionId: actor, terms: { offerCoin: 0, requestCoin: 0, truceTurns: 10 } });
    issue(peaceful, { type: 'respondPeace', factionId: actor, offerId: peaceful.diplomacy.offers[0]!.id, accept: true });
    parity('binding-peace', peaceful);
    const founding = base();
    founding.armies[armyId]!.formations = [createArmyFormation(armyId, 'unit.colonist')];
    refreshAuthoredSight(founding);
    parity('founder-composition', founding);
    const distant = base(), host = distant.settlements[settlementId]!;
    const farther = Array.from({ length: distant.world.terrain.length }, (_, cell) => cell).find(cell => isPassable(distant.world.terrain[cell]!) && hexDistance(cell, host.cell, distant.world.width) === 2 && !Object.values(distant.armies).some(army => army.cell === cell) && !Object.values(distant.settlements).some(town => town.cell === cell))!;
    distant.armies[armyId]!.cell = farther;
    refreshAuthoredSight(distant);
    assert(getObservation(distant, actor).settlements.some(town => town.id === settlementId));
    parity('visible-but-not-adjacent', distant);
    const hidden = base();
    hidden.armies[armyId]!.cell = hidden.settlements['settlement.6']!.cell;
    refreshAuthoredSight(hidden);
    assert(!getObservation(hidden, actor).settlements.some(town => town.id === settlementId));
    parity('charted-hidden-town', hidden);
    const spent = base();
    spent.armies[armyId]!.movement = 0;
    parity('spent-movement', spent);
    const fatigued = base();
    for (const formation of fatigued.armies[armyId]!.formations) {
        formation.morale = 1;
        formation.fatigue = 100;
    }
    parity('fatigue-is-policy-not-command-legality', fatigued);
    const blockaded = base();
    issue(blockaded, { type: 'besiege', factionId: actor, armyId, settlementId });
    parity('movement-before-already-sieged', blockaded);
    issue(blockaded, { type: 'endTurn', factionId: blockaded.turnOwnerId });
    parity('existing-town-siege-after-refresh', blockaded);
    const naval = navalCampaign();
    parity('naval-before-hidden-town', naval, naval.turnOwnerId, N.fleetId, N.islandId);
    issue(naval, { type: 'embarkArmy', factionId: naval.turnOwnerId, armyId: N.cargoId, fleetId: N.fleetId });
    parity('embarked-before-composition', naval, naval.turnOwnerId, N.cargoId, N.islandId);
    const won = base();
    issue(won, { type: 'endTurn', factionId: won.turnOwnerId });
    parity('victory-before-invalid-identities', won, actor, 'army.999999', 'settlement.999999');
    function observer(game: GameState) {
        const definition = FACTIONS[2]!;
        game.factions.push({ id: definition.id, definitionId: definition.id, name: definition.name, color: definition.color, treasury: 60, knowledge: 0 });
        game.resources.stockpiles[definition.id] = {};
        game.progression[definition.id] = { technologies: [], institutionId: null, doctrineId: null };
        game.explored[definition.id] = new Set();
        game.arcaneResearch[definition.id] = [];
        game.world.starts.push(game.world.terrain.findIndex((terrain, cell) => isPassable(terrain) && !game.world.starts.includes(cell)));
        rebaseAuthoredLand(game);
        return definition.id;
    }
    const occupied = base(), thirdBesieger = observer(occupied), occupiedHost = occupied.settlements[settlementId]!;
    const deployment = Array.from({ length: occupied.world.terrain.length }, (_, cell) => cell).find(cell => isPassable(occupied.world.terrain[cell]!) && hexDistance(cell, occupiedHost.cell, occupied.world.width) === 1 && !Object.values(occupied.armies).some(army => army.cell === cell) && !Object.values(occupied.settlements).some(town => town.cell === cell))!;
    assert(deployment !== undefined);
    const thirdArmyId = `army.${occupied.nextId++}`;
    occupied.armies[thirdArmyId] = { id: thirdArmyId, factionId: thirdBesieger, name: 'Authored third-party besieger', cell: deployment, movement: 3, formations: [createArmyFormation(thirdArmyId, 'unit.guard')] };
    refreshAuthoredSight(occupied);
    issue(occupied, { type: 'declareWar', factionId: thirdBesieger, targetFactionId: rival });
    issue(occupied, { type: 'besiege', factionId: thirdBesieger, armyId: thirdArmyId, settlementId });
    const occupiedView = getObservation(occupied, actor);
    assert.equal(occupiedView.sieges.length, 0);
    assert.deepEqual(occupiedView.visibleSiegeSettlementIds, [settlementId]);
    parity('visible-third-party-siege-with-private-record-absent', occupied);
    const fighting = borderBattleCampaign(), third = observer(fighting);
    issue(fighting, { type: 'declareWar', factionId: fighting.turnOwnerId, targetFactionId: fighting.factions[1]!.id });
    issue(fighting, { type: 'attack', factionId: fighting.turnOwnerId, armyId: 'army.2', targetArmyId: 'army.4' });
    const battle = parity('uninvolved-battle-discloses-generic-blocker-only', fighting, third, 'army.999999', 'settlement.999999');
    assert.equal(battle.view.battle, null);
    assert.equal(battle.view.battleScene, null);
    assert.equal(battle.view.pendingCapture, null);
    const conquest = conquestCampaign(), spectator = observer(conquest);
    issue(conquest, { type: 'declareWar', factionId: C.playerFactionId, targetFactionId: C.enemyFactionId });
    issue(conquest, { type: 'besiege', factionId: C.playerFactionId, armyId: C.playerArmyId, settlementId: C.settlementId });
    for (let i = 0; i < 3; i++)
        issue(conquest, { type: 'endTurn', factionId: conquest.turnOwnerId });
    issue(conquest, { type: 'assault', factionId: C.playerFactionId, settlementId: C.settlementId });
    issue(conquest, { type: 'autoResolveBattle', factionId: C.playerFactionId });
    assert(conquest.pendingCapture);
    const capture = parity('uninvolved-capture-discloses-generic-blocker-only', conquest, spectator, 'army.999999', 'settlement.999999');
    assert.equal(capture.view.battle, null);
    assert.equal(capture.view.pendingCapture, null);
    // Two legally spaced towns cannot both be adjacent to one actor. The final
    // defensive "one siege" guard is therefore tested as pure input precedence,
    // not by forging an invalid canonical two-town fixture.
    assert.equal(siegeEstablishmentBlocker({ factionId: actor, army: { factionId: actor, cell: 489, movement: 3, domain: 'land', carried: false, canAttack: true }, town: { factionId: rival, cell: 488 }, townVisible: true, atWar: true, width: 48, height: 32, townBesieged: false, armyBesieging: true }), 'An army can maintain only one siege.');
    expect(rows).toHaveLength(18);
});
const sealsBytes = readFileSync(new URL('../../../docs/development/2026-10-24-project-counterplay/historical-command-seals.json', import.meta.url), 'utf8');
const seals: {
    version: RulesVersion;
    initial: string;
    commands: GameCommand[];
    results: unknown[];
    final: string;
}[] = JSON.parse(sealsBytes);
describe('pre-refactor historical siege execution', () => {
    it('retains the actual captured seal bytes', () => expect(createHash('sha256').update(sealsBytes).digest('hex')).toBe('4cc5f888ca63cb82016a8ff88cd73e01a43e8212a0c4c31134d5366751145e73'));
    it.each(seals)('replays rules $version with exact results and final bytes', seal => {
        const game = deserializeGame(seal.initial);
        const results = seal.commands.map(command => applyCommandForVersion(game, command, seal.version));
        expect(results).toEqual(seal.results);
        expect(serializeGameForVersion(game, seal.version)).toBe(seal.final);
        const view = withRules(game, seal.version, () => getObservation(game, game.turnOwnerId));
        if (seal.version < 35) {
            expect(view).not.toHaveProperty('siegeEstablishment');
            expect(view).not.toHaveProperty('strategicCommandBlocker');
        }
        else {
            expect(view.siegeEstablishment).toBe(true);
            expect(view.strategicCommandBlocker).toBeNull();
        }
    });
});
it('short-circuits obvious identity refusal before reading later global facts', () => {
    const late = () => { throw new Error('An obvious refusal must not scan later facts.'); };
    expect(siegeEstablishmentBlocker({ factionId: 'faction.own', army: undefined, town: undefined, width: 48, height: 32,
        get townVisible() { return late(); }, get atWar() { return late(); }, get townBesieged() { return late(); }, get armyBesieging() { return late(); },
    })).toBe('You do not control that army.');
});
