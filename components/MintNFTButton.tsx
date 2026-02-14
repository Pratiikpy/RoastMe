"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { sdk } from "@farcaster/miniapp-sdk";
import { ROAST_NFT_ADDRESS, ROAST_NFT_ABI, BASESCAN_URL } from "@/lib/nftContract";
import { haptics } from "@/lib/haptics";
import { useToast } from "./Toast";
import { ConfettiBurst } from "./ConfettiBurst";
import type { Roast } from "@/lib/types";

interface MintNFTButtonProps {
  roast: Roast;
}

export function MintNFTButton({ roast }: MintNFTButtonProps) {
  const { showToast } = useToast();
  const [minted, setMinted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { writeContract, isPending } = useWriteContract({
    mutation: {
      onSuccess: async (hash) => {
        setTxHash(hash);
        haptics.celebrate();
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);

        // Save mint record
        try {
          const { token } = await sdk.quickAuth.getToken();
          await fetch("/api/mint", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              roastId: roast.id,
              txHash: hash,
            }),
          });
        } catch {
          // ignore
        }

        setMinted(true);
        showToast("Roast minted as NFT!", "info");
      },
      onError: (error) => {
        console.error("Mint error:", error);
        haptics.error();
        showToast("Failed to mint NFT", "error");
      },
    },
  });

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}` | undefined,
  });

  // Only show on roasts with 5+ reactions
  if ((roast.reactionCount ?? 0) < 5) return null;

  // Don't show if contract not deployed
  if (ROAST_NFT_ADDRESS === "0x0000000000000000000000000000000000000000") return null;

  const handleMint = () => {
    haptics.confirm();
    writeContract({
      address: ROAST_NFT_ADDRESS,
      abi: ROAST_NFT_ABI,
      functionName: "mintRoast",
      args: [
        roast.id,
        roast.roastText,
        roast.targetUsername,
        roast.senderUsername,
        roast.theme,
        BigInt(roast.reactionCount ?? 0),
      ],
    });
  };

  if (minted && txHash) {
    return (
      <div>
        <ConfettiBurst trigger={showConfetti} />
        <a
          href={`${BASESCAN_URL}/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <span>{"\u2728"}</span>
          <span>Minted as NFT</span>
          <span className="text-[10px] opacity-70">{"\u2197"}</span>
        </a>
      </div>
    );
  }

  return (
    <button
      onClick={handleMint}
      disabled={isPending || isConfirming}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-purple-900/40 to-orange-900/40 border border-purple-700/40 text-purple-200 hover:border-purple-600/60 transition-all disabled:opacity-50"
    >
      <span>{"\u2728"}</span>
      {isPending ? "Confirm..." : isConfirming ? "Minting..." : "Mint NFT"}
    </button>
  );
}
