import { getAddress, isAddress } from "viem";
import {
  MEGAPOT_APP_REFERRER,
  MEGAPOT_REFERRAL_SPLIT_APP,
  MEGAPOT_REFERRAL_SPLIT_APP_ONLY,
  MEGAPOT_REFERRAL_SPLIT_INVITER,
} from "@/lib/constants";

export function buildReferralTxArgs(buyerAddress, inviterFromLink) {
  const app = getAddress(MEGAPOT_APP_REFERRER);
  if (
    inviterFromLink &&
    isAddress(inviterFromLink) &&
    buyerAddress &&
    isAddress(buyerAddress)
  ) {
    const inv = getAddress(inviterFromLink);
    const buyer = getAddress(buyerAddress);
    if (inv !== buyer) {
      return {
        referrers: [app, inv],
        referralSplit: [MEGAPOT_REFERRAL_SPLIT_APP, MEGAPOT_REFERRAL_SPLIT_INVITER],
      };
    }
  }
  return {
    referrers: [app],
    referralSplit: [MEGAPOT_REFERRAL_SPLIT_APP_ONLY],
  };
}
