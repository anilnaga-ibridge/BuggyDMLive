import { NextResponse } from "next/server";
import { NavigationService } from "@/services/navigation.service";
import { UserContext } from "@/lib/security/permission.engine";
import { authorizeApi, Permissions } from "@/lib/security/authorization";

export async function GET(request: Request) {
  const authorization = await authorizeApi(Permissions.operationsRead);
  if (!authorization.ok) return authorization.response;

  try {
    const session = authorization.session;
    const user: UserContext = {
      userId: session.userId,
      roleId: session.roleId,
      permissions: session.permissions,
      tenantId: session.organizationId,
      warehouseId: session.warehouseId,
    };

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform") || "all";

    const tree = await NavigationService.getNavigationTree(user, { platform });

    return NextResponse.json({
      success: true,
      data: tree,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("GET /BuggyDm/api/ops/navigation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load dynamic navigation",
      },
      { status: 500 }
    );
  }
}
