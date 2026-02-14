import { Redis } from "@upstash/redis";
import { validateEnv } from "./env";
import type { Roast, NotificationDetails, UserProfile, UserStats, ReactionType, ReactionCounts, InAppNotification, RoastNFTMint } from "./types";

validateEnv();

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

const ROAST_TTL = 7776000; // 90 days in seconds
const NOTIF_TTL = 604800; // 7 days in seconds

// ─── Normalize ────────────────────────────────────────────

const EMPTY_REACTIONS: ReactionCounts = { fire: 0, skull: 0, ice: 0, clown: 0 };

export function normalizeRoast(raw: Roast): Roast {
  if (!raw) return raw;
  // Old roasts have likes but no reactions — synthesize
  if (raw.reactions === undefined || raw.reactions === null) {
    return {
      ...raw,
      reactions: { fire: raw.likes ?? 0, skull: 0, ice: 0, clown: 0 },
      reactionCount: raw.likes ?? 0,
    };
  }
  // Ensure reactionCount is set
  if (raw.reactionCount === undefined) {
    const rc = raw.reactions;
    raw.reactionCount = (rc.fire ?? 0) + (rc.skull ?? 0) + (rc.ice ?? 0) + (rc.clown ?? 0);
  }
  return raw;
}

// ─── Roasts ─────────────────────────────────────────────────

export async function saveRoast(roast: Roast) {
  await Promise.all([
    redis.set(`roast:${roast.id}`, JSON.stringify(roast), { ex: ROAST_TTL }),
    redis.zadd("roasts:all", {
      score: roast.timestamp,
      member: roast.id,
    }),
    redis.lpush(`sent:${roast.senderFid}`, roast.id),
    redis.lpush(`inbox:${roast.targetFid}`, roast.id),
    // Update stats
    redis.hincrby(`stats:${roast.senderFid}`, "sent", 1),
    redis.hincrby(`stats:${roast.targetFid}`, "received", 1),
    // Update leaderboards (all-time)
    redis.zincrby("leaderboard:biggest-roaster", 1, String(roast.senderFid)),
    redis.zincrby("leaderboard:most-roasted", 1, String(roast.targetFid)),
    // Daily leaderboards
    redis.zincrby("leaderboard:daily:biggest-roaster", 1, String(roast.senderFid)),
    redis.zincrby("leaderboard:daily:most-roasted", 1, String(roast.targetFid)),
    // Weekly leaderboards
    redis.zincrby("leaderboard:weekly:biggest-roaster", 1, String(roast.senderFid)),
    redis.zincrby("leaderboard:weekly:most-roasted", 1, String(roast.targetFid)),
    // If roast-back, add to chain
    roast.parentRoastId
      ? redis.lpush(`chain:${roast.parentRoastId}`, roast.id)
      : Promise.resolve(),
    // Style index
    roast.style
      ? redis.zadd(`roasts:style:${roast.style}`, { score: roast.timestamp, member: roast.id })
      : Promise.resolve(),
  ]);

  // Set TTLs on daily/weekly leaderboards (idempotent)
  await Promise.all([
    redis.expire("leaderboard:daily:biggest-roaster", 86400),
    redis.expire("leaderboard:daily:most-roasted", 86400),
    redis.expire("leaderboard:weekly:biggest-roaster", 604800),
    redis.expire("leaderboard:weekly:most-roasted", 604800),
  ]);
}

export async function getRoast(id: string): Promise<Roast | null> {
  const data = await redis.get<string>(`roast:${id}`);
  if (!data) return null;
  const raw = typeof data === "string" ? JSON.parse(data) : data;
  return normalizeRoast(raw);
}

export async function getRecentRoasts(
  offset = 0,
  limit = 20
): Promise<Roast[]> {
  const ids = await redis.zrange("roasts:all", offset, offset + limit - 1, {
    rev: true,
  });
  if (!ids.length) return [];

  const roasts = await Promise.all(
    ids.map((id) => getRoast(id as string))
  );
  return roasts.filter(Boolean) as Roast[];
}

