import { Worker, Job, type ConnectionOptions } from "bullmq";
import { getRedisClient } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { eventBus } from "@/lib/events/event-bus";
import { LayoutCacheManager } from "@/lib/qcos/cache";

const queueName = "qcos_cxp_scheduler";

export function startCxpSchedulerWorker() {
  const connection = getRedisClient();
  if (!connection || connection.status !== "ready") {
    console.warn("Redis not ready. CXP Scheduler Worker disabled.");
    return null;
  }

  const systemUserId = Number.parseInt(process.env.CXP_SYSTEM_USER_ID || "", 10);
  if (!Number.isSafeInteger(systemUserId) || systemUserId <= 0) {
    console.warn("CXP_SYSTEM_USER_ID is not configured. CXP Scheduler Worker disabled.");
    return null;
  }

  const worker = new Worker(
    queueName,
    async (job: Job) => {
      console.log(`[CXP Worker] Running schedule check for job ${job.id}`);
      const now = new Date();

      // 1. Activate experiments that have started
      const pendingExperiments = await prisma.qcos_experiments.findMany({
        where: {
          starts_at: { lte: now },
          status: "draft",
        },
      });

      for (const exp of pendingExperiments) {
        await prisma.$transaction(async (tx) => {
          await tx.qcos_experiments.update({
            where: { id: exp.id },
            data: { status: "active" },
          });

          await tx.qcos_audit_logs.create({
            data: {
              user_id: systemUserId,
              action: "EXPERIMENT_START",
              target_table: "qcos_experiments",
              record_id: exp.id,
              new_value: "status: active",
              ip_address: "127.0.0.1",
              user_agent: "CXP Scheduler Worker",
            },
          });
        });

        console.log(`[CXP Worker] Activated experiment: ${exp.name}`);

        // Emit domain event
        await eventBus.emitEvent("experience.experiment.started", {
          experimentId: exp.id,
          name: exp.name,
          status: "active",
          message: `Experiment '${exp.name}' is now active.`
        });
      }

      // 2. End experiments that have expired
      const activeExperiments = await prisma.qcos_experiments.findMany({
        where: {
          ends_at: { lte: now },
          status: "active",
        },
      });

      for (const exp of activeExperiments) {
        await prisma.$transaction(async (tx) => {
          await tx.qcos_experiments.update({
            where: { id: exp.id },
            data: { status: "ended" },
          });

          await tx.qcos_audit_logs.create({
            data: {
              user_id: systemUserId,
              action: "EXPERIMENT_END",
              target_table: "qcos_experiments",
              record_id: exp.id,
              new_value: "status: ended",
              ip_address: "127.0.0.1",
              user_agent: "CXP Scheduler Worker",
            },
          });
        });

        console.log(`[CXP Worker] Ended experiment: ${exp.name}`);
        await eventBus.emitEvent("experience.experiment.ended", {
          experimentId: exp.id,
          name: exp.name,
          status: "ended",
        });
      }

      // Invalidate layout cache if status flips occurred
      if (pendingExperiments.length > 0 || activeExperiments.length > 0) {
        await LayoutCacheManager.invalidateAllLayoutCaches();
      }
    },
    {
      connection: connection as unknown as ConnectionOptions,
      concurrency: 1,
    }
  );

  worker.on("failed", (job, err) => {
    console.error(`CXP Scheduler Worker job ${job?.id} failed:`, err);
  });

  return worker;
}
