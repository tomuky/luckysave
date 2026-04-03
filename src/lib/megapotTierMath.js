/** Binomial coefficient C(n,k). */
export function nCr(n, k) {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  k = Math.min(k, n - k);
  let c = 1;
  for (let i = 0; i < k; i++) {
    c = (c * (n - i)) / (i + 1);
  }
  return Math.round(c);
}

const NORMAL_PICKS = 5;

/**
 * Count of ticket combinations that match a given draw result in exactly this tier
 * (same formula as Megapot's GuaranteedMinimumPayoutCalculator._calculateTierTotalWinningCombos).
 */
export function tierWinningComboCount(tierIndex, normalMax, bonusballMax) {
  const matches = Math.floor(tierIndex / 2);
  const bonusballMatch = tierIndex % 2 === 1;
  if (bonusballMatch) {
    return (
      nCr(NORMAL_PICKS, matches) * nCr(normalMax - NORMAL_PICKS, NORMAL_PICKS - matches)
    );
  }
  return (
    nCr(NORMAL_PICKS, matches) *
    nCr(normalMax - NORMAL_PICKS, NORMAL_PICKS - matches) *
    (bonusballMax - 1)
  );
}

export function totalTicketCombinations(normalMax, bonusballMax) {
  return nCr(normalMax, NORMAL_PICKS) * bonusballMax;
}

/**
 * Approximate odds 1 in N for a random ticket vs a random draw landing in this tier.
 */
export function tierOddsOneIn(tierIndex, normalMax, bonusballMax) {
  const total = totalTicketCombinations(normalMax, bonusballMax);
  const win = tierWinningComboCount(tierIndex, normalMax, bonusballMax);
  if (!win) return null;
  return Math.round(total / win);
}

/** Human-readable tier label; indices follow on-chain tierId 0–11. */
export function megapotTierLabel(tierIndex) {
  const matches = Math.floor(tierIndex / 2);
  const hasBonus = tierIndex % 2 === 1;
  if (matches === 0 && !hasBonus) return "No match";
  if (matches === 0 && hasBonus) return "Bonusball only";
  if (matches === 5 && hasBonus) return "5 + bonusball (jackpot)";
  if (matches === 5 && !hasBonus) return "5 main numbers";
  if (hasBonus) return `${matches} main + bonusball`;
  return `${matches} main`;
}
