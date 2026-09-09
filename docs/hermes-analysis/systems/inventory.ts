/** Read-only production imports; writes only this audit directory. Run from repo root with node_modules/.bin/tsx. */
import * as content from '../../../packages/content/src/index';
import { BIOME_NAMES, TERRAIN_NAMES, WATER_DEPTH_NAMES, MAP_DIMENSIONS, RECOMMENDED_FACTION_COUNTS } from '../../../packages/mapgen/src/index';
import { commandSchema } from '../../../packages/sim/src/simulation';
import { victorySchema } from '../../../packages/sim/src/progression';
import { captureOutcomeSchema } from '../../../packages/sim/src/siege';
import ts from 'typescript';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const owned = dirname(fileURLToPath(import.meta.url));
const root = resolve(owned, '../../..');
const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\0').filter(Boolean);
const sourcePaths = tracked.filter(p => /^(packages|apps)\/[^/]+\/src\/.*\.tsx?$/.test(p) && !/\.(test|spec)\.tsx?$/.test(p));
type Evidence = { path: string; startLine: number; endLine: number };
const byId: Record<string, Evidence[]> = {}, exports: Record<string, Evidence> = {};
const contentPaths = tracked.filter(p => /^packages\/content\/src\/.*\.ts$/.test(p) && !p.endsWith('.test.ts'));
for (const path of contentPaths) {
  const text = readFileSync(resolve(root, path), 'utf8');
  const file = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
  const evidence = (node: ts.Node): Evidence => ({ path, startLine: file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1, endLine: file.getLineAndCharacterOfPosition(node.getEnd()).line + 1 });
  const visit = (node: ts.Node): void => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) exports[node.name.text] = evidence(node);
    if (ts.isObjectLiteralExpression(node)) {
      const id = node.properties.find(p => ts.isPropertyAssignment(p) && p.name.getText(file) === 'id');
      if (id && ts.isPropertyAssignment(id) && ts.isStringLiteral(id.initializer)) (byId[id.initializer.text] ??= []).push(evidence(node));
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
}
const evidenceFor = (id: string, exportName: string) => byId[id] ?? [exports[exportName]!];
const array = (key: keyof typeof content) => (content[key] as readonly { id: string }[]).map(definition => ({ definition, evidence: evidenceFor(definition.id, String(key)) }));
const groups = <T>(values: readonly T[], key: (v: T) => string) => Object.fromEntries([...new Set(values.map(key))].sort().map(k => [k, values.filter(v => key(v) === k).length]));
const factionDetails = content.FACTIONS.map(faction => {
  const ecology = content.FACTION_ECOLOGIES[faction.id]!, pool = content.CHARACTER_NAMES[faction.id]!;
  const nameCapacity = pool.given.length * pool.family.length;
  return {
    definition: faction, evidence: evidenceFor(faction.id, 'FACTIONS'),
    profile: content.FACTION_PROFILES[faction.id], profileEvidence: exports.FACTION_PROFILES,
    ecology: { cultivation: ecology.terraformBiomeIds.map(id => ({ id, name: BIOME_NAMES[id] })), affinities: ecology.affinities.map(a => ({ ...a, name: BIOME_NAMES[a.biomeId] })) }, ecologyEvidence: exports.FACTION_ECOLOGIES,
    aiRecruitmentWeights: content.FACTION_RECRUITMENT_WEIGHTS[faction.id], recruitmentEvidence: exports.FACTION_RECRUITMENT_WEIGHTS,
    names: { given: pool.given, family: pool.family, unsuffixedCombinations: nameCapacity, uniqueUnsuffixedNames: new Set(Array.from({ length: nameCapacity }, (_, i) => content.characterName(faction.id, i + 1))).size }, nameEvidence: exports.CHARACTER_NAMES,
  };
});
const counts = content.validateContent();
const renderedNameCombos = factionDetails.flatMap(f => Array.from({ length: f.names.unsuffixedCombinations }, (_, i) => content.characterName(f.definition.id, i + 1)));
const audioPatterns = ['\\b(?:AudioContext|webkitAudioContext|HTMLAudioElement|AudioBuffer|AudioListener|Howl|Howler)\\b', '\\bnew\\s+Audio\\s*\\(', '<audio\\b', '\\.(?:mp3|ogg|wav|flac|m4a|aac|opus|mid|midi)\\b', '\\b(?:soundtrack|audio|sfx|music|volume|mute)\\b'];
const scan = (patterns: string[], paths: string[]) => paths.flatMap(path => readFileSync(resolve(root, path), 'utf8').split('\n').flatMap((line, i) => patterns.some(p => new RegExp(p, 'i').test(line)) ? [{ path, line: i + 1, text: line }] : []));
const audio = { scope: 'Tracked production apps/*/src and packages/*/src TypeScript/TSX, excluding *.test and *.spec; audio file names checked across all tracked repository files. Not a browser listening test.', sourcePaths, patterns: audioPatterns, hits: scan(audioPatterns, sourcePaths), trackedAudioFiles: tracked.filter(p => /\.(mp3|ogg|wav|flac|m4a|aac|opus|mid|midi|aiff|wma)$/i.test(p)) };
const absence = { note: 'Zero counts mean no exported playable registry or canonical command/state found in this bounded audit, not that the words do not exist in lore, art or design documents.', contentSourcePaths: contentPaths, contentExports: Object.keys(content).sort(), commandTypes: commandSchema.options.map(s => s.shape.type.value).sort(), canonicalStateEvidence: [{ path: 'packages/sim/src/types.ts', startLine: 175, endLine: 250 }], registries: { racesOrAncestries: 0, independentPowerDefinitions: 0, researchDisciplineDefinitions: 0, rituals: 0, summons: 0, magicalItemsOrRecipes: 0, sacredProgression: 0, occultProgression: 0, landmarksOrLegendarySites: 0, eventTemplates: 0, quests: 0, biographyBearingNamedCharacterDefinitions: 0 }, loreEvidence: [{ path: 'docs/lore/FACTION_BIBLE.md', startLine: 9, endLine: 28 }, { path: 'docs/RESEARCH_MAGIC_SYSTEMS.md', startLine: 26, endLine: 35 }] };
const weightGroups = new Map<string, string[]>();
for (const f of factionDetails) { const signature = JSON.stringify(f.aiRecruitmentWeights); weightGroups.set(signature, [...(weightGroups.get(signature) ?? []), f.definition.id]); }
const result = {
  schema: 'theandril-systems-audit-1', baseline: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), method: 'Imported current exported content with existing tsx; ran validateContent(); indexed source AST line ranges. Counts deduplicated by stable ID. No production file modified.',
  validation: counts,
  summary: { ...counts, landUnits: content.UNITS.filter(u => u.movementDomain !== 'naval').length, landMilitaryUnits: content.UNITS.filter(u => u.movementDomain !== 'naval' && !u.canFound).length, navalUnits: content.UNITS.filter(u => u.movementDomain === 'naval').length, founderUnits: content.UNITS.filter(u => u.canFound).length, uniqueUnitStatProfiles: new Set(content.UNITS.map(({ id: _id, name: _name, description: _description, ...stats }) => JSON.stringify(stats))).size, formationTraining: content.FORMATION_TRAINING.length, hearthDevelopments: content.HEARTH_DEVELOPMENTS.length, factionTraditions: content.FACTION_TRADITIONS.length, institutionLinkedTraditions: content.FACTION_TRADITIONS.filter(n => n.requiredInstitution).length, doctrineLinkedTraditions: content.FACTION_TRADITIONS.filter(n => n.requiredDoctrine).length, developmentWithMaterialCosts: content.DEVELOPMENT_NODES.filter(n => n.resourceCosts).length, baseImprovements: content.IMPROVEMENTS.filter(i => i.introducedInRules === undefined).length, researchedImprovements: content.IMPROVEMENTS.filter(i => i.introducedInRules === 11).length, extractionImprovements: content.RESOURCE_IMPROVEMENTS.length, biomeDefinitions: BIOME_NAMES.length, physicalTerrainClasses: TERRAIN_NAMES.length, waterDepthClasses: WATER_DEPTH_NAMES.length, namePools: factionDetails.length, uniqueUnsuffixedNameCombinations: new Set(renderedNameCombos).size, unsuffixedNameCombinations: renderedNameCombos.length, distinctRecruitmentWeightVectors: weightGroups.size, independentAncestryDefinitions: 0, implementedVictoryPaths: [victorySchema.shape.path.value], ...absence.registries },
  factions: factionDetails, factionRosters: content.FACTION_ROSTERS, identicalRecruitmentWeightGroups: [...weightGroups.values()],
  units: array('UNITS'), buildings: array('BUILDINGS'), resources: array('RESOURCES'), improvements: array('IMPROVEMENTS'), technologies: array('TECHNOLOGIES'), institutions: array('INSTITUTIONS'), doctrines: array('DOCTRINES'), development: array('DEVELOPMENT_NODES'), arcaneDiscoveries: array('ARCANE_DISCOVERIES'), magicPaths: array('MAGIC_PATHS'), battleSpells: array('BATTLE_SPELLS'), innateBattleAbilities: array('INNATE_BATTLE_ABILITIES'), commanderAbilities: array('COMMANDER_ABILITIES'), characterRoles: array('CHARACTER_DEFINITIONS'), characterMissions: array('CHARACTER_MISSIONS'), characterSkills: array('CHARACTER_SKILLS'), naturalFeatures: array('NATURAL_FEATURES'),
  geography: { biomes: BIOME_NAMES.map((name, id) => ({ id, name, yields: content.BIOME_YIELDS[id] })), terrain: TERRAIN_NAMES.map((name, id) => ({ id, name })), waterDepth: WATER_DEPTH_NAMES.map((name, id) => ({ id, name })), sizes: Object.entries(MAP_DIMENSIONS).map(([size, dimensions]) => ({ size, ...dimensions, cells: dimensions.width * dimensions.height, recommendedFactions: RECOMMENDED_FACTION_COUNTS[size as keyof typeof MAP_DIMENSIONS] })), evidence: [{ path: 'packages/mapgen/src/index.ts', startLine: 13, endLine: 61 }] },
  progressionGroups: { technologies: groups(content.TECHNOLOGIES, content.technologyBranch), development: groups(content.DEVELOPMENT_NODES, n => n.scope), characterSkills: groups(content.CHARACTER_SKILLS, n => n.branch), resources: groups(content.RESOURCES, n => n.category) },
  victory: { paths: [victorySchema.shape.path.value], projects: [content.PROSPERITY_PROJECT], modernPaces: content.CAMPAIGN_PACES, note: 'Project base definition uses historical Short prices. Actual quotes use the rules-aware campaign pace. Conquest is not a separate victory predicate.', evidence: [{ path: 'packages/sim/src/progression.ts', startLine: 17, endLine: 29 }, { path: 'packages/sim/src/progression.ts', startLine: 46, endLine: 68 }, { path: 'packages/sim/src/progression.ts', startLine: 142, endLine: 156 }] },
  diplomacy: { treatyFamilies: ['bilateral peace: one-way coin payment plus timed binding truce'], relationFields: ['trust', 'respect', 'grievances', 'warStartedTurn', 'lastOfferTurn'], aiRelationshipScoringFields: ['grievances', 'warStartedTurn'], captureOutcomes: captureOutcomeSchema.options, evidence: [{ path: 'packages/sim/src/diplomacy.ts', startLine: 9, endLine: 40 }, { path: 'packages/sim/src/diplomacy.ts', startLine: 169, endLine: 199 }] },
  abilitiesCountingCaution: '17 personal skills + 1 commander ability + 1 innate unit ability + 2 battle spells are separate registries. The 25 development nodes are investments, not extra activated abilities. 2 arcane discoveries unlock the same 2 battle spells: not 4 independently usable magical effects.',
  absence, audio,
};
writeFileSync(resolve(owned, 'content.json'), JSON.stringify(result, null, 2) + '\n');
writeFileSync(resolve(owned, 'audio-search.json'), JSON.stringify(audio, null, 2) + '\n');
console.log(JSON.stringify({ baseline: result.baseline, validation: counts, summary: result.summary, audio: { searchedSourceFiles: sourcePaths.length, sourceHits: audio.hits, trackedAudioFiles: audio.trackedAudioFiles }, commandTypes: absence.commandTypes, output: resolve(owned, 'content.json') }, null, 2));
