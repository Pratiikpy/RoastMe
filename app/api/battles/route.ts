import { NextRequest, NextResponse } from "next/server";
import { getBattles } from "@/lib/db";

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY ?? "";
const NEYNAR_BASE = "https://api.neynar.com/v2/farcaster";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "20");

  try {
    const battles = await getBattles(limit);

    // Enrich with user data
    const allFids = new Set<number>();
    for (const b of battles) {
      allFids.add(b.user1Fid);
      allFids.add(b.user2Fid);
    }

    let userMap: Record<number, { username: string; pfpUrl: string }> = {};
    const fids = [...allFids];

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
        // fallback
      }
    }

    const enriched = battles.map((b) => ({
      ...b,
      user1Username: userMap[b.user1Fid]?.username ?? `fid:${b.user1Fid}`,
      user1PfpUrl: userMap[b.user1Fid]?.pfpUrl ?? "",
      user2Username: userMap[b.user2Fid]?.username ?? `fid:${b.user2Fid}`,
      user2PfpUrl: userMap[b.user2Fid]?.pfpUrl ?? "",
    }));

    return NextResponse.json({ battles: enriched });
  } catch (error) {
    console.error("Battles error:", error);
    return NextResponse.json({ error: "Failed to fetch battles" }, { status: 500 });
  }
}
