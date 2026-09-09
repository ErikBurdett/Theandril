import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import type { BattlePresentation, BattlePresentationEvent, BattleSceneSnapshot } from '@theandril/sim';
import type { RuntimeArt } from './art';
import { battleLayout, BATTLE_EVENT_MS, BATTLE_FX_MS, BATTLE_IMPACT_MS, type BattlePoint } from './battle-layout';

type SoldierSprite = {
  sprite: Sprite; id: string; formationId: string; assetId: string; frameId: string | null;
  alive: boolean; hull: boolean; direction: 'e' | 'w'; state: string; scale: number; phase: number; point: BattlePoint; home: BattlePoint;
};
const phaseFor = (id: string) => { let hash = 0; for (const char of id) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0; return hash % 800; };
const hullRole = (role: string) => ['unit.transport', 'unit.coastal_warship', 'unit.ocean_warship'].includes(role);

/** One pooled sprite per authoritative member, or one per hull. No simulated
 * combat, random extra soldiers, per-member tickers, textures or text labels. */
export class BattleSoldierLayer {
  readonly container = new Container({ eventMode: 'none', sortableChildren: true });
  readonly shadows = new Graphics();
  readonly fallback = new Graphics();
  readonly points = new Map<string, BattlePoint>();
  private pool: SoldierSprite[] = [];
  private active: SoldierSprite[] = [];
  private byId = new Map<string, SoldierSprite>();
  private packet?: BattlePresentation;
  private deaths = new Map<string, number>();
  private movements = new Map<number, { before: BattlePoint; after: BattlePoint }>();
  private scene?: BattleSceneSnapshot;
  private width = 0;
  private height = 0;
  private art?: RuntimeArt;
  private anchors = new Map<string, BattlePoint>();
  private moving = false;
  readonly missing = new Set<string>();

  setPacket(packet: BattlePresentation | undefined): void {
    if (packet === this.packet) return;
    this.packet = packet; this.deaths.clear(); this.movements.clear();
    for (const [index, event] of (packet?.events ?? []).entries()) for (const id of event.killedSoldierIds ?? [])
      if (!this.deaths.has(id)) this.deaths.set(id, index * BATTLE_EVENT_MS + BATTLE_IMPACT_MS);
  }

  clear(): void {
    this.scene = undefined; this.active = []; this.points.clear(); this.byId.clear(); this.missing.clear();
    this.shadows.clear(); this.fallback.clear(); for (const actor of this.pool) actor.sprite.visible = false;
  }

  sync(scene: BattleSceneSnapshot, width: number, height: number, art: RuntimeArt | undefined): void {
    this.scene = scene; this.art = art;
    if (this.width !== width || this.height !== height) this.movements.clear();
    this.width = width; this.height = height; this.points.clear(); this.byId.clear(); this.active = []; this.missing.clear();
    this.shadows.clear(); this.fallback.clear();
    const layout = battleLayout(scene, width, height), formations = new Map(scene.formations.map(formation => [formation.id, formation]));
    this.anchors = layout.points;
    let index = 0;
    for (const soldier of scene.soldiers ?? []) {
      const formation = formations.get(soldier.formationId), point = layout.soldierPoints.get(soldier.id);
      if (!formation || !point) continue;
      let actor = this.pool[index];
      if (!actor) {
        const sprite = new Sprite(Texture.EMPTY); sprite.roundPixels = true; this.container.addChild(sprite);
        actor = { sprite, id: '', formationId: '', assetId: '', frameId: null, alive: true, hull: false, direction: 'e', state: 'idle', scale: 1, phase: 0, point: { x: 0, y: 0 }, home: { x: 0, y: 0 } };
        this.pool.push(actor);
      }
      index++; actor.id = soldier.id; actor.formationId = formation.id; actor.assetId = `battle.${formation.unitId}`;
      actor.alive = soldier.alive; actor.hull = hullRole(formation.unitId); actor.direction = formation.side === 'attacker' ? 'e' : 'w';
      actor.scale = layout.soldierScales.get(formation.id) ?? layout.scale; actor.phase = phaseFor(soldier.id);
      actor.point = { ...point }; actor.home = { ...point }; actor.sprite.position.set(Math.round(point.x), Math.round(point.y)); actor.sprite.zIndex = Math.round(point.y);
      actor.sprite.alpha = 1; actor.sprite.scale.set(actor.scale); actor.sprite.tint = 0xffffff;
      const frame = art?.frame(actor.assetId, 0, false, actor.direction);
      actor.sprite.visible = Boolean(frame); actor.frameId = frame?.frameId ?? null;
      if (frame) {
        actor.sprite.texture = frame.texture; actor.sprite.anchor.set(frame.asset.pivot[0] / frame.asset.nativeResolution.width, frame.asset.pivot[1] / frame.asset.nativeResolution.height);
      } else {
        this.missing.add(actor.assetId);
        this.fallback.rect(point.x - 3 * actor.scale, point.y - 19 * actor.scale, 6 * actor.scale, 18 * actor.scale).fill(formation.side === 'attacker' ? 0xaec3a0 : 0xd5b18b);
      }
      if (!actor.hull && actor.alive) this.shadows.ellipse(point.x, point.y - actor.scale, 6 * actor.scale, 2 * actor.scale).fill({ color: 0x152025, alpha: .32 });
      this.active.push(actor); this.byId.set(actor.id, actor); this.points.set(actor.id, actor.point);
    }
    for (; index < this.pool.length; index++) this.pool[index]!.sprite.visible = false;
  }

