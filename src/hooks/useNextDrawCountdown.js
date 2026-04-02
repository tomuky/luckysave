"use client";

import { useEffect, useMemo, useState } from "react";
import { useReadContract } from "wagmi";
import { base } from "wagmi/chains";

import { formatCountdown } from "@/lib/format";
import { MEGAPOT_JACKPOT_ADDRESS } from "@/lib/constants";
import { megapotJackpotAbi } from "@/lib/megapotV2Abi";

export default function useNextDrawCountdown() {
  const [now, setNow] = useState(Date.now());

  const { data: currentDrawingId, refetch: refetchDrawingId } = useReadContract({
    chainId: base.id,
    address: MEGAPOT_JACKPOT_ADDRESS,
    abi: megapotJackpotAbi,
    functionName: "currentDrawingId",
    query: { enabled: true },
  });

  const { data: drawingState, refetch: refetchState } = useReadContract({
    chainId: base.id,
    address: MEGAPOT_JACKPOT_ADDRESS,
    abi: megapotJackpotAbi,
    functionName: "getDrawingState",
    args: currentDrawingId !== undefined ? [currentDrawingId] : undefined,
    query: { enabled: currentDrawingId !== undefined },
  });

  const isLoading = currentDrawingId === undefined || !drawingState;

  const nextDrawAt = useMemo(() => {
    if (!drawingState?.drawingTime) return null;
    return Number(drawingState.drawingTime) * 1000;
  }, [drawingState]);

  useEffect(() => {
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (nextDrawAt && current >= nextDrawAt) {
        refetchDrawingId();
        refetchState();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [nextDrawAt, refetchDrawingId, refetchState]);

  const countdown = useMemo(() => {
    if (!nextDrawAt) return null;
    const remaining = nextDrawAt - now;
    if (remaining <= 0) {
      return "Drawing…";
    }
    return formatCountdown(remaining);
  }, [nextDrawAt, now]);

  return { countdown, nextDrawAt, isLoading };
}
