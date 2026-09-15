# Infinity Orbs

Reddit-native incremental RNG game built with Devvit Web.

## Core loop
- Roll every 10 seconds at base speed.
- Collect Orbs whose number represents rarity (for example, 1 / 100,000).
- Spend Coins on Speed, Multi Roll, Auto Roll, and Luck.
- Auto Roll is intentionally an early milestone and unlocks after 10 total rolls.

## MVP
- Server-authoritative player state in Redis
- Weighted rarity table
- Upgrade economy
- Collection tracking
- React/Vite webview
- Reddit-native Devvit configuration

## Development

```bash
npm install
npm run type-check
npm run build
npm run dev
```
