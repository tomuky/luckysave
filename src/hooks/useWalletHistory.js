"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { decodeFunctionData } from "viem";
import {
  MEGAPOT_ADDRESS,
  AAVE_POOL_ADDRESS,
  USDC_ADDRESS,
  USDC_DECIMALS,
} from "@/lib/constants";
import { megapotAbi, aavePoolAbi } from "@/lib/abis";
import useAppStore from "@/store/useAppStore";

const PAGE_SIZE = 5;
// Delay before refetching to give Etherscan time to index the transaction
const INITIAL_REFETCH_DELAY_MS = 4000;
// How many times to retry refetching for new transactions
const REFETCH_MAX_ATTEMPTS = 4;
// Delay between retry attempts (increases each time)
const REFETCH_RETRY_INTERVAL_MS = 3000;

// Retry configuration for rate limiting
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL_MS = 30000; // 30 seconds

// Function selectors for the transactions we care about
const FUNCTION_SELECTORS = {
  // purchaseTickets(address,uint256,address)
  "0x51ab9251": "purchaseTickets",
  // claimWinnings()
  "0xb401faf1": "claimWinnings",
  // supply(address,uint256,address,uint16)
  "0x617ba037": "supply",
  // withdraw(address,uint256,address)
  "0x69328dec": "withdraw",
};

// Map transaction type to display info
const TX_TYPE_INFO = {
  purchaseTickets: { label: "Bought tickets", type: "tickets" },
  claimWinnings: { label: "Claimed winnings", type: "claim" },
  supply: { label: "Deposited", type: "deposit" },
  withdraw: { label: "Withdrew", type: "withdraw" },
};

export default function useWalletHistory(address) {
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

    // Check cache first (unless bypassing)
    const cacheKey = `history-${address.toLowerCase()}`;
    if (!bypassCache) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        setAllTransactions(cached.data);
        setIsLoading(false);
        return;
      }
    }

    // Fetch with retry logic (calls our API route which proxies to Etherscan)
    const fetchWithRetry = async (retryCount = 0) => {
      const response = await fetch(`/api/wallet-history?address=${address}`);
      const data = await response.json();

      // Check for rate limiting or other API errors
      if (data.status !== "1") {
        const message = data.message || data.result || "";
        const messageLower = message.toLowerCase();

        // "No transactions found" is not an error, just empty
        if (messageLower.includes("no transactions found")) {
          return [];
        }

        // Rate limit hit - retry with exponential backoff
        if (messageLower.includes("rate limit") || messageLower.includes("max rate")) {
          if (retryCount < MAX_RETRIES) {
            const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return fetchWithRetry(retryCount + 1);
          }
          throw new Error("Unable to load history right now. Please try again.");
        }

        // Other API error - use friendly message, not raw API response
        throw new Error("Unable to load transaction history");
      }

      if (!Array.isArray(data.result)) {
        return [];
      }

      return data.result;
    };

    try {
      const txList = await fetchWithRetry();

      // Filter and parse relevant transactions
      const megapotLower = MEGAPOT_ADDRESS.toLowerCase();
      const aavePoolLower = AAVE_POOL_ADDRESS.toLowerCase();

      const relevantTxs = txList
        .filter((tx) => {
          // Only successful transactions
          if (tx.isError === "1" || tx.txreceipt_status === "0") return false;

          const toAddress = tx.to?.toLowerCase();
          const input = tx.input;

          // Must be to one of our contracts
          if (toAddress !== megapotLower && toAddress !== aavePoolLower) {
            return false;
          }

          // Must have a known function selector
          const selector = input?.slice(0, 10);
          return selector && FUNCTION_SELECTORS[selector];
        })
        .map((tx) => {
          const selector = tx.input.slice(0, 10);
          const functionName = FUNCTION_SELECTORS[selector];
          const typeInfo = TX_TYPE_INFO[functionName];
          const toAddress = tx.to.toLowerCase();

          let amount = null;
          let ticketCount = null;

          // Decode amount from transaction input
          try {
            if (functionName === "purchaseTickets") {
              const decoded = decodeFunctionData({
                abi: megapotAbi,
                data: tx.input,
              });
              // value is the second argument (index 1)
              const valueWei = decoded.args[1];
              amount = Number(valueWei) / 10 ** USDC_DECIMALS;
              // Each ticket costs $1
              ticketCount = Math.floor(amount);
            } else if (functionName === "supply" || functionName === "withdraw") {
              const decoded = decodeFunctionData({
                abi: aavePoolAbi,
                data: tx.input,
              });
              // Check if asset is USDC
              const asset = decoded.args[0];
              if (asset.toLowerCase() !== USDC_ADDRESS.toLowerCase()) {
                return null; // Not a USDC transaction
              }
              // amount is the second argument
              const amountWei = decoded.args[1];
              amount = Number(amountWei) / 10 ** USDC_DECIMALS;
            } else if (functionName === "claimWinnings") {
              // For claimWinnings, we'd need to check the event logs for the actual amount
              // For now, we'll show it without amount or fetch from logs
              amount = null;
            }
          } catch (e) {
            console.warn("Failed to decode tx:", tx.hash, e);
          }

          return {
            hash: tx.hash,
            timestamp: parseInt(tx.timeStamp, 10),
            functionName,
            label: typeInfo.label,
            type: typeInfo.type,
            amount,
            ticketCount,
          };
        })
        .filter(Boolean); // Remove nulls from non-USDC Aave txs

      // Store in cache
      cache.set(cacheKey, {
        data: relevantTxs,
        timestamp: Date.now(),
      });

      setAllTransactions(relevantTxs);
    } catch (e) {
      console.error("Failed to fetch wallet history:", e);
      // Always use a friendly message - never expose raw API errors to users
      const friendlyMessage = e.message?.startsWith("Unable to")
        ? e.message
        : "Unable to load transaction history";
      setError(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  // Fetch on address change
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Refetch when global trigger changes (after transactions complete)
  // Use a delay to give Etherscan time to index the transaction, with retries
  useEffect(() => {
    if (refetchTrigger === 0) return; // Skip initial mount

    // Clear any existing timeouts
    refetchTimeoutRef.current.forEach(clearTimeout);
    refetchTimeoutRef.current = [];

    // Schedule multiple refetch attempts with increasing delays
    // This ensures we catch newly indexed transactions even if Etherscan is slow
    const timeouts = [];
    for (let i = 0; i < REFETCH_MAX_ATTEMPTS; i++) {
      const delay = INITIAL_REFETCH_DELAY_MS + (i * REFETCH_RETRY_INTERVAL_MS);
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

  // Pagination
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

  // Manual refetch always bypasses cache
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
