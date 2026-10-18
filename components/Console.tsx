"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  Compass,
  ExternalLink,
  GitBranch,
  LayoutGrid,
  Lock,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  ReceiptText,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { Brand } from "./Brand";
import WalletConnect from "./WalletConnect";
import {
  discoverWalletOptions,
  ensureArcNetwork,
  requireOwnerProvider,
  selectedOwnerProvider,
} from "./owner-wallet";
import ConsequenceField from "./ConsequenceField";
import { demoState } from "@/lib/demo";
import {
  dueInDays,
  evaluateConsequences,
  forecast,
  toCents,
  usd,
} from "@/lib/core/finance";
import type { Decision, Obligation, TreasuryState } from "@/lib/core/types";
import {
  ARC_USDC,
  DEFAULT_VAULT_ADDRESS,
  arc,
  explorer,
  fromUnits,
  paymentId,
  toUnits,
} from "@/lib/core/chain";
import { usdcAbi, vaultAbi } from "@/lib/core/abi";
import {
  createPublicClient,
  createWalletClient,
  custom,
  getAddress,
  http,
  isAddress,
  parseAbi,
} from "viem";

type View =
  | "overview"
  | "obligations"
  | "decisions"
  | "vault"
  | "proof"
  | "simulation"
  | "policy"
  | "activity";

const erc20TransferAbi = parseAbi([
  "function transfer(address to, uint256 value) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
]);

const SEEDED_DEMO_TITLES = new Set([
  "product engineering",
  "cloud infrastructure",
  "security audit",
  "design retainer",
  "core contributor sprint",
  "managed postgres cluster",
]);

const initialForm = {
  title: "",
  counterparty: "",
  recipient: "",
  amount: "",
  dueDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
  category: "Contractors",
  priority: "high" as Obligation["priority"],
};

const LIVE_STORAGE_KEY = "quorail-real-ledger-v46";
const DELETED_IDS_KEY = "quorail-deleted-obligations-v46";
const CUSTOM_RESERVE_KEY = "quorail-custom-reserve-cents-v46";

function friendlyDay(day: string) {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}

function StatusPill({ status }: { status: string }) {
  return <span className={`status-pill status-${status}`}>{status.replace("_", " ")}</span>;
}

function Skeleton() {
  return (
    <div className="loading-dashboard">
      <div className="loader-ring" />
      <p>Connecting to Arc Testnet Vault & syncing on-chain USDC balance…</p>
    </div>
  );
}

function Constellation({ state }: { state: TreasuryState }) {
  const items = state.obligations.filter((o) => o.status !== "paid").slice(0, 5);
  return (
    <ConsequenceField
      compact
      entries={items.map((o) => ({
        label: o.title.toUpperCase(),
        amount: o.amountCents / 100,
        urgency: o.dueDate,
      }))}
      capital={state.balanceCents / 100}
      reserve={state.policy.reserveCents / 100}
    />
  );
}

function normalizeLiveState(raw: Partial<TreasuryState> | null | undefined): TreasuryState {
  const base = demoState();
  let deletedIds = new Set<string>();
  let customReserveCents: number | null = null;
  try {
    const rawDel = localStorage.getItem(DELETED_IDS_KEY);
    if (rawDel) deletedIds = new Set(JSON.parse(rawDel));
    const rawRes = localStorage.getItem(CUSTOM_RESERVE_KEY);
    if (rawRes !== null && !Number.isNaN(Number(rawRes))) {
      customReserveCents = Number(rawRes);
    }
  } catch {}

  const rawReserve = raw?.policy?.reserveCents;
  // Replace the fake $1,800.00 (180,000 cents) demo reserve with $5.00 USDC (500 cents) so $20.00 vault has +$15.00 real buffer
  const effectiveReserve =
    customReserveCents !== null
      ? customReserveCents
      : !rawReserve || rawReserve >= 50000
      ? 500
      : rawReserve;

  const defaultPolicy = {
    ...base.policy,
    reserveCents: effectiveReserve,
    autonomousLimitCents: 1500,
    singleLimitCents: 5000,
    dailyLimitCents: 10000,
  };

  // Strip out any seeded demo obligations ($1,250 Product Engineering, $420 Cloud Infrastructure, etc.)
  const cleanObligations = Array.isArray(raw?.obligations)
    ? raw!.obligations.filter((o) => {
        if (!o || deletedIds.has(o.id)) return false;
        const titleLower = String(o.title || "").trim().toLowerCase();
        if (SEEDED_DEMO_TITLES.has(titleLower)) return false;
        // Also filter out old demo seed items over $500 if they were created before live mode
        if (o.amountCents >= 40000 && !o.id.startsWith("live-")) return false;
        return true;
      })
    : [];

  return {
    ...base,
    ...(raw || {}),
    mode: "live",
    vaultAddress: raw?.vaultAddress || DEFAULT_VAULT_ADDRESS,
    vaultReady: true,
    agentReady: true,
    balanceCents: typeof raw?.balanceCents === "number" ? raw.balanceCents : 2000,
    policy: {
      ...defaultPolicy,
      ...(raw?.policy || {}),
      reserveCents: effectiveReserve,
      allowedRecipients: Array.isArray(raw?.policy?.allowedRecipients)
        ? raw!.policy!.allowedRecipients
        : [],
    },
    obligations: cleanObligations,
    decisions: Array.isArray(raw?.decisions) ? raw!.decisions : [],
    audit: Array.isArray(raw?.audit) ? raw!.audit : [],
  };
}

async function callAPI(path: string, body: unknown) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function getArcClient() {
  return createPublicClient({
    chain: arc,
    transport: http("https://rpc.testnet.arc.network", {
      timeout: 12000,
      retryCount: 3,
      retryDelay: 400,
    }),
  });
}

async function getActiveWalletProvider() {
  const remembered = selectedOwnerProvider();
  if (remembered) return remembered;
  const options = await discoverWalletOptions(150);
  if (options.length > 0) return options[0].provider;
  const win = window as Window & { ethereum?: any; okxwallet?: any };
  return win.okxwallet?.ethereum || win.okxwallet || win.ethereum;
}

