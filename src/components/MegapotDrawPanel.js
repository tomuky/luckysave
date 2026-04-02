"use client";

import { useEffect, useMemo, useState } from "react";
import { formatUnits } from "viem";
import { useReadContract } from "wagmi";
import { base } from "wagmi/chains";

import { MEGAPOT_TICKET_NFT_ADDRESS, USDC_DECIMALS } from "@/lib/constants";
import { megapotTicketNftAbi } from "@/lib/megapotV2Abi";
import { currency } from "@/lib/format";
import styles from "@/app/page.module.css";
import LotteryBalls from "./LotteryBalls";
import Skeleton from "./Skeleton";
import { ChevronLeftIcon, ChevronRightIcon, SparkleIcon } from "./Icons";
import useMegapotLatestWinning from "@/hooks/useMegapotLatestWinning";
import useMegapotDrawingWinningLine from "@/hooks/useMegapotDrawingWinningLine";
import useMegapotUserTicketDrawingIds from "@/hooks/useMegapotUserTicketDrawingIds";
import useMegapotSettledNeighbors from "@/hooks/useMegapotSettledNeighbors";
import useMegapotTicketOutcomes from "@/hooks/useMegapotTicketOutcomes";

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
  const { data: latestWin, isLoading: loadingLatestMeta } =
    useMegapotLatestWinning(currentDrawingId);

  const newestSettledId = latestWin?.drawingId;

  const [resultsDrawingId, setResultsDrawingId] = useState(undefined);

  useEffect(() => {
    if (newestSettledId !== undefined) {
      setResultsDrawingId(newestSettledId);
    }
  }, [newestSettledId]);

  const { data: resultsWinLine, isLoading: loadingResultsWin } =
    useMegapotDrawingWinningLine(resultsDrawingId);

  const { data: neighbors } = useMegapotSettledNeighbors(
    resultsDrawingId,
    newestSettledId
  );

  const {
    data: ticketDrawingIds,
    isLoading: loadingTicketIds,
  } = useMegapotUserTicketDrawingIds(address, currentDrawingId);

  const [ticketIndex, setTicketIndex] = useState(0);

  useEffect(() => {
    if (!ticketDrawingIds?.length) return;
    setTicketIndex((i) => Math.min(i, ticketDrawingIds.length - 1));
  }, [ticketDrawingIds]);

  const selectedTicketDrawingId = ticketDrawingIds?.[ticketIndex];

  const { data: selectedTickets, isLoading: loadingSelectedTickets } =
    useReadContract({
      chainId: base.id,
      address: MEGAPOT_TICKET_NFT_ADDRESS,
      abi: megapotTicketNftAbi,
      functionName: "getUserTickets",
      args:
        address && selectedTicketDrawingId !== undefined
          ? [address, selectedTicketDrawingId]
          : undefined,
      query: {
        enabled: Boolean(
          address && isOnBase && selectedTicketDrawingId !== undefined
        ),
      },
    });

  const { data: ticketOutcomeData } = useMegapotTicketOutcomes(
    address,
    selectedTicketDrawingId,
    selectedTickets
  );

  const { data: ticketWinLine } = useMegapotDrawingWinningLine(
    selectedTicketDrawingId
  );

  const outcomesMap = ticketOutcomeData?.outcomes;

  const drawPending = useMemo(() => {
    if (!outcomesMap) return true;
    const first = Object.values(outcomesMap)[0];
    return Boolean(first?.pending);
  }, [outcomesMap]);

  const winNormals = ticketWinLine?.normals?.map((x) => Number(x));
  const winBonus = ticketWinLine?.bonusball
    ? Number(ticketWinLine.bonusball)
    : null;

  const canResultsPrev = Boolean(neighbors?.prev);
  const canResultsNext = Boolean(neighbors?.next);

  const canTicketsOlder =
    ticketDrawingIds &&
    ticketIndex < ticketDrawingIds.length - 1;
  const canTicketsNewer = ticketIndex > 0;

  if (!isConnected || !isOnBase) {
    return (
      <div className={`${styles.card} ${styles.cardFullWidth}`}>
        <h3 className={styles.drawPanelTitle}>Lottery</h3>
        <p className={styles.muted}>Connect on Base to see results and your lines.</p>
      </div>
    );
  }

  return (
    <div className={styles.drawPanelRow}>
      {(hasWinnings || claimScanLoading) && (
        <div className={styles.drawPanelClaimStrip}>
          {hasWinnings ? (
            <div className={styles.winningsAlert}>
              <div className={styles.winningsInfo}>
                <SparkleIcon size={16} className={styles.winningsIcon} />
                <span>
                  <strong>{winningsLabel}</strong> to claim
                </span>
              </div>
              <button
                className={styles.buttonSmall}
                onClick={onClaimClick}
                disabled={isWriting}
                type="button"
              >
                Claim
              </button>
            </div>
          ) : (
            <p className={styles.mutedSmall}>Checking for winnings…</p>
          )}
        </div>
      )}

      <div className={styles.drawPanelTwoCards}>
        <div className={styles.card}>
          <h2 className={styles.drawPanelTitle}>Lottery results</h2>

          <div className={styles.drawCarousel}>
            <button
              type="button"
              className={styles.drawCarouselNav}
              onClick={() => neighbors?.prev && setResultsDrawingId(neighbors.prev)}
              disabled={!canResultsPrev}
              aria-label="Older draw"
            >
              <ChevronLeftIcon size={20} />
            </button>

            <div className={styles.drawCarouselViewport}>
              {loadingLatestMeta && !resultsDrawingId ? (
                <Skeleton variant="heading" width="200px" />
              ) : (
                <div
                  key={resultsDrawingId?.toString?.() ?? "0"}
                  className={styles.drawCarouselSlide}
                >
                  {loadingResultsWin ? (
                    <Skeleton variant="heading" width="180px" />
                  ) : resultsWinLine ? (
                    <>
                      <p className={styles.drawPanelDrawId}>
                        Draw #{resultsWinLine.drawingId.toString()}
                      </p>
                      <div className={styles.drawPanelBalls}>
                        <LotteryBalls
                          normals={resultsWinLine.normals?.map((x) => Number(x))}
                          bonusball={Number(resultsWinLine.bonusball)}
                        />
                      </div>
                    </>
                  ) : (
                    <p className={styles.muted}>No settled draw loaded.</p>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              className={styles.drawCarouselNav}
              onClick={() => neighbors?.next && setResultsDrawingId(neighbors.next)}
              disabled={!canResultsNext}
              aria-label="Newer draw"
            >
              <ChevronRightIcon size={20} />
            </button>
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.drawPanelTitle}>My tickets</h2>

          <div className={styles.drawCarousel}>
            <button
              type="button"
              className={styles.drawCarouselNav}
              onClick={() => canTicketsOlder && setTicketIndex((i) => i + 1)}
              disabled={!canTicketsOlder}
              aria-label="Older draw with tickets"
            >
              <ChevronLeftIcon size={20} />
            </button>

            <div className={styles.drawCarouselViewport}>
              {loadingTicketIds || !ticketDrawingIds ? (
                <Skeleton variant="heading" width="200px" />
              ) : !ticketDrawingIds.length ? (
                <p className={styles.muted}>
                  No tickets in the last 60 draws. Buy tickets to enter the next
                  draw.
                </p>
              ) : loadingSelectedTickets ? (
                <Skeleton variant="heading" width="180px" />
              ) : (
                <div
                  key={selectedTicketDrawingId?.toString?.() ?? "0"}
                  className={styles.drawCarouselSlide}
                >
                  <p className={styles.drawPanelDrawId}>
                    Draw #{selectedTicketDrawingId?.toString?.() ?? "—"}
                  </p>

                  <div className={styles.drawPanelLines}>
                    {selectedTickets?.map((row) => {
                      const normals = row.normals?.map((x) => Number(x)) ?? [];
                      const bonus = Number(row.bonusball);
                      const oid = row.ticketId.toString();
                      const oc = outcomesMap?.[oid];
                      const canMatch =
                        !drawPending &&
                        winNormals?.length === 5 &&
                        normals.length === 5;
                      const normalMatch = canMatch
                        ? normals.map((v, i) => v === winNormals[i])
                        : null;
                      const bonusMatch = canMatch && winBonus !== null
                        ? bonus === winBonus
                        : false;

                      const payoutWei = oc?.payoutWei
                        ? BigInt(oc.payoutWei)
                        : 0n;
                      const payoutLabel =
                        payoutWei > 0n
                          ? currency.format(
                              Number(
                                formatUnits(payoutWei, USDC_DECIMALS)
                              )
                            )
                          : null;

                      return (
                        <div
                          key={oid}
                          className={styles.drawPanelLine}
                        >
                          <div className={styles.ticketLineHeader}>
                            {oc && !oc.pending && oc.isWin && payoutLabel ? (
                              <span className={styles.ticketPillWin}>
                                Won {payoutLabel}
                              </span>
                            ) : oc && !oc.pending && !oc.isWin ? (
                              <span className={styles.ticketPillMuted}>
                                No win
                              </span>
                            ) : (
                              <span className={styles.ticketPillMuted}>
                                Awaiting results
                              </span>
                            )}
                          </div>
                          <div className={styles.drawPanelBalls}>
                            <LotteryBalls
                              normals={normals}
                              bonusball={bonus}
                              pending={drawPending}
                              normalMatch={normalMatch}
                              bonusMatch={bonusMatch}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              className={styles.drawCarouselNav}
              onClick={() => canTicketsNewer && setTicketIndex((i) => i - 1)}
              disabled={!canTicketsNewer}
              aria-label="Newer draw with tickets"
            >
              <ChevronRightIcon size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
