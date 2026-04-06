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

export default function HowToWinModal({
  onClose,
  ballMax,
  bonusballMax,
  expectedTierPayoutsWei,
  isLoadingExpectedPayouts,
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
          <p className={styles.payoutNote}>
            Estimated per winning ticket for the current pool (same as the card
            jackpot for 5 + bonusball). Duplicate winning tickets split the
            premium portion.
          </p>
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
                  const estWei = expectedTierPayoutsWei?.[tierIndex];
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
                        {isLoadingExpectedPayouts
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
