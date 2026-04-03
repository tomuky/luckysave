"use client";

import buttonStyles from "@/components/ui/Buttons.module.css";
import textStyles from "@/components/ui/Text.module.css";
import drawStyles from "@/components/megapot/MegapotDraw.module.css";
import { SparkleIcon } from "@/components/Icons";

export default function MegapotDrawClaimStrip({
  hasWinnings,
  claimScanLoading,
  winningsLabel,
  onClaimClick,
  isWriting,
}) {
  if (!hasWinnings && !claimScanLoading) return null;

  return (
    <div className={drawStyles.drawPanelClaimStrip}>
      {hasWinnings ? (
        <div className={drawStyles.winningsAlert}>
          <div className={drawStyles.winningsInfo}>
            <SparkleIcon size={16} className={drawStyles.winningsIcon} />
            <span>
              <strong>{winningsLabel}</strong> to claim
            </span>
          </div>
          <button
            className={buttonStyles.buttonSmall}
            onClick={onClaimClick}
            disabled={isWriting}
            type="button"
          >
            Claim
          </button>
        </div>
      ) : (
        <p className={textStyles.mutedSmall}>Checking for winnings…</p>
      )}
    </div>
  );
}
