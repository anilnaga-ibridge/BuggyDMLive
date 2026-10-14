import { prisma } from "../lib/prisma";
import { LayoutCacheManager } from "../lib/qcos/cache";

async function run() {
  console.log("=== START INTEGRATION TEST FOR CXP VERSION DIFF SYNC ===");
  const db = prisma;

  // 1. Get the layout hash of Version 1 (currently active)
  const v1Res = await fetch("http://localhost:3000/BuggyDm/api/qcos/experience/layout?t=" + Date.now(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pageName: "home" }),
    cache: "no-store"
  });
  const v1Json = await v1Res.json();
  const v1Hash = v1Json.hash;
  console.log("Version 1 Layout Hash resolved:", v1Hash);

  // 2. Create Page Version 2 programmatically
  console.log("Creating Page Version 2 in database...");
  const v2 = await db.qcos_page_versions.create({
    data: {
      template_id: 1,
      version_number: 2,
      status: "draft",
      created_by: 3
    }
  });

  // Create layout for Version 2
  const layout2 = await db.qcos_layouts.create({
    data: {
      page_version_id: v2.id,
      theme_id: 1,
      name: "Version 2 Homepage Layout",
      is_enabled: true
    }
  });

  // Create sections for Version 2 (add a new section to make it different from Version 1)
  await db.qcos_sections.create({
    data: {
      layout_id: layout2.id,
      name: "Promo Top Hero Section",
      display_order: 1,
      widgets: {
        create: [
          { widget_id: 1, display_order: 1, properties_json: "{}" }
        ]
      }
    }
  });

  await db.qcos_sections.create({
    data: {
      layout_id: layout2.id,
      name: "Weekly Specials Banner Section",
      display_order: 2,
      widgets: {
        create: [
          { widget_id: 1, display_order: 1, properties_json: "{}" }
        ]
      }
    }
  });

  console.log("Page Version 2 created successfully.");

  // 3. Promote Page Version 2 to 'prod' channel
  console.log("Promoting Page Version 2 to active 'prod' channel...");
  await db.qcos_publish_history.updateMany({
    where: { channel_id: 2, rolled_back_at: null },
    data: { rolled_back_at: new Date() }
  });
  await db.qcos_publish_history.create({
    data: {
      page_version_id: v2.id,
      channel_id: 2,
      published_by: 3
    }
  });
  await db.qcos_page_versions.update({
    where: { id: v2.id },
    data: { status: "published", published_at: new Date() }
  });

  // Invalidate cache
  await LayoutCacheManager.invalidateAllLayoutCaches();

  // 4. Hit the layout resolution gateway using Version 1's Hash
  console.log("Sending Layout resolution request with Version 1 hash...");
  const diffRes = await fetch("http://localhost:3000/BuggyDm/api/qcos/experience/layout?t=" + (Date.now() + 1), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Layout-Hash": v1Hash
    },
    body: JSON.stringify({ pageName: "home" }),
    cache: "no-store"
  });
  const diffJson = await diffRes.json();
  console.log("Entire Diff Response:", JSON.stringify(diffJson, null, 2));

  // 5. Clean up: Promote Version 1 back to prod and delete Page Version 2
  console.log("Cleaning up: Reverting active channel to Version 1...");
  await db.qcos_publish_history.updateMany({
    where: { channel_id: 2, rolled_back_at: null },
    data: { rolled_back_at: new Date() }
  });
  await db.qcos_publish_history.create({
    data: {
      page_version_id: 1,
      channel_id: 2,
      published_by: 3
    }
  });
  await db.qcos_page_versions.update({
    where: { id: 1 },
    data: { status: "published", published_at: new Date() }
  });

  // Invalidate cache
  await LayoutCacheManager.invalidateAllLayoutCaches();

  // Delete version 2
  await db.qcos_page_versions.delete({
    where: { id: v2.id }
  });
  console.log("Clean up finished.");
  console.log("=== INTEGRATION TEST COMPLETED ===");
}

run().catch(console.error);
