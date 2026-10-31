import { expect, test } from 'vitest';
import { naturalFeatures } from '@theandril/mapgen';
import { applyCommand, createGame, getObservation, serializeGame, deserializeGame, stateHash } from './index';
import { withRules } from './rules';
import { PRE_RITE_CONTENT_HASH } from './save';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';

test('rules 39 shows natural features only on ground in sight, omitting zero masks and remembered ground', () => {
  const state = createGame({ seed: 20260906, size: 'tiny', factionCount: 2 });
  const factionId = state.turnOwnerId;
  expect(applyCommand(state, { type: 'found', factionId, armyId: 'army.1', name: 'Glasswatch' }).ok).toBe(true);
  const view = getObservation(state, factionId);
  const visible = view.cells.filter(cell => cell.visible), remembered = view.cells.filter(cell => !cell.visible);
  expect(visible.length).toBeGreaterThan(0);
  for (const cell of visible) {
    const features = naturalFeatures(state.world, cell.cell);
    if (features) expect(cell.featureMask).toBe(features); else expect(cell).not.toHaveProperty('featureMask');
  }
  for (const cell of remembered) expect(cell).not.toHaveProperty('featureMask');
  expect(visible.some(cell => cell.featureMask !== undefined)).toBe(true);
  // Historical readings stay exactly as they were, and the canonical state is untouched.
  const before = stateHash(state);
  const historical = withRules(state, 38, () => getObservation(state, factionId));
  expect(historical.cells.every(cell => !('featureMask' in cell))).toBe(true);
  expect(stateHash(state)).toBe(before);
  expect(stateHash(deserializeGame(serializeGame(state)))).toBe(before);
});

test('rules 39 remembers every surveyed hex, found or empty, bounded and oldest first, and keeps it out of older rules', async () => {
  const { applyCommandForVersion, arcaneSites, serializeGameForVersion, stateHashForVersion } = await import('./index');
  const state = createGame({ seed: 20260906, size: 'tiny', factionCount: 2 });
  const factionId = state.turnOwnerId;
  expect(applyCommand(state, { type: 'found', factionId, armyId: 'army.1', name: 'Glasswatch' }).ok).toBe(true);
  state.factions[0]!.treasury = 100_000;
  const before = serializeGame(state);
  // A world with no surveyed ground still projects to rules 38 and comes back identical.
  expect(stateHash(deserializeGame(serializeGameForVersion(state, 38)))).toBe(stateHash(state));
  const army = state.armies['army.2']!;
  const seam = arcaneSites(state.world)[0]!.cell;
  const empty = army.cell;
  expect(applyCommand(state, { type: 'searchArcane', factionId, armyId: army.id })).toMatchObject({ ok: true, events: [expect.objectContaining({ type: expect.stringMatching(/arcane_survey_empty|arcane_site_found/) })] });
  expect(getObservation(state, factionId).arcaneSearches).toEqual([empty]);
  army.cell = seam; army.movement = 2; refreshAuthoredSight(state);
  expect(applyCommand(state, { type: 'searchArcane', factionId, armyId: army.id })).toMatchObject({ ok: true });
  expect(state.arcaneSearches[factionId]).toEqual([empty, seam]);
  expect(getObservation(state, state.factions[1]!.id).arcaneSearches).toEqual([]);
  // Surveying the same hex again moves it to the newest place rather than listing it twice.
  army.movement = 2;
  expect(applyCommand(state, { type: 'searchArcane', factionId, armyId: army.id })).toMatchObject({ ok: true });
  expect(state.arcaneSearches[factionId]).toEqual([seam, empty].reverse());
  const restored = deserializeGame(serializeGame(state));
  expect(restored.arcaneSearches).toEqual(state.arcaneSearches);
  expect(stateHash(restored)).toBe(stateHash(state));
  // Remembered ground is a rules-39 fact: older projections and rules refuse it.
  expect(() => serializeGameForVersion(state, 38)).toThrow('surveyed ground');
  expect(() => stateHashForVersion(state, 38)).toThrow('surveyed ground');
  expect(() => applyCommandForVersion(state, { type: 'endTurn', factionId }, 38)).toThrow('surveyed ground');
  // The register is bounded: the oldest hex gives way.
  const passable = Array.from({ length: state.world.terrain.length }, (_, cell) => cell).filter(cell => state.world.terrain[cell] !== 0 && state.world.terrain[cell] !== 4);
  for (const cell of passable.slice(0, 300)) { army.cell = cell; army.movement = 2; expect(applyCommand(state, { type: 'searchArcane', factionId, armyId: army.id }).ok).toBe(true); }
  refreshAuthoredSight(state);
  const expected: number[] = [];
  for (const cell of [empty, seam, seam, ...passable.slice(0, 300)]) { const at = expected.indexOf(cell); if (at >= 0) expected.splice(at, 1); expected.push(cell); if (expected.length > 256) expected.shift(); }
  expect(state.arcaneSearches[factionId]).toEqual(expected);
  expect(state.arcaneSearches[factionId]).toHaveLength(256);
  expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  // A rules-38 envelope migrates with an empty register.
  const old = JSON.parse(before); old.version = 38; old.contentHash = PRE_RITE_CONTENT_HASH; delete old.state.arcaneSearches; delete old.state.wards; delete old.state.hearthEvents;
  const { checksum } = await import('@theandril/content');
  old.stateChecksum = checksum(JSON.stringify(old.state));
  const migrated = deserializeGame(JSON.stringify(old));
  expect(migrated.arcaneSearches).toEqual({ [factionId]: [], [state.factions[1]!.id]: [] });
});
