"use client";

import { ROAST_THEMES, ROAST_STYLES } from "@/lib/constants";
import { haptics } from "@/lib/haptics";
import type { ThemeId, RoastStyle } from "@/lib/types";

interface ThemePickerProps {
  selectedTheme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
}

export function ThemePicker({ selectedTheme, onThemeChange }: ThemePickerProps) {
  return (
    <div>
      <p className="text-sm text-orange-200/60 mb-2">Card Theme</p>
      <div className="grid grid-cols-5 gap-2">
        {ROAST_THEMES.map((theme) => (
          <button
            key={theme.id}
            onClick={() => { haptics.selection(); onThemeChange(theme.id); }}
            aria-label={`Theme: ${theme.label}`}
            className={`relative flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
              selectedTheme === theme.id
                ? "border-orange-400 bg-orange-900/30 scale-105 ring-2 ring-orange-400/60 shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                : "border-orange-900/30 bg-black/40 hover:border-orange-800/50"
            }`}
          >
            <span className="text-xl">{theme.emoji}</span>
            <span className="text-[10px] text-orange-200/60">{theme.label}</span>
            {selectedTheme === theme.id && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-[8px] text-white font-bold">
                {"\u2713"}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

interface StylePickerProps {
  selectedStyle: RoastStyle;
  onStyleChange: (style: RoastStyle) => void;
}

export function StylePicker({ selectedStyle, onStyleChange }: StylePickerProps) {
  return (
    <div>
      <p className="text-sm text-orange-200/60 mb-2">Roast Style</p>
      <div className="grid grid-cols-2 gap-2">
        {ROAST_STYLES.map((style) => (
          <button
            key={style.id}
            onClick={() => { haptics.selection(); onStyleChange(style.id); }}
            aria-label={`Style: ${style.label}`}
            className={`relative flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
              selectedStyle === style.id
                ? "border-orange-400 bg-orange-900/30 ring-2 ring-orange-400/60 shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                : "border-orange-900/30 bg-black/40 hover:border-orange-800/50"
            }`}
          >
            <span className="text-xl">{style.emoji}</span>
            <div>
              <p className="text-sm font-medium text-orange-100">{style.label}</p>
              <p className="text-[10px] text-orange-200/60">{style.description}</p>
            </div>
            {selectedStyle === style.id && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-[8px] text-white font-bold">
                {"\u2713"}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
