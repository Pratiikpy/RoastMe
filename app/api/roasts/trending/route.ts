import { NextRequest, NextResponse } from "next/server";
import { getTrendingRoasts } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "20");

  try {
    const roasts = await getTrendingRoasts(limit);
    return NextResponse.json({ roasts });
  } catch (error) {
    console.error("Trending error:", error);
    return NextResponse.json({ error: "Failed to fetch trending" }, { status: 500 });
  }
}
