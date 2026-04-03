import cardStyles from "@/components/ui/Card.module.css";
import buttonStyles from "@/components/ui/Buttons.module.css";
import styles from "./EarnInterestCard.module.css";
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
    <div className={cardStyles.card}>
      <div className={cardStyles.cardHeader}>
        <h2>Earn Interest</h2>
        <span className={cardStyles.poweredBy}>
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

      <div
        className={`${cardStyles.cardActions} ${hasDeposit ? cardStyles.cardActionsSplit : ""}`}
      >
        <button
          className={buttonStyles.buttonPrimary}
          onClick={onDepositClick}
          disabled={!isConnected}
        >
          Deposit
        </button>
        {hasDeposit && (
          <button
            className={buttonStyles.buttonSecondary}
            onClick={onWithdrawClick}
            disabled={!isConnected}
          >
            Withdraw
          </button>
        )}
      </div>
    </div>
  );
}
