import { NextResponse } from "next/server";

const ETHERSCAN_API_URL = "https://api.etherscan.io/v2/api";
const BASE_CHAIN_ID = 8453;
/** Public indexer; used when Etherscan v2 fails (e.g. free tier Base / invalid key). */
const BLOCKSCOUT_BASE_API = "https://base.blockscout.com/api";

function txListResponseOk(data) {
  if (!data || typeof data !== "object") return false;
  const s = data.status;
  if (s !== "1" && s !== 1) return false;
  return Array.isArray(data.result);
}

/** Etherscan / Blockscout use status "0" + empty result for a valid empty tx list. */
function explorerEmptyTransactionList(data) {
  if (!data || typeof data !== "object") return false;
  const s = data.status;
  if (s !== "0" && s !== 0) return false;
  if (!Array.isArray(data.result) || data.result.length !== 0) return false;
  const msg = String(data.message ?? "").toLowerCase();
  return (
    msg.includes("no transaction") ||
    msg.includes("no record") ||
    msg.includes("no matching")
  );
}

const EMPTY_TXLIST_OK = { status: "1", message: "OK", result: [] };

async function fetchEtherscanTxList(address, apiKey) {
  const params = new URLSearchParams({
    chainid: String(BASE_CHAIN_ID),
    module: "account",
    action: "txlist",
    address,
    startblock: "0",
    endblock: "99999999",
    sort: "desc",
    apikey: apiKey,
  });
  const response = await fetch(`${ETHERSCAN_API_URL}?${params}`);
  if (!response.ok) {
    return {
      status: "0",
      message: "NOTOK",
      result: `Etherscan HTTP ${response.status}`,
    };
  }
  return response.json();
}

async function fetchBlockscoutTxList(address) {
  const params = new URLSearchParams({
    module: "account",
    action: "txlist",
    address,
    startblock: "0",
    endblock: "99999999",
    sort: "desc",
    page: "1",
    offset: "10000",
  });
  const response = await fetch(`${BLOCKSCOUT_BASE_API}?${params}`);
  if (!response.ok) {
    return {
      status: "0",
      message: "NOTOK",
      result: `Blockscout HTTP ${response.status}`,
    };
  }
  return response.json();
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json(
      { status: "0", message: "Missing address parameter" },
      { status: 400 }
    );
  }

  try {
    const apiKey = process.env.ETHERSCAN_API_KEY?.trim();

    if (apiKey) {
      const etherscanData = await fetchEtherscanTxList(address, apiKey);
      if (txListResponseOk(etherscanData)) {
        return NextResponse.json(etherscanData);
      }
      if (explorerEmptyTransactionList(etherscanData)) {
        return NextResponse.json(EMPTY_TXLIST_OK);
      }
    }

    const blockscoutData = await fetchBlockscoutTxList(address);
    if (txListResponseOk(blockscoutData)) {
      return NextResponse.json(blockscoutData);
    }
    if (explorerEmptyTransactionList(blockscoutData)) {
      return NextResponse.json(EMPTY_TXLIST_OK);
    }

    return NextResponse.json(
      blockscoutData?.status != null
        ? blockscoutData
        : {
            status: "0",
            message: "NOTOK",
            result: "Failed to load transactions",
          },
      { status: 502 }
    );
  } catch (error) {
    console.error("Failed to fetch wallet history:", error);
    return NextResponse.json(
      { status: "0", message: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
