import { Worker, Job, type ConnectionOptions } from "bullmq";
import { getRedisClient } from "@/lib/redis";
import { eventBus } from "@/lib/events/event-bus";
import { prisma } from "@/lib/prisma";

const queueName = "qcom_sla_escalations";
const concurrency = parseInt(process.env.DISPATCH_WORKER_CONCURRENCY || "10", 10);

export function startSlaWorker() {
  const connection = getRedisClient();
  if (!connection) {
    console.warn("Redis not configured. SLA Escalation Worker disabled.");
    return null;
  }

  const worker = new Worker(
    queueName,
    async (job: Job) => {
      const { orderId, targetStage } = job.data;

      const order = await prisma.orders.findUnique({
        where: { id: BigInt(orderId) }
      });

      if (!order) return;

      const currentStage = order.qcom_stage || "Queue";

      // If order has not progressed beyond targetStage, emit SLA Breach
      if (currentStage === targetStage) {
        await eventBus.emitEvent("sla.breached", {
          orderId,
          targetStage,
          currentStage,
          breachedAt: new Date().toISOString(),
          message: `Order #${orderId} SLA breached! Still in '${currentStage}' stage after deadline.`
        });
      }
    },
    {
      connection: connection as unknown as ConnectionOptions,
      concurrency
    }
  );

  worker.on("failed", (job, err) => {
    console.error(`SLA Worker job ${job?.id} failed:`, err);
  });

  return worker;
}
