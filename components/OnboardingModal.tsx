"use client";

import { useState, useEffect, useRef } from "react";
import { REACTION_TYPES } from "@/lib/constants";
import { SoundToggle } from "./SoundToggle";

interface OnboardingModalProps {
  username?: string;
}

const STEPS = [
  {
    emoji: "\uD83D\uDD25",
    title: "Welcome to Onchain Roast Me!",
    description:
      "AI reads your profile — your bio, posts, and vibe — then generates a brutal (but funny) roast.",
  },
  {
    emoji: "\uD83C\uDFA4",
    title: "How It Works",
    description:
      "Roast yourself for free, or roast a friend for 0.05 USDC. Choose from 5 roast styles: Savage, Wholesome, Crypto Bro, Intellectual, or Gen-Z.",
  },
  {
    emoji: "\uD83D\uDCAB",
    title: "React & Engage",
    description:
      "React to roasts with fire, skull, ice, or clown emojis. Trending roasts rise to the top. Climb the leaderboard!",
    interactive: true,
  },
  {
    emoji: "\uD83D\uDD0A",
    title: "Sound Effects",
    description:
      "Enable fun sound effects for an immersive roasting experience. You can toggle this anytime.",
    showSoundToggle: true,
  },
];

export function OnboardingModal({ username }: OnboardingModalProps) {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"right" | "left">("right");
  const [animKey, setAnimKey] = useState(0);
  const [tappedEmojis, setTappedEmojis] = useState<Set<string>>(new Set());
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const seen = localStorage.getItem("roast-onboarding-seen");
    if (!seen) setShow(true);
  }, []);

  const handleClose = () => {
    localStorage.setItem("roast-onboarding-seen", "1");
    setShow(false);
  };

  const goToStep = (newStep: number) => {
    setDirection(newStep > step ? "right" : "left");
    setStep(newStep);
    setAnimKey((k) => k + 1);
  };

  if (!show) return null;

  const current = STEPS[step];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome onboarding"
    >
      <div
        ref={dialogRef}
        className="max-w-sm w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-6 animate-slide-up"
      >
        <div
          key={animKey}
          className={`text-center ${
            direction === "right" ? "animate-slide-in-right" : "animate-slide-in-left"
          }`}
        >
          <div className="text-5xl mb-4">{current.emoji}</div>
          <h2 className="text-xl font-bold text-orange-100 mb-2 font-[family-name:var(--font-display)]">
            {current.title}
          </h2>
          {step === 0 && username && (
            <p className="text-orange-400 text-sm mb-2">Hey @{username}</p>
          )}
          <p className="text-orange-200/60 text-sm leading-relaxed mb-4">
            {current.description}
          </p>

          {/* Step 2: Mini roast card preview */}
          {step === 1 && (
            <div className="rounded-xl bg-black/60 border border-orange-900/20 p-3 mb-4 text-left">
              <p className="text-xs text-orange-200/50 mb-1">Preview:</p>
              <p className="text-sm text-orange-100 italic">
                &ldquo;@{username || "you"} just got roasted by AI. Your bio says you&apos;re a &apos;builder&apos; but the only thing you&apos;re building is a portfolio of L&apos;s...&rdquo;
              </p>
            </div>
          )}

          {/* Step 3: Interactive reaction demo */}
          {current.interactive && (
            <div className="flex gap-2 justify-center mb-4">
              {REACTION_TYPES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setTappedEmojis((prev) => new Set(prev).add(r.id))}
                  className={`px-3 py-2 rounded-lg border transition-all ${
                    tappedEmojis.has(r.id)
                      ? "bg-orange-900/40 border-orange-600/40 scale-110 animate-reaction-pop"
                      : "bg-black/40 border-orange-900/20 hover:border-orange-800/40"
                  }`}
                >
                  <span className="text-xl">{r.emoji}</span>
                </button>
              ))}
            </div>
          )}

          {/* Step 4: Sound toggle */}
          {current.showSoundToggle && (
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-black/40 border border-orange-900/20">
                <span className="text-sm text-orange-200/60">Sound Effects</span>
                <SoundToggle />
              </div>
            </div>
          )}
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-2 mb-5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === step ? "bg-orange-400 scale-125" : "bg-orange-900/40"
              }`}
            />
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 rounded-xl text-sm text-orange-200/60 hover:text-orange-200/70 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={() => {
              if (step < STEPS.length - 1) {
                goToStep(step + 1);
              } else {
                handleClose();
              }
            }}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 font-semibold text-sm"
          >
            {step < STEPS.length - 1 ? "Next" : "Let's Go!"}
          </button>
        </div>
      </div>
    </div>
  );
}
