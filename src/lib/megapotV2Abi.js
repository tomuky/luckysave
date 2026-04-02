/** Megapot v2 on Base — fragments verified on-chain + Sourcify (Jackpot / Ticket NFT). */

export const megapotDrawingStateComponents = [
  { name: "prizePool", type: "uint256" },
  { name: "ticketPrice", type: "uint256" },
  { name: "edgePerTicket", type: "uint256" },
  { name: "referralWinShare", type: "uint256" },
  { name: "referralFee", type: "uint256" },
  { name: "globalTicketsBought", type: "uint256" },
  { name: "lpEarnings", type: "uint256" },
  { name: "drawingTime", type: "uint256" },
  { name: "winningTicket", type: "uint256" },
  { name: "ballMax", type: "uint8" },
  { name: "bonusballMax", type: "uint8" },
  { name: "payoutCalculator", type: "address" },
  { name: "jackpotLock", type: "bool" },
];

export const megapotJackpotAbi = [
  {
    name: "currentDrawingId",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "getDrawingState",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_drawingId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: megapotDrawingStateComponents,
      },
    ],
  },
  {
    name: "getUnpackedTicket",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "_drawingId", type: "uint256" },
      { name: "_packedTicket", type: "uint256" },
    ],
    outputs: [
      { name: "normals", type: "uint8[]" },
      { name: "bonusball", type: "uint8" },
    ],
  },
  {
    name: "buyTickets",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "_tickets",
        type: "tuple[]",
        components: [
          { name: "normals", type: "uint8[]" },
          { name: "bonusball", type: "uint8" },
        ],
      },
      { name: "_recipient", type: "address" },
      { name: "_referrers", type: "address[]" },
      { name: "_referralSplit", type: "uint256[]" },
      { name: "_source", type: "bytes32" },
    ],
    outputs: [{ name: "ticketIds", type: "uint256[]" }],
  },
  {
    name: "claimWinnings",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_userTicketIds", type: "uint256[]" }],
    outputs: [],
  },
  {
    name: "getTicketTierIds",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_ticketIds", type: "uint256[]" }],
    outputs: [{ name: "tierIds", type: "uint256[]" }],
  },
  {
    name: "getDrawingTierPayouts",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_drawingId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256[12]" }],
  },
  {
    name: "referralFees",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "claimReferralFees",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
];

export const megapotRandomTicketBuyerAbi = [
  {
    name: "buyTickets",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "ticketCount", type: "uint256" },
      { name: "recipient", type: "address" },
      { name: "referrers", type: "address[]" },
      { name: "referralSplit", type: "uint256[]" },
      { name: "source", type: "bytes32" },
    ],
    outputs: [],
  },
];

export const megapotTicketNftAbi = [
  {
    name: "getUserTickets",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "_userAddress", type: "address" },
      { name: "_drawingId", type: "uint256" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "ticketId", type: "uint256" },
          {
            name: "ticket",
            type: "tuple",
            components: [
              { name: "drawingId", type: "uint256" },
              { name: "packedTicket", type: "uint256" },
              { name: "referralScheme", type: "bytes32" },
            ],
          },
          { name: "normals", type: "uint8[]" },
          { name: "bonusball", type: "uint8" },
        ],
      },
    ],
  },
];
