"use client";

import { formatDrawingDateTimeLine } from "@/lib/format";
import drawStyles from "@/components/megapot/MegapotDraw.module.css";
import Skeleton from "@/components/Skeleton";

export default function MegapotDrawPicker({
  drawingId,
  drawingTime,
  loadingId,
  loadingSchedule,
}) {
  const schedule =
    drawingTime !== undefined && drawingTime !== null
      ? formatDrawingDateTimeLine(drawingTime)
      : null;

  return (
    <div className={drawStyles.drawPanelHeading}>
      {loadingId || drawingId === undefined ? (
        <div className={drawStyles.drawPanelHeadingRow}>
          <Skeleton variant="heading" width="100px" />
          <Skeleton
            variant="text"
            width="240px"
            className={drawStyles.drawPanelScheduleSkeleton}
          />
        </div>
      ) : (
        <div className={drawStyles.drawPanelHeadingRow}>
          <h3 className={drawStyles.drawPanelDrawTitle}>
            Draw #{drawingId.toString()}
          </h3>
          {loadingSchedule ? (
            <Skeleton
              variant="text"
              width="260px"
              className={drawStyles.drawPanelScheduleSkeleton}
            />
          ) : schedule ? (
            <p className={drawStyles.drawPanelDrawSchedule}>{schedule}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