export async function getSentRoasts(fid: number): Promise<Roast[]> {
  const ids = await redis.lrange(`sent:${fid}`, 0, 49);
  if (!ids.length) return [];

  const roasts = await Promise.all(
    ids.map((id) => getRoast(id as string))
  );
  return roasts.filter(Boolean) as Roast[];
}

export async function getInboxRoasts(fid: number): Promise<Roast[]> {
  const ids = await redis.lrange(`inbox:${fid}`, 0, 49);
  if (!ids.length) return [];

  const roasts = await Promise.all(
    ids.map((id) => getRoast(id as string))
  );
  return roasts.filter(Boolean) as Roast[];
}

export async function getRoastChain(roastId: string): Promise<Roast[]> {
  const childIds = await redis.lrange(`chain:${roastId}`, 0, 49);
  if (!childIds.length) return [];

  const roasts = await Promise.all(
    childIds.map((id) => getRoast(id as string))
  );
  return roasts.filter(Boolean) as Roast[];
}

export async function getRoastsByStyle(
  style: string,
  offset = 0,
  limit = 20
): Promise<Roast[]> {
  const ids = await redis.zrange(`roasts:style:${style}`, offset, offset + limit - 1, {
    rev: true,
  });
  if (!ids.length) return [];
  const roasts = await Promise.all(ids.map((id) => getRoast(id as string)));
  return roasts.filter(Boolean) as Roast[];
}

// ─── Reactions ──────────────────────────────────────────────

export async function addReaction(
  roastId: string,
  emoji: ReactionType,
  fid: number
): Promise<{ counts: ReactionCounts; total: number; userReactions: ReactionType[] }> {
  // Toggle: if already reacted, remove it
  const key = `reactions:${roastId}:${emoji}`;
  const isMember = await redis.sismember(key, String(fid));

  const roast = await getRoast(roastId);
  if (!roast) {
    return { counts: { ...EMPTY_REACTIONS }, total: 0, userReactions: [] };
  }

  if (isMember) {
    // Remove reaction
    await redis.srem(key, String(fid));
    roast.reactions[emoji] = Math.max(0, (roast.reactions[emoji] ?? 0) - 1);
    roast.reactionCount = Math.max(0, (roast.reactionCount ?? 0) - 1);
  } else {
    // Add reaction
    await redis.sadd(key, String(fid));
    roast.reactions[emoji] = (roast.reactions[emoji] ?? 0) + 1;
    roast.reactionCount = (roast.reactionCount ?? 0) + 1;

    // Update stats & leaderboards for the roast sender
    await Promise.all([
      redis.hincrby(`stats:${roast.senderFid}`, "reactions", 1),
      redis.zincrby("leaderboard:most-reactions", 1, String(roast.senderFid)),
      redis.zincrby("leaderboard:daily:most-reactions", 1, String(roast.senderFid)),
      redis.zincrby("leaderboard:weekly:most-reactions", 1, String(roast.senderFid)),
      // Trending
      redis.zincrby("trending:24h", 1, roastId),
    ]);
    // Set TTLs
    await Promise.all([
      redis.expire("trending:24h", 86400),
      redis.expire("leaderboard:daily:most-reactions", 86400),
      redis.expire("leaderboard:weekly:most-reactions", 604800),
    ]);
  }

  // Save updated roast
  await redis.set(`roast:${roastId}`, JSON.stringify(roast), { ex: ROAST_TTL });

  const userReactions = await getUserReactions(roastId, fid);
  return { counts: roast.reactions, total: roast.reactionCount, userReactions };
}

export async function getReactionCounts(roastId: string): Promise<ReactionCounts> {
  const [fire, skull, ice, clown] = await Promise.all([
    redis.scard(`reactions:${roastId}:fire`),
    redis.scard(`reactions:${roastId}:skull`),
    redis.scard(`reactions:${roastId}:ice`),
    redis.scard(`reactions:${roastId}:clown`),
  ]);
  return { fire, skull, ice, clown };
}

