"use client";

interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  if (streak <= 0) return null;

  const label = streak >= 30 ? "MONTHLY STREAK" : streak >= 7 ? "WEEKLY STREAK" : null;
  const glowColor = streak >= 30
    ? "shadow-amber-400/40"
    : streak >= 7
    ? "shadow-orange-400/40"
    : "shadow-orange-600/30";
  const textColor = streak >= 30 ? "text-amber-400" : "text-orange-400";

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface-raised)] border border-[var(--border-subtle)] shadow-lg ${glowColor} animate-scale-in`}>
      <span className="text-lg pulse-glow rounded-full">{"\uD83D\uDD25"}</span>
      <span className={`text-sm font-bold tabular-nums ${textColor} font-[family-name:var(--font-display)]`}>
        {streak}
      </span>
      {label && (
        <span className={`text-[10px] font-semibold tracking-wider ${textColor} opacity-80`}>
          {label}
        </span>
      )}
    </div>
  );
}
