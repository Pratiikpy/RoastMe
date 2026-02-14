"use client";

import { useState, useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { timeAgo } from "@/lib/utils";
import { BottomSheet } from "./BottomSheet";
import type { InAppNotification } from "@/lib/types";
import Link from "next/link";

interface NotificationDrawerProps {
  currentFid: number;
  onClose: () => void;
  onRead: () => void;
}

export function NotificationDrawer({ currentFid, onClose, onRead }: NotificationDrawerProps) {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { token } = await sdk.quickAuth.getToken();
        const res = await fetch("/api/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setNotifications(data.notifications ?? []);
      } catch {
        // ignore
      }
      setLoading(false);
    }
    load();
  }, [currentFid]);

  const handleMarkAllRead = async () => {
    try {
      const { token } = await sdk.quickAuth.getToken();
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      onRead();
    } catch {
      // ignore
    }
  };

  const typeIcon: Record<string, string> = {
    roast: "\uD83D\uDD25",
    "roast-back": "\uD83D\uDCA5",
    reaction: "\u2B50",
    achievement: "\uD83C\uDFC6",
    tip: "\uD83D\uDCB0",
  };

  return (
    <BottomSheet open={true} onClose={onClose} title="Notifications">
      {/* Mark all read button */}
      <div className="flex justify-end px-4 py-2">
        <button
          onClick={handleMarkAllRead}
          className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
        >
          Mark all read
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2 p-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 rounded-xl skeleton-shimmer" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 text-orange-200/40 text-sm">
          No notifications yet
        </div>
      ) : (
        <div className="divide-y divide-orange-900/10">
          {notifications.map((notif) => (
            <Link
              key={notif.id}
              href={notif.roastId ? `/roast/${notif.roastId}` : "/profile"}
              onClick={onClose}
              className="flex items-start gap-3 px-4 py-3 hover:bg-orange-900/10 transition-colors"
            >
              <span className="text-lg mt-0.5">
                {notif.emoji || typeIcon[notif.type] || "\uD83D\uDD14"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-orange-100 font-medium truncate">
                  {notif.title}
                </p>
                <p className="text-xs text-orange-200/50 truncate">
                  {notif.body}
                </p>
                <p className="text-[10px] text-orange-200/30 mt-0.5">
                  {timeAgo(notif.timestamp)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </BottomSheet>
  );
}
