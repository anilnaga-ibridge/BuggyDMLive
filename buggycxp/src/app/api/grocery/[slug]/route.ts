import { NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const buggyDmUrl = process.env.BUGGY_DM_URL || "http://127.0.0.1:3000/BuggyDm";
    const targetUrl = `${buggyDmUrl}/api/grocery/${slug}`;

    const res = await fetch(targetUrl, {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Upstream returned status ${res.status}` },
        { status: res.status, headers: corsHeaders }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch from BuggyDM",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
