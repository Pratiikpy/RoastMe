"use client";

import { useEffect, useState, useCallback } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { Header } from "@/components/Header";
import { FireEffects } from "@/components/FireEffects";
import { OnboardingModal } from "@/components/OnboardingModal";
import { FeedTabs } from "@/components/FeedTabs";
import { PullToRefresh } from "@/components/PullToRefresh";
import Link from "next/link";

export default function Home() {
  const [isReady, setIsReady] = useState(false);
  const [username, setUsername] = useState<string>();
  const [pfpUrl, setPfpUrl] = useState<string>();
  const [currentFid, setCurrentFid] = useState<number>();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        await sdk.actions.ready();
        const ctx = await sdk.context;
        setUsername(ctx.user.username);
        setPfpUrl(ctx.user.pfpUrl);
        setCurrentFid(ctx.user.fid);
      } catch {
        // Running outside mini app context
      }
      setIsReady(true);
    };
    init();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshKey((k) => k + 1);
    // Small delay for visual feedback
    await new Promise((r) => setTimeout(r, 500));
  }, []);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl animate-pulse text-orange-300">{"\uD83D\uDD25"} Loading...</div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen">
      <FireEffects />
      <OnboardingModal username={username} />
      <div className="relative z-10">
        <Header username={username} pfpUrl={pfpUrl} currentFid={currentFid} />

        <div className="max-w-lg mx-auto px-4 pt-4 pb-24">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent font-[family-name:var(--font-display)]">
              Onchain Roast Me
            </h1>
            <p className="text-orange-200/60 text-sm">
              AI-powered roasts. Premium cards. Can you handle the heat?
            </p>
          </div>

          <Link
            href="/roast"
            className="block w-full text-center py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-600 to-red-600 font-bold text-lg mb-8 pulse-glow hover:from-orange-500 hover:to-red-500 transition-all"
          >
            {"\uD83D\uDD25"} Get Roasted
          </Link>

          <PullToRefresh onRefresh={handleRefresh}>
            <FeedTabs key={refreshKey} />
          </PullToRefresh>
        </div>
      </div>
    </main>
  );
}
