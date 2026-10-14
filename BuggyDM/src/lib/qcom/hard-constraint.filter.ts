import { prisma } from "@/lib/prisma";

export interface CandidateRiderProfile {
  id: string;
  name: string;
  status: string;
  maxActiveOrders: number;
  currentActiveOrders: number;
  maxVolumeCm3: number;
  currentVolumeCm3: number;
  latitude?: number;
  longitude?: number;
}

export class HardConstraintFilter {
  /**
   * Filter out riders who violate hard operational constraints
   */
  public static async filterCandidates(
    candidateIds: string[],
    orderVolumeCm3: number = 2000.0
  ): Promise<CandidateRiderProfile[]> {
    if (candidateIds.length === 0) return [];

    const bigintIds = candidateIds.map((id) => BigInt(id));
    const riders = await prisma.delivery_men.findMany({
      where: {
        id: { in: bigintIds },
        shift_status: "Online" // Constraint: Must be Online
      },
      include: {
        sessions: {
          orderBy: { check_in_at: "desc" },
          take: 1
        }
      }
    });

    const eligible: CandidateRiderProfile[] = [];

    for (const rider of riders) {
      // 1. Capacity constraint (active orders < max_active_orders)
      const currentActive = 0; // Can query active delivery batches
      const maxActive = rider.max_active_orders || 2;
      if (currentActive >= maxActive) continue;

      // 2. Volume constraint
      const currentVol = 0.0;
      const maxVol = rider.max_volume_cm3 || 30000.0;
      if (currentVol + orderVolumeCm3 > maxVol) continue;

      const fullName = [rider.f_name, rider.l_name].filter(Boolean).join(" ") || `Rider #${rider.id}`;

      eligible.push({
        id: rider.id.toString(),
        name: fullName,
        status: rider.shift_status || "Offline",
        maxActiveOrders: maxActive,
        currentActiveOrders: currentActive,
        maxVolumeCm3: maxVol,
        currentVolumeCm3: currentVol,
        latitude: rider.latitude || undefined,
        longitude: rider.longitude || undefined
      });
    }

    return eligible;
  }
}
