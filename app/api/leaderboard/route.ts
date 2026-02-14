import { NextRequest, NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/db";

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY ?? "";
const NEYNAR_BASE = "https://api.neynar.com/v2/farcaster";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = (searchParams.get("type") ?? "most-roasted") as
    | "most-roasted"
    | "biggest-roaster"
    | "most-liked"
    | "most-reactions";
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const period = (searchParams.get("period") ?? "all") as "all" | "weekly" | "daily";

  try {
    const rawEntries = await getLeaderboard(type, limit, period);

    // Enrich with Neynar user data
    const fids = rawEntries.map((e) => e.fid);
    let userMap: Record<number, { username: string; pfpUrl: string }> = {};

    if (fids.length > 0 && NEYNAR_API_KEY) {
      try {
        const res = await fetch(
          `${NEYNAR_BASE}/user/bulk?fids=${fids.join(",")}`,
          {
            headers: {
              accept: "application/json",
              "x-api-key": NEYNAR_API_KEY,
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          for (const u of data.users ?? []) {
            userMap[u.fid] = {
              username: u.username ?? `fid:${u.fid}`,
              pfpUrl: u.pfp_url ?? "",
            };
          }
        }
      } catch {
        // Fallback to raw FIDs if Neynar fails
      }
    }

    const entries = rawEntries.map((e) => ({
      fid: e.fid,
      score: e.score,
      username: userMap[e.fid]?.username ?? `fid:${e.fid}`,
      pfpUrl: userMap[e.fid]?.pfpUrl ?? "",
    }));

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
