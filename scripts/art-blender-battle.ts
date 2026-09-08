/** Explicit import/activation only. Pixel Snapper, Aseprite, review and publication are separate stages. */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BLENDER_BATTLE_IDS, importBlenderBattleSource } from '../packages/art-pipeline/src/blender-source';
import { safeAssetPath, sha256 } from '../packages/art-pipeline/src/provenance';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), id = args[0], version = Number(args[1] ?? 1);
const replaceFlags = args.filter(arg => arg.startsWith('--replace-brief-sha='));
const previousHash = replaceFlags[0]?.split('=')[1];
if (!id || !BLENDER_BATTLE_IDS.some(value => value === id) || args.slice(2).some(arg => arg !== '--prepare' && arg !== '--activate' && !/^--replace-brief-sha=[a-f0-9]{64}$/.test(arg))
  || args.includes('--activate') && !args.includes('--prepare') || replaceFlags.length > 1 || previousHash && !args.includes('--activate')) throw new Error('Usage: tsx scripts/art-blender-battle.ts <asset-id> <version> [--prepare [--activate [--replace-brief-sha=<exact-old-brief-sha256>]]]');
const result = await importBlenderBattleSource(root, id, version);
const briefPath = `assets/art/source/blender-imports/${id}-v${version}-${result.inputHash}/brief.json`;
const bytes = Buffer.from(JSON.stringify(result.brief, null, 2) + '\n');
const paths = [briefPath, ...(args.includes('--activate') ? [`assets/art/briefs/${id}.json`] : [])];
const missing: string[] = [];
let replacement: string | undefined;
for (const path of paths) {
  try {
    const existing = await readFile(await safeAssetPath(root, path));
    if (!existing.equals(bytes)) {
      const prior = JSON.parse(existing.toString()) as { id?: string; version?: number };
      if (path !== `assets/art/briefs/${id}.json` || !previousHash || sha256(existing) !== previousHash || prior.id !== id || typeof prior.version !== 'number' || prior.version >= version)
        throw new Error(`Immutable import conflict: ${path}; preserve prior revision and explicitly review activation.`);
      replacement = path;
    }
  }
  catch (error) { if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') throw error; missing.push(path); }
}
// Only the active brief pointer may change; retained source/import/review revisions remain immutable.
if (replacement) {
  const full = await safeAssetPath(root, replacement);
  if (sha256(await readFile(full)) !== previousHash) throw new Error('Active brief changed during import');
  await writeFile(full, bytes);
}
if (args.includes('--prepare')) for (const path of missing) {
  const full = await safeAssetPath(root, path); await mkdir(dirname(full), { recursive: true }); await writeFile(full, bytes, { flag: 'wx' });
}
console.log(JSON.stringify({ id, version, sourceHash: result.inputHash, briefPath, prepared: args.includes('--prepare'), activated: args.includes('--activate'),
  approved: false, validation: result.validation.passed, next: 'art:generate <id> --provider source, inspect native/enlarged processed frames, individual exact-input review, art:integrate, actual gameplay review.' }, null, 2));
