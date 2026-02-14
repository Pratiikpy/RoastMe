import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createClient, Errors } from "@farcaster/quick-auth";
import { saveRoast, getRecentRoasts, getRoast, getRoastsByStyle, checkPostRateLimit, updateBattleIndex, updateStreak, isTransactionUsed, markTransactionUsed } from "@/lib/db";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { submitToChallenge } from "@/lib/challenge";
import { sendRoastNotification, sendRoastBackNotification } from "@/lib/notifications";
import { checkAndAwardAchievements } from "@/lib/achievements";
import type { Roast, ThemeId, RoastStyle } from "@/lib/types";

const quickAuthClient = createClient();
const viemClient = createPublicClient({ chain: base, transport: http() });

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const offset = parseInt(searchParams.get("offset") ?? "0");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const style = searchParams.get("style") as RoastStyle | null;

  if (style) {
    const roasts = await getRoastsByStyle(style, offset, limit);
    return NextResponse.json({ roasts });
  }

  const roasts = await getRecentRoasts(offset, limit);
  return NextResponse.json({ roasts });
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const host = request.headers.get("host") ?? "localhost:3000";
    const domain = host.split(":")[0];

    let senderFid: number;
    try {
      const payload = await quickAuthClient.verifyJwt({ token, domain });
      senderFid = Number(payload.sub);
    } catch (e) {
      if (e instanceof Errors.InvalidTokenError) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
      throw e;
    }

    // Rate limit posting
    const postAllowed = await checkPostRateLimit(senderFid);
    if (!postAllowed) {
      return NextResponse.json(
        { error: "Post rate limit exceeded. Max 20 roasts per hour." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      targetFid,
      targetUsername,
      targetDisplayName,
      targetPfp,
      targetBio,
      roastText,
      theme,
      roastStyle,
      isSelfRoast,
      txHash,
      parentRoastId,
      senderUsername,
      senderPfp,
      challengeMode,
    } = body;

    if (!roastText || roastText.length > 500) {
      return NextResponse.json(
        { error: "Roast text required (max 500 chars)" },
        { status: 400 }
      );
    }

    if (!isSelfRoast) {
      if (!txHash) {
        return NextResponse.json(
          { error: "Transaction hash required for non-self roasts" },
          { status: 400 }
        );
      }

      // Check if tx hash was already used
      const alreadyUsed = await isTransactionUsed(txHash);
      if (alreadyUsed) {
        return NextResponse.json(
          { error: "Transaction already used" },
          { status: 400 }
        );
      }

      // Verify transaction exists on-chain and succeeded
      try {
        const receipt = await viemClient.getTransactionReceipt({
          hash: txHash as `0x${string}`,
        });
        if (receipt.status !== "success") {
          return NextResponse.json(
            { error: "Transaction failed on-chain" },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: "Transaction not found on-chain" },
          { status: 400 }
        );
      }

      // Mark tx as used
      await markTransactionUsed(txHash);
    }

    const roastId = nanoid(12);

    const roast: Roast = {
      id: roastId,
      senderFid,
      senderUsername: senderUsername || "anon",
      senderPfp: senderPfp || undefined,
      targetFid: targetFid || senderFid,
      targetUsername: targetUsername || senderUsername || "anon",
      targetDisplayName: targetDisplayName || undefined,
      targetPfp: targetPfp || undefined,
      targetBio: targetBio || undefined,
      roastText,
      theme: (theme as ThemeId) || "inferno",
      style: (roastStyle as RoastStyle) || undefined,
      isSelfRoast: isSelfRoast || false,
      txHash: txHash || null,
      parentRoastId: parentRoastId || undefined,
      timestamp: Date.now(),
      likes: 0,
      reactionCount: 0,
      reactions: { fire: 0, skull: 0, ice: 0, clown: 0 },
    };

    await saveRoast(roast);

    // Update streak
    let streak = { current: 0, longest: 0 };
    try {
      streak = await updateStreak(senderFid);
    } catch {
      // streak update failed, continue
    }

    // Submit to daily challenge if in challenge mode
    if (challengeMode) {
      submitToChallenge(roastId).catch(() => {});
    }

    // Send notifications in background
    if (!isSelfRoast && targetFid && targetFid !== senderFid) {
      sendRoastNotification(targetFid, roastId, senderUsername).catch(() => {});
    }

    // If roast-back, notify the original roaster
    if (parentRoastId) {
      getRoast(parentRoastId).then((parent) => {
        if (parent && parent.senderFid !== senderFid) {
          sendRoastBackNotification(
            parent.senderFid,
            roastId,
            senderUsername
          ).catch(() => {});
        }
      }).catch(() => {});

      // Update battle index
      updateBattleIndex(roast).catch(() => {});
    }

    // Check achievements and return them
    let newAchievements: string[] = [];
    try {
      newAchievements = await checkAndAwardAchievements("roast-created", {
        fid: senderFid,
        isSelfRoast: isSelfRoast || false,
        parentRoastId,
      });
    } catch {
      // achievements check failed, continue
    }

    return NextResponse.json({ roast, newAchievements, streak });
  } catch (error) {
    console.error("Error creating roast:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
