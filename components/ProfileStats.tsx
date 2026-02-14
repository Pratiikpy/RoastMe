"use client";

import { useState, useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { RoastCard } from "./RoastCard";
import { AchievementBadges } from "./AchievementBadges";
import { SkeletonCard } from "./SkeletonCard";
import { StreakBadge } from "./StreakBadge";
import { formatNumber } from "@/lib/utils";
import type { Roast, UserStats, ReactionType } from "@/lib/types";
import Link from "next/link";

interface ProfileStatsProps {
  fid: number;
}

export function ProfileStats({ fid }: ProfileStatsProps) {
  const [stats, setStats] = useState<UserStats>({ sent: 0, received: 0, likes: 0, reactions: 0 });
  const [streak, setStreak] = useState<{ current: number; longest: number }>({ current: 0, longest: 0 });
  const [sentRoasts, setSentRoasts] = useState<Roast[]>([]);
  const [inboxRoasts, setInboxRoasts] = useState<Roast[]>([]);
  const [savedRoasts, setSavedRoasts] = useState<Roast[]>([]);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"sent" | "received" | "saved">("sent");

  useEffect(() => {
    async function load() {
      try {
        const { token } = await sdk.quickAuth.getToken();
        const [sentRes, inboxRes, bookmarkRes, streakRes] = await Promise.all([
          fetch(`/api/roasts/sent?fid=${fid}`),
          fetch(`/api/roasts/inbox?fid=${fid}`),
          fetch("/api/bookmark", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/streak?fid=${fid}`),
        ]);
        const sentData = await sentRes.json();
        const inboxData = await inboxRes.json();
        const bookmarkData = await bookmarkRes.json();
        const streakData = await streakRes.json();
        setStreak(streakData);

        const sent: Roast[] = sentData.roasts ?? [];
        const received: Roast[] = inboxData.roasts ?? [];
        const saved: Roast[] = bookmarkData.roasts ?? [];

        setSentRoasts(sent);
        setInboxRoasts(received);
        setSavedRoasts(saved);

        const totalReactions = sent.reduce(
          (acc: number, r: Roast) => acc + (r.reactionCount ?? r.likes ?? 0),
          0
        );
        setStats({
          sent: sent.length,
          received: received.length,
          likes: totalReactions,
          reactions: totalReactions,
        });

        // Load achievements
        setAchievements([]); // Will be loaded from a separate call if available
      } catch {
        // ignore
      }
      setLoading(false);
    }
    load();
  }, [fid]);

  const handleReact = async (roastId: string, emoji: ReactionType) => {
    try {
      const { token } = await sdk.quickAuth.getToken();
      await fetch("/api/react", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roastId, emoji }),
      });
    } catch {
      // ignore
    }
  };

  const handleBookmark = async (roastId: string) => {
    try {
      const { token } = await sdk.quickAuth.getToken();
      await fetch("/api/bookmark", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roastId }),
      });
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-20 rounded-xl skeleton-shimmer animate-fade-in-up"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
        <SkeletonCard index={0} />
      </div>
    );
  }

  // Find most reacted roast
  const bestRoast = sentRoasts.length > 0
    ? sentRoasts.reduce((best, r) => ((r.reactionCount ?? r.likes ?? 0) > (best.reactionCount ?? best.likes ?? 0) ? r : best))
    : null;

  const roastRatioSent = stats.sent + stats.received > 0
    ? Math.round((stats.sent / (stats.sent + stats.received)) * 100)
    : 50;

  return (
    <div className="space-y-5">
      {/* Achievement badges */}
      {achievements.length > 0 && (
        <AchievementBadges earned={achievements} />
      )}

      {/* Streak badge */}
      {streak.current > 0 && (
        <div className="flex justify-center">
          <StreakBadge streak={streak.current} />
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-xl bg-[var(--surface-raised)] border border-[var(--border-subtle)] p-3 text-center">
          <p className="text-2xl font-bold text-orange-400 font-[family-name:var(--font-display)]">
            {formatNumber(stats.sent)}
          </p>
          <p className="text-xs text-orange-200/60">Sent</p>
        </div>
        <div className="rounded-xl bg-[var(--surface-raised)] border border-[var(--border-subtle)] p-3 text-center">
          <p className="text-2xl font-bold text-red-400 font-[family-name:var(--font-display)]">
            {formatNumber(stats.received)}
          </p>
          <p className="text-xs text-orange-200/60">Received</p>
        </div>
        <div className="rounded-xl bg-[var(--surface-raised)] border border-[var(--border-subtle)] p-3 text-center">
          <p className="text-2xl font-bold text-amber-400 font-[family-name:var(--font-display)]">
            {formatNumber(stats.reactions)}
          </p>
          <p className="text-xs text-orange-200/60">Reactions</p>
        </div>
        <div className="rounded-xl bg-[var(--surface-raised)] border border-[var(--border-subtle)] p-3 text-center">
          <p className="text-2xl font-bold text-orange-300 font-[family-name:var(--font-display)] tabular-nums">
            {streak.current}<span className="text-sm text-orange-200/40">/{streak.longest}</span>
          </p>
          <p className="text-xs text-orange-200/60">Streak</p>
        </div>
      </div>

      {/* Roast ratio bar */}
      {(stats.sent > 0 || stats.received > 0) && (
        <div className="rounded-xl bg-black/40 border border-orange-900/15 p-3">
          <p className="text-xs text-orange-200/50 mb-2">Roast Ratio</p>
          <div className="flex h-2 rounded-full overflow-hidden bg-orange-900/20">
            <div
              className="bg-gradient-to-r from-orange-500 to-orange-600 transition-all"
              style={{ width: `${roastRatioSent}%` }}
            />
            <div
              className="bg-gradient-to-r from-red-600 to-red-500 transition-all"
              style={{ width: `${100 - roastRatioSent}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-orange-300">Sent {roastRatioSent}%</span>
            <span className="text-[10px] text-red-300">Received {100 - roastRatioSent}%</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("sent")}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
            tab === "sent"
              ? "bg-orange-900/40 border border-orange-600/50 text-orange-300"
              : "bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-orange-200/60"
          }`}
        >
          My Roasts ({sentRoasts.length})
        </button>
        <button
          onClick={() => setTab("received")}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
            tab === "received"
              ? "bg-orange-900/40 border border-orange-600/50 text-orange-300"
              : "bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-orange-200/60"
          }`}
        >
          Roasted By ({inboxRoasts.length})
        </button>
        <button
          onClick={() => setTab("saved")}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
            tab === "saved"
              ? "bg-orange-900/40 border border-orange-600/50 text-orange-300"
              : "bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-orange-200/60"
          }`}
        >
          Saved ({savedRoasts.length})
        </button>
      </div>

      {/* Roast list */}
      <div className="space-y-3">
        {(() => {
          const list = tab === "sent" ? sentRoasts : tab === "received" ? inboxRoasts : savedRoasts;
          if (list.length === 0) {
            return (
              <div className="text-center py-12">
                <div className="text-5xl mb-3 opacity-60">
                  {tab === "sent" ? "\uD83C\uDFA4" : tab === "received" ? "\uD83C\uDFAF" : "\uD83D\uDD16"}
                </div>
                <p className="text-orange-200/60 text-sm mb-4">
                  {tab === "sent"
                    ? "No roasts sent yet. Time to start roasting!"
                    : tab === "received"
                    ? "No one has roasted you yet. Challenge a friend!"
                    : "No saved roasts yet. Bookmark roasts to see them here!"}
                </p>
                <Link
                  href="/roast"
                  className="inline-block px-5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 text-sm font-semibold hover:from-orange-500 hover:to-red-500 transition-all"
                >
                  Start Roasting
                </Link>
              </div>
            );
          }
          return list.map((roast) => (
            <RoastCard
              key={roast.id}
              roast={roast}
              onReact={handleReact}
              onBookmark={handleBookmark}
              currentFid={fid}
            />
          ));
        })()}
      </div>
    </div>
  );
}
