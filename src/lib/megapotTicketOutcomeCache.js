import { BASE_CHAIN_ID } from "@/lib/constants";

const STORAGE_KEY = "megapot-ticket-outcomes-v2";

/**
 * @returns {Record<string, Record<string, { tierId: number; payoutWei: string }>>}
 */
function readAll() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(data) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota */
  }
}

function scopeKey(address, drawingId) {
  return `${BASE_CHAIN_ID}:${address.toLowerCase()}:${drawingId.toString()}`;
}

/**
 * @param {`0x${string}`} address
 * @param {bigint} drawingId
 * @returns {Record<string, { tierId: number; payoutWei: string }> | null}
 */
export function readDrawingOutcomesFromCache(address, drawingId) {
  const all = readAll();
  const row = all[scopeKey(address, drawingId)];
  return row && typeof row === "object" ? row : null;
}

/**
 * @param {`0x${string}`} address
 * @param {bigint} drawingId
 * @param {Record<string, { tierId: number; payoutWei: string }>} outcomes
 */
export function mergeDrawingOutcomesIntoCache(address, drawingId, outcomes) {
  const all = readAll();
  const key = scopeKey(address, drawingId);
  const prev = all[key] && typeof all[key] === "object" ? all[key] : {};
  all[key] = { ...prev, ...outcomes };
  writeAll(all);
}
