export const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

/** USD with no fractional digits (e.g. rounded jackpot). */
export const currencyWhole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const shortAddress = (address) =>
  address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

/** @param {number | null | undefined} timestampMs */
export const formatDrawWallClock = (timestampMs) => {
  if (!timestampMs) return null;
  const date = new Date(timestampMs);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
};

/** Scheduled draw moment from on-chain `drawingTime` (unix seconds). */
export const formatDrawingDateTimeLine = (unixSeconds) => {
  if (unixSeconds === undefined || unixSeconds === null) return null;
  const sec =
    typeof unixSeconds === "bigint" ? Number(unixSeconds) : Number(unixSeconds);
  if (!Number.isFinite(sec) || sec <= 0) return null;
  const date = new Date(sec * 1000);
  const datePart = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
  return `${datePart} · ${timePart}`;
};

export const formatCountdown = (ms) => {
  const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

// Aave returns rates as ray (1e27) - convert to APY percentage
// The currentLiquidityRate is APR, we need to compound it to get APY
const SECONDS_PER_YEAR = 31536000;
export const formatApy = (liquidityRateRay) => {
  if (!liquidityRateRay) return "--";
  // Convert ray to decimal APR: rate / 1e27
  const apr = Number(liquidityRateRay) / 1e27;
  // Compound per-second to get APY: (1 + APR/secondsPerYear)^secondsPerYear - 1
  const apy = Math.pow(1 + apr / SECONDS_PER_YEAR, SECONDS_PER_YEAR) - 1;
  const apyPercent = apy * 100;
  return `${apyPercent.toFixed(2)}%`;
};

// Format timestamp as relative ("2 hours ago") or absolute ("1/24/2026 8:45 PM")
// Set compact=true for mobile-friendly short format ("2h", "3d")
export const formatTimestamp = (unixSeconds, mode = "relative", compact = false) => {
  const date = new Date(unixSeconds * 1000);

  if (mode === "absolute") {
    if (compact) {
      return date.toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
      });
    }
    return date.toLocaleString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  // Relative time
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return compact ? "now" : "just now";

  const intervals = [
    { label: "year", short: "y", seconds: 31536000 },
    { label: "month", short: "mo", seconds: 2592000 },
    { label: "week", short: "w", seconds: 604800 },
    { label: "day", short: "d", seconds: 86400 },
    { label: "hour", short: "h", seconds: 3600 },
    { label: "minute", short: "m", seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      if (compact) {
        return `${count}${interval.short}`;
      }
      return `${count} ${interval.label}${count !== 1 ? "s" : ""} ago`;
    }
  }

  return compact ? "now" : "just now";
};
