import { expect, test } from 'vitest';
import { runOverseasCampaign } from '../../../scripts/benchmark-overseas-ai';

test.each([
  { seed: 20260905, size: 'tiny', layout: 'islands', requireDeep: true },
  { seed: 20260905, size: 'small', layout: 'islands', requireDeep: true },
  // Archipelago channels may allow a legal shallow crossing: do not require the
  // planner to make an unnecessary ocean detour. Both island cases prove deep travel.
  { seed: 74, size: 'tiny', layout: 'archipelago', requireDeep: false },
] as const)('generated $size / $layout / $seed earns an overseas colony using observed commands', setup => {
  const result = runOverseasCampaign({ ...setup, factionCount: 4, limit: 150 });
  expect(result.noGrants).toBe(true);
  expect(result.rejected).toBe(0);
  expect(result.colonies.some(colony => (!setup.requireDeep || colony.deepVoyage) && colony.landmass !== colony.originLandmass)).toBe(true);
  expect(result.first['building.harbor']).toBeGreaterThan(1);
  expect(result.first['unit.transport']).toBeGreaterThan(result.first['building.harbor']!);
  expect(result.first['embarkArmy']).toBeGreaterThan(result.first['unit.transport']!);
  if (setup.requireDeep) expect(result.first['technology.ocean_navigation']).toBeGreaterThan(result.first['technology.coastal_navigation']!);
  expect(result.mirroredCommands).toBeGreaterThan(0);
  expect(result.fullReplayCommands).toBe(result.commands);
  expect(result.exactSave && result.exactReplay).toBe(true);
});
