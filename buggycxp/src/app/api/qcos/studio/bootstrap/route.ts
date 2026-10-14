import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { widgetRegistry } from "@/lib/qcos/widget-registry";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const channels = [
    { name: "Development", code: "dev" },
    { name: "Quality Assurance", code: "qa" },
    { name: "Staging", code: "staging" },
    { name: "Production", code: "prod" },
  ];
  await prisma.$transaction([
    ...channels.map((channel) => prisma.qcos_release_channels.upsert({ where: { code: channel.code }, update: { name: channel.name }, create: channel })),
    ...widgetRegistry.map((definition) => prisma.qcos_widgets.upsert({
      where: { name: definition.name },
      update: { description: definition.description, schema_def: JSON.stringify({ version: definition.version, requiredCapabilities: definition.requiredCapabilities, properties: definition.schema }), min_version: "4.0.0" },
      create: { name: definition.name, description: definition.description, schema_def: JSON.stringify({ version: definition.version, requiredCapabilities: definition.requiredCapabilities, properties: definition.schema }), min_version: "4.0.0" },
    })),
  ]);

  return NextResponse.json({ success: true, channels: channels.length, widgets: widgetRegistry.length });
}
