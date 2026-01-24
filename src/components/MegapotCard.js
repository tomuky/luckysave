import styles from "@/app/page.module.css";

export default function MegapotCard({
  entryAmount,
  onEntryAmountChange,
  countdown,
  entered,
  lastResult,
  onEnter,
  status,
  canEnter,
  isWriting,
}) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2>Megapot entry</h2>
        <span className={`${styles.pill} ${entered ? "" : styles.warning}`}>
          {entered ? "Entered" : "Not entered"}
        </span>
      </div>
      <label className={styles.inputRow}>
        <input
          value={entryAmount}
          onChange={(event) => onEntryAmountChange(event.target.value)}
          placeholder="0.00"
          inputMode="decimal"
        />
        <span className={styles.muted}>USDC</span>
      </label>
      <div className={styles.split}>
        <div>
          <div className={styles.muted}>Next draw</div>
          <div className={styles.countdown}>{countdown}</div>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.buttonPrimary}
            disabled={!canEnter || isWriting}
            onClick={onEnter}
          >
            Enter Megapot
          </button>
        </div>
      </div>
      <div className={styles.row}>
        <div className={styles.muted}>
          {lastResult || "No wins to claim"}
        </div>
      </div>
      <div className={styles.muted}>{status || " "}</div>
    </div>
  );
}
