import 'fake-indexeddb/auto';
import { readFile, writeFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { strict as assert } from 'node:assert';
import { deserializeGame, stateHash } from '@theandril/sim';
import { createJournal } from '@theandril/chronicle';
import { SaveStore } from '@theandril/persistence';
const root='/home/telephoneheater/Work/Theandril/docs/hermes-analysis/qa';
const game=deserializeGame(gunzipSync(await readFile(`${root}/pre-first-battle.json.gz`)).toString('utf8'));
const commands=JSON.parse(await readFile(`${root}/first-battle-commands.json`,'utf8'));
const journal=createJournal(game,{mode:'watch',coverage:'from-save'}), db=new SaveStore('qa-morale-repro');
const before=stateHash(game);
try {
 await db.saveCampaign(game,journal,'manual');
 for (const command of commands) { const result=journal.record(game,command); assert(result.ok,result.error); }
 let saveError=null;
 try { await db.saveCampaign(game,journal,'manual'); } catch(error) { saveError=String(error); }
 assert.match(saveError,/invalid formation definition, morale or strength/);
 const restored=await db.loadLatestCampaign('manual');
 assert.equal(stateHash(restored.game),before);
 const result={scope:'Real CampaignJournal and SaveStore API; fake-indexeddb transaction engine, not browser disk latency.',beforeHash:before,afterHash:stateHash(game),saveError,restoredHash:stateHash(restored.game),lastValidRetained:true};
 await writeFile(`${root}/save-failure-recovery.json`,JSON.stringify(result,null,2)+'\n'); console.log(JSON.stringify(result,null,2));
} finally { await db.delete(); }