export async function getUserReactions(roastId: string, fid: number): Promise<ReactionType[]> {
  const [fire, skull, ice, clown] = await Promise.all([
    redis.sismember(`reactions:${roastId}:fire`, String(fid)),
    redis.sismember(`reactions:${roastId}:skull`, String(fid)),
    redis.sismember(`reactions:${roastId}:ice`, String(fid)),
    redis.sismember(`reactions:${roastId}:clown`, String(fid)),
  ]);
  const result: ReactionType[] = [];
  if (fire) result.push("fire");
  if (skull) result.push("skull");
  if (ice) result.push("ice");
  if (clown) result.push("clown");
  return result;
}

// Keep likeRoast for backwards compat — delegates to addReaction("fire")
export async function likeRoast(
  roastId: string,
  fid: number
): Promise<number> {
  const result = await addReaction(roastId, "fire", fid);
  return result.total;
}

// ─── Reaction Rate Limiting ─────────────────────────────────

export async function checkReactionRateLimit(fid: number): Promise<boolean> {
  const key = `ratelimit:react:${fid}`;
  const count = await redis.incr(key);
  await redis.expire(key, 3600);
  return count <= 100;
}

// ─── Trending ───────────────────────────────────────────────

export async function getTrendingRoasts(limit = 20): Promise<Roast[]> {
  let ids = await redis.zrange("trending:24h", 0, limit - 1, { rev: true });

  // Fallback: get recent roasts sorted by reactionCount
  if (!ids.length) {
    return getRecentRoasts(0, limit);
  }

  const roasts = await Promise.all(ids.map((id) => getRoast(id as string)));
  return roasts.filter(Boolean) as Roast[];
}

// ─── Bookmarks ──────────────────────────────────────────────

export async function toggleBookmark(fid: number, roastId: string): Promise<boolean> {
  const key = `bookmarks:${fid}`;
  const isMember = await redis.sismember(key, roastId);
  if (isMember) {
    await redis.srem(key, roastId);
    return false; // unbookmarked
  } else {
    await redis.sadd(key, roastId);
    return true; // bookmarked
  }
}

export async function getBookmarks(fid: number): Promise<Roast[]> {
  const ids = await redis.smembers(`bookmarks:${fid}`);
  if (!ids.length) return [];
  const roasts = await Promise.all(ids.map((id) => getRoast(id as string)));
  return roasts.filter(Boolean) as Roast[];
}

export async function isBookmarked(fid: number, roastId: string): Promise<boolean> {
  return !!(await redis.sismember(`bookmarks:${fid}`, roastId));
}

// ─── Achievements ───────────────────────────────────────────

export async function getAchievements(fid: number): Promise<string[]> {
  return redis.smembers(`achievements:${fid}`);
}

export async function awardAchievement(fid: number, id: string): Promise<boolean> {
  const added = await redis.sadd(`achievements:${fid}`, id);
  return added === 1;
}

// ─── In-App Notifications ───────────────────────────────────

export async function storeInAppNotification(fid: number, notif: InAppNotification) {
  const key = `notifications:${fid}`;
  await redis.lpush(key, JSON.stringify(notif));
  await redis.ltrim(key, 0, 49); // max 50
  await redis.incr(`notifications:unread:${fid}`);
}

export async function getNotifications(fid: number): Promise<InAppNotification[]> {
  const raw = await redis.lrange(`notifications:${fid}`, 0, 49);
  return raw.map((item) => {
    if (typeof item === "string") return JSON.parse(item);
    return item as unknown as InAppNotification;
  });
}

export async function markNotificationsRead(fid: number) {
  await redis.set(`notifications:unread:${fid}`, "0");
}

export async function getUnreadCount(fid: number): Promise<number> {
  const val = await redis.get(`notifications:unread:${fid}`);
  return Number(val ?? 0);
}

// ─── User Stats ─────────────────────────────────────────────

export async function getUserStats(fid: number): Promise<UserStats> {
  const data = await redis.hgetall(`stats:${fid}`);
  return {
    sent: Number(data?.sent ?? 0),
    received: Number(data?.received ?? 0),
    likes: Number(data?.likes ?? 0),
    reactions: Number(data?.reactions ?? data?.likes ?? 0),
  };
}

