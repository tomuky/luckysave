import styles from "@/app/page.module.css";

export default function BalancesCard({
  usdcBalanceLabel,
  depositedLabel,
  totalValueLabel,
  supplyApyLabel,
}) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2>Balances</h2>
        <span className={styles.pill}>{supplyApyLabel} APY</span>
      </div>
      <div className={styles.balanceStack}>
        <div className={styles.balanceRow}>
          <span className={styles.muted}>Wallet USDC</span>
          <strong>{usdcBalanceLabel}</strong>
        </div>
        <div className={styles.balanceRow}>
          <span className={styles.muted}>Earning in Aave</span>
          <strong>{depositedLabel}</strong>
        </div>
        <div className={`${styles.balanceRow} ${styles.balanceRowTotal}`}>
          <span>Total Value</span>
          <strong>{totalValueLabel}</strong>
        </div>
      </div>
      <div className={styles.muted}>
        Live balances from Base. Deposited USDC earns yield automatically.
      </div>
    </div>
  );
}
