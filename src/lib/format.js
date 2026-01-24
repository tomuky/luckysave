export const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export const shortAddress = (address) =>
  address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

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
