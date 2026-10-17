"use client";
import { createPublicClient, custom, getAddress, http, isAddress } from "viem";
import { arc } from "@/lib/core/chain";
import { vaultAbi } from "@/lib/core/abi";
import {
  injectedWalletOptions,
  mergeWalletOptions,
  announcedWalletOption,
  type AnnouncedWallet,
  type WalletOption,
  type WalletProvider,
} from "./wallet-providers";
export type { WalletProvider } from "./wallet-providers";

const KEY = "quorail-selected-wallet-v45";
let ownerProvider: WalletProvider | undefined;
let selectedName: string | undefined;

export function rememberOwnerProvider(value: WalletProvider, name = "Browser wallet") {
  ownerProvider = value;
  selectedName = name;
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(KEY, name);
    } catch {}
  }
}

export function selectedOwnerProvider(): WalletProvider | undefined {
  return ownerProvider;
}

export function lastSelectedWalletName(): string | undefined {
  if (selectedName) return selectedName;
  if (typeof window !== "undefined") {
    try {
      return window.sessionStorage.getItem(KEY) || undefined;
    } catch {}
  }
  return undefined;
}

export async function discoverWalletOptions(waitMs = 240): Promise<WalletOption[]> {
  if (typeof window === "undefined") return [];
  const announced: WalletOption[] = [];
  const listen = (event: Event) => {
    const item = announcedWalletOption((event as CustomEvent<AnnouncedWallet>).detail);
    if (item && !announced.some((a) => a.provider === item.provider)) announced.push(item);
  };
  window.addEventListener("eip6963:announceProvider", listen);
  try {
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  } finally {
    window.removeEventListener("eip6963:announceProvider", listen);
  }
  return mergeWalletOptions(announced, injectedWalletOptions(window));
}

export async function ensureArcNetwork(provider: WalletProvider): Promise<void> {
  const desired = "0x4cef52";
  const current = await provider.request({ method: "eth_chainId" });
  if (typeof current === "string" && Number(current) === 5042002) return;
  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: desired }] });
  } catch (e) {
    const err = e as { code?: number; data?: { originalError?: { code?: number } } };
    if (err?.code !== 4902 && err?.data?.originalError?.code !== 4902) {
      throw new Error(
        "Switch your wallet network to Arc Testnet (Chain ID 5042002) and try again."
      );
    }
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: desired,
          chainName: "Arc Testnet",
          rpcUrls: ["https://rpc.testnet.arc.network"],
          nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
          blockExplorerUrls: ["https://testnet.arcscan.app"],
        },
      ],
    });
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: desired }] });
  }
  const after = await provider.request({ method: "eth_chainId" });
  if (typeof after !== "string" || Number(after) !== 5042002) {
    throw new Error("Wallet is not on Arc Testnet. Select Arc Testnet (5042002) before continuing.");
  }
}

export type OwnerDetails = { owner: string; vault: string; chainId: number };

async function readOwnerFromBrowser(vault: `0x${string}`, preferredProvider?: WalletProvider): Promise<string | null> {
  // 1. Try direct browser HTTPS RPC to Arc Testnet (bypasses WSL2 Node IPv6 issue)
  try {
    const browserClient = createPublicClient({
      chain: arc,
      transport: http("https://rpc.testnet.arc.network", { timeout: 10000, retryCount: 2 }),
    });
    const onchainOwner = await browserClient.readContract({
      address: vault,
      abi: vaultAbi,
      functionName: "owner",
    });
    if (isAddress(onchainOwner)) return getAddress(onchainOwner);
  } catch {}

  // 2. Try reading through the user's connected wallet extension (OKX / MetaMask)
  const providers: WalletProvider[] = [];
  if (preferredProvider) providers.push(preferredProvider);
  if (ownerProvider && !providers.includes(ownerProvider)) providers.push(ownerProvider);
  try {
    const discovered = await discoverWalletOptions(120);
    for (const d of discovered) {
      if (!providers.includes(d.provider)) providers.push(d.provider);
    }
  } catch {}

  for (const p of providers) {
    try {
      const walletClient = createPublicClient({
        chain: arc,
        transport: custom(p as any),
      });
      const onchainOwner = await walletClient.readContract({
        address: vault,
        abi: vaultAbi,
        functionName: "owner",
      });
      if (isAddress(onchainOwner)) return getAddress(onchainOwner);
    } catch {}
  }
  return null;
}

export async function readVaultOwner(preferredProvider?: WalletProvider): Promise<OwnerDetails> {
  const response = await fetch("/api/auth/owner", { credentials: "same-origin", cache: "no-store" });
  const data = (await response.json()) as Partial<OwnerDetails> & { error?: string };

  if (response.ok && data.owner && isAddress(data.owner) && data.vault && isAddress(data.vault)) {
    return { owner: getAddress(data.owner), vault: getAddress(data.vault), chainId: data.chainId || 5042002 };
  }

  // Server RPC timed out in WSL, but returned the configured vault address -> resolve in browser!
  const knownVault = data?.vault && isAddress(data.vault) ? (getAddress(data.vault) as `0x${string}`) : null;
  if (knownVault) {
    const recoveredOwner = await readOwnerFromBrowser(knownVault, preferredProvider);
    if (recoveredOwner) {
      return { owner: recoveredOwner, vault: knownVault, chainId: 5042002 };
    }
  }

  const rawError = data?.error || "Could not read the onchain vault owner from Arc Testnet.";
  const clean = rawError.split("Docs: https://viem.sh")[0].split("Details:")[0].trim();
  throw new Error(clean || "Unable to reach Arc Testnet RPC to verify vault owner.");
}

export function ownerMatches(wallet: string, owner: string): boolean {
  return isAddress(wallet) && isAddress(owner) && getAddress(wallet) === getAddress(owner);
}

export async function requireOwnerProvider(): Promise<{ provider: WalletProvider; address: `0x${string}` }> {
  const { owner } = await readVaultOwner(ownerProvider);
  const options = await discoverWalletOptions();
  const selected = ownerProvider
    ? [{ id: "selected", name: selectedName || "Selected wallet", provider: ownerProvider, source: "injected" as const }]
    : [];
  const preferred = lastSelectedWalletName();
  const candidates = [
    ...selected,
    ...options.sort((a, b) => Number(b.name === preferred) - Number(a.name === preferred)),
  ];
  for (const item of candidates) {
    let account: string | undefined;
    try {
      const accounts = (await item.provider.request({ method: "eth_accounts" })) as string[];
      account = accounts?.find((a) => ownerMatches(a, owner));
    } catch {
      continue;
    }
    if (!account) continue;
    await ensureArcNetwork(item.provider);
    rememberOwnerProvider(item.provider, item.name);
    return { provider: item.provider, address: getAddress(account) };
  }
  throw new Error(
    `Connected wallet does not match the Arc vault owner (${owner.slice(0, 8)}…${owner.slice(-6)}). Switch to the owner account in OKX, MetaMask, or Rabby.`
  );
}
