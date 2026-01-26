import styles from "@/app/page.module.css";
import Skeleton from "./Skeleton";

export default function EarnInterestCard({
  apyLabel,
  depositBalance,
  hasDeposit,
  onDepositClick,
  onWithdrawClick,
  isConnected,
  isLoadingDeposit,
  isLoadingApy,
}) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2>Earn Interest</h2>
        <span className={styles.poweredBy}>
          Powered by{" "}
          <a href="https://aave.com/docs" target="_blank" rel="noopener noreferrer">
            Aave
          </a>
        </span>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statBlock}>
          <span className={styles.statLabel}>Your Deposit</span>
          <span className={styles.statValueLarge}>
            {isLoadingDeposit ? (
              <Skeleton variant="value" />
            ) : (
              depositBalance
            )}
          </span>
        </div>
        <div className={styles.statBlock}>
          <span className={styles.statLabel}>Earning</span>
          <span className={styles.statValueAccent}>
            {isLoadingApy ? (
              <Skeleton variant="value" width="70px" />
            ) : (
              apyLabel
            )}
          </span>
        </div>
      </div>

      <div className={styles.cardActions}>
        <button
          className={styles.buttonPrimary}
          onClick={onDepositClick}
          disabled={!isConnected}
        >
          Deposit
        </button>
        {hasDeposit && (
          <button
            className={styles.buttonSecondary}
            onClick={onWithdrawClick}
            disabled={!isConnected}
          >
            Withdraw
          </button>
        )}
      </div>

      <span className={styles.muted}>Earn interest on your USDC</span>
    </div>
  );
}
