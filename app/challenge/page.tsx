"use client";

import { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { Header } from "@/components/Header";
import { FireEffects } from "@/components/FireEffects";
import { ChallengeCountdown } from "@/components/ChallengeCountdown";
import { RoastCard } from "@/components/RoastCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { haptics } from "@/lib/haptics";
import { useToast } from "@/components/Toast";
import type { Roast } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";

interface ChallengeData {
  targetFid: number;
  targetUsername: string;
  targetPfp: string;
  startedAt: number;
  expiresAt: number;
}

interface Submission {
  roast: Roast;
  votes: number;
}

export default function ChallengePage() {
  const { showToast } = useToast();
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [previousWinner, setPreviousWinner] = useState<Roast | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentFid, setCurrentFid] = useState<number>();
  const [username, setUsername] = useState<string>();
  const [pfpUrl, setPfpUrl] = useState<string>();
  const [votedFor, setVotedFor] = useState<string | null>(null);

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
        const res = await fetch("/api/challenge");
        const data = await res.json();
        setChallenge(data.challenge);
        setSubmissions(data.submissions ?? []);
        setPreviousWinner(data.previousWinner);
      } catch {
        // ignore
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleVote = async (roastId: string) => {
    if (!currentFid || votedFor) return;
    haptics.confirm();

    try {
      const { token } = await sdk.quickAuth.getToken();
      const res = await fetch("/api/challenge/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roastId }),
      });

      if (res.ok) {
        setVotedFor(roastId);
        setSubmissions((prev) =>
          prev.map((s) =>
            s.roast.id === roastId ? { ...s, votes: s.votes + 1 } : s
          )
        );
        haptics.success();
        showToast("Vote cast!", "info");
      } else {
        const data = await res.json();
        showToast(data.error || "Could not vote", "error");
        if (data.error === "Already voted today") {
          setVotedFor("__voted__");
        }
      }
    } catch {
      showToast("Vote failed", "error");
    }
  };

  return (
    <main className="relative min-h-screen">
      <FireEffects />
      <div className="relative z-10">
        <Header username={username} pfpUrl={pfpUrl} currentFid={currentFid} />
        <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
          <h1 className="text-xl font-bold text-center bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent font-[family-name:var(--font-display)] mb-6">
            Daily Roast Challenge
          </h1>

          {loading ? (
            <div className="space-y-4">
              <SkeletonCard index={0} />
              <SkeletonCard index={1} />
            </div>
          ) : !challenge ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">{"\uD83C\uDFC6"}</div>
              <p className="text-[var(--text-secondary)] text-sm mb-2">
                No active challenge right now.
              </p>
              <p className="text-[var(--text-secondary)] text-xs">
                Check back tomorrow for the next daily challenge!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Countdown */}
              <ChallengeCountdown expiresAt={challenge.expiresAt} />

              {/* Target */}
              <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border-strong)] p-5 text-center">
                <p className="text-xs text-[var(--text-secondary)] mb-3 uppercase tracking-wider">
                  Today&apos;s Target
                </p>
                <div className="flex justify-center mb-3">
                  {challenge.targetPfp ? (
                    <Image
                      src={challenge.targetPfp}
                      alt={challenge.targetUsername}
                      width={64}
                      height={64}
                      className="rounded-full border-2 border-orange-600/50"
                      unoptimized
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-600 to-red-700 flex items-center justify-center text-2xl font-bold">
                      {challenge.targetUsername[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                </div>
                <p className="text-lg font-bold text-orange-100">
                  @{challenge.targetUsername}
                </p>
                <Link
                  href={`/roast?target=${challenge.targetFid}&challenge=1`}
                  className="inline-block mt-3 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 font-semibold text-sm pulse-glow"
                >
                  Submit Your Roast {"\uD83D\uDD25"}
                </Link>
              </div>

              {/* Previous winner */}
              {previousWinner && (
                <div className="rounded-2xl bg-[var(--surface-raised)] border border-[var(--border-subtle)] p-4">
                  <p className="text-xs text-[var(--text-secondary)] mb-2">
                    {"\uD83C\uDFC6"} Yesterday&apos;s Winner
                  </p>
                  <RoastCard roast={previousWinner} />
                </div>
              )}

              {/* Submissions */}
              {submissions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-orange-300 mb-3 font-[family-name:var(--font-display)]">
                    Submissions ({submissions.length})
                  </h3>
                  <div className="space-y-3">
                    {submissions.map((sub) => (
                      <div key={sub.roast.id} className="relative">
                        <RoastCard roast={sub.roast} currentFid={currentFid} />
                        <div className="flex items-center justify-between mt-2 px-2">
                          <span className="text-xs text-[var(--text-secondary)]">
                            {sub.votes} {sub.votes === 1 ? "vote" : "votes"}
                          </span>
                          {currentFid && !votedFor && (
                            <button
                              onClick={() => handleVote(sub.roast.id)}
                              className="px-3 py-1 rounded-lg text-xs font-medium bg-orange-900/30 border border-orange-700/40 text-orange-300 hover:bg-orange-800/40 transition-all"
                            >
                              Vote {"\uD83D\uDDF3\uFE0F"}
                            </button>
                          )}
                          {votedFor === sub.roast.id && (
                            <span className="text-xs text-emerald-400">
                              Voted {"\u2713"}
                            </span>
                          )}
                        </div>
                      </div>
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
