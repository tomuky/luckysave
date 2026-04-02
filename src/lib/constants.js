import { AaveV3Base } from "@bgd-labs/aave-address-book";

export const BASE_CHAIN_ID = 8453;

export const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const USDC_DECIMALS = 6;

/** Megapot v1 contract (historical tx parsing only) */
export const MEGAPOT_V1_ADDRESS = "0xbEDd4F2beBE9E3E636161E644759f3cbe3d51B95";

/** Megapot v2 — app wallet for referral fee share */
export const MEGAPOT_APP_REFERRER =
  "0x5419c2900b238447848BfB16C6fAB7C3C7143518";

/** @deprecated use MEGAPOT_APP_REFERRER */
export const MEGAPOT_REFERRER = MEGAPOT_APP_REFERRER;

export const MEGAPOT_JACKPOT_ADDRESS =
  "0x3bAe643002069dBCbcd62B1A4eb4C4A397d042a2";
export const MEGAPOT_RANDOM_TICKET_BUYER_ADDRESS =
  "0xb9560b43b91dE2c1DaF5dfbb76b2CFcDaFc13aBd";
export const MEGAPOT_TICKET_NFT_ADDRESS =
  "0x48FfE35AbB9f4780a4f1775C2Ce1c46185b366e4";

/** bytes32 "luckysave" left-padded */
export const MEGAPOT_SOURCE_BYTES32 =
  "0x6c75636b79736176650000000000000000000000000000000000000000000000";

export const MEGAPOT_REFERRAL_SPLIT_APP = 800000000000000000n;
export const MEGAPOT_REFERRAL_SPLIT_INVITER = 200000000000000000n;
export const MEGAPOT_REFERRAL_SPLIT_APP_ONLY = 1000000000000000000n;

export const MEGAPOT_CLAIM_SCAN_DRAWINGS_DEFAULT = 7;
export const MEGAPOT_CLAIM_SCAN_DRAWINGS_EXTENDED = 37;

/** Primary Megapot v2 Jackpot (alias for imports expecting MEGAPOT_ADDRESS) */
export const MEGAPOT_ADDRESS = MEGAPOT_JACKPOT_ADDRESS;

export const AAVE_POOL_ADDRESS = AaveV3Base.POOL;
export const AAVE_USDC_ATOKEN =
  AaveV3Base?.ASSETS?.USDC?.A_TOKEN ?? "";

export const BASESCAN_TX_URL = "https://basescan.org/tx";
