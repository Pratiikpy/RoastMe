import { baseSepolia, base } from "wagmi/chains";

export const IS_TESTNET = process.env.NEXT_PUBLIC_CHAIN_ID === "84532";

export const CHAIN = IS_TESTNET ? baseSepolia : base;
export const CHAIN_ID = IS_TESTNET ? 84532 : 8453;

export const USDC_ADDRESS = IS_TESTNET
  ? "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
  : "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

export const USDC_CAIP19 = `eip155:${CHAIN_ID}/erc20:${USDC_ADDRESS}`;

// 0.05 USDC in smallest unit (6 decimals)
export const ROAST_PRICE = "50000";
export const ROAST_PRICE_DISPLAY = "0.05 USDC";

export const TREASURY_ADDRESS =
  process.env.NEXT_PUBLIC_TREASURY_ADDRESS as `0x${string}`;

export const APP_URL =
  (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const APP_FID = Number(process.env.NEXT_PUBLIC_APP_FID ?? "0");

export const MAX_ROAST_LENGTH = 500;

export const ROAST_THEMES = [
  { id: "inferno", label: "Inferno", emoji: "\uD83D\uDD25", bg: "from-orange-600 to-red-700", accent: "orange" },
  { id: "savage", label: "Savage", emoji: "\uD83D\uDC80", bg: "from-purple-700 to-red-600", accent: "purple" },
  { id: "nuclear", label: "Nuclear", emoji: "\u2622\uFE0F", bg: "from-yellow-500 to-orange-600", accent: "yellow" },
  { id: "ice-cold", label: "Ice Cold", emoji: "\uD83E\uDD76", bg: "from-cyan-500 to-blue-600", accent: "cyan" },
  { id: "clown", label: "Clown Show", emoji: "\uD83E\uDD21", bg: "from-pink-500 to-amber-400", accent: "pink" },
] as const;

export type ThemeId = (typeof ROAST_THEMES)[number]["id"];

export const ROAST_STYLES = [
  { id: "savage", label: "Savage", emoji: "\uD83D\uDD25", description: "Maximum heat, no mercy" },
  { id: "wholesome", label: "Wholesome", emoji: "\uD83D\uDE07", description: "Backhanded compliments" },
  { id: "crypto-bro", label: "Crypto Bro", emoji: "\uD83D\uDCB0", description: "Web3 lingo roast" },
  { id: "intellectual", label: "Intellectual", emoji: "\uD83E\uDDD0", description: "Sophisticated burns" },
  { id: "gen-z", label: "Gen-Z", emoji: "\uD83D\uDC40", description: "Unhinged brainrot energy" },
] as const;

export type RoastStyle = (typeof ROAST_STYLES)[number]["id"];

export const REACTION_TYPES = [
  { id: "fire" as const, emoji: "\uD83D\uDD25", label: "Fire" },
  { id: "skull" as const, emoji: "\uD83D\uDC80", label: "Skull" },
  { id: "ice" as const, emoji: "\uD83E\uDDCA", label: "Ice" },
  { id: "clown" as const, emoji: "\uD83E\uDD21", label: "Clown" },
] as const;

export const TIP_AMOUNTS = [
  { label: "0.10", value: "100000", display: "0.10 USDC" },
  { label: "0.50", value: "500000", display: "0.50 USDC" },
  { label: "1.00", value: "1000000", display: "1.00 USDC" },
] as const;

export const ACHIEVEMENTS = [
  { id: "first-roast", label: "First Roast", emoji: "\uD83C\uDF1F", condition: "Sent your first roast" },
  { id: "10-roasts", label: "Serial Roaster", emoji: "\uD83D\uDD25", condition: "Sent 10+ roasts" },
  { id: "100-reactions", label: "Crowd Favorite", emoji: "\uD83C\uDFC6", condition: "100+ total reactions received" },
  { id: "chain-x3", label: "Chain Master", emoji: "\u26D3\uFE0F", condition: "Participated in a 3+ roast chain" },
  { id: "self-roaster", label: "Self-Roaster", emoji: "\uD83E\uDE9E", condition: "Sent a self-roast" },
] as const;
