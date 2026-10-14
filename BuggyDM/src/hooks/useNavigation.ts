"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { IndexedDbService } from "@/lib/indexeddb";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export interface NavigationNode {
  id: number;
  parentId: number | null;
  title: string;
  slug: string;
  route: string;
  icon: string | null;
  description: string | null;
  category: string;
  displayOrder: number;
  badgeProvider: string | null;
  badgeRefreshInterval: number;
  badgeValue: number | null;
  featureFlag: string | null;
  minimumRole: number;
  supportsOffline: boolean;
  tenantId: number | null;
  warehouseId: number | null;
  platform: string;
  isEnabled: boolean;
  isVisible: boolean;
  children: NavigationNode[];
}

const DEFAULT_FALLBACK_TREE: NavigationNode[] = [
  { id: 1, parentId: null, title: "Orders Dashboard", slug: "orders-dashboard", route: "/orders", icon: "Layers", description: null, category: "Main", displayOrder: 1, badgeProvider: "orders_waiting", badgeRefreshInterval: 15, badgeValue: null, featureFlag: null, minimumRole: 0, supportsOffline: true, tenantId: null, warehouseId: null, platform: "all", isEnabled: true, isVisible: true, children: [] },
  { id: 2, parentId: null, title: "Product Management", slug: "product-management", route: "/products", icon: "Package", description: null, category: "Main", displayOrder: 2, badgeProvider: null, badgeRefreshInterval: 30, badgeValue: null, featureFlag: null, minimumRole: 0, supportsOffline: true, tenantId: null, warehouseId: null, platform: "all", isEnabled: true, isVisible: true, children: [] },
  { id: 3, parentId: null, title: "Bulk Editor", slug: "bulk-editor", route: "/bulk-editor", icon: "Grid", description: null, category: "Main", displayOrder: 3, badgeProvider: null, badgeRefreshInterval: 30, badgeValue: null, featureFlag: null, minimumRole: 0, supportsOffline: true, tenantId: null, warehouseId: null, platform: "all", isEnabled: true, isVisible: true, children: [] },
  { id: 4, parentId: null, title: "Delivery Boys", slug: "delivery-boys", route: "/delivery", icon: "User", description: null, category: "Main", displayOrder: 4, badgeProvider: null, badgeRefreshInterval: 30, badgeValue: null, featureFlag: null, minimumRole: 0, supportsOffline: true, tenantId: null, warehouseId: null, platform: "all", isEnabled: true, isVisible: true, children: [] },
  { id: 50, parentId: null, title: "Hero Fest Deals", slug: "hero-fest-showcase", route: "/admin/hero-fest", icon: "Sparkles", description: "Manage Quick-Commerce Hero Fest card", category: "Main", displayOrder: 5, badgeProvider: null, badgeRefreshInterval: 30, badgeValue: null, featureFlag: null, minimumRole: 0, supportsOffline: true, tenantId: null, warehouseId: null, platform: "all", isEnabled: true, isVisible: true, children: [] },
  { id: 49, parentId: null, title: "FlavourFest Studio", slug: "flavour-fest-showcase", route: "/admin/flavour-fest", icon: "Sparkles", description: "Manage FlavourFest banner, cards & showcase items", category: "Main", displayOrder: 5.5, badgeProvider: null, badgeRefreshInterval: 30, badgeValue: null, featureFlag: null, minimumRole: 0, supportsOffline: true, tenantId: null, warehouseId: null, platform: "all", isEnabled: true, isVisible: true, children: [] },
  { id: 51, parentId: null, title: "Steal Deals", slug: "steal-deals-showcase", route: "/admin/steal-deals", icon: "Zap", description: "Manage 3-Column Steal Deals & Stores", category: "Main", displayOrder: 6, badgeProvider: null, badgeRefreshInterval: 30, badgeValue: null, featureFlag: null, minimumRole: 0, supportsOffline: true, tenantId: null, warehouseId: null, platform: "all", isEnabled: true, isVisible: true, children: [] },
  { id: 52, parentId: null, title: "Featured & Offers", slug: "featured-offers-showcase", route: "/admin/featured-offers", icon: "Crown", description: "Manage Featured Arches, Offers & Coupons", category: "Main", displayOrder: 7, badgeProvider: null, badgeRefreshInterval: 30, badgeValue: null, featureFlag: null, minimumRole: 0, supportsOffline: true, tenantId: null, warehouseId: null, platform: "all", isEnabled: true, isVisible: true, children: [] },
  { id: 53, parentId: null, title: "Salon & Bloom", slug: "salon-showcase", route: "/admin/salon-showcase", icon: "Scissors", description: "Manage Salon at Home & Bloom Banners", category: "Main", displayOrder: 8, badgeProvider: null, badgeRefreshInterval: 30, badgeValue: null, featureFlag: null, minimumRole: 0, supportsOffline: true, tenantId: null, warehouseId: null, platform: "all", isEnabled: true, isVisible: true, children: [] },
  { id: 54, parentId: null, title: "Category Grids", slug: "category-grids-showcase", route: "/admin/category-grids", icon: "Grid", description: "Manage Grocery & Kitchen, Snacks & Drinks", category: "Main", displayOrder: 9, badgeProvider: null, badgeRefreshInterval: 30, badgeValue: null, featureFlag: null, minimumRole: 0, supportsOffline: true, tenantId: null, warehouseId: null, platform: "all", isEnabled: true, isVisible: true, children: [] },
  { id: 55, parentId: null, title: "Curated Products", slug: "curated-products-showcase", route: "/admin/curated-products", icon: "Crown", description: "Manage Curated For You 3-column Grid", category: "Main", displayOrder: 10, badgeProvider: null, badgeRefreshInterval: 30, badgeValue: null, featureFlag: null, minimumRole: 0, supportsOffline: true, tenantId: null, warehouseId: null, platform: "all", isEnabled: true, isVisible: true, children: [] },
  { id: 56, parentId: null, title: "Lifestyle Categories", slug: "lifestyle-categories-showcase", route: "/admin/lifestyle-categories", icon: "Sparkles", description: "Manage Fashion, Beauty, Household & Hobbies", category: "Main", displayOrder: 11, badgeProvider: null, badgeRefreshInterval: 30, badgeValue: null, featureFlag: null, minimumRole: 0, supportsOffline: true, tenantId: null, warehouseId: null, platform: "all", isEnabled: true, isVisible: true, children: [] },
  { id: 57, parentId: null, title: "Flash Deals", slug: "flash-deals-showcase", route: "/admin/flash-deals", icon: "Flame", description: "Manage Flash Deals: All Time Low Carousel", category: "Main", displayOrder: 12, badgeProvider: null, badgeRefreshInterval: 30, badgeValue: null, featureFlag: null, minimumRole: 0, supportsOffline: true, tenantId: null, warehouseId: null, platform: "all", isEnabled: true, isVisible: true, children: [] },
  {
    id: 5, parentId: null, title: "Business Intelligence", slug: "business-intelligence-parent", route: "/business-intelligence", icon: "BarChart3", description: null, category: "Business Intelligence", displayOrder: 10, badgeProvider: null, badgeRefreshInterval: 60, badgeValue: null, featureFlag: null, minimumRole: 0, supportsOffline: true, tenantId: null, warehouseId: null, platform: "all", isEnabled: true, isVisible: true,
    children: [
      { id: 7, parentId: 5, title: "Executive Dashboard", slug: "bi-executive", route: "/business-intelligence/executive", icon: "LayoutDashboard", description: null, category: "Business Intelligence", displayOrder: 1, badgeProvider: null, badgeRefreshInterval: 60, badgeValue: null, featureFlag: null, minimumRole: 0, supportsOffline: true, tenantId: null, warehouseId: null, platform: "all", isEnabled: true, isVisible: true, children: [] },
      { id: 8, parentId: 5, title: "Sales Intelligence", slug: "bi-sales", route: "/business-intelligence/sales", icon: "TrendingUp", description: null, category: "Business Intelligence", displayOrder: 2, badgeProvider: null, badgeRefreshInterval: 60, badgeValue: null, featureFlag: null, minimumRole: 0, supportsOffline: true, tenantId: null, warehouseId: null, platform: "all", isEnabled: true, isVisible: true, children: [] },
      { id: 9, parentId: 5, title: "Product Intelligence", slug: "bi-products", route: "/business-intelligence/products", icon: "Package", description: null, category: "Business Intelligence", displayOrder: 3, badgeProvider: null, badgeRefreshInterval: 60, badgeValue: null, featureFlag: null, minimumRole: 0, supportsOffline: true, tenantId: null, warehouseId: null, platform: "all", isEnabled: true, isVisible: true, children: [] },
      { id: 10, parentId: 5, title: "Customer Intelligence", slug: "bi-customers", route: "/business-intelligence/customers", icon: "Users", description: null, category: "Business Intelligence", displayOrder: 4, badgeProvider: null, badgeRefreshInterval: 60, badgeValue: null, featureFlag: null, minimumRole: 0, supportsOffline: true, tenantId: null, warehouseId: null, platform: "all", isEnabled: true, isVisible: true, children: [] },
      { id: 11, parentId: 5, title: "Location Intelligence", slug: "bi-locations", route: "/business-intelligence/locations", icon: "MapPin", description: null, category: "Business Intelligence", displayOrder: 5, badgeProvider: null, badgeRefreshInterval: 60, badgeValue: null, featureFlag: null, minimumRole: 0, supportsOffline: true, tenantId: null, warehouseId: null, platform: "all", isEnabled: true, isVisible: true, children: [] },
      { id: 12, parentId: 5, title: "Inventory Intelligence", slug: "bi-inventory", route: "/business-intelligence/inventory", icon: "Database", description: null, category: "Business Intelligence", displayOrder: 6, badgeProvider: null, badgeRefreshInterval: 60, badgeValue: null, featureFlag: null, minimumRole: 0, supportsOffline: true, tenantId: null, warehouseId: null, platform: "all", isEnabled: true, isVisible: true, children: [] },
      { id: 13, parentId: 5, title: "Delivery Intelligence", slug: "bi-delivery", route: "/business-intelligence/delivery", icon: "Truck", description: null, category: "Business Intelligence", displayOrder: 7, badgeProvider: null, badgeRefreshInterval: 60, badgeValue: null, featureFlag: null, minimumRole: 0, supportsOffline: true, tenantId: null, warehouseId: null, platform: "all", isEnabled: true, isVisible: true, children: [] },
      { id: 14, parentId: 5, title: "Marketing Intelligence", slug: "bi-marketing", route: "/business-intelligence/marketing", icon: "Megaphone", description: null, category: "Business Intelligence", displayOrder: 8, badgeProvider: null, badgeRefreshInterval: 60, badgeValue: null, featureFlag: null, minimumRole: 0, supportsOffline: true, tenantId: null, warehouseId: null, platform: "all", isEnabled: true, isVisible: true, children: [] },
      { id: 15, parentId: 5, title: "Cost Optimization", slug: "bi-cost", route: "/business-intelligence/cost", icon: "DollarSign", description: null, category: "Business Intelligence", displayOrder: 9, badgeProvider: null, badgeRefreshInterval: 60, badgeValue: null, featureFlag: null, minimumRole: 0, supportsOffline: true, tenantId: null, warehouseId: null, platform: "all", isEnabled: true, isVisible: true, children: [] },
      { id: 16, parentId: 5, title: "AI Insights", slug: "bi-ai", route: "/business-intelligence/ai", icon: "Sparkles", description: null, category: "Business Intelligence", displayOrder: 10, badgeProvider: null, badgeRefreshInterval: 60, badgeValue: null, featureFlag: null, minimumRole: 0, supportsOffline: true, tenantId: null, warehouseId: null, platform: "all", isEnabled: true, isVisible: true, children: [] },
      { id: 17, parentId: 5, title: "Reports", slug: "bi-reports", route: "/business-intelligence/reports", icon: "FileText", description: null, category: "Business Intelligence", displayOrder: 11, badgeProvider: null, badgeRefreshInterval: 60, badgeValue: null, featureFlag: null, minimumRole: 0, supportsOffline: true, tenantId: null, warehouseId: null, platform: "all", isEnabled: true, isVisible: true, children: [] }
    ]
  },
  {
    id: 6, parentId: null, title: "Buggy OPS", slug: "buggy-ops-parent", route: "/ops", icon: "ShoppingBag", description: null, category: "Operations", displayOrder: 20, badgeProvider: null, badgeRefreshInterval: 30, badgeValue: null, featureFlag: null, minimumRole: 0, supportsOffline: true, tenantId: null, warehouseId: null, platform: "all", isEnabled: true, isVisible: true,
    children: [
      { id: 18, parentId: 6, title: "Picker Desk", slug: "ops-picker", route: "/ops/picker", icon: "Layers", description: null, category: "Operations", displayOrder: 1, badgeProvider: "orders_waiting", badgeRefreshInterval: 15, badgeValue: null, featureFlag: null, minimumRole: 0, supportsOffline: true, tenantId: null, warehouseId: null, platform: "all", isEnabled: true, isVisible: true, children: [] },
      { id: 19, parentId: 6, title: "Packer Desk", slug: "ops-packer", route: "/ops/packer", icon: "Package", description: null, category: "Operations", displayOrder: 2, badgeProvider: "packing_queue", badgeRefreshInterval: 15, badgeValue: null, featureFlag: null, minimumRole: 0, supportsOffline: true, tenantId: null, warehouseId: null, platform: "all", isEnabled: true, isVisible: true, children: [] },
      { id: 20, parentId: 6, title: "QC Station", slug: "ops-qc", route: "/ops/qc", icon: "Eye", description: null, category: "Operations", displayOrder: 3, badgeProvider: "pending_qc", badgeRefreshInterval: 15, badgeValue: null, featureFlag: null, minimumRole: 0, supportsOffline: true, tenantId: null, warehouseId: null, platform: "all", isEnabled: true, isVisible: true, children: [] },
      { id: 21, parentId: 6, title: "Dispatch Shelf", slug: "ops-dispatcher", route: "/ops/dispatcher", icon: "Truck", description: null, category: "Operations", displayOrder: 4, badgeProvider: "dispatch_ready", badgeRefreshInterval: 15, badgeValue: null, featureFlag: null, minimumRole: 0, supportsOffline: true, tenantId: null, warehouseId: null, platform: "all", isEnabled: true, isVisible: true, children: [] },
      { id: 22, parentId: 6, title: "Supervisor", slug: "ops-supervisor", route: "/ops/supervisor", icon: "Users", description: null, category: "Operations", displayOrder: 5, badgeProvider: "critical_orders", badgeRefreshInterval: 15, badgeValue: null, featureFlag: null, minimumRole: 0, supportsOffline: true, tenantId: null, warehouseId: null, platform: "all", isEnabled: true, isVisible: true, children: [] },
      { id: 23, parentId: 6, title: "Manager Console", slug: "ops-manager", route: "/ops/manager", icon: "FileText", description: null, category: "Operations", displayOrder: 6, badgeProvider: null, badgeRefreshInterval: 15, badgeValue: null, featureFlag: null, minimumRole: 0, supportsOffline: true, tenantId: null, warehouseId: null, platform: "all", isEnabled: true, isVisible: true, children: [] },
      { id: 24, parentId: 6, title: "Inventory Ops", slug: "ops-inventory", route: "/ops/inventory", icon: "Scan", description: null, category: "Operations", displayOrder: 7, badgeProvider: "inventory_alert", badgeRefreshInterval: 15, badgeValue: null, featureFlag: null, minimumRole: 0, supportsOffline: true, tenantId: null, warehouseId: null, platform: "all", isEnabled: true, isVisible: true, children: [] },
      { id: 25, parentId: 6, title: "Returns Desk", slug: "ops-returns", route: "/ops/returns", icon: "RotateCcw", description: null, category: "Operations", displayOrder: 8, badgeProvider: "returns_pending", badgeRefreshInterval: 15, badgeValue: null, featureFlag: null, minimumRole: 0, supportsOffline: true, tenantId: null, warehouseId: null, platform: "all", isEnabled: true, isVisible: true, children: [] },
      { id: 26, parentId: 6, title: "Offline Sync", slug: "ops-offline", route: "/ops/offline", icon: "WifiOff", description: null, category: "Operations", displayOrder: 9, badgeProvider: "offline_queue", badgeRefreshInterval: 15, badgeValue: null, featureFlag: null, minimumRole: 0, supportsOffline: true, tenantId: null, warehouseId: null, platform: "all", isEnabled: true, isVisible: true, children: [] }
    ]
  }
];

