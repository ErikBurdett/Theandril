import { test } from 'vitest';
import { expectEarnedLongFormVictory, PACING_TIMEOUT, PACING_TITLE, type PacingCampaign } from './testing/pacing-campaign';

// Rules 18 targets about 200 (Standard), 300 (Long) and 350–400 (Epic) turns on a
// full map with twelve realms. These four-realm tiny campaigns are a fast proxy
// for that curve, not the target itself: measure the real thing with
// `pnpm measure:pacing` (local only) and derive these bounds from it rather than
// defending them. Rules 29 measured these two at turns 201 and 290.
// Epic runs in pacing-epic.test.ts so the two longest cases run in parallel files.
const campaigns: PacingCampaign[] = [
  { pace: 'standard', seed: 74, minimum: 150, maximum: 300 },
  { pace: 'long', seed: 99, minimum: 225, maximum: 375 },
];

test.each(campaigns)(PACING_TITLE, expectEarnedLongFormVictory, PACING_TIMEOUT);
