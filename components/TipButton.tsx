"use client";

import { useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { USDC_CAIP19, TIP_AMOUNTS } from "@/lib/constants";
import { haptics } from "@/lib/haptics";
import { useToast } from "./Toast";
import { BottomSheet } from "./BottomSheet";

interface TipButtonProps {
  roastId: string;
  recipientAddress?: string;
  totalTips?: number;
}

export function TipButton({ roastId, recipientAddress, totalTips: initialTips = 0 }: TipButtonProps) {
  const { showToast } = useToast();
  const [showPicker, setShowPicker] = useState(false);
  const [sending, setSending] = useState(false);
  const [totalTips, setTotalTips] = useState(initialTips);

  const handleTip = async (amount: typeof TIP_AMOUNTS[number]) => {
    if (!recipientAddress || sending) return;
    setSending(true);
    haptics.confirm();

    try {
      const result = await sdk.actions.sendToken({
        token: USDC_CAIP19,
        amount: amount.value,
        recipientAddress: recipientAddress as `0x${string}`,
      });

      if (!result.success) {
        if (result.reason !== "rejected_by_user") {
          showToast("Tip failed. Please try again.", "error");
          haptics.error();
        }
        setSending(false);
        setShowPicker(false);
        return;
      }

      // Record tip
      const { token } = await sdk.quickAuth.getToken();
      await fetch("/api/tip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roastId,
          amount: amount.display,
          txHash: result.send.transaction,
        }),
      });

      setTotalTips((prev) => prev + parseFloat(amount.label));
      showToast(`Tipped ${amount.display}!`, "info");
      haptics.success();
    } catch {
      showToast("Tip failed. Please try again.", "error");
      haptics.error();
    }

    setSending(false);
    setShowPicker(false);
  };

  return (
    <>
      <button
        onClick={() => {
          haptics.tap();
          setShowPicker(!showPicker);
        }}
        className="flex items-center gap-1 text-xs text-orange-200/50 hover:text-orange-300 transition-colors"
        aria-label="Tip this roaster"
      >
        <span className="text-sm">{"\uD83D\uDCB0"}</span>
        {totalTips > 0 && (
          <span className="text-[11px] text-orange-300">${totalTips.toFixed(2)}</span>
        )}
      </button>

      <BottomSheet
        open={showPicker}
        onClose={() => setShowPicker(false)}
        title="Tip USDC"
        maxHeight="40vh"
      >
        <div className="p-4 space-y-4">
          <div className="flex gap-3 justify-center">
            {TIP_AMOUNTS.map((amt) => (
              <button
                key={amt.value}
                onClick={() => handleTip(amt)}
                disabled={sending || !recipientAddress}
                className="flex-1 max-w-[100px] py-3 rounded-xl text-sm font-medium bg-orange-900/30 border border-orange-700/40 text-orange-300 hover:bg-orange-800/40 transition-all disabled:opacity-40"
              >
                ${amt.label}
              </button>
            ))}
          </div>
          {!recipientAddress && (
            <p className="text-xs text-red-400/70 text-center">Recipient address unavailable</p>
          )}
        </div>
      </BottomSheet>
    </>
  );
}
