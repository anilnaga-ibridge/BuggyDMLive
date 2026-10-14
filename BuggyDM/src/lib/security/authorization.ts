import "server-only";

import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "@/lib/session";

export const Permissions = {
  ordersRead: "orders.read",
  ordersManage: "orders.manage",
  catalogRead: "catalog.read",
  catalogManage: "catalog.manage",
  operationsRead: "operations.read",
  operationsExecute: "operations.execute",
  operationsManage: "operations.manage",
  ridersRead: "riders.read",
  ridersManage: "riders.manage",
  analyticsRead: "analytics.read",
  navigationManage: "admin.navigation.manage",
  rbacManage: "admin.rbac.manage",
  cxpRead: "cxp.read",
  cxpPublish: "cxp.publish",
  filesUpload: "files.upload",
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

export class AccessDeniedError extends Error {
  constructor(
    readonly code: "UNAUTHENTICATED" | "FORBIDDEN",
    readonly status: 401 | 403,
  ) {
    super(code);
    this.name = "AccessDeniedError";
  }
}

export function hasPermission(
  session: SessionPayload,
  permission: Permission,
): boolean {
  return session.roleId === 1 || session.permissions.includes(permission);
}

export async function requirePermission(
  permission: Permission,
): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new AccessDeniedError("UNAUTHENTICATED", 401);
  if (!hasPermission(session, permission)) {
    throw new AccessDeniedError("FORBIDDEN", 403);
  }
  return session;
}

export type ApiAuthorization =
  | { ok: true; session: SessionPayload }
  | { ok: false; response: NextResponse };

export async function authorizeApi(
  permission: Permission,
): Promise<ApiAuthorization> {
  try {
    return { ok: true, session: await requirePermission(permission) };
  } catch (error) {
    if (error instanceof AccessDeniedError) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: { code: error.code } },
          {
            status: error.status,
            headers: { "Cache-Control": "no-store" },
          },
        ),
      };
    }
    throw error;
  }
}