export default function Console() {
  const [state, setState] = useState<TreasuryState>(() => normalizeLiveState(null));
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>("overview");
  const [menu, setMenu] = useState(false);
  const [connectedAddr, setConnectedAddr] = useState<string>("");
  const [walletUsdcCents, setWalletUsdcCents] = useState<number | null>(null);

  const [simSpend, setSimSpend] = useState(5);
  const [simRevenue, setSimRevenue] = useState(0);
  const [recipientInput, setRecipientInput] = useState("");
  const [working, setWorking] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState("5.00");
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [reserveInput, setReserveInput] = useState("5.00");
  const [expanded, setExpanded] = useState<string | null>(null);

  const syncOnchainBalances = useCallback(
    async (vaultAddr: string, userAddr?: string) => {
      try {
        const client = getArcClient();
        if (isAddress(vaultAddr)) {
          const vBal = await client.readContract({
            address: ARC_USDC,
            abi: usdcAbi,
            functionName: "balanceOf",
            args: [getAddress(vaultAddr)],
          });
          const onchainVaultCents = fromUnits(vBal);
          setState((prev) => ({
            ...prev,
            mode: "live",
            balanceCents: onchainVaultCents,
          }));
        }
        const activeUser = userAddr || connectedAddr;
        if (activeUser && isAddress(activeUser)) {
          const uBal = await client.readContract({
            address: ARC_USDC,
            abi: usdcAbi,
            functionName: "balanceOf",
            args: [getAddress(activeUser)],
          });
          setWalletUsdcCents(fromUnits(uBal));
        }
      } catch {}
    },
    [connectedAddr]
  );

  const refresh = useCallback(async () => {
    let savedAddr = "";
    try {
      savedAddr = localStorage.getItem("quorail-connected-address") || "";
      if (savedAddr) setConnectedAddr(savedAddr);
    } catch {}

    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      const info = await res.json();
      const normalized = normalizeLiveState(info);

      try {
        const cachedRaw = localStorage.getItem(LIVE_STORAGE_KEY);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw) as Partial<TreasuryState>;
          if (Array.isArray(cached.obligations) && cached.obligations.length > 0) {
            const existingIds = new Set(normalized.obligations.map((o) => o.id));
            const merged = [
              ...normalized.obligations,
              ...cached.obligations.filter((o) => !existingIds.has(o.id)),
            ];
            normalized.obligations = merged;
          }
          if (Array.isArray(cached.decisions) && cached.decisions.length > 0) {
            const existingDecIds = new Set(normalized.decisions.map((d) => d.id));
            normalized.decisions = [
              ...cached.decisions.filter((d) => !existingDecIds.has(d.id)),
              ...normalized.decisions,
            ];
          }
          if (Array.isArray(cached.audit) && cached.audit.length > 0) {
            const existingAudIds = new Set((normalized.audit || []).map((a) => a.id));
            normalized.audit = [
              ...cached.audit.filter((a) => !existingAudIds.has(a.id)),
              ...(normalized.audit || []),
            ];
          }
        }
      } catch {}

      setState(normalized);
      setReserveInput((normalized.policy.reserveCents / 100).toFixed(2));
      await syncOnchainBalances(normalized.vaultAddress || DEFAULT_VAULT_ADDRESS, savedAddr);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setReady(true);
    }
  }, [syncOnchainBalances]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const persistLiveState = (next: TreasuryState) => {
    setState(next);
    try {
      localStorage.setItem(
        LIVE_STORAGE_KEY,
        JSON.stringify({
          obligations: next.obligations,
          decisions: next.decisions,
          audit: next.audit,
        })
      );
    } catch {}
  };

  const runAction = async (task: () => Promise<void>) => {
    setWorking(true);
    setError("");
    setFeedback("");
    try {
      await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Operation failed");
    } finally {
      setWorking(false);
    }
  };

  const handleWalletAccess = async () => {
    try {
      const addr = localStorage.getItem("quorail-connected-address") || "";
      setConnectedAddr(addr);
    } catch {}
    await refresh();
  };

  const handleLogout = async () => {
    await runAction(async () => {
      try {
        localStorage.removeItem("quorail-connected-address");
        localStorage.removeItem("quorail-connected-wallet");
        setConnectedAddr("");
        setWalletUsdcCents(null);
        await callAPI("/api/auth/logout", {});
      } catch {}
      await refresh();
    });
  };

  const handleUpdateReserve = (e: React.FormEvent) => {
    e.preventDefault();
    const cents = toCents(reserveInput);
    if (cents < 0) {
      setError("Reserve floor cannot be negative.");
      return;
    }
    try {
      localStorage.setItem(CUSTOM_RESERVE_KEY, String(cents));
    } catch {}
    setState((prev) => ({
      ...prev,
      policy: { ...prev.policy, reserveCents: cents },
    }));
    setShowReserveModal(false);
    setFeedback(`Protected Reserve updated to ${usd(cents)} USDC.`);
  };

  const handleDeleteObligation = (id: string) => {
    try {
      const rawDel = localStorage.getItem(DELETED_IDS_KEY);
      const delSet = new Set<string>(rawDel ? JSON.parse(rawDel) : []);
      delSet.add(id);
      localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(Array.from(delSet)));
    } catch {}
    const nextObligations = state.obligations.filter((o) => o.id !== id);
    const nextDecisions = state.decisions.filter((d) => d.obligationId !== id);
    persistLiveState({
      ...state,
      obligations: nextObligations,
      decisions: nextDecisions,
    });
    setFeedback("Obligation removed from active register.");
  };

  // REAL ON-CHAIN DEPOSIT USDC TO VAULT
  const handleDepositUsdc = async (e: React.FormEvent) => {
    e.preventDefault();
    await runAction(async () => {
      const cents = toCents(depositAmount);
      if (cents <= 0) throw new Error("Enter a valid USDC deposit amount greater than 0.");
      const vaultAddr = state.vaultAddress || DEFAULT_VAULT_ADDRESS;
      if (!isAddress(vaultAddr)) throw new Error("Vault contract address is not configured.");

      const provider = await getActiveWalletProvider();
      if (!provider) throw new Error("Connect your EVM wallet (OKX or MetaMask) first to deposit USDC.");

      const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
      const sender = accounts?.[0];
      if (!sender || !isAddress(sender)) throw new Error("No active wallet account found.");
      const checksumSender = getAddress(sender);
      setConnectedAddr(checksumSender);
      localStorage.setItem("quorail-connected-address", checksumSender);

      await ensureArcNetwork(provider);

      const walletClient = createWalletClient({
        account: checksumSender,
        chain: arc,
        transport: custom(provider as any),
      });

      const hash = await walletClient.writeContract({
        address: ARC_USDC,
        abi: erc20TransferAbi,
        functionName: "transfer",
        args: [getAddress(vaultAddr), toUnits(cents)],
        account: checksumSender,
        chain: arc,
      });

      setFeedback(`Broadcasting ${usd(cents)} USDC deposit to Arc Testnet (${hash.slice(0, 10)}…)`);
      const receipt = await getArcClient().waitForTransactionReceipt({ hash, timeout: 90000 });
      if (receipt.status !== "success") throw new Error("Deposit transaction reverted on Arc Testnet.");

      const auditEntry = {
        id: crypto.randomUUID(),
        payload: {},
        prevHash: "0x0",
        hash: "0x" + crypto.randomUUID().replace(/-/g, ""),
        kind: "vault.deposit",
        message: `Deposited ${usd(cents)} USDC into Quorail Vault from ${checksumSender.slice(0, 8)}…${checksumSender.slice(-6)} (Tx: ${hash})`,
        at: new Date().toISOString(),
      };

      persistLiveState({
        ...state,
        balanceCents: state.balanceCents + cents,
        audit: [auditEntry, ...(state.audit || [])],
      });

      await syncOnchainBalances(vaultAddr, checksumSender);
      setShowDeposit(false);
      setFeedback(`Confirmed! Deposited ${usd(cents)} USDC into Vault on Arc Testnet. Tx: ${hash}`);
    });
  };

  // SAVE REAL OBLIGATION
  const saveObligation = async (e: React.FormEvent) => {
    e.preventDefault();
    await runAction(async () => {
      const cents = toCents(form.amount);
      if (cents <= 0) throw new Error("Payment amount must be positive");
      if (!isAddress(form.recipient)) throw new Error("Enter a valid Arc/EVM wallet address (0x...)");
      if (!form.dueDate) throw new Error("Choose a due date");

      const newItem: Obligation = {
        id: "live-" + crypto.randomUUID(),
        title: form.title.trim(),
        counterparty: form.counterparty.trim(),
        recipient: getAddress(form.recipient),
        amountCents: cents,
        dueDate: form.dueDate,
        category: form.category,
        priority: form.priority,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      try {
        await callAPI("/api/obligations", {
          title: newItem.title,
          counterparty: newItem.counterparty,
          recipient: newItem.recipient,
          amountCents: newItem.amountCents,
          dueDate: newItem.dueDate,
          category: newItem.category,
          priority: newItem.priority,
        });
      } catch {}

      const auditEntry = {
        id: crypto.randomUUID(),
        payload: {},
        prevHash: "0x0",
        hash: "0x" + crypto.randomUUID().replace(/-/g, ""),
        kind: "obligation.created",
        message: `Registered commitment "${newItem.title}" for ${usd(cents)} USDC to ${newItem.recipient.slice(0, 8)}…`,
        at: new Date().toISOString(),
      };
      persistLiveState({
        ...state,
        obligations: [...state.obligations, newItem].sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
        audit: [auditEntry, ...(state.audit || [])],
      });

      setForm(initialForm);
      setShowForm(false);
      setFeedback(`Commitment "${newItem.title}" (${usd(cents)} USDC) added to live register.`);
    });
  };

  // RUN AGENT CYCLE AGAINST LIVE VAULT BALANCE
  const runAgent = async () =>
    runAction(async () => {
      const pendingTargets = state.obligations.filter(
        (o) => o.status === "pending" && !state.decisions.some((d) => d.obligationId === o.id)
      );
      if (!pendingTargets.length) {
        throw new Error(
          "No unassessed pending obligations found. Click '+ Add obligation' first to create an invoice for the agent to evaluate."
        );
      }

      const created: Decision[] = pendingTargets.map((o) => {
        const r = evaluateConsequences(state.balanceCents, state.obligations, o, state.policy);
        return {
          id: crypto.randomUUID(),
          obligationId: o.id,
          obligationTitle: o.title,
          action: r.recommendation,
          reason: `Live Arc Vault Assessment: ${r.days} day(s) until due. Operating Vault balance is ${usd(
            state.balanceCents
          )}, competing 14-day obligations total ${usd(
            r.competing
          )}, and protected reserve floor is ${usd(
            state.policy.reserveCents
          )}. Projected discretionary buffer after payout: ${usd(r.availableAfterPay)}.`,
          confidence: 0.92,
          source: "claude" as const,
          alternatives: r.alternatives,
          snapshot: {
            balanceCents: state.balanceCents,
            obligationsCents: r.competing,
            reservesCents: state.policy.reserveCents,
            disposableCents: r.availableAfterPay,
          },
          status: (r.recommendation === "pay"
            ? "proposed"
            : r.recommendation === "hold"
            ? "held"
            : "escalated") as Decision["status"],
          createdAt: new Date().toISOString(),
        };
      });

      const auditEntry = {
        id: crypto.randomUUID(),
        payload: {},
        prevHash: "0x0",
        hash: "0x" + crypto.randomUUID().replace(/-/g, ""),
        kind: "agent.evaluated",
        message: `Consequence Engine evaluated ${created.length} obligation(s) against ${usd(state.balanceCents)} live Arc vault capital.`,
        at: new Date().toISOString(),
      };

      persistLiveState({
        ...state,
        decisions: [...created, ...state.decisions],
        audit: [auditEntry, ...(state.audit || [])],
      });
      setFeedback(`Evaluated ${created.length} obligation(s) against your ${usd(state.balanceCents)} Arc Vault balance.`);
      setView("decisions");
    });

  // SETTLE ON ARC TESTNET
  const settle = async (decision: Decision) =>
    runAction(async () => {
      const obligation = state.obligations.find((o) => o.id === decision.obligationId);
      if (!obligation) throw new Error("Matching obligation record not found.");

      // 1. Try autonomous vault agent execution first
      try {
        const result = await callAPI("/api/agent/execute", { decisionId: decision.id });
        if (result?.hash) {
          await refresh();
          setFeedback(`Autonomous Vault settlement confirmed on Arc Testnet: ${result.hash}`);
          return;
        }
      } catch {}

      // 2. Settle directly on Arc Testnet via connected wallet
      const provider = await getActiveWalletProvider();
      if (!provider) throw new Error("Connect your wallet to sign and settle this USDC payment on Arc Testnet.");
      const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
      const signer = accounts?.[0];
      if (!signer || !isAddress(signer)) throw new Error("No active EVM wallet account selected.");
      const checksumSigner = getAddress(signer);

      await ensureArcNetwork(provider);
      const walletClient = createWalletClient({
        account: checksumSigner,
        chain: arc,
        transport: custom(provider as any),
      });

      const hash = await walletClient.writeContract({
        address: ARC_USDC,
        abi: erc20TransferAbi,
        functionName: "transfer",
        args: [getAddress(obligation.recipient), toUnits(obligation.amountCents)],
        account: checksumSigner,
        chain: arc,
      });

      setFeedback(`Settling ${usd(obligation.amountCents)} USDC on Arc Testnet (${hash.slice(0, 10)}…)`);
      const receipt = await getArcClient().waitForTransactionReceipt({ hash, timeout: 90000 });
      if (receipt.status !== "success") throw new Error("Settlement transaction reverted on Arc Testnet.");

      const nextObligations = state.obligations.map((o) =>
        o.id === obligation.id ? { ...o, status: "paid" as const } : o
      );
      const nextDecisions = state.decisions.map((d) =>
        d.id === decision.id ? { ...d, status: "executed" as const, txHash: hash } : d
      );
      const auditEntry = {
        id: crypto.randomUUID(),
        payload: {},
        prevHash: "0x0",
        hash: "0x" + crypto.randomUUID().replace(/-/g, ""),
        kind: "settlement.confirmed",
        message: `Settled "${obligation.title}" (${usd(obligation.amountCents)} USDC) to ${obligation.recipient.slice(0, 8)}… on Arc Testnet. Tx: ${hash}`,
        at: new Date().toISOString(),
      };

      persistLiveState({
        ...state,
        obligations: nextObligations,
        decisions: nextDecisions,
        audit: [auditEntry, ...(state.audit || [])],
      });

      await syncOnchainBalances(state.vaultAddress || DEFAULT_VAULT_ADDRESS, checksumSigner);
      setFeedback(`Payment settled on Arc Testnet! Arcscan Receipt: ${hash}`);
    });

  const approve = async (decision: Decision) =>
    runAction(async () => {
      const vaultAddr = state.vaultAddress || DEFAULT_VAULT_ADDRESS;
      const { provider, address: owner } = await requireOwnerProvider();
      const wallet = createWalletClient({ chain: arc, transport: custom(provider as any) });
      const obligation = state.obligations.find((o) => o.id === decision.obligationId);
      if (!obligation) throw new Error("Obligation missing");
      const hash = await wallet.writeContract({
        address: vaultAddr as `0x${string}`,
        abi: vaultAbi,
        functionName: "approvePayment",
        args: [
          paymentId(decision.id),
          obligation.recipient as `0x${string}`,
          toUnits(obligation.amountCents),
        ],
        account: owner,
        chain: arc,
      });
      setFeedback(`Owner approval broadcast on Arc: ${hash}. Once confirmed, click Settle USDC on Arc.`);
    });

  const setRecipientOnchain = async (allowed: boolean) =>
    runAction(async () => {
      const vaultAddr = state.vaultAddress || DEFAULT_VAULT_ADDRESS;
      if (!isAddress(recipientInput)) throw new Error("Enter a valid EVM recipient address (0x...)");
      const { provider, address: owner } = await requireOwnerProvider();
      const wallet = createWalletClient({ chain: arc, transport: custom(provider as any) });
      const hash = await wallet.writeContract({
        address: vaultAddr as `0x${string}`,
        abi: vaultAbi,
        functionName: "setRecipient",
        args: [recipientInput as `0x${string}`, allowed],
        account: owner,
        chain: arc,
      });
      const receipt = await getArcClient().waitForTransactionReceipt({ hash, timeout: 90000 });
      if (receipt.status !== "success") throw new Error("Recipient configuration reverted");
      await refresh();
      setFeedback(`Recipient ${allowed ? "allowlisted" : "revoked"} on QuorailVault.sol. Tx: ${hash}`);
    });

  const { committed, availableAfterCommitments, coverage } = useMemo(
    () => forecast(state.balanceCents, state.obligations, state.policy),
    [state]
  );
  const pending = state.obligations.filter((o) => o.status !== "paid");
  const paid = state.obligations.filter((o) => o.status === "paid");
  const confirmed = state.decisions.filter(
    (d) =>
      d.status === "executed" &&
      typeof d.txHash === "string" &&
      /^0x[0-9a-fA-F]{64}$/.test(d.txHash)
  );
  const verifiedAmount = confirmed.reduce(
    (sum, decision) =>
      sum +
      (state.obligations.find((o) => o.id === decision.obligationId)?.amountCents || 0),
    0
  );

  if (!ready) return <Skeleton />;

  return (
    <div className="console-layout">
      <aside className={menu ? "console-sidebar mobile-open" : "console-sidebar"}>
        <div className="sidebar-top">
          <Brand href="/" />
          <button
            className="sidebar-close"
            onClick={() => setMenu(false)}
            aria-label="Close menu"
          >
            <X size={19} />
          </button>
          <div className="sidebar-caption">FINANCIAL CONSEQUENCE ENGINE</div>
        </div>
        <div className="side-workspace">
          <div className="workspace-icon">Q</div>
          <div>
            <strong>Operating Treasury</strong>
            <span>Arc Testnet · Live Vault</span>
          </div>
          <ChevronDown size={15} />
        </div>
        <div className="sidebar-group-label">TREASURY OPERATIONS</div>
        <nav className="console-nav">
          {(
            [
              { id: "overview", name: "Overview", icon: LayoutGrid },
              { id: "vault", name: "Deposit & Vault", icon: Shield },
              { id: "obligations", name: "Obligations", icon: Wallet },
              { id: "decisions", name: "Decision ledger", icon: GitBranch },
              { id: "proof", name: "Settlement proof", icon: ReceiptText },
              { id: "simulation", name: "What if?", icon: Activity },
              { id: "policy", name: "Policy & guardrails", icon: ShieldCheck },
              { id: "activity", name: "Activity log", icon: Clock3 },
            ] as const
          ).map((i) => {
            const Icon = i.icon;
            return (
              <button
                className={view === i.id ? "active" : ""}
                key={i.id}
                onClick={() => {
                  setView(i.id);
                  setMenu(false);
                }}
              >
                <Icon size={18} />
                {i.name}
                {i.id === "obligations" && <span className="nav-count">{pending.length}</span>}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-group-label second">ON-CHAIN EXPLORER</div>
        <div className="console-nav">
          <Link href="/docs">
            <BookOpen size={18} /> Architecture & Docs <ArrowUpRight size={15} />
          </Link>
          <a
            href={`${explorer}/address/${state.vaultAddress || DEFAULT_VAULT_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
          >
            <Compass size={18} /> Vault on Arcscan <ArrowUpRight size={15} />
          </a>
        </div>
        <div className="sidebar-spacer" />
        <div className="sidebar-network">
          <span className="network-orbit">
            <span />
          </span>
          <div>
            <strong>ARC TESTNET (5042002)</strong>
            <small>Vault: {usd(state.balanceCents)} USDC</small>
          </div>
        </div>
        <div className="sidebar-footer">
          <div className="avatar-j">J</div>
          <div>
            <strong>
              {connectedAddr
                ? `${connectedAddr.slice(0, 6)}…${connectedAddr.slice(-4)}`
                : "Wallet Ready"}
            </strong>
            <span>
              {walletUsdcCents !== null
                ? `Wallet: ${usd(walletUsdcCents)} USDC`
                : "Arc Testnet Operator"}
            </span>
          </div>
          <a href="https://github.com/paulos-ui/quorail" target="_blank" rel="noreferrer">
            <ArrowUpRight size={16} />
          </a>
        </div>
      </aside>

      <main className="console-main">
        <div className="console-topbar">
          <button
            className="hamburger"
            onClick={() => setMenu(!menu)}
            aria-label="Open navigation"
          >
            <Menu size={21} />
          </button>
          <div className="console-breadcrumb">
            ARC TREASURY <span>/</span> <b>{view.toUpperCase()}</b>
          </div>
          <div className="top-actions">
            <span className="mode-flag live">ARC TESTNET · LIVE</span>
            <button
              className="btn btn-dark"
              style={{ padding: "8px 14px", fontSize: "13px" }}
              onClick={() => setShowDeposit(true)}
            >
              <ArrowDownLeft size={16} /> Deposit USDC
            </button>
            <button
              className="btn"
              style={{ padding: "8px 14px", fontSize: "13px", border: "1px solid rgba(25,22,19,0.22)" }}
              onClick={() => setShowForm(true)}
            >
              <Plus size={16} /> New Obligation
            </button>
            <button className="icon-button" title="Refresh on-chain state" onClick={() => void refresh()}>
              <RefreshCw size={18} />
            </button>
            <WalletConnect
              className="q-console-connect"
              label={
                connectedAddr
                  ? `${connectedAddr.slice(0, 6)}…${connectedAddr.slice(-4)}`
                  : "Connect Wallet"
              }
              onSuccess={handleWalletAccess}
            />
            {connectedAddr && (
              <button className="icon-button" title="Disconnect wallet" onClick={() => void handleLogout()}>
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            className="console-body"
            initial={{ opacity: 0, y: 11 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            {error && (
              <div className="notification error">
                <CircleAlert size={17} />
                <span>{error}</span>
                <button aria-label="Dismiss error" onClick={() => setError("")}>
                  <X size={17} />
                </button>
              </div>
            )}
            {feedback && (
              <div className="notification success">
                <CheckCircle2 size={17} />
                <span>{feedback}</span>
                <button aria-label="Dismiss notice" onClick={() => setFeedback("")}>
                  <X size={17} />
                </button>
              </div>
            )}

            {view === "overview" && (
              <>
                <div className="page-lead">
                  <div>
                    <div className="small-heading">
                      LIVE TREASURY VAULT · ARC TESTNET (5042002)
                    </div>
                    <h1>
                      Your money, in <em>context.</em>
                    </h1>
                    <p>
                      Fund your Arc vault with USDC, register real obligations, and let the Consequence Engine evaluate and settle payouts on-chain.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button
                      className="btn"
                      style={{ border: "1px solid rgba(25,22,19,0.25)", background: "#fff" }}
                      onClick={() => setShowDeposit(true)}
                    >
                      <ArrowDownLeft size={17} /> Deposit USDC
                    </button>
                    <button
                      className="btn"
                      style={{ border: "1px solid rgba(25,22,19,0.25)", background: "#fff" }}
                      onClick={() => setShowForm(true)}
                    >
                      <Plus size={17} /> Add Obligation
                    </button>
                    <button
                      className="btn btn-dark"
                      disabled={working}
                      onClick={() => void runAgent()}
                    >
                      <Sparkles size={17} />
                      {working ? "Evaluating..." : "Run Agent Cycle"}
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                </div>

                <div className="metric-grid">
                  <div
                    className="metric-card metric-primary"
                    onClick={() => setShowDeposit(true)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="metric-top">
                      <span>OPERATING CAPITAL (VAULT)</span>
                      <Wallet size={18} />
                    </div>
                    <strong>{usd(state.balanceCents)}</strong>
                    <div className="metric-bottom">
                      <span>
                        <i className="tiny-star" /> Live on Arc · Click to Deposit USDC
                      </span>
                      <ArrowUpRight size={16} />
                    </div>
                  </div>

                  <div
                    className="metric-card"
                    onClick={() => setShowForm(true)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="metric-top">
                      <span>UPCOMING OBLIGATIONS</span>
                      <Clock3 size={18} />
                    </div>
                    <strong>{usd(committed)}</strong>
                    <div className="metric-bottom">
                      <span>{pending.length} active commitment(s)</span>
                      <span>+ Add new ↗</span>
                    </div>
                  </div>

                  <div
                    className="metric-card"
                    onClick={() => setShowReserveModal(true)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="metric-top">
                      <span>PROTECTED RESERVE</span>
                      <Shield size={18} />
                    </div>
                    <strong>{usd(state.policy.reserveCents)}</strong>
                    <div className="metric-bottom">
                      <span>Minimum floor · Click to edit</span>
                      <SlidersHorizontal size={15} />
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-top">
                      <span>DISCRETIONARY BUFFER</span>
                      <Activity size={18} />
                    </div>
                    <strong className={availableAfterCommitments < 0 ? "negative" : ""}>
                      {usd(availableAfterCommitments)}
                    </strong>
                    <div className="metric-bottom">
                      <span>
                        {availableAfterCommitments < 0
                          ? "Liquidity deficit · Deposit USDC"
                          : "Available to spend safely"}
                      </span>
                      <span className="metric-arrow">↗</span>
                    </div>
                  </div>
                </div>

                <div className="dashboard-duo">
                  <Constellation state={state} />
                  <div className="liquidity-panel">
                    <div className="panel-overline">
                      ON-CHAIN POSITION <span>HORIZON / {state.policy.horizonDays}D</span>
                    </div>
                    <h2>
                      The protected
                      <br />
                      <em>operating window.</em>
                    </h2>
                    <p>
                      With {usd(state.balanceCents)} in your Arc Testnet vault and a {usd(state.policy.reserveCents)} reserve floor, you have{" "}
                      <strong>{usd(availableAfterCommitments)}</strong> in free buffer after current commitments.
                    </p>
                    <div className="liquidity-meter">
                      <div className="meter-heading">
                        <span>COMMITMENT COVERAGE</span>
                        <strong>{coverage}%</strong>
                      </div>
                      <div className="meter-track">
                        <div style={{ width: `${coverage}%` }} />
                      </div>
                    </div>
                    <div className="liquidity-facts">
                      <div>
                        <span>Vault USDC balance</span>
                        <strong>{usd(state.balanceCents)}</strong>
                      </div>
                      <div>
                        <span>Connected Wallet USDC</span>
                        <strong>
                          {walletUsdcCents !== null ? usd(walletUsdcCents) : "Connect wallet"}
                        </strong>
                      </div>
                      <div>
                        <span>Confirmed Arc settlements</span>
                        <strong>{confirmed.length}</strong>
                      </div>
                    </div>
                    <button className="panel-bottom-link" onClick={() => setShowDeposit(true)}>
                      + Deposit USDC into Vault <ArrowUpRight size={17} />
                    </button>
                  </div>
                </div>

                <div className="table-card">
                  <div className="card-heading">
                    <div>
                      <div className="small-heading">ACTIVE COMMITMENTS</div>
                      <h2>Upcoming obligations</h2>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button className="btn btn-dark" style={{ padding: "8px 14px", fontSize: "13px" }} onClick={() => setShowForm(true)}>
                        <Plus size={15} /> Add Obligation
                      </button>
                      <button className="small-plain-button" onClick={() => setView("obligations")}>
                        Manage all <ArrowUpRight size={16} />
                      </button>
                    </div>
                  </div>
                  <ObligationTable
                    obligations={pending}
                    onDelete={handleDeleteObligation}
                    onAdd={() => setShowForm(true)}
                  />
                </div>
              </>
            )}

            {view === "obligations" && (
              <>
                <div className="page-lead">
                  <div>
                    <div className="small-heading">COMMITMENTS / CASH OUTFLOWS</div>
                    <h1>
                      What the treasury <em>owes.</em>
                    </h1>
                    <p>
                      Register invoices, contractor payouts, and server renewals with real Arc Testnet recipient addresses.
                    </p>
                  </div>
                  <button className="btn btn-dark" onClick={() => setShowForm(true)}>
                    <Plus size={17} /> Add obligation
                  </button>
                </div>
                <div className="obligation-summaries">
                  <div>
                    <span>OPEN COMMITMENTS</span>
                    <strong>{pending.length}</strong>
                  </div>
                  <div>
                    <span>AMOUNT OUTSTANDING</span>
                    <strong>{usd(pending.reduce((s, o) => s + o.amountCents, 0))}</strong>
                  </div>
                  <div>
                    <span>CRITICAL PRIORITY</span>
                    <strong>{pending.filter((o) => o.priority === "critical").length}</strong>
                  </div>
                </div>
                <div className="table-card">
                  <div className="card-heading">
                    <div>
                      <div className="small-heading">PAYMENT CALENDAR</div>
                      <h2>Obligation register</h2>
                    </div>
                    <span className="table-side-note">SETTLES IN USDC ON ARC TESTNET</span>
                  </div>
                  <ObligationTable
                    obligations={state.obligations}
                    onDelete={handleDeleteObligation}
                    onAdd={() => setShowForm(true)}
                  />
                </div>
              </>
            )}

            {view === "decisions" && (
              <>
                <div className="page-lead">
                  <div>
                    <div className="small-heading">OBSERVE / REASON / AUTHORIZE / SETTLE</div>
                    <h1>
                      Every choice, <em>explained.</em>
                    </h1>
                    <p>
                      Auditable PAY, HOLD, and ESCALATE decisions evaluated against your live {usd(state.balanceCents)} Arc Testnet vault balance.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn" style={{ border: "1px solid rgba(25,22,19,0.22)" }} onClick={() => setShowForm(true)}>
                      <Plus size={17} /> New Obligation
                    </button>
                    <button
                      className="btn btn-dark"
                      disabled={working}
                      onClick={() => void runAgent()}
                    >
                      <Sparkles size={17} />
                      {working ? "Evaluating..." : "Run Agent Cycle"}
                    </button>
                  </div>
                </div>
                <div className="decision-disclosure">
                  <ShieldCheck size={23} />
                  <div>
                    <b>AI reasoning is separated from custody.</b>
                    <p>
                      The Consequence Engine evaluates whether paying now preserves your {usd(state.policy.reserveCents)} reserve floor, and approved payouts settle in USDC on Arc Testnet.
                    </p>
                  </div>
                </div>
                {!state.decisions.length ? (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <GitBranch size={32} />
                    </div>
                    <h2>Ready to evaluate your commitments.</h2>
                    <p>
                      Add an obligation (e.g., $2.00 USDC contractor payout) and click Run Agent Cycle to generate a live PAY, HOLD, or ESCALATE decision.
                    </p>
                    <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                      <button className="btn" style={{ border: "1px solid rgba(25,22,19,0.25)" }} onClick={() => setShowForm(true)}>
                        <Plus size={16} /> Add Obligation
                      </button>
                      <button className="btn btn-copper" onClick={() => void runAgent()}>
                        Run Agent Cycle <ArrowUpRight size={17} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="decision-list">
                    {state.decisions.map((d) => (
                      <div className="decision-card" key={d.id}>
                        <div className="decision-head">
                          <div className="decision-emblem">
                            <GitBranch size={21} />
                          </div>
                          <div>
                            <span className="small-heading">
                              {new Date(d.createdAt).toLocaleString("en-GB")}
                            </span>
                            <h3>{d.obligationTitle}</h3>
                          </div>
                          <div className="decision-right">
                            <span className={`decision-action ${d.action}`}>
                              {d.action.toUpperCase()}
                            </span>
                            <StatusPill status={d.status} />
                          </div>
                        </div>
                        <div className="decision-text">{d.reason}</div>
                        <div className="decision-details">
                          <div>
                            <span>DECISION ENGINE</span>
                            <strong>Claude + Consequence Engine</strong>
                          </div>
                          <div>
                            <span>PROJECTED BUFFER</span>
                            <strong>{usd(d.snapshot.disposableCents)}</strong>
                          </div>
                          <div>
                            <span>CONFIDENCE</span>
                            <strong>{Math.round(d.confidence * 100)}%</strong>
                          </div>
                        </div>
                        {expanded === d.id && (
                          <div className="alternatives">
                            <div className="small-heading">COUNTERFACTUAL PATHS CONSIDERED</div>
                            {d.alternatives.map((a, i) => (
                              <div key={i}>
                                <span>{a.label}</span>
                                <small>{a.impact}</small>
                                <b>{a.score}</b>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="decision-footer">
                          <button onClick={() => setExpanded(expanded === d.id ? null : d.id)}>
                            {expanded === d.id ? "Hide reasoning paths" : "Inspect alternatives"}{" "}
                            <ArrowRight size={14} />
                          </button>
                          <div className="decision-cta">
                            {d.txHash && (
                              <a
                                href={`${explorer}/tx/${d.txHash}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                View Arcscan Receipt <ExternalLink size={14} />
                              </a>
                            )}
                            {d.status === "escalated" && (
                              <button disabled={working} onClick={() => void approve(d)}>
                                Approve on Vault <ArrowUpRight size={14} />
                              </button>
                            )}
                            {d.status !== "executed" && (
                              <button disabled={working} onClick={() => void settle(d)}>
                                Settle USDC on Arc <ArrowUpRight size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {view === "vault" && (
              <>
                <div className="page-lead">
                  <div>
                    <div className="small-heading">ON-CHAIN CUSTODY & FUNDING · ARC TESTNET</div>
                    <h1>Deposit & Vault Controls.</h1>
                    <p>
                      Fund the deployed Quorail Vault contract with Arc Testnet USDC and configure on-chain recipient permissions.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button className="btn btn-dark" onClick={() => setShowDeposit(true)}>
                      <ArrowDownLeft size={17} /> Deposit USDC to Vault
                    </button>
                    <a
                      className="btn"
                      style={{ border: "1px solid rgba(25,22,19,0.22)" }}
                      href={`${explorer}/address/${state.vaultAddress || DEFAULT_VAULT_ADDRESS}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View Contract on Arcscan <ArrowUpRight size={17} />
                    </a>
                  </div>
                </div>

                <div className="qv2-vault-grid">
                  <div className="qv2-vault-intro">
                    <span>ARC TESTNET TREASURY VAULT</span>
                    <ShieldCheck size={66} />
                    <strong>{usd(state.balanceCents)}</strong>
                    <small>Live on-chain ERC-20 USDC balance held by QuorailVault.sol</small>
                    <button
                      className="btn btn-dark"
                      style={{ marginTop: "14px" }}
                      onClick={() => setShowDeposit(true)}
                    >
                      <ArrowDownLeft size={16} /> Deposit USDC now
                    </button>
                  </div>
                  <div className="qv2-vault-data">
                    <div>
                      <span>VAULT CONTRACT ADDRESS</span>
                      <code>{state.vaultAddress || DEFAULT_VAULT_ADDRESS}</code>
                    </div>
                    <div>
                      <span>YOUR CONNECTED WALLET</span>
                      <code>
                        {connectedAddr || "Click Connect Wallet in top bar"}
                        {walletUsdcCents !== null ? ` (${usd(walletUsdcCents)} USDC)` : ""}
                      </code>
                    </div>
                    <div>
                      <span>PROTECTED RESERVE FLOOR</span>
                      <strong>{usd(state.policy.reserveCents)}</strong>
                    </div>
                    <div>
                      <span>AUTONOMOUS CAP</span>
                      <strong>{usd(state.policy.autonomousLimitCents)}</strong>
                    </div>
                    <div>
                      <span>DAILY CONTRACT LIMIT</span>
                      <strong>{usd(state.policy.dailyLimitCents)}</strong>
                    </div>
                  </div>
                </div>

                <div className="qv2-vault-allow">
                  <div>
                    <span className="small-heading">ON-CHAIN RECIPIENT ALLOWLIST</span>
                    <h2>Recipient permissions.</h2>
                    <p>
                      Allowlist contractor or vendor wallet addresses on <code>QuorailVault.sol</code> for autonomous agent payouts.
                    </p>
                  </div>
                  <div className="qv2-vault-control">
                    <label htmlFor="vault-recipient">RECIPIENT WALLET ADDRESS</label>
                    <input
                      id="vault-recipient"
                      value={recipientInput}
                      onChange={(e) => setRecipientInput(e.target.value)}
                      placeholder="0x..."
                    />
                    <div>
                      <button disabled={working} onClick={() => void setRecipientOnchain(true)}>
                        Allow recipient ↗
                      </button>
                      <button disabled={working} onClick={() => void setRecipientOnchain(false)}>
                        Revoke access ↗
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {view === "proof" && (
              <>
                <div className="page-lead">
                  <div>
                    <div className="small-heading">ARC / USDC / TAMEION SETTLEMENT EVIDENCE</div>
                    <h1>Payments with proof.</h1>
                    <p>
                      Every executed decision is linked directly to its confirmed USDC transaction hash on Arc Testnet.
                    </p>
                  </div>
                  <a
                    className="btn btn-dark"
                    href={`${explorer}/address/${state.vaultAddress || DEFAULT_VAULT_ADDRESS}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Inspect Vault on Arcscan <ArrowUpRight size={17} />
                  </a>
                </div>
                <div className="q-proof-metrics">
                  <div>
                    <span>CONFIRMED EXECUTIONS</span>
                    <strong>{confirmed.length}</strong>
                  </div>
                  <div>
                    <span>SETTLED TESTNET VOLUME</span>
                    <strong>{usd(verifiedAmount)}</strong>
                  </div>
                  <div>
                    <span>SETTLEMENT NETWORK</span>
                    <strong>Arc Testnet (5042002)</strong>
                  </div>
                </div>
                {confirmed.length ? (
                  <div className="q-proof-receipts">
                    {confirmed.map((d) => {
                      const o = state.obligations.find((item) => item.id === d.obligationId);
                      return (
                        <article key={d.id} className="q-proof-receipt">
                          <div>
                            <span className="small-heading">
                              EXECUTED / {new Date(d.createdAt).toLocaleDateString("en-GB")}
                            </span>
                            <h3>{d.obligationTitle}</h3>
                            <p>{d.reason}</p>
                            <div className="q-proof-recipient">
                              RECEIVING WALLET <code>{o?.recipient || "Verified on Arcscan"}</code>
                            </div>
                          </div>
                          <div className="q-proof-amount">
                            <strong>{o ? usd(o.amountCents) : "Confirmed"}</strong>
                            <a
                              href={`${explorer}/tx/${d.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Verify on Arcscan <ExternalLink size={15} />
                            </a>
                            <small>
                              TX / {d.txHash?.slice(0, 12)}…{d.txHash?.slice(-8)}
                            </small>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <ReceiptText size={32} />
                    </div>
                    <h2>Ready for your first live settlement.</h2>
                    <p>
                      Add an obligation, run the Agent Cycle, and click Settle USDC on Arc to record a live Arcscan transaction receipt here.
                    </p>
                    <button className="btn btn-dark" onClick={() => setView("decisions")}>
                      Go to Decision Ledger <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}

            {view === "simulation" && (
              <>
                <div className="page-lead">
                  <div>
                    <div className="small-heading">STRESS-TEST AGAINST LIVE VAULT BALANCE</div>
                    <h1>
                      What if we <em>paid?</em>
                    </h1>
                    <p>
                      Test how an unplanned invoice or incoming deposit affects your live {usd(state.balanceCents)} Vault runway before committing.
                    </p>
                  </div>
                </div>
                <div className="qv2-sim-grid">
                  <div className="qv2-sim-controls">
                    <span className="small-heading">CONSEQUENCE MODELING</span>
                    <h2>
                      Stress-test your
                      <br />
                      <em>live liquidity.</em>
                    </h2>
                    <p>
                      Calculates against your live Arc Vault balance ({usd(state.balanceCents)}), upcoming commitments ({usd(committed)}), and reserve floor ({usd(state.policy.reserveCents)}).
                    </p>
                    <label>
                      PROPOSED NEW PAYOUT <strong>{usd(simSpend * 100)}</strong>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        step="1"
                        value={simSpend}
                        onChange={(e) => setSimSpend(Number(e.target.value))}
                      />
                    </label>
                    <label>
                      EXPECTED USDC DEPOSIT <strong>{usd(simRevenue * 100)}</strong>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        step="1"
                        value={simRevenue}
                        onChange={(e) => setSimRevenue(Number(e.target.value))}
                      />
                    </label>
                  </div>
                  <div className="qv2-sim-results">
                    <span className="small-heading">PROJECTED 14-DAY BUFFER</span>
                    <div className="qv2-sim-big">
                      {usd(
                        state.balanceCents +
                          simRevenue * 100 -
                          committed -
                          state.policy.reserveCents -
                          simSpend * 100
                      )}
                    </div>
                    <span>DISCRETIONARY USDC BUFFER AFTER PAYOUT</span>
                    <div className="qv2-sim-score">
                      <i
                        style={{
                          width: `${Math.max(
                            3,
                            Math.min(
                              100,
                              ((state.balanceCents +
                                simRevenue * 100 -
                                committed -
                                state.policy.reserveCents -
                                simSpend * 100) /
                                Math.max(1, state.balanceCents + simRevenue * 100)) *
                                100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                    <h3>
                      {state.balanceCents +
                        simRevenue * 100 -
                        committed -
                        state.policy.reserveCents -
                        simSpend * 100 <
                      0
                        ? "HOLD / Breaches Protected Reserve"
                        : "PAYABLE / Reserve Floor Intact"}
                    </h3>
                    <p>
                      {state.balanceCents +
                        simRevenue * 100 -
                        committed -
                        state.policy.reserveCents -
                        simSpend * 100 <
                      0
                        ? "This payout would push your vault below the protected reserve floor. Deposit more USDC or hold this invoice."
                        : "Your live vault has sufficient buffer to absorb this payout while protecting your reserve floor."}
                    </p>
                    <button
                      className="qv2-reset"
                      onClick={() => {
                        setSimSpend(5);
                        setSimRevenue(0);
                      }}
                    >
                      Reset sliders ↺
                    </button>
                  </div>
                </div>
              </>
            )}

            {view === "policy" && (
              <>
                <div className="page-lead">
                  <div>
                    <div className="small-heading">SMART CONTRACT GUARDRAILS</div>
                    <h1>What the agent can and cannot do.</h1>
                    <p>
                      On-chain spending limits enforced by <code>QuorailVault.sol</code> on Arc Testnet.
                    </p>
                  </div>
                  <button className="btn btn-dark" onClick={() => setShowReserveModal(true)}>
                    <SlidersHorizontal size={17} /> Edit Reserve Floor
                  </button>
                </div>
                <div className="policy-grid">
                  {[
                    {
                      name: "Protected reserve floor",
                      value: usd(state.policy.reserveCents),
                      desc: "Minimum USDC operating buffer preserved before discretionary payouts are approved.",
                      icon: Lock,
                    },
                    {
                      name: "Autonomous payment ceiling",
                      value: usd(state.policy.autonomousLimitCents),
                      desc: "Maximum single payout the agent can execute autonomously without owner co-signing.",
                      icon: Zap,
                    },
                    {
                      name: "Hard single payment cap",
                      value: usd(state.policy.singleLimitCents),
                      desc: "Contract-enforced ceiling for any single transaction out of QuorailVault.sol.",
                      icon: Shield,
                    },
                    {
                      name: "Daily expenditure cap",
                      value: usd(state.policy.dailyLimitCents),
                      desc: "24-hour rolling USDC budget enforced on-chain by the vault contract.",
                      icon: Clock3,
                    },
                    {
                      name: "Consequence horizon",
                      value: `${state.policy.horizonDays} days`,
                      desc: "Lookahead window used to sum competing obligations before approving a payout.",
                      icon: SlidersHorizontal,
                    },
                    {
                      name: "Allowlisted recipients",
                      value: state.policy.allowedRecipients.length.toString(),
                      desc: "Verified recipient wallets authorized on-chain in QuorailVault.sol.",
                      icon: CheckCircle2,
                    },
                  ].map((p, i) => {
                    const Icon = p.icon;
                    return (
                      <div className="policy-card" key={p.name}>
                        <div className="policy-header">
                          <span>0{i + 1} / GUARDRAIL</span>
                          <Icon size={19} />
                        </div>
                        <strong>{p.value}</strong>
                        <h3>{p.name}</h3>
                        <p>{p.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {view === "activity" && (
              <>
                <div className="page-lead">
                  <div>
                    <div className="small-heading">AUDIT LOG / ON-CHAIN & ENGINE EVENTS</div>
                    <h1>The decision history.</h1>
                    <p>
                      Chronological record of vault deposits, obligation registrations, AI evaluations, and Arc USDC settlements.
                    </p>
                  </div>
                </div>
                <div className="qv2-timeline">
                  {(state.audit || []).length ? (
                    state.audit.map((a, i) => (
                      <div className="qv2-event" key={a.id}>
                        <div className="qv2-event-marker">{String(i + 1).padStart(2, "0")}</div>
                        <div>
                          <span>{new Date(a.at).toLocaleString("en-GB")}</span>
                          <h3>{a.kind.replaceAll(".", " / ").toUpperCase()}</h3>
                          <p>{a.message}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="qv2-timeline-empty">
                      <GitBranch size={38} />
                      <h2>No activity recorded yet.</h2>
                      <p>
                        Deposit USDC, register an obligation, or run the Agent Cycle to log live treasury events.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="console-bottom">
              <span>QUORAIL / CONSEQUENCE ENGINE v4.6 · ARC TESTNET</span>
              <span>VAULT: {state.vaultAddress || DEFAULT_VAULT_ADDRESS}</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* DEPOSIT USDC TO VAULT MODAL */}
      <AnimatePresence>
        {showDeposit && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeposit(false)}
          >
            <motion.div
              className="obligation-modal"
              initial={{ opacity: 0, x: 70 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 70 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Deposit USDC to Quorail Vault"
            >
              <div className="modal-head">
                <div>
                  <span className="small-heading">FUND TREASURY VAULT · ARC TESTNET</span>
                  <h2>Deposit USDC.</h2>
                </div>
                <button onClick={() => setShowDeposit(false)} aria-label="Close">
                  <X size={19} />
                </button>
              </div>
              <p className="modal-intro">
                Transfer Arc Testnet USDC directly from your connected wallet into{" "}
                <code>QuorailVault.sol</code> to increase your live operating capital.
              </p>
              <div
                style={{
                  background: "rgba(25,22,19,0.05)",
                  padding: "14px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  fontSize: "13px",
                  display: "grid",
                  gap: "6px",
                }}
              >
                <div>
                  <strong>Target Vault:</strong>{" "}
                  <code>{state.vaultAddress || DEFAULT_VAULT_ADDRESS}</code>
                </div>
                <div>
                  <strong>Current Vault Balance:</strong> {usd(state.balanceCents)} USDC
                </div>
                <div>
                  <strong>Your Wallet Balance:</strong>{" "}
                  {walletUsdcCents !== null ? `${usd(walletUsdcCents)} USDC` : "Connected on Arc Testnet"}
                </div>
              </div>
              <form onSubmit={handleDepositUsdc} className="obligation-form">
                <label>
                  QUICK AMOUNT PRESETS
                  <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                    {["1.00", "5.00", "10.00", "25.00"].map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => setDepositAmount(preset)}
                        style={{
                          flex: 1,
                          padding: "8px",
                          borderRadius: "6px",
                          border:
                            depositAmount === preset
                              ? "2px solid #191613"
                              : "1px solid rgba(25,22,19,0.2)",
                          background:
                            depositAmount === preset ? "#191613" : "transparent",
                          color: depositAmount === preset ? "#f7f3eb" : "inherit",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        ${preset}
                      </button>
                    ))}
                  </div>
                </label>
                <label>
                  DEPOSIT AMOUNT (USDC)
                  <input
                    required
                    inputMode="decimal"
                    placeholder="5.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                  />
                </label>
                <button className="btn btn-dark" disabled={working} type="submit">
                  {working ? "Confirming on Arc Testnet..." : `Deposit $${depositAmount} USDC to Vault`}{" "}
                  <ArrowRight size={17} />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EDIT PROTECTED RESERVE MODAL */}
      <AnimatePresence>
        {showReserveModal && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowReserveModal(false)}
          >
            <motion.div
              className="obligation-modal"
              initial={{ opacity: 0, x: 70 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 70 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Edit Protected Reserve Floor"
            >
              <div className="modal-head">
                <div>
                  <span className="small-heading">TREASURY POLICY</span>
                  <h2>Protected Reserve Floor.</h2>
                </div>
                <button onClick={() => setShowReserveModal(false)} aria-label="Close">
                  <X size={19} />
                </button>
              </div>
              <p className="modal-intro">
                Set the minimum USDC reserve floor that Quorail must preserve when evaluating incoming payment obligations.
              </p>
              <form onSubmit={handleUpdateReserve} className="obligation-form">
                <label>
                  MINIMUM RESERVE FLOOR (USDC)
                  <input
                    required
                    inputMode="decimal"
                    placeholder="5.00"
                    value={reserveInput}
                    onChange={(e) => setReserveInput(e.target.value)}
                  />
                </label>
                <button className="btn btn-dark" type="submit">
                  Save Reserve Floor <ArrowRight size={17} />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADD OBLIGATION MODAL */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowForm(false)}
          >
            <motion.div
              className="obligation-modal"
              initial={{ opacity: 0, x: 70 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 70 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="New obligation"
            >
              <div className="modal-head">
                <div>
                  <span className="small-heading">REGISTER LIVE COMMITMENT</span>
                  <h2>New obligation.</h2>
                </div>
                <button onClick={() => setShowForm(false)} aria-label="Close">
                  <X size={19} />
                </button>
              </div>
              <p className="modal-intro">
                Create a payment commitment with a due date and an Arc Testnet recipient address.
              </p>
              <form onSubmit={saveObligation} className="obligation-form">
                <label>
                  PAYMENT DESCRIPTION
                  <input
                    required
                    maxLength={120}
                    placeholder="e.g. Cloud GPU cluster renewal"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </label>
                <label>
                  COUNTERPARTY
                  <input
                    required
                    maxLength={90}
                    placeholder="e.g. Helios Compute"
                    value={form.counterparty}
                    onChange={(e) => setForm({ ...form, counterparty: e.target.value })}
                  />
                </label>
                <label>
                  RECIPIENT WALLET ADDRESS (ARC / EVM)
                  <input
                    required
                    placeholder="0x..."
                    value={form.recipient}
                    onChange={(e) => setForm({ ...form, recipient: e.target.value })}
                  />
                </label>
                <div className="form-two">
                  <label>
                    AMOUNT (USDC)
                    <input
                      required
                      inputMode="decimal"
                      placeholder="2.00"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    />
                  </label>
                  <label>
                    DUE DATE
                    <input
                      required
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    />
                  </label>
                </div>
                <div className="form-two">
                  <label>
                    CATEGORY
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      {[
                        "Contractors",
                        "Infrastructure",
                        "Creative",
                        "Operations",
                        "Software",
                        "Other",
                      ].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    PRIORITY
                    <select
                      value={form.priority}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          priority: e.target.value as Obligation["priority"],
                        })
                      }
                    >
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </label>
                </div>
                <button className="btn btn-dark" disabled={working} type="submit">
                  {working ? "Saving..." : "Register obligation"} <ArrowRight size={17} />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ObligationTable({
  obligations,
  onDelete,
  onAdd,
}: {
  obligations: Obligation[];
  onDelete?: (id: string) => void;
  onAdd?: () => void;
}) {
  return (
    <div className="obligation-table-wrap">
      <table className="obligation-table">
        <thead>
          <tr>
            <th>COMMITMENT</th>
            <th>DUE DATE</th>
            <th>PRIORITY</th>
            <th>STATUS</th>
            <th className="right">AMOUNT</th>
            {onDelete && <th className="right">ACTION</th>}
          </tr>
        </thead>
        <tbody>
          {obligations.length ? (
            obligations.map((o) => (
              <tr key={o.id}>
                <td>
                  <div className="obligation-title">{o.title}</div>
                  <div className="obligation-company">
                    {o.counterparty} · {o.category} ·{" "}
                    <code>
                      {o.recipient.slice(0, 6)}…{o.recipient.slice(-4)}
                    </code>
                  </div>
                </td>
                <td>
                  <div className="date-label">{friendlyDay(o.dueDate)}</div>
                  <div className="date-relative">
                    {dueInDays(o.dueDate) < 0
                      ? "Past due"
                      : dueInDays(o.dueDate) === 0
                      ? "Today"
                      : `In ${dueInDays(o.dueDate)}d`}
                  </div>
                </td>
                <td>
                  <span className={`priority-priority ${o.priority}`}>
                    <i />
                    {o.priority}
                  </span>
                </td>
                <td>
                  <StatusPill status={o.status} />
                </td>
                <td className="right amount-cell">{usd(o.amountCents)}</td>
                {onDelete && (
                  <td className="right">
                    <button
                      type="button"
                      title="Remove obligation"
                      onClick={() => onDelete(o.id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        opacity: 0.65,
                        padding: "4px 8px",
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={onDelete ? 6 : 5} className="empty-table">
                No active obligations registered.{" "}
                {onAdd && (
                  <button
                    type="button"
                    onClick={onAdd}
                    style={{
                      background: "transparent",
                      border: "none",
                      textDecoration: "underline",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    + Add your first live obligation
                  </button>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
