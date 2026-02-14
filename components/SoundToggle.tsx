"use client";

import { useState } from "react";
import { isSoundEnabled, toggleSound, initSoundEngine } from "@/lib/sounds";

export function SoundToggle() {
  const [enabled, setEnabled] = useState(() =>
    typeof window !== "undefined" ? isSoundEnabled() : true
  );

  const handleToggle = () => {
    initSoundEngine();
    const next = toggleSound();
    setEnabled(next);
  };

  return (
    <button
      onClick={handleToggle}
      aria-label={enabled ? "Mute sounds" : "Enable sounds"}
      className="text-sm text-orange-200/60 hover:text-orange-300 transition-colors"
      title={enabled ? "Sound on" : "Sound off"}
    >
      {enabled ? "\uD83D\uDD0A" : "\uD83D\uDD07"}
    </button>
  );
}
