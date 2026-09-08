import type { RuntimeAsset } from '@theandril/art-pipeline/runtime';

export const BATTLE_EFFECT_IDS = {
  melee: 'effect.battle_melee', projectile: 'effect.battle_projectile',
  ember: 'effect.battle_ember', ward: 'effect.battle_ward', rally: 'effect.battle_rally',
} as const;
export type BattleEffectKind = keyof typeof BATTLE_EFFECT_IDS;
export const battleEffectState = (assetId: string): 'attack' | 'cast' => assetId === BATTLE_EFFECT_IDS.ember || assetId === BATTLE_EFFECT_IDS.ward ? 'cast' : 'attack';

export interface ClipRequest {
  state?: string; direction?: string; elapsedMs?: number; animate?: boolean;
}

/** Select only a genuinely registered state. Missing attack/cast art must not
 * silently become an idle clip or a mirrored asymmetric figure. Clock values
 * are presentation-only; this helper never advances a battle or issues orders. */
export function selectClipFrame(asset: Pick<RuntimeAsset, 'clips'>, request: ClipRequest = {}) {
  const state = request.state ?? 'idle', direction = request.direction ?? 'se';
  const clip = asset.clips.find(item => item.state === state && item.direction === direction)
    ?? asset.clips.find(item => item.state === state);
  if (!clip) return undefined;
  const durationMs = clip.durationsMs.reduce((sum, duration) => sum + duration, 0);
  const elapsedMs = Number.isFinite(request.elapsedMs) ? Math.max(0, request.elapsedMs ?? 0) : 0;
  let index = 0;
  if (request.animate && clip.frames.length > 1) {
    let cursor = clip.loop ? elapsedMs % durationMs : Math.min(elapsedMs, durationMs - 1);
    for (; index < clip.frames.length - 1; index++) {
      cursor -= clip.durationsMs[index]!;
      if (cursor < 0) break;
    }
  }
  return { frameId: clip.frames[index]!, state: clip.state, direction: clip.direction,
    durationMs, completed: !clip.loop && elapsedMs >= durationMs, index };
}
