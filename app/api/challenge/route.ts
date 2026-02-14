import { NextRequest, NextResponse } from "next/server";
import { createClient, Errors } from "@farcaster/quick-auth";
import {
  getCurrentChallenge,
  getChallengeSubmissions,
  getVoteCount,
  getPreviousWinner,
  submitToChallenge,
  hasUserVoted,
} from "@/lib/challenge";
import { getRoast } from "@/lib/db";

const quickAuthClient = createClient();

export async function GET() {
  const challenge = await getCurrentChallenge();
  const previousWinner = await getPreviousWinner();

  if (!challenge) {
    return NextResponse.json({
      challenge: null,
      submissions: [],
      previousWinner: previousWinner
        ? await getRoast(previousWinner)
        : null,
    });
  }

  const submissionIds = await getChallengeSubmissions();
  const submissions = await Promise.all(
    submissionIds.slice(0, 50).map(async (id) => {
      const roast = await getRoast(id);
      if (!roast) return null;
      const votes = await getVoteCount(id);
      return { roast, votes };
    })
  );

  return NextResponse.json({
    challenge,
    submissions: submissions.filter(Boolean),
    previousWinner: previousWinner ? await getRoast(previousWinner) : null,
  });
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

    try {
      await quickAuthClient.verifyJwt({ token, domain });
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

    await submitToChallenge(roastId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Challenge submit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
