import type { BattlePresentation, BattlePresentationEvent, BattleSceneSnapshot } from '@theandril/sim';
import { BATTLE_EFFECT_IDS } from './animation';

export const BATTLE_FX_LIMIT = 12;
export const BATTLE_EVENT_MS = 150;
export const BATTLE_FX_MS = 800;
export const BATTLE_IMPACT_MS = 400;
const PORTRAIT_TITLE_SPACE = 56; // 28px title strip plus at least 28px clear above it.
export function presentedEventCount(elapsed: number, total: number): number {
  return Math.max(0, Math.min(total, Math.floor((elapsed - BATTLE_IMPACT_MS) / BATTLE_EVENT_MS) + 1));
}
export interface BattlePoint { x: number; y: number }
export function interpolateBattlePoint(before: BattlePoint, after: BattlePoint, progress: number): BattlePoint {
  const amount = Math.max(0, Math.min(1, progress));
  return { x: before.x + (after.x - before.x) * amount, y: before.y + (after.y - before.y) * amount };
}
export interface BattleRect { x: number; y: number; width: number; height: number }
/** Published, untrimmed native contracts; checked against the runtime catalog. */
export function battleSpriteContract(role: string) {
  const large = ['unit.cavalry', 'unit.lancer', 'unit.transport', 'unit.coastal_warship', 'unit.ocean_warship'].includes(role);
  return large ? { width: 96, height: 96, pivotX: 48, pivotY: 80 } : { width: 64, height: 64, pivotX: 32, pivotY: 56 };
}
export function battleAnnotationY(role: string, scale: number): number {
  const sprite = battleSpriteContract(role);
  return (sprite.height - sprite.pivotY) * scale + 3;
}
/** Includes native canvas, unscaled numeric label, and maximum lunge + recoil. */
export function battleActorBounds(role: string, point: BattlePoint, scale: number): BattleRect {
  const sprite = battleSpriteContract(role), motion = 10 * scale;
  const halfWidth = Math.max(sprite.width * scale / 2, role.startsWith('character.') ? 36 : 24) + motion;
  const top = sprite.pivotY * scale + motion;
  const bottom = battleAnnotationY(role, scale) + 8 + 20 + motion;
  return { x: point.x - halfWidth, y: point.y - top, width: halfWidth * 2, height: top + bottom };
}
type PlaybackKey = { battleId: string; revision: number; seekEnd?: number };
export function battleSeekRequested(previous: PlaybackKey | undefined, next: PlaybackKey | undefined): boolean {
  return Boolean(previous && next && previous.battleId === next.battleId && previous.revision === next.revision && next.seekEnd && next.seekEnd !== previous.seekEnd);
}
function geometry(scene: BattleSceneSnapshot, width: number) {
  const largest = scene.formations.some(item => battleSpriteContract(item.unitId).width === 96) ? 'unit.cavalry' : 'unit.guard';
  const ranks = Math.max(1, ...scene.formations.map(item => item.row + 1));
  const native = battleActorBounds(largest, { x: 0, y: 0 }, 1);
  const portrait = width < Math.max(720, 2 * ranks * (native.width + 8) + 48);
  const scale = portrait ? .5 : 1;
  const body = battleActorBounds(largest, { x: 0, y: 0 }, scale), support = battleActorBounds('character.marshal', { x: 0, y: 0 }, scale);
  const supportColumns = Math.max(1, Math.floor(((portrait ? width : width / 2) - 24) / (support.width + 8)));
  const supportRows = Math.ceil(Math.max(0, ...(['attacker', 'defender'] as const).map(side => scene.characters.filter(item => item.side === side).length)) / supportColumns);
  const railHeight = supportRows * (support.height + 8);
  const positionMargin = scene.formations.some(formation => formation.position) ? (portrait ? 0 : body.height / 2) : 0;
  const height = (portrait
    ? 48 + railHeight * 2 + ranks * 2 * (body.height + 8) + 40 + PORTRAIT_TITLE_SPACE
    : 48 + 5 * (body.height + 8) + railHeight + 16) + positionMargin * 2;
  return { portrait, scale, body, support, ranks, supportColumns, supportRows, railHeight, height, positionMargin };
}
export function battleSceneHeight(scene: BattleSceneSnapshot, width: number): number { return geometry(scene, width).height; }
export function battleIsPortrait(scene: BattleSceneSnapshot, width: number): boolean { return geometry(scene, width).portrait; }

/** Historical deployment stays schematic. Modern anchors follow only the
 * canonical forward/flank position; stable soldier slots never recenter on losses. */
