"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { base } from "wagmi/chains";

import { MEGAPOT_TICKET_NFT_ADDRESS } from "@/lib/constants";
import { megapotTicketNftAbi } from "@/lib/megapotV2Abi";

export const USER_TICKET_DRAWING_IDS_QUERY_KEY = "megapot-user-ticket-drawing-ids";

const MAX_SCAN = 60;

/**
 * Descending list of drawing ids (newest first) where the user has at least one ticket.
 */
export default function useMegapotUserTicketDrawingIds(address, currentDrawingId) {
  const publicClient = usePublicClient({ chainId: base.id });

  return useQuery({
    queryKey: [
      USER_TICKET_DRAWING_IDS_QUERY_KEY,
      address,
      currentDrawingId?.toString?.() ?? "",
    ],
    enabled: Boolean(
      address &&
        publicClient &&
        currentDrawingId !== undefined &&
        currentDrawingId >= 1n
    ),
    queryFn: async () => {
      /** @type {bigint[]} */
      const ids = [];
      let id = currentDrawingId;
      let scanned = 0;
      while (id >= 1n && scanned < MAX_SCAN) {
        const rows = await publicClient.readContract({
          address: MEGAPOT_TICKET_NFT_ADDRESS,
          abi: megapotTicketNftAbi,
          functionName: "getUserTickets",
          args: [address, id],
        });
        if (rows?.length) ids.push(id);
        id -= 1n;
        scanned += 1;
      }
      return ids;
    },
    staleTime: 45_000,
  });
}
