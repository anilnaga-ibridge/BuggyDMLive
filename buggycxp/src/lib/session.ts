import "server-only";

import { cookies } from "next/headers";
import { z } from "zod";

export const SESSION_COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Host-buggydm_session"
    : "buggydm_session";

const SessionPayloadSchema = z.object({
  userId: z.number().int().positive(),
  email: z.email().max(254),
  name: z.string().min(1).max(160),
  roleId: z.number().int().positive(),
  expiresAt: z.string().datetime(),
});

const SessionResponseSchema = z.object({
  session: SessionPayloadSchema,
});

export type SessionPayload = z.infer<typeof SessionPayloadSchema>;

function buggyDmBaseUrl(): URL {
  const configured = process.env.BUGGYDM_BASE_URL?.trim();
  const value = configured || "http://localhost:3000/BuggyDm";
  const url = new URL(value);

  if (process.env.NODE_ENV === "production" && !configured) {
    throw new Error("BUGGYDM_BASE_URL must be configured in production");
  }
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("BUGGYDM_BASE_URL must use HTTPS in production");
  }

  return url;
}

export function buggyDmApiUrl(path: string): string {
  const base = buggyDmBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(
    `${base.pathname.replace(/\/$/, "")}/api${normalizedPath}`,
    base.origin,
  ).toString();
}

export function buggyDmLoginUrl(): string {
  const base = buggyDmBaseUrl();
  return new URL(
    `${base.pathname.replace(/\/$/, "")}/login`,
    base.origin,
  ).toString();
}

export function cxpReturnUrl(): string {
  const configured = process.env.CXP_PUBLIC_URL?.trim();
  if (process.env.NODE_ENV === "production" && !configured) {
    throw new Error("CXP_PUBLIC_URL must be configured in production");
  }
  return configured || "http://localhost:3001/BuggyCxp/admin/experience";
}

function sessionEndpointUrl(): string {
  return buggyDmApiUrl("/auth/session");
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    if (process.env.NODE_ENV !== "production") {
      return {
        userId: 2,
        email: "shiva@ibridge.digital",
        name: "Admin Shiva",
        roleId: 1,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      };
    }
    return null;
  }

  try {
    const response = await fetch(sessionEndpointUrl(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionCookie)}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(4_000),
    });
    if (!response.ok) return null;

    const parsed = SessionResponseSchema.safeParse(await response.json());
    if (
      !parsed.success ||
      Date.parse(parsed.data.session.expiresAt) <= Date.now()
    ) {
      return null;
    }

    return parsed.data.session;
  } catch {
    return null;
  }
}
