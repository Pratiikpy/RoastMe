import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getUserStats, getAchievements } from "@/lib/db";
import { ACHIEVEMENTS } from "@/lib/constants";

export const runtime = "edge";

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY ?? "";

async function getUserInfo(fid: number) {
  try {
    const res = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
      { headers: { api_key: NEYNAR_API_KEY } }
    );
    const data = await res.json();
    const user = data.users?.[0];
    return {
      username: user?.username ?? `fid:${fid}`,
      pfp: user?.pfp_url ?? "",
      displayName: user?.display_name ?? "",
    };
  } catch {
    return { username: `fid:${fid}`, pfp: "", displayName: "" };
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fid: string }> }
) {
  const { fid: fidStr } = await params;
  const fid = parseInt(fidStr, 10);

  if (isNaN(fid)) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0a0a0f",
            color: "#f97316",
            fontSize: 48,
            fontWeight: 700,
          }}
        >
          Invalid profile
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  try {
    const [userInfo, stats, earnedIds] = await Promise.all([
      getUserInfo(fid),
      getUserStats(fid),
      getAchievements(fid),
    ]);

    const earned = ACHIEVEMENTS.filter((a) => earnedIds.includes(a.id));

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            padding: 0,
            background: "#0a0a0f",
            fontFamily: "system-ui, sans-serif",
            position: "relative",
          }}
        >
          {/* Fire border */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              border: "4px solid #ea580c",
              borderRadius: 16,
              background: "linear-gradient(135deg, #ea580c22 0%, #0a0a0f 30%, #0a0a0f 70%, #b91c1c22 100%)",
            }}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: 56,
              height: "100%",
              position: "relative",
              gap: 32,
            }}
          >
            {/* Header: PFP + name */}
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              {userInfo.pfp && (
                <img
                  src={userInfo.pfp}
                  width={100}
                  height={100}
                  style={{ borderRadius: "50%", border: "3px solid #ea580c" }}
                />
              )}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ color: "#fdba74", fontSize: 40, fontWeight: 700 }}>
                  @{userInfo.username}
                </span>
                {userInfo.displayName && (
                  <span style={{ color: "#fdba7466", fontSize: 22 }}>
                    {userInfo.displayName}
                  </span>
                )}
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display: "flex", gap: 24 }}>
              {[
                { label: "Roasts Sent", value: stats.sent },
                { label: "Roasts Received", value: stats.received },
                { label: "Reactions", value: stats.reactions ?? stats.likes },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#1a1a2e",
                    border: "1px solid #ea580c44",
                    borderRadius: 12,
                    padding: "20px 32px",
                    flex: 1,
                  }}
                >
                  <span style={{ color: "#f97316", fontSize: 44, fontWeight: 700 }}>
                    {s.value}
                  </span>
                  <span style={{ color: "#fdba7466", fontSize: 18 }}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Achievements */}
            {earned.length > 0 && (
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {earned.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "#ea580c22",
                      border: "1px solid #ea580c44",
                      borderRadius: 24,
                      padding: "8px 16px",
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{a.emoji}</span>
                    <span style={{ color: "#fdba74", fontSize: 16, fontWeight: 600 }}>
                      {a.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Branding */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                marginTop: "auto",
              }}
            >
              <span style={{ color: "#f97316", fontSize: 28, fontWeight: 700 }}>
                {"\uD83D\uDD25"} ROAST ME
              </span>
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0a0a0f",
            color: "#f97316",
            fontSize: 48,
            fontWeight: 700,
          }}
        >
          {"\uD83D\uDD25"} Onchain Roast Me
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }
}
