import { prisma } from "../lib/prisma";
import { LayoutCacheManager } from "../lib/qcos/cache";

async function run() {
  console.log("=== START INTEGRATION TEST FOR DECOUPLED TARGETING RULES ===");
  const db = prisma;

  // 1. Seed a reusable targeting rule entity
  console.log("Seeding reusable targeting rule 'premium_users_only'...");
  const reusableRule = await db.qcos_experience_rules.create({
    data: {
      name: "premium_users_only",
      conditions_json: JSON.stringify({
        field: "loggedIn",
        operator: "equals",
        value: "true"
      }),
      actions_json: "[]",
      is_active: true
    }
  });

  // 2. Create a test page version, layout and section linking visibility to the decoupled rule
  const tempVersion = await db.qcos_page_versions.create({
    data: {
      template_id: 1,
      version_number: 98,
      status: "draft",
      created_by: 3
    }
  });

  const tempLayout = await db.qcos_layouts.create({
    data: {
      page_version_id: tempVersion.id,
      theme_id: 1,
      name: "Decoupled Rule Test Layout",
      is_enabled: true
    }
  });

  // Section visibility references the decoupled rule via the string template "rule:<name>"
  await db.qcos_sections.create({
    data: {
      layout_id: tempLayout.id,
      name: "Gated Section",
      display_order: 1,
      visibility_rules: "rule:premium_users_only",
      widgets: {
        create: [
          { widget_id: 1, display_order: 1, properties_json: "{}" }
        ]
      }
    }
  });

  // Promote version to active prod channel
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

  // Invalidate layout caches
  await LayoutCacheManager.invalidateAllLayoutCaches();

  console.log("Database records seeded. Running resolution tests...");

  // TEST CASE 1: Query as a logged out guest (expected section should be filtered out)
  console.log("\n--- TEST CASE 1: Querying as logged out guest ---");
  const res1 = await fetch("http://localhost:3001/BuggyCxp/api/qcos/experience/layout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Release-Channel": "prod",
    },
    body: JSON.stringify({ pageName: "home" })
  });
  const json1 = await res1.json();
  const sectionsCount1 = json1.data.sections.length;
  console.log(`Resolved Sections Count: ${sectionsCount1} (Expected: 0)`);
  if (sectionsCount1 === 0) {
    console.log("✅ Test Case 1 PASSED: Gated section was successfully filtered out.");
  } else {
    console.error("❌ Test Case 1 FAILED: Gated section was incorrectly served to guest.");
  }

  // TEST CASE 2: Query as a logged in user (expected section should be served)
  console.log("\n--- TEST CASE 2: Querying as logged in user ---");
  const res2 = await fetch("http://localhost:3001/BuggyCxp/api/qcos/experience/layout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Release-Channel": "prod",
    },
    body: JSON.stringify({ pageName: "home", userId: "101" })
  });
  const json2 = await res2.json();
  const sectionsCount2 = json2.data.sections.length;
  console.log(`Resolved Sections Count: ${sectionsCount2} (Expected: 1)`);
  if (sectionsCount2 === 1 && json2.data.sections[0].name === "Gated Section") {
    console.log("✅ Test Case 2 PASSED: Gated section was successfully served to logged-in user.");
  } else {
    console.error("❌ Test Case 2 FAILED: Gated section was skipped.");
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
  await db.qcos_experience_rules.delete({
    where: { id: reusableRule.id }
  });

  await LayoutCacheManager.invalidateAllLayoutCaches();
  console.log("Cleanup finished.");
  console.log("=== INTEGRATION TEST COMPLETED ===");
}

run().catch((e) => {
  console.error("Test execution failed:", e);
});
