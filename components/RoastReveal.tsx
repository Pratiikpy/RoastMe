"use client";

import { useState, useEffect, useRef } from "react";
import { ROAST_THEMES } from "@/lib/constants";
import { playSizzle } from "@/lib/sounds";
import type { Roast } from "@/lib/types";
import Image from "next/image";

interface RoastRevealProps {
  roast: Roast;
}

export function RoastReveal({ roast }: RoastRevealProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(false);
  const theme = ROAST_THEMES.find((t) => t.id === roast.theme) ?? ROAST_THEMES[0];
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  // 500ms delay before typewriter starts
  useEffect(() => {
    const delay = setTimeout(() => setStarted(true), 500);
    return () => clearTimeout(delay);
  }, []);

  // Variable speed typewriter
  useEffect(() => {
    if (!started) return;

    let i = 0;

    function typeNext() {
      if (i < roast.roastText.length) {
        setDisplayedText(roast.roastText.slice(0, i + 1));
        const char = roast.roastText[i];
        i++;

        // Variable speed based on character type
        let delay = 25; // default
        if (/\s/.test(char)) {
          delay = 5; // fast through whitespace
        } else if (/[.!?]/.test(char)) {
          delay = 80; // pause at sentence end
        } else if (/[,;:]/.test(char)) {
          delay = 40; // slight pause at commas
        }

        timeoutRef.current = setTimeout(typeNext, delay);
      } else {
        setDone(true);
        playSizzle();
      }
    }

    typeNext();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [roast.roastText, started]);

  return (
    <div className="animate-slide-up">
      <div className={`rounded-2xl p-[1px] bg-gradient-to-br ${theme.bg}`}>
        <div className="rounded-2xl bg-[var(--surface)] p-6 backdrop-blur-xl relative overflow-hidden">
          {/* Target info */}
          <div className="flex items-center gap-2.5 mb-4">
            {roast.targetPfp ? (
              <Image
                src={roast.targetPfp}
                alt={roast.targetUsername}
                width={48}
                height={48}
                className="rounded-full border-2 border-orange-700/50"
                unoptimized
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-600 to-red-700 flex items-center justify-center text-lg font-bold">
                {roast.targetUsername[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <div>
              <p className="font-semibold text-orange-100">
                {roast.targetDisplayName || `@${roast.targetUsername}`}
              </p>
              <p className="text-xs text-orange-200/60">
                {roast.isSelfRoast ? "roasted themselves" : `roasted by @${roast.senderUsername}`}
              </p>
            </div>
            <span className="ml-auto text-2xl">{theme.emoji}</span>
          </div>

          {/* Typewriter roast text with last-char glow */}
          <p className="text-orange-50 leading-relaxed text-lg font-medium min-h-[60px]">
            {displayedText && (
              <>
                {displayedText.slice(0, -1)}
                <span key={displayedText.length} className="char-glow">
                  {displayedText.slice(-1)}
                </span>
              </>
            )}
            {!done && <span className="typewriter-cursor text-orange-400">|</span>}
          </p>

          {/* Burst embers on completion */}
          {done && (
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i / 8) * Math.PI * 2;
                const tx = Math.cos(angle) * 120;
                const ty = Math.sin(angle) * 120;
                return (
                  <span
                    key={i}
                    className="ember-burst absolute top-1/2 left-1/2 text-sm"
                    style={{
                      "--tx": `${tx}px`,
                      "--ty": `${ty}px`,
                    } as React.CSSProperties}
                  >
                    {theme.emoji}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
