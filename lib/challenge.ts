import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;

function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return _redis;
}

const redis = new Proxy({} as Redis, {
  get(_, prop) {
    return (getRedis() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

const DAY_TTL = 86400;

export interface Challenge {
  targetFid: number;
  targetUsername: string;
  targetPfp: string;
  startedAt: number;
  expiresAt: number;
}

export interface ChallengeSubmission {
  roastId: string;
  votes: number;
}

export async function getCurrentChallenge(): Promise<Challenge | null> {
  const data = await redis.hgetall("challenge:current");
  if (!data || !data.targetFid) return null;
  return {
    targetFid: Number(data.targetFid),
    targetUsername: String(data.targetUsername),
    targetPfp: String(data.targetPfp),
    startedAt: Number(data.startedAt),
    expiresAt: Number(data.expiresAt),
  };
}

export async function setCurrentChallenge(challenge: Challenge) {
  await redis.hset("challenge:current", {
    targetFid: String(challenge.targetFid),
    targetUsername: challenge.targetUsername,
    targetPfp: challenge.targetPfp,
    startedAt: String(challenge.startedAt),
    expiresAt: String(challenge.expiresAt),
  });
  await redis.expire("challenge:current", DAY_TTL);
}

export async function submitToChallenge(roastId: string) {
  await redis.zadd("challenge:submissions", {
    score: Date.now(),
    member: roastId,
  });
  await redis.expire("challenge:submissions", DAY_TTL);
}

export async function getChallengeSubmissions(): Promise<string[]> {
  return (await redis.zrange("challenge:submissions", 0, -1, { rev: true })) as string[];
}

export async function voteForSubmission(roastId: string, voterFid: number): Promise<boolean> {
  // Check if already voted today
  const alreadyVoted = await redis.sismember("challenge:voters", String(voterFid));
  if (alreadyVoted) return false;

  await redis.sadd(`challenge:votes:${roastId}`, String(voterFid));
  await redis.sadd("challenge:voters", String(voterFid));
  await redis.expire(`challenge:votes:${roastId}`, DAY_TTL);
  await redis.expire("challenge:voters", DAY_TTL);
  return true;
}

export async function getVoteCount(roastId: string): Promise<number> {
  return redis.scard(`challenge:votes:${roastId}`);
}

export async function hasUserVoted(fid: number): Promise<boolean> {
  return !!(await redis.sismember("challenge:voters", String(fid)));
}

export async function getPreviousWinner(): Promise<string | null> {
  return redis.get("challenge:winner");
}

export async function resolveChallenge(): Promise<string | null> {
  const submissions = await getChallengeSubmissions();
  if (submissions.length === 0) return null;

  let maxVotes = 0;
  let winnerId: string | null = null;

  for (const roastId of submissions) {
    const votes = await getVoteCount(roastId);
    if (votes > maxVotes) {
      maxVotes = votes;
      winnerId = roastId;
    }
  }

  // If no votes, pick the earliest submission
  if (!winnerId && submissions.length > 0) {
    winnerId = submissions[submissions.length - 1];
  }

  if (winnerId) {
    await redis.set("challenge:winner", winnerId);
  }

  // Save to history
  const challenge = await getCurrentChallenge();
  if (challenge) {
    const dateKey = new Date().toISOString().split("T")[0];
    await redis.hset(`challenge:history:${dateKey}`, {
      targetFid: String(challenge.targetFid),
      winnerRoastId: winnerId ?? "",
      totalSubmissions: String(submissions.length),
    });
  }

  return winnerId;
}
