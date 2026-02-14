import { NextRequest, NextResponse } from "next/server";
import { createClient, Errors } from "@farcaster/quick-auth";
import { recordTip, getTotalTips, getRoast, storeInAppNotification } from "@/lib/db";
import type { InAppNotification } from "@/lib/types";
import { nanoid } from "nanoid";

const quickAuthClient = createClient();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roastId = searchParams.get("roastId");

  if (!roastId) {
    return NextResponse.json({ error: "roastId required" }, { status: 400 });
  }

  const total = await getTotalTips(roastId);
  return NextResponse.json({ total });
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

    const { roastId, amount, txHash } = await request.json();
    if (!roastId || !amount) {
      return NextResponse.json({ error: "roastId and amount required" }, { status: 400 });
    }

    const roast = await getRoast(roastId);
    if (!roast) {
      return NextResponse.json({ error: "Roast not found" }, { status: 404 });
    }

    // Parse amount from display string like "0.10 USDC"
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    await recordTip(roastId, senderFid, roast.senderFid, String(numericAmount));

    // Notify the roast creator
    if (roast.senderFid !== senderFid) {
      const notif: InAppNotification = {
        id: nanoid(12),
        type: "tip",
        title: `Someone tipped your roast ${amount}`,
        body: `Your roast of @${roast.targetUsername} received a tip!`,
        roastId,
        emoji: "\uD83D\uDCB0",
        timestamp: Date.now(),
        read: false,
      };
      storeInAppNotification(roast.senderFid, notif).catch(() => {});
    }

    const total = await getTotalTips(roastId);
    return NextResponse.json({ success: true, total, txHash });
  } catch (error) {
    console.error("Tip error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
