"use client";

import { useState, useEffect } from "react";

interface ChallengeCountdownProps {
  expiresAt: number;
}

export function ChallengeCountdown({ expiresAt }: ChallengeCountdownProps) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    function update() {
      const diff = expiresAt - Date.now();
      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      );
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <div className="text-center">
      <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-1">
        Time Remaining
      </p>
      <p className="text-3xl font-bold font-[family-name:var(--font-display)] bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent tabular-nums">
        {timeLeft}
      </p>
    </div>
  );
}
