"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { base } from "wagmi/chains";
import { formatUnits } from "viem";

import {
  MEGAPOT_JACKPOT_ADDRESS,
  MEGAPOT_TICKET_NFT_ADDRESS,
  USDC_DECIMALS,
} from "@/lib/constants";
import { megapotNetClaimWei } from "@/lib/megapotWinnings";
import { megapotJackpotAbi, megapotTicketNftAbi } from "@/lib/megapotV2Abi";

/**
 * @param {import('viem').PublicClient} publicClient
 * @param {`0x${string}`} userAddress
 * @param {bigint[]} drawingIds
 */
async function scanDrawingsForClaims(publicClient, userAddress, drawingIds) {
  const ticketIds = [];
  let totalWei = 0n;
  const byDrawing = [];

  for (const drawingId of drawingIds) {
    if (drawingId < 1n) continue;

    const state = await publicClient.readContract({
      address: MEGAPOT_JACKPOT_ADDRESS,
      abi: megapotJackpotAbi,
      functionName: "getDrawingState",
      args: [drawingId],
    });

    if (!state.winningTicket || state.winningTicket === 0n) continue;

    const rows = await publicClient.readContract({
      address: MEGAPOT_TICKET_NFT_ADDRESS,
      abi: megapotTicketNftAbi,
      functionName: "getUserTickets",
      args: [userAddress, drawingId],
    });

    if (!rows?.length) continue;

    const ids = rows.map((r) => r.ticketId);
    const tierIds = await publicClient.readContract({
      address: MEGAPOT_JACKPOT_ADDRESS,
      abi: megapotJackpotAbi,
      functionName: "getTicketTierIds",
      args: [ids],
    });

    const payouts = await publicClient.readContract({
      address: MEGAPOT_JACKPOT_ADDRESS,
      abi: megapotJackpotAbi,
      functionName: "getDrawingTierPayouts",
      args: [drawingId],
    });

    const refShare = state.referralWinShare ?? 0n;
    let drawTotal = 0n;
    const winning = [];
    for (let j = 0; j < ids.length; j++) {
      const tid = Number(tierIds[j]);
      if (tid > 0 && tid < 12) {
        const gross = payouts[tid];
        const net = megapotNetClaimWei(gross, refShare);
        totalWei += net;
        drawTotal += net;
        ticketIds.push(ids[j]);
        winning.push({ ticketId: ids[j], tierId: tid, payout: net });
      }
    }

    if (winning.length) {
      byDrawing.push({ drawingId, tickets: winning, subtotal: drawTotal });
    }
  }

  return {
    ticketIds,
    totalWei,
    totalLabel: formatUnits(totalWei, USDC_DECIMALS),
    byDrawing,
  };
}

/**
 * Only runs when `drawingIds` is non-empty (parent controls: latest draw you
 * entered, or past week after user clicks).
 */
export default function useMegapotClaimScan({
  address,
  drawingIds,
  enabled,
}) {
  const publicClient = usePublicClient({ chainId: base.id });

  const key = drawingIds?.map((id) => id.toString()).join(",") ?? "";

  return useQuery({
    queryKey: ["megapot-claim-scan", address, key],
    enabled: Boolean(address && publicClient && enabled && drawingIds?.length),
    queryFn: () =>
      scanDrawingsForClaims(publicClient, address, drawingIds),
    staleTime: 60_000,
  });
}
