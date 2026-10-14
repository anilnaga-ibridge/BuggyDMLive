import { CacheService } from "./cache.service";
import { AnalyticsRepository } from "../repositories/database/analytics.repository";
import { SalesRepository } from "../repositories/database/sales.repository";
import { CustomerRepository } from "../repositories/database/customer.repository";
import { LocationRepository } from "../repositories/database/location.repository";
import { InventoryRepository } from "../repositories/database/inventory.repository";
import { DeliveryRepository } from "../repositories/database/delivery.repository";
import { MarketingRepository } from "../repositories/database/marketing.repository";
import { CostRepository } from "../repositories/database/cost.repository";

export class BIService {
  private static async cached<T>(
    key: string,
    load: () => Promise<T>,
  ): Promise<T> {
    const cached = await CacheService.get<T>(key);
    return cached ?? load();
  }

  static async getExecutiveKPIs() {
    return this.cached("exec_kpis", () => AnalyticsRepository.getExecutiveKPIs());
  }

  static async getStoreSalesComparison() {
    return this.cached("store_comparison", () => AnalyticsRepository.getStoreSalesComparison());
  }

  static async getCategoryDistribution() {
    return this.cached("category_distribution", () => AnalyticsRepository.getCategoryDistribution());
  }

  static async getSalesTrend() {
    return this.cached("sales_trend", () => SalesRepository.getSalesTrend());
  }

  static async getPaymentBreakdown() {
    return this.cached("payment_breakdown", () => SalesRepository.getPaymentBreakdown());
  }

  static async getZonePerformance() {
    return this.cached("zone_performance", () => LocationRepository.getZonePerformance());
  }

  static async getTopProductsByZone() {
    return this.cached("top_zone_products", () => LocationRepository.getTopProductsByZone());
  }

  static async getCustomerGrowth() {
    return this.cached("customer_growth", () => CustomerRepository.getCustomerGrowth());
  }

  static async getHighValueCustomers() {
    return this.cached("high_value_customers", () => CustomerRepository.getHighValueCustomers());
  }

  static async getInactiveCustomers() {
    return this.cached("inactive_customers", () => CustomerRepository.getInactiveCustomers());
  }

  static async getInventorySummary() {
    return this.cached("inventory_summary", () => InventoryRepository.getInventorySummary());
  }

  static async getProcurementPlanner() {
    return this.cached("procurement_planner", () => InventoryRepository.getProcurementPlanner());
  }

  static async getDeliveryPerformance() {
    return this.cached("delivery_performance", () => DeliveryRepository.getDeliveryPerformance());
  }

  static async getRiderLeaderboard() {
    return this.cached("rider_leaderboard", () => DeliveryRepository.getRiderLeaderboard());
  }

  static async getCouponUsage() {
    return this.cached("coupon_usage", () => MarketingRepository.getCouponUsage());
  }

  static async getWishlistTrends() {
    return this.cached("wishlist_trends", () => MarketingRepository.getWishlistTrends());
  }

  static async getSearchTrends() {
    return this.cached("search_trends", () => MarketingRepository.getSearchTrends());
  }

  static async getWastageSummary() {
    return this.cached("wastage_summary", () => CostRepository.getWastageSummary());
  }

  static async getLossyStores() {
    return this.cached("lossy_stores", () => CostRepository.getLossyStores());
  }
}
