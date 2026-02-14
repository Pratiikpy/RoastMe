"use client";

import { useState, useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { formatNumber } from "@/lib/utils";
import type { UserProfile } from "@/lib/types";
import Image from "next/image";

interface UserProfilePreviewProps {
  fid: number;
  onProfileLoaded?: (profile: UserProfile) => void;
}

export function UserProfilePreview({ fid, onProfileLoaded }: UserProfilePreviewProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { token } = await sdk.quickAuth.getToken();
        const res = await fetch(`/api/user-profile?fid=${fid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setProfile(data.user);
        onProfileLoaded?.(data.user);
      } catch {
        // ignore
      }
      setLoading(false);
    }
    load();
  }, [fid, onProfileLoaded]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-orange-900/30 bg-black/60 p-5 animate-pulse">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-full bg-orange-900/30" />
          <div className="space-y-2">
            <div className="h-4 w-28 rounded bg-orange-900/30" />
            <div className="h-3 w-20 rounded bg-orange-900/20" />
          </div>
        </div>
        <div className="h-3 w-full rounded bg-orange-900/20" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-2xl border border-red-900/30 bg-black/60 p-5 text-center text-red-300 text-sm">
        Could not load profile
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-orange-900/30 bg-black/60 p-5 animate-slide-up">
      <div className="flex items-center gap-3 mb-3">
        {profile.pfpUrl ? (
          <Image
            src={profile.pfpUrl}
            alt={profile.username}
            width={56}
            height={56}
            className="rounded-full border-2 border-orange-700/50"
            unoptimized
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-600 to-red-700 flex items-center justify-center text-xl font-bold">
            {profile.username[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-semibold text-orange-100">
            {profile.displayName || profile.username}
          </p>
          <p className="text-sm text-orange-200/60">@{profile.username}</p>
          <p className="text-xs text-orange-200/60 mt-0.5">
            {formatNumber(profile.followerCount)} followers · {formatNumber(profile.followingCount)} following
          </p>
        </div>
      </div>

      {profile.bio && (
        <p className="text-sm text-orange-200/70 mb-3 italic">
          &ldquo;{profile.bio}&rdquo;
        </p>
      )}

      {profile.recentCasts.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-orange-200/60 font-medium">Recent casts:</p>
          {profile.recentCasts.slice(0, 3).map((cast, i) => (
            <p key={i} className="text-xs text-orange-200/60 line-clamp-2 pl-2 border-l border-orange-900/30">
              {cast}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
