import { nanoid } from "nanoid";
import { getNotificationToken, storeInAppNotification } from "./db";
import { APP_URL, APP_FID } from "./constants";
import type { InAppNotification } from "./types";

async function sendNotification(
  targetFid: number,
  title: string,
  body: string,
  targetUrl: string
) {
  const details = await getNotificationToken(targetFid, APP_FID);
  if (!details) return { state: "no_token" as const };

  try {
    const response = await fetch(details.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notificationId: nanoid(),
        title,
        body,
        targetUrl,
        tokens: [details.token],
      }),
    });

    const data = await response.json();

    if (response.ok) {
      if (data.result?.invalidTokens?.length > 0) {
        return { state: "invalid_token" as const };
      }
      if (data.result?.rateLimitedTokens?.length > 0) {
        return { state: "rate_limited" as const };
      }
      return { state: "success" as const };
    }

    return { state: "error" as const };
  } catch {
    return { state: "error" as const };
  }
}

async function sendAndStoreNotification(
  targetFid: number,
  title: string,
  body: string,
  targetUrl: string,
  inAppNotif: InAppNotification
) {
  // Store in-app notification
  storeInAppNotification(targetFid, inAppNotif).catch(() => {});
  // Send push notification
  return sendNotification(targetFid, title, body, targetUrl);
}

export async function sendRoastNotification(
  targetFid: number,
  roastId: string,
  senderUsername: string
) {
  const title = "You got roasted! \uD83D\uDD25";
  const body = `@${senderUsername} just roasted you. See what they said...`;
  const url = `${APP_URL}/roast/${roastId}`;
  return sendAndStoreNotification(targetFid, title, body, url, {
    id: nanoid(),
    type: "roast",
    title,
    body,
    roastId,
    timestamp: Date.now(),
    read: false,
  });
}

export async function sendRoastBackNotification(
  originalRoasterFid: number,
  roastId: string,
  responderUsername: string
) {
  const title = "They fired back! \uD83D\uDCA5";
  const body = `@${responderUsername} roasted you back! Can you handle the heat?`;
  const url = `${APP_URL}/roast/${roastId}`;
  return sendAndStoreNotification(originalRoasterFid, title, body, url, {
    id: nanoid(),
    type: "roast-back",
    title,
    body,
    roastId,
    timestamp: Date.now(),
    read: false,
  });
}

export async function sendReactionNotification(
  roastSenderFid: number,
  roastId: string,
  emoji: string,
  reactorUsername: string
) {
  const title = "Your roast is fire! \uD83D\uDD25";
  const body = `@${reactorUsername} reacted ${emoji} to your roast`;
  const url = `${APP_URL}/roast/${roastId}`;
  return sendAndStoreNotification(roastSenderFid, title, body, url, {
    id: nanoid(),
    type: "reaction",
    title,
    body,
    roastId,
    emoji,
    timestamp: Date.now(),
    read: false,
  });
}

export async function sendAchievementNotification(
  fid: number,
  achievementLabel: string,
  achievementEmoji: string
) {
  const title = `Achievement unlocked! ${achievementEmoji}`;
  const body = `You earned: ${achievementLabel}`;
  const url = `${APP_URL}/profile`;
  return sendAndStoreNotification(fid, title, body, url, {
    id: nanoid(),
    type: "achievement",
    title,
    body,
    timestamp: Date.now(),
    read: false,
  });
}

// Keep old name as alias for backwards compat
export const sendLikeNotification = sendReactionNotification;
