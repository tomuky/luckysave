import styles from "@/app/page.module.css";

export default function WalletModal({
  isConnected,
  walletLabel,
  isOnBase,
  baseChainName,
  currentChainName,
  isSwitching,
  onSwitchChain,
  onClose,
  onConnect,
  onDisconnect,
  isPending,
  connectorReady,
  usdcAddress,
  aavePoolAddress,
}) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Wallet</h3>
          <button className={styles.modalClose} onClick={onClose} type="button">
            ×
          </button>
        </div>
        <div className={styles.modalBody}>
          {isConnected ? (
            <>
              <div className={styles.modalAddress}>
                {walletLabel}
                <div className={styles.muted}>
                  {isOnBase
                    ? `Connected on ${baseChainName}`
                    : `Connected on ${currentChainName}`}
                </div>
              </div>
              {!isOnBase && (
                <button
                  className={styles.buttonPrimary}
                  onClick={onSwitchChain}
                  disabled={isSwitching}
                >
                  {isSwitching ? "Switching..." : `Switch to ${baseChainName}`}
                </button>
              )}
              <button className={styles.buttonSecondary} onClick={onDisconnect}>
                Disconnect
              </button>
            </>
          ) : (
            <>
              <div className={styles.muted}>
                Connect your wallet to start saving.
              </div>
              <button
                className={styles.buttonPrimary}
                onClick={onConnect}
                disabled={!connectorReady || isPending}
              >
                {isPending ? "Connecting..." : "Connect wallet"}
              </button>
            </>
          )}
          <div className={styles.muted}>
            USDC: {usdcAddress.slice(0, 10)}... | Aave Pool:{" "}
            {aavePoolAddress.slice(0, 10)}...
          </div>
        </div>
      </div>
    </div>
  );
}
