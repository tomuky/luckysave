"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useReadContract } from "wagmi";
import { base } from "wagmi/chains";

import { MEGAPOT_JACKPOT_ADDRESS, MEGAPOT_TICKET_NFT_ADDRESS } from "@/lib/constants";
import { megapotJackpotAbi, megapotTicketNftAbi } from "@/lib/megapotV2Abi";
import useMegapotLatestWinning from "@/hooks/useMegapotLatestWinning";
import useMegapotDrawingWinningLine from "@/hooks/useMegapotDrawingWinningLine";
import useMegapotSettledNeighbors from "@/hooks/useMegapotSettledNeighbors";
import useMegapotTicketOutcomes from "@/hooks/useMegapotTicketOutcomes";

/**
 * Viewing draw id, winning line, user tickets, outcomes, and neighbor navigation.
 */
export default function useMegapotViewingDraw({
  address,
  isOnBase,
  currentDrawingId,
}) {
  const { data: latestWin } = useMegapotLatestWinning(currentDrawingId);

  const newestSettledId = latestWin?.drawingId;

  const [viewingDrawingId, setViewingDrawingId] = useState(undefined);
  const prevCurrentDrawingIdRef = useRef(undefined);

  useEffect(() => {
    if (currentDrawingId === undefined) return;
    const prev = prevCurrentDrawingIdRef.current;
    prevCurrentDrawingIdRef.current = currentDrawingId;
    setViewingDrawingId((v) => {
      if (v === undefined) return currentDrawingId;
      if (prev !== undefined && currentDrawingId > prev) return currentDrawingId;
      return v;
    });
  }, [currentDrawingId]);

  const { data: winningLine, isLoading: loadingWinningLine } =
    useMegapotDrawingWinningLine(viewingDrawingId);

  const { data: viewingDrawingState, isLoading: loadingViewingState } =
    useReadContract({
      chainId: base.id,
      address: MEGAPOT_JACKPOT_ADDRESS,
      abi: megapotJackpotAbi,
      functionName: "getDrawingState",
      args:
        viewingDrawingId !== undefined ? [viewingDrawingId] : undefined,
      query: {
        enabled: Boolean(
          viewingDrawingId !== undefined && viewingDrawingId >= 1n
        ),
      },
    });

  const { data: neighbors } = useMegapotSettledNeighbors(
    viewingDrawingId,
    newestSettledId,
    currentDrawingId
  );

  const { data: myTickets, isLoading: loadingMyTickets } = useReadContract({
    chainId: base.id,
    address: MEGAPOT_TICKET_NFT_ADDRESS,
    abi: megapotTicketNftAbi,
    functionName: "getUserTickets",
    args:
      address && viewingDrawingId !== undefined
        ? [address, viewingDrawingId]
        : undefined,
    query: {
      enabled: Boolean(address && isOnBase && viewingDrawingId !== undefined),
    },
  });

  const { data: ticketOutcomeData } = useMegapotTicketOutcomes(
    address,
    viewingDrawingId,
    myTickets
  );

  const outcomesMap = ticketOutcomeData?.outcomes;

  const drawPending = useMemo(() => {
    if (!outcomesMap) return true;
    const first = Object.values(outcomesMap)[0];
    return Boolean(first?.pending);
  }, [outcomesMap]);

  const winNormals = winningLine?.normals?.map((x) => Number(x));
  const winBonus = winningLine?.bonusball
    ? Number(winningLine.bonusball)
    : null;

  const goPrev = () => {
    if (neighbors?.prev) setViewingDrawingId(neighbors.prev);
  };

  const goNext = () => {
    if (neighbors?.next) setViewingDrawingId(neighbors.next);
  };

  const viewingDrawingTime = viewingDrawingState?.drawingTime;

  return {
    viewingDrawingId,
    loadingWinningLine,
    winningLine,
    viewingDrawingTime,
    loadingViewingState,
    loadingMyTickets,
    myTickets,
    outcomesMap,
    drawPending,
    winNormals,
    winBonus,
    canDrawPrev: Boolean(neighbors?.prev),
    canDrawNext: Boolean(neighbors?.next),
    goPrev,
    goNext,
  };
}
