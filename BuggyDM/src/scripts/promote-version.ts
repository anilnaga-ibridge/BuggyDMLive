import { prisma } from "../lib/prisma";
import { LayoutCacheManager } from "../lib/qcos/cache";

async function run() {
  // 1. Promote to Development (Channel ID 1)
  await prisma.qcos_publish_history.deleteMany({
    where: { channel_id: 1 }
  });
  await prisma.qcos_publish_history.create({
    data: {
      page_version_id: 1,
      channel_id: 1,
      published_by: 3
    }
  });

  // 2. Promote to Production (Channel ID 2)
  await prisma.qcos_publish_history.deleteMany({
    where: { channel_id: 2 }
  });
  await prisma.qcos_publish_history.create({
    data: {
      page_version_id: 1,
      channel_id: 2,
      published_by: 3
    }
  });

  // 3. Update status of page version to published
  await prisma.qcos_page_versions.update({
    where: { id: 1 },
    data: {
      status: "published",
      published_at: new Date()
    }
  });

  // 4. Invalidate caches
  await LayoutCacheManager.invalidateAllLayoutCaches();

  console.log("🚀 Version 1 successfully promoted to Development and Production channels!");
}

run().catch(console.error);
