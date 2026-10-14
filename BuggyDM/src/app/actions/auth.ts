"use server";

import { deleteSession } from "@/lib/session";
import { signInAdmin } from "@/lib/security/authentication";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

type LoginState = { error: string } | undefined;

function safeReturnTo(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string" || value.length > 2_048) return null;

  try {
    const target = new URL(value);
    const configuredOrigin = process.env.CXP_PUBLIC_ORIGIN?.trim();
    const allowedOrigins = new Set<string>();

    if (configuredOrigin) {
      allowedOrigins.add(new URL(configuredOrigin).origin);
    }
    if (process.env.NODE_ENV !== "production") {
      allowedOrigins.add("http://localhost:3001");
      allowedOrigins.add("http://127.0.0.1:3001");
    }

    if (
      !allowedOrigins.has(target.origin) ||
      !target.pathname.startsWith("/BuggyCxp/")
    ) {
      return null;
    }

    return target.toString();
  } catch {
    return null;
  }
}

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const returnTo = safeReturnTo(formData.get("returnTo"));
  const requestHeaders = await headers();
  const clientAddress =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const result = await signInAdmin(
    {
      email: formData.get("email"),
      password: formData.get("password"),
    },
    clientAddress,
  );
  if (result.ok) redirect(returnTo ?? "/orders");

  if (result.code === "INVALID_INPUT") {
    return { error: "Please enter both email and password." };
  }
  if (result.code === "RATE_LIMITED") {
    return { error: "Too many sign-in attempts. Please try again later." };
  }
  if (result.code === "INVALID_CREDENTIALS") {
    return { error: "Invalid email or password." };
  }
  return { error: "Sign-in is temporarily unavailable. Please try again." };
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
