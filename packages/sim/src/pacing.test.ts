import { describe, expect, it } from 'vitest';
import { CAMPAIGN_PACES, checksum, LEGACY_CAMPAIGN_PACES, SCHEMA8_CAMPAIGN_PACES, SCHEMA17_CAMPAIGN_PACES, TECHNOLOGIES } from '@theandril/content';
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
  it('keeps every response window and civic price while rules 18 shortens long campaigns', () => {
    expect(LEGACY_CAMPAIGN_PACES.epic.projectCoinCost).toBe(60_000);
    expect(SCHEMA8_CAMPAIGN_PACES.epic.projectCoinCost).toBe(75_000);
    expect(SCHEMA17_CAMPAIGN_PACES.epic.projectCoinCost).toBe(240_000);
    expect(CAMPAIGN_PACES.long.projectCoinCost).toBeLessThan(SCHEMA17_CAMPAIGN_PACES.long.projectCoinCost);
    expect(CAMPAIGN_PACES.epic.projectCoinCost).toBeLessThan(SCHEMA17_CAMPAIGN_PACES.epic.projectCoinCost);
    expect(CAMPAIGN_PACES.short).toEqual(LEGACY_CAMPAIGN_PACES.short);
    for (const pace of paces) {
      expect(CAMPAIGN_PACES[pace].civicKnowledgeCost).toBe(LEGACY_CAMPAIGN_PACES[pace].civicKnowledgeCost);
      expect(CAMPAIGN_PACES[pace].projectActiveTurns).toBe(LEGACY_CAMPAIGN_PACES[pace].projectActiveTurns);
    }
  });

  // One case per pricing era, at the exact affordability boundary.
  it.each([
    { version: 7, price: LEGACY_CAMPAIGN_PACES.epic.projectCoinCost },
    { version: 8, price: SCHEMA8_CAMPAIGN_PACES.epic.projectCoinCost },
    { version: 17, price: SCHEMA17_CAMPAIGN_PACES.epic.projectCoinCost },
    { version: 18, price: CAMPAIGN_PACES.epic.projectCoinCost },
  ] as const)('rules $version quotes and charges the Epic project at $price coin', ({ version, price }) => {
    for (const treasury of [price - 1, price]) {
      const state = prosperityCampaign(); state.pace = 'epic';
      const faction = state.factions[0]!; faction.knowledge = 1600;
      expect(applyCommandForVersion(state, research, version)).toMatchObject({ ok: true });
      expect(applyCommandForVersion(state, { type: 'adoptInstitution', factionId, institutionId: 'institution.charter_compact' }, version)).toMatchObject({ ok: true });
      faction.treasury = treasury;
      const affordable = treasury >= price, before = stateHash(state);
      const quote = withRules(state, version, () => getObservation(state, factionId).progression.project);
      expect(quote).toMatchObject({ coinCost: price, activeTurns: 60 });
      expect(quote.blockers).toEqual(affordable ? [] : [`Requires ${price} coin upfront; cancellation gives no refund.`]);
      const result = applyCommandForVersion(state, start, version);
      expect(result.ok).toBe(affordable);
      if (affordable) {
        expect(faction.treasury).toBe(0);
        expect(state.projects[0]).toMatchObject({ progress: 0, requiredTurns: 60, status: 'active' });
      } else expect(stateHash(state)).toBe(before);
      expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    }
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
