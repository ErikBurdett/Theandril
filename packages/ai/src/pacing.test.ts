import { test } from 'vitest';
import { expectEarnedLongFormVictory, PACING_TIMEOUT, PACING_TITLE, type PacingCampaign } from './testing/pacing-campaign';

// Epic campaigns run in pacing-epic-*.test.ts so the long cases execute in parallel files.
const campaigns: PacingCampaign[] = [
  { pace: 'standard', seed: 74, minimum: 150, maximum: 400 },
  // Preserve the original geography's200-turn floor as its own regression. New
  // generator6 has deliberately different geography and can earn earlier conquest;
  // the strict empire/battle/capture guard below remains required before turn200.
  { pace: 'standard', seed: 99, generatorVersion: 5, minimum: 200, maximum: 400 },
  { pace: 'standard', seed: 99, generatorVersion: 6, minimum: 150, maximum: 400 },
];

test.each(campaigns)(PACING_TITLE, expectEarnedLongFormVictory, PACING_TIMEOUT);
