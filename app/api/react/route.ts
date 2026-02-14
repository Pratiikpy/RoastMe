import { NextRequest, NextResponse } from "next/server";
import { createClient, Errors } from "@farcaster/quick-auth";
import { addReaction, checkReactionRateLimit, getRoast } from "@/lib/db";
import { sendReactionNotification } from "@/lib/notifications";
import { checkAndAwardAchievements } from "@/lib/achievements";
import { REACTION_TYPES } from "@/lib/constants";
import type { ReactionType } from "@/lib/types";

const quickAuthClient = createClient();

const VALID_EMOJIS = new Set(REACTION_TYPES.map((r) => r.id));

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

    const { roastId, emoji } = await request.json();
    if (!roastId || !emoji) {
      return NextResponse.json({ error: "roastId and emoji required" }, { status: 400 });
    }

    if (!VALID_EMOJIS.has(emoji)) {
      return NextResponse.json({ error: "Invalid emoji type" }, { status: 400 });
    }

    // Rate limit
    const allowed = await checkReactionRateLimit(userFid);
    if (!allowed) {
      return NextResponse.json(
        { error: "Reaction rate limit exceeded. Max 100/hour." },
        { status: 429 }
      );
    }

    const result = await addReaction(roastId, emoji as ReactionType, userFid);

    // Send notification to roast sender (in background)
    const roast = await getRoast(roastId);
    if (roast && roast.senderFid !== userFid) {
      const emojiDef = REACTION_TYPES.find((r) => r.id === emoji);
      sendReactionNotification(
        roast.senderFid,
        roastId,
        emojiDef?.emoji ?? emoji,
        "someone"
      ).catch(() => {});
    }

    // Check achievements for reaction recipient
    let newAchievements: string[] = [];
    if (roast) {
      try {
        newAchievements = await checkAndAwardAchievements("reaction-received", {
          fid: roast.senderFid,
        });
      } catch {
        // achievements check failed, continue
      }
    }

    return NextResponse.json({
      counts: result.counts,
      total: result.total,
      userReactions: result.userReactions,
      newAchievements,
    });
  } catch (error) {
    console.error("React error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
