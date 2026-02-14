"use client";

import { useState } from "react";
import { ROAST_STYLES } from "@/lib/constants";
import { haptics } from "@/lib/haptics";
import { RoastFeed } from "./RoastFeed";
import { BattlesFeed } from "./BattlesFeed";

type FeedMode = "recent" | "trending" | "battles";

export function FeedTabs() {
  const [mode, setMode] = useState<FeedMode>("recent");
  const [styleFilter, setStyleFilter] = useState<string | null>(null);

  const tabs: { id: FeedMode; label: string; emoji: string }[] = [
    { id: "recent", label: "Recent", emoji: "\uD83D\uDD54" },
    { id: "trending", label: "Trending", emoji: "\uD83D\uDD25" },
    { id: "battles", label: "Battles", emoji: "\u2694\uFE0F" },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-2 mb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { haptics.tap(); setMode(t.id); setStyleFilter(null); }}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
              mode === t.id
                ? "bg-orange-900/40 border border-orange-600/50 text-orange-300"
                : "bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-orange-200/60 hover:border-orange-800/40"
            }`}
          >
            <span className="mr-1">{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Style filter pills (only for recent/trending) */}
      {mode !== "battles" && (
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => { haptics.selection(); setStyleFilter(null); }}
            className={`shrink-0 px-3 py-1 rounded-full text-xs transition-all ${
              !styleFilter
                ? "bg-orange-600/30 border border-orange-500/50 text-orange-300"
                : "bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-orange-200/50 hover:border-orange-800/40"
            }`}
          >
            All
          </button>
          {ROAST_STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => { haptics.selection(); setStyleFilter(s.id); }}
              className={`shrink-0 px-3 py-1 rounded-full text-xs transition-all ${
                styleFilter === s.id
                  ? "bg-orange-600/30 border border-orange-500/50 text-orange-300"
                  : "bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-orange-200/50 hover:border-orange-800/40"
              }`}
            >
              {s.emoji} {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {mode === "battles" ? (
        <BattlesFeed />
      ) : (
        <RoastFeed mode={mode} styleFilter={styleFilter} />
      )}
    </div>
  );
}
