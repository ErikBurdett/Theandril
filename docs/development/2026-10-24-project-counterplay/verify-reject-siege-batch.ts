/** Watch plans once per realm/round: reject and the unchanged legal siege must
 * be one coherent ordinary-command batch for a one-turn enemy project. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { applyCommand, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand } from '../../../packages/sim/src';
import { createJournal, replayArchive } from '../../../packages/chronicle/src';
import { getBesiegePreview } from './siege-establishment.draft';
const dir=new URL('./',import.meta.url), bytes=readFileSync(new URL('near-complete.theandril',dir),'utf8');
const game=deserializeGame(bytes),actor='faction.reedbound_council',rival='faction.ashen_compact',armyId='army.4',settlementId='settlement.5';
assert(applyCommand(game,{type:'proposePeace',factionId:rival,targetFactionId:actor,terms:{offerCoin:0,requestCoin:0,truceTurns:10}}).ok);
const initial=serializeGame(game),mirror=deserializeGame(initial),journal=createJournal(game,{mode:'watch',coverage:'from-save'});
const reject:GameCommand={type:'respondPeace',factionId:actor,offerId:game.diplomacy.offers[0]!.id,accept:false};
const siege:GameCommand={type:'besiege',factionId:actor,armyId,settlementId};
const before=getObservation(game,actor),quoteBefore=getBesiegePreview(before,armyId,settlementId);assert(quoteBefore.canBesiege);
const results=[];
for(const command of [reject,siege]) {
  const result=journal.record(game,command);assert(result.ok,result.error);assert.deepEqual(applyCommand(mirror,command),result);results.push(result);
  assert.equal(stateHash(deserializeGame(serializeGame(game))),stateHash(game));
  if(command.type==='respondPeace') {
    const after=getObservation(game,actor);
    for(const key of ['armies','settlements','wars','sieges','visibleSiegeSettlementIds','routes','postings','characters','theaters','patrols','projects','supply','treasury','battle','pendingCapture','victory'] as const)assert.deepEqual(after[key],before[key],key);
    assert.deepEqual(getBesiegePreview(after,armyId,settlementId),quoteBefore);
  }
}
const end:GameCommand={type:'endTurn',factionId:game.turnOwnerId};assert(journal.record(game,end).ok);assert(applyCommand(mirror,end).ok);
assert.equal(game.victory,null);assert.equal(game.projects[0]!.progress,4);assert.equal(game.projects[0]!.status,'paused');
assert.equal(stateHash(mirror),stateHash(game));assert.equal(stateHash(replayArchive(journal.materialize())),stateHash(game));
const rejectionOnly=deserializeGame(initial);assert(applyCommand(rejectionOnly,reject).ok);assert(applyCommand(rejectionOnly,end).ok);assert.equal(rejectionOnly.victory?.factionId,rival);
const evidence={scope:'One coherent reject+besiege batch, with actual endTurn; rejection alone loses before another Watch planning round.',quoteBefore,commands:[reject,siege,end],results,allRelevantFactsUnchangedAfterReject:true,finalHash:stateHash(game),project:game.projects[0],victory:game.victory,exactReplay:true,rejectionOnly:{hash:stateHash(rejectionOnly),victory:rejectionOnly.victory}};
writeFileSync(new URL('reject-siege-batch-evidence.json',dir),JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence,null,2));