  private movement(event: BattlePresentationEvent) {
    const existing = this.movements.get(event.sequence); if (existing) return existing;
    if (!event.movement || !this.scene) return undefined;
    const movement = event.movement;
    const at = (position: typeof movement.before) => battleLayout({ ...this.scene!, formations: this.scene!.formations.map(formation => formation.id === movement.formationId ? { ...formation, position } : formation) }, this.width, this.height).points.get(movement.formationId);
    const before = at(movement.before), after = at(movement.after);
    if (!before || !after) return undefined;
    const result = { before, after }; this.movements.set(event.sequence, result); return result;
  }

  tick(elapsed: number, idleElapsed: number, reduced: boolean): void {
    if (!this.scene) return;
    const events = this.packet?.events ?? [];
    const actions = new Map<string, { event: BattlePresentationEvent; age: number }>();
    const hits = new Map<string, number>(), moves = new Map<string, { event: BattlePresentationEvent; age: number }>();
    if (!reduced) for (let index = Math.max(0, Math.floor((elapsed - BATTLE_FX_MS) / BATTLE_EVENT_MS)); index < Math.min(events.length, Math.floor(elapsed / BATTLE_EVENT_MS) + 1); index++) {
      const event = events[index]!, age = elapsed - index * BATTLE_EVENT_MS;
      if (age < 0 || age >= BATTLE_FX_MS) continue;
      if (event.movement && age < BATTLE_IMPACT_MS) moves.set(event.movement.formationId, { event, age });
      if (event.type === 'attack' || event.type === 'pursuit') for (const id of event.sourceSoldierIds ?? []) actions.set(id, { event, age });
      if (age >= BATTLE_IMPACT_MS && event.changes.some(change => change.strengthDelta < 0))
        for (const id of event.targetSoldierIds ?? []) hits.set(id, age - BATTLE_IMPACT_MS);
    }
    for (const actor of this.active) {
      const action = actions.get(actor.id), hit = hits.get(actor.id), move = moves.get(actor.formationId);
      let state = 'idle', age = idleElapsed + actor.phase;
      if (!actor.alive) { state = actor.hull ? 'sink' : 'death'; age = reduced ? BATTLE_FX_MS : Math.max(0, elapsed - (this.deaths.get(actor.id) ?? 0)); }
      else if (!reduced && hit !== undefined && hit < 400) { state = 'hit'; age = hit; }
      else if (!reduced && action) { state = actor.hull ? 'fire' : 'attack'; age = action.age; }
      else if (!reduced && move) { state = actor.hull ? 'sail' : 'walk'; age = move.age * 2; }
      actor.state = state;
      const frame = this.art?.frame(actor.assetId, age, !reduced || !actor.alive, actor.direction, state);
      if (frame) { actor.sprite.texture = frame.texture; actor.frameId = frame.frameId; }
      // Recompute from authoritative local slot, then interpolate only a
      // recorded formation move. Attack clips never invent forward movement.
      const anchor = this.anchors.get(actor.formationId);
      if (anchor) {
        let x = actor.home.x, y = actor.home.y;
        const geometry = move && this.movement(move.event);
        if (geometry) {
          const progress = move.age / BATTLE_IMPACT_MS;
          x += geometry.before.x + (geometry.after.x - geometry.before.x) * progress - anchor.x;
          y += geometry.before.y + (geometry.after.y - geometry.before.y) * progress - anchor.y;
        }
        actor.point.x = x; actor.point.y = y; actor.sprite.position.set(Math.round(x), Math.round(y));
        if (actor.sprite.zIndex !== Math.round(y)) actor.sprite.zIndex = Math.round(y);
      }
    }
    if (moves.size || this.moving) {
      this.shadows.clear();
      for (const actor of this.active) if (actor.alive && !actor.hull)
        this.shadows.ellipse(actor.point.x, actor.point.y - actor.scale, 6 * actor.scale, 2 * actor.scale).fill({ color: 0x152025, alpha: .32 });
    }
    this.moving = moves.size > 0;
  }

  pick(x: number, y: number): string | undefined {
    let selected: { formationId: string; distance: number } | undefined;
    for (const actor of this.active) {
      const distance = Math.hypot(x - actor.point.x, y - actor.point.y + 20 * actor.scale);
      if (distance < Math.max(6, 18 * actor.scale) && (!selected || distance < selected.distance)) selected = { formationId: actor.formationId, distance };
    }
    return selected?.formationId;
  }
  scale(id: string): number | undefined { return this.byId.get(id)?.scale; }
  diagnostics() {
    return { pooledSoldiers: this.pool.length, soldiers: this.active.map(actor => ({ id: actor.id, formationId: actor.formationId, assetId: actor.assetId, frameId: actor.frameId,
      alive: actor.alive, hull: actor.hull, state: actor.state, direction: actor.direction, scale: actor.scale, x: actor.point.x, y: actor.point.y })) };
  }
}
