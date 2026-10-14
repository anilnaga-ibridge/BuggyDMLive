import { POST as resolveLegacy } from "../../../../qcos/experience/layout/route";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: Request) {
  try {
    const response = await resolveLegacy(request);
    const payload = await response.json();
    if (payload.notModified) {
      const requestHash = request.headers.get("If-None-Match")?.replace(/^W\//, "").replaceAll('"', "") || null;
      return Response.json({
        schemaVersion: "1.0",
        success: true,
        notModified: true,
        hash: requestHash ? `sha256:${requestHash}` : null,
        assignments: payload.assignments || [],
        data: null,
      }, {
        status: 200,
        headers: {
          ...corsHeaders,
          ...(requestHash ? { ETag: `"${requestHash}"` } : {}),
          "Cache-Control": "private, max-age=0, stale-if-error=604800",
          "Vary": "Accept-Language, X-Release-Channel, X-App-Version",
        },
      });
    }
    const hash = typeof payload.hash === "string" ? payload.hash : null;
    const formattedHash = hash ? (hash.startsWith("sha256:") ? hash : `sha256:${hash}`) : null;
    const finalData = payload.data ? {
      ...payload.data,
      hash: formattedHash,
    } : null;

    return Response.json({
      schemaVersion: payload.data?.schemaVersion || "1.0",
      success: payload.success,
      layoutId: payload.data?.layoutId ? String(payload.data.layoutId) : null,
      hash: formattedHash,
      generatedAt: new Date().toISOString(),
      cache: { staleIfErrorSeconds: 604800 },
      assignments: payload.assignments || [],
      diff: payload.diff || false,
      patch: payload.patch || null,
      data: finalData,
      error: payload.error || null,
    }, {
      status: response.status,
      headers: {
        ...corsHeaders,
        ...(hash ? { ETag: `"${hash}"` } : {}),
        "Cache-Control": "private, max-age=0, stale-if-error=604800",
        "Vary": "Accept-Language, X-Release-Channel, X-App-Version",
      },
    });
  } catch (error) {
    return Response.json({
      schemaVersion: "1.0",
      success: false,
      error: error instanceof Error ? error.message : "Internal error",
    }, {
      status: 500,
      headers: corsHeaders,
    });
  }
}

