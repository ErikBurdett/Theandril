import { describe, expect, it } from 'vitest';
import { CAMPAIGN_PACES, checksum, LEGACY_CAMPAIGN_PACES, SCHEMA8_CAMPAIGN_PACES, TECHNOLOGIES } from '@theandril/content';
import { prosperityCampaign, PROSPERITY_FIXTURE } from '../../test-fixtures/src/victory-fixture';
import { applyCommand, applyCommandForVersion, createGame, deserializeGame, getObservation, replayGame, serializeGame, settlementYields, stateHash } from './index';
import type { CampaignPace, GameCommand, GameState } from './index';
import { withRules } from './rules';

const paces: CampaignPace[] = ['short', 'standard', 'long', 'epic'];
const factionId = 'faction.ashen_compact';
const research: GameCommand = { type: 'research', factionId, technologyId: 'technology.civic_accounts' };
const start: GameCommand = { type: 'startVictoryProject', factionId, settlementId: PROSPERITY_FIXTURE.hostId };
const end: GameCommand = { type: 'endTurn', factionId };
const issue = (state: GameState, command: GameCommand): void => { expect(applyCommand(state, command), JSON.stringify(command)).toMatchObject({ ok: true }); };
const reject = (state: GameState, command: GameCommand): void => { const hash = stateHash(state); expect(applyCommand(state, command).ok).toBe(false); expect(stateHash(state)).toBe(hash); };

