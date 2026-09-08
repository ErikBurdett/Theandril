/** Read original alpha and run the unchanged native fitter into isolated review previews only. */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { decodePng, encodePng, paletteSchema, sha256 } from '../../../../../packages/art-pipeline/src/index';
import { FACTION_ART_ROLES, type FactionArtRole } from '../../../../../packages/art-pipeline/src/faction-art';
import { factionFrameContract, fitFactionFrame } from '../../../../../scripts/art-factions';

const originals = process.argv.slice(2);
if (!originals.length) throw new Error('Pass explicit owned original PNG paths. No generation or approval is performed.');
const palette = paletteSchema.parse(JSON.parse(await readFile('assets/palettes/theandril-master.json', 'utf8')));
for (const original of originals) {
  const absolute = resolve(original);
  if (!/\/assets\/art\/source\/faction-expansion\/(wellroads|reedstars|naval)\/(?:unit|character|settlement|ui)\.[a-z_]+\.(?:cistern_assembly|unsealed_companies|manytrack_moot|margin_observance)-v[1-9][0-9]*\.png$/.test(absolute)) throw new Error('Only explicitly owned raw originals are allowed.');
  const role = FACTION_ART_ROLES.find(role => basename(original).startsWith(`${role}.`)) as FactionArtRole | undefined;
  if (!role) throw new Error('Unregistered role');
  const bytes = await readFile(absolute), source = decodePng(bytes);
  let left = source.width, top = source.height, right = -1, bottom = -1, transparent = 0, partialAlpha = 0;
  for (let y = 0; y < source.height; y++) for (let x = 0; x < source.width; x++) {
    const alpha = source.data[(y * source.width + x) * 4 + 3]!;
    if (alpha === 0) transparent++; else if (alpha < 255) partialAlpha++;
    if (alpha < 128) continue;
    left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
  }
  if (right < 0 || transparent < source.width * source.height / 10) throw new Error(`${original}: empty/opaque source; do not repair its background.`);
  if (left === 0 || top === 0 || right === source.width - 1 || bottom === source.height - 1) throw new Error(`${original}: clipped source edge; regenerate rather than cropping.`);
  const crop = { x: left, y: top, w: right - left + 1, h: bottom - top + 1 };
  const native = fitFactionFrame(source, crop, role, palette), enlarged = { width: native.width * 4, height: native.height * 4, data: new Uint8Array(native.width * native.height * 64) };
  for (let y = 0; y < enlarged.height; y++) for (let x = 0; x < enlarged.width; x++) {
    const at = (Math.floor(y / 4) * native.width + Math.floor(x / 4)) * 4;
    enlarged.data.set(native.data.subarray(at, at + 4), (y * enlarged.width + x) * 4);
  }
  const destination = `${dirname(absolute)}/review-web`, name = basename(original, '.png');
  await mkdir(destination, { recursive: true });
  const outputs = { native: `${destination}/${name}-1x.png`, enlarged: `${destination}/${name}-4x.png` };
  for (const [file, image] of [[outputs.native, native], [outputs.enlarged, enlarged]] as const) {
    const encoded = encodePng(image);
    try { await writeFile(file, encoded, { flag: 'wx' }); }
    catch (failure) { if (!(failure instanceof Error && 'code' in failure && failure.code === 'EEXIST') || !Buffer.from(encoded).equals(await readFile(file))) throw failure; }
  }
  console.log(JSON.stringify({ original, sourceHash: sha256(bytes), sourceSize: [source.width, source.height], transparent, partialAlpha, crop, contract: factionFrameContract(role), nativeHash: sha256(encodePng(native)), outputs, note: 'Isolated unchanged-fitter preview only; no Pixel Snapper/Aseprite, candidate, approval or canonical native output was created.' }));
}