// ─── Leaderboard ────────────────────────────────────────────

export async function getLeaderboard(
  type: "most-roasted" | "biggest-roaster" | "most-liked" | "most-reactions",
  limit = 20,
  period: "all" | "weekly" | "daily" = "all"
): Promise<Array<{ fid: number; score: number }>> {
  // Map most-liked to most-reactions for new system
  const resolvedType = type === "most-liked" ? "most-reactions" : type;
  const key = period === "all"
    ? `leaderboard:${resolvedType}`
    : `leaderboard:${period}:${resolvedType}`;

  const results = await redis.zrange(key, 0, limit - 1, {
    rev: true,
    withScores: true,
  });

  const entries: Array<{ fid: number; score: number }> = [];
  for (let i = 0; i < results.length; i += 2) {
    entries.push({
      fid: Number(results[i]),
      score: Number(results[i + 1]),
    });
  }
  return entries;
}

// ─── Battles ────────────────────────────────────────────────

export async function updateBattleIndex(roast: Roast) {
  if (!roast.parentRoastId) return;

  // Walk chain to find root
  let rootId = roast.parentRoastId;
  let parent = await getRoast(rootId);
  while (parent?.parentRoastId) {
    rootId = parent.parentRoastId;
    parent = await getRoast(rootId);
  }

  // Get root roast
  const root = await getRoast(rootId);
  if (!root) return;

  // Get chain
  const chainRoasts = await getRoastChain(rootId);
  const allRoasts = [root, ...chainRoasts];

  // Collect unique participants
  const participants = new Set<number>();
  for (const r of allRoasts) {
    participants.add(r.senderFid);
  }

  // Only create battle if exactly 2 participants and chain has 2+ back-and-forths
  if (participants.size !== 2 || allRoasts.length < 3) return;

  const fids = [...participants];
  const chainLength = allRoasts.length;
  const totalReactions = allRoasts.reduce((sum, r) => sum + (r.reactionCount ?? r.likes ?? 0), 0);
  const score = chainLength * 10 + totalReactions;

  await Promise.all([
    redis.zadd("battles", { score, member: rootId }),
    redis.hset(`battle:${rootId}`, {
      user1Fid: String(fids[0]),
      user2Fid: String(fids[1]),
      chainLength: String(chainLength),
      totalReactions: String(totalReactions),
    }),
  ]);
}

export async function getBattles(limit = 20): Promise<Array<{
  rootRoastId: string;
  user1Fid: number;
  user2Fid: number;
  chainLength: number;
  totalReactions: number;
}>> {
  const ids = await redis.zrange("battles", 0, limit - 1, { rev: true });
  if (!ids.length) return [];

  const results = await Promise.all(
    ids.map(async (id) => {
      const meta = await redis.hgetall(`battle:${id}`);
      if (!meta) return null;
      return {
        rootRoastId: id as string,
        user1Fid: Number(meta.user1Fid),
        user2Fid: Number(meta.user2Fid),
        chainLength: Number(meta.chainLength),
        totalReactions: Number(meta.totalReactions),
      };
    })
  );
  return results.filter(Boolean) as Array<{
    rootRoastId: string;
    user1Fid: number;
    user2Fid: number;
    chainLength: number;
    totalReactions: number;
  }>;
}

// ─── Profile Cache ──────────────────────────────────────────

export async function cacheProfile(fid: number, profile: UserProfile) {
  await redis.set(`profile:${fid}`, JSON.stringify(profile), { ex: 3600 });
}

export async function getCachedProfile(
  fid: number
): Promise<UserProfile | null> {
  const data = await redis.get<string>(`profile:${fid}`);
  if (!data) return null;
  return typeof data === "string" ? JSON.parse(data) : data;
}

// ─── Rate Limiting ──────────────────────────────────────────

