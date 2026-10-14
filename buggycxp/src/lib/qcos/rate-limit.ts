import { getRedisClient } from "@/lib/redis";

export async function checkResolveRateLimit(request: Request): Promise<{ allowed: boolean; retryAfter: number }> {
  return checkRateLimit(request, "resolve", Number(process.env.CXP_RESOLVE_RATE_LIMIT || 120));
}

export async function checkTelemetryRateLimit(request: Request): Promise<{ allowed: boolean; retryAfter: number }> {
  return checkRateLimit(request, "telemetry", Number(process.env.CXP_TELEMETRY_RATE_LIMIT || 300));
}

async function checkRateLimit(request: Request, scope: string, limit: number): Promise<{ allowed: boolean; retryAfter: number }> {
  const redis = getRedisClient();
  if (!redis || redis.status !== "ready") return { allowed: true, retryAfter: 0 };
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const identity = forwarded || request.headers.get("x-real-ip") || "unknown";
  const windowSeconds = 60;
  const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
  const key = `qcos:ratelimit:${scope}:${identity}:${bucket}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, windowSeconds + 5);
  return { allowed: count <= limit, retryAfter: windowSeconds };
}
