"use client";

import { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { Header } from "@/components/Header";
import { LeaderboardTable } from "@/components/LeaderboardTable";

export default function LeaderboardPage() {
  const [username, setUsername] = useState<string>();
  const [pfpUrl, setPfpUrl] = useState<string>();

  useEffect(() => {
    const init = async () => {
      try {
        await sdk.actions.ready();
        const ctx = await sdk.context;
        setUsername(ctx.user.username);
        setPfpUrl(ctx.user.pfpUrl);
      } catch {
        // outside mini app
      }
    };
    init();
  }, []);

  return (
    <main className="relative min-h-screen">
      <div className="relative z-10">
        <Header username={username} pfpUrl={pfpUrl} />
        <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
          <h1 className="text-2xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
            {"\uD83C\uDFC6"} Leaderboard
          </h1>
          <LeaderboardTable />
        </div>
      </div>
    </main>
  );
}
