"use client";

import { useState, useEffect } from "react";
import { formatNumber } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

type LeaderboardType = "most-roasted" | "biggest-roaster" | "most-reactions";
type TimePeriod = "all" | "weekly" | "daily";

interface Entry {
  fid: number;
  score: number;
  username: string;
  pfpUrl: string;
}

const TABS: { id: LeaderboardType; label: string; emoji: string }[] = [
  { id: "most-roasted", label: "Most Roasted", emoji: "\uD83C\uDFAF" },
  { id: "biggest-roaster", label: "Top Roasters", emoji: "\uD83C\uDFA4" },
  { id: "most-reactions", label: "Hottest", emoji: "\uD83D\uDD25" },
];

const TIME_PERIODS: { id: TimePeriod; label: string }[] = [
  { id: "all", label: "All Time" },
  { id: "weekly", label: "This Week" },
  { id: "daily", label: "Today" },
];

const RANK_STYLES = [
  "text-yellow-400", // gold
  "text-gray-300",   // silver
  "text-amber-600",  // bronze
];

export function LeaderboardTable() {
  const [tab, setTab] = useState<LeaderboardType>("most-roasted");
  const [period, setPeriod] = useState<TimePeriod>("all");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?type=${tab}&limit=20&period=${period}`);
        const data = await res.json();
        setEntries(data.entries ?? []);
      } catch {
        setEntries([]);
      }
      setLoading(false);
    }
    load();
  }, [tab, period]);

  return (
    <div>
      {/* Time period toggle */}
      <div className="flex gap-1 mb-3 bg-black/40 rounded-xl p-1 border border-orange-900/15">
        {TIME_PERIODS.map((t) => (
          <button
            key={t.id}
            onClick={() => setPeriod(t.id)}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
              period === t.id
                ? "bg-orange-900/50 text-orange-300"
                : "text-orange-200/50 hover:text-orange-200/70"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab selector */}
      <div className="flex gap-2 mb-5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
              tab === t.id
                ? "bg-orange-900/40 border border-orange-600/50 text-orange-300"
                : "bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-orange-200/60 hover:border-orange-800/40"
            }`}
          >
            <span className="mr-1">{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-xl skeleton-shimmer"
            />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3 opacity-60">{"\uD83C\uDFC6"}</div>
          <p className="text-orange-200/60 text-sm mb-4">
            No data yet. Start roasting to climb the ranks!
          </p>
          <Link
            href="/roast"
            className="inline-block px-5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 text-sm font-semibold hover:from-orange-500 hover:to-red-500 transition-all"
          >
            Start Roasting
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => (
            <div
              key={entry.fid}
              className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-subtle)]"
            >
              <span
                className={`text-lg font-bold w-8 text-center font-[family-name:var(--font-display)] ${
                  i < 3 ? RANK_STYLES[i] : "text-orange-200/60"
                }`}
              >
                #{i + 1}
              </span>
              {entry.pfpUrl ? (
                <Image
                  src={entry.pfpUrl}
                  alt={entry.username}
                  width={32}
                  height={32}
                  className="rounded-full border border-orange-800/40"
                  unoptimized
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-600 to-red-700 flex items-center justify-center text-xs font-bold">
                  {entry.username[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-orange-100 truncate">
                  @{entry.username}
                </p>
              </div>
              <span className="text-sm font-bold text-orange-400 font-[family-name:var(--font-display)]">
                {formatNumber(entry.score)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
