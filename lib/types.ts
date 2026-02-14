import type { ThemeId, RoastStyle } from "./constants";

export type { ThemeId, RoastStyle };

export type ReactionType = "fire" | "skull" | "ice" | "clown";

export interface ReactionCounts {
  fire: number;
  skull: number;
  ice: number;
  clown: number;
}

export interface Roast {
  id: string;
  senderFid: number;
  senderUsername: string;
  senderPfp?: string;
  targetFid: number;
  targetUsername: string;
  targetDisplayName?: string;
  targetPfp?: string;
  targetBio?: string;
  roastText: string;
  theme: ThemeId;
  style?: RoastStyle;
  isSelfRoast: boolean;
  txHash: string | null;
  parentRoastId?: string;
  timestamp: number;
  likes: number;
  reactionCount: number;
  reactions: ReactionCounts;
}

export interface UserProfile {
  fid: number;
  username: string;
  displayName: string;
  bio: string;
  pfpUrl: string;
  followerCount: number;
  followingCount: number;
  recentCasts: string[];
}

export interface NotificationDetails {
  url: string;
  token: string;
}

export interface LeaderboardEntry {
  fid: number;
  username: string;
  pfpUrl: string;
  score: number;
  rank: number;
}

export interface UserStats {
  sent: number;
  received: number;
  likes: number;
  reactions: number;
}

export interface InAppNotification {
  id: string;
  type: "roast" | "roast-back" | "reaction" | "achievement" | "tip";
  title: string;
  body: string;
  roastId?: string;
  emoji?: string;
  timestamp: number;
  read: boolean;
}

export interface RoastNFTMint {
  roastId: string;
  tokenId: string;
  txHash: string;
  minterFid: number;
  mintedAt: number;
}
