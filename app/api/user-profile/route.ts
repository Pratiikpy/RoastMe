import { NextRequest, NextResponse } from "next/server";
import { createClient, Errors } from "@farcaster/quick-auth";
import { getUserProfile } from "@/lib/farcaster";

const quickAuthClient = createClient();

export async function GET(request: NextRequest) {
  // Require auth to prevent scraping and protect Neynar quota
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  const host = request.headers.get("host") ?? "localhost:3000";
  const domain = host.split(":")[0];

  try {
    await quickAuthClient.verifyJwt({ token, domain });
  } catch (e) {
    if (e instanceof Errors.InvalidTokenError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    throw e;
  }

  const { searchParams } = new URL(request.url);
  const fid = searchParams.get("fid");

  if (!fid) {
    return NextResponse.json({ error: "fid required" }, { status: 400 });
  }

  try {
    const user = await getUserProfile(Number(fid));
    return NextResponse.json({ user });
  } catch (error) {
    console.error("User profile error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
