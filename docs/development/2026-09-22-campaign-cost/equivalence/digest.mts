// Usage: node --import tsx digest.ts <repoRoot> <scenario...>
// Emits one JSON line per scenario: command/turn-hash digest, final hash and time.
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { pathToFileURL } from 'node:url';
const root = process.argv[2]!;
const sim = await import(pathToFileURL(`${root}/packages/sim/src/index.ts`).href);
const ai = await import(pathToFileURL(`${root}/packages/ai/src/index.ts`).href);
type Spec = { seed: number; size: string; factionCount: number; pace: string; generatorVersion?: number; rounds: number; aiOptions?: boolean; untilVictory: boolean };
const specs: Record<string, Spec> = {
  'archive-epic': { seed: 20260905, size: 'tiny', factionCount: 4, pace: 'epic', rounds: 1401, aiOptions: true, untilVictory: true },
  'archive-short': { seed: 20260905, size: 'tiny', factionCount: 4, pace: 'short', rounds: 151, aiOptions: true, untilVictory: true },
  'pacing-epic-74': { seed: 74, size: 'tiny', factionCount: 4, pace: 'epic', rounds: 1400, untilVictory: true },
  'pacing-epic-99': { seed: 99, size: 'tiny', factionCount: 4, pace: 'epic', rounds: 1400, untilVictory: true },
  'pacing-std-74': { seed: 74, size: 'tiny', factionCount: 4, pace: 'standard', rounds: 400, untilVictory: true },
  'pacing-std-99g5': { seed: 99, size: 'tiny', factionCount: 4, pace: 'standard', generatorVersion: 5, rounds: 400, untilVictory: true },
  'contact-std-4': { seed: 748291, size: 'standard', factionCount: 4, pace: 'long', rounds: 100, untilVictory: false },
  'contact-std-24': { seed: 748291, size: 'standard', factionCount: 24, pace: 'long', rounds: 60, untilVictory: false },
  'contact-huge-32': { seed: 748291, size: 'huge', factionCount: 32, pace: 'long', rounds: 60, untilVictory: false },
};
for (const name of process.argv.slice(3)) {
  const spec = specs[name]!; const start = performance.now();
  const game = sim.createGame({ seed: spec.seed, size: spec.size, factionCount: spec.factionCount, pace: spec.pace, ...(spec.generatorVersion ? { generatorVersion: spec.generatorVersion } : {}) });
  const h = createHash('sha256'); let commands = 0;
  const view = (id: string) => sim.getObservation(game, id, ...(spec.aiOptions ? [ai.aiObservationOptions(game.turn)] : []));
  const issue = (c: unknown) => { const r = sim.applyCommand(game, c); commands++; h.update(JSON.stringify(c)); h.update(JSON.stringify(r)); if (!r.ok) throw new Error(`${name} turn ${game.turn}: ${r.error}`); };
  for (let round = 0; round < spec.rounds && !game.victory; round++) {
    for (const f of game.factions) {
      if (game.victory) break;
      for (const c of ai.planTurn(view(f.id))) {
        if (game.victory) break;
        issue(c);
        for (let d = 0; game.battle || game.pendingCapture; d++) {
          if (d > 4) throw new Error('decision loop');
          if (game.battle) { const b = game.battle; issue({ type: 'autoResolveBattle', factionId: [b.attackerFactionId, b.defenderFactionId].includes(game.turnOwnerId) ? game.turnOwnerId : b.attackerFactionId }); }
          else issue(ai.planTurn(view(game.pendingCapture.factionId))[0]);
        }
      }
    }
    if (!game.victory || spec.untilVictory) { if (!game.victory) issue({ type: 'endTurn', factionId: game.turnOwnerId }); }
    h.update(sim.stateHash(game));
  }
  console.log(JSON.stringify({ name, turn: game.turn, victory: game.victory?.path ?? null, commands, digest: h.digest('hex').slice(0, 16), final: sim.stateHash(game), bytes: createHash('sha256').update(sim.serializeGame(game)).digest('hex').slice(0, 16), seconds: +((performance.now() - start) / 1000).toFixed(2) }));
}
