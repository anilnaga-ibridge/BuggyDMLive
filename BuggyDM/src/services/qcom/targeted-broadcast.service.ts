import { ScoredRider } from "@/lib/qcom/match-scoring.engine";
import { eventBus } from "@/lib/events/event-bus";

export class TargetedBroadcastService {
  /**
   * Broadcast order ping to top 3 candidate riders simultaneously
   */
  public static async broadcastPing(
    orderId: string,
    topCandidates: ScoredRider[],
    payoutAmount: number = 35.0
  ): Promise<boolean> {
    const top3 = topCandidates.slice(0, 3);
    if (top3.length === 0) {
      console.warn(`No eligible riders found for Order #${orderId}. Triggering escalation...`);
      await eventBus.emitEvent("sla.breached", {
        orderId,
        reason: "No candidate riders in 2km radius",
        escalation: "Expand radius + apply surge payout"
      });
      return false;
    }

    const payload = {
      orderId,
      payoutAmount: `₹${payoutAmount.toFixed(2)}`,
      candidates: top3.map((c) => ({ riderId: c.rider.id, eta: `${c.etaMins} mins` })),
      broadcastAt: new Date().toISOString(),
      expiresInSecs: 10
    };

    // Emit domain event for WebSocket server to push to rider devices
    await eventBus.emitEvent("order.assigned", payload);

    return true;
  }
}
