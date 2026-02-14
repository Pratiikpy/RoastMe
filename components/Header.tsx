"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { SoundToggle } from "./SoundToggle";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";

interface HeaderProps {
  username?: string;
  pfpUrl?: string;
  currentFid?: number;
}

export function Header({ username, pfpUrl, currentFid }: HeaderProps) {
  const [isCompact, setIsCompact] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > 50 && currentY > lastScrollY.current) {
        setIsCompact(true);
      } else if (currentY < lastScrollY.current) {
        setIsCompact(false);
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-20 bg-[var(--header-bg)] backdrop-blur-xl transition-all duration-200">
      <div className={`max-w-lg mx-auto flex items-center justify-between px-4 transition-all duration-200 ${isCompact ? "py-1.5" : "py-3"}`}>
        <div className={`flex items-center gap-1.5 transition-all duration-200 ${isCompact ? "opacity-0 h-0 overflow-hidden" : "opacity-100"}`}>
          <span className="text-lg">{"\uD83D\uDD25"}</span>
          <span className="text-xl font-black tracking-tight bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent font-[family-name:var(--font-display)]">
            ROAST ME
          </span>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <SoundToggle />
          <NotificationBell currentFid={currentFid} />
          {username && (
            <div className="flex items-center gap-2">
              {pfpUrl && (
                <Image
                  src={pfpUrl}
                  alt={username}
                  width={isCompact ? 20 : 28}
                  height={isCompact ? 20 : 28}
                  className="rounded-full border border-orange-800/40 transition-all duration-200"
                  unoptimized
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              <span className="text-xs text-[var(--text-secondary)]">@{username}</span>
            </div>
          )}
        </div>
      </div>
      {/* Gradient fade border */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-orange-600/30 to-transparent" />
    </header>
  );
}
