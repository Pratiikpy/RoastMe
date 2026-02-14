import { NextRequest, NextResponse } from "next/server";
import { createClient, Errors } from "@farcaster/quick-auth";
import { saveNFTMint, getNFTMint } from "@/lib/db";
import type { RoastNFTMint } from "@/lib/types";

const quickAuthClient = createClient();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roastId = searchParams.get("roastId");

  if (!roastId) {
    return NextResponse.json({ error: "roastId required" }, { status: 400 });
  }

  const mint = await getNFTMint(roastId);
  return NextResponse.json({ mint });
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

    let minterFid: number;
    try {
      const payload = await quickAuthClient.verifyJwt({ token, domain });
      minterFid = Number(payload.sub);
    } catch (e) {
      if (e instanceof Errors.InvalidTokenError) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
      throw e;
    }

    const { roastId, txHash, tokenId } = await request.json();
    if (!roastId || !txHash) {
      return NextResponse.json({ error: "roastId and txHash required" }, { status: 400 });
    }

    const mint: RoastNFTMint = {
      roastId,
      tokenId: tokenId ?? "",
      txHash,
      minterFid,
      mintedAt: Date.now(),
    };

    await saveNFTMint(mint);

    return NextResponse.json({ success: true, mint });
  } catch (error) {
    console.error("Mint record error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
