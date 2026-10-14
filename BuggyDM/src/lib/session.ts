import "server-only";

import crypto from "crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { z } from "zod";
import {
  deleteStoredSession,
  getStoredSession,
  putSession,
} from "@/lib/security/session-store";

const SESSION_TTL_SECONDS = 8 * 60 * 60;
export const SESSION_COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Host-buggydm_session"
    : "buggydm_session";

const SessionSchema = z.object({
  sessionId: z.string().uuid(),
  userId: z.number().int().positive(),
  roleId: z.number().int().positive(),
  name: z.string().min(1).max(160),
  email: z.email().max(254),
  permissions: z.array(z.string().min(1).max(120)).max(250),
  organizationId: z.number().int().positive().nullable(),
  warehouseId: z.number().int().positive().nullable(),
  issuedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});

export type SessionPayload = z.infer<typeof SessionSchema>;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function isSessionTokenShape(token: string | undefined): token is string {
  return typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token);
}

export async function createSession(
  payload: Omit<
    SessionPayload,
    "sessionId" | "issuedAt" | "expiresAt"
  >,
): Promise<void> {
  const token = crypto.randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1_000);
  const session = SessionSchema.parse({
    ...payload,
    sessionId: crypto.randomUUID(),
    issuedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  });
  await putSession(hashToken(token), JSON.stringify(session), SESSION_TTL_SECONDS);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "strict",
    path: "/",
    priority: "high",
  });
}

export const getSession = cache(
  async function getSession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!isSessionTokenShape(token)) return null;
    try {
      const raw = await getStoredSession(hashToken(token));
      if (!raw) return null;
      const session = SessionSchema.parse(JSON.parse(raw));
      if (Date.parse(session.expiresAt) <= Date.now()) {
        await deleteStoredSession(hashToken(token));
        return null;
      }
      return session;
    } catch {
      return null;
    }
  },
);

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (isSessionTokenShape(token)) {
    await deleteStoredSession(hashToken(token));
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}
