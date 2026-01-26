import { NextResponse } from "next/server";

const ETHERSCAN_API_URL = "https://api.etherscan.io/v2/api";
const BASE_CHAIN_ID = 8453;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json(
      { status: "0", message: "Missing address parameter" },
      { status: 400 }
    );
  }

  const apiKey = process.env.ETHERSCAN_API_KEY;
  if (!apiKey) {
    console.error("ETHERSCAN_API_KEY not configured");
    return NextResponse.json(
      { status: "0", message: "API not configured" },
      { status: 500 }
    );
  }

  try {
    const params = new URLSearchParams({
      chainid: String(BASE_CHAIN_ID),
      module: "account",
      action: "txlist",
      address: address,
      startblock: "0",
      endblock: "99999999",
      sort: "desc",
      apikey: apiKey,
    });

    const response = await fetch(`${ETHERSCAN_API_URL}?${params}`);
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch from Etherscan:", error);
    return NextResponse.json(
      { status: "0", message: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
