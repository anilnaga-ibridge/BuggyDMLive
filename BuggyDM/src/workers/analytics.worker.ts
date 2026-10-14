import { Worker, Job } from "bullmq";
import { redisConnectionOptions } from "../lib/redis";
import { prisma } from "../lib/prisma";
import { CacheService } from "../services/cache.service";
import { RecommendationService } from "../services/recommendation.service";
import { AnalyticsRepository } from "../repositories/database/analytics.repository";
import { SalesRepository } from "../repositories/database/sales.repository";
import { CustomerRepository } from "../repositories/database/customer.repository";
import { LocationRepository } from "../repositories/database/location.repository";
import { InventoryRepository } from "../repositories/database/inventory.repository";
import { DeliveryRepository } from "../repositories/database/delivery.repository";
import { MarketingRepository } from "../repositories/database/marketing.repository";
import { CostRepository } from "../repositories/database/cost.repository";

export const biWorker = new Worker(
  "bi-tasks",
  async (job: Job) => {
    const startTime = Date.now();
    let status = "success";
    let errorMsg: string | null = null;

    console.log(`[BI Worker] Processing job ${job.name} (${job.id})...`);

    try {
      if (job.name === "aggregate-bi-data") {
        // 1. Executive Dashboard KPIs
        const execKPIs = await AnalyticsRepository.getExecutiveKPIs();
        await CacheService.set("exec_kpis", execKPIs);

        const storeSales = await AnalyticsRepository.getStoreSalesComparison();
        await CacheService.set("store_comparison", storeSales);

        const catDist = await AnalyticsRepository.getCategoryDistribution();
        await CacheService.set("category_distribution", catDist);

        // 2. Sales Analytics
        const salesTrend = await SalesRepository.getSalesTrend();
        await CacheService.set("sales_trend", salesTrend);

        const paymentBreakdown = await SalesRepository.getPaymentBreakdown();
        await CacheService.set("payment_breakdown", paymentBreakdown);

        // 3. Location Performance
        const zonePerf = await LocationRepository.getZonePerformance();
        await CacheService.set("zone_performance", zonePerf);

        const topZoneProducts = await LocationRepository.getTopProductsByZone();
        await CacheService.set("top_zone_products", topZoneProducts);

        // 4. Customer Intelligence
        const custGrowth = await CustomerRepository.getCustomerGrowth();
        await CacheService.set("customer_growth", custGrowth);

        const highValueCust = await CustomerRepository.getHighValueCustomers();
        await CacheService.set("high_value_customers", highValueCust);

        const inactiveCust = await CustomerRepository.getInactiveCustomers();
        await CacheService.set("inactive_customers", inactiveCust);

        // 5. Inventory Intelligence
        const invSummary = await InventoryRepository.getInventorySummary();
        await CacheService.set("inventory_summary", invSummary);

        const procPlanner = await InventoryRepository.getProcurementPlanner();
        await CacheService.set("procurement_planner", procPlanner);

        // 6. Delivery Performance
        const delPerf = await DeliveryRepository.getDeliveryPerformance();
        await CacheService.set("delivery_performance", delPerf);

        const riderLeader = await DeliveryRepository.getRiderLeaderboard();
        await CacheService.set("rider_leaderboard", riderLeader);

        // 7. Marketing Intelligence
        const couponUsage = await MarketingRepository.getCouponUsage();
        await CacheService.set("coupon_usage", couponUsage);

        const wishlistTrends = await MarketingRepository.getWishlistTrends();
        await CacheService.set("wishlist_trends", wishlistTrends);

        // 8. Cost Optimization
        const costWastage = await CostRepository.getWastageSummary();
        await CacheService.set("wastage_summary", costWastage);

        const lossyStores = await CostRepository.getLossyStores();
        await CacheService.set("lossy_stores", lossyStores);

        console.log("[BI Worker] Successfully aggregated and cached all metrics.");
      } 
      else if (job.name === "generate-ai-recommendations") {
        // Run AI recommendation generation
        const success = await RecommendationService.generateRecommendations();
        if (!success) throw new Error("Recommendation rules run failed.");
      }
      else {
        console.warn(`[BI Worker] Unknown job name: ${job.name}`);
      }
    } catch (error) {
      status = "failed";
      errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[BI Worker] Job ${job.name} failed:`, error);
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      // Log job execution details to panel_worker_logs
      try {
        await prisma.panel_worker_logs.create({
          data: {
            worker: `bi-worker:${job.name}`,
            status,
            error_msg: errorMsg,
            duration,
          },
        });
      } catch (logError) {
        console.error("[BI Worker] Failed to write worker log to DB:", logError);
      }
    }
  },
  {
    connection: redisConnectionOptions,
    concurrency: 1,
  }
);

biWorker.on("completed", (job) => {
  console.log(`[BI Worker] Job ${job.name} completed successfully.`);
});

biWorker.on("failed", (job, err) => {
  console.error(`[BI Worker] Job ${job?.name} failed with error:`, err);
});
