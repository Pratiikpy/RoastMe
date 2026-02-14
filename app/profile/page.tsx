"use client";

import { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { Header } from "@/components/Header";
import { ProfileStats } from "@/components/ProfileStats";
import Image from "next/image";

export default function ProfilePage() {
  const [userFid, setUserFid] = useState<number>();
  const [username, setUsername] = useState<string>();
  const [pfpUrl, setPfpUrl] = useState<string>();

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
      <div className="relative z-10">
        <Header username={username} pfpUrl={pfpUrl} currentFid={userFid} />
        <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
          {!userFid ? (
            <div className="text-center py-16 text-orange-200/50">
              <p className="text-4xl mb-4">{"\uD83D\uDD25"}</p>
              <p>Sign in to see your profile</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                {pfpUrl && (
                  <Image
                    src={pfpUrl}
                    alt={username ?? ""}
                    width={56}
                    height={56}
                    className="rounded-full border-2 border-orange-700/50"
                    unoptimized
                  />
                )}
                <div>
                  <h1 className="text-xl font-bold text-orange-100">
                    @{username}
                  </h1>
                  <p className="text-sm text-orange-200/50">Your roast stats</p>
                </div>
              </div>
              <ProfileStats fid={userFid} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
