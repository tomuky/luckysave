import { useEffect, useMemo, useState } from "react";
import { useReadContract } from "wagmi";

import { formatCountdown } from "@/lib/format";
import { MEGAPOT_ADDRESS } from "@/lib/constants";
import { megapotAbi } from "@/lib/abis";

const useNextDrawCountdown = () => {
  const [now, setNow] = useState(Date.now());

  // Read last jackpot end time from contract
  const {
    data: lastJackpotEndTime,
    refetch: refetchLastJackpotEndTime,
    isFetched: isFetchedLastJackpot,
  } = useReadContract({
    address: MEGAPOT_ADDRESS,
    abi: megapotAbi,
    functionName: "lastJackpotEndTime",
  });

  // Read round duration from contract
  const {
    data: roundDurationInSeconds,
    isFetched: isFetchedRoundDuration,
  } = useReadContract({
    address: MEGAPOT_ADDRESS,
    abi: megapotAbi,
    functionName: "roundDurationInSeconds",
  });

  // Loading state for countdown
  const isLoading = !isFetchedLastJackpot || !isFetchedRoundDuration;

  // Calculate next draw time from contract data
  const nextDrawAt = useMemo(() => {
    if (!lastJackpotEndTime || !roundDurationInSeconds) {
      return null;
    }
    // Convert from seconds to milliseconds
    const lastEndMs = Number(lastJackpotEndTime) * 1000;
    const durationMs = Number(roundDurationInSeconds) * 1000;
    return lastEndMs + durationMs;
  }, [lastJackpotEndTime, roundDurationInSeconds]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);

      // If draw time has passed, refetch contract data
      if (nextDrawAt && current >= nextDrawAt) {
        refetchLastJackpotEndTime();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [nextDrawAt, refetchLastJackpotEndTime]);

  const countdown = useMemo(() => {
    if (!nextDrawAt) {
      return null; // Return null when loading, let component show skeleton
    }
    const remaining = nextDrawAt - now;
    if (remaining <= 0) {
      return "Drawing...";
    }
    return formatCountdown(remaining);
  }, [nextDrawAt, now]);

  return { countdown, nextDrawAt, isLoading };
};

export default useNextDrawCountdown;
