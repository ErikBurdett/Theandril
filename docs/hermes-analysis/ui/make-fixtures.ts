// Audit-only export harness: imports the existing authored fixtures unchanged.
// These are controlled scenarios, NOT generated natural-play campaign evidence.
import {mkdir, writeFile} from 'node:fs/promises';
import {serializeGame, stateHash, deserializeGame, type GameState} from '@theandril/sim';
import {exportSave} from '@theandril/persistence';
import {borderBattleCampaign} from '../../../packages/test-fixtures/src/combat-fixture';
import {characterBattleCampaign} from '../../../packages/test-fixtures/src/character-fixture';
import {conquestCampaign} from '../../../packages/test-fixtures/src/conquest-fixture';
import {navalCampaign} from '../../../packages/test-fixtures/src/naval-fixture';
import {grainResourceCampaign} from '../../../packages/test-fixtures/src/resource-fixture';
const out='docs/hermes-analysis/ui/fixture-saves';
await mkdir(out,{recursive:true});
const fixtures:Record<string,GameState>={border:borderBattleCampaign(),characters:characterBattleCampaign(),conquest:conquestCampaign(),naval:navalCampaign(),grain:grainResourceCampaign().state};
const records=[];
for(const [name,game] of Object.entries(fixtures)){
  const text=serializeGame(deserializeGame(serializeGame(game)));
  const bytes=await exportSave(text);
  const path=`${out}/${name}.theandril`;
  await writeFile(path,bytes);
  records.push({name,path,hash:stateHash(game),bytes:bytes.byteLength,turn:game.turn,settings:game.settings,source:'existing test-fixtures, unchanged authored starting state'});
}
await writeFile(`${out}/manifest.json`,JSON.stringify(records,null,2));
console.log(JSON.stringify(records,null,2));
