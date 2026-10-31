// Turns 250-335 of the Epic headline: what happens to Glass Tide's sieges of its lost Rune seam hearth settlement.648.
import { applyCommand, createGame, getObservation, type GameCommand, type GameState } from '/home/telephoneheater/Work/Theandril/packages/sim/src/index';
import { planTurn, planTurnWithReasons } from '/home/telephoneheater/Work/Theandril/packages/ai/src/index';
const state: GameState = createGame({ seed: 20260905, pace: 'epic', size: 'standard', factionCount: 12 });
const issue = (command: GameCommand) => applyCommand(state, command);
const GT = 'faction.glass_tide', SS = 'faction.sable_steppe', TOWN = 'settlement.648';
const short = (id: string) => id.replace('faction.', '');
const atWar = () => state.wars.some(p => p.includes(GT) && p.includes(SS));
for (let round = 0; round < 900 && !state.victory && state.turn <= 335; round++) {
  for (const faction of state.factions) {
    const view = getObservation(state, faction.id);
    let commands: GameCommand[];
    if (faction.id === GT && state.turn >= 250) {
      const planned = planTurnWithReasons(view);
      commands = planned.commands;
      const interesting = planned.reasons.filter(r => /648|[Aa]ssault|[Pp]eace|objective|[Ss]iege|besieg|Hearth 5/.test(r));
      const cmds = commands.filter(c => ['besiege', 'assault', 'liftSiege', 'proposePeace', 'respondPeace', 'declareWar', 'resolveCapture'].includes(c.type)).map(c => JSON.stringify(c));
      if (interesting.length || cmds.length) console.log(`turn ${state.turn} GT atWar ${atWar()} wars [${view.wars.map(short).join(',')}] commands ${cmds.join(' ')}\n   reasons: ${interesting.join(' || ')}`);
    } else commands = planTurn(view);
    if (faction.id === SS && state.turn >= 250) {
      const cmds = commands.filter(c => ['proposePeace', 'respondPeace', 'declareWar'].includes(c.type) && JSON.stringify(c).includes('glass_tide')).map(c => JSON.stringify(c));
      if (cmds.length) console.log(`turn ${state.turn} SS commands ${cmds.join(' ')}`);
    }
    for (const command of commands) {
      const result = issue(command);
      if (state.turn >= 250 && faction.id === GT && !result.ok && ['besiege', 'assault', 'proposePeace', 'respondPeace'].includes(command.type)) console.log(`   GT ${command.type} refused: ${result.error}`);
      for (let d = 0; state.battle || state.pendingCapture; d++) {
        if (d >= 4) throw new Error('bound');
        if (state.battle) { const b = state.battle; const c = [b.attackerFactionId, b.defenderFactionId].includes(state.turnOwnerId) ? state.turnOwnerId : b.attackerFactionId; issue({ type: 'autoResolveBattle', factionId: c }); }
        else if (state.pendingCapture) { const p = state.pendingCapture; const choice = planTurn(getObservation(state, p.factionId))[0]!; if (p.settlementId === TOWN) console.log(`turn ${state.turn} CAPTURE ${TOWN} by ${short(p.factionId)} choice ${JSON.stringify(choice)}`); issue(choice); }
      }
    }
  }
  issue({ type: 'endTurn', factionId: state.turnOwnerId });
  if (state.turn >= 250) {
    const siege = state.sieges[TOWN];
    const town = state.settlements[TOWN];
    const ward = state.wards.find(w => w.settlementId === TOWN);
    const offers = state.diplomacy.offers.filter(o => [o.proposerId, o.recipientId].includes(GT) && [o.proposerId, o.recipientId].includes(SS)).map(o => `${short(o.proposerId)}->${short(o.recipientId)} exp ${o.expiresTurn}`);
    const defenders = Object.values(state.armies).filter(a => a.cell === town?.cell && a.factionId === town?.factionId).length;
    if (siege || offers.length || (state.turn % 5 === 0)) console.log(`turn ${state.turn} END owner ${short(town?.factionId ?? '-')} atWar ${atWar()} siege ${siege ? `${short(siege.factionId)} army ${siege.armyId} since ${siege.startedTurn} defenses ${siege.defenses} supplies ${siege.supplies} militia ${siege.militiaStrength}` : '-'} defenders ${defenders} ward ${ward ? JSON.stringify(ward) : '-'} offers [${offers.join('; ')}]`);
  }
}
console.log('ended', state.turn, state.victory?.path);
