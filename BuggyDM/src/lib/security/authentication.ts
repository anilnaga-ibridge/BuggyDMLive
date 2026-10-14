import "server-only";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { createSession } from "@/lib/session";
import {
  clearRateLimit,
  consumeRateLimit,
} from "@/lib/security/session-store";
import { AdminRepository } from "@/repositories/database/admin.repository";

const CredentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
});

export type SignInFailureCode =
  | "INVALID_INPUT"
  | "INVALID_CREDENTIALS"
  | "RATE_LIMITED"
  | "FORBIDDEN"
  | "UNAVAILABLE";

export type SignInResult =
  | { ok: true }
  | {
      ok: false;
      code: SignInFailureCode;
      retryAfterSeconds?: number;
    };

function rateLimitKey(email: string, clientAddress: string | null): string {
  return crypto
    .createHash("sha256")
    .update(`${email}\u0000${clientAddress || "unknown"}`)
    .digest("hex");
}

export async function signInAdmin(
  input: unknown,
  clientAddress: string | null,
  requiredPermission?: string,
): Promise<SignInResult> {
  const parsed = CredentialsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "INVALID_INPUT" };

  const key = rateLimitKey(parsed.data.email, clientAddress);
  const attempt = await consumeRateLimit(key, 5, 15 * 60);
  if (!attempt.allowed) {
    return {
      ok: false,
      code: "RATE_LIMITED",
      retryAfterSeconds: attempt.retryAfterSeconds,
    };
  }

  try {
    const admin = await AdminRepository.findByEmail(parsed.data.email);
    if (!admin) return { ok: false, code: "INVALID_CREDENTIALS" };

    const passwordHash = admin.password.startsWith("$2y$")
      ? `$2a$${admin.password.substring(4)}`
      : admin.password;
    const passwordMatches = await bcrypt.compare(
      parsed.data.password,
      passwordHash,
    );
    if (!passwordMatches) {
      return { ok: false, code: "INVALID_CREDENTIALS" };
    }

    const roleId = Number(admin.role_id);
    const permissions = await AdminRepository.findPermissionKeys(roleId);
    if (
      requiredPermission &&
      roleId !== 1 &&
      !permissions.includes(requiredPermission)
    ) {
      await clearRateLimit(key);
      return { ok: false, code: "FORBIDDEN" };
    }

    await AdminRepository.updateLoginStats(Number(admin.id), {
      isLoggedIn: true,
    });
    await createSession({
      userId: Number(admin.id),
      email: admin.email,
      name: `${admin.f_name || ""} ${admin.l_name || ""}`.trim() || "Admin",
      roleId,
      permissions,
      organizationId: null,
      warehouseId: null,
    });
    await clearRateLimit(key);
    return { ok: true };
  } catch {
    return { ok: false, code: "UNAVAILABLE" };
  }
}
