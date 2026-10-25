/** Prepared policy harness. Canonical command oracle is test-only until the
 * public observation query exists; runtime must never clone/probe live state. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { applyCommand, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState, type Observation } from '../../../packages/sim/src';
import { createJournal, replayArchive } from '../../../packages/chronicle/src';
import { planDiplomacy, protectedFactions } from '../../../packages/ai/src/diplomacy';
import { reviewProjectCounterplay, type BesiegeQuery } from './project-counterplay.draft';
const dir = new URL('./', import.meta.url), bytes = readFileSync(new URL('near-complete.theandril', dir), 'utf8');
const actor = 'faction.reedbound_council', rival = 'faction.ashen_compact';
type View = Observation & { siegeEstablishment?: true };
function canonicalOracle(game: GameState): BesiegeQuery {
  const fixed = serializeGame(game);
  return (view, armyId, settlementId) => {
    const result = applyCommand(deserializeGame(fixed), { type: 'besiege', factionId: view.factionId, armyId, settlementId });
    return { armyId, settlementId, canBesiege: result.ok, blocker: result.error ?? null };
  };
}
function candidateDiplomacy(view: View, query: BesiegeQuery) {
  const original = planDiplomacy(view), response = original?.commands[0];
  if (response?.type === 'respondPeace') {
    if (!response.accept) return original;
    const offer = view.diplomacy.offers.find(offer => offer.id === response.offerId)!;
    const interruption = reviewProjectCounterplay(view, protectedFactions(view), query, offer.terms.truceTurns, offer.proposerId);
    return interruption.command ? { commands: [{ ...response, accept: false }], reasons: [interruption.reason!] } : original;
  }
  const interruption = reviewProjectCounterplay(view, protectedFactions(view), query);
  return interruption.command ? { commands: [interruption.command], reasons: [interruption.reason!] } : original;
}
const game = deserializeGame(bytes), incoming = { type: 'proposePeace' as const, factionId: rival, targetFactionId: actor, terms: { offerCoin: 0, requestCoin: 0, truceTurns: 10 } };
assert(applyCommand(game, incoming).ok);
const journal = createJournal(game, { mode: 'watch', coverage: 'from-save' }), mirror = deserializeGame(serializeGame(game));
const record = (command: GameCommand) => {
  const result = journal.record(game, command); assert(result.ok, result.error); assert.deepEqual(applyCommand(mirror, command), result);
  assert.equal(stateHash(deserializeGame(serializeGame(game))), stateHash(game));
};
const view: View = { ...getObservation(game, actor), siegeEstablishment: true }, before = structuredClone(view);
const rejection = candidateDiplomacy(view, canonicalOracle(game));
assert.equal(rejection?.commands[0]?.type, 'respondPeace'); assert.equal((rejection!.commands[0] as Extract<GameCommand,{type:'respondPeace'}>).accept, false);
assert.deepEqual(view, before);
for (const command of rejection!.commands) record(command);
// Even though refusal cooldown removes any outgoing peace proposal, the next
// fresh pass prioritizes the same real interruption before optional work.
const fresh: View = { ...getObservation(game, actor), siegeEstablishment: true };
assert.equal(planDiplomacy(fresh), null);
const continuation = candidateDiplomacy(fresh, canonicalOracle(game));
assert.deepEqual(continuation!.commands, [{ type: 'besiege', factionId: actor, armyId: 'army.4', settlementId: 'settlement.5' }]);
for (const command of continuation!.commands) record(command);
record({ type: 'endTurn', factionId: game.turnOwnerId });
assert.equal(game.projects[0]!.progress,4); assert.equal(game.projects[0]!.status,'paused'); assert.equal(game.victory,null);
assert.equal(stateHash(replayArchive(journal.materialize())),stateHash(game)); assert.equal(stateHash(game),stateHash(mirror));
const outgoingState=deserializeGame(bytes), outgoingView:View={...getObservation(outgoingState,actor),siegeEstablishment:true};
assert.equal(candidateDiplomacy(outgoingView,canonicalOracle(outgoingState))!.commands[0]!.type,'besiege');

const faster=deserializeGame(readFileSync(new URL('own-faster-near.theandril',dir),'utf8'));
assert(applyCommand(faster,incoming).ok);
const fasterView:View={...getObservation(faster,actor),siegeEstablishment:true};
let queries=0;
const noQuery:BesiegeQuery=()=>{queries++;throw Error('No quote expected for this control');};
assert.equal((candidateDiplomacy(fasterView,noQuery)!.commands[0] as Extract<GameCommand,{type:'respondPeace'}>).accept,true); assert.equal(queries,0);
const historical=structuredClone(outgoingView); delete historical.siegeEstablishment;
assert.deepEqual(candidateDiplomacy(historical,noQuery),planDiplomacy(historical));
const guardedControls:string[]=[];
for(const kind of ['spent','morale','fatigue','agents','direct','posting','hidden','paused','distant-deadline','binding','mission','theater','patrol'] as const) {
  const control=structuredClone(outgoingView), army=control.armies.find(army=>army.id==='army.4')!;
  if(kind==='spent')army.movement=0;
  if(kind==='morale')army.morale=34;
  if(kind==='fatigue')army.fatigue=66;
  if(kind==='agents')army.agents.push({id:'character.synthetic',name:'Authored agent',definitionId:'character.engineer',role:'engineer',status:'ready',rank:1,experience:0,skillId:null,learnedSkillIds:[],woundedTurns:0});
  if(kind==='direct')control.routes.push({armyId:army.id,origin:army.cell,waypoints:[0],path:[army.cell,0],status:'paused',pauseReason:'Authored guard control',knownHostileIds:[]});
  if(kind==='posting')control.postings.push({armyId:army.id,factionId:actor,cell:army.cell,mode:'hold',arrived:true,blocker:null});
  if(kind==='hidden')control.settlements=control.settlements.filter(town=>town.id!=='settlement.5');
  if(kind==='paused')control.projects[0]!.status='paused';
  if(kind==='distant-deadline')control.projects[0]!.requiredTurns=control.projects[0]!.progress+11;
  if(kind==='mission')army.movementBlocker='Authored stationary mission';
  if(kind==='theater')control.theaters=[{id:'theater.contract',factionId:actor,name:'Authored watch',enabled:true,armyIds:[army.id],settlementIds:[],reserveCell:army.cell,guardsPerSettlement:1,reinforcementLimit:0,lastRunTurn:null,lastDispatches:[],hearths:[],members:[],missingGuards:0,blocker:null}];
  if(kind==='patrol')control.patrols=[{armyId:army.id,factionId:actor,enabled:true,firstCell:army.cell,secondCell:488,target:'second',targetCell:488,pauseOnWar:false,lastAttemptTurn:null,lastError:null,status:'waiting',blocker:null}];
  const result=reviewProjectCounterplay(control,kind==='binding'?new Set([rival]):protectedFactions(control),noQuery);
  assert.equal(result.command,null,kind); guardedControls.push(kind);
}
const permuted=structuredClone(outgoingView);permuted.armies.reverse();permuted.cells.reverse();permuted.settlements.reverse();permuted.projects.reverse();
assert.deepEqual(reviewProjectCounterplay(permuted,new Set(),canonicalOracle(outgoingState)),reviewProjectCounterplay(outgoingView,new Set(),canonicalOracle(outgoingState)));
const synthetic=structuredClone(outgoingView), source=synthetic.armies.find(army=>army.id==='army.4')!;
synthetic.armies=Array.from({length:128},(_,index)=>({...structuredClone(source),id:`army.contract.${String(index).padStart(3,'0')}`}));
const refused:BesiegeQuery=(_view,armyId,settlementId)=>({armyId,settlementId,canBesiege:false,blocker:'Authored query-budget refusal'});
const bounded=reviewProjectCounterplay(synthetic,new Set(),refused);assert.equal(bounded.siegeQueries,4);assert.equal(bounded.command,null);
synthetic.armies=[];synthetic.projects=Array.from({length:128},(_,index)=>({...structuredClone(outgoingView.projects[0]!),id:`project.contract.${index}`}));
const boundedProjects=reviewProjectCounterplay(synthetic,new Set(),noQuery);assert.equal(boundedProjects.consideredProjects,8);assert.equal(boundedProjects.siegeQueries,0);
const result={scope:'Draft policy only; public capability authored and query dependency supplied by canonical command oracle in tests. No runtime cloned-state probing is proposed.',rejection,continuation,finalHash:stateHash(game),exactReplay:true,guardedControls,bounded,boundedProjects};
writeFileSync(new URL('draft-policy-evidence.json',dir),JSON.stringify(result,null,2)+'\n'); console.log(JSON.stringify(result,null,2));
