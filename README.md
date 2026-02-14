# Onchain Roast Me

AI-powered roasting app built as a Farcaster Mini App on Base. Roast yourself for free or roast friends for 0.05 USDC.

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS v4
- **Blockchain**: Base (USDC payments via OnchainKit + Farcaster SDK)
- **AI**: NVIDIA API (Kimi K2.5 model)
- **Auth**: Farcaster Quick Auth (JWT)
- **Data**: Upstash Redis
- **Social**: Neynar API (Farcaster profiles/casts)

## Features

- Self-roasting (free) and friend-roasting (0.05 USDC)
- 5 roast styles (Savage, Wholesome, Crypto Bro, Intellectual, Gen-Z)
- 5 visual themes (Inferno, Savage, Nuclear, Ice Cold, Clown Show)
- Roast-backs (chain replies)
- Leaderboards (Most Roasted, Top Roaster, Most Liked)
- User profiles with stats
- Push notifications
- Social sharing via Farcaster cast composer
- Dynamic OG images for link previews

## Setup

```bash
npm install
cp .env.local.example .env.local  # Fill in your values
npm run dev
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Deployed app URL |
| `NEXT_PUBLIC_CHAIN_ID` | `8453` (mainnet) or `84532` (testnet) |
| `NEXT_PUBLIC_TREASURY_ADDRESS` | Wallet address receiving USDC payments |
| `NEXT_PUBLIC_ONCHAINKIT_API_KEY` | Coinbase Developer Platform API key |
| `NEXT_PUBLIC_APP_FID` | Your app's Farcaster FID |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |
| `NVIDIA_API_KEY` | NVIDIA API key for AI generation |
| `NEYNAR_API_KEY` | Neynar API key for Farcaster data |

## Left To Do Before Production

The following items must be completed before deploying to production:

1. **Generate public assets** - The `/public/` folder needs: `icon.png` (1024x1024), `preview.png`, `splash.png` (200x200), `hero.png` (1200x630), `og.png` (1200x630). These are referenced in `minikit.config.ts` for the Mini App manifest.

2. **Sign the Mini App manifest** - `app/api/manifest/route.ts` contains a placeholder `accountAssociation.signature`. After deploying to a public domain, go to [base.dev/preview](https://base.dev/preview) > Account Association tab, paste your domain, and sign with your wallet. Copy the generated `accountAssociation` fields back into the manifest route.

3. **Populate all environment variables** - Fill in `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `NEYNAR_API_KEY`, `NEXT_PUBLIC_ONCHAINKIT_API_KEY`, and `NEXT_PUBLIC_TREASURY_ADDRESS` with real values.

4. **Rotate the NVIDIA API key** - The current key in `.env.local` may have been exposed. Generate a new key from NVIDIA's developer portal and update `.env.local`.
