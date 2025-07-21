export const kandelSeederABI = [
  {
    type: "constructor",
    inputs: [
      { name: "mgv", type: "address", internalType: "contract IMangrove" },
      { name: "kandelGasreq", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "KANDEL_GASREQ",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MGV",
    inputs: [],
    outputs: [
      { name: "", type: "address", internalType: "contract IMangrove" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "sow",
    inputs: [
      {
        name: "olKeyBaseQuote",
        type: "tuple",
        internalType: "struct OLKey",
        components: [
          { name: "outbound_tkn", type: "address", internalType: "address" },
          { name: "inbound_tkn", type: "address", internalType: "address" },
          { name: "tickSpacing", type: "uint256", internalType: "uint256" },
        ],
      },
      { name: "liquiditySharing", type: "bool", internalType: "bool" },
    ],
    outputs: [
      {
        name: "kandel",
        type: "address",
        internalType: "contract GeometricKandel",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "NewKandel",
    inputs: [
      {
        name: "owner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "baseQuoteOlKeyHash",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32",
      },
      {
        name: "quoteBaseOlKeyHash",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32",
      },
      {
        name: "kandel",
        type: "address",
        indexed: false,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
] as const;
