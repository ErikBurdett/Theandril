/** Outside discovery: intentional policy regression, run only as a diagnostic. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyCommand, deserializeGame, getObservation } from '../../../packages/sim/src';
import { planTurnWithReasons } from '../../../packages/ai/src';
const game = deserializeGame(readFileSync(new URL('near-complete.theandril', import.meta.url), 'utf8'));
const factionId = 'faction.reedbound_council', enemy = 'faction.ashen_compact';
assert(applyCommand(game, { type: 'proposePeace', factionId: enemy, targetFactionId: factionId, terms: { offerCoin: 0, requestCoin: 0, truceTurns: 10 } }).ok);
const command = planTurnWithReasons(getObservation(game, factionId)).commands[0];
assert.deepEqual(command, { type: 'respondPeace', factionId, offerId: game.diplomacy.offers[0]!.id, accept: false },
  'An otherwise acceptable peace must not surrender a real immediate interruption of the enemy project that finishes next turn.');
