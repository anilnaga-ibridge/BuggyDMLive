import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { AuditLogger } from "@/lib/qcos/audit-logger";
import { LayoutCacheManager } from "@/lib/qcos/cache";
import { serializeBigInts } from "@/lib/prisma-extension";
import { validateAuthoringDocument } from "@/lib/qcos/authoring";
import { referenceTemplates, widgetRegistry } from "@/lib/qcos/widget-registry";

const unauthorized = () => NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return unauthorized();

  const url = new URL(request.url);
  const pageName = url.searchParams.get("pageName");
  const templates = await prisma.qcos_page_templates.findMany({
    where: pageName ? { page_name: pageName } : undefined,
    include: {
      versions: {
        orderBy: { version_number: "desc" },
        take: pageName ? 20 : 1,
        include: {
          layouts: {
            include: {
              theme: { include: { tokens: true } },
              sections: {
                orderBy: { display_order: "asc" },
                include: {
                  widgets: {
                    orderBy: { display_order: "asc" },
                    include: { widget: true, data_source: true, actions: true, conditions: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { page_name: "asc" },
  });

  return NextResponse.json({
    success: true,
    templates: serializeBigInts(templates),
    registry: widgetRegistry,
    referenceTemplates,
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body: unknown = await request.json().catch(() => null);
  const validation = validateAuthoringDocument(body);
  if (!validation.document || validation.findings.some((finding) => finding.level === "error")) {
    return NextResponse.json({ success: false, error: "Document validation failed", findings: validation.findings }, { status: 422 });
  }

  const document = validation.document;
  const result = await prisma.$transaction(async (tx) => {
    const template = await tx.qcos_page_templates.upsert({
      where: { page_name: document.pageName },
      update: { description: document.description },
      create: { page_name: document.pageName, description: document.description },
    });
    const latest = await tx.qcos_page_versions.findFirst({
      where: { template_id: template.id },
      orderBy: { version_number: "desc" },
      select: { version_number: true },
    });
    const version = await tx.qcos_page_versions.create({
      data: {
        template_id: template.id,
        version_number: (latest?.version_number ?? 0) + 1,
        status: "draft",
        created_by: session.userId,
      },
    });
    const layout = await tx.qcos_layouts.create({
      data: { page_version_id: version.id, theme_id: document.themeId, name: document.layoutName, is_enabled: true },
    });

    const orderedSections = [...document.sections].sort((a, b) => a.order - b.order);
    for (let sectionIndex = 0; sectionIndex < orderedSections.length; sectionIndex += 1) {
      const sectionDocument = orderedSections[sectionIndex];
      const section = await tx.qcos_sections.create({
        data: {
          layout_id: layout.id,
          name: sectionDocument.name,
          display_order: sectionDocument.order,
          constraints_json: JSON.stringify({
            ...sectionDocument.constraints,
            id: sectionDocument.id,
            templateFamily: document.templateFamily,
            ...(sectionIndex === 0 && document.experienceShell ? { experienceShell: document.experienceShell } : {}),
          }),
          visibility_rules: sectionDocument.visibility ? JSON.stringify(sectionDocument.visibility) : null,
        },
      });
      for (let index = 0; index < sectionDocument.widgets.length; index += 1) {
        const instanceDocument = sectionDocument.widgets[index];
        const registryDefinition = widgetRegistry.find((definition) => definition.name === instanceDocument.type)!;
        const widget = await tx.qcos_widgets.upsert({
          where: { name: registryDefinition.name },
          update: {
            description: registryDefinition.description,
            schema_def: JSON.stringify({ version: registryDefinition.version, requiredCapabilities: registryDefinition.requiredCapabilities, properties: registryDefinition.schema }),
            min_version: "4.0.0",
          },
          create: {
            name: registryDefinition.name,
            description: registryDefinition.description,
            schema_def: JSON.stringify({ version: registryDefinition.version, requiredCapabilities: registryDefinition.requiredCapabilities, properties: registryDefinition.schema }),
            min_version: "4.0.0",
          },
        });
        let dataSourceId: number | null = null;
        if (instanceDocument.dataSource) {
          const dataSource = await tx.qcos_data_sources.upsert({
            where: { name: instanceDocument.dataSource.key },
            update: { resolver_endpoint: instanceDocument.dataSource.key, filters_json: JSON.stringify(instanceDocument.dataSource.params) },
            create: { name: instanceDocument.dataSource.key, resolver_endpoint: instanceDocument.dataSource.key, filters_json: JSON.stringify(instanceDocument.dataSource.params) },
          });
          dataSourceId = dataSource.id;
        }
        const instance = await tx.qcos_widget_instances.create({
          data: {
            section_id: section.id,
            widget_id: widget.id,
            display_order: index,
            data_source_id: dataSourceId,
            properties_json: JSON.stringify({ id: instanceDocument.id, version: instanceDocument.version, ...instanceDocument.props }),
          },
        });
        if (instanceDocument.actions.length) {
          await tx.qcos_widget_actions.createMany({
            data: instanceDocument.actions.map((action) => ({
              widget_instance_id: instance.id,
              trigger: action.trigger,
              action_type: action.type,
              params_json: JSON.stringify(action.params),
            })),
          });
        }
        if (instanceDocument.visibility) {
          await tx.qcos_widget_conditions.create({
            data: { widget_instance_id: instance.id, condition_expr: JSON.stringify(instanceDocument.visibility) },
          });
        }
      }
    }
    return { template, version, layout };
  });

  await LayoutCacheManager.invalidateAllLayoutCaches();
  await AuditLogger.log(session.userId, "CREATE_DRAFT", "qcos_page_versions", result.version.id, null, {
    pageName: document.pageName,
    version: result.version.version_number,
    templateFamily: document.templateFamily,
  });

  return NextResponse.json({ success: true, data: serializeBigInts(result), findings: validation.findings }, { status: 201 });
}
