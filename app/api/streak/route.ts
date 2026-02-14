import { NextRequest, NextResponse } from "next/server";
import { createClient, Errors } from "@farcaster/quick-auth";
import { getStreak } from "@/lib/db";

const quickAuthClient = createClient();

export async function GET(request: NextRequest) {
  // Require auth to prevent scraping
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    // Allow unauthenticated access with fid param for profile pages
    // but still require the fid param
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get("fid");
    if (!fid) {
      return NextResponse.json({ error: "fid required" }, { status: 400 });
    }
    const streak = await getStreak(Number(fid));
    return NextResponse.json(streak);
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

  const streak = await getStreak(Number(fid));
  return NextResponse.json(streak);
}
