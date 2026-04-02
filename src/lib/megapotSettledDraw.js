import { MEGAPOT_JACKPOT_ADDRESS } from "@/lib/constants";
import { megapotJackpotAbi } from "@/lib/megapotV2Abi";

const MAX_STEPS = 48;

/**
 * @param {import('viem').PublicClient} publicClient
 * @param {bigint} drawingId
 */
export async function isDrawingSettled(publicClient, drawingId) {
  if (drawingId < 1n) return false;
  const state = await publicClient.readContract({
    address: MEGAPOT_JACKPOT_ADDRESS,
    abi: megapotJackpotAbi,
    functionName: "getDrawingState",
    args: [drawingId],
  });
  return Boolean(state?.winningTicket && state.winningTicket !== 0n);
}

/**
 * Walk older from `fromId - 1` to find the previous draw with a winning ticket.
 * @param {import('viem').PublicClient} publicClient
 * @param {bigint} fromId
 * @returns {Promise<bigint | null>}
 */
export async function findPreviousSettledDrawingId(publicClient, fromId) {
  let id = fromId - 1n;
  let steps = 0;
  while (id >= 1n && steps < MAX_STEPS) {
    if (await isDrawingSettled(publicClient, id)) return id;
    id -= 1n;
    steps += 1;
  }
  return null;
}

/**
 * Walk newer from `fromId + 1` up to `maxId` for the next settled draw.
 * @param {import('viem').PublicClient} publicClient
 * @param {bigint} fromId
 * @param {bigint} maxId
 * @returns {Promise<bigint | null>}
 */
export async function findNextSettledDrawingId(publicClient, fromId, maxId) {
  let id = fromId + 1n;
  let steps = 0;
  while (id <= maxId && steps < MAX_STEPS) {
    if (await isDrawingSettled(publicClient, id)) return id;
    id += 1n;
    steps += 1;
  }
  return null;
}
