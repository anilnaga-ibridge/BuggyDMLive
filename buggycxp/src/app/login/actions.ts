"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  buggyDmApiUrl,
  SESSION_COOKIE_NAME,
} from "@/lib/session";

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
});

export type CxpLoginState =
  | { error: string; code?: string }
  | undefined;

function sessionTokenFromSetCookie(value: string | null): string | null {
  if (!value) return null;
  const firstPair = value.split(";", 1)[0];
  const separator = firstPair.indexOf("=");
  if (separator < 1) return null;
  const name = firstPair.slice(0, separator).trim();
  const token = firstPair.slice(separator + 1).trim();
  if (name !== SESSION_COOKIE_NAME || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    return null;
  }
  return token;
}

export async function loginToCxp(
  _previousState: CxpLoginState,
  formData: FormData,
): Promise<CxpLoginState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Enter a valid email address and password.", code: "INVALID_INPUT" };
  }

  const requestHeaders = await headers();
  const clientAddress =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();

  let response: Response;
  try {
    response = await fetch(buggyDmApiUrl("/auth/login"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(clientAddress ? { "X-Forwarded-For": clientAddress } : {}),
      },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
  } catch (err) {
    console.error("[BUGGYCXP LOGIN FETCH ERROR]", err);
    return {
      error: "Identity service is temporarily unavailable. Please try again.",
      code: "UNAVAILABLE",
    };
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: { code?: string } }
      | null;
    const code = payload?.error?.code;
    if (response.status === 403 || code === "FORBIDDEN") {
      return {
        error: "Your account does not have access to BuggyCXP. Contact an administrator for the cxp.read permission.",
        code: "FORBIDDEN",
      };
    }
    if (response.status === 429 || code === "RATE_LIMITED") {
      return {
        error: "Too many sign-in attempts. Wait a few minutes and try again.",
        code: "RATE_LIMITED",
      };
    }
    if (response.status === 401) {
      return { error: "Invalid email or password.", code: "INVALID_CREDENTIALS" };
    }
    return {
      error: "Sign-in is temporarily unavailable. Please try again.",
      code: code || "UNAVAILABLE",
    };
  }

  const token = sessionTokenFromSetCookie(response.headers.get("set-cookie"));
  if (!token) {
    return {
      error: "The identity service returned an invalid session. Please try again.",
      code: "INVALID_SESSION",
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(Date.now() + 8 * 60 * 60 * 1_000),
    sameSite: "strict",
    path: "/",
    priority: "high",
  });
  redirect("/admin/experience");
}

export async function logoutFromCxp(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token && /^[A-Za-z0-9_-]{43}$/.test(token)) {
    await fetch(buggyDmApiUrl("/auth/logout"), {
      method: "POST",
      headers: {
        Cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(4_000),
    }).catch(() => null);
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
