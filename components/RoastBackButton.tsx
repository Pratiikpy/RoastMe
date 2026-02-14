"use client";

import Link from "next/link";
import type { Roast } from "@/lib/types";

interface RoastBackButtonProps {
  originalRoast: Roast;
}

export function RoastBackButton({
  originalRoast,
}: RoastBackButtonProps) {
  return (
    <Link
      href={`/roast?target=${originalRoast.senderFid}&parent=${originalRoast.id}`}
      className="flex-1 py-2.5 rounded-xl border border-red-700/50 bg-red-900/20 text-red-300 font-semibold text-sm text-center hover:bg-red-900/30 transition-colors"
    >
      {"\uD83D\uDD25"} Roast Back
    </Link>
  );
}
