"use client";

import { ACHIEVEMENTS } from "@/lib/constants";

interface AchievementBadgesProps {
  earned: string[];
}

export function AchievementBadges({ earned }: AchievementBadgesProps) {
  if (earned.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {ACHIEVEMENTS.map((a) => {
        const has = earned.includes(a.id);
        return (
          <div
            key={a.id}
            title={has ? `${a.label}: ${a.condition}` : `Locked: ${a.condition}`}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-all ${
              has
                ? "bg-orange-900/30 border-orange-600/40 text-orange-200"
                : "bg-black/30 border-orange-900/10 text-orange-200/20 grayscale"
            }`}
          >
            <span className="text-sm">{a.emoji}</span>
            <span>{a.label}</span>
          </div>
        );
      })}
    </div>
  );
}
