"use client";

import { sdk } from "@farcaster/miniapp-sdk";

function impact(style: "light" | "medium" | "heavy" | "rigid" | "soft") {
  try {
    sdk.haptics.impactOccurred(style);
  } catch {
    // haptics not available
  }
}

function notification(type: "success" | "warning" | "error") {
  try {
    sdk.haptics.notificationOccurred(type);
  } catch {
    // haptics not available
  }
}

function selection() {
  try {
    sdk.haptics.selectionChanged();
  } catch {
    // haptics not available
  }
}

export const haptics = {
  tap: () => impact("light"),
  confirm: () => impact("medium"),
  heavy: () => impact("heavy"),
  celebrate: () => impact("rigid"),
  soft: () => impact("soft"),
  success: () => notification("success"),
  warning: () => notification("warning"),
  error: () => notification("error"),
  selection: () => selection(),
};
