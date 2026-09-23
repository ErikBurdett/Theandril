import { test } from 'vitest';
import { expectEarnedLongFormVictory, PACING_TIMEOUT, PACING_TITLE, type PacingCampaign } from './testing/pacing-campaign';

// A four-realm tiny map is a fast proxy, not the campaign the 350-400 target
// describes: it ends sooner because there is less world to contest, and two epic
// seeds on it sit over a hundred turns apart. The headline case - a standard map
// with twelve realms - measured turn 388 under rules 29, inside that band. Check
// it with `pnpm measure:pacing` (local only) and re-derive these bounds from what
// it reports rather than holding them.
const campaigns: PacingCampaign[] = [{ pace: 'epic', seed: 74, minimum: 250, maximum: 450 }];

test.each(campaigns)(PACING_TITLE, expectEarnedLongFormVictory, PACING_TIMEOUT);
