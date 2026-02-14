import { NextRequest, NextResponse } from "next/server";
import { resolveChallenge, setCurrentChallenge } from "@/lib/challenge";
import { getLeaderboard } from "@/lib/db";
import type { Challenge } from "@/lib/challenge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Resolve previous challenge
  const winnerId = await resolveChallenge();

  // Pick a new target from the most-roasted leaderboard
  const candidates = await getLeaderboard("most-roasted", 50);
  if (candidates.length === 0) {
    return NextResponse.json({
      message: "No candidates for new challenge",
      previousWinner: winnerId,
    });
  }

  // Pick a random target from the top 50
  const randomCandidate = candidates[Math.floor(Math.random() * candidates.length)];

  // Fetch user info via Neynar
  let targetUsername = `fid:${randomCandidate.fid}`;
  let targetPfp = "";

  try {
    const neynarKey = process.env.NEYNAR_API_KEY ?? "";
    const res = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${randomCandidate.fid}`,
      {
        headers: {
          accept: "application/json",
          "x-api-key": neynarKey,
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      const user = data.users?.[0];
      if (user) {
        targetUsername = user.username;
        targetPfp = user.pfp_url ?? "";
      }
    }
  } catch {
    // Use fallback
  }

  const now = Date.now();
  const newChallenge: Challenge = {
    targetFid: randomCandidate.fid,
    targetUsername,
    targetPfp,
    startedAt: now,
    expiresAt: now + 86400_000,
  };

  await setCurrentChallenge(newChallenge);

  return NextResponse.json({
    message: "Challenge reset",
    previousWinner: winnerId,
    newChallenge,
  });
}
