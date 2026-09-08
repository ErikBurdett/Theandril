import { Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import { factionArtId } from '@theandril/art-pipeline/runtime';
import type { BattlePresentation, BattleSceneSnapshot } from '@theandril/sim';
import type { RuntimeArt } from './art';
import { battleEffectState } from './animation';
import { battleActorBounds, battleAnnotationY, battleEffect, battleLayout, battleSeekRequested, BATTLE_EVENT_MS, BATTLE_FX_LIMIT, BATTLE_FX_MS, presentedEventCount, presentationDuration, presentationSnapshot, type BattleRect } from './battle-layout';

export interface BattlePlaybackProgress { revision: number; eventCount: number; eventTotal: number; completed: boolean }
export interface BattleSceneView {
  battleId: string; snapshot: BattleSceneSnapshot; packet?: BattlePresentation; revision: number;
  paused: boolean; speed: number; selectedId?: string; seekEnd?: number;
  onProgress?: (progress: BattlePlaybackProgress) => void;
  onSelect?: (id: string) => void;
}
type Actor = { root: Container; sprite: Sprite; fallback: Graphics; bar: Graphics; label: Text; id: string; assetId: string | null; frameId: string | null; bounds?: BattleRect };

/** A bounded presentation scene sharing the world's verified atlas and WebGL context. */
export class BattleScene {
  readonly container = new Container({ eventMode: 'none', visible: false });
  private ground = new Graphics();
  private actorsLayer = new Container();
  private effectsLayer = new Container();
  private actors: Actor[] = [];
  private effects: Sprite[] = [];
  private view?: BattleSceneView;
  private width = 0;
  private height = 0;
  private elapsed = 0;
  private previousTime = 0;
  private eventCount = -1;
  private completed = false;
  private dirty = true;
  private art?: RuntimeArt;
  private reduced = false;
  private current?: BattleSceneSnapshot;
  private points = new Map<string, { x: number; y: number }>();
  private activeEffects: { assetId: string; frameId: string; sourceId: string | null; targetId: string }[] = [];
  private missing = new Set<string>();
  private actorScale = 1;

  constructor() { this.container.addChild(this.ground, this.actorsLayer, this.effectsLayer); }
  get active() { return Boolean(this.view); }
  refreshArt(): void { this.dirty = true; }

  set(view: BattleSceneView | undefined): void {
    const changed = view?.battleId !== this.view?.battleId || view?.revision !== this.view?.revision;
    if (changed) { this.elapsed = 0; this.previousTime = 0; this.eventCount = -1; this.completed = false; this.missing.clear(); }
    if (battleSeekRequested(this.view, view) && view?.packet) this.elapsed = presentationDuration(view.packet);
    this.view = view; this.container.visible = Boolean(view); this.dirty = true;
    if (!view) { this.current = undefined; this.points.clear(); this.activeEffects = []; for (const actor of this.actors) actor.root.visible = false; for (const effect of this.effects) effect.visible = false; }
  }

  resize(width: number, height: number): void {
    if (this.width !== width || this.height !== height) { this.width = width; this.height = height; this.dirty = true; }
  }

  pick(x: number, y: number): void {
    if (!this.view) return;
    let nearest: { id: string; distance: number } | undefined;
    for (const [id, point] of this.points) {
      const distance = Math.hypot(x - point.x, y - point.y + 14);
      if (distance < 42 && (!nearest || distance < nearest.distance)) nearest = { id, distance };
    }
    if (nearest) this.view?.onSelect?.(nearest.id);
  }

  tick(time: number, art: RuntimeArt | undefined, reduced: boolean, hidden: boolean): void {
    const view = this.view;
    if (!view) return;
    if (this.art !== art || this.reduced !== reduced) { this.art = art; this.reduced = reduced; this.dirty = true; }
    const duration = view.packet ? presentationDuration(view.packet) : 0;
    if (reduced) this.elapsed = duration;
    else if (!view.paused && !hidden && this.previousTime) this.elapsed = Math.min(duration, this.elapsed + Math.min(100, time - this.previousTime) * view.speed);
    this.previousTime = hidden ? 0 : time;
    const count = view.packet ? presentedEventCount(this.elapsed, view.packet.events.length) : 0;
    const completed = this.elapsed >= duration;
    const progressChanged = count !== this.eventCount || completed !== this.completed;
    if (count !== this.eventCount || completed !== this.completed || this.dirty) {
      this.eventCount = count; this.completed = completed;
      this.current = view.packet ? completed ? view.packet.after : presentationSnapshot(view.packet, count) : view.snapshot;
      this.draw(this.current);
      if (progressChanged) view.onProgress?.({ revision: view.revision, eventCount: count, eventTotal: view.packet?.events.length ?? 0, completed });
      this.dirty = false;
    }
    this.drawEffects();
    const actions = view.packet?.events ?? [];
    const active = new Map<string, { event: typeof actions[number]; age: number }>();
    const impacts = new Map<string, { sourceId: string; age: number }>();
    if (!reduced && !this.completed) for (let index = Math.max(0, Math.floor((this.elapsed - BATTLE_FX_MS) / BATTLE_EVENT_MS)); index < Math.min(actions.length, Math.floor(this.elapsed / BATTLE_EVENT_MS) + 1); index++) {
      const event = actions[index]!, age = this.elapsed - index * BATTLE_EVENT_MS;
      if (event.sourceId && (event.type === 'attack' || event.type === 'ability') && age < BATTLE_FX_MS) {
        active.set(event.sourceId, { event, age });
        if (event.type === 'attack' && age >= 400 && age < 700) for (const targetId of event.targetIds) impacts.set(targetId, { sourceId: event.sourceId, age });
      }
    }
    // Idle frames are real registered poses; never mirror culture silhouettes.
    for (const actor of this.actors) if (actor.root.visible) {
      const origin = this.points.get(actor.id)!;
      actor.root.position.set(Math.round(origin.x), Math.round(origin.y));
      const action = active.get(actor.id), event = action?.event, age = action?.age ?? 0;
      if (!reduced && event?.type === 'attack') {
        const target = this.points.get(event.targetIds[0] ?? '');
        if (target) {
          const length = Math.hypot(target.x - origin.x, target.y - origin.y) || 1;
          const progress = age / BATTLE_FX_MS;
          const distance = (progress < .2 ? -2 * Math.sin(progress / .2 * Math.PI) : 7 * Math.sin((progress - .2) / .8 * Math.PI)) * this.actorScale;
          actor.root.position.set(Math.round(origin.x + (target.x - origin.x) / length * distance), Math.round(origin.y + (target.y - origin.y) / length * distance));
        }
      }
      const hit = impacts.get(actor.id), source = hit && this.points.get(hit.sourceId);
      if (hit && source) {
        const length = Math.hypot(origin.x - source.x, origin.y - source.y) || 1;
        const recoil = 3 * Math.sin((hit.age - 400) / 300 * Math.PI) * this.actorScale;
        actor.root.position.set(Math.round(actor.root.x + (origin.x - source.x) / length * recoil), Math.round(actor.root.y + (origin.y - source.y) / length * recoil));
      }
      if (actor.assetId) {
        const castOnly = actor.assetId === 'character.waykeeper';
        const frame = art?.frame(actor.assetId, castOnly ? age : this.elapsed, !reduced && (castOnly ? Boolean(event?.type === 'ability') : !view.paused && !hidden), 'se', castOnly ? 'cast' : 'idle');
        if (frame) { actor.sprite.texture = frame.texture; actor.frameId = frame.frameId; }
      }
    }
  }

  diagnostics() {
    return { active: this.active, battleId: this.view?.battleId ?? null, revision: this.view?.revision ?? null,
      round: this.current?.round ?? null, domain: this.current?.domain ?? null, fortification: this.current?.fortification ?? 0,
      eventCount: this.eventCount, eventTotal: this.view?.packet?.events.length ?? 0, completed: this.completed,
      reducedMotion: this.reduced, elapsedMs: this.elapsed, paused: this.view?.paused ?? true,
      formations: this.current?.formations.map(({ id, strength, morale, ward, side }) => ({ id, strength, morale, ward, side })) ?? [],
      width: this.width, height: this.height, actorScale: this.actorScale,
      actors: this.actors.filter(actor => actor.root.visible).map(actor => ({ id: actor.id, assetId: actor.assetId, frameId: actor.frameId, x: actor.root.x, y: actor.root.y, bounds: actor.bounds })),
      effects: [...this.activeEffects], pooledActors: this.actors.length, pooledEffects: this.effects.length, missingArt: [...this.missing] };
  }

  private draw(scene: BattleSceneSnapshot): void {
    const { width: w, height: h } = this, layout = battleLayout(scene, w, h);
    this.points = layout.points; this.actorScale = layout.scale;
    const color = scene.domain === 'naval' ? 0x223e48 : [0x294550, 0x434c3b, 0x354638, 0x514c3e, 0x4a4c48][scene.terrain] ?? 0x434c3b;
    this.ground.clear().rect(0, 0, w, h).fill(color);
    // Quiet schematic ground texture: context only, not fabricated tactical obstacles.
    for (let i = 0; i < 64; i++) {
      const x = (i * 137 + 29) % Math.max(1, w), y = (i * 79 + 47) % Math.max(1, h);
      this.ground.moveTo(x, y).lineTo(x + 7 + i % 13, y + (scene.domain === 'naval' ? 0 : 2)).stroke({ color: 0xc6bea0, alpha: .07, width: 1 });
    }
    if (scene.settlementId && scene.fortification > 0) {
      if (layout.portrait) this.ground.rect(14, h / 2 - 45, w - 28, 10).fill(0x81796b).stroke({ color: 0xb9ac89, alpha: .55, width: 1 });
      else this.ground.rect(w / 2 + 45, 18, 10, h - 36).fill(0x81796b).stroke({ color: 0xb9ac89, alpha: .55, width: 1 });
    }
    let index = 0;
    for (const entity of [...scene.formations, ...scene.characters]) {
      const point = this.points.get(entity.id)!;
      const formation = 'unitId' in entity ? entity : undefined;
      const role = formation?.unitId ?? ('definitionId' in entity ? entity.definitionId : '');
      const assetId = factionArtId(role, entity.factionDefinitionId) ?? (role === 'character.waykeeper' ? role : undefined);
      const frame = assetId ? this.art?.frame(assetId, 0, false, 'se', role === 'character.waykeeper' ? 'cast' : 'idle') : undefined;
      if (assetId && !frame) this.missing.add(assetId);
      const actor = this.actor(index++);
      actor.bounds = battleActorBounds(role, point, layout.scale);
      actor.id = entity.id; actor.assetId = frame?.asset.id ?? null; actor.frameId = frame?.frameId ?? null;
      actor.root.visible = true; actor.root.position.set(Math.round(point.x), Math.round(point.y));
      actor.root.alpha = formation && (formation.strength <= 0 || formation.morale <= 0) ? .35 : 1;
      actor.sprite.visible = Boolean(frame); actor.fallback.visible = !frame;
      if (frame) {
        actor.sprite.texture = frame.texture; actor.sprite.anchor.set(frame.asset.pivot[0] / frame.asset.nativeResolution.width, frame.asset.pivot[1] / frame.asset.nativeResolution.height);
        actor.sprite.scale.set(layout.scale); actor.sprite.tint = 0xffffff;
      } else {
        actor.fallback.clear();
        if (scene.domain === 'naval' && formation) actor.fallback.poly([-18, -12, 18, -12, 12, -4, -12, -4]).fill(0xc3b790).moveTo(0, -12).lineTo(0, -33).stroke({ width: 2, color: 0xc3b790 });
        else actor.fallback.circle(0, -24, 5).fill(0xc3b790).poly([-9, -4, 0, -20, 9, -4]).fill(0xc3b790);
      }
      const selected = entity.id === this.view?.selectedId;
      const barY = battleAnnotationY(role, layout.scale);
      actor.bar.clear().roundRect(-20, barY, 40, 5, 2).fill(0x172326);
      if (formation) actor.bar.roundRect(-20, barY, 40 * Math.max(0, Math.min(1, formation.strength / formation.maxStrength)), 5, 2).fill(entity.side === 'attacker' ? 0xaec3a0 : 0xd5b18b);
      if (selected) actor.bar.ellipse(0, -5, 24, 8).stroke({ color: 0xf0d498, alpha: .8, width: 1.5 });
      const firstName = 'name' in entity ? entity.name.split(' ')[0]! : '';
      actor.label.text = formation ? String(formation.strength) : firstName.length > 6 ? firstName.slice(0, 5) + '…' : firstName;
      actor.label.position.set(0, barY + 8); actor.label.anchor.set(.5, 0);
    }
    for (; index < this.actors.length; index++) this.actors[index]!.root.visible = false;
  }

  private actor(index: number): Actor {
    const existing = this.actors[index]; if (existing) return existing;
    const root = new Container(), sprite = new Sprite(Texture.EMPTY), fallback = new Graphics(), bar = new Graphics();
    const label = new Text({ text: '', style: { fontFamily: 'Arial', fontSize: 11, fill: 0xe8dfca, stroke: { color: 0x152225, width: 3 } }, resolution: 1 });
    sprite.roundPixels = true; root.addChild(sprite, fallback, bar, label); this.actorsLayer.addChild(root);
    const actor = { root, sprite, fallback, bar, label, id: '', assetId: null, frameId: null }; this.actors.push(actor); return actor;
  }

  private drawEffects(): void {
    this.activeEffects = [];
    const packet = this.view?.packet;
    let index = 0;
    if (packet && !this.reduced && !this.completed) for (let i = Math.max(0, Math.floor((this.elapsed - BATTLE_FX_MS) / BATTLE_EVENT_MS)); i < packet.events.length; i++) {
      const event = packet.events[i]!, age = this.elapsed - i * BATTLE_EVENT_MS;
      if (age < 0) break;
      if (age >= BATTLE_FX_MS) continue;
      const assetId = battleEffect(event); if (!assetId) continue;
      for (const targetId of event.targetIds) {
        if (index >= BATTLE_FX_LIMIT) break;
        const target = this.points.get(targetId); if (!target) continue;
        const frame = this.art?.frame(assetId, age, true, 'se', battleEffectState(assetId));
        if (!frame) { this.missing.add(assetId); continue; }
        let sprite = this.effects[index];
        if (!sprite) { sprite = new Sprite(Texture.EMPTY); sprite.roundPixels = true; this.effects.push(sprite); this.effectsLayer.addChild(sprite); }
        index++; sprite.visible = true; sprite.texture = frame.texture; sprite.anchor.set(frame.asset.pivot[0] / frame.asset.nativeResolution.width, frame.asset.pivot[1] / frame.asset.nativeResolution.height); sprite.scale.set(this.actorScale);
        const source = event.sourceId ? this.points.get(event.sourceId) : undefined;
        const progress = Math.min(1, age / 400);
        const travelling = event.attackKind === 'projectile' && source;
        sprite.position.set(Math.round(travelling ? source.x + (target.x - source.x) * progress : target.x), Math.round((travelling ? source.y + (target.y - source.y) * progress : target.y) - 18));
        this.activeEffects.push({ assetId, frameId: frame.frameId, sourceId: event.sourceId, targetId });
      }
    }
    for (; index < this.effects.length; index++) this.effects[index]!.visible = false;
  }

  destroy(): void { this.view = undefined; this.container.destroy({ children: true }); this.actors = []; this.effects = []; }
}
