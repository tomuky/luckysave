import { decodeEventLog } from "viem";

import { megapotJackpotAbi } from "@/lib/megapotV2Abi";
import {
  MEGAPOT_JACKPOT_ADDRESS,
  USDC_ADDRESS,
  USDC_DECIMALS,
} from "@/lib/constants";

const erc20TransferEventAbi = [
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
];

const USDC_LOWER = USDC_ADDRESS.toLowerCase();

/**
 * @param {import('viem').Log[]} logs
 * @param {string} userLower checksummed or lower address
 * @returns {bigint}
 */
function sumUsdcTransferToUser(logs, userLower) {
  let total = 0n;
  const u = userLower.toLowerCase();
  for (const log of logs) {
    if (!log.address || log.address.toLowerCase() !== USDC_LOWER) continue;
    if (!log.topics || log.topics.length !== 3) continue;
    try {
      const decoded = decodeEventLog({
        abi: erc20TransferEventAbi,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName !== "Transfer") continue;
      if (decoded.args.to.toLowerCase() === u) {
        total += decoded.args.value;
      }
    } catch {
      // not a Transfer we can decode
    }
  }
  return total;
}

/**
 * @param {import('viem').Log[]} logs
 * @param {string} userLower
 * @returns {bigint}
 */
function sumUsdcTransferFromUser(logs, userLower) {
  let total = 0n;
  const u = userLower.toLowerCase();
  for (const log of logs) {
    if (!log.address || log.address.toLowerCase() !== USDC_LOWER) continue;
    if (!log.topics || log.topics.length !== 3) continue;
    try {
      const decoded = decodeEventLog({
        abi: erc20TransferEventAbi,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName !== "Transfer") continue;
      if (decoded.args.from.toLowerCase() === u) {
        total += decoded.args.value;
      }
    } catch {
      // ignore
    }
  }
  return total;
}

/**
 * @param {import('viem').PublicClient} publicClient
 * @param {bigint} blockNumber
 */
async function ticketPriceWeiAtBlock(publicClient, blockNumber) {
  const drawingId = await publicClient.readContract({
    address: MEGAPOT_JACKPOT_ADDRESS,
    abi: megapotJackpotAbi,
    functionName: "currentDrawingId",
    blockNumber,
  });
  const state = await publicClient.readContract({
    address: MEGAPOT_JACKPOT_ADDRESS,
    abi: megapotJackpotAbi,
    functionName: "getDrawingState",
    args: [drawingId],
    blockNumber,
  });
  return state.ticketPrice;
}

function weiToUsdcNumber(wei) {
  return Number(wei) / 10 ** USDC_DECIMALS;
}

const BATCH = 8;

/**
 * Resolves USDC amounts for v2 ticket buys (price × count at block) and claims (USDC received in receipt).
 *
 * @param {import('viem').PublicClient} publicClient
 * @param {object[]} transactions
 * @param {string} userAddress
 * @returns {Promise<object[]>}
 */
export async function enrichWalletHistoryAmounts(
  publicClient,
  transactions,
  userAddress
) {
  if (!publicClient || !userAddress || !transactions.length) {
    return transactions;
  }

  const userLower = userAddress.toLowerCase();
  /** @type {Map<string, bigint>} */
  const ticketPriceWeiByBlock = new Map();
  const priceWeiAtBlock = async (blockNumber) => {
    const key = blockNumber.toString();
    let wei = ticketPriceWeiByBlock.get(key);
    if (wei === undefined) {
      wei = await ticketPriceWeiAtBlock(publicClient, blockNumber);
      ticketPriceWeiByBlock.set(key, wei);
    }
    return wei;
  };

  const out = [];

  for (let i = 0; i < transactions.length; i += BATCH) {
    const slice = transactions.slice(i, i + BATCH);
    const batchResults = await Promise.all(
      slice.map(async (tx) => {
        let amount = tx.amount;

        const needsTicketAmount =
          (tx.functionName === "buyTicketsRandom" ||
            tx.functionName === "buyTicketsJackpot") &&
          tx.ticketCount > 0 &&
          tx.blockNumber != null &&
          !Number.isNaN(tx.blockNumber);

        const needsClaimAmount =
          tx.functionName === "claimWinningsV1" ||
          tx.functionName === "claimWinningsV2";

        try {
          if (needsTicketAmount) {
            const blockNumber = BigInt(tx.blockNumber);
            const priceWei = await priceWeiAtBlock(blockNumber);
            const totalWei = BigInt(tx.ticketCount) * priceWei;
            amount = weiToUsdcNumber(totalWei);
          } else if (needsClaimAmount && tx.hash) {
            const receipt = await publicClient.getTransactionReceipt({
              hash: tx.hash,
            });
            const received = sumUsdcTransferToUser(receipt.logs, userLower);
            if (received > 0n) {
              amount = weiToUsdcNumber(received);
            }
          }
        } catch (e) {
          if (needsTicketAmount && tx.hash) {
            try {
              const receipt = await publicClient.getTransactionReceipt({
                hash: tx.hash,
              });
              const spent = sumUsdcTransferFromUser(receipt.logs, userLower);
              if (spent > 0n) {
                amount = weiToUsdcNumber(spent);
              }
            } catch {
              console.warn("Wallet history amount fallback failed:", tx.hash, e);
            }
          } else {
            console.warn("Wallet history amount enrich failed:", tx.hash, e);
          }
        }

        return { ...tx, amount };
      })
    );
    out.push(...batchResults);
  }

  return out;
}
