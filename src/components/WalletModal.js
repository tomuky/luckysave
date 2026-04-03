import modalStyles from "@/components/ui/Modal.module.css";
import buttonStyles from "@/components/ui/Buttons.module.css";
import textStyles from "@/components/ui/Text.module.css";
import shareStyles from "./ShareReferralButton.module.css";
import ShareReferralButton from "./ShareReferralButton";

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
  shareReferralAddress,
}) {
  return (
    <div className={modalStyles.modalOverlay} onClick={onClose}>
      <div className={modalStyles.modal} onClick={(event) => event.stopPropagation()}>
        <div className={modalStyles.modalHeader}>
          <h3>Wallet</h3>
          <button className={modalStyles.modalClose} onClick={onClose} type="button">
            ×
          </button>
        </div>
        <div className={modalStyles.modalBody}>
          {isConnected ? (
            <>
              <div className={modalStyles.modalAddress}>
                {walletLabel}
                <div className={textStyles.muted}>
                  {isOnBase
                    ? `Connected on ${baseChainName}`
                    : `Connected on ${currentChainName}`}
                </div>
              </div>
              <ShareReferralButton
                variant="modal"
                address={shareReferralAddress}
                disabled={!isOnBase}
                className={shareStyles.shareReferralModalFullWidth}
              />
              {!isOnBase && (
                <button
                  className={buttonStyles.buttonPrimary}
                  onClick={onSwitchChain}
                  disabled={isSwitching}
                >
                  {isSwitching ? "Switching..." : `Switch to ${baseChainName}`}
                </button>
              )}
              <button className={buttonStyles.buttonSecondary} onClick={onDisconnect}>
                Disconnect
              </button>
            </>
          ) : (
            <>
              <div className={textStyles.muted}>
                Connect your wallet to start winning or saving.
              </div>
              <button
                className={buttonStyles.buttonPrimary}
                onClick={onConnect}
                disabled={!connectorReady || isPending}
              >
                {isPending ? "Connecting..." : "Connect wallet"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
