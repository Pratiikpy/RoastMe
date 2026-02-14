"use client";

import { useState, useCallback, useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { haptics } from "@/lib/haptics";
import { UserSearch } from "./UserSearch";
import { UserProfilePreview } from "./UserProfilePreview";
import { ThemePicker, StylePicker } from "./ThemePicker";
import { RoastReveal } from "./RoastReveal";
import { ConfettiBurst } from "./ConfettiBurst";
import {
  USDC_CAIP19,
  ROAST_PRICE,
  ROAST_PRICE_DISPLAY,
  TREASURY_ADDRESS,
  APP_URL,
} from "@/lib/constants";
import { playFireWhoosh, playSizzle } from "@/lib/sounds";
import { useToast } from "./Toast";
import type { ThemeId, RoastStyle, Roast, UserProfile } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";

type Step =
  | "choose-mode"
  | "search-target"
  | "preview-target"
  | "select-style"
  | "generating"
  | "preview-roast"
  | "paying"
  | "saving"
  | "success"
  | "error";

interface RoastFlowProps {
  userFid?: number;
  username?: string;
  pfpUrl?: string;
  parentRoastId?: string;
  preSelectedFid?: number;
  challengeMode?: boolean;
}

// Multi-step generating state
function GeneratingSteps({ targetUsername, targetPfp }: { targetUsername: string; targetPfp: string }) {
  const [genStep, setGenStep] = useState(0);

  const steps = [
    { text: `Reading @${targetUsername}'s profile...`, icon: "\uD83D\uDD0D" },
    { text: "Analyzing their casts...", icon: "\uD83D\uDCCA" },
    { text: "Generating roast...", icon: "\uD83D\uDD25" },
  ];

  useEffect(() => {
    const t1 = setTimeout(() => setGenStep(1), 1500);
    const t2 = setTimeout(() => setGenStep(2), 3500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="text-center py-12 animate-slide-up">
      {/* Pulsing avatar */}
      <div className="flex justify-center mb-6">
        {targetPfp ? (
          <Image
            src={targetPfp}
            alt={targetUsername}
            width={64}
            height={64}
            className="rounded-full border-2 border-orange-600/50 avatar-pulse"
            unoptimized
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-600 to-red-700 flex items-center justify-center text-2xl font-bold avatar-pulse">
            {targetUsername[0]?.toUpperCase() ?? "?"}
          </div>
        )}
      </div>

      {/* Step indicators */}
      <div className="space-y-3 max-w-xs mx-auto">
        {steps.map((s, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 text-sm transition-all duration-500 ${
              i <= genStep ? "opacity-100" : "opacity-20"
            }`}
          >
            <span className={`text-lg ${i === genStep ? "animate-bounce" : ""}`}>
              {i < genStep ? "\u2705" : s.icon}
            </span>
            <span className={i === genStep ? "text-orange-200" : "text-orange-200/60"}>
              {s.text}
            </span>
          </div>
        ))}
      </div>

      {/* Scanning effect on current step */}
      {genStep === 1 && (
        <div className="mt-4 mx-auto max-w-xs h-1 rounded-full bg-orange-900/30 overflow-hidden">
          <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-orange-500 to-transparent scan-line" />
        </div>
      )}
    </div>
  );
}

// Step progress indicator for paying/saving
function StepProgress({ current, label }: { current: 1 | 2; label: string }) {
  return (
    <div className="text-center py-12">
      <div className="flex justify-center mb-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-3 border-orange-900/30 flex items-center justify-center">
            <span className="text-3xl">{current === 1 ? "\uD83D\uDCB0" : "\uD83D\uDD25"}</span>
          </div>
          <svg className="absolute inset-0 w-16 h-16 spinner-ring" viewBox="0 0 64 64">
            <circle
              cx="32" cy="32" r="30"
              fill="none"
              stroke="rgba(249,115,22,0.5)"
              strokeWidth="3"
              strokeDasharray="60 130"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
      <p className="text-orange-200/60 text-xs mb-1">
        Step {current} of 2
      </p>
      <p className="text-orange-200 font-medium">{label}</p>
    </div>
  );
}

export function RoastFlow({
  userFid,
  username,
  pfpUrl,
  parentRoastId,
  preSelectedFid,
  challengeMode = false,
}: RoastFlowProps) {
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>(
    preSelectedFid ? "preview-target" : parentRoastId ? "preview-target" : "choose-mode"
  );
  const [isSelfRoast, setIsSelfRoast] = useState(false);
  const [targetFid, setTargetFid] = useState<number | undefined>(preSelectedFid);
  const [targetUsername, setTargetUsername] = useState("");
  const [targetDisplayName, setTargetDisplayName] = useState("");
  const [targetPfp, setTargetPfp] = useState("");
  const [targetBio, setTargetBio] = useState("");
  const [theme, setTheme] = useState<ThemeId>("inferno");
  const [roastStyle, setRoastStyle] = useState<RoastStyle>("savage");
  const [roastText, setRoastText] = useState("");
  const [savedRoast, setSavedRoast] = useState<Roast | null>(null);
  const [error, setError] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

  const handleSelfRoast = () => {
    setIsSelfRoast(true);
    setTargetFid(userFid);
    setTargetUsername(username ?? "");
    setTargetPfp(pfpUrl ?? "");
    setStep("select-style");
  };

  const handleTargetSelect = (user: {
    fid: number;
    username: string;
    displayName: string;
    pfpUrl: string;
  }) => {
    setTargetFid(user.fid);
    setTargetUsername(user.username);
    setTargetDisplayName(user.displayName);
    setTargetPfp(user.pfpUrl);
    setStep("preview-target");
  };

  const handleProfileLoaded = useCallback((profile: UserProfile) => {
    setTargetUsername(profile.username);
    setTargetDisplayName(profile.displayName);
    setTargetPfp(profile.pfpUrl);
    setTargetBio(profile.bio);
  }, []);

  const handleGenerate = async () => {
    setStep("generating");
    setError("");
    playFireWhoosh();
    haptics.confirm();

    try {
      const { token } = await sdk.quickAuth.getToken();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const res = await fetch("/api/generate-roast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetFid,
          roastStyle,
          isSelfRoast,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Generation failed");
      }

      const data = await res.json();
      setRoastText(data.roastText);
      if (data.profileData) {
        setTargetBio(data.profileData.bio);
        if (!targetPfp) setTargetPfp(data.profileData.pfpUrl);
        if (!targetDisplayName) setTargetDisplayName(data.profileData.displayName);
      }
      setStep("preview-roast");
    } catch (err) {
      console.error("Generate error:", err);
      const msg = err instanceof DOMException && err.name === "AbortError"
        ? "Roast generation timed out. Try again!"
        : err instanceof Error ? err.message : "Failed to generate roast";
      setError(msg);
      showToast(msg, "error");
      haptics.error();
      setStep("error");
    }
  };

  const handleAcceptAndPay = async () => {
    try {
      if (isSelfRoast) {
        // Self-roasts are free — skip payment
        setStep("saving");
        await saveRoast(null);
        return;
      }

      setStep("paying");

      const result = await sdk.actions.sendToken({
        token: USDC_CAIP19,
        amount: ROAST_PRICE,
        recipientAddress: TREASURY_ADDRESS,
      });

      if (!result.success) {
        const reason =
          result.reason === "rejected_by_user"
            ? "Payment was cancelled"
            : "Payment failed. Please try again.";
        setError(reason);
        showToast(reason, "error");
        setStep("error");
        return;
      }

      setStep("saving");
      await saveRoast(result.send.transaction);
    } catch (err) {
      console.error("Payment error:", err);
      setError("Something went wrong. Please try again.");
      showToast("Something went wrong. Please try again.", "error");
      setStep("error");
    }
  };

  const saveRoast = async (txHash: string | null) => {
    try {
      const { token } = await sdk.quickAuth.getToken();

      const res = await fetch("/api/roasts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetFid,
          targetUsername,
          targetDisplayName,
          targetPfp,
          targetBio,
          roastText,
          theme,
          roastStyle,
          isSelfRoast,
          txHash,
          parentRoastId,
          challengeMode,
          senderUsername: username,
          senderPfp: pfpUrl,
        }),
      });

      if (!res.ok) throw new Error("Failed to save roast");

      const data = await res.json();
      setSavedRoast(data.roast);
      setStep("success");
      playSizzle();
      haptics.success();

      if (data.streak?.current > 1) {
        showToast(`Day ${data.streak.current} streak! \uD83D\uDD25`, "info");
      }

      if (data.newAchievements?.length > 0) {
        setShowConfetti(true);
        showToast(`Achievement unlocked! ${data.newAchievements.join(", ")}`, "info");
        setTimeout(() => setShowConfetti(false), 2000);
      }
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save roast. Please try again.");
      showToast("Failed to save roast. Please try again.", "error");
      setStep("error");
    }
  };

  const handleShare = async () => {
    if (!savedRoast) return;
    try {
      const shareText = isSelfRoast
        ? "I just got roasted by AI on Onchain Roast Me. It's brutal. Your turn. \uD83D\uDD25"
        : `I just roasted @${targetUsername} on Onchain Roast Me. Who's next? \uD83D\uDD25`;

      await sdk.actions.composeCast({
        text: shareText,
        embeds: [`${APP_URL}/roast/${savedRoast.id}`],
      });
    } catch {
      navigator.clipboard.writeText(
        `${APP_URL}/roast/${savedRoast?.id}`
      );
      showToast("Link copied to clipboard!", "info");
    }
  };

  // ─── Step Renders ───────────────────────────────────────────

  if (step === "choose-mode") {
    return (
      <div className="space-y-4 animate-slide-up">
        <h2 className="text-xl font-bold text-center bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent font-[family-name:var(--font-display)]">
          Choose Your Roast
        </h2>

        <button
          onClick={handleSelfRoast}
          disabled={!userFid}
          className="w-full rounded-2xl border border-orange-900/30 bg-[var(--surface-raised)] p-5 text-left hover:border-orange-700/50 hover:bg-orange-900/10 transition-all disabled:opacity-40"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{"\uD83E\uDE9E"}</span>
            <div>
              <p className="font-semibold text-orange-100">Roast Myself</p>
              <p className="text-xs text-emerald-400">Free</p>
            </div>
          </div>
          <p className="text-sm text-orange-200/60">
            AI will roast you based on your own profile. Share the self-burn!
          </p>
        </button>

        <button
          onClick={() => setStep("search-target")}
          disabled={!userFid}
          className="w-full rounded-2xl border border-orange-900/30 bg-[var(--surface-raised)] p-5 text-left hover:border-orange-700/50 hover:bg-orange-900/10 transition-all disabled:opacity-40"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{"\uD83C\uDFAF"}</span>
            <div>
              <p className="font-semibold text-orange-100">Roast Someone</p>
              <p className="text-xs text-orange-400">{ROAST_PRICE_DISPLAY}</p>
            </div>
          </div>
          <p className="text-sm text-orange-200/60">
            Search for a user and unleash the AI on their profile.
          </p>
        </button>

        {!userFid && (
          <p className="text-center text-sm text-amber-300/70">
            Sign in to start roasting
          </p>
        )}
      </div>
    );
  }

  if (step === "search-target") {
    return (
      <div className="space-y-4 animate-slide-up">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStep("choose-mode")}
            className="text-orange-400 text-sm hover:text-orange-300"
            aria-label="Go back"
          >
            &larr; Back
          </button>
          <h2 className="text-lg font-bold text-orange-100 font-[family-name:var(--font-display)]">
            Find Your Target
          </h2>
        </div>
        <UserSearch onSelect={handleTargetSelect} />
      </div>
    );
  }

  if (step === "preview-target") {
    return (
      <div className="space-y-4 animate-slide-up">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStep("search-target")}
            className="text-orange-400 text-sm hover:text-orange-300"
            aria-label="Go back"
          >
            &larr; Back
          </button>
          <h2 className="text-lg font-bold text-orange-100 font-[family-name:var(--font-display)]">
            Target Acquired
          </h2>
        </div>
        {targetFid && (
          <UserProfilePreview fid={targetFid} onProfileLoaded={handleProfileLoaded} />
        )}
        <button
          onClick={() => setStep("select-style")}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 font-semibold pulse-glow"
        >
          Roast This Person {"\uD83D\uDD25"}
        </button>
      </div>
    );
  }

  if (step === "select-style") {
    return (
      <div className="space-y-5 animate-slide-up">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStep(isSelfRoast ? "choose-mode" : "preview-target")}
            className="text-orange-400 text-sm hover:text-orange-300"
            aria-label="Go back"
          >
            &larr; Back
          </button>
          <h2 className="text-lg font-bold text-orange-100 font-[family-name:var(--font-display)]">
            Choose Your Vibe
          </h2>
        </div>

        <StylePicker selectedStyle={roastStyle} onStyleChange={setRoastStyle} />
        <ThemePicker selectedTheme={theme} onThemeChange={setTheme} />

        <button
          onClick={handleGenerate}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 font-semibold pulse-glow"
        >
          Generate Roast {"\uD83C\uDFA4"}
        </button>
      </div>
    );
  }

  if (step === "generating") {
    return <GeneratingSteps targetUsername={targetUsername} targetPfp={targetPfp} />;
  }

  if (step === "preview-roast") {
    const previewRoast: Roast = {
      id: "preview",
      senderFid: userFid ?? 0,
      senderUsername: username ?? "you",
      senderPfp: pfpUrl,
      targetFid: targetFid ?? 0,
      targetUsername,
      targetDisplayName,
      targetPfp,
      targetBio,
      roastText,
      theme,
      isSelfRoast,
      txHash: null,
      timestamp: Date.now(),
      likes: 0,
      reactionCount: 0,
      reactions: { fire: 0, skull: 0, ice: 0, clown: 0 },
    };

    return (
      <div className="space-y-4 animate-slide-up">
        <h2 className="text-lg font-bold text-center text-orange-100 font-[family-name:var(--font-display)]">
          Preview Your Roast
        </h2>

        <RoastReveal roast={previewRoast} />

        <div className="flex gap-3">
          <button
            onClick={handleGenerate}
            className="flex-1 py-3 rounded-xl border border-orange-900/30 text-orange-300 font-semibold hover:bg-orange-900/20 transition-colors"
          >
            Regenerate
          </button>
          <button
            onClick={handleAcceptAndPay}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 font-semibold pulse-glow"
          >
            {isSelfRoast ? "Post It!" : `Pay ${ROAST_PRICE_DISPLAY}`}
          </button>
        </div>
      </div>
    );
  }

  if (step === "paying") {
    return <StepProgress current={1} label={`Confirm ${ROAST_PRICE_DISPLAY} payment...`} />;
  }

  if (step === "saving") {
    return <StepProgress current={2} label="Saving your roast..." />;
  }

  if (step === "success" && savedRoast) {
    return (
      <div className="text-center py-8 animate-slide-up">
        <ConfettiBurst trigger={showConfetti} />
        {/* Ember burst celebration */}
        <div className="relative inline-block mb-4">
          <div className="text-6xl animate-scale-in">{"\uD83D\uDD25"}</div>
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i / 12) * Math.PI * 2;
              const tx = Math.cos(angle) * 80;
              const ty = Math.sin(angle) * 80;
              return (
                <span
                  key={i}
                  className="ember-burst absolute top-1/2 left-1/2 text-xs"
                  style={{
                    "--tx": `${tx}px`,
                    "--ty": `${ty}px`,
                  } as React.CSSProperties}
                >
                  {["\uD83D\uDD25", "\u2728", "\uD83D\uDCAB"][i % 3]}
                </span>
              );
            })}
          </div>
        </div>

        <h2 className="text-2xl font-bold text-orange-300 mb-2 animate-shake font-[family-name:var(--font-display)]">
          Roast Delivered!
        </h2>
        <p className="text-orange-200/60 mb-6 text-sm">
          {isSelfRoast
            ? "You just roasted yourself. Respect."
            : `@${targetUsername} just got burned.`}
        </p>

        <div className="space-y-3">
          <button
            onClick={handleShare}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 font-semibold"
          >
            Share to Feed
          </button>

          <Link
            href={`/roast/${savedRoast.id}`}
            className="block w-full py-3 rounded-xl border border-orange-800/30 text-orange-300 font-semibold hover:bg-orange-900/20 transition-colors"
          >
            View Roast
          </Link>

          <button
            onClick={() => {
              setStep("choose-mode");
              setRoastText("");
              setSavedRoast(null);
              setTargetFid(undefined);
              setIsSelfRoast(false);
            }}
            className="block w-full py-3 rounded-xl text-orange-200/60 text-sm hover:text-orange-200/70 transition-colors"
          >
            Roast Someone Else
          </button>
        </div>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">{"\uD83D\uDCA8"}</div>
        <p className="text-red-300 mb-6">{error}</p>
        <button
          onClick={() => setStep(roastText ? "preview-roast" : "choose-mode")}
          className="px-6 py-3 rounded-xl bg-orange-900/30 text-orange-300 hover:bg-orange-900/40 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return null;
}
