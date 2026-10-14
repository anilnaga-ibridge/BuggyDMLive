export interface PayoutBreakdown {
  basePay: number;
  extraDistancePay: number;
  peakSurge: number;
  weatherSurge: number;
  milestoneBonus: number;
  totalPayout: number;
}

export class PayoutCalculatorService {
  /**
   * Calculate dynamic order payout P_o
   */
  public static calculateOrderPayout(
    distanceKm: number,
    isPeakHour: boolean = false,
    isBadWeather: boolean = false
  ): PayoutBreakdown {
    const basePay = 25.0; // B
    const baseRadiusKm = 2.0;
    const extraDistKm = Math.max(0, distanceKm - baseRadiusKm); // D_extra
    const ratePerKm = 8.0; // R_d

    const extraDistancePay = extraDistKm * ratePerKm;
    const peakSurge = isPeakHour ? 15.0 : 0.0;
    const weatherSurge = isBadWeather ? 20.0 : 0.0;
    const milestoneBonus = 0.0;

    const totalPayout = basePay + extraDistancePay + peakSurge + weatherSurge + milestoneBonus;

    return {
      basePay,
      extraDistancePay,
      peakSurge,
      weatherSurge,
      milestoneBonus,
      totalPayout
    };
  }
}
