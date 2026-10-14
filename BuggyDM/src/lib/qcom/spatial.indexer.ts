import { getRedisClient } from "@/lib/redis";

export class SpatialIndexer {
  private static KEY_RIDERS_GEO = "qcom:geo:riders";

  /**
   * Update rider's live spatial coordinate in Redis using GEOADD
   */
  public static async updateRiderLocation(riderId: string, latitude: number, longitude: number): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;
    try {
      // GEOADD key longitude latitude member
      await redis.geoadd(this.KEY_RIDERS_GEO, longitude, latitude, riderId);
    } catch (err) {
      console.error("SpatialIndexer updateRiderLocation error:", err);
    }
  }

  /**
   * Find candidate riders within radiusKm using Redis GEOSEARCH (sub-10ms query)
   */
  public static async findCandidateRiders(
    storeLatitude: number,
    storeLongitude: number,
    radiusKm: number = 2.0
  ): Promise<string[]> {
    const redis = getRedisClient();
    if (!redis) return [];
    try {
      // Redis GEOSEARCH command (Redis 6.2+) replacing deprecated GEORADIUS
      const rawResults = await redis.call(
        "GEOSEARCH",
        this.KEY_RIDERS_GEO,
        "FROMLONLAT",
        storeLongitude,
        storeLatitude,
        "BYRADIUS",
        radiusKm,
        "km",
        "ASC"
      ) as string[];

      return rawResults || [];
    } catch (err) {
      console.error("SpatialIndexer findCandidateRiders error:", err);
      return [];
    }
  }
}
