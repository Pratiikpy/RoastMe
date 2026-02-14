import type { UserProfile } from "./types";
import { cacheProfile, getCachedProfile } from "./db";

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY ?? "";
const NEYNAR_BASE = "https://api.neynar.com/v2/farcaster";

async function neynarFetch(path: string) {
  const res = await fetch(`${NEYNAR_BASE}${path}`, {
    headers: {
      accept: "application/json",
      "x-api-key": NEYNAR_API_KEY,
    },
  });
  if (!res.ok) throw new Error(`Neynar API error: ${res.status}`);
  return res.json();
}

export async function searchUsers(
  query: string
): Promise<
  Array<{
    fid: number;
    username: string;
    displayName: string;
    pfpUrl: string;
  }>
> {
  const data = await neynarFetch(
    `/user/search?q=${encodeURIComponent(query)}&limit=10`
  );

  return (data.result?.users ?? []).map(
    (u: {
      fid: number;
      username: string;
      display_name: string;
      pfp_url: string;
    }) => ({
      fid: u.fid,
      username: u.username,
      displayName: u.display_name,
      pfpUrl: u.pfp_url,
    })
  );
}

export async function getUserProfile(fid: number): Promise<UserProfile> {
  // Check cache first
  const cached = await getCachedProfile(fid);
  if (cached) return cached;

  // Fetch user data
  const userData = await neynarFetch(`/user/bulk?fids=${fid}`);
  const user = userData.users?.[0];
  if (!user) throw new Error(`User ${fid} not found`);

  // Fetch recent casts
  let recentCasts: string[] = [];
  try {
    const feedData = await neynarFetch(
      `/feed/user/${fid}/casts?limit=10&include_replies=false`
    );
    recentCasts = (feedData.casts ?? [])
      .map((c: { text: string }) => c.text)
      .filter((t: string) => t.length > 0)
      .slice(0, 8);
  } catch {
    // Feed fetch may fail, continue without casts
  }

  const profile: UserProfile = {
    fid: user.fid,
    username: user.username,
    displayName: user.display_name || "",
    bio: user.profile?.bio?.text || "",
    pfpUrl: user.pfp_url || "",
    followerCount: user.follower_count ?? 0,
    followingCount: user.following_count ?? 0,
    recentCasts,
  };

  // Cache for 1 hour
  await cacheProfile(fid, profile);
  return profile;
}
