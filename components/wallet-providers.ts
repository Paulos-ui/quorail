export type WalletProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
  isOkxWallet?: boolean;
  isOKExWallet?: boolean;
  isRabby?: boolean;
  isCoinbaseWallet?: boolean;
  providers?: WalletProvider[];
};

export type AnnouncedWallet = {
  info?: {
    uuid?: string;
    name?: string;
    icon?: string;
    rdns?: string;
  };
  provider?: WalletProvider;
};

export type WalletOption = {
  id: string;
  name: string;
  icon?: string;
  rdns?: string;
  provider: WalletProvider;
  source: "announced" | "injected";
};

function normalizeWalletName(name: string): string {
  const lower = name.trim().toLowerCase();
  if (lower.includes("okx") || lower.includes("okex")) return "OKX Wallet";
  if (lower.includes("metamask")) return "MetaMask";
  if (lower.includes("rabby")) return "Rabby Wallet";
  if (lower.includes("coinbase")) return "Coinbase Wallet";
  if (lower.includes("brave")) return "Brave Wallet";
  return name.trim();
}

function canonicalKey(name: string): string {
  return normalizeWalletName(name).toLowerCase().replace(/\s+wallet$/, "").trim();
}

export function announcedWalletOption(detail: AnnouncedWallet | null | undefined): WalletOption | null {
  if (!detail || !detail.provider || typeof detail.provider.request !== "function") return null;
  const rawName = detail.info?.name?.trim() || "Browser Wallet";
  const name = normalizeWalletName(rawName);
  return {
    id: detail.info?.uuid || detail.info?.rdns || `eip6963-${canonicalKey(name)}`,
    name,
    icon: detail.info?.icon || "",
    rdns: detail.info?.rdns || "",
    provider: detail.provider,
    source: "announced",
  };
}

export function injectedWalletOptions(win: unknown): WalletOption[] {
  if (!win || typeof win !== "object") return [];
  const w = win as Record<string, any>;
  const results: WalletOption[] = [];
  const seenProviders = new Set<WalletProvider>();

  const addProvider = (prov: WalletProvider | undefined, fallbackName: string, idPrefix: string) => {
    if (!prov || typeof prov.request !== "function" || seenProviders.has(prov)) return;
    seenProviders.add(prov);
    let detectedName = fallbackName;
    if (prov.isOkxWallet || prov.isOKExWallet) detectedName = "OKX Wallet";
    else if (prov.isRabby) detectedName = "Rabby Wallet";
    else if (prov.isCoinbaseWallet) detectedName = "Coinbase Wallet";
    else if (prov.isMetaMask) detectedName = "MetaMask";
    const name = normalizeWalletName(detectedName);
    results.push({
      id: `${idPrefix}-${canonicalKey(name)}`,
      name,
      provider: prov,
      source: "injected",
    });
  };

  if (w.okxwallet) {
    const okxProv = (w.okxwallet.ethereum || w.okxwallet) as WalletProvider;
    addProvider(okxProv, "OKX Wallet", "injected-okx");
  }

  const eth = w.ethereum as WalletProvider | undefined;
  if (eth) {
    if (Array.isArray(eth.providers)) {
      eth.providers.forEach((p, idx) => addProvider(p, "Browser Wallet", `injected-${idx}`));
    } else {
      addProvider(eth, "Browser Wallet", "injected-main");
    }
  }

  return results;
}

export function mergeWalletOptions(announced: WalletOption[], injected: WalletOption[]): WalletOption[] {
  const byKey = new Map<string, WalletOption>();
  for (const item of [...announced, ...injected]) {
    if (!item || !item.provider || typeof item.provider.request !== "function" || !item.name) continue;
    const key = canonicalKey(item.name);
    if (!byKey.has(key)) {
      byKey.set(key, { ...item, name: normalizeWalletName(item.name) });
    }
  }
  return Array.from(byKey.values());
}
