/** Megapot Jackpot uses 1e18 fixed-point for referralWinShare (see on-chain PRECISE_UNIT). */
export const MEGAPOT_PRECISE_UNIT = 1_000_000_000_000_000_000n;

/**
 * USDC the player receives when claiming one ticket at this tier — matches
 * Jackpot.claimWinnings: winningAmount - winningAmount * referralWinShare / PRECISE_UNIT.
 *
 * @param {bigint} grossTierPayoutWei from getDrawingTierPayouts[tierId] / getTierPayout
 * @param {bigint} referralWinShare from DrawingState for that drawing
 */
export function megapotNetClaimWei(grossTierPayoutWei, referralWinShare) {
  if (grossTierPayoutWei <= 0n) return 0n;
  const share =
    (grossTierPayoutWei * referralWinShare) / MEGAPOT_PRECISE_UNIT;
  return grossTierPayoutWei - share;
}
