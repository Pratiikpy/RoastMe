import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/.well-known/farcaster.json",
        destination: "https://api.farcaster.xyz/miniapps/hosted-manifest/019c5c74-1eaa-0c6a-e4e3-0c358ff4a2ea",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
