import { NextRequest, NextResponse } from "next/server";
import { getRoast, getRoastChain, getUserReactions } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const fid = searchParams.get("fid");

  try {
    const roast = await getRoast(id);
    if (!roast) {
      return NextResponse.json(
        { roast: null, chain: [] },
        { status: 404 }
      );
    }

    const chain = await getRoastChain(id);

    // If fid provided, get user's reactions
    let userReactions: string[] = [];
    if (fid) {
      userReactions = await getUserReactions(id, Number(fid));
    }

    return NextResponse.json({ roast, chain, userReactions });
  } catch (error) {
    console.error("Get roast error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
