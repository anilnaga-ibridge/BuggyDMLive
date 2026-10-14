export interface MilestoneTier {
  tier: number;
  ordersRequired: number;
  bonusAmount: number;
  unlocked: boolean;
}

export class IncentiveGateEngine {
  private static AR_THRESHOLD_PERCENT = 85.0;

  /**
   * Evaluate if a rider qualifies for milestone bonuses based on their Acceptance Rate (AR) Gate
   */
  public static evaluateMilestones(
    ordersCompleted: number,
    ordersAccepted: number,
    ordersRejected: number
  ): { acceptanceRate: number; isArGateUnlocked: boolean; tiers: MilestoneTier[] } {
    const totalPings = ordersAccepted + ordersRejected;
    const acceptanceRate = totalPings > 0 ? (ordersAccepted / totalPings) * 100.0 : 100.0;
    const isArGateUnlocked = acceptanceRate >= this.AR_THRESHOLD_PERCENT;

    const tiers: MilestoneTier[] = [
      { tier: 1, ordersRequired: 15, bonusAmount: 50.0, unlocked: isArGateUnlocked && ordersCompleted >= 15 },
      { tier: 2, ordersRequired: 25, bonusAmount: 100.0, unlocked: isArGateUnlocked && ordersCompleted >= 25 },
      { tier: 3, ordersRequired: 35, bonusAmount: 200.0, unlocked: isArGateUnlocked && ordersCompleted >= 35 },
    ];

    return {
      acceptanceRate: parseFloat(acceptanceRate.toFixed(1)),
      isArGateUnlocked,
      tiers
    };
  }
}
