"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { base } from "wagmi/chains";

import {
  findNextSettledDrawingId,
  findPreviousSettledDrawingId,
} from "@/lib/megapotSettledDraw";

/**
 * @param {bigint | undefined} viewingDrawingId
 * @param {bigint | undefined} newestSettledId
 * @param {bigint | undefined} currentOpenDrawId Active drawing id (tickets sold for this round); may be ahead of newest settled.
 */
export default function useMegapotSettledNeighbors(
  viewingDrawingId,
  newestSettledId,
  currentOpenDrawId
) {
  const publicClient = usePublicClient({ chainId: base.id });

  return useQuery({
    queryKey: [
      "megapot-settled-neighbors",
      viewingDrawingId?.toString?.() ?? "",
      newestSettledId?.toString?.() ?? "",
      currentOpenDrawId?.toString?.() ?? "",
    ],
    queryFn: async () => {
      const prev =
        currentOpenDrawId !== undefined &&
        viewingDrawingId === currentOpenDrawId
          ? await findPreviousSettledDrawingId(publicClient, currentOpenDrawId)
          : await findPreviousSettledDrawingId(publicClient, viewingDrawingId);

      let next = null;
      if (
        currentOpenDrawId !== undefined &&
        viewingDrawingId === currentOpenDrawId
      ) {
        next = null;
      } else if (newestSettledId !== undefined) {
        next = await findNextSettledDrawingId(
          publicClient,
          viewingDrawingId,
          newestSettledId
        );
        if (
          next === null &&
          currentOpenDrawId !== undefined &&
          viewingDrawingId === newestSettledId &&
          currentOpenDrawId > newestSettledId
        ) {
          next = currentOpenDrawId;
        }
      }

      return { prev, next };
    },
    enabled: Boolean(
      publicClient && viewingDrawingId !== undefined && viewingDrawingId >= 1n
    ),
    staleTime: 30_000,
  });
}
