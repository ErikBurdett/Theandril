import { readFile, writeFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { UNITS } from '@theandril/content';
import { doctrineEffects } from '../../../packages/sim/src/progression.ts';
import { battleDevelopmentEffects } from '../../../packages/sim/src/combat/development-snapshot.ts';
import { deserializeGame } from '@theandril/sim';
const root = '/home/telephoneheater/Work/Theandril/docs/hermes-analysis/qa';
const captured = JSON.parse(gunzipSync(await readFile(`${root}/captured-tiny-standard-20260905.json.gz`)).toString('utf8'));
const saved = JSON.parse(captured.snapshot).state;
const mismatches = [];
for (const battle of saved.battleReports) for (const side of ['attacker', 'defender']) for (const formation of battle.combat[side]) {
  const unit = UNITS.find(item => item.id === formation.unitId), binding = battle.formationBindings.find(item => item.battleFormationId === formation.id);
  const effects = doctrineEffects(battle[side + 'DoctrineId']);
  const leaders = battle.characterSnapshots.filter(item => item.armyId === binding.armyId).reduce((sum, item) => ({ attack: sum.attack + item.leadership.attack, armor: sum.armor + item.leadership.armor }), { attack: 0, armor: 0 });
  const snapshot = battle.developmentSnapshots?.find(item => item.formationId === binding.formationId);
  const training = battleDevelopmentEffects(snapshot, unit.id, saved.progression.find(item => item.factionId === battle[side + 'FactionId']));
  const expected = { attack: unit.attack + effects.attack + leaders.attack + training.attack, armor: unit.armor + effects.armor + leaders.armor + training.armor + (side === 'defender' ? battle.fortification : 0), initiative: unit.initiative + training.initiative, range: unit.range + training.range, moraleCap: Math.min(100, unit.morale + training.morale), maxStrength: formation.id === battle.militiaId ? formation.maxStrength : unit.strength };
  const different = Object.entries(expected).filter(([key, value]) => key === 'moraleCap' ? formation.morale > value : formation[key] !== value);
  if (different.length) mismatches.push({ battleId: battle.id, battleTurn: battle.turn, side, binding, formation, expected, different, snapshot, leaders, effects, training });
}
let error;
try { deserializeGame(captured.snapshot); } catch (cause) { error = String(cause); }
const report = { error, capturedTurn: saved.turn, retainedReports: saved.battleReports.length, mismatches };
await writeFile(`${root}/save-mismatches.json`, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
