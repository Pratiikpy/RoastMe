"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { sdk } from "@farcaster/miniapp-sdk";
import { Header } from "@/components/Header";
import { FireEffects } from "@/components/FireEffects";
import { RoastFlow } from "@/components/RoastFlow";

function RoastPageContent() {
  const searchParams = useSearchParams();
  const [userFid, setUserFid] = useState<number>();
  const [username, setUsername] = useState<string>();
  const [pfpUrl, setPfpUrl] = useState<string>();

  const targetFid = searchParams.get("target")
    ? Number(searchParams.get("target"))
    : undefined;
  const parentRoastId = searchParams.get("parent") ?? undefined;

  useEffect(() => {
    const init = async () => {
      try {
        await sdk.actions.ready();
        const ctx = await sdk.context;
        setUserFid(ctx.user.fid);
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
      <FireEffects />
      <div className="relative z-10">
        <Header username={username} pfpUrl={pfpUrl} />
        <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
          <RoastFlow
            userFid={userFid}
            username={username}
            pfpUrl={pfpUrl}
            preSelectedFid={targetFid}
            parentRoastId={parentRoastId}
          />
        </div>
      </div>
    </main>
  );
}

export default function RoastPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-2xl animate-pulse text-orange-300">{"\uD83D\uDD25"} Loading...</div>
        </div>
      }
    >
      <RoastPageContent />
    </Suspense>
  );
}