describe('canonical campaign pace', () => {
  it('scales modern late investment while freezing historical profiles and all response windows', () => {
    expect(LEGACY_CAMPAIGN_PACES.epic.projectCoinCost).toBe(60_000);
    expect(SCHEMA8_CAMPAIGN_PACES.epic.projectCoinCost).toBe(75_000);
    expect(CAMPAIGN_PACES.epic.projectCoinCost).toBe(240_000);
    expect(CAMPAIGN_PACES.epic.civicKnowledgeCost).toBe(LEGACY_CAMPAIGN_PACES.epic.civicKnowledgeCost);
    expect(CAMPAIGN_PACES.epic.projectActiveTurns).toBe(LEGACY_CAMPAIGN_PACES.epic.projectActiveTurns);
    expect(CAMPAIGN_PACES.short).toEqual(LEGACY_CAMPAIGN_PACES.short);
    for (const pace of paces) {
      expect(CAMPAIGN_PACES[pace].civicKnowledgeCost).toBe(LEGACY_CAMPAIGN_PACES[pace].civicKnowledgeCost);
      expect(CAMPAIGN_PACES[pace].projectActiveTurns).toBe(LEGACY_CAMPAIGN_PACES[pace].projectActiveTurns);
    }
  });

  it.each(([4, 5, 6, 7, 8, 9] as const).flatMap(version => [60_000, 74_999, 75_000, 239_999, 240_000].map(treasury => ({ version, treasury }))))('quotes and actually charges rules $version Epic at a $treasury-coin boundary', ({ version, treasury }) => {
    // Authored infrastructure isolates affordability; research, institution and
    // project activation still execute through the actual versioned commands.
    // No current state is substituted for an independently captured old archive.
    const state = prosperityCampaign(); state.pace = 'epic';
    const faction = state.factions[0]!; faction.knowledge = 1600;
    expect(applyCommandForVersion(state, research, version)).toMatchObject({ ok: true });
    expect(applyCommandForVersion(state, { type: 'adoptInstitution', factionId, institutionId: 'institution.charter_compact' }, version)).toMatchObject({ ok: true });
    faction.treasury = treasury;
    const price = version < 8 ? 60_000 : version === 8 ? 75_000 : 240_000, affordable = treasury >= price;
    const before = stateHash(state);
    const quote = withRules(state, version, () => getObservation(state, factionId).progression.project);
    expect(quote).toMatchObject({ coinCost: price, activeTurns: 60 });
    expect(quote.eligibleSettlementIds.includes(PROSPERITY_FIXTURE.hostId)).toBe(affordable);
    expect(quote.blockers).toEqual(affordable ? [] : [`Requires ${price} coin upfront; cancellation gives no refund.`]);
    expect(getObservation(state, factionId).progression.project.coinCost).toBe(240_000);
    expect(stateHash(state)).toBe(before);
    const mirror = deserializeGame(serializeGame(state));
    const result = applyCommandForVersion(state, start, version);
    expect(result).toEqual(applyCommandForVersion(mirror, start, version));
    expect(result.ok).toBe(affordable);
    if (affordable) {
      expect(faction.treasury).toBe(treasury - price);
      expect(state.projects[0]).toMatchObject({ progress: 0, requiredTurns: 60, status: 'active' });
      expect(result.events.every(event => event.type === 'victory_project_started' && event.message.includes(`committed ${price} coin`))).toBe(true);
    } else {
      expect(result).toMatchObject({ events: [], error: `Requires ${price} coin upfront; cancellation gives no refund.` });
      expect(state.projects).toEqual([]); expect(stateHash(state)).toBe(before);
    }
    expect(stateHash(mirror)).toBe(stateHash(state));
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it('defaults to standard while preserving identical early economy and movement', () => {
    expect(createGame({ seed: 17, size: 'tiny' }).pace).toBe('standard');
    const outputs = paces.map(pace => {
      const state = createGame({ seed: 17, size: 'tiny', factionCount: 2, pace });
      issue(state, { type: 'found', factionId, armyId: 'army.1', name: 'Pace hearth' });
      issue(state, end);
      const view = getObservation(state, factionId);
      expect(view.pace).toBe(pace);
      expect(view.progression.technologyChoices.find(choice => choice.id === 'technology.cinder_masonry')?.knowledgeCost).toBe(TECHNOLOGIES.find(item => item.id === 'technology.cinder_masonry')?.knowledgeCost);
      return { armies: view.armies, town: view.settlements, treasury: view.treasury, knowledge: view.knowledge, yields: settlementYields(state, state.settlements['settlement.5']!) };
    });
    for (const result of outputs) expect(result).toEqual(outputs[0]);
  });

  it.each(paces)('uses %s costs for both authoritative eligibility and actual spending', pace => {
    const state = prosperityCampaign(); state.pace = pace;
    const profile = CAMPAIGN_PACES[pace]; const faction = state.factions[0]!;
    faction.knowledge = profile.civicKnowledgeCost - 1; reject(state, research);
    let view = getObservation(state, factionId);
    expect(view.progression.technologyChoices.find(choice => choice.id === 'technology.civic_accounts')).toMatchObject({ knowledgeCost: profile.civicKnowledgeCost, available: false });
    faction.knowledge++; issue(state, research); expect(faction.knowledge).toBe(0);
    issue(state, { type: 'adoptInstitution', factionId, institutionId: 'institution.charter_compact' });
    faction.treasury = profile.projectCoinCost - 1; reject(state, start);
    faction.treasury++; view = getObservation(state, factionId);
    expect(view.progression.project).toMatchObject({ coinCost: profile.projectCoinCost, activeTurns: profile.projectActiveTurns, blockers: [] });
    issue(state, start); expect(faction.treasury).toBe(0);
    expect(state.projects[0]?.requiredTurns).toBe(profile.projectActiveTurns);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it.each(paces)('completes %s through the full response window with no fixed minimum-turn lock', pace => {
    // Prepared infrastructure and funding isolate the completion rule, not normal duration.
    const state = prosperityCampaign(); state.pace = pace;
    state.factions[0]!.knowledge = CAMPAIGN_PACES[pace].civicKnowledgeCost;
    state.factions[0]!.treasury = CAMPAIGN_PACES[pace].projectCoinCost + 30;
    issue(state, research); issue(state, { type: 'adoptInstitution', factionId, institutionId: 'institution.charter_compact' });
    const initial = serializeGame(state); const turn = state.turn; const commands: GameCommand[] = [start]; issue(state, start);
    for (let step = 1; step <= CAMPAIGN_PACES[pace].projectActiveTurns; step++) {
      issue(state, end); commands.push(end);
      expect(state.victory !== null).toBe(step === CAMPAIGN_PACES[pace].projectActiveTurns);
    }
    expect(state.turn).toBe(turn + CAMPAIGN_PACES[pace].projectActiveTurns);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    expect(stateHash(replayGame(initial, commands))).toBe(stateHash(state));
  });

  it('rejects unknown or missing pace and project response windows from another pace', () => {
    const state = prosperityCampaign(); issue(state, research); issue(state, { type: 'adoptInstitution', factionId, institutionId: 'institution.charter_compact' }); issue(state, start);
    interface Save { state: { pace?: string; projects: { requiredTurns: number }[] }; stateChecksum: string }
    for (const mutate of [
      (save: Save) => { save.state.pace = 'unknown'; },
      (save: Save) => { delete save.state.pace; },
      (save: Save) => { save.state.projects[0]!.requiredTurns = CAMPAIGN_PACES.epic.projectActiveTurns; },
      (save: Save) => { save.state.pace = 'epic'; },
    ]) {
      const save: Save = JSON.parse(serializeGame(state)); mutate(save); save.stateChecksum = checksum(JSON.stringify(save.state));
      expect(() => deserializeGame(JSON.stringify(save))).toThrow();
    }
  });
});
