import { startSlaWorker } from "@/workers/sla-escalation.worker";
import { startCxpSchedulerWorker } from "@/workers/cxp-scheduler.worker";
import { QComWebSocketServer } from "@/server/websocket-server";

console.log("=================================================");
console.log("🚀 BUGGYQCOS DISPATCH & SLA WORKER INITIALIZING");
console.log("=================================================");

// Start SLA Queue Worker
const worker = startSlaWorker();
if (worker) {
  console.log("✓ BullMQ SLA Escalation Worker started successfully.");
}

// Start CXP Scheduler Worker
const cxpWorker = startCxpSchedulerWorker();
if (cxpWorker) {
  console.log("✓ BullMQ CXP Scheduler Worker started successfully.");
}

// Start Standalone Telemetry Server
QComWebSocketServer.start(8080);
console.log("✓ Standalone Telemetry SSE Server started on port 8080.");
