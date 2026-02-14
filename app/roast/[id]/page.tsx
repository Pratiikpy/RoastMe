"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { sdk } from "@farcaster/miniapp-sdk";
import { Header } from "@/components/Header";
import { FireEffects } from "@/components/FireEffects";
import { RoastCard } from "@/components/RoastCard";
import { RoastBackButton } from "@/components/RoastBackButton";
import { DownloadRoastButton } from "@/components/DownloadRoastButton";
import { MintNFTButton } from "@/components/MintNFTButton";
import { SkeletonCard } from "@/components/SkeletonCard";
import { useToast } from "@/components/Toast";
import { APP_URL } from "@/lib/constants";
import type { Roast, ReactionType } from "@/lib/types";
import Link from "next/link";

export default function RoastDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [roast, setRoast] = useState<Roast | null>(null);
  const [chain, setChain] = useState<Roast[]>([]);
  const [userReactions, setUserReactions] = useState<ReactionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFid, setCurrentFid] = useState<number>();
  const [username, setUsername] = useState<string>();
  const [pfpUrl, setPfpUrl] = useState<string>();

  useEffect(() => {
    const init = async () => {
      try {
        await sdk.actions.ready();
        const ctx = await sdk.context;
        setCurrentFid(ctx.user.fid);
        setUsername(ctx.user.username);
        setPfpUrl(ctx.user.pfpUrl);
      } catch {
        // outside mini app
      }
    };
    init();
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const fidParam = currentFid ? `?fid=${currentFid}` : "";
        const res = await fetch(`/api/roast/${id}${fidParam}`);
        const data = await res.json();
        setRoast(data.roast);
        setChain(data.chain ?? []);
        setUserReactions(data.userReactions ?? []);
      } catch {
        // ignore
      }
      setLoading(false);
    }
    if (id) load();
  }, [id, currentFid]);

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
      if (data.counts && roastId === roast?.id) {
        setRoast((prev) =>
          prev ? { ...prev, reactions: data.counts, reactionCount: data.total } : prev
        );
        setUserReactions(data.userReactions ?? []);
      }
    } catch {
      // ignore
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
    } catch {
      // ignore
    }
  };

  const handleShare = async () => {
    if (!roast) return;
    try {
      const shareText = roast.isSelfRoast
        ? `@${roast.targetUsername} roasted themselves on Onchain Roast Me. It's brutal. \uD83D\uDD25`
        : `@${roast.targetUsername} just got roasted by AI on Onchain Roast Me. Can they handle the heat? \uD83D\uDD25`;
      await sdk.actions.composeCast({
        text: shareText,
        embeds: [`${APP_URL}/roast/${roast.id}`],
      });
    } catch {
      navigator.clipboard.writeText(`${APP_URL}/roast/${roast.id}`);
      showToast("Link copied to clipboard!", "info");
    }
  };

  return (
    <main className="relative min-h-screen">
      <FireEffects />
      <div className="relative z-10">
        <Header username={username} pfpUrl={pfpUrl} currentFid={currentFid} />
        <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
          <Link
            href="/"
            className="text-orange-400 text-sm hover:text-orange-300 mb-4 inline-block"
          >
            &larr; Back to feed
          </Link>

          {loading ? (
            <SkeletonCard />
          ) : !roast ? (
            <div className="text-center py-12 text-orange-200/60">
              Roast not found
            </div>
          ) : (
            <div className="space-y-4">
              <RoastCard
                roast={roast}
                full
                onReact={handleReact}
                onBookmark={handleBookmark}
                currentFid={currentFid}
                userReactions={userReactions}
              />

              <div className="flex gap-3">
                <button
                  onClick={handleShare}
                  aria-label="Share this roast"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 font-semibold text-sm"
                >
                  Share
                </button>

                <DownloadRoastButton roastId={roast.id} />

                {currentFid &&
                  roast.targetFid === currentFid &&
                  !roast.isSelfRoast && (
                    <RoastBackButton
                      originalRoast={roast}
                    />
                  )}
              </div>

              {/* NFT Mint */}
              <MintNFTButton roast={roast} />

              {/* Roast chain */}
              {chain.length > 0 && (
                <div className="pt-4">
                  <h3 className="text-sm font-semibold text-orange-300 mb-3 font-[family-name:var(--font-display)]">
                    Roast Chain ({chain.length})
                  </h3>
                  <div className="space-y-3">
                    {chain.map((r) => (
                      <RoastCard
                        key={r.id}
                        roast={r}
                        onReact={handleReact}
                        onBookmark={handleBookmark}
                        currentFid={currentFid}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
