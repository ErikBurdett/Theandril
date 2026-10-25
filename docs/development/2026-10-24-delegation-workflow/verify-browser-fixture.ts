/** Local draft proof only. Does not run Playwright or mutate application code. */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { serializeGame } from '../../../packages/sim/src';
import { armyOrderFilterScene } from './army-order-filter-fixture.draft';
const fixture = armyOrderFilterScene(), folder = new URL('./', import.meta.url);
const text = serializeGame(fixture.game);
writeFileSync(new URL('browser-fixture.theandril', folder), text);
writeFileSync(new URL('browser-fixture-archive.json', folder), JSON.stringify(fixture.archive, null, 2) + '\n');
const evidence = { authored: 'theaterCampaign101 open land, two hearths and treasury; names and one foreign guard authored before archive. All orders, movement exhaustion and interrupted travel canonical.',
  hash: fixture.hash, sha256: createHash('sha256').update(text).digest('hex'), counts: fixture.counts,
  actors: { posted: fixture.posted, blockedPosting: fixture.blockedPosting, waiting: fixture.waiting, paused: fixture.paused },
  pausedMovement: fixture.game.armies[fixture.paused.id]!.movement, pausedRoute: fixture.route,
  postingReason: fixture.postingReason, waitingReason: fixture.waitingReason,
  coverage: fixture.archive.coverage, setupCommands: fixture.archive.records.map(record => ({ command: record.command, ok: record.ok, error: record.error })),
  strictLoadAndExactReplay: true, browserExecuted: false };
writeFileSync(new URL('browser-fixture-evidence.json', folder), JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify(evidence, null, 2));
