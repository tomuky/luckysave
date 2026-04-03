"use client";

import { formatUnits } from "viem";

import modalStyles from "@/components/ui/Modal.module.css";
import { USDC_DECIMALS } from "@/lib/constants";
import { currency } from "@/lib/format";
import {
  megapotTierLabel,
  tierOddsOneIn,
} from "@/lib/megapotTierMath";
import styles from "./HowToWinModal.module.css";

const TIER_ORDER = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];

function formatOdds(oneIn) {
  if (oneIn === null || !Number.isFinite(oneIn)) return "—";
  return `1 in ${new Intl.NumberFormat("en-US").format(oneIn)}`;
}

function formatPayoutWei(wei) {
  if (wei === undefined || wei === null) return "—";
  const n = Number(formatUnits(wei, USDC_DECIMALS));
  if (!Number.isFinite(n) || n <= 0) return "—";
  return currency.format(n);
}

/** Scale last draw’s per-ticket payout by current vs last prize pool (rough estimate). */
function estimatedPayoutWei(
  tierWei,
  currentPrizePoolWei,
  lastPrizePoolWei
) {
  if (
    tierWei === undefined ||
    tierWei === null ||
    tierWei === 0n ||
    !lastPrizePoolWei ||
    lastPrizePoolWei === 0n ||
    !currentPrizePoolWei
  ) {
    return null;
  }
  return (tierWei * currentPrizePoolWei) / lastPrizePoolWei;
}

export default function HowToWinModal({
  onClose,
  ballMax,
  bonusballMax,
  currentPrizePoolWei,
  lastPrizePoolWei,
  tierPayoutsLastDraw,
  isLoadingLastPayouts,
}) {
  const nm = Number(ballMax) || 30;
  const bm = Number(bonusballMax) || 12;

  return (
    <div className={modalStyles.modalOverlay} onClick={onClose}>
      <div
        className={`${modalStyles.modal} ${styles.howToWinModal}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={modalStyles.modalHeader}>
          <h3>How to win</h3>
          <button
            className={modalStyles.modalClose}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <div className={`${modalStyles.modalBody} ${styles.howToWinBody}`}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Combination</th>
                  <th scope="col">Odds</th>
                  <th scope="col">Payout</th>
                </tr>
              </thead>
              <tbody>
                {TIER_ORDER.map((tierIndex) => {
                  const oneIn = tierOddsOneIn(tierIndex, nm, bm);
                  const lastWei = tierPayoutsLastDraw?.[tierIndex];
                  const estWei = estimatedPayoutWei(
                    lastWei,
                    currentPrizePoolWei,
                    lastPrizePoolWei
                  );
                  return (
                    <tr
                      key={tierIndex}
                      className={
                        tierIndex === 0 || tierIndex === 2
                          ? styles.rowMuted
                          : undefined
                      }
                    >
                      <td>{megapotTierLabel(tierIndex)}</td>
                      <td className={styles.numeric}>{formatOdds(oneIn)}</td>
                      <td className={styles.numeric}>
                        {isLoadingLastPayouts
                          ? "…"
                          : formatPayoutWei(estWei)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
