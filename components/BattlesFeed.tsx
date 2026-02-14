"use client";

import { useState, useEffect } from "react";
import { BattleCard } from "./BattleCard";
import Link from "next/link";

interface Battle {
  rootRoastId: string;
  user1Fid: number;
  user2Fid: number;
  user1Username: string;
  user1PfpUrl: string;
  user2Username: string;
  user2PfpUrl: string;
  chainLength: number;
  totalReactions: number;
}

export function BattlesFeed() {
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/battles?limit=20");
        const data = await res.json();
        setBattles(data.battles ?? []);
      } catch {
        // ignore
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-2xl skeleton-shimmer" />
        ))}
      </div>
    );
  }

  if (battles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-3 opacity-60">{"\u2694\uFE0F"}</div>
        <p className="text-orange-200/60 text-sm mb-4">
          No battles yet. Roast back and forth to start a battle!
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

  return (
    <div className="space-y-3">
      {battles.map((battle) => (
        <BattleCard key={battle.rootRoastId} {...battle} />
      ))}
    </div>
  );
}
