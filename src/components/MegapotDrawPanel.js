"use client";

import { useState } from "react";

import cardStyles from "@/components/ui/Card.module.css";
import drawStyles from "@/components/megapot/MegapotDraw.module.css";
import useMegapotViewingDraw from "@/hooks/useMegapotViewingDraw";
import MegapotDrawClaimStrip from "@/components/megapot/MegapotDrawClaimStrip";
import MegapotDrawPanelDisconnected from "@/components/megapot/MegapotDrawPanelDisconnected";
import MegapotDrawPicker from "@/components/megapot/MegapotDrawPicker";
import MegapotWinningNumbersSection from "@/components/megapot/MegapotWinningNumbersSection";
import MegapotTicketLines from "@/components/megapot/MegapotTicketLines";
import MegapotTicketPager from "@/components/megapot/MegapotTicketPager";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/Icons";

export default function MegapotDrawPanel({
  address,
  isConnected,
  isOnBase,
  currentDrawingId,
  focusOpenDrawKey,
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
    focusOpenDrawKey,
  });

  const loadingDrawHeader =
    currentDrawingId === undefined || draw.viewingDrawingId === undefined;

  const isOpenRound =
    draw.viewingDrawingId !== undefined &&
    currentDrawingId !== undefined &&
    draw.viewingDrawingId === currentDrawingId;

  const tickets = draw.myTickets ?? [];
  const ticketCount = tickets.length;
  const [ticketPage, setTicketPage] = useState(0);
  const [prevViewingDrawId, setPrevViewingDrawId] = useState(
    draw.viewingDrawingId,
  );
  const [prevTicketCount, setPrevTicketCount] = useState(ticketCount);

  if (draw.viewingDrawingId !== prevViewingDrawId) {
    setPrevViewingDrawId(draw.viewingDrawingId);
    setPrevTicketCount(ticketCount);
    setTicketPage(0);
  } else if (ticketCount !== prevTicketCount) {
    setPrevTicketCount(ticketCount);
    setTicketPage((p) => Math.min(p, Math.max(0, ticketCount - 1)));
  }

  const showTicketPager =
    !draw.loadingMyTickets && ticketCount > 1;

  const renderTicketPager = () =>
    showTicketPager ? (
      <MegapotTicketPager
        page={ticketPage}
        total={ticketCount}
        onPrev={() => setTicketPage((p) => Math.max(0, p - 1))}
        onNext={() =>
          setTicketPage((p) => Math.min(ticketCount - 1, p + 1))
        }
      />
    ) : null;

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
          <MegapotDrawPicker
            drawingId={draw.viewingDrawingId}
            drawingTime={draw.viewingDrawingTime}
            loadingId={loadingDrawHeader}
            loadingSchedule={draw.loadingViewingState}
          />

          <div className={drawStyles.drawPanelBody}>
            <div className={drawStyles.drawPanelLabelRow}>
              <h3 className={drawStyles.drawPanelSubtitle}>Winning numbers</h3>
              <div
                className={`${drawStyles.drawPanelLabelRowSecond} ${drawStyles.drawPanelTicketsLabelRow}`}
              >
                <h3 className={drawStyles.drawPanelSubtitle}>Your tickets</h3>
                {renderTicketPager()}
              </div>
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
                <div
                  className={`${drawStyles.drawPanelTicketsLabelRowMobile} ${drawStyles.drawPanelSubtitleMobileOnly}`}
                >
                  <h3 className={drawStyles.drawPanelSubtitle}>Your tickets</h3>
                  {renderTicketPager()}
                </div>
                <MegapotTicketLines
                  loading={draw.loadingMyTickets}
                  tickets={draw.myTickets}
                  outcomesMap={draw.outcomesMap}
                  drawPending={draw.drawPending}
                  winNormals={draw.winNormals}
                  winBonus={draw.winBonus}
                  activeTicketIndex={ticketPage}
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
