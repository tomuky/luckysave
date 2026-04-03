"use client";

import cardStyles from "@/components/ui/Card.module.css";
import drawStyles from "@/components/megapot/MegapotDraw.module.css";
import useMegapotViewingDraw from "@/hooks/useMegapotViewingDraw";
import MegapotDrawClaimStrip from "@/components/megapot/MegapotDrawClaimStrip";
import MegapotDrawPanelDisconnected from "@/components/megapot/MegapotDrawPanelDisconnected";
import MegapotDrawPicker from "@/components/megapot/MegapotDrawPicker";
import MegapotWinningNumbersSection from "@/components/megapot/MegapotWinningNumbersSection";
import MegapotTicketLines from "@/components/megapot/MegapotTicketLines";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/Icons";

export default function MegapotDrawPanel({
  address,
  isConnected,
  isOnBase,
  currentDrawingId,
  hasWinnings,
  winningsLabel,
  onClaimClick,
  isWriting,
  claimScanLoading,
}) {
  const draw = useMegapotViewingDraw({
    address,
    isOnBase,
    currentDrawingId,
  });

  const loadingDrawHeader =
    currentDrawingId === undefined || draw.viewingDrawingId === undefined;

  const isOpenRound =
    draw.viewingDrawingId !== undefined &&
    currentDrawingId !== undefined &&
    draw.viewingDrawingId === currentDrawingId;

  if (!isConnected || !isOnBase) {
    return <MegapotDrawPanelDisconnected />;
  }

  return (
    <div className={drawStyles.drawPanelRow}>
      <MegapotDrawClaimStrip
        hasWinnings={hasWinnings}
        claimScanLoading={claimScanLoading}
        winningsLabel={winningsLabel}
        onClaimClick={onClaimClick}
        isWriting={isWriting}
      />

      <div className={`${cardStyles.card} ${drawStyles.drawPanelCard}`}>
        <button
          type="button"
          className={drawStyles.drawPanelRail}
          onClick={draw.goPrev}
          disabled={!draw.canDrawPrev}
          aria-label="Older drawing"
        >
          <ChevronLeftIcon size={22} />
        </button>

        <div className={drawStyles.drawPanelMain}>
          <div className={cardStyles.cardHeader}>
            <h2>Lottery Results</h2>
          </div>

          <MegapotDrawPicker
            drawingId={draw.viewingDrawingId}
            drawingTime={draw.viewingDrawingTime}
            loadingId={loadingDrawHeader}
            loadingSchedule={draw.loadingViewingState}
          />

          <div className={drawStyles.drawPanelBody}>
            <div className={drawStyles.drawPanelLabelRow}>
              <h3 className={drawStyles.drawPanelSubtitle}>Winning numbers</h3>
              <h3
                className={`${drawStyles.drawPanelSubtitle} ${drawStyles.drawPanelLabelRowSecond}`}
              >
                Your tickets
              </h3>
            </div>
            <div className={drawStyles.drawPanelGrid}>
              <div className={drawStyles.drawPanelColWrap}>
                <h3
                  className={`${drawStyles.drawPanelSubtitle} ${drawStyles.drawPanelSubtitleMobileOnly}`}
                >
                  Winning numbers
                </h3>
                <MegapotWinningNumbersSection
                  loading={draw.loadingWinningLine}
                  winningLine={draw.winningLine}
                  isOpenRound={isOpenRound}
                />
              </div>
              <div className={drawStyles.drawPanelColWrap}>
                <h3
                  className={`${drawStyles.drawPanelSubtitle} ${drawStyles.drawPanelSubtitleMobileOnly}`}
                >
                  Your tickets
                </h3>
                <MegapotTicketLines
                  loading={draw.loadingMyTickets}
                  tickets={draw.myTickets}
                  outcomesMap={draw.outcomesMap}
                  drawPending={draw.drawPending}
                  winNormals={draw.winNormals}
                  winBonus={draw.winBonus}
                  hideAwaitingPill={isOpenRound}
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          className={drawStyles.drawPanelRail}
          onClick={draw.goNext}
          disabled={!draw.canDrawNext}
          aria-label="Newer drawing"
        >
          <ChevronRightIcon size={22} />
        </button>
      </div>
    </div>
  );
}
