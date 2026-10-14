import { Worker, Job } from "bullmq";
import { redisConnectionOptions } from "../lib/redis";
import { ScheduleRepository } from "../repositories/database/schedule.repository";
import { ProductRepository } from "../repositories/database/product.repository";
import { AuditService } from "../services/audit.service";

export const priceSchedulerWorker = new Worker(
  "price-schedules",
  async (job: Job) => {
    if (job.name !== "check-price-updates") return;

    console.log("[Worker] Starting check of scheduled price updates...");

    try {
      // 1. Process pending price updates that need to be activated
      const pendingSchedules = await ScheduleRepository.findPendingActive();
      for (const schedule of pendingSchedules) {
        console.log(`[Worker] Activating schedule #${schedule.id} for product #${schedule.item_id}`);

        // Update main product price
        await ProductRepository.updateProduct(Number(schedule.item_id), {
          price: Number(schedule.new_price),
        });

        // Set status to active
        await ScheduleRepository.updateStatus(schedule.id, "active");

        // Log system audit entry
        await AuditService.logActivity({
          adminId: 1, // System Cron Admin ID
          action: "PRICE_SCHEDULE_ACTIVATE",
          tableName: "items",
          recordId: Number(schedule.item_id),
          oldValue: `price: ${schedule.old_price}`,
          newValue: `price: ${schedule.new_price}`,
          ipAddress: "127.0.0.1",
          userAgent: "BullMQ Price Schedule Worker",
        });
      }

      // 2. Process active price updates that need to be reverted
      const expiredSchedules = await ScheduleRepository.findActiveExpired();
      for (const schedule of expiredSchedules) {
        console.log(`[Worker] Reverting schedule #${schedule.id} for product #${schedule.item_id}`);

        // Revert product price
        await ProductRepository.updateProduct(Number(schedule.item_id), {
          price: Number(schedule.old_price),
        });

        // Set status to completed
        await ScheduleRepository.updateStatus(schedule.id, "completed");

        // Log system audit entry
        await AuditService.logActivity({
          adminId: 1, // System Cron Admin ID
          action: "PRICE_SCHEDULE_REVERT",
          tableName: "items",
          recordId: Number(schedule.item_id),
          oldValue: `price: ${schedule.new_price}`,
          newValue: `price: ${schedule.old_price}`,
          ipAddress: "127.0.0.1",
          userAgent: "BullMQ Price Schedule Worker",
        });
      }
    } catch (error) {
      console.error("[Worker] Error processing scheduled price updates:", error);
      throw error; // Fail the job to trigger retry logic
    }
  },
  {
    connection: redisConnectionOptions,
    concurrency: 1,
    limiter: {
      max: 1,
      duration: 1000,
    },
  }
);

// Worker Event Listeners
priceSchedulerWorker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully.`);
});

priceSchedulerWorker.on("failed", (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed with error:`, err);
});
