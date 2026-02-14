import { NextRequest, NextResponse } from "next/server";
import { getSentRoasts } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fid = parseInt(searchParams.get("fid") ?? "0");

  if (!fid) {
    return NextResponse.json({ error: "fid required" }, { status: 400 });
  }

  try {
    const roasts = await getSentRoasts(fid);
    return NextResponse.json({ roasts });
  } catch (error) {
    console.error("Sent roasts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sent roasts" },
      { status: 500 }
    );
  }
}
