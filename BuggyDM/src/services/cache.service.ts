import { prisma } from "@/lib/prisma";

export class CacheService {
  // Get cached value by metric key
  static async get<T>(key: string): Promise<T | null> {
    try {
      const cache = await prisma.panel_bi_caches.findUnique({
        where: { metric_key: key },
      });

      if (!cache) return null;
      return JSON.parse(cache.value) as T;
    } catch (error) {
      console.error(`[CacheService] Failed to get key ${key}:`, error);
      return null;
    }
  }

  // Set cached value by metric key
  static async set(key: string, value: unknown): Promise<boolean> {
    try {
      const jsonStr = JSON.stringify(value);

      await prisma.panel_bi_caches.upsert({
        where: { metric_key: key },
        update: {
          value: jsonStr,
        },
        create: {
          metric_key: key,
          value: jsonStr,
        },
      });

      return true;
    } catch (error) {
      console.error(`[CacheService] Failed to set key ${key}:`, error);
      return false;
    }
  }
}
