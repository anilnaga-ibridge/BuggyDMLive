import { PayoutCalculatorService } from "@/services/qcom/payout-calculator.service";
import { IncentiveGateEngine } from "@/lib/qcom/incentive-gate.engine";
import { MatchScoringEngine } from "@/lib/qcom/match-scoring.engine";
import { serializeBigInts } from "@/lib/prisma-extension";

async function runQComTests() {
  console.log("=== RUNNING BUGGYQCOS ENGINE TESTS ===");

  // 1. Test BigInt Serialization
  const rawData = { id: BigInt(9007199254740991), amount: 150.5 };
  const serialized = serializeBigInts(rawData);
  if (typeof serialized.id !== "string") {
    throw new Error("BigInt serialization failed: id is not a string!");
  }
  console.log("✓ BigInt serialization test passed:", serialized);

  // 2. Test Dynamic Payout Calculation
  const payout = PayoutCalculatorService.calculateOrderPayout(3.5, true, false);
  if (payout.totalPayout !== 52.0) { // 25 (base) + 1.5*8 (12 extra dist) + 15 (peak) = 52
    throw new Error(`Payout calculation mismatch! Expected 52.0, got ${payout.totalPayout}`);
  }
  console.log("✓ Payout calculator test passed:", payout);

  // 3. Test Acceptance Rate Gate & Milestones
  const incentivePass = IncentiveGateEngine.evaluateMilestones(16, 18, 2); // 18/20 = 90% AR (pass)
  if (!incentivePass.isArGateUnlocked || !incentivePass.tiers[0].unlocked) {
    throw new Error("Incentive gate evaluation failed for passing AR!");
  }
  console.log("✓ Incentive AR Gate test passed (Unlocked Tier 1 Bonus):", incentivePass.tiers[0]);

  const incentiveFail = IncentiveGateEngine.evaluateMilestones(16, 14, 6); // 14/20 = 70% AR (fail)
  if (incentiveFail.isArGateUnlocked) {
    throw new Error("Incentive gate failed to block rider with <85% AR!");
  }
  console.log("✓ Incentive AR Gate test passed (Locked <85% AR):", incentiveFail.acceptanceRate + "%");

  // 4. Test Match Scoring Engine
  const candidates = [
    { id: "1", name: "Rider A", status: "Online", maxActiveOrders: 2, currentActiveOrders: 0, maxVolumeCm3: 30000, currentVolumeCm3: 0, latitude: 17.44, longitude: 78.34 },
    { id: "2", name: "Rider B", status: "Online", maxActiveOrders: 2, currentActiveOrders: 1, maxVolumeCm3: 30000, currentVolumeCm3: 0, latitude: 17.48, longitude: 78.38 },
  ];
  const ranked = MatchScoringEngine.rankRiders(candidates, 17.44, 78.34, false);
  if (ranked[0].rider.id !== "1") {
    throw new Error("Match Scoring Engine failed: Closer rider was not ranked #1!");
  }
  console.log("✓ Match Scoring Engine test passed: Top Candidate =", ranked[0].rider.name, "(Score:", ranked[0].score.toFixed(3) + ")");

  console.log("=== ALL BUGGYQCOS TESTS PASSED SUCCESSFULLY ===");
}

runQComTests().catch((err) => {
  console.error("QCOM Test Failed:", err);
  process.exit(1);
});
