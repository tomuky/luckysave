"use client";

import drawStyles from "@/components/megapot/MegapotDraw.module.css";
import LotteryBalls from "@/components/LotteryBalls";
import MegapotBallRowSkeleton from "@/components/megapot/MegapotBallRowSkeleton";

/** Per-ball match vs winning draw: value appears in winning normals (order-independent). */
function matchNormalsToWinning(normals, winNormals) {
  const pool = new Map();
  for (const w of winNormals) {
    pool.set(w, (pool.get(w) ?? 0) + 1);
  }
  return normals.map((v) => {
    const n = pool.get(v) ?? 0;
    if (n > 0) {
      pool.set(v, n - 1);
      return true;
    }
    return false;
  });
}

function TicketLineRow({
  row,
  outcome,
  drawPending,
  winNormals,
  winBonus,
}) {
  const normals = row.normals?.map((x) => Number(x)) ?? [];
  const bonus = Number(row.bonusball);

  const canMatch =
    !drawPending && winNormals?.length === 5 && normals.length === 5;
  const normalMatch = canMatch
    ? matchNormalsToWinning(normals, winNormals)
    : null;
  const bonusMatch =
    canMatch && winBonus !== null ? bonus === winBonus : false;
  const bonusComparable = Boolean(canMatch && winBonus !== null);

  const settled = outcome && !outcome.pending;
  let outcomeClass = drawStyles.ticketLineOutcomePending;
  if (settled) {
    outcomeClass = outcome.isWin
      ? drawStyles.ticketLineOutcomeWin
      : drawStyles.ticketLineOutcomeLoss;
  }

  return (
    <div className={`${drawStyles.drawPanelLine} ${outcomeClass}`}>
      <div className={drawStyles.drawPanelBalls}>
        <LotteryBalls
          normals={normals}
          bonusball={bonus}
          pending={drawPending}
          normalMatch={normalMatch}
          bonusMatch={bonusMatch}
          bonusComparable={bonusComparable}
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
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
