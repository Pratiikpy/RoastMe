"use client";

import { useState, useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { haptics } from "@/lib/haptics";
import { NotificationDrawer } from "./NotificationDrawer";

interface NotificationBellProps {
  currentFid?: number;
}

export function NotificationBell({ currentFid }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!currentFid) return;
    let cancelled = false;

    async function fetchCount() {
      try {
        const { token } = await sdk.quickAuth.getToken();
        const res = await fetch("/api/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!cancelled) {
          setUnreadCount(data.unreadCount ?? 0);
        }
      } catch (err) {
        console.warn("Failed to fetch notifications:", err);
      }
    }

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentFid]);

  if (!currentFid) return null;

  return (
    <>
      <button
        onClick={() => { haptics.tap(); setOpen(true); }}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        className="relative text-orange-200/60 hover:text-orange-300 transition-colors"
      >
        <span className="text-lg">{"\uD83D\uDD14"}</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationDrawer
          currentFid={currentFid}
          onClose={() => setOpen(false)}
          onRead={() => setUnreadCount(0)}
        />
      )}
    </>
  );
}
