import { NextRequest, NextResponse } from "next/server";
import { createClient, Errors } from "@farcaster/quick-auth";
import { getUserProfile } from "@/lib/farcaster";
import { generateRoast } from "@/lib/ai";
import { checkRateLimit } from "@/lib/db";
import type { RoastStyle } from "@/lib/types";

const quickAuthClient = createClient();

export async function POST(request: NextRequest) {
  try {
    // Auth
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

    // Rate limit
    const allowed = await checkRateLimit(senderFid);
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Max 10 roasts per hour." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { targetFid, roastStyle, isSelfRoast } = body as {
      targetFid: number;
      roastStyle?: RoastStyle;
      isSelfRoast?: boolean;
    };

    if (!targetFid) {
      return NextResponse.json(
        { error: "targetFid required" },
        { status: 400 }
      );
    }

    // Fetch profile and generate roast
    const profile = await getUserProfile(targetFid);
    const roastText = await generateRoast(
      profile,
      roastStyle ?? "savage",
      isSelfRoast ?? false
    );

    return NextResponse.json({
      roastText,
      profileData: {
        username: profile.username,
        displayName: profile.displayName,
        bio: profile.bio,
        pfpUrl: profile.pfpUrl,
        recentCasts: profile.recentCasts.slice(0, 3),
      },
    });
  } catch (error) {
    console.error("Generate roast error:", error);
    return NextResponse.json(
      { error: "Failed to generate roast" },
      { status: 500 }
    );
  }
}
