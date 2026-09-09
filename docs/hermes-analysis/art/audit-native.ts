/** Audit-only: reads production artifacts, writes only this audit directory. */
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { parseAssetManifest, paletteSchema, decodePng, validateAsset, sha256 } from '../../../packages/art-pipeline/src/index';
import { importBlenderBattleSource, importBlenderUnitSource } from '../../../packages/art-pipeline/src/blender-source';
import { LIVE_ART_IDS } from '../../../packages/render/src/art';
import { FACTION_ART_FAMILIES, FACTION_ART_ROLES } from '../../../packages/art-pipeline/src/faction-art';
import { SHARED_UNIT_ART } from '../../../packages/art-pipeline/src/presentation-role';
import { CHARACTER_DEFINITIONS } from '../../../packages/content/src/characters';
import { RESOURCES } from '../../../packages/content/src/resources';
const root = fileURLToPath(new URL('../../../', import.meta.url));
const out = fileURLToPath(new URL('./evidence/native-validation.json', import.meta.url));
const palette = paletteSchema.parse(JSON.parse(await readFile(resolve(root, 'assets/palettes/theandril-master.json'), 'utf8')));
const results: object[] = [], imports: object[] = [];
let failures = 0;
for (const file of (await readdir(resolve(root, 'assets/art/approved'))).filter(file => file.endsWith('.json')).sort()) {
  const manifest = parseAssetManifest(JSON.parse(await readFile(resolve(root, 'assets/art/approved', file), 'utf8')));
  const frames = await Promise.all(manifest.frames.map(async frame => ({ id: frame.id, image: decodePng(await readFile(resolve(root, frame.sourcePath))) })));
  const report = validateAsset(manifest, frames, palette);
  const fresh = report.inputHash === manifest.review?.inputHash;
  results.push({ id: manifest.id, passed: report.passed, fresh, inputHash: report.inputHash, errors: report.errors, warnings: report.warnings });
  if (!report.passed || !fresh) failures++;
  const source = manifest.provenance.sourceRefs.find(ref => /source\/blender-(units|battle)\/.+\/v\d+\/manifest.json$/.test(ref));
  if (source) {
    const version = Number(/\/v(\d+)\//.exec(source)![1]);
    try {
      const result = await (manifest.id.startsWith('battle.unit.') ? importBlenderUnitSource : importBlenderBattleSource)(root, manifest.id, version);
      imports.push({ id: manifest.id, version, source, passed: result.validation.passed, inputHash: result.inputHash, frames: result.brief.frames.length });
      if (!result.validation.passed) failures++;
    } catch (error) { failures++; imports.push({ id: manifest.id, version, source, passed: false, error: String(error) }); }
  }
}
const json = { audit: 'Read-only validateAsset, exact approval input-hash freshness, full existing Blender source import validation; no generation/export/approval/publication', catalogSha256: sha256(await readFile(resolve(root, 'assets/art/runtime/catalog.json'))), approvals: results.length, failures, results, blenderImports: imports, liveArtIds: [...LIVE_ART_IDS].sort(), factionFamilies: FACTION_ART_FAMILIES, factionRoles: FACTION_ART_ROLES, sharedStrategicUnitArt: SHARED_UNIT_ART, characterDefinitions: CHARACTER_DEFINITIONS.map(x => ({ id: x.id, role: x.role })), resources: RESOURCES.map(x => ({ id: x.id, improvementId: x.improvementId })) };
await writeFile(out, JSON.stringify(json, null, 2) + '\n');
console.log(JSON.stringify({ approvals: results.length, failures, blenderImports: imports, evidence: out }, null, 2));
if (failures) process.exitCode = 1;
