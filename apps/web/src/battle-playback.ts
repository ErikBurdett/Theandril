/** Presentation visibility is part of Watch scheduling, never a battle rule. */
export function mayAdvanceBattleWatch(state: { watching: boolean; paused: boolean; busy: boolean; error: boolean; suspended: boolean; battle: boolean; playing: boolean }): boolean {
  return state.watching && !state.paused && !state.busy && !state.error && !state.suspended && state.battle && !state.playing;
}
/** Immediate viewport reveal, not a focus change or an animation-clock input. */
export function battleRevealOffset(top: number, height: number, viewportHeight: number): number {
  if (top >= 24 && top + height <= viewportHeight - 24) return 0;
  return top + height / 2 - viewportHeight / 2;
}
