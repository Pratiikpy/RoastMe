import { NextRequest, NextResponse } from "next/server";
import { createClient, Errors } from "@farcaster/quick-auth";
import { toggleBookmark, getBookmarks, isBookmarked } from "@/lib/db";

const quickAuthClient = createClient();

async function authenticateFid(request: NextRequest): Promise<number | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];
  const host = request.headers.get("host") ?? "localhost:3000";
  const domain = host.split(":")[0];

  try {
    const payload = await quickAuthClient.verifyJwt({ token, domain });
    return Number(payload.sub);
  } catch (e) {
    if (e instanceof Errors.InvalidTokenError) return null;
    throw e;
  }
}

export async function POST(request: NextRequest) {
  try {
    const fid = await authenticateFid(request);
    if (!fid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roastId } = await request.json();
    if (!roastId) {
      return NextResponse.json({ error: "roastId required" }, { status: 400 });
    }

    const bookmarked = await toggleBookmark(fid, roastId);
    return NextResponse.json({ bookmarked });
  } catch (error) {
    console.error("Bookmark error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const fid = await authenticateFid(request);
    if (!fid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roastId = searchParams.get("roastId");

    // Check single bookmark status
    if (roastId) {
      const saved = await isBookmarked(fid, roastId);
      return NextResponse.json({ bookmarked: saved });
    }

    // Get all bookmarks
    const roasts = await getBookmarks(fid);
    return NextResponse.json({ roasts });
  } catch (error) {
    console.error("Get bookmarks error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
