import { LayoutCircuitBreaker } from "../lib/qcos/circuit-breaker";

async function runTest() {
  console.log("=== START CIRCUIT BREAKER DIAGNOSTICS TEST ===");
  console.log("Initial state:", LayoutCircuitBreaker.getDiagnostics());

  // 1. Trigger consecutive failures
  for (let i = 1; i <= 3; i++) {
    console.log(`\nTriggering failure #${i}...`);
    const res = await LayoutCircuitBreaker.execute(async () => {
      throw new Error("Database timeout connection error simulation");
    });
    console.log("Result received (should be fallback):", res.layoutName);
    console.log("Diagnostics after failure:", LayoutCircuitBreaker.getDiagnostics());
  }

  // 2. Trigger request while circuit is OPEN
  console.log("\nTriggering request while circuit is OPEN...");
  const openRes = await LayoutCircuitBreaker.execute(async () => {
    console.log("This operational code should NOT run!");
    return { layoutName: "Normal Layout" };
  });
  console.log("Result received (should be fallback immediately):", openRes.layoutName);
  console.log("Diagnostics:", LayoutCircuitBreaker.getDiagnostics());

  console.log("\n=== TEST COMPLETED SUCCESSFULLY ===");
}

runTest().catch(console.error);
