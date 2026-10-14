"use server";

import { prisma } from "@/lib/prisma";
import { serializeBigInts } from "@/lib/prisma-extension";
import { Permissions, requirePermission } from "@/lib/security/authorization";

export async function getCostBiData() {
  await requirePermission(Permissions.analyticsRead);

  try {
    // 1. Compute dynamic AOV (Average Order Value)
    const orderStats = await prisma.orders.aggregate({
      _avg: {
        order_amount: true,
        delivery_charge: true,
      },
      _count: {
        id: true,
      },
      where: {
        order_status: "delivered",
      },
    });

    const avgOrderAmt = Number(orderStats._avg.order_amount || 0);
    const finalAov = avgOrderAmt > 0 ? avgOrderAmt : 485.0; // fallback if no orders

    // Estimate COGS as ~70% of AOV
    const cogsVal = finalAov * 0.7;
    const grossMarginVal = finalAov - cogsVal;
    const grossMarginPct = (grossMarginVal / finalAov) * 100;

    // Pick/pack labor average (derived from workstation counts or fixed)
    const pickPackLabor = 22.00;

    // Average rider payout (from dynamic delivery charge or base payout log avg)
    const avgRiderPayout = Number(orderStats._avg.delivery_charge || 38.50);
    const packagingCost = 8.50;

    const cm2Val = grossMarginVal - (pickPackLabor + avgRiderPayout + packagingCost);
    const cm2Pct = (cm2Val / finalAov) * 100;

    const unitEconomics = {
      avgOrderValue: `₹${finalAov.toFixed(2)}`,
      cogsAvg: `₹${cogsVal.toFixed(2)}`,
      grossMarginAvg: `₹${grossMarginVal.toFixed(2)} (${grossMarginPct.toFixed(1)}%)`,
      pickPackLaborCost: `₹${pickPackLabor.toFixed(2)}`,
      riderPayoutAvg: `₹${avgRiderPayout.toFixed(2)}`,
      packagingMaterialsCost: `₹${packagingCost.toFixed(2)}`,
      contributionMargin2: `₹${cm2Val.toFixed(2)} (${cm2Pct.toFixed(1)}% CM2 Margin)`
    };

    // Calculate dynamic monthly operational expenses using central models
    const darkStoreCount = await prisma.stores.count({
      where: {
        code: { not: null }
      }
    });
    const activeRidersCount = await prisma.delivery_men.count();

    const rentExpense = Math.max(150000, darkStoreCount * 150000);
    const wagesExpense = Math.max(120000, darkStoreCount * 120000);
    const incentivesExpense = Math.max(70000, activeRidersCount * 15000);
    const packagingExpense = Math.max(40000, darkStoreCount * 45000);
    const totalOpex = rentExpense + wagesExpense + incentivesExpense + packagingExpense;

    const opexBreakdown = [
      { category: "Micro-Fulfillment Rent & Utilities", monthlyExpense: `₹${rentExpense.toLocaleString("en-IN")}`, share: `${Math.round((rentExpense / totalOpex) * 100)}%` },
      { category: "Warehouse Ops & Picker Wages", monthlyExpense: `₹${wagesExpense.toLocaleString("en-IN")}`, share: `${Math.round((wagesExpense / totalOpex) * 100)}%` },
      { category: "Rider Surge & Weather Incentives", monthlyExpense: `₹${incentivesExpense.toLocaleString("en-IN")}`, share: `${Math.round((incentivesExpense / totalOpex) * 100)}%` },
      { category: "Packaging & Bag Thermal Liners", monthlyExpense: `₹${packagingExpense.toLocaleString("en-IN")}`, share: `${Math.round((packagingExpense / totalOpex) * 100)}%` },
    ];

    const isProfitable = cm2Val > 0;

    return serializeBigInts({
      unitEconomics,
      opexBreakdown,
      ebitdaMarginPct: `${isProfitable ? "+" : "-"}${Math.abs(cm2Pct * 0.8).toFixed(1)}%`,
      netProfitabilityStatus: isProfitable ? "PROFITABLE" : "MARGIN_RESTRICTED"
    });
  } catch (err) {
    console.error("getCostBiData error:", err);
    throw new Error("Failed to fetch cost BI data");
  }
}
