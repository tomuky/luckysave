import styles from "@/app/page.module.css";

export default function DepositCard({
  depositAmount,
  onDepositAmountChange,
  onApproveAndDeposit,
  onSwitchChain,
  onWithdraw,
  status,
  canDeposit,
  canWithdraw,
  isOnBase,
  isSwitching,
  isWriting,
}) {
  const primaryDisabled = isOnBase
    ? !canDeposit || isWriting
    : isSwitching;
  const primaryLabel = isOnBase ? "Approve & Deposit" : "Switch to Base";
  const handlePrimaryClick = () => {
    if (isOnBase) {
      onApproveAndDeposit();
      return;
    }
    onSwitchChain?.();
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2>Deposit / Withdraw</h2>
        <span className={styles.muted}>Aave V3 Base</span>
      </div>
      <div className={styles.row}>
        <label className={styles.inputRow}>
          <input
            value={depositAmount}
            onChange={(event) => onDepositAmountChange(event.target.value)}
            placeholder="0.00"
            inputMode="decimal"
          />
          <span className={styles.muted}>USDC</span>
        </label>
        <div className={styles.actions}>
          <button
            className={styles.buttonPrimary}
            disabled={primaryDisabled}
            onClick={handlePrimaryClick}
          >
            {primaryLabel}
          </button>
          <button
            className={styles.buttonSecondary}
            disabled={!canWithdraw || isWriting}
            onClick={onWithdraw}
          >
            Withdraw
          </button>
        </div>
        <div className={styles.muted}>{status || " "}</div>
      </div>
    </div>
  );
}
