import { applyCommand, createArmyFormation, deserializeGame, serializeGame, type GameCommand } from '@theandril/sim';
import { borderBattleCampaign } from '../../packages/test-fixtures/src/combat-fixture';
import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';

/** Explicitly authored scale workload: funded veteran officers and infrastructure,
 * forty actual formations, no injected battle, damage, targets or outcome. */
export function fullBattlefieldCampaign() {
  const state = borderBattleCampaign();
  const issue = (command: GameCommand) => { const result = applyCommand(state, command); if (!result.ok) throw new Error(`Battlefield fixture ${command.type}: ${result.error}`); };
  for (const [index, faction] of state.factions.entries()) {
    const army = state.armies[index ? 'army.4' : 'army.2']!, original = army.cell;
    const home = Object.values(state.settlements).find(town => town.factionId === faction.id)!;
    faction.treasury = 2000; faction.knowledge = 500;
    if (!home.buildings.includes('building.archive')) home.buildings.push('building.archive');
    army.cell = home.cell; refreshAuthoredSight(state);
    for (const definitionId of ['character.marshal', 'character.waykeeper', 'character.engineer']) {
      issue({ type: 'recruitCharacter', factionId: faction.id, settlementId: home.id, definitionId });
      const character = Object.values(state.characters).find(item => item.factionId === faction.id && item.definitionId === definitionId)!;
      issue({ type: 'assignCharacter', factionId: faction.id, characterId: character.id, armyId: army.id });
      if (definitionId === 'character.marshal') {
        character.experience = 72; // Authored veteran XP, not claimed earned in this run.
        for (const skillId of ['skill.decisive', 'skill.muster_rolls', 'skill.field_orders']) issue({ type: 'promoteCharacter', factionId: faction.id, characterId: character.id, skillId });
      }
    }
    for (const discoveryId of ['arcane.ember_projection', 'arcane.rune_binding']) issue({ type: 'researchArcane', factionId: faction.id, discoveryId });
    const roles = ['unit.guard', 'unit.spearman', 'unit.scout', 'unit.heavy_infantry', 'unit.cavalry'];
    army.formations = Array.from({ length: 20 }, (_, i) => createArmyFormation(`army.${state.nextId++}`, roles[i % roles.length]!)).sort((a, b) => a.id < b.id ? -1 : 1);
    army.cell = original; army.movement = 2;
  }
  refreshAuthoredSight(state);
  return deserializeGame(serializeGame(state));
}
