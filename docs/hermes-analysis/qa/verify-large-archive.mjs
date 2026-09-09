import { readFile, writeFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { checksum } from '@theandril/content';
import { deserializeGame } from '@theandril/sim';
const root='/home/telephoneheater/Work/Theandril/docs/hermes-analysis/qa';
const raw=await readFile(`${root}/captured-standard-long-748291.json.gz`);
const payload=JSON.parse(gunzipSync(raw).toString('utf8'));
const payloadText=JSON.stringify(payload);
const envelopeText=JSON.stringify({format:'theandril-campaign',version:1,checksum:checksum(payloadText),...payload});
const snapshot=JSON.parse(payload.snapshot).state;
let snapshotError=null; try { deserializeGame(payload.snapshot); } catch(error) { snapshotError=String(error); }
const info={source:'captured-standard-long-748291.json.gz',compressedSha256:createHash('sha256').update(raw).digest('hex'),compressedCaptureBytes:raw.byteLength,snapshotBytes:Buffer.byteLength(payload.snapshot),envelopeBytes:Buffer.byteLength(envelopeText),limitBytes:64*1024*1024,turn:snapshot.turn,armies:snapshot.armies.length,formations:snapshot.armies.reduce((n,a)=>n+a.formations.length,0),settlements:snapshot.settlements.length,records:payload.archive.records.length,recordedBattles:payload.archive.records.reduce((n,r)=>n+r.battles.length,0),snapshotError,sourceHash:payload.archive.finalHash};
await writeFile(`${root}/large-archive.json`,JSON.stringify(info,null,2)+'\n'); console.log('MEASURED',JSON.stringify(info));
info.scope='Metadata-only inspection of actual generated Standard24Long completed ordinary AI archive. Exact envelope byte count reconstructed with production envelope/checksum format; no payload values changed. Full replay of this over-limit archive was not run. Original unmodified benchmark and capture copy both fail serializeCampaign at the64MiB guard.';
await writeFile(`${root}/large-archive.json`,JSON.stringify(info,null,2)+'\n'); console.log('VERIFIED_METADATA',JSON.stringify(info));
