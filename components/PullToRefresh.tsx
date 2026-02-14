"use client";

import { useState, useRef, useCallback } from "react";
import { haptics } from "@/lib/haptics";
import type { ReactNode, TouchEvent } from "react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const threshold = 80;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!pulling) return;
      const diff = e.touches[0].clientY - startY.current;
      if (diff > 0) {
        setPullDistance(Math.min(diff * 0.5, 120));
      }
    },
    [pulling]
  );

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !refreshing) {
      haptics.soft();
      setRefreshing(true);
      try {
        await onRefresh();
      } catch {
        // ignore
      }
      setRefreshing(false);
    }
    setPulling(false);
    setPullDistance(0);
  }, [pullDistance, refreshing, onRefresh]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      {(pullDistance > 0 || refreshing) && (
        <div
          className="flex justify-center items-center overflow-hidden transition-all"
          style={{ height: refreshing ? 40 : pullDistance }}
        >
          <span
            className={`text-xl ${refreshing ? "animate-spin" : ""}`}
            style={{
              transform: `rotate(${pullDistance * 3}deg)`,
              opacity: Math.min(pullDistance / threshold, 1),
            }}
          >
            {"\uD83D\uDD25"}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}
