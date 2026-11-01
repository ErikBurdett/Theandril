import { z } from 'zod';
import { CHARACTER_DEFINITIONS, CHARACTER_SKILLS } from './characters';
import { FACTIONS } from './factions';

/** Rules 64: notable characters. Every culture has one figure of the age
 * whose name is known beyond its borders. The first time a realm of that
 * culture appoints a character of the figure's role, it is that figure who
 * answers, with their specialization already theirs and their story on the
 * sheet; a second appointment is an ordinary one. Data only; the simulation
 * appoints them. */
const id = z.string().regex(/^notable\.[a-z_]+$/);
const name = z.string().min(1).max(60);
const lore = z.string().min(1).max(300);
export const notableCharacterSchema = z.object({ id, factionId: z.string().regex(/^faction\.[a-z_]+$/), definitionId: z.string().regex(/^character\.[a-z_]+$/), name, lore, skillId: z.string().regex(/^skill\.[a-z_]+$/), sinceRules: z.literal(64) }).strict();
export type NotableCharacter = z.infer<typeof notableCharacterSchema>;
const notable = (id: string, factionId: string, definitionId: string, name: string, skillId: string, lore: string): NotableCharacter => ({ id, factionId, definitionId, name, lore, skillId, sinceRules: 64 });

/** Sealed packs hash this order; one figure for each culture. */
export const NOTABLE_CHARACTERS: readonly NotableCharacter[] = [
  notable('notable.sella_kilnbound', 'faction.ashen_compact', 'character.marshal', 'Sella Kilnbound', 'skill.steadfast', 'She held the kiln courts of the Compact through the first winter after the Ashfall with a line that did not move; every marshal of the Compact since has been measured against it.'),
  notable('notable.talen_fordkeeper', 'faction.reedbound_council', 'character.surveyor', 'Talen Fordkeeper', 'skill.fieldcraft', 'He walked every ford of the reed country before the Council had a map, and the fords still bear the marks he cut.'),
  notable('notable.kesta_slagwatch', 'faction.cinder_march', 'character.engineer', 'Kesta Slagwatch', 'skill.siegecraft', 'She brought down the beacon-wall of Pyrefell with a working party of nine and a week; the March has not lost a siege she planned.'),
  notable('notable.orin_tidewright', 'faction.glass_tide', 'character.marshal', 'Orin Tidewright', 'skill.decisive', 'He gave the order at the glass shore before the tide had turned, and the Tide has struck first ever since.'),
  notable('notable.hadra_anvilsworn', 'faction.iron_covenant', 'character.marshal', 'Hadra Anvilsworn', 'skill.steadfast', 'Her shield-line at the Covenant’s gate stood three days against a host that outnumbered it five to one, and the gate still stands.'),
  notable('notable.vessel_greymark', 'faction.sepulchral_synod', 'character.surveyor', 'Vessel Greymark', 'skill.fieldcraft', 'They charted the dead roads of the Synod by the light of the tombs and came back with a map nobody else could read.'),
  notable('notable.pell_rushward', 'faction.mire_courts', 'character.engineer', 'Pell Rushward', 'skill.siegecraft', 'He drained the moat of Willowmere in a night by a channel he had cut a season before; the Courts call a sure plan a Rushward.'),
  notable('notable.marrow_saltquay', 'faction.saltwind_remnant', 'character.marshal', 'Marrow Saltquay', 'skill.decisive', 'She took the quay of Bittern with the first boat ashore and did not wait for the second; the Remnant’s charge is named for her.'),
  notable('notable.dace_ninearch', 'faction.wardhall_remnant', 'character.engineer', 'Dace Ninearch', 'skill.siegecraft', 'He rebuilt the ninth arch of the Wardhall under fire and brought the wall down from inside it a year later.'),
  notable('notable.ysolt_hoarfell', 'faction.rimehorn_clans', 'character.marshal', 'Ysolt Hoarfell', 'skill.steadfast', 'She held the Hoarhold pass in the long snow with the clans at her back and the horn unblown; the clans still do not blow it lightly.'),
  notable('notable.arkan_farhoof', 'faction.sable_steppe', 'character.surveyor', 'Arkan Farhoof', 'skill.fieldcraft', 'He rode the whole steppe in a season with one remount, and the Sable roads follow the line he took.'),
  notable('notable.wren_sporeward', 'faction.morrow_spore', 'character.surveyor', 'Wren Sporeward', 'skill.fieldcraft', 'She found the way through the Spindlewood by the spores that light at dusk, and the Spore has walked it since.'),
  notable('notable.dunmer_measure', 'faction.cistern_assembly', 'character.engineer', 'Dunmer Measure', 'skill.siegecraft', 'He read the cisterns of Dunwell by their echo and cut the siege-channel that emptied them; the Assembly posts his measure at every well.'),
  notable('notable.brant_unsealed', 'faction.unsealed_companies', 'character.marshal', 'Brant Unsealed', 'skill.decisive', 'He broke the seal of the companies’ charter with his own hand and led the first free march; the Companies strike before they are paid.'),
  notable('notable.ilse_lanternkeep', 'faction.lantern_hospices', 'character.surveyor', 'Ilse Lanternkeep', 'skill.fieldcraft', 'She carried a lantern the length of the pilgrim road and marked every hospice it passed; the Hospices keep her lamp lit.'),
  notable('notable.corvin_cairnwing', 'faction.cairnwing_concord', 'character.marshal', 'Corvin Cairnwing', 'skill.steadfast', 'He held the Windlass Ledge against the crag-raiders with the Concord’s oath on every shield, and none was broken.'),
  notable('notable.ruta_sluicegate', 'faction.red_sluice', 'character.engineer', 'Ruta Sluicegate', 'skill.siegecraft', 'She opened the Lockmouth gates on an enemy camp and closed them on the flood; the Sluice calls a flooded siege a Ruta.'),
  notable('notable.sable_meridian', 'faction.velvet_meridian', 'character.surveyor', 'Sable Meridian', 'skill.fieldcraft', 'They drew the meridian line the Court is named for, from Lodestair to the sea, and never once looked back along it.'),
  notable('notable.coral_brinesong', 'faction.brine_choir', 'character.marshal', 'Coral Brinesong', 'skill.decisive', 'She led the Choir’s boats into the Wrackpool squall singing the count, and the squall lost.'),
  notable('notable.ember_quickfall', 'faction.emberwake_convocation', 'character.engineer', 'Ember Quickfall', 'skill.siegecraft', 'He set the fires of Quickfallow in the order the Convocation taught and brought the walls down with the fourth.'),
  notable('notable.hush_hollowlease', 'faction.underhush_exchange', 'character.surveyor', 'Hush Hollowlease', 'skill.fieldcraft', 'They mapped the hollow ways under the Exchange and sold the map to no one; the Exchange still trades on it.'),
  notable('notable.vesper_duskpress', 'faction.vesper_court', 'character.marshal', 'Vesper Duskpress', 'skill.steadfast', 'She held the press-yard of Duskpress at dusk with the Court’s last company, and the Court kept its presses.'),
  notable('notable.tally_sixways', 'faction.manytrack_moot', 'character.surveyor', 'Tally Sixways', 'skill.fieldcraft', 'He counted the six ways out of the Moot’s valley and walked them all in a season; the Moot sits where they meet.'),
  notable('notable.margin_endleaf', 'faction.margin_observance', 'character.engineer', 'Margin Endleaf', 'skill.siegecraft', 'She wrote the Observance’s siege-book in the margins of a ledger at Endleaf, and every engineer of the Observance has read it.'),
];
export const notableCharactersForRules = (version: number): readonly NotableCharacter[] => NOTABLE_CHARACTERS.filter(item => item.sinceRules <= version);
export const notableCharacter = (notableId: string): NotableCharacter | undefined => NOTABLE_CHARACTERS.find(item => item.id === notableId);

export function validateNotableCharacterContent(entries = NOTABLE_CHARACTERS): void {
  entries.forEach(item => notableCharacterSchema.parse(item));
  const ids = entries.map(item => item.id);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate notable character ID');
  for (const item of entries) {
    if (!FACTIONS.some(faction => faction.id === item.factionId)) throw new Error('A notable character names a culture of the roster: ' + item.id);
    const definition = CHARACTER_DEFINITIONS.find(definition => definition.id === item.definitionId);
    if (!definition) throw new Error('A notable character names a role of the catalogue: ' + item.id);
    const skill = CHARACTER_SKILLS.find(skill => skill.id === item.skillId);
    if (!skill || !skill.roles.includes(definition.role) || !skill.exclusiveGroup || !definition.skillIds.includes(skill.id)) throw new Error('A notable character starts with a specialization of its role: ' + item.id);
  }
  for (const faction of FACTIONS) if (!entries.some(item => item.factionId === faction.id)) throw new Error('Every culture has a notable character: ' + faction.id);
}
