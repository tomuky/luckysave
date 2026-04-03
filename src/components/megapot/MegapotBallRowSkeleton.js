"use client";

import Skeleton from "@/components/Skeleton";
import drawStyles from "@/components/megapot/MegapotDraw.module.css";

/** Same 6-ball footprint as in-panel LotteryBalls (loading placeholder). */
export default function MegapotBallRowSkeleton() {
  return (
    <div className={drawStyles.drawPanelBallSkeletonRow} aria-hidden>
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={drawStyles.drawPanelBallSkeletonCircle}
        />
      ))}
    </div>
  );
}
