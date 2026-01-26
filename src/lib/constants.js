import { AaveV3Base } from "@bgd-labs/aave-address-book";

export const BASE_CHAIN_ID = 8453;

export const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const USDC_DECIMALS = 6;
export const MEGAPOT_REFERRER = "0x5419c2900b238447848BfB16C6fAB7C3C7143518";

export const MEGAPOT_ADDRESS = "0xbEDd4F2beBE9E3E636161E644759f3cbe3d51B95";

export const AAVE_POOL_ADDRESS = AaveV3Base.POOL;
export const AAVE_USDC_ATOKEN =
  AaveV3Base?.ASSETS?.USDC?.A_TOKEN ?? "";

// Basescan URL for transaction links (client-side only)
export const BASESCAN_TX_URL = "https://basescan.org/tx";

// Note: ETHERSCAN_API_KEY is now server-side only (no NEXT_PUBLIC_ prefix)
// It's used in src/app/api/wallet-history/route.js
