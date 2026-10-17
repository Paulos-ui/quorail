"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Compass,
  LockKeyhole,
  ShieldCheck,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { Brand } from "./Brand";
import { rememberOwnerProvider } from "./owner-wallet";
import { getAddress, isAddress } from "viem";

type Provider = { request: (options: { method: string; params?: unknown[] }) => Promise<unknown> };
type Announced = { info: { uuid: string; name: string; icon: string }; provider: Provider };
interface GateProps {
  onAuthenticated: () => Promise<void>;
  onExplore: () => void;
}

export default function WalletGate({ onAuthenticated, onExplore }: GateProps) {
  const [providers, setProviders] = useState<Announced[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const found = new Map<string, Announced>();
    const handle = (event: Event) => {
      const item = (event as CustomEvent<Announced>).detail;
      if (item?.info?.uuid && item.provider) {
        found.set(item.info.uuid, item);
        setProviders([...found.values()]);
      }
    };
    window.addEventListener("eip6963:announceProvider", handle);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    const fallback = (window as Window & { ethereum?: Provider }).ethereum;
    if (fallback) {
      found.set("injected", {
        info: { uuid: "injected", name: "Browser wallet", icon: "" },
        provider: fallback,
      });
      setProviders([...found.values()]);
    }
    return () => window.removeEventListener("eip6963:announceProvider", handle);
  }, []);

  const connect = async (wallet: Announced) => {
    setConnecting(wallet.info.uuid);
    setError("");
    try {
      const accounts = (await wallet.provider.request({ method: "eth_requestAccounts" })) as string[];
      const address = accounts?.[0];
      if (!address || !isAddress(address)) throw new Error("No EVM wallet address was returned");
      const challenge = await fetch(
        `/api/auth/challenge?address=${encodeURIComponent(address)}`,
        { cache: "no-store", credentials: "same-origin" }
      );
      const data = await challenge.json();
      if (!challenge.ok) throw new Error(data.error || "Unable to start sign-in challenge");
      const signature = await wallet.provider.request({
        method: "personal_sign",
        params: [data.message, getAddress(address)],
      });
      if (typeof signature !== "string" || !signature.startsWith("0x")) {
        throw new Error("Wallet signature was not returned");
      }
      const result = await fetch("/api/auth/verify", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, signature }),
      });
      const answer = await result.json();
      if (!result.ok) throw new Error(answer.error || "Owner verification failed");
      rememberOwnerProvider(wallet.provider, wallet.info.name);
      await onAuthenticated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not connect wallet");
    } finally {
      setConnecting(null);
    }
  };

  const wallets = providers.filter(
    (p, i, a) => a.findIndex((x) => x.info.name === p.info.name) === i
  );

  return (
    <div className="qv2-gate">
      <header className="qv2-gate-nav">
        <Brand />
        <Link href="/">
          Back to overview <ArrowUpRight size={16} />
        </Link>
      </header>
      <div className="qv2-gate-grid">
        <section className="qv2-gate-story">
          <span className="qv2-label">TREASURY ACCESS · ARC TESTNET</span>
          <h1>
            Your capital.
            <br />
            Your guardrails.
          </h1>
          <p>
            Live treasury execution is locked to the wallet that owns the deployed Arc vault.
            Authenticate with a free off-chain signature—no gas fees and no private keys required.
          </p>
          <div className="q4-owner-steps" aria-label="How owner access works">
            <div>
              <span>01 / CONNECT</span>
              <strong>Select the vault-owner wallet</strong>
            </div>
            <div>
              <span>02 / AUTHENTICATE</span>
              <strong>Sign a gasless login challenge</strong>
            </div>
            <div>
              <span>03 / OPERATE</span>
              <strong>Review decisions & settle on Arc</strong>
            </div>
          </div>
          <div className="qv2-gate-facts">
            <span>
              <ShieldCheck size={17} /> VERIFIED AGAINST ONCHAIN VAULT
            </span>
            <span>
              <LockKeyhole size={17} /> NON-CUSTODIAL SIGN-IN
            </span>
          </div>
        </section>
        <section className="qv2-gate-choose">
          <div className="qv2-gate-head">
            <span className="qv2-label">01 / SELECT WALLET</span>
            <span className="qv2-gate-live">
              <i /> ARC TESTNET
            </span>
          </div>
          <h2>
            Unlock the
            <br />
            control room.
          </h2>
          <p>
            Choose your browser wallet below. Quorail checks your signature against the{" "}
            <code>owner()</code> address stored in <code>QuorailVault.sol</code>.
          </p>
          <div className="qv3-wallet-steps" aria-label="Wallet authentication steps">
            <span>01 / CONNECT</span>
            <span>02 / SIGN</span>
            <span>03 / ENTER</span>
          </div>
          <div className="qv2-wallet-list">
            {wallets.map((p) => (
              <button
                key={p.info.uuid}
                disabled={!!connecting}
                onClick={() => void connect(p)}
              >
                <span className="qv2-wallet-emblem">
                  <Wallet size={21} />
                </span>
                <span>{p.info.name}</span>
                {connecting === p.info.uuid ? (
                  <span className="qv2-spinner" />
                ) : (
                  <ArrowUpRight size={20} />
                )}
              </button>
            ))}
            {!wallets.length && (
              <div className="qv2-no-wallet">
                <AlertCircle size={22} />
                <div>
                  <strong>No browser wallet detected.</strong>
                  <p>
                    Enable OKX Wallet, MetaMask, or Rabby and refresh—or explore the interactive
                    sandbox below without a wallet.
                  </p>
                </div>
              </div>
            )}
          </div>
          {error && (
            <div className="qv2-gate-error" role="alert">
              <AlertCircle size={18} />
              {error}
            </div>
          )}
          <div className="qv2-gate-divider">
            <span>EVALUATING OR EXPLORING?</span>
          </div>
          <button className="qv2-guest" onClick={onExplore}>
            <Compass size={20} />
            <span>
              <strong>Open Interactive Sandbox</strong>
              <small>Test consequence modeling & AI decisions with zero setup.</small>
            </span>
            <ArrowRight size={19} />
          </button>
          <div className="qv3-chain-note">
            <ShieldCheck size={19} />
            <span>
              Live treasury records and USDC execution are restricted to the vault owner. Sandbox
              visitors get a full local simulation without touching on-chain funds.
            </span>
          </div>
          <div className="qv2-gate-foot">
            <Check size={14} /> Every protected API route verifies ownership against Arc Testnet.{" "}
            <Link href="/docs#security">Security architecture ↗</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
