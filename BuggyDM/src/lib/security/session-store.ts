import "server-only";

import Redis from "ioredis";

type StoredValue = {
  value: string;
  expiresAt: number;
};

type MemoryState = {
  values: Map<string, StoredValue>;
};

const globalState = globalThis as typeof globalThis & {
  __buggyDmSessionMemory?: MemoryState;
  __buggyDmSessionRedis?: Redis;
};

const memory =
  globalState.__buggyDmSessionMemory ??
  (globalState.__buggyDmSessionMemory = { values: new Map() });

const SESSION_PREFIX = "buggydm:session:";
const RATE_LIMIT_PREFIX = "buggydm:rate:";

let lastRedisFailureTime = 0;
const REDIS_RETRY_INTERVAL_MS = 60_000; // 60s failure cooldown to prevent blocking requests

function sessionRedis(): Redis | null {
  if (globalState.__buggyDmSessionRedis) {
    return globalState.__buggyDmSessionRedis;
  }
  if (!process.env.REDIS_HOST) return null;

  const isDev = process.env.NODE_ENV !== "production";
  const client = new Redis({
    host: process.env.REDIS_HOST,
    port: Number.parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD || undefined,
    lazyConnect: true,
    connectTimeout: isDev ? 300 : 1_500,
    commandTimeout: isDev ? 300 : 1_500,
    maxRetriesPerRequest: 1,
    retryStrategy: isDev ? () => null : undefined,
    enableOfflineQueue: false,
    ...(process.env.REDIS_TLS === "true" ? { tls: {} } : {}),
  });
  client.on("error", () => {
    // Commands fail closed. Connection details are deliberately not logged.
  });
  globalState.__buggyDmSessionRedis = client;
  return client;
}

async function readyRedis(): Promise<Redis | null> {
  // If Redis failed recently, fail fast to in-memory store without stalling requests
  if (Date.now() - lastRedisFailureTime < REDIS_RETRY_INTERVAL_MS) {
    return null;
  }

  const client = sessionRedis();
  if (!client) return null;

  if (client.status === "ready") {
    return client;
  }

  try {
    if (client.status === "wait" || client.status === "close" || client.status === "end") {
      await client.connect();
    }
    if ((client.status as string) === "ready") {
      return client;
    }
    await client.ping();
    return client;
  } catch {
    lastRedisFailureTime = Date.now();
    return null;
  }
}

function requireProductionStore(): never {
  throw new Error("A server-side session store is required in production.");
}

function memoryGet(key: string): string | null {
  const stored = memory.values.get(key);
  if (!stored) return null;
  if (stored.expiresAt <= Date.now()) {
    memory.values.delete(key);
    return null;
  }
  return stored.value;
}

export async function putSession(
  tokenHash: string,
  value: string,
  ttlSeconds: number,
): Promise<void> {
  const redis = await readyRedis();
  if (redis) {
    await redis.set(`${SESSION_PREFIX}${tokenHash}`, value, "EX", ttlSeconds);
    return;
  }
  if (process.env.NODE_ENV === "production") requireProductionStore();
  memory.values.set(`${SESSION_PREFIX}${tokenHash}`, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1_000,
  });
}

export async function getStoredSession(tokenHash: string): Promise<string | null> {
  const redis = await readyRedis();
  if (redis) return redis.get(`${SESSION_PREFIX}${tokenHash}`);
  if (process.env.NODE_ENV === "production") requireProductionStore();
  return memoryGet(`${SESSION_PREFIX}${tokenHash}`);
}

export async function deleteStoredSession(tokenHash: string): Promise<void> {
  const redis = await readyRedis();
  if (redis) {
    await redis.del(`${SESSION_PREFIX}${tokenHash}`);
    return;
  }
  if (process.env.NODE_ENV === "production") requireProductionStore();
  memory.values.delete(`${SESSION_PREFIX}${tokenHash}`);
}

export async function consumeRateLimit(
  keyHash: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const key = `${RATE_LIMIT_PREFIX}${keyHash}`;
  const redis = await readyRedis();
  if (redis) {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, windowSeconds);
    const ttl = Math.max(await redis.ttl(key), 1);
    return { allowed: count <= limit, retryAfterSeconds: ttl };
  }
  if (process.env.NODE_ENV === "production") requireProductionStore();
  const current = memoryGet(key);
  const count = current == null ? 1 : Number.parseInt(current, 10) + 1;
  memory.values.set(key, {
    value: String(count),
    expiresAt: Date.now() + windowSeconds * 1_000,
  });
  return { allowed: count <= limit, retryAfterSeconds: windowSeconds };
}

export async function clearRateLimit(keyHash: string): Promise<void> {
  const key = `${RATE_LIMIT_PREFIX}${keyHash}`;
  const redis = await readyRedis();
  if (redis) {
    await redis.del(key);
    return;
  }
  if (process.env.NODE_ENV === "production") requireProductionStore();
  memory.values.delete(key);
}
