import { test } from 'vitest';
import { expectEarnedLongFormVictory, PACING_TIMEOUT, PACING_TITLE, type PacingCampaign } from './testing/pacing-campaign';

// Earlier character rules let seed99 earn victory at648 with14towns/514battles.
// Apply the same earned-conquest exception as seed 74; the separate archived
// seed-20260905 regression still requires 800–1,400 turns and a turn-500 resume.
const campaigns: PacingCampaign[] = [{ pace: 'epic', seed: 99, minimum: 500, maximum: 1400 }];

test.each(campaigns)(PACING_TITLE, expectEarnedLongFormVictory, PACING_TIMEOUT);
