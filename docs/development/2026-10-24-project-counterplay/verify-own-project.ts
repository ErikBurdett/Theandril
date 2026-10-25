/** Explicitly authored six-town infrastructure; both projects paid and advanced normally. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { hexDistance, isPassable } from '../../../packages/mapgen/src';
import { applyCommand, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand } from '../../../packages/sim/src';
import { rebaseAuthoredLand } from '../../../packages/test-fixtures/src/authored-land';
import { planTurnWithReasons } from '../../../packages/ai/src';
import { createJournal, replayArchive } from '../../../packages/chronicle/src';
const dir = new URL('./', import.meta.url);
let game = deserializeGame(readFileSync(new URL('authored-initial.theandril', dir),'utf8'));
const actor = 'faction.reedbound_council', rival = 'faction.ashen_compact';
const template = structuredClone(game.settlements['settlement.5']!);
const ownHost = Object.values(game.settlements).find(town => town.factionId === actor)!;
ownHost.buildings = [...template.buildings];
// Both realms need their own three legally separated prepared hearths. This
// setup does not fabricate project eligibility flags, progress or victory.
for (let i = 0; i < 2; i++) {
  const cell = Array.from({length:game.world.terrain.length},(_,cell)=>cell).find(cell => isPassable(game.world.terrain[cell]!)
    && Object.values(game.settlements).every(town => hexDistance(cell,town.cell,game.world.width)>=4)
    && !Object.values(game.armies).some(army=>army.cell===cell))!;
  assert(cell!==undefined);
  const id = `settlement.${game.nextId++}`;
  game.settlements[id] = {...structuredClone(template), id, name:`Authored counterplay hearth ${i+1}`, cell, factionId:actor, founderFactionId:actor, queue:[]};
}
game.factions.find(faction=>faction.id===actor)!.treasury=2000;
game.factions.find(faction=>faction.id===actor)!.knowledge=64;
rebaseAuthoredLand(game); game=deserializeGame(serializeGame(game));
const initial=serializeGame(game), mirror=deserializeGame(initial), journal=createJournal(game,{mode:'watch',coverage:'from-save'}), commands:GameCommand[]=[];
function issue(command:GameCommand) {
  const result=journal.record(game,command);assert(result.ok,JSON.stringify({command,result})); assert.deepEqual(applyCommand(mirror,command),result);
  assert.equal(stateHash(game),stateHash(mirror)); assert.equal(stateHash(deserializeGame(serializeGame(game))),stateHash(game)); commands.push(command);
}
issue({type:'declareWar',factionId:actor,targetFactionId:rival});
for(let i=0;i<8;i++)issue({type:'endTurn',factionId:game.turnOwnerId});
for(const factionId of [actor,rival]) {
  issue({type:'research',factionId,technologyId:'technology.civic_accounts'});
  issue({type:'adoptInstitution',factionId,institutionId:'institution.charter_compact'});
}
issue({type:'startVictoryProject',factionId:actor,settlementId:ownHost.id});
issue({type:'endTurn',factionId:game.turnOwnerId});
issue({type:'startVictoryProject',factionId:rival,settlementId:'settlement.5'});
for(let i=0;i<3;i++)issue({type:'endTurn',factionId:game.turnOwnerId});
const projectsBefore=structuredClone(game.projects);
assert.equal(projectsBefore.find(project=>project.factionId===actor)!.progress,4);
assert.equal(projectsBefore.find(project=>project.factionId===rival)!.progress,3);
const near=serializeGame(game), nearHash=stateHash(game), proof=deserializeGame(near);
const siegeResult=applyCommand(proof,{type:'besiege',factionId:actor,armyId:'army.4',settlementId:'settlement.5'});
assert(siegeResult.ok);
issue({type:'proposePeace',factionId:rival,targetFactionId:actor,terms:{offerCoin:0,requestCoin:0,truceTurns:10}});
const plan=planTurnWithReasons(getObservation(game,actor)); assert.deepEqual(plan.commands.map(command=>[command.type,'accept'in command&&command.accept]),[['respondPeace',true]]);
for(const command of plan.commands)issue(command);
issue({type:'endTurn',factionId:game.turnOwnerId}); assert.equal(game.victory?.factionId,actor);
assert.equal(stateHash(replayArchive(journal.materialize())),stateHash(game));
writeFileSync(new URL('own-faster-initial.theandril',dir),initial); writeFileSync(new URL('own-faster-near.theandril',dir),near);
const result={scope:'Authored six-town infrastructure and budget; two ordinary paid projects with actual turn progress, neither fabricated.',nearHash,projectsBefore,siegeResult,plan,commands,victory:game.victory,finalHash:stateHash(game),exactReplay:true};
writeFileSync(new URL('own-faster-evidence.json',dir),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