export async function checkRateLimit(fid: number): Promise<boolean> {
  const key = `ratelimit:generate:${fid}`;
  const count = await redis.incr(key);
  // Always set expire to avoid orphaned keys (idempotent)
  await redis.expire(key, 3600);
  return count <= 10;
}

export async function checkPostRateLimit(fid: number): Promise<boolean> {
  const key = `ratelimit:post:${fid}`;
  const count = await redis.incr(key);
  await redis.expire(key, 3600);
  return count <= 20; // max 20 posts per hour
}

// ─── Notification Tokens ────────────────────────────────────

export async function saveNotificationToken(
  fid: number,
  appFid: number,
  details: NotificationDetails
) {
  await redis.set(`notif:${fid}:${appFid}`, JSON.stringify(details), { ex: NOTIF_TTL });
}

export async function getNotificationToken(
  fid: number,
  appFid: number
): Promise<NotificationDetails | null> {
  const data = await redis.get<string>(`notif:${fid}:${appFid}`);
  if (!data) return null;
  return typeof data === "string" ? JSON.parse(data) : data;
}

export async function deleteNotificationToken(fid: number, appFid: number) {
  await redis.del(`notif:${fid}:${appFid}`);
}

// ─── Tips ─────────────────────────────────────────────────

export async function recordTip(
  roastId: string,
  senderFid: number,
  recipientFid: number,
  amount: string
) {
  await Promise.all([
    redis.incrbyfloat(`tips:total:${roastId}`, parseFloat(amount)),
    redis.incrbyfloat(`tips:received:${recipientFid}`, parseFloat(amount)),
    redis.incrbyfloat(`tips:sent:${senderFid}`, parseFloat(amount)),
  ]);
}

export async function getTotalTips(roastId: string): Promise<number> {
  const val = await redis.get(`tips:total:${roastId}`);
  return Number(val ?? 0);
}

export async function getUserTipsReceived(fid: number): Promise<number> {
  const val = await redis.get(`tips:received:${fid}`);
  return Number(val ?? 0);
}

// ─── NFT Mints ───────────────────────────────────────────

export async function saveNFTMint(mint: RoastNFTMint) {
  await redis.set(`roast:nft:${mint.roastId}`, JSON.stringify(mint));
}

export async function getNFTMint(roastId: string): Promise<RoastNFTMint | null> {
  const data = await redis.get<string>(`roast:nft:${roastId}`);
  if (!data) return null;
  return typeof data === "string" ? JSON.parse(data) : data;
}

// ─── Transaction Hash Tracking ──────────────────────────

export async function isTransactionUsed(txHash: string): Promise<boolean> {
  return !!(await redis.sismember("used-tx-hashes", txHash));
}

export async function markTransactionUsed(txHash: string): Promise<void> {
  await redis.sadd("used-tx-hashes", txHash);
}

// ─── Streaks ────────────────────────────────────────────

export async function updateStreak(fid: number): Promise<{ current: number; longest: number }> {
  const key = `streak:${fid}`;
  const data = await redis.hgetall(key);

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
  const lastDate = (data?.lastDate as string) || "";
  let current = Number(data?.current ?? 0);
  let longest = Number(data?.longest ?? 0);

  if (lastDate === today) {
    return { current, longest };
  }

  // Check if lastDate was yesterday
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (lastDate === yesterday) {
    current += 1;
  } else {
    current = 1;
  }

  if (current > longest) {
    longest = current;
  }

  await redis.hset(key, { current: String(current), longest: String(longest), lastDate: today });
  return { current, longest };
}

export async function getStreak(fid: number): Promise<{ current: number; longest: number }> {
  const data = await redis.hgetall(`streak:${fid}`);
  if (!data || !data.lastDate) return { current: 0, longest: 0 };

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const lastDate = data.lastDate as string;

  // If lastDate is not today or yesterday, streak is broken
  if (lastDate !== today && lastDate !== yesterday) {
    return { current: 0, longest: Number(data.longest ?? 0) };
  }

  return { current: Number(data.current ?? 0), longest: Number(data.longest ?? 0) };
}

// ─── Challenge ───────────────────────────────────────────

export { redis as redisClient };
