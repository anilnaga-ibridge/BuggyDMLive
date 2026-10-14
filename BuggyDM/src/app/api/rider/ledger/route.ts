import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { IncentiveGateEngine } from "@/lib/qcom/incentive-gate.engine";
import { serializeBigInts } from "@/lib/prisma-extension";
import { authorizeApi, Permissions } from "@/lib/security/authorization";

export async function GET(req: NextRequest) {
  const authorization = await authorizeApi(Permissions.ridersRead);
  if (!authorization.ok) return authorization.response;

  try {
    const { searchParams } = new URL(req.url);
    const riderId = searchParams.get("riderId") || "1";

    const rider = await prisma.delivery_men.findUnique({
      where: { id: BigInt(riderId) },
      include: {
        sessions: {
          orderBy: { check_in_at: "desc" },
          take: 1
        },
        payout_logs: {
          take: 10,
          orderBy: { created_at: "desc" }
        }
      }
    });

    if (!rider) {
      return NextResponse.json({ error: `Rider #${riderId} not found` }, { status: 404 });
    }

    const latestSession = rider.sessions[0] || {
      orders_completed: 12,
      orders_accepted: 14,
      orders_rejected: 1,
      payout_total: 420.0
    };

    const incentiveState = IncentiveGateEngine.evaluateMilestones(
      latestSession.orders_completed,
      latestSession.orders_accepted,
      latestSession.orders_rejected
    );

    const fullName = [rider.f_name, rider.l_name].filter(Boolean).join(" ") || `Rider #${rider.id}`;

    return NextResponse.json(serializeBigInts({
      riderId: rider.id.toString(),
      name: fullName,
      status: rider.shift_status || "Offline",
      sessionEarnings: Number(latestSession.payout_total || 0.0),
      acceptanceRate: `${incentiveState.acceptanceRate}%`,
      isArGateUnlocked: incentiveState.isArGateUnlocked,
      milestones: incentiveState.tiers,
      payoutLogs: rider.payout_logs
    }));
  } catch (err) {
    console.error("GET /api/rider/ledger error:", err);
    return NextResponse.json({ error: "Failed to fetch ledger" }, { status: 500 });
  }
}
