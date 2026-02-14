import { NextRequest, NextResponse } from "next/server";

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY ?? "";

const addressCache = new Map<number, { address: string | null; ts: number }>();
const CACHE_TTL = 3600_000; // 1 hour

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fid = parseInt(searchParams.get("fid") ?? "0");

  if (!fid) {
    return NextResponse.json({ error: "fid required" }, { status: 400 });
  }

  // Check cache
  const cached = addressCache.get(fid);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({ address: cached.address });
  }

  try {
    const res = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
      {
        headers: {
          accept: "application/json",
          "x-api-key": NEYNAR_API_KEY,
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ address: null });
    }

    const data = await res.json();
    const user = data.users?.[0];
    const verifiedAddress = user?.verified_addresses?.eth_addresses?.[0] ?? null;

    addressCache.set(fid, { address: verifiedAddress, ts: Date.now() });

    return NextResponse.json({ address: verifiedAddress });
  } catch {
    return NextResponse.json({ address: null });
  }
}
