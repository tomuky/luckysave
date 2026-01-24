import styles from "@/app/page.module.css";

export default function Header({
  isConnected,
  walletLabel,
  walletBalanceLabel,
  isOnBase,
  currentChainName,
  baseChainName,
  isSwitching,
  onSwitchChain,
  onWalletClick,
}) {
  const showNetworkAction = isConnected && !isOnBase;

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <div className={styles.logoMark}>LuckySave</div>
      </div>
      <div className={styles.headerActions}>
        {showNetworkAction && (
          <div className={styles.networkNotice}>
            <span className={styles.networkLabel}>
              Connected on {currentChainName}
            </span>
            <button
              className={styles.networkButton}
              onClick={onSwitchChain}
              disabled={isSwitching}
              type="button"
            >
              {isSwitching ? "Switching..." : `Switch to ${baseChainName}`}
            </button>
          </div>
        )}
        <button
          className={styles.walletPill}
          onClick={onWalletClick}
          type="button"
        >
          <span className={styles.walletLabel}>
            {isConnected ? walletLabel : "Connect wallet"}
          </span>
          <span className={styles.walletBalance}>
            {isConnected ? walletBalanceLabel : "$0.00"}
          </span>
          <span className={styles.walletCaret} />
        </button>
      </div>
    </header>
  );
}
