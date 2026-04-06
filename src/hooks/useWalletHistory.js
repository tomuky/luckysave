"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { decodeFunctionData } from "viem";
import { usePublicClient } from "wagmi";
import {
  BASE_CHAIN_ID,
  MEGAPOT_JACKPOT_ADDRESS,
  MEGAPOT_RANDOM_TICKET_BUYER_ADDRESS,
  MEGAPOT_V1_ADDRESS,
  AAVE_POOL_ADDRESS,
  USDC_ADDRESS,
  USDC_DECIMALS,
} from "@/lib/constants";
import { megapotV1Abi, aavePoolAbi, megapotJackpotAbi, megapotRandomTicketBuyerAbi } from "@/lib/abis";
import { enrichWalletHistoryAmounts } from "@/lib/walletHistoryAmounts";
import useAppStore from "@/store/useAppStore";

const PAGE_SIZE = 5;
const INITIAL_REFETCH_DELAY_MS = 4000;
const REFETCH_MAX_ATTEMPTS = 4;
const REFETCH_RETRY_INTERVAL_MS = 3000;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

/** Etherscan / Blockscout may use string or number status. */
function isExplorerOk(data) {
  if (!data || typeof data !== "object") return false;
  const s = data.status;
  return s === "1" || s === 1;
}

const cache = new Map();
const CACHE_TTL_MS = 30000;

const FUNCTION_SELECTORS = {
  "0x51ab9251": "purchaseTicketsV1",
  "0xb401faf1": "claimWinningsV1",
  "0xde88c28a": "buyTicketsJackpot",
  "0x017d1217": "buyTicketsRandom",
  "0x1bf0ade0": "claimWinningsV2",
  "0x617ba037": "supply",
  "0x69328dec": "withdraw",
};

const TX_TYPE_INFO = {
  purchaseTicketsV1: { label: "Bought tickets (v1)", type: "tickets" },
  buyTicketsJackpot: { label: "Bought tickets", type: "tickets" },
  buyTicketsRandom: { label: "Bought tickets", type: "tickets" },
  claimWinningsV1: { label: "Claimed winnings", type: "claim" },
  claimWinningsV2: { label: "Claimed winnings", type: "claim" },
  supply: { label: "Deposited", type: "deposit" },
  withdraw: { label: "Withdrew", type: "withdraw" },
};

function megapotAddressesLower() {
  return new Set(
    [
      MEGAPOT_JACKPOT_ADDRESS,
      MEGAPOT_RANDOM_TICKET_BUYER_ADDRESS,
      MEGAPOT_V1_ADDRESS,
    ].map((a) => a.toLowerCase())
  );
}

/** Cached rows may lack USDC until we can run RPC enrichment. */
function historyCacheIncomplete(data, canEnrichNow) {
  if (!canEnrichNow || !Array.isArray(data)) return false;
  return data.some((t) => {
    if (
      (t.functionName === "buyTicketsRandom" ||
        t.functionName === "buyTicketsJackpot") &&
      t.ticketCount > 0 &&
      t.amount == null
    ) {
      return true;
    }
    if (
      (t.functionName === "claimWinningsV1" ||
        t.functionName === "claimWinningsV2") &&
      t.amount == null
    ) {
      return true;
    }
    return false;
  });
}

