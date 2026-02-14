import { NextRequest, NextResponse } from "next/server";
import { createClient, Errors } from "@farcaster/quick-auth";
import { likeRoast, getRoast } from "@/lib/db";
import { sendLikeNotification } from "@/lib/notifications";

const quickAuthClient = createClient();

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const host = request.headers.get("host") ?? "localhost:3000";
    const domain = host.split(":")[0];

    let userFid: number;
    try {
      const payload = await quickAuthClient.verifyJwt({ token, domain });
      userFid = Number(payload.sub);
    } catch (e) {
      if (e instanceof Errors.InvalidTokenError) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
      throw e;
    }

    const { roastId } = await request.json();
    if (!roastId) {
      return NextResponse.json({ error: "roastId required" }, { status: 400 });
    }

    const newLikes = await likeRoast(roastId, userFid);
    if (newLikes === -1) {
      const roast = await getRoast(roastId);
      return NextResponse.json({ likes: roast?.likes ?? 0, alreadyLiked: true });
    }

    // Notify roast sender in background
    const roast = await getRoast(roastId);
    if (roast && roast.senderFid !== userFid) {
      sendLikeNotification(roast.senderFid, roastId, "\uD83D\uDD25", "someone").catch(() => {});
    }

    return NextResponse.json({ likes: newLikes, alreadyLiked: false });
  } catch (error) {
    console.error("Like error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
