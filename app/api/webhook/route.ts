import { NextRequest, NextResponse } from "next/server";
import {
  parseWebhookEvent,
  verifyAppKeyWithNeynar,
} from "@farcaster/miniapp-node";
import {
  saveNotificationToken,
  deleteNotificationToken,
} from "@/lib/db";

export async function POST(request: NextRequest) {
  const requestJson = await request.json();

  try {
    const { fid, appFid, event } = await parseWebhookEvent(
      requestJson,
      verifyAppKeyWithNeynar
    );

    switch (event.event) {
      case "miniapp_added": {
        if (event.notificationDetails) {
          await saveNotificationToken(fid, appFid, event.notificationDetails);
        }
        break;
      }
      case "miniapp_removed": {
        await deleteNotificationToken(fid, appFid);
        break;
      }
      case "notifications_enabled": {
        if (event.notificationDetails) {
          await saveNotificationToken(fid, appFid, event.notificationDetails);
        }
        break;
      }
      case "notifications_disabled": {
        await deleteNotificationToken(fid, appFid);
        break;
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 400 }
    );
  }
}
