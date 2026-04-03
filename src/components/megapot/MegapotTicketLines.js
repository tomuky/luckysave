"use client";

import { formatUnits } from "viem";

import { USDC_DECIMALS } from "@/lib/constants";
import { currency } from "@/lib/format";
import drawStyles from "@/components/megapot/MegapotDraw.module.css";
import LotteryBalls from "@/components/LotteryBalls";
import MegapotBallRowSkeleton from "@/components/megapot/MegapotBallRowSkeleton";

function TicketLineRow({
  row,
  outcome,
  drawPending,
  winNormals,
  winBonus,
  hideAwaitingPill,
}) {
  const normals = row.normals?.map((x) => Number(x)) ?? [];
  const bonus = Number(row.bonusball);

  const canMatch =
    !drawPending && winNormals?.length === 5 && normals.length === 5;
  const normalMatch = canMatch
    ? normals.map((v, i) => v === winNormals[i])
    : null;
  const bonusMatch =
    canMatch && winBonus !== null ? bonus === winBonus : false;

  const payoutWei = outcome?.payoutWei ? BigInt(outcome.payoutWei) : 0n;
  const payoutLabel =
    payoutWei > 0n
      ? currency.format(Number(formatUnits(payoutWei, USDC_DECIMALS)))
      : null;

  let pill = null;
  if (outcome && !outcome.pending && outcome.isWin && payoutLabel) {
    pill = <span className={drawStyles.ticketPillWin}>Won {payoutLabel}</span>;
  } else if (outcome && !outcome.pending && !outcome.isWin) {
    pill = <span className={drawStyles.ticketPillMuted}>No win</span>;
  } else if (!hideAwaitingPill) {
    pill = <span className={drawStyles.ticketPillMuted}>Awaiting results</span>;
  }

  return (
    <div className={drawStyles.drawPanelLine}>
      {pill ? <div className={drawStyles.ticketLineHeader}>{pill}</div> : null}
      <div className={drawStyles.drawPanelBalls}>
        <LotteryBalls
          normals={normals}
          bonusball={bonus}
          pending={drawPending}
          normalMatch={normalMatch}
          bonusMatch={bonusMatch}
          inPanel
        />
      </div>
    </div>
  );
}

export default function MegapotTicketLines({
  loading,
  tickets,
  outcomesMap,
  drawPending,
  winNormals,
  winBonus,
  hideAwaitingPill,
  activeTicketIndex = 0,
}) {
  const list = tickets ?? [];
  const safeIndex =
    list.length > 1
      ? Math.max(0, Math.min(activeTicketIndex, list.length - 1))
      : 0;
  const rowsToShow =
    list.length > 1 ? [list[safeIndex]] : list;

  return (
    <div className={drawStyles.drawPanelColRight}>
      <div className={drawStyles.drawPanelSectionRight}>
        <div
          className={`${drawStyles.drawPanelTicketsBody} ${
            !loading && !list.length ? drawStyles.drawPanelTicketsBodyEmpty : ""
          }`}
        >
          {loading ? (
            <div className={drawStyles.drawPanelLine}>
              <div className={drawStyles.drawPanelBalls}>
                <MegapotBallRowSkeleton />
              </div>
            </div>
          ) : !list.length ? (
            <p className={drawStyles.drawPanelEmptyTickets}>
              No tickets for this drawing.
            </p>
          ) : (
            <div className={drawStyles.drawPanelLines}>
              {rowsToShow.map((row) => (
                <TicketLineRow
                  key={row.ticketId.toString()}
                  row={row}
                  outcome={outcomesMap?.[row.ticketId.toString()]}
                  drawPending={drawPending}
                  winNormals={winNormals}
                  winBonus={winBonus}
                  hideAwaitingPill={hideAwaitingPill}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
