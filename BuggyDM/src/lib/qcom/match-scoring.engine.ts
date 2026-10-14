import { CandidateRiderProfile } from "./hard-constraint.filter";

export interface ScoredRider {
  rider: CandidateRiderProfile;
  score: number;
  etaMins: number;
  batchCompatibility: number;
  idleTimeMins: number;
  rejectionPenalty: number;
}

export class MatchScoringEngine {
  /**
   * Score eligible candidate riders dynamically
   */
  public static rankRiders(
    candidates: CandidateRiderProfile[],
    storeLat: number,
    storeLng: number,
    isStoreSlaStressed: boolean = false
  ): ScoredRider[] {
    // Dynamic Weights adjusting under operational stress
    const W_eta = isStoreSlaStressed ? 0.8 : 0.4;
    const W_batch = isStoreSlaStressed ? 0.1 : 0.3;
    const W_idle = 0.2;
    const W_pen = 0.1;

    const scored: ScoredRider[] = candidates.map((rider) => {
      // Distance estimation
      const latDiff = (rider.latitude || storeLat) - storeLat;
      const lngDiff = (rider.longitude || storeLng) - storeLng;
      const distKm = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111.0;
      const etaMins = Math.max(1, Math.round(distKm * 3.0));

      // Proximity Efficiency E_r (inverse of ETA)
      const E_r = 1.0 / (etaMins + 0.1);

      // Batching Compatibility B_r
      const B_r = rider.currentActiveOrders > 0 ? 0.9 : 0.0;

      // Idle Time I_r (assume 10 mins)
      const idleTimeMins = 10;
      const I_r = Math.min(1.0, idleTimeMins / 30.0);

      // Rejection Penalty P_r
      const P_r = 0.0;

      const score = (W_eta * E_r) + (W_batch * B_r) + (W_idle * I_r) - (W_pen * P_r);

      return {
        rider,
        score,
        etaMins,
        batchCompatibility: B_r,
        idleTimeMins,
        rejectionPenalty: P_r
      };
    });

    // Sort descending by calculated score
    return scored.sort((a, b) => b.score - a.score);
  }
}
