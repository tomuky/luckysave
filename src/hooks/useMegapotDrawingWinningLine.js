"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { base } from "wagmi/chains";

import { MEGAPOT_JACKPOT_ADDRESS } from "@/lib/constants";
import { megapotJackpotAbi } from "@/lib/megapotV2Abi";

export const DRAWING_WINNING_LINE_QUERY_KEY = "megapot-drawing-winning-line";

async function fetchWinningLine(publicClient, drawingId) {
  const state = await publicClient.readContract({
    address: MEGAPOT_JACKPOT_ADDRESS,
    abi: megapotJackpotAbi,
    functionName: "getDrawingState",
    args: [drawingId],
  });
  if (!state?.winningTicket || state.winningTicket === 0n) {
    return null;
  }
  const unpacked = await publicClient.readContract({
    address: MEGAPOT_JACKPOT_ADDRESS,
    abi: megapotJackpotAbi,
    functionName: "getUnpackedTicket",
    args: [drawingId, state.winningTicket],
  });
  const normals = unpacked.normals ?? unpacked[0];
  const bonusball = unpacked.bonusball ?? unpacked[1];
  return {
    drawingId,
    normals,
    bonusball,
  };
}

export default function useMegapotDrawingWinningLine(drawingId) {
  const publicClient = usePublicClient({ chainId: base.id });

  return useQuery({
    queryKey: [DRAWING_WINNING_LINE_QUERY_KEY, drawingId?.toString?.() ?? ""],
    enabled: Boolean(publicClient && drawingId !== undefined && drawingId >= 1n),
    queryFn: () => fetchWinningLine(publicClient, drawingId),
    staleTime: 120_000,
  });
}
