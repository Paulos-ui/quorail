"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Wallet,
  X,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { getAddress, isAddress } from "viem";
import {
  rememberOwnerProvider,
  ensureArcNetwork,
  ownerMatches,
  readVaultOwner,
  type OwnerDetails,
} from "./owner-wallet";
import {
  announcedWalletOption,
  injectedWalletOptions,
  mergeWalletOptions,
  type AnnouncedWallet,
  type WalletOption,
} from "./wallet-providers";

const short = (address: string) => `${address.slice(0, 8)}…${address.slice(-6)}`;

export default function WalletConnect({
  className = "",
  label = "Connect wallet",
  iconSize = 17,
  onSuccess,
}: {
  className?: string;
  label?: string;
  iconSize?: number;
  onSuccess?: () => Promise<void> | void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [announced, setAnnounced] = useState<WalletOption[]>([]);
  const [injected, setInjected] = useState<WalletOption[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState("");
  const [details, setDetails] = useState<OwnerDetails | null>(null);
  const [ownerError, setOwnerError] = useState("");

  useEffect(() => {
    if (!open) return;
    setAnnounced([]);
    setInjected(injectedWalletOptions(window));
    const onAnnounce = (event: Event) => {
      const option = announcedWalletOption((event as CustomEvent<AnnouncedWallet>).detail);
      if (option) {
        setAnnounced((prev) =>
          prev.some((item) => item.provider === option.provider) ? prev : [...prev, option]
        );
      }
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape" && !busy) setOpen(false);
    };
    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    document.addEventListener("keydown", onKey);
    const timeout = window.setTimeout(() => setInjected(injectedWalletOptions(window)), 350);
    let active = true;
    readVaultOwner()
      .then((value) => {
        if (active) {
          setDetails(value);
          setOwnerError("");
        }
      })
      .catch((e) => {
        if (active) {
          setOwnerError(e instanceof Error ? e.message : "Arc owner lookup temporarily unavailable");
        }
      });
    return () => {
      active = false;
      clearTimeout(timeout);
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, busy]);

  const wallets = mergeWalletOptions(announced, injected).sort(
    (a, b) => Number(b.name === "OKX Wallet") - Number(a.name === "OKX Wallet")
  );

  const connect = async (wallet: WalletOption) => {
    setBusy(wallet.id);
    setError("");
    setSelected("");
    try {
      const accounts = (await wallet.provider.request({ method: "eth_requestAccounts" })) as string[];
      const address = accounts?.[0];
      if (!address || !isAddress(address)) {
        throw new Error("No valid EVM account was returned. Select an active account in your wallet.");
      }
      setSelected(getAddress(address));
      const owner = details || (await readVaultOwner(wallet.provider));
      setDetails(owner);
      setOwnerError("");
      if (!ownerMatches(address, owner.owner)) {
        throw new Error(
          `${wallet.name} is connected to ${short(getAddress(address))}, while this vault is owned by ${short(
            owner.owner
          )}. Switch to the owner account in ${wallet.name} to unlock live execution.`
        );
      }
      await ensureArcNetwork(wallet.provider);
      const challenge = await fetch(`/api/auth/challenge?address=${encodeURIComponent(address)}`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      const challengeData = await challenge.json();
      if (!challenge.ok) throw new Error(challengeData.error || "Could not start owner verification.");
      const signature = await wallet.provider.request({
        method: "personal_sign",
        params: [challengeData.message, getAddress(address)],
      });
      if (typeof signature !== "string" || !/^0x[0-9a-fA-F]+$/.test(signature)) {
        throw new Error("Wallet did not return a valid signature.");
      }
      const verify = await fetch("/api/auth/verify", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, signature }),
      });
      const result = await verify.json();
      if (!verify.ok) throw new Error(result.error || "Owner signature verification failed.");
      rememberOwnerProvider(wallet.provider, wallet.name);
      setOpen(false);
      if (onSuccess) await onSuccess();
      else router.push("/console");
    } catch (e) {
      const reason = e as { code?: number; message?: string };
      setError(
        reason?.code === 4001
          ? "Sign-in request was cancelled in your wallet. Approve the signature when you're ready."
          : reason?.message || "Unable to verify owner wallet."
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => {
          setError("");
          setSelected("");
          setOpen(true);
        }}
      >
        {label} <ArrowUpRight size={iconSize} />
      </button>
      {open && (
        <div
          className="q-direct-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !busy) setOpen(false);
          }}
        >
          <section
            className="q-direct-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Unlock treasury vault"
          >
            <div className="q-direct-top">
              <span>QUORAIL · VAULT OWNER ACCESS</span>
              <button
                type="button"
                aria-label="Close wallet dialog"
                disabled={!!busy}
                onClick={() => setOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="q-direct-body">
              <span className="q-direct-kicker">
                <ShieldCheck size={17} /> ZERO-GAS SIGNATURE · NON-CUSTODIAL
              </span>
              <h2>Unlock your treasury.</h2>
              <p>
                Connect the wallet that deployed the <strong>Quorail Vault</strong> on Arc Testnet.
                You will sign a gasless authentication challenge to enter the live control room.
              </p>
              <div className="q-direct-wallet-list">
                {wallets.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    disabled={!!busy}
                    onClick={() => void connect(p)}
                  >
                    <Wallet size={21} />
                    <strong>{p.name}</strong>
                    <span>{busy === p.id ? "Verifying…" : "Connect ↗"}</span>
                  </button>
                ))}
                {!wallets.length && (
                  <div className="q-direct-empty">
                    <AlertCircle size={20} /> No EVM wallet detected. Enable OKX Wallet, MetaMask, or
                    Rabby—or jump straight into the interactive sandbox below.
                  </div>
                )}
              </div>
              <div className="q-wallet-install">
                <a href="https://web3.okx.com/wallet" target="_blank" rel="noopener noreferrer">
                  Get OKX Wallet <ExternalLink size={13} />
                </a>
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => {
                    setInjected(injectedWalletOptions(window));
                    window.dispatchEvent(new Event("eip6963:requestProvider"));
                    readVaultOwner()
                      .then((v) => {
                        setDetails(v);
                        setOwnerError("");
                      })
                      .catch((err) =>
                        setOwnerError(err instanceof Error ? err.message : "RPC check failed")
                      );
                  }}
                >
                  <RefreshCw size={13} /> Retry connection
                </button>
              </div>
              {details && (
                <div className="q-direct-owner">
                  <span>ARC TESTNET · VERIFIED VAULT OWNER</span>
                  <code title={details.owner}>{details.owner}</code>
                  <small>
                    Only this address can authorize live policy changes or unlock the private vault
                    ledger.
                  </small>
                  <a
                    href={`https://testnet.arcscan.app/address/${details.vault}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Inspect vault contract on Arcscan <ExternalLink size={12} />
                  </a>
                </div>
              )}
              {ownerError && !details && (
                <div className="q-direct-error" role="alert">
                  <AlertCircle size={18} />
                  <span>
                    {ownerError} You can still click your wallet above to verify directly via your
                    browser extension, or open the interactive sandbox below.
                  </span>
                </div>
              )}
              {error && (
                <div className="q-direct-error" role="alert">
                  <AlertCircle size={18} />
                  <span>
                    {error}
                    {selected && <small className="q-direct-connected">Connected: {selected}</small>}
                  </span>
                </div>
              )}
              <div className="q-direct-alternative">
                <CheckCircle2 size={16} /> Reviewing for a hackathon or exploring?{" "}
                <Link href="/console?mode=explore" onClick={() => setOpen(false)}>
                  Launch Interactive Sandbox ↗
                </Link>
              </div>
            </div>
            <div className="q-direct-bottom">
              VERIFIED AGAINST QUORAILVAULT.SOL ON ARC TESTNET · PRIVATE KEYS NEVER LEAVE YOUR WALLET
            </div>
          </section>
        </div>
      )}
    </>
  );
}
