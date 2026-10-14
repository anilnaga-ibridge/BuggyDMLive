import { getRedisClient } from "@/lib/redis";
import { serializeBigInts } from "@/lib/prisma-extension";
import type Redis from "ioredis";
import {
  isCompiledLayoutTree,
  type CompiledLayoutTree,
} from "@/lib/qcos/types";

const CACHE_PREFIX = "qcos:layout:cache";

export class LayoutCacheManager {
  /**
   * Safe helper to get active Redis client if fully connected
   */
  private static getConnectedClient(): Redis | null {
    const redis = getRedisClient();
    if (!redis) return null;

    // ioredis status check: only proceed if status is 'ready'
    if (redis.status !== "ready") {
      return null;
    }
    return redis;
  }

  /**
   * Fetch layout from Redis cache
   */
  public static async getCachedLayout(
    pageName: string,
    appVersion: string,
    platform: string
  ): Promise<CompiledLayoutTree | null> {
    try {
      const redis = this.getConnectedClient();
      if (!redis) return null;

      const cacheKey = `${CACHE_PREFIX}:${pageName}:${appVersion}:${platform}`;
      const cached = await redis.get(cacheKey);

      if (cached) {
        const parsed = JSON.parse(cached) as unknown;
        return isCompiledLayoutTree(parsed) ? parsed : null;
      }
      return null;
    } catch (error) {
      console.warn("LayoutCacheManager.getCachedLayout failed:", error);
      return null;
    }
  }

  /**
   * Write layout to Redis cache with 24 hours expiration
   */
  public static async setCachedLayout(
    pageName: string,
    appVersion: string,
    platform: string,
    layoutData: CompiledLayoutTree
  ): Promise<void> {
    try {
      const redis = this.getConnectedClient();
      if (!redis) return;

      const cacheKey = `${CACHE_PREFIX}:${pageName}:${appVersion}:${platform}`;
      const serialized = JSON.stringify(serializeBigInts(layoutData));

      // Cache for 24 hours (86400 seconds)
      await redis.set(cacheKey, serialized, "EX", 86400);
    } catch (error) {
      console.warn("LayoutCacheManager.setCachedLayout failed:", error);
    }
  }

  /**
   * Invalidate all layout caches by clearing matching keys
   */
  public static async invalidateAllLayoutCaches(): Promise<void> {
    try {
      const redis = this.getConnectedClient();
      if (!redis) return;

      // Find all keys matching prefix
      const keys = await redis.keys(`${CACHE_PREFIX}:*`);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`[Cache] Invalidated ${keys.length} QCOS layout cache keys.`);
      }
    } catch (error) {
      console.warn("LayoutCacheManager.invalidateAllLayoutCaches failed:", error);
    }
  }
}
