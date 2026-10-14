import { prisma } from "../lib/prisma";

async function main() {
  console.log("🌱 Seeding Commerce Experience Platform (CXP) data...");

  // 1. Create Release Channels
  await prisma.qcos_release_channels.upsert({
    where: { code: "dev" },
    update: {},
    create: { name: "Development", code: "dev" },
  });
  await prisma.qcos_release_channels.upsert({
    where: { code: "prod" },
    update: {},
    create: { name: "Production", code: "prod" },
  });

  // 2. Create Themes and design tokens
  const diwaliTheme = await prisma.qcos_themes.create({
    data: {
      name: "Festival Diwali Theme",
      description: "Festive orange and gold aesthetic for Diwali Campaign",
      is_active: true,
      tokens: {
        create: [
          { token_key: "sys.color.primary", token_value: "#FF8C00", category: "color" },
          { token_key: "sys.color.secondary", token_value: "#FFD700", category: "color" },
          { token_key: "sys.color.surface", token_value: "#1A0F00", category: "color" },
          { token_key: "sys.spacing.lg", token_value: "20px", category: "spacing" },
        ],
      },
    },
  });

  await prisma.qcos_themes.create({
    data: {
      name: "Default Modern Theme",
      description: "Clean dark design default layout theme",
      is_active: false,
      tokens: {
        create: [
          { token_key: "sys.color.primary", token_value: "#10B981", category: "color" },
          { token_key: "sys.color.secondary", token_value: "#64748B", category: "color" },
          { token_key: "sys.color.surface", token_value: "#0F172A", category: "color" },
          { token_key: "sys.spacing.lg", token_value: "16px", category: "spacing" },
        ],
      },
    },
  });

  // 3. Create Widgets with Fallback Setup
  const bannerWidget = await prisma.qcos_widgets.create({
    data: {
      name: "BannerWidget",
      description: "Static hero promotional banner image block",
      min_version: "1.0.0",
      schema_def: JSON.stringify({
        type: "object",
        properties: {
          imageUrl: { type: "string" },
          targetUrl: { type: "string" },
        },
        required: ["imageUrl"],
      }),
    },
  });

  const countdownWidget = await prisma.qcos_widgets.create({
    data: {
      name: "CountdownWidget",
      description: "Dynamic countdown timer block with flash sales details",
      min_version: "2.0.0",
      fallback_id: bannerWidget.id,
      schema_def: JSON.stringify({
        type: "object",
        properties: {
          title: { type: "string" },
          endsAt: { type: "string" },
          imageUrl: { type: "string" },
        },
        required: ["endsAt"],
      }),
    },
  });

  // 4. Create Page Template
  const homeTemplate = await prisma.qcos_page_templates.create({
    data: {
      page_name: "home",
      description: "Store Front Homepage Screen",
    },
  });

  // 5. Create Page Version
  const homeVersion = await prisma.qcos_page_versions.create({
    data: {
      template_id: homeTemplate.id,
      version_number: 1,
      status: "published",
      created_by: 1,
      approved_by: 1,
      published_at: new Date(),
    },
  });

  // 6. Create Layout
  const diwaliLayout = await prisma.qcos_layouts.create({
    data: {
      page_version_id: homeVersion.id,
      theme_id: diwaliTheme.id,
      name: "Diwali Live Operations Homepage",
      is_enabled: true,
    },
  });

  // 7. Create Layout Sections
  const heroSection = await prisma.qcos_sections.create({
    data: {
      layout_id: diwaliLayout.id,
      name: "Promo Top Hero Section",
      display_order: 1,
      visibility_rules: JSON.stringify({ loggedIn: true }),
      constraints_json: JSON.stringify({ columns: 1 }),
    },
  });

  // 8. Create Widget Instances (Banner & Countdown)
  await prisma.qcos_widget_instances.create({
    data: {
      section_id: heroSection.id,
      widget_id: bannerWidget.id,
      display_order: 1,
      properties_json: JSON.stringify({
        imageUrl: "https://cdn.buggydelivery.com/banners/diwali-base.webp",
        targetUrl: "https://buggydelivery.com/category/sweets",
      }),
    },
  });

  await prisma.qcos_widget_instances.create({
    data: {
      section_id: heroSection.id,
      widget_id: countdownWidget.id,
      display_order: 2,
      properties_json: JSON.stringify({
        title: "Diwali Flash Sale Ends In:",
        endsAt: "2026-11-12T23:59:59Z",
        imageUrl: "https://cdn.buggydelivery.com/banners/diwali-timer.webp",
      }),
    },
  });

  // 9. Create Experience Context for test user
  await prisma.qcos_experience_context.create({
    data: {
      user_id: BigInt(999),
      city: "Hyderabad",
      timezone: "Asia/Kolkata",
      device_type: "android",
      network_speed: "4g",
      preferred_categories: JSON.stringify(["sweets", "grocery"]),
      weather_code: "clear",
    },
  });

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
