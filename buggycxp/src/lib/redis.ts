import Redis from "ioredis";

export const redisConnectionOptions = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  maxRetriesPerRequest: null, // Required by BullMQ
};

let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (!redisClient) {
    try {
      redisClient = new Redis(redisConnectionOptions);
      redisClient.on("error", () => {
        // Silently catch connection errors if local Redis instance is offline
      });
    } catch (err) {
      console.warn("Failed to connect to Redis:", err);
      redisClient = null;
    }
  }
  return redisClient;
}
