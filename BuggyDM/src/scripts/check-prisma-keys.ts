import { prisma } from "../lib/prisma";

async function run() {
  // Trigger a dummy call to initialize the client
  try {
    await prisma.$connect();
  } catch {}

  const keys = Object.getOwnPropertyNames(Object.getPrototypeOf(prisma))
    .concat(Object.keys(prisma))
    .filter(k => k.startsWith("qcos") || k.includes("analytics") || k.includes("audit") || k.includes("widget"));

  console.log("Found keys:", keys);
}

run().catch(console.error);
