/** Diagnostic-only save reproducer; no canonical mutation or alternate gameplay. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { UNITS } from '@theandril/content';
import { deserializeGame, type CampaignBattle } from '@theandril/sim';
import { doctrineEffects } from '../../../packages/sim/src/progression';
import { battleDevelopmentEffects } from '../../../packages/sim/src/combat/development-snapshot';
const path = process.argv[2] ?? 'docs/hermes-analysis/campaigns/runs/D-standard24-seed74/final.json.gz';
const save = gunzipSync(readFileSync(path)).toString();
let failure: string | null = null;
try { deserializeGame(save); } catch (e) { failure = String(e); }
const raw = JSON.parse(save).state as { turn: number; battleReports: CampaignBattle[]; progression: { factionId: string; technologies: string[]; institutionId: string | null; doctrineId: string | null }[] };
const mismatches: unknown[] = [];
for (const battle of raw.battleReports) for (const [defending, formations] of [[false, battle.combat.attacker], [true, battle.combat.defender]] as const) for (const formation of formations) {
  const binding = battle.formationBindings.find(b => b.battleFormationId === formation.id)!;
  const unit = UNITS.find(u => u.id === formation.unitId)!;
  const doctrine = doctrineEffects(defending ? battle.defenderDoctrineId : battle.attackerDoctrineId);
  const leadership = battle.characterSnapshots.filter(c => c.armyId === binding.armyId).reduce((s, c) => ({ attack: s.attack + c.leadership.attack, armor: s.armor + c.leadership.armor }), { attack: 0, armor: 0 });
  const policy = raw.progression.find(p => p.factionId === (defending ? battle.defenderFactionId : battle.attackerFactionId));
  const training = battleDevelopmentEffects(battle.developmentSnapshots?.find(d => d.formationId === binding.formationId), unit.id, policy);
  const expected = { attack: unit.attack + doctrine.attack + leadership.attack + training.attack, armor: unit.armor + doctrine.armor + leadership.armor + training.armor + (defending ? battle.fortification : 0), initiative: unit.initiative + training.initiative, range: unit.range + training.range, moraleCeiling: Math.min(100, unit.morale + training.morale), maxStrength: formation.id === battle.militiaId ? formation.maxStrength : unit.strength };
  if (formation.attack !== expected.attack || formation.armor !== expected.armor || formation.initiative !== expected.initiative || formation.range !== expected.range || formation.morale > expected.moraleCeiling || formation.maxStrength !== expected.maxStrength) mismatches.push({ battleId: battle.id, battleTurn: battle.turn, formationId: formation.id, unitId: unit.id, defending, expected, actual: { attack: formation.attack, armor: formation.armor, initiative: formation.initiative, range: formation.range, morale: formation.morale, maxStrength: formation.maxStrength }, development: battle.developmentSnapshots?.find(d => d.formationId === binding.formationId), characterSnapshots: battle.characterSnapshots, usedAbilities: battle.usedAbilities });
}
console.log(JSON.stringify({ path, turn: raw.turn, failure, mismatches }, null, 2));
assert.equal(failure, 'Error: Invalid save: battle formation differs from unit content', 'Exact retained corruption symptom no longer reproduces');
assert.ok(mismatches.length, 'No stat mismatch explains the recorded validation failure');
