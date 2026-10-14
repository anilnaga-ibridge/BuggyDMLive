import crypto from "crypto";
import { getRedisClient } from "@/lib/redis";
import { serializeBigInts } from "@/lib/prisma-extension";
import type Redis from "ioredis";

const CACHE_PREFIX = "qcos:layout:cache";

export class LayoutCacheManager {
  /**
   * Safe helper to get active Redis client if fully connected
   */
  /**
   * Safe helper to get active Redis client if fully connected
   */
  private static async getConnectedClient(): Promise<Redis | null> {
    const redis = getRedisClient();
    if (!redis) return null;
    
    if (redis.status === "ready") {
      return redis;
    }

    if (redis.status === "connecting" || redis.status === "connect" || redis.status === "wait") {
      try {
        await new Promise<void>((resolve) => {
          if ((redis.status as string) === "ready") return resolve();
          const onReady = () => { cleanup(); resolve(); };
          const onError = () => { cleanup(); resolve(); };
          const cleanup = () => {
            redis.removeListener("ready", onReady);
            redis.removeListener("error", onError);
          };
          redis.once("ready", onReady);
          redis.once("error", onError);
          setTimeout(() => { cleanup(); resolve(); }, 1500);
        });
        if ((redis.status as string) === "ready") return redis;
      } catch {
        return null;
      }
    }
    return null;
  }

  private static getCapabilitiesHash(capabilities?: string[], widgetVersions?: Record<string, string>, variation?: Record<string, unknown>): string {
    const caps = capabilities || [];
    const wVers = widgetVersions || {};
    const payload = JSON.stringify({ caps: [...caps].sort(), wVers, variation: variation || {} });
    return crypto.createHash("sha256").update(payload).digest("hex");
  }

  /**
   * Fetch layout from Redis cache
   */
  public static async getCachedLayout(
    pageName: string,
    appVersion: string,
    platform: string,
    capabilities?: string[],
    widgetVersions?: Record<string, string>,
    variation?: Record<string, unknown>
  ): Promise<Record<string, unknown> | null> {
    try {
      const redis = await this.getConnectedClient();
      if (!redis) return null;

      const hash = this.getCapabilitiesHash(capabilities, widgetVersions, variation);
      const cacheKey = `${CACHE_PREFIX}:${pageName}:${appVersion}:${platform}:${hash}`;
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        const parsed: unknown = JSON.parse(cached);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
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
    layoutData: unknown,
    capabilities?: string[],
    widgetVersions?: Record<string, string>,
    variation?: Record<string, unknown>
  ): Promise<void> {
    try {
      const redis = await this.getConnectedClient();
      if (!redis) return;

      const hash = this.getCapabilitiesHash(capabilities, widgetVersions, variation);
      const cacheKey = `${CACHE_PREFIX}:${pageName}:${appVersion}:${platform}:${hash}`;
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
      const redis = await this.getConnectedClient();
      if (!redis) return;

      // Find all keys matching prefix using scan + keys fallback
      let cursor = "0";
      const matchingKeys: string[] = [];
      try {
        do {
          const [nextCursor, keys] = await redis.scan(cursor, "MATCH", `${CACHE_PREFIX}:*`, "COUNT", 100);
          cursor = nextCursor;
          if (keys && keys.length > 0) {
            matchingKeys.push(...keys);
          }
        } while (cursor !== "0");
      } catch {
        // Fallback to keys()
      }

      const fallbackKeys = await redis.keys(`${CACHE_PREFIX}:*`).catch(() => []);
      const allKeys = Array.from(new Set([...matchingKeys, ...fallbackKeys]));

      if (allKeys.length > 0) {
        await redis.del(...allKeys);
        console.log(`[Cache] Invalidated ${allKeys.length} QCOS layout cache keys.`);
      }
    } catch (error) {
      console.warn("LayoutCacheManager.invalidateAllLayoutCaches failed:", error);
    }
  }
}
