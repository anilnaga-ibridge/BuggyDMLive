import { prisma } from "../lib/prisma";

async function main() {
  console.log("Prisma keys:", Object.keys(prisma));
  console.log("panel_ai_recommendations is defined:", !!prisma.panel_ai_recommendations);
}

main().catch(console.error);
