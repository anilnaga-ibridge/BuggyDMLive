import { prisma } from "../../src/lib/prisma";

export async function seedOpsNavigation() {
  console.log("Seeding ops_navigation data...");

  // Clear existing items
  await prisma.ops_navigation_features.deleteMany({});
  await prisma.ops_navigation_permissions.deleteMany({});
  await prisma.ops_navigation_roles.deleteMany({});
  await prisma.ops_navigation.deleteMany({});

  // 1. Top Level Categories / Main Items
  const items = [
    // Main Dashboard Items
    {
      title: "Orders Dashboard",
      slug: "orders-dashboard",
      route: "/orders",
      icon: "Layers",
      description: "Live order monitoring and kanban workflow",
      category: "Main",
      display_order: 1,
      badge_provider: "orders_waiting",
      badge_refresh_interval: 15,
      feature_flag: null,
      minimum_role: 0,
      supports_offline: true,
      platform: "all",
      is_enabled: true,
      is_visible: true,
    },
    {
      title: "Product Management",
      slug: "product-management",
      route: "/products",
      icon: "Package",
      description: "Catalog management and product stock",
      category: "Main",
      display_order: 2,
      badge_provider: null,
      badge_refresh_interval: 30,
      feature_flag: null,
      minimum_role: 0,
      supports_offline: true,
      platform: "all",
      is_enabled: true,
      is_visible: true,
    },
    {
      title: "Bulk Editor",
      slug: "bulk-editor",
      route: "/bulk-editor",
      icon: "Grid",
      description: "Batch update product pricing and availability",
      category: "Main",
      display_order: 3,
      badge_provider: null,
      badge_refresh_interval: 30,
      feature_flag: null,
      minimum_role: 0,
      supports_offline: true,
      platform: "all",
      is_enabled: true,
      is_visible: true,
    },
    {
      title: "Delivery Boys",
      slug: "delivery-boys",
      route: "/delivery",
      icon: "User",
      description: "Rider management and delivery metrics",
      category: "Main",
      display_order: 4,
      badge_provider: null,
      badge_refresh_interval: 30,
      feature_flag: null,
      minimum_role: 0,
      supports_offline: true,
      platform: "all",
      is_enabled: true,
      is_visible: true,
    },
    {
      title: "Organization & Hierarchy",
      slug: "admin-organization",
      route: "/admin/organization",
      icon: "Building2",
      description: "Global holdings, regions, clusters, and store topology",
      category: "Main",
      display_order: 5,
      badge_provider: null,
      badge_refresh_interval: 60,
      feature_flag: null,
      minimum_role: 0,
      supports_offline: true,
      platform: "all",
      is_enabled: true,
      is_visible: true,
    },
    {
      title: "RBAC & Device Binding",
      slug: "admin-rbac",
      route: "/admin/rbac",
      icon: "ShieldCheck",
      description: "Department roles, shift status, and terminal hardware lock",
      category: "Main",
      display_order: 6,
      badge_provider: null,
      badge_refresh_interval: 60,
      feature_flag: null,
      minimum_role: 0,
      supports_offline: true,
      platform: "all",
      is_enabled: true,
      is_visible: true,
    },
    {
      title: "Dark Store Topology",
      slug: "admin-topology",
      route: "/admin/topology",
      icon: "Grid",
      description: "Rack, shelf, bin layout and shelf-level stock audit",
      category: "Main",
      display_order: 7,
      badge_provider: null,
      badge_refresh_interval: 60,
      feature_flag: null,
      minimum_role: 0,
      supports_offline: true,
      platform: "all",
      is_enabled: true,
      is_visible: true,
    },
    {
      title: "Rider Mobile Portal",
      slug: "rider-dashboard",
      route: "/rider/dashboard",
      icon: "Truck",
      description: "Unified rider PWA app with live dispatch, route map, QR scanner, weekly earnings, IMPS cashout, & AR Gate milestones",
      category: "Main",
      display_order: 8,
      badge_provider: null,
      badge_refresh_interval: 15,
      feature_flag: null,
      minimum_role: 0,
      supports_offline: true,
      platform: "all",
      is_enabled: true,
      is_visible: true,
    },

    // Business Intelligence Sublinks
    {
      title: "Business Intelligence",
      slug: "business-intelligence-parent",
      route: "/business-intelligence",
      icon: "BarChart3",
      description: "BI Analytics and Store Metrics",
      category: "Business Intelligence",
      display_order: 10,
      badge_provider: null,
      badge_refresh_interval: 60,
      feature_flag: "analytics_dashboard",
      minimum_role: 0,
      supports_offline: true,
      platform: "all",
      is_enabled: true,
      is_visible: true,
    },

    // Buggy OPS Group Parent
    {
      title: "Buggy OPS",
      slug: "buggy-ops-parent",
      route: "/ops",
      icon: "ShoppingBag",
      description: "Darkstore operations & workstation desks",
      category: "Operations",
      display_order: 20,
      badge_provider: null,
      badge_refresh_interval: 30,
      feature_flag: null,
      minimum_role: 0,
      supports_offline: true,
      platform: "all",
      is_enabled: true,
      is_visible: true,
    },
  ];

  for (const item of items) {
    await prisma.ops_navigation.create({
      data: item,
    });
  }

  // Get parent for Buggy OPS
  const opsParent = await prisma.ops_navigation.findUnique({
    where: { slug: "buggy-ops-parent" },
  });

  const biParent = await prisma.ops_navigation.findUnique({
    where: { slug: "business-intelligence-parent" },
  });

  // 2. BI Sub-items
  if (biParent) {
    const biChildren = [
      { title: "Executive Dashboard", slug: "bi-executive", route: "/business-intelligence/executive", icon: "LayoutDashboard", display_order: 1 },
      { title: "Sales Intelligence", slug: "bi-sales", route: "/business-intelligence/sales", icon: "TrendingUp", display_order: 2 },
      { title: "Product Intelligence", slug: "bi-products", route: "/business-intelligence/products", icon: "Package", display_order: 3 },
      { title: "Customer Intelligence", slug: "bi-customers", route: "/business-intelligence/customers", icon: "Users", display_order: 4 },
      { title: "Location Intelligence", slug: "bi-locations", route: "/business-intelligence/locations", icon: "MapPin", display_order: 5 },
      { title: "Inventory Intelligence", slug: "bi-inventory", route: "/business-intelligence/inventory", icon: "Database", display_order: 6 },
      { title: "Delivery Intelligence", slug: "bi-delivery", route: "/business-intelligence/delivery", icon: "Truck", display_order: 7 },
      { title: "Marketing Intelligence", slug: "bi-marketing", route: "/business-intelligence/marketing", icon: "Megaphone", display_order: 8 },
      { title: "Cost Optimization", slug: "bi-cost", route: "/business-intelligence/cost", icon: "DollarSign", display_order: 9 },
      { title: "AI Insights", slug: "bi-ai", route: "/business-intelligence/ai", icon: "Sparkles", display_order: 10 },
      { title: "Reports", slug: "bi-reports", route: "/business-intelligence/reports", icon: "FileText", display_order: 11 },
    ];

    for (const child of biChildren) {
      await prisma.ops_navigation.create({
        data: {
          ...child,
          parent_id: biParent.id,
          category: "Business Intelligence",
          badge_provider: null,
          badge_refresh_interval: 60,
          feature_flag: null,
          minimum_role: 0,
          supports_offline: true,
          platform: "all",
          is_enabled: true,
          is_visible: true,
        },
      });
    }
  }

  // 3. Buggy OPS Workstations
  if (opsParent) {
    const opsWorkstations = [
      { title: "Picker Desk", slug: "ops-picker", route: "/ops/picker", icon: "Layers", badge_provider: "orders_waiting", display_order: 1 },
      { title: "Packer Desk", slug: "ops-packer", route: "/ops/packer", icon: "Package", badge_provider: "packing_queue", display_order: 2 },
      { title: "QC Station", slug: "ops-qc", route: "/ops/qc", icon: "Eye", badge_provider: "pending_qc", display_order: 3 },
      { title: "Dispatch Shelf", slug: "ops-dispatcher", route: "/ops/dispatcher", icon: "Truck", badge_provider: "dispatch_ready", display_order: 4 },
      { title: "Supervisor", slug: "ops-supervisor", route: "/ops/supervisor", icon: "Users", badge_provider: "critical_orders", display_order: 5 },
      { title: "Manager Console", slug: "ops-manager", route: "/ops/manager", icon: "FileText", badge_provider: null, display_order: 6 },
      { title: "Inventory Ops", slug: "ops-inventory", route: "/ops/inventory", icon: "Scan", badge_provider: "inventory_alert", display_order: 7 },
      { title: "Returns Desk", slug: "ops-returns", route: "/ops/returns", icon: "RotateCcw", badge_provider: "returns_pending", display_order: 8 },
      { title: "Offline Sync", slug: "ops-offline", route: "/ops/offline", icon: "WifiOff", badge_provider: "offline_queue", display_order: 9 },
    ];

    for (const workstation of opsWorkstations) {
      await prisma.ops_navigation.create({
        data: {
          ...workstation,
          parent_id: opsParent.id,
          category: "Operations",
          badge_refresh_interval: 15,
          feature_flag: null,
          minimum_role: 0,
          supports_offline: true,
          platform: "all",
          is_enabled: true,
          is_visible: true,
        },
      });
    }
  }

  console.log("Seeding ops_navigation completed successfully!");
}

if (require.main === module) {
  seedOpsNavigation()
    .catch((err) => console.error(err))
    .finally(() => prisma.$disconnect());
}
