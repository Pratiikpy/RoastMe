import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getRoast } from "@/lib/db";

export const runtime = "edge";

const THEME_COLORS: Record<string, { from: string; to: string }> = {
  inferno: { from: "#ea580c", to: "#b91c1c" },
  savage: { from: "#7e22ce", to: "#dc2626" },
  nuclear: { from: "#eab308", to: "#ea580c" },
  "ice-cold": { from: "#06b6d4", to: "#2563eb" },
  clown: { from: "#ec4899", to: "#f59e0b" },
};

const REACTION_EMOJIS: Record<string, string> = {
  fire: "\uD83D\uDD25",
  skull: "\uD83D\uDC80",
  ice: "\uD83E\uDDCA",
  clown: "\uD83E\uDD21",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const roast = await getRoast(id);
    if (!roast) {
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
            Roast not found
          </div>
        ),
        { width: 1200, height: 630 }
      );
    }

    const colors = THEME_COLORS[roast.theme] ?? THEME_COLORS.inferno;
    const reactions = roast.reactions ?? { fire: 0, skull: 0, ice: 0, clown: 0 };

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 0,
            background: "#0a0a0f",
            fontFamily: "system-ui, sans-serif",
            position: "relative",
          }}
        >
          {/* Fire border frame */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              border: `4px solid ${colors.from}`,
              borderRadius: 16,
              background: `linear-gradient(135deg, ${colors.from}22 0%, #0a0a0f 30%, #0a0a0f 70%, ${colors.to}22 100%)`,
            }}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: 56,
              height: "100%",
              position: "relative",
            }}
          >
            {/* Top: target info */}
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {roast.targetPfp && (
                <img
                  src={roast.targetPfp}
                  width={80}
                  height={80}
                  style={{ borderRadius: "50%", border: `3px solid ${colors.from}` }}
                />
              )}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ color: "#fdba74", fontSize: 36, fontWeight: 700 }}>
                  @{roast.targetUsername}
                </span>
                <span style={{ color: "#fdba7466", fontSize: 20 }}>
                  {roast.isSelfRoast ? "roasted themselves" : `roasted by @${roast.senderUsername}`}
                </span>
              </div>
            </div>

            {/* Center: roast text */}
            <div
              style={{
                color: "#fff",
                fontSize: roast.roastText.length > 200 ? 28 : 38,
                fontWeight: 600,
                lineHeight: 1.4,
                maxHeight: 260,
                overflow: "hidden",
              }}
            >
              &ldquo;{roast.roastText}&rdquo;
            </div>

            {/* Bottom: reactions + branding */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                {Object.entries(reactions).map(([key, count]) =>
                  count > 0 ? (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 24 }}>{REACTION_EMOJIS[key]}</span>
                      <span style={{ color: "#fdba74", fontSize: 20, fontWeight: 600 }}>{count}</span>
                    </div>
                  ) : null
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <span style={{ color: "#f97316", fontSize: 28, fontWeight: 700 }}>
                  {"\uD83D\uDD25"} ROAST ME
                </span>
                <span style={{ color: "#fdba7466", fontSize: 16 }}>
                  onchain roast me
                </span>
              </div>
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
