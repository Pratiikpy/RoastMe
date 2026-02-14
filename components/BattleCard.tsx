"use client";

import Link from "next/link";
import Image from "next/image";
import { formatNumber } from "@/lib/utils";

interface BattleCardProps {
  rootRoastId: string;
  user1Username: string;
  user1PfpUrl: string;
  user2Username: string;
  user2PfpUrl: string;
  chainLength: number;
  totalReactions: number;
}

export function BattleCard({
  rootRoastId,
  user1Username,
  user1PfpUrl,
  user2Username,
  user2PfpUrl,
  chainLength,
  totalReactions,
}: BattleCardProps) {
  return (
    <Link href={`/roast/${rootRoastId}`}>
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-4 hover:border-orange-700/40 transition-all">
        <div className="flex items-center justify-between">
          {/* User 1 */}
          <div className="flex items-center gap-2">
            {user1PfpUrl ? (
              <Image
                src={user1PfpUrl}
                alt={user1Username}
                width={36}
                height={36}
                className="rounded-full border border-orange-800/40"
                unoptimized
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-600 to-red-700 flex items-center justify-center text-xs font-bold">
                {user1Username[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <span className="text-sm font-medium text-orange-100 truncate max-w-[80px]">
              @{user1Username}
            </span>
          </div>

          {/* VS */}
          <div className="flex flex-col items-center">
            <span className="text-lg">{"\u2694\uFE0F"}</span>
            <span className="text-[10px] text-orange-200/40 font-medium">VS</span>
          </div>

          {/* User 2 */}
          <div className="flex items-center gap-2 flex-row-reverse">
            {user2PfpUrl ? (
              <Image
                src={user2PfpUrl}
                alt={user2Username}
                width={36}
                height={36}
                className="rounded-full border border-orange-800/40"
                unoptimized
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-red-700 flex items-center justify-center text-xs font-bold">
                {user2Username[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <span className="text-sm font-medium text-orange-100 truncate max-w-[80px]">
              @{user2Username}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-4 mt-3 pt-2 border-t border-orange-900/15">
          <span className="text-xs text-orange-200/50">
            {"\u26D3\uFE0F"} {chainLength} exchanges
          </span>
          <span className="text-xs text-orange-200/50">
            {"\uD83D\uDD25"} {formatNumber(totalReactions)} reactions
          </span>
        </div>
      </div>
    </Link>
  );
}
