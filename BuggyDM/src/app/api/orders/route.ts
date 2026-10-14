import { NextResponse } from "next/server";
import { getActiveOrders } from "@/app/actions/orders";
import { authorizeApi, Permissions } from "@/lib/security/authorization";

export async function GET() {
  const authorization = await authorizeApi(Permissions.ordersRead);
  if (!authorization.ok) return authorization.response;

  try {
    const orders = await getActiveOrders();
    return NextResponse.json(orders);
  } catch {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
