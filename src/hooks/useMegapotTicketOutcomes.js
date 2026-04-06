"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { base } from "wagmi/chains";

import { MEGAPOT_JACKPOT_ADDRESS } from "@/lib/constants";
import { megapotNetClaimWei } from "@/lib/megapotWinnings";
import { megapotJackpotAbi } from "@/lib/megapotV2Abi";
import {
  mergeDrawingOutcomesIntoCache,
  readDrawingOutcomesFromCache,
} from "@/lib/megapotTicketOutcomeCache";

export const TICKET_OUTCOMES_QUERY_KEY = "megapot-ticket-outcomes";

function isPayableTier(tierId) {
  return tierId > 0 && tierId < 12;
}

/**
 * @param {`0x${string}` | undefined} address
 * @param {bigint | undefined} drawingId
 * @param {{ ticketId: bigint }[] | undefined} ticketRows
 */
export default function useMegapotTicketOutcomes(address, drawingId, ticketRows) {
  const publicClient = usePublicClient({ chainId: base.id });

  const ticketIdsKey =
    ticketRows?.map((r) => r.ticketId.toString()).join(",") ?? "";

  return useQuery({
    queryKey: [
      TICKET_OUTCOMES_QUERY_KEY,
      address,
      drawingId?.toString?.() ?? "",
      ticketIdsKey,
    ],
    enabled: Boolean(
      address &&
        publicClient &&
        drawingId !== undefined &&
        drawingId >= 1n &&
        ticketRows?.length
    ),
    queryFn: async () => {
      const ids = ticketRows.map((r) => r.ticketId);
      const cached = readDrawingOutcomesFromCache(address, drawingId);

      const allInCache =
        cached &&
        ids.every((id) => cached[id.toString()] !== undefined);

      if (allInCache && cached) {
        /** @type {Record<string, { tierId: number; payoutWei: string; pending: boolean; isWin: boolean }>} */
        const outcomes = {};
        for (const id of ids) {
          const c = cached[id.toString()];
          outcomes[id.toString()] = {
            tierId: c.tierId,
            payoutWei: c.payoutWei,
            pending: false,
            isWin: isPayableTier(c.tierId),
          };
        }
        return { fromCache: true, outcomes };
      }

      const state = await publicClient.readContract({
        address: MEGAPOT_JACKPOT_ADDRESS,
        abi: megapotJackpotAbi,
        functionName: "getDrawingState",
        args: [drawingId],
      });

      const settled = Boolean(state?.winningTicket && state.winningTicket !== 0n);

      if (!settled) {
        /** @type {Record<string, { tierId: number; payoutWei: string; pending: boolean; isWin: boolean }>} */
        const outcomes = {};
        for (const id of ids) {
          outcomes[id.toString()] = {
            tierId: 0,
            payoutWei: "0",
            pending: true,
            isWin: false,
          };
        }
        return { fromCache: false, outcomes };
      }

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

      /** @type {Record<string, { tierId: number; payoutWei: string }>} */
      const toCache = {};
      /** @type {Record<string, { tierId: number; payoutWei: string; pending: boolean; isWin: boolean }>} */
      const outcomes = {};

      for (let i = 0; i < ids.length; i++) {
        const tid = Number(tierIds[i]);
        const gross = tid > 0 && tid < 12 ? payouts[tid] : 0n;
        const pay = megapotNetClaimWei(gross, refShare);
        const str = ids[i].toString();
        toCache[str] = { tierId: tid, payoutWei: pay.toString() };
        outcomes[str] = {
          tierId: tid,
          payoutWei: pay.toString(),
          pending: false,
          isWin: isPayableTier(tid),
        };
      }

      mergeDrawingOutcomesIntoCache(address, drawingId, toCache);
      return { fromCache: false, outcomes };
    },
    staleTime: 300_000,
  });
}
