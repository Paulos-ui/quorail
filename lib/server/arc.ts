import dns from "dns";
import { createPublicClient, createWalletClient, fallback, http, isAddress, getAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ARC_CHAIN_ID, ARC_USDC, DEFAULT_ARC_RPC, arc, paymentId, toUnits, fromUnits } from "@/lib/core/chain";
export { ARC_CHAIN_ID, ARC_USDC, explorer, arc, paymentId, toUnits, fromUnits } from "@/lib/core/chain";
import { usdcAbi, vaultAbi } from "@/lib/core/abi";

try {
  dns.setDefaultResultOrder("ipv4first");
} catch {}

function rpcTransport() {
  const customRpc = process.env.ARC_RPC_URL?.trim();
  const urls = Array.from(new Set([customRpc, DEFAULT_ARC_RPC].filter(Boolean))) as string[];
  return fallback(
    urls.map((url) =>
      http(url, {
        timeout: 15000,
        retryCount: 3,
        retryDelay: 450,
      })
    )
  );
}

export function publicClient() {
  return createPublicClient({
    chain: arc,
    transport: rpcTransport(),
  });
}

export function vaultAddress() {
  const a = (process.env.VAULT_ADDRESS || process.env.NEXT_PUBLIC_VAULT_ADDRESS || "").trim();
  return isAddress(a) ? (getAddress(a) as `0x${string}`) : null;
}

export function configuredOwnerAddress(): `0x${string}` | null {
  const explicit = (
    process.env.VAULT_OWNER_ADDRESS ||
    process.env.NEXT_PUBLIC_VAULT_OWNER_ADDRESS ||
    process.env.OWNER_ADDRESS ||
    ""
  ).trim();
  if (isAddress(explicit)) return getAddress(explicit) as `0x${string}`;
  const ownerKey = (process.env.OWNER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY || "").trim();
  if (/^0x[a-fA-F0-9]{64}$/.test(ownerKey)) {
    try {
      return privateKeyToAccount(ownerKey as `0x${string}`).address;
    } catch {}
  }
  return null;
}

export function agentAccount() {
  const key = (process.env.AGENT_PRIVATE_KEY || "").trim();
  if (!key || !/^0x[a-fA-F0-9]{64}$/.test(key)) return null;
  return privateKeyToAccount(key as `0x${string}`);
}

export function cleanRpcError(err: unknown, fallbackMsg = "Arc Testnet RPC is temporarily unreachable"): string {
  if (!(err instanceof Error)) return fallbackMsg;
  const msg = err.message || fallbackMsg;
  if (msg.includes("fetch failed") || msg.includes("ECONNREFUSED") || msg.includes("ETIMEDOUT")) {
    return "Arc Testnet RPC timed out while reading contract state. Check your internet/RPC connection or retry.";
  }
  const short = msg.split("Docs: https://viem.sh")[0].split("Details:")[0].trim();
  return short || fallbackMsg;
}

export async function walletInfo() {
  const vault = vaultAddress();
  const agent = agentAccount();
  if (!vault) return { ready: false, balanceCents: 0, agent: agent?.address || null, error: "VAULT_ADDRESS is not configured" };
  const client = publicClient();
  try {
    const chainId = await client.getChainId();
    if (chainId !== ARC_CHAIN_ID) throw new Error(`RPC reports chain ${chainId}; expected Arc Testnet ${ARC_CHAIN_ID}`);
    const [balance, contractAgent] = await Promise.all([
      client.readContract({ address: ARC_USDC, abi: usdcAbi, functionName: "balanceOf", args: [vault] }),
      client.readContract({ address: vault, abi: vaultAbi, functionName: "agent" }),
    ]);
    if (!agent) return { ready: false, balanceCents: fromUnits(balance), agent: null, error: "AGENT_PRIVATE_KEY missing" };
    if (contractAgent.toLowerCase() !== agent.address.toLowerCase()) {
      return { ready: false, balanceCents: fromUnits(balance), agent: agent.address, error: "Contract agent does not match AGENT_PRIVATE_KEY" };
    }
    return { ready: true, balanceCents: fromUnits(balance), agent: agent.address, error: "" };
  } catch (e) {
    return { ready: false, balanceCents: 0, agent: agent?.address || null, error: cleanRpcError(e, "Arc RPC unavailable") };
  }
}

export async function onchainPolicy(recipients: string[]) {
  const vault = vaultAddress();
  if (!vault) throw new Error("Vault not configured");
  const client = publicClient();
  const [autonomous, single, daily, paused] = await Promise.all([
    client.readContract({ address: vault, abi: vaultAbi, functionName: "autonomousLimit" }),
    client.readContract({ address: vault, abi: vaultAbi, functionName: "singleLimit" }),
    client.readContract({ address: vault, abi: vaultAbi, functionName: "dailyLimit" }),
    client.readContract({ address: vault, abi: vaultAbi, functionName: "paused" }),
  ]);
  const allowed: string[] = [];
  for (const value of new Set(recipients)) {
    if (!isAddress(value)) continue;
    if (await client.readContract({ address: vault, abi: vaultAbi, functionName: "allowedRecipients", args: [value as `0x${string}`] })) {
      allowed.push(value);
    }
  }
  return {
    autonomousLimitCents: fromUnits(autonomous),
    singleLimitCents: fromUnits(single),
    dailyLimitCents: fromUnits(daily),
    allowedRecipients: allowed,
    paused,
  };
}

export async function sendVaultPayment(recipient: string, cents: number, id: string) {
  const vault = vaultAddress();
  const signer = agentAccount();
  if (!vault || !signer) throw new Error("Arc wallet or vault is not configured");
  if (!isAddress(recipient)) throw new Error("Invalid EVM recipient");
  const client = publicClient();
  if ((await client.getChainId()) !== ARC_CHAIN_ID) throw new Error("Wrong Arc network");
  const wallet = createWalletClient({
    account: signer,
    chain: arc,
    transport: rpcTransport(),
  });
  const hash = await wallet.writeContract({
    address: vault,
    abi: vaultAbi,
    functionName: "pay",
    args: [recipient as `0x${string}`, toUnits(cents), paymentId(id)],
    chain: arc,
    account: signer,
  });
  return hash;
}
