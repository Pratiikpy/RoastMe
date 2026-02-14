"use client";

import { useEffect, useState } from "react";
import { haptics } from "@/lib/haptics";
import { playDing } from "@/lib/sounds";

interface ConfettiBurstProps {
  trigger: boolean;
  emoji?: string[];
}

const DEFAULT_EMOJI = ["\uD83C\uDF89", "\uD83C\uDF8A", "\u2728", "\uD83D\uDD25", "\uD83C\uDFC6", "\uD83E\uDD73"];

export function ConfettiBurst({ trigger, emoji = DEFAULT_EMOJI }: ConfettiBurstProps) {
  const [particles, setParticles] = useState<
    Array<{ id: number; emoji: string; cx: string; cy: string; cr: string }>
  >([]);

  useEffect(() => {
    if (!trigger) return;

    haptics.celebrate();
    playDing();

    const newParticles = Array.from({ length: 20 }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 60 + Math.random() * 100;
      return {
        id: i,
        emoji: emoji[i % emoji.length],
        cx: `${Math.cos(angle) * distance}px`,
        cy: `${Math.sin(angle) * distance - 40}px`,
        cr: `${Math.random() * 360}deg`,
      };
    });

    setParticles(newParticles);

    const timeout = setTimeout(() => setParticles([]), 1200);
    return () => clearTimeout(timeout);
  }, [trigger, emoji]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      {particles.map((p) => (
        <span
          key={p.id}
          className="confetti-particle text-xl"
          style={{
            "--cx": p.cx,
            "--cy": p.cy,
            "--cr": p.cr,
          } as React.CSSProperties}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
