import {createGame,serializeGame,stateHash,deserializeGame,SAVE_VERSION} from '../packages/sim/src/index';
import {createArchive,applyRecordedCommand,replayArchive} from '../packages/chronicle/src/index';
import {readFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import type {GameState,GameCommand} from '../packages/sim/src/index';
// Historical capture tool: deliberately refuses to regenerate evidence under later rules.
if(Number(SAVE_VERSION)!==7) throw Error('This capture requires the untouched schema-7 implementation.');
const captured=JSON.parse(readFileSync('./packages/chronicle/src/fixtures/v6-archives.json','utf8')) as {battle:{archive:{initialSave:string}}};
function run(game:GameState,coverage:'complete'|'from-save',steps:(game:GameState,issue:(command:GameCommand)=>void)=>void){
 const archive=createArchive(game,{mode:'player',coverage});
 const issue=(command:GameCommand)=>{const r=applyRecordedCommand(game,archive,command);if(!r.ok)throw Error(JSON.stringify(command)+r.error);};
 steps(game,issue); if(stateHash(replayArchive(archive))!==stateHash(game))throw Error('Pre-change replay mismatch');
 return{archive,save:serializeGame(game),hash:stateHash(game)};
}
const mission=run(createGame({seed:74,size:'tiny',factionCount:1,pace:'short'}),'complete',(game,issue)=>{
 const factionId=game.turnOwnerId;
 issue({type:'found',factionId,armyId:'army.1',name:'Witness hearth'});
 const settlementId=Object.values(game.settlements)[0]!.id;
 issue({type:'recruitCharacter',factionId,settlementId,definitionId:'character.surveyor'});
 const characterId=Object.keys(game.characters)[0]!;
 issue({type:'assignCharacter',factionId,characterId,armyId:'army.2'});
 issue({type:'startCharacterMission',factionId,characterId,missionId:'mission.survey',targetCell:game.armies['army.2']!.cell});
 issue({type:'endTurn',factionId});
});
let battleGame=deserializeGame(captured.battle.archive.initialSave);
for(const f of battleGame.armies['army.2']!.formations)f.morale=30;
battleGame=deserializeGame(serializeGame(battleGame));
const battle=run(battleGame,'from-save',(game,issue)=>{
 const factionId=game.turnOwnerId,settlementId=Object.values(game.settlements).find(t=>t.factionId===factionId)!.id,origin=game.armies['army.2']!.cell;
 issue({type:'moveTo',factionId,armyId:'army.2',target:game.settlements[settlementId]!.cell});
 issue({type:'recruitCharacter',factionId,settlementId,definitionId:'character.marshal'});
 const characterId=Object.keys(game.characters)[0]!;
 issue({type:'assignCharacter',factionId,characterId,armyId:'army.2'});
 issue({type:'endTurn',factionId});
 issue({type:'moveTo',factionId,armyId:'army.2',target:origin});
 issue({type:'declareWar',factionId,targetFactionId:game.factions[1]!.id});
 issue({type:'attack',factionId,armyId:'army.2',targetArmyId:'army.4'});
 issue({type:'useCommanderAbility',factionId,characterId,abilityId:'ability.rally'});
 issue({type:'battleOrder',factionId,order:'brace'});
});
const battleFinish=run(deserializeGame(battle.save),'from-save',(game,issue)=>{issue({type:'autoResolveBattle',factionId:game.turnOwnerId});issue({type:'endTurn',factionId:game.turnOwnerId});});
const result={capturedBefore:'Schema-8 generals and naval changes',contentHash:'9442246b',mission,battle,battleFinish};
process.stdout.write(JSON.stringify({encoding:'gzip-base64',payload:gzipSync(JSON.stringify(result)).toString('base64'),hashes:{mission:mission.hash,battle:battle.hash,battleFinish:battleFinish.hash}}));