export function battleLayout(scene: BattleSceneSnapshot, width: number, height: number) {
  const { portrait, scale, body, support, ranks, supportColumns, railHeight, positionMargin } = geometry(scene, width);
  const points = new Map<string, BattlePoint>();
  const horizontalPitch = portrait ? Math.min(body.width + 8, (width - body.width - 16) / 4) : body.width + 8;
  const verticalPitch = body.height + 8;
  const formationTop = 40 + (portrait ? railHeight : 0) + positionMargin;
  for (const formation of scene.formations) {
    const file = formation.column, rank = formation.row;
    const point = portrait
      ? { x: width / 2 + (file - 2) * horizontalPitch, y: formationTop - body.y + (formation.side === 'defender' ? ranks - 1 - rank : ranks + rank) * verticalPitch + (formation.side === 'attacker' ? 40 : 0) }
      : { x: width / 2 + (formation.side === 'attacker' ? -1 : 1) * (24 + body.width / 2 + rank * horizontalPitch), y: formationTop - body.y + file * verticalPitch };
    if (formation.position) {
      const forward = formation.position.forward / 4, lateral = formation.position.lateral;
      if (portrait) { point.y += (formation.side === 'attacker' ? -1 : 1) * forward * (verticalPitch * .4 + 40) / 2; point.x += lateral * horizontalPitch * .2; }
      else { point.x += (formation.side === 'attacker' ? 1 : -1) * forward * Math.max(0, (body.width + 48 - horizontalPitch * .88) / 2); point.y += lateral * verticalPitch * .2; }
    }
    points.set(formation.id, point);
  }
  const sideCounts = { attacker: 0, defender: 0 };
  for (const character of scene.characters) {
    const index = sideCounts[character.side]++;
    const column = index % supportColumns, row = Math.floor(index / supportColumns);
    points.set(character.id, portrait
      ? { x: 12 + support.width / 2 + column * (support.width + 8), y: character.side === 'attacker' ? height - PORTRAIT_TITLE_SPACE - 8 - (support.y + support.height) - row * (support.height + 8) : 32 - support.y + row * (support.height + 8) }
      : { x: character.side === 'attacker' ? 12 + support.width / 2 + column * (support.width + 8) : width - 12 - support.width / 2 - column * (support.width + 8), y: height - 8 - (support.y + support.height) - row * (support.height + 8) });
  }
  const soldierPoints = new Map<string, BattlePoint>(), soldierScales = new Map<string, number>();
  const formationSpan = { x: horizontalPitch * .88, y: verticalPitch * .6 };
  const formations = new Map(scene.formations.map(formation => [formation.id, formation]));
  for (const soldier of scene.soldiers ?? []) {
    const anchor = points.get(soldier.formationId), formation = formations.get(soldier.formationId);
    if (!anchor || !formation) continue;
    soldierPoints.set(soldier.id, { x: anchor.x + soldier.x * formationSpan.x, y: anchor.y + soldier.y * formationSpan.y });
    if (!soldierScales.has(formation.id)) {
      const hull = ['unit.transport', 'unit.coastal_warship', 'unit.ocean_warship'].includes(formation.unitId);
      const mounted = formation.unitId === 'unit.cavalry' || formation.unitId === 'unit.lancer';
      const columns = Math.min(10, Math.max(1, Math.ceil(Math.sqrt(formation.maxStrength)))), rows = Math.ceil(formation.maxStrength / columns);
      soldierScales.set(formation.id, hull ? scale : Math.min(.65, formationSpan.x / columns / (mounted ? 60 : 24), formationSpan.y / rows / (mounted ? 32 : 20)));
    }
  }
  return { points, scale, portrait, soldierPoints, soldierScales, formationSpan };
}

export function battleEffect(event: BattlePresentationEvent): string | undefined {
  if (event.type !== 'attack' && event.type !== 'ability' && event.type !== 'pursuit') return undefined;
  return event.attackKind === 'fire' ? BATTLE_EFFECT_IDS.ember
    : event.attackKind === 'ward' || event.attackKind === 'brace' ? BATTLE_EFFECT_IDS.ward
      : event.attackKind === 'rally' ? BATTLE_EFFECT_IDS.rally
        : event.attackKind === 'projectile' ? BATTLE_EFFECT_IDS.projectile
          : event.attackKind === 'melee' || event.attackKind === 'reach' ? BATTLE_EFFECT_IDS.melee : undefined;
}

export function presentationDuration(packet: BattlePresentation): number {
  return packet.events.length ? (packet.events.length - 1) * BATTLE_EVENT_MS + BATTLE_FX_MS : 0;
}

/** Apply only recorded numeric changes to a detached presentation snapshot. */
export function presentationSnapshot(packet: BattlePresentation, eventCount: number): BattleSceneSnapshot {
  if (eventCount >= packet.events.length && !packet.before.soldiers) return packet.after;
  const formations = packet.before.formations.map(formation => ({ ...formation, ...(formation.position ? { position: { ...formation.position } } : {}), ...(formation.members ? { members: [...formation.members] } : {}) }));
  const soldiers = packet.before.soldiers?.map(soldier => ({ ...soldier }));
  const soldierById = new Map(soldiers?.map(soldier => [soldier.id, soldier]));
  const byId = new Map(formations.map(formation => [formation.id, formation]));
  let round = packet.before.round;
  for (const event of packet.events.slice(0, Math.max(0, eventCount))) {
    round = event.round;
    if (event.movement) {
      const formation = byId.get(event.movement.formationId);
      if (formation) formation.position = { ...event.movement.after };
    }
    for (const id of event.killedSoldierIds ?? []) {
      const soldier = soldierById.get(id); if (!soldier) continue;
      soldier.alive = false;
      const formation = byId.get(soldier.formationId);
      if (formation?.members) formation.members = formation.members.filter(slot => slot !== soldier.slot);
    }
    for (const change of event.changes) {
      const formation = byId.get(change.formationId);
      if (!formation) continue;
      formation.strength += change.strengthDelta; formation.morale += change.moraleDelta;
      formation.fatigue += change.fatigueDelta; formation.ward += change.wardDelta;
      if (change.cohesionDelta !== undefined && formation.cohesion !== undefined) formation.cohesion += change.cohesionDelta;
    }
  }
  // The renderer drops these exact casualties when playback completes. Keeping
  // their original identities until then allows the final hit/death clip to play.
  if (eventCount >= packet.events.length) {
    const survivors = new Set(packet.after.soldiers?.map(soldier => soldier.id));
    return { ...packet.after, soldiers: soldiers?.map(soldier => ({ ...soldier, alive: survivors.has(soldier.id) })) ?? [] };
  }
  return { ...packet.before, round, formations, ...(soldiers ? { soldiers } : {}) };
}
