"use client";

import { useState } from "react";
import { ROAST_THEMES, REACTION_TYPES } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";
import { playPop } from "@/lib/sounds";
import { haptics } from "@/lib/haptics";
import type { Roast, ReactionType } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";

interface RoastCardProps {
  roast: Roast;
  full?: boolean;
  onReact?: (roastId: string, emoji: ReactionType) => void;
  onBookmark?: (roastId: string) => void;
  currentFid?: number;
  userReactions?: ReactionType[];
  bookmarked?: boolean;
  style?: React.CSSProperties;
}

export function RoastCard({
  roast,
  full = false,
  onReact,
  onBookmark,
  currentFid,
  userReactions: initialReactions = [],
  bookmarked: initialBookmarked = false,
  style: externalStyle,
}: RoastCardProps) {
  const theme = ROAST_THEMES.find((t) => t.id === roast.theme) ?? ROAST_THEMES[0];
  const [myReactions, setMyReactions] = useState<Set<ReactionType>>(new Set(initialReactions));
  const [reactionCounts, setReactionCounts] = useState(roast.reactions ?? { fire: 0, skull: 0, ice: 0, clown: 0 });
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [popEmoji, setPopEmoji] = useState<string | null>(null);

  const handleReact = (emoji: ReactionType) => {
    if (!onReact) return;
    playPop();
    haptics.tap();

    const newReactions = new Set(myReactions);
    const wasActive = newReactions.has(emoji);

    if (wasActive) {
      newReactions.delete(emoji);
      setReactionCounts((prev) => ({
        ...prev,
        [emoji]: Math.max(0, (prev[emoji] ?? 0) - 1),
      }));
    } else {
      newReactions.add(emoji);
      setReactionCounts((prev) => ({
        ...prev,
        [emoji]: (prev[emoji] ?? 0) + 1,
      }));
      setPopEmoji(emoji);
      setTimeout(() => setPopEmoji(null), 300);
    }
    setMyReactions(newReactions);
    onReact(roast.id, emoji);
  };

  const handleBookmark = () => {
    if (!onBookmark) return;
    haptics.soft();
    setIsBookmarked((prev) => !prev);
    onBookmark(roast.id);
  };

  return (
    <div className="animate-slide-up" style={externalStyle}>
      <div className="card-border-glow rounded-2xl">
        <div className="rounded-2xl bg-[var(--surface)] p-5 backdrop-blur-xl">
          {/* Target user header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              {roast.targetPfp ? (
                <Image
                  src={roast.targetPfp}
                  alt={roast.targetUsername}
                  width={40}
                  height={40}
                  className="rounded-full border-2 border-orange-800/40"
                  unoptimized
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-600 to-red-700 flex items-center justify-center text-sm font-bold">
                  {roast.targetUsername[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-orange-100">
                  {roast.targetDisplayName || `@${roast.targetUsername}`}
                </p>
                <p className="text-xs text-orange-200/60">@{roast.targetUsername}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg">{theme.emoji}</span>
              <span className="text-xs text-orange-200/60">{timeAgo(roast.timestamp)}</span>
            </div>
          </div>

          {/* Roast text */}
          <p
            className={`text-orange-50 leading-relaxed mb-3 text-[15px] ${
              full ? "" : "line-clamp-4"
            }`}
          >
            {roast.roastText}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-1 border-t border-orange-900/20">
            <div className="flex items-center gap-3">
              {/* Sender info */}
              <span className="text-xs text-orange-200/60">
                {roast.isSelfRoast ? (
                  <span className="italic">Self-roast</span>
                ) : (
                  <>
                    by{" "}
                    {roast.senderPfp && (
                      <Image
                        src={roast.senderPfp}
                        alt=""
                        width={16}
                        height={16}
                        className="rounded-full inline-block mr-1 -mt-0.5"
                        unoptimized
                      />
                    )}
                    @{roast.senderUsername}
                  </>
                )}
              </span>

              {roast.parentRoastId && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-900/30 text-red-300 border border-red-800/30">
                  Roast Back
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Bookmark */}
              {onBookmark && (
                <button
                  onClick={handleBookmark}
                  aria-label={isBookmarked ? "Remove bookmark" : "Bookmark this roast"}
                  className={`text-sm transition-all ${
                    isBookmarked ? "text-orange-400" : "text-orange-200/40 hover:text-orange-300"
                  }`}
                >
                  {isBookmarked ? "\uD83D\uDD16" : "\uD83D\uDD17"}
                </button>
              )}

              {/* View link */}
              {!full && (
                <Link
                  href={`/roast/${roast.id}`}
                  className="text-xs text-orange-400 hover:text-orange-300 transition-colors ml-1"
                >
                  View
                </Link>
              )}
            </div>
          </div>

          {/* Reaction bar */}
          {onReact && (
            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-orange-900/10">
              {REACTION_TYPES.map((r) => {
                const active = myReactions.has(r.id);
                const count = reactionCounts[r.id] ?? 0;
                return (
                  <button
                    key={r.id}
                    onClick={() => handleReact(r.id)}
                    aria-label={`React with ${r.label}`}
                    className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs transition-all ${
                      active
                        ? "bg-orange-900/40 border border-orange-600/40 scale-105"
                        : "bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-orange-800/30"
                    } ${popEmoji === r.id ? "animate-reaction-pop" : ""}`}
                  >
                    <span className="text-sm">{r.emoji}</span>
                    {count > 0 && (
                      <span className={`text-[11px] ${active ? "text-orange-300" : "text-orange-200/50"}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
