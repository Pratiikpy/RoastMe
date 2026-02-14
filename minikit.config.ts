const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

const config = {
  miniapp: {
    version: "1",
    name: "Onchain Roast Me",
    subtitle: "AI-Powered Roast Generator",
    description:
      "Get roasted by AI based on your Farcaster profile. Self-roasts free, roast friends for 0.05 USDC. Premium shareable cards.",
    tagline: "Can you handle the heat?",
    homeUrl: APP_URL,
    webhookUrl: `${APP_URL}/api/webhook`,
    iconUrl: `${APP_URL}/icon.png`,
    imageUrl: `${APP_URL}/preview.png`,
    buttonTitle: "Get Roasted",
    splashImageUrl: `${APP_URL}/splash.png`,
    splashBackgroundColor: "#0a0a0f",
    heroImageUrl: `${APP_URL}/hero.png`,
    ogTitle: "Onchain Roast Me",
    ogDescription:
      "AI just roasted someone based on their Farcaster profile. Can you handle the heat?",
    ogImageUrl: `${APP_URL}/og.png`,
    primaryCategory: "social",
    tags: ["roast", "ai", "comedy", "social", "farcaster"],
    noindex: false,
  },
};

export default config;
