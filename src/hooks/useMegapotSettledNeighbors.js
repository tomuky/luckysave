"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { base } from "wagmi/chains";

import {
  findNextSettledDrawingId,
  findPreviousSettledDrawingId,
} from "@/lib/megapotSettledDraw";

/**
 * @param {bigint | undefined} resultsDrawingId
 * @param {bigint | undefined} newestSettledId
 */
export default function useMegapotSettledNeighbors(resultsDrawingId, newestSettledId) {
  const publicClient = usePublicClient({ chainId: base.id });

  return useQuery({
    queryKey: [
      "megapot-settled-neighbors",
      resultsDrawingId?.toString?.() ?? "",
      newestSettledId?.toString?.() ?? "",
    ],
    queryFn: async () => {
      const prev = await findPreviousSettledDrawingId(
        publicClient,
        resultsDrawingId
      );
      const next =
        newestSettledId !== undefined
          ? await findNextSettledDrawingId(
              publicClient,
              resultsDrawingId,
              newestSettledId
            )
          : null;
      return { prev, next };
    },
    enabled: Boolean(
      publicClient &&
        resultsDrawingId !== undefined &&
        resultsDrawingId >= 1n &&
        newestSettledId !== undefined
    ),
    staleTime: 30_000,
  });
}
