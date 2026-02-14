"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { RoastCard } from "./RoastCard";
import { SkeletonCard } from "./SkeletonCard";
import { ConfettiBurst } from "./ConfettiBurst";
import { haptics } from "@/lib/haptics";
import { useToast } from "./Toast";
import type { Roast, ReactionType } from "@/lib/types";
import Link from "next/link";

interface RoastFeedProps {
  mode?: "recent" | "trending";
  styleFilter?: string | null;
}

function SwipeableCard({
  children,
  onSwipeRight,
  onSwipeLeft,
}: {
  children: React.ReactNode;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
}) {
  const [offsetX, setOffsetX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontal = useRef<boolean | null>(null);

  if (dismissed) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHorizontal.current = null;
    setSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swiping) return;
    const deltaX = e.touches[0].clientX - startX.current;
    const deltaY = e.touches[0].clientY - startY.current;

    // Determine direction on first significant move
    if (isHorizontal.current === null && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
      isHorizontal.current = Math.abs(deltaX) > Math.abs(deltaY) * 1.5;
    }

    if (isHorizontal.current) {
      setOffsetX(deltaX);
    }
  };

  const handleTouchEnd = () => {
    setSwiping(false);
    isHorizontal.current = null;

    if (offsetX > 120) {
      haptics.success();
      setDismissed(true);
      onSwipeRight();
    } else if (offsetX < -120) {
      haptics.tap();
      setDismissed(true);
      onSwipeLeft();
    } else {
      setOffsetX(0);
    }
  };

  const opacity = 1 - Math.min(Math.abs(offsetX) / 300, 0.6);
  const rotation = offsetX * 0.05;

  return (
    <div
      className="relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe hint indicators */}
      {Math.abs(offsetX) > 40 && (
        <>
          {offsetX < -40 && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-sm font-semibold text-red-400 opacity-70">
              Skip
            </div>
          )}
          {offsetX > 40 && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-2xl">
              {"\uD83D\uDD25"}
            </div>
          )}
        </>
      )}

      <div
        style={{
          transform: offsetX !== 0 ? `translateX(${offsetX}px) rotate(${rotation}deg)` : undefined,
          opacity,
          transition: swiping ? "none" : "transform 0.2s ease-out, opacity 0.2s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function RoastFeed({ mode = "recent", styleFilter = null }: RoastFeedProps) {
  const { showToast } = useToast();
  const [roasts, setRoasts] = useState<Roast[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentFid, setCurrentFid] = useState<number>();
  const [showConfetti, setShowConfetti] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const init = async () => {
      try {
        const ctx = await sdk.context;
        setCurrentFid(ctx.user.fid);
      } catch {
        // Expected outside mini app context
      }
    };
    init();
  }, []);

  const buildUrl = useCallback(
    (offset: number, limit: number) => {
      if (mode === "trending") {
        return `/api/roasts/trending?limit=${limit}`;
      }
      const params = new URLSearchParams({
        offset: String(offset),
        limit: String(limit),
      });
      if (styleFilter) params.set("style", styleFilter);
      return `/api/roasts?${params}`;
    },
    [mode, styleFilter]
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(buildUrl(0, 20));
        const data = await res.json();
        if (!cancelled) {
          setRoasts(data.roasts ?? []);
          setHasMore((data.roasts ?? []).length >= 20);
        }
      } catch (err) {
        console.warn("Failed to load roasts:", err);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [buildUrl]);

  const loadMore = async () => {
    if (loadingMore || !hasMore || mode === "trending") return;
    setLoadingMore(true);
    try {
      const res = await fetch(buildUrl(roasts.length, 20));
      const data = await res.json();
      const newRoasts = data.roasts ?? [];
      setRoasts((prev) => [...prev, ...newRoasts]);
      setHasMore(newRoasts.length >= 20);
    } catch (err) {
      console.warn("Failed to load more roasts:", err);
    }
    setLoadingMore(false);
  };

  const handleReact = async (roastId: string, emoji: ReactionType) => {
    try {
      const { token } = await sdk.quickAuth.getToken();
      const res = await fetch("/api/react", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roastId, emoji }),
      });
      const data = await res.json();
      // Check for new achievements
      if (data.newAchievements?.length > 0) {
        setShowConfetti(true);
        showToast(`Achievement unlocked! ${data.newAchievements.join(", ")}`, "info");
        setTimeout(() => setShowConfetti(false), 2000);
      }
      // Sync to server truth
      if (data.counts) {
        setRoasts((prev) =>
          prev.map((r) =>
            r.id === roastId
              ? { ...r, reactions: data.counts, reactionCount: data.total }
              : r
          )
        );
      }
    } catch (err) {
      console.warn("React failed:", err);
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
    } catch (err) {
      console.warn("Bookmark failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard index={0} />
        <SkeletonCard index={1} />
        <SkeletonCard index={2} />
      </div>
    );
  }

  const visibleRoasts = roasts.filter((r) => !dismissedIds.has(r.id));

  if (visibleRoasts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="relative inline-block mb-4">
          <span className="text-5xl">{"\uD83D\uDD25"}</span>
          <span className="absolute -top-2 -right-3 text-2xl animate-bounce">{"\u2728"}</span>
          <span className="absolute -bottom-1 -left-3 text-xl opacity-60">{"\uD83D\uDCAB"}</span>
        </div>
        <p className="text-orange-200/60 text-sm mb-4">
          {mode === "trending"
            ? "No trending roasts yet. React to roasts to make them trend!"
            : "No roasts yet. Be the first to throw shade!"}
        </p>
        <Link
          href="/roast"
          className="inline-block px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 text-sm font-semibold hover:from-orange-500 hover:to-red-500 transition-all"
        >
          Start Roasting
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ConfettiBurst trigger={showConfetti} />
      {visibleRoasts.map((roast, i) => (
        <SwipeableCard
          key={roast.id}
          onSwipeRight={() => {
            handleReact(roast.id, "fire");
          }}
          onSwipeLeft={() => {
            setDismissedIds((prev) => new Set(prev).add(roast.id));
          }}
        >
          <div
            className="animate-fade-in-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <RoastCard
              roast={roast}
              onReact={handleReact}
              onBookmark={handleBookmark}
              currentFid={currentFid}
            />
          </div>
        </SwipeableCard>
      ))}

      {hasMore && mode !== "trending" && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="w-full py-3 rounded-xl border border-orange-900/30 text-orange-300 text-sm hover:bg-orange-900/20 transition-colors disabled:opacity-50"
        >
          {loadingMore ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
}
