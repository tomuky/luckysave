"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { base } from "wagmi/chains";

import { MEGAPOT_JACKPOT_ADDRESS } from "@/lib/constants";
import { megapotJackpotAbi } from "@/lib/megapotV2Abi";

async function fetchLatestWinning(publicClient, currentDrawingId) {
  if (currentDrawingId === undefined || currentDrawingId < 2n) return null;

  let id = currentDrawingId - 1n;
  let steps = 0;
  while (id >= 1n && steps < 20) {
    const state = await publicClient.readContract({
      address: MEGAPOT_JACKPOT_ADDRESS,
      abi: megapotJackpotAbi,
      functionName: "getDrawingState",
      args: [id],
    });
    if (state.winningTicket && state.winningTicket !== 0n) {
      const unpacked = await publicClient.readContract({
        address: MEGAPOT_JACKPOT_ADDRESS,
        abi: megapotJackpotAbi,
        functionName: "getUnpackedTicket",
        args: [id, state.winningTicket],
      });
      const normals = unpacked.normals ?? unpacked[0];
      const bonusball = unpacked.bonusball ?? unpacked[1];
      return {
        drawingId: id,
        drawingTime: state.drawingTime,
        normals,
        bonusball,
      };
    }
    id -= 1n;
    steps += 1;
  }
  return null;
}

export default function useMegapotLatestWinning(currentDrawingId) {
  const publicClient = usePublicClient({ chainId: base.id });

  return useQuery({
    queryKey: ["megapot-latest-winning", currentDrawingId?.toString?.() ?? ""],
    enabled: Boolean(publicClient && currentDrawingId !== undefined && currentDrawingId >= 2n),
    queryFn: () => fetchLatestWinning(publicClient, currentDrawingId),
    staleTime: 60_000,
  });
}