export function useNavigation() {
  const [offlineTree, setOfflineTree] = useState<NavigationNode[]>([]);
  const isOnline = useOnlineStatus();
  const isOffline = !isOnline;

  useEffect(() => {
    // Initial load from IndexedDB
    IndexedDbService.getCachedNavigationTree<NavigationNode>()
      .then((cached) => {
        if (cached && cached.length > 0) {
          setOfflineTree(cached);
        }
      })
      .catch((err) => console.error("Error reading IndexedDB navigation cache:", err));
  }, []);

  const query = useQuery({
    queryKey: ["ops-navigation"],
    queryFn: async (): Promise<NavigationNode[]> => {
      const res = await fetch("/BuggyDm/api/ops/navigation");
      if (!res.ok) {
        throw new Error(`Failed to fetch navigation: HTTP ${res.status}`);
      }
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Navigation API error");
      }

      // Persist to IndexedDB for offline capability
      await IndexedDbService.cacheNavigationTree(json.data);
      return json.data;
    },
    staleTime: 1000 * 30, // 30s
    retry: 1,
  });

  const activeTree: NavigationNode[] = (query.data && query.data.length > 0) 
    ? query.data 
    : (offlineTree.length > 0 ? offlineTree : DEFAULT_FALLBACK_TREE);

  // Helpers for component rendering
  const mainLinks = activeTree.filter((item) => item.category === "Main" || (!item.parentId && item.category !== "Business Intelligence" && item.category !== "Operations"));
  
  const biParent = activeTree.find((item) => item.slug === "business-intelligence-parent" || item.category === "Business Intelligence");
  const biSubLinks = biParent?.children || activeTree.filter((item) => item.category === "Business Intelligence" && item.parentId);

  const opsParent = activeTree.find((item) => item.slug === "buggy-ops-parent" || item.category === "Operations");
  const opsSubLinks = opsParent?.children || activeTree.filter((item) => item.category === "Operations" && item.parentId);

  return {
    ...query,
    navigation: activeTree,
    mainLinks,
    biParent,
    biSubLinks,
    opsParent,
    opsSubLinks,
    isOffline,
  };
}
