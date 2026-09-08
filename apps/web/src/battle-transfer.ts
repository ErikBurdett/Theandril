import type { BattlePresentation } from '@theandril/sim';

export interface BattleTransfer { revision: number; packet: BattlePresentation }

/** Transient, seat-participant-only facts. Neither spectator fog nor unrelated
 * AI callbacks can authorize a battle packet. Never included in saves/hashes. */
export class BattlePresentationMailbox {
  private revision = 0;
  private pending?: BattleTransfer;
  reset(): void { this.pending = undefined; }
  capture(packet: BattlePresentation, factionId: string): void {
    if (!packet.before.formations.some(formation => formation.factionId === factionId)) return;
    this.pending = { revision: ++this.revision, packet };
  }
  take(view: { battle: { id: string } | null; battleReports: readonly { id: string }[] }): BattleTransfer | undefined {
    const transfer = this.pending; this.pending = undefined;
    if (!transfer) return undefined;
    return view.battle?.id === transfer.packet.battleId || view.battleReports.some(report => report.id === transfer.packet.battleId) ? transfer : undefined;
  }
}
