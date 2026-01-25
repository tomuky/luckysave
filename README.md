# LuckySave

A simple DeFi app on Base for saving and winning. Deposit USDC to earn interest through Aave, or try your luck with the Megapot lottery.

## Features

- **Earn Interest** - Deposit USDC to earn yield through the Aave lending protocol
- **Play the Lottery** - Buy tickets for a chance to win the Megapot jackpot
- **Claim Winnings** - Collect any lottery prizes directly to your wallet

## Tech Stack

- [Next.js](https://nextjs.org/) 16 with App Router
- [wagmi](https://wagmi.sh/) + [viem](https://viem.sh/) for Web3 interactions
- [Aave](https://aave.com/) protocol for interest-bearing deposits
- [Zustand](https://zustand.docs.pmnd.rs/) for state management
- Deployed on [Base](https://base.org/)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Requirements

- A Web3 wallet (e.g., MetaMask, Coinbase Wallet)
- USDC on Base network

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
