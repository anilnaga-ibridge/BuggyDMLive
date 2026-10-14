import { prisma } from "../lib/prisma";
import { LayoutCacheManager } from "../lib/qcos/cache";

async function run() {
  console.log("=== START INTEGRATION TEST FOR CAPABILITY NEGOTIATION ===");
  const db = prisma;

  // 1. Create a dynamic test widget with required capabilities & version inside schema_def
  console.log("Inserting test capabilities-gated widgets into DB...");

  const mainWidget = await db.qcos_widgets.create({
    data: {
      name: "diwali_lottie_banner",
      description: "Diwali Countdown Banner requiring Lottie support",
      schema_def: JSON.stringify({
        version: "2.0.0",
        requiredCapabilities: ["lottie", "animation_curves"]
      }),
      min_version: "1.0.0",
    }
  });

  const fallbackWidget = await db.qcos_widgets.create({
    data: {
      name: "diwali_static_banner",
      description: "Fallback static image banner for older clients",
      schema_def: JSON.stringify({
        version: "1.0.0"
      }),
      min_version: "1.0.0",
    }
  });

  // Link fallback to main widget
  await db.qcos_widgets.update({
    where: { id: mainWidget.id },
    data: { fallback_id: fallbackWidget.id }
  });

  // 2. Create a test page version and layout section holding our main widget
  const tempVersion = await db.qcos_page_versions.create({
    data: {
      template_id: 1,
      version_number: 99,
      status: "draft",
      created_by: 3
    }
  });

  const tempLayout = await db.qcos_layouts.create({
    data: {
      page_version_id: tempVersion.id,
      theme_id: 1,
      name: "Capability Test Layout",
      is_enabled: true
    }
  });

  await db.qcos_sections.create({
    data: {
      layout_id: tempLayout.id,
      name: "Promo Slot",
      display_order: 1,
      widgets: {
        create: [
          { widget_id: mainWidget.id, display_order: 1, properties_json: "{}" }
        ]
      }
    }
  });

  // Promote to active channel
  await db.qcos_publish_history.create({
    data: {
      page_version_id: tempVersion.id,
      channel_id: 2, // prod
      published_by: 3
    }
  });

  await db.qcos_page_versions.update({
    where: { id: tempVersion.id },
    data: { status: "published", published_at: new Date() }
  });

  // Invalidate all layout caches
  await LayoutCacheManager.invalidateAllLayoutCaches();

  console.log("Database records seeded. Running resolution tests...");

  // TEST CASE 1: Query without capabilities (expects fallback static widget)
  console.log("\n--- TEST CASE 1: Querying without required client capabilities ---");
  const res1 = await fetch("http://localhost:3001/BuggyCxp/api/qcos/experience/layout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Release-Channel": "prod",
    },
    body: JSON.stringify({ pageName: "home" })
  });
  const json1 = await res1.json();
  const activeWidget1 = json1.data.sections[0].widgets[0].widget;
  console.log(`Resolved Widget Name: ${activeWidget1.name} (Expected: diwali_static_banner)`);
  if (activeWidget1.name === "diwali_static_banner") {
    console.log("✅ Test Case 1 PASSED: Resolved to static fallback banner.");
  } else {
    console.error("❌ Test Case 1 FAILED: Did not resolve to fallback.");
  }

  // TEST CASE 2: Query with Lottie capability (expects main widget)
  console.log("\n--- TEST CASE 2: Querying with lottie capability ---");
  const res2 = await fetch("http://localhost:3001/BuggyCxp/api/qcos/experience/layout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Release-Channel": "prod",
      "X-Client-Capabilities": JSON.stringify(["lottie", "animation_curves"]),
    },
    body: JSON.stringify({ pageName: "home" })
  });
  const json2 = await res2.json();
  const activeWidget2 = json2.data.sections[0].widgets[0].widget;
  console.log(`Resolved Widget Name: ${activeWidget2.name} (Expected: diwali_lottie_banner)`);
  if (activeWidget2.name === "diwali_lottie_banner") {
    console.log("✅ Test Case 2 PASSED: Successfully resolved to Lottie banner.");
  } else {
    console.error("❌ Test Case 2 FAILED: Did not resolve to Lottie banner.");
  }

  // TEST CASE 3: Query with Lottie capability but incompatible widget version (expects fallback)
  console.log("\n--- TEST CASE 3: Querying with client limiting widget to v1.0.0 (Layout requires v2.0.0) ---");
  const res3 = await fetch("http://localhost:3001/BuggyCxp/api/qcos/experience/layout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Release-Channel": "prod",
      "X-Client-Capabilities": JSON.stringify(["lottie", "animation_curves"]),
      "X-Client-Widget-Versions": JSON.stringify({ "diwali_lottie_banner": "1.0.0" }),
    },
    body: JSON.stringify({ pageName: "home" })
  });
  const json3 = await res3.json();
  const activeWidget3 = json3.data.sections[0].widgets[0].widget;
  console.log(`Resolved Widget Name: ${activeWidget3.name} (Expected: diwali_static_banner)`);
  if (activeWidget3.name === "diwali_static_banner") {
    console.log("✅ Test Case 3 PASSED: Incompatible version resolved to fallback static banner.");
  } else {
    console.error("❌ Test Case 3 FAILED: Incompatible version resolved to main widget.");
  }

  // TEST CASE 4: Cache isolation check
  // Hit case 2 again (should hit cache and return diwali_lottie_banner)
  console.log("\n--- TEST CASE 4: Verifying cache isolation between capability permutations ---");
  const res4 = await fetch("http://localhost:3001/BuggyCxp/api/qcos/experience/layout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Release-Channel": "prod",
      "X-Client-Capabilities": JSON.stringify(["lottie", "animation_curves"]),
    },
    body: JSON.stringify({ pageName: "home" })
  });
  const json4 = await res4.json();
  const activeWidget4 = json4.data.sections[0].widgets[0].widget;
  console.log(`Cache Read Resolved Widget: ${activeWidget4.name} (Expected: diwali_lottie_banner)`);
  if (activeWidget4.name === "diwali_lottie_banner") {
    console.log("✅ Test Case 4 PASSED: Cache correctly isolated and resolved layout matching capabilities.");
  } else {
    console.error("❌ Test Case 4 FAILED: Cache collision detected.");
  }

  // 5. Clean up records
  console.log("\nCleaning up database records...");
  await db.qcos_publish_history.deleteMany({
    where: { page_version_id: tempVersion.id }
  });
  await db.qcos_sections.deleteMany({
    where: { layout_id: tempLayout.id }
  });
  await db.qcos_layouts.deleteMany({
    where: { page_version_id: tempVersion.id }
  });
  await db.qcos_page_versions.delete({
    where: { id: tempVersion.id }
  });
  // Null fallback link before delete
  await db.qcos_widgets.update({
    where: { id: mainWidget.id },
    data: { fallback_id: null }
  });
  await db.qcos_widgets.delete({
    where: { id: mainWidget.id }
  });
  await db.qcos_widgets.delete({
    where: { id: fallbackWidget.id }
  });

  await LayoutCacheManager.invalidateAllLayoutCaches();
  console.log("Cleanup finished.");
  console.log("=== INTEGRATION TEST COMPLETED ===");
}

run().catch((e) => {
  console.error("Test execution failed:", e);
});
