import { defineChain, keccak256, stringToHex } from "viem";

export const ARC_CHAIN_ID = 5042002;
export const ARC_USDC = "0x3600000000000000000000000000000000000000" as const;
export const explorer = "https://testnet.arcscan.app";

export const ARC_RPC_URLS = [
  "https://rpc.testnet.arc.network",
  "https://rpc.solidrpc.io/public/evm/5042002",
  "https://5042002.rpc.thirdweb.com",
] as const;

export const DEFAULT_ARC_RPC = ARC_RPC_URLS[0];

export const arc = defineChain({
  id: ARC_CHAIN_ID,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: [...ARC_RPC_URLS] },
    public: { http: [...ARC_RPC_URLS] },
  },
  blockExplorers: {
    default: { name: "Arcscan", url: explorer },
  },
  testnet: true,
});

export function paymentId(id: string) {
  return keccak256(stringToHex(id));
}
export function toUnits(cents: number) {
  return BigInt(cents) * 10000n;
}
export function fromUnits(units: bigint) {
  return Number(units / 10000n);
}
