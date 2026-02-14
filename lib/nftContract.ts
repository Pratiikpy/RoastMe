import { CHAIN_ID } from "./constants";

export const ROAST_NFT_ADDRESS = (process.env.NEXT_PUBLIC_ROAST_NFT_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const ROAST_NFT_ABI = [
  {
    inputs: [
      { name: "roastId", type: "string" },
      { name: "roastText", type: "string" },
      { name: "targetUsername", type: "string" },
      { name: "senderUsername", type: "string" },
      { name: "theme", type: "string" },
      { name: "reactions", type: "uint256" },
    ],
    name: "mintRoast",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: true, name: "minter", type: "address" },
      { indexed: false, name: "targetUsername", type: "string" },
      { indexed: false, name: "senderUsername", type: "string" },
    ],
    name: "RoastMinted",
    type: "event",
  },
] as const;

export const BASESCAN_URL = CHAIN_ID === 84532
  ? "https://sepolia.basescan.org"
  : "https://basescan.org";
