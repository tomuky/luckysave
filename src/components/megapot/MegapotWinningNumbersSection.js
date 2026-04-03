"use client";

import textStyles from "@/components/ui/Text.module.css";
import drawStyles from "@/components/megapot/MegapotDraw.module.css";
import LotteryBalls from "@/components/LotteryBalls";
import Skeleton from "@/components/Skeleton";

export default function MegapotWinningNumbersSection({
  loading,
  winningLine,
  isOpenRound,
}) {
  return (
    <div className={drawStyles.drawPanelColLeft}>
      <div className={drawStyles.drawPanelSectionLeft}>
        <div className={drawStyles.drawPanelWinningBody}>
          {loading ? (
            <Skeleton variant="heading" width="180px" />
          ) : winningLine ? (
            <div className={drawStyles.drawPanelBalls}>
              <LotteryBalls
                normals={winningLine.normals?.map((x) => Number(x))}
                bonusball={Number(winningLine.bonusball)}
                inPanel
              />
            </div>
          ) : isOpenRound ? (
            <div className={drawStyles.drawPanelBalls}>
              <LotteryBalls placeholders inPanel />
            </div>
          ) : (
            <p className={textStyles.muted}>No results for this draw.</p>
          )}
        </div>
      </div>
    </div>
  );
}
