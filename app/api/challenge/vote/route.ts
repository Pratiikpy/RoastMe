import { NextRequest, NextResponse } from "next/server";
import { createClient, Errors } from "@farcaster/quick-auth";
import { voteForSubmission } from "@/lib/challenge";

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

    const voted = await voteForSubmission(roastId, userFid);
    if (!voted) {
      return NextResponse.json({ error: "Already voted today" }, { status: 409 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
