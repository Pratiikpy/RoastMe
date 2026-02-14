"use client";

import { useState } from "react";
import { haptics } from "@/lib/haptics";
import { useToast } from "./Toast";
import { APP_URL } from "@/lib/constants";

interface DownloadRoastButtonProps {
  roastId: string;
}

export function DownloadRoastButton({ roastId }: DownloadRoastButtonProps) {
  const { showToast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    haptics.tap();

    try {
      const imageUrl = `${APP_URL}/api/og/${roastId}`;
      const res = await fetch(imageUrl);

      if (!res.ok) throw new Error("Failed to fetch image");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `roast-${roastId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      haptics.success();
      showToast("Image saved!", "info");
    } catch {
      // Fallback: open in new tab
      try {
        window.open(`${APP_URL}/api/og/${roastId}`, "_blank");
        showToast("Image opened in new tab", "info");
      } catch {
        showToast("Could not download image", "error");
        haptics.error();
      }
    }

    setDownloading(false);
  };

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="flex-1 py-2.5 rounded-xl border border-orange-800/30 text-orange-300 font-semibold text-sm hover:bg-orange-900/20 transition-colors disabled:opacity-50"
    >
      {downloading ? "Saving..." : "Save Image"}
    </button>
  );
}