export default function useWalletHistory(address) {
  const publicClient = usePublicClient({ chainId: BASE_CHAIN_ID });
  const [allTransactions, setAllTransactions] = useState([]);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timestampMode, setTimestampMode] = useState("relative");
  const refetchTrigger = useAppStore((state) => state.refetchTrigger);
  const refetchTimeoutRef = useRef([]);

  const toggleTimestampMode = useCallback(() => {
    setTimestampMode((prev) => (prev === "relative" ? "absolute" : "relative"));
  }, []);

  const fetchHistory = useCallback(async (bypassCache = false) => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    const cacheKey = `history-${address.toLowerCase()}`;
    const canEnrich = Boolean(publicClient && address);
    if (!bypassCache) {
      const cached = cache.get(cacheKey);
      if (
        cached &&
        Date.now() - cached.timestamp < CACHE_TTL_MS &&
        !historyCacheIncomplete(cached.data, canEnrich)
      ) {
        setAllTransactions(cached.data);
        setIsLoading(false);
        return;
      }
    }

    const fetchWithRetry = async (retryCount = 0) => {
      const response = await fetch(`/api/wallet-history?address=${address}`);
      const data = await response.json();

      if (!isExplorerOk(data)) {
        const raw =
          typeof data.result === "string"
            ? data.result
            : typeof data.message === "string"
              ? data.message
              : "";
        const messageLower = String(raw).toLowerCase();

        if (messageLower.includes("no transactions found")) {
          return [];
        }

        if (messageLower.includes("rate limit") || messageLower.includes("max rate")) {
          if (retryCount < MAX_RETRIES) {
            const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return fetchWithRetry(retryCount + 1);
          }
          throw new Error("Unable to load history right now. Please try again.");
        }

        const detail = raw || data.message || "Unknown error";
        throw new Error(
          typeof detail === "string" && detail.length < 120
            ? `Unable to load transaction history: ${detail}`
            : "Unable to load transaction history"
        );
      }

      if (!Array.isArray(data.result)) {
        return [];
      }

      return data.result;
    };

    try {
      const txList = await fetchWithRetry();
      const megapotSet = megapotAddressesLower();
      const aavePoolLower = AAVE_POOL_ADDRESS.toLowerCase();

      const relevantTxs = txList
        .filter((tx) => {
          if (tx.isError === "1" || tx.txreceipt_status === "0") return false;
          const toAddress = tx.to?.toLowerCase();
          const input = tx.input;
          const selector = input?.slice(0, 10);
          if (!selector || !FUNCTION_SELECTORS[selector]) return false;
          if (megapotSet.has(toAddress)) return true;
          if (toAddress === aavePoolLower) return true;
          return false;
        })
        .map((tx) => {
          const selector = tx.input.slice(0, 10);
          const functionName = FUNCTION_SELECTORS[selector];
          const typeInfo = TX_TYPE_INFO[functionName];
          const toAddress = tx.to.toLowerCase();

          let amount = null;
          let ticketCount = null;

          try {
            if (functionName === "purchaseTicketsV1") {
              const decoded = decodeFunctionData({
                abi: megapotV1Abi,
                data: tx.input,
              });
              const valueWei = decoded.args[1];
              amount = Number(valueWei) / 10 ** USDC_DECIMALS;
              ticketCount = Math.floor(amount);
            } else if (functionName === "buyTicketsRandom") {
              const decoded = decodeFunctionData({
                abi: megapotRandomTicketBuyerAbi,
                data: tx.input,
              });
              ticketCount = Number(decoded.args[0]);
            } else if (functionName === "buyTicketsJackpot") {
              const decoded = decodeFunctionData({
                abi: megapotJackpotAbi,
                data: tx.input,
              });
              const tickets = decoded.args[0];
              ticketCount = tickets?.length ?? 0;
            } else if (functionName === "supply" || functionName === "withdraw") {
              const decoded = decodeFunctionData({
                abi: aavePoolAbi,
                data: tx.input,
              });
              const asset = decoded.args[0];
              if (asset.toLowerCase() !== USDC_ADDRESS.toLowerCase()) {
                return null;
              }
              const amountWei = decoded.args[1];
              amount = Number(amountWei) / 10 ** USDC_DECIMALS;
            }
          } catch (e) {
            console.warn("Failed to decode tx:", tx.hash, e);
          }

          const blockNumberRaw = tx.blockNumber;
          const blockNumber =
            blockNumberRaw != null
              ? parseInt(String(blockNumberRaw), 10)
              : null;

          return {
            hash: tx.hash,
            blockNumber: Number.isFinite(blockNumber) ? blockNumber : null,
            timestamp: parseInt(tx.timeStamp, 10),
            functionName,
            label: typeInfo.label,
            type: typeInfo.type,
            amount,
            ticketCount,
          };
        })
        .filter(Boolean);

      const withAmounts =
        publicClient && address
          ? await enrichWalletHistoryAmounts(
              publicClient,
              relevantTxs,
              address
            )
          : relevantTxs;

      const hasEnrichableRows = relevantTxs.some((t) => {
        if (
          (t.functionName === "buyTicketsRandom" ||
            t.functionName === "buyTicketsJackpot") &&
          t.ticketCount > 0
        ) {
          return true;
        }
        return (
          t.functionName === "claimWinningsV1" ||
          t.functionName === "claimWinningsV2"
        );
      });

      if (!hasEnrichableRows || canEnrich) {
        cache.set(cacheKey, {
          data: withAmounts,
          timestamp: Date.now(),
        });
      }

      setAllTransactions(withAmounts);
    } catch (e) {
      console.error("Failed to fetch wallet history:", e);
      const friendlyMessage = e.message?.startsWith("Unable to")
        ? e.message
        : "Unable to load transaction history";
      setError(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    if (refetchTrigger === 0) return;
    refetchTimeoutRef.current.forEach(clearTimeout);
    refetchTimeoutRef.current = [];
    const timeouts = [];
    for (let i = 0; i < REFETCH_MAX_ATTEMPTS; i++) {
      const delay = INITIAL_REFETCH_DELAY_MS + i * REFETCH_RETRY_INTERVAL_MS;
      const timeoutId = setTimeout(() => {
        fetchHistory(true);
      }, delay);
      timeouts.push(timeoutId);
    }
    refetchTimeoutRef.current = timeouts;
    return () => {
      refetchTimeoutRef.current.forEach(clearTimeout);
      refetchTimeoutRef.current = [];
    };
  }, [refetchTrigger, fetchHistory]);

  const totalPages = Math.max(1, Math.ceil(allTransactions.length / PAGE_SIZE));
  const paginatedTransactions = allTransactions.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
  );

  const goToPage = useCallback(
    (newPage) => {
      if (newPage >= 0 && newPage < totalPages) {
        setPage(newPage);
      }
    },
    [totalPages]
  );

  const nextPage = useCallback(() => goToPage(page + 1), [goToPage, page]);
  const prevPage = useCallback(() => goToPage(page - 1), [goToPage, page]);
  const refetch = useCallback(() => fetchHistory(true), [fetchHistory]);

  return {
    transactions: paginatedTransactions,
    allTransactions,
    page,
    totalPages,
    nextPage,
    prevPage,
    goToPage,
    isLoading,
    error,
    timestampMode,
    toggleTimestampMode,
    refetch,
  };
}
