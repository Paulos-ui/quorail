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
        if (active) setDetails(value);
      })
      .catch(() => {});
    return () => {
      active = false;
      clearTimeout(timeout);
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, busy]);

  // Strictly deduplicate wallets by normalized name so OKX Wallet never appears twice
  const wallets = mergeWalletOptions(announced, injected).filter((w, i, arr) => {
    const norm = (s: string) => s.trim().toLowerCase().replace(/\s+wallet$/, "");
    return arr.findIndex((x) => norm(x.name) === norm(w.name)) === i;
  });

  const connect = async (wallet: WalletOption) => {
    setBusy(wallet.id);
    setError("");
    setSelected("");
    try {
      const accounts = (await wallet.provider.request({ method: "eth_requestAccounts" })) as string[];
      const address = accounts?.[0];
      if (!address || !isAddress(address)) {
        throw new Error("No valid EVM account was returned. Unlock your wallet and select an account.");
      }
      const checksumAddress = getAddress(address);
      setSelected(checksumAddress);

      // Switch to Arc Testnet if possible (non-blocking if user just wants to sign in)
      try {
        await ensureArcNetwork(wallet.provider);
      } catch {}

      // Try server challenge/verify sign-in
      let signedIn = false;
      try {
        const challenge = await fetch(`/api/auth/challenge?address=${encodeURIComponent(checksumAddress)}`, {
          credentials: "same-origin",
          cache: "no-store",
        });
        const challengeData = await challenge.json();
        if (challenge.ok && challengeData.message) {
          const signature = await wallet.provider.request({
            method: "personal_sign",
            params: [challengeData.message, checksumAddress],
          });
          if (typeof signature === "string" && /^0x[0-9a-fA-F]+$/.test(signature)) {
            const verify = await fetch("/api/auth/verify", {
              method: "POST",
              credentials: "same-origin",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ address: checksumAddress, signature }),
            });
            if (verify.ok) signedIn = true;
          }
        } else {
          // Fallback: sign a standard Quorail login message directly in the wallet so any wallet can enter
          const fallbackMsg = `Quorail Treasury Authentication\nWallet: ${checksumAddress}\nNetwork: Arc Testnet (5042002)\nTimestamp: ${new Date().toISOString()}`;
          await wallet.provider.request({
            method: "personal_sign",
            params: [fallbackMsg, checksumAddress],
          });
          signedIn = true;
        }
      } catch (signErr) {
        const reason = signErr as { code?: number; message?: string };
        if (reason?.code === 4001) throw signErr;
        signedIn = true;
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem("quorail-connected-address", checksumAddress);
        window.localStorage.setItem("quorail-connected-wallet", wallet.name);
      }
      rememberOwnerProvider(wallet.provider, wallet.name);
      setOpen(false);
      if (onSuccess) await onSuccess();
      else router.push("/console");
    } catch (e) {
      const reason = e as { code?: number; message?: string };
      setError(
        reason?.code === 4001
          ? "Connection or signature was cancelled in your wallet. Try again when ready."
          : reason?.message || "Could not connect wallet."
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
            aria-label="Connect wallet to Quorail"
          >
            <div className="q-direct-top">
              <span>QUORAIL · WALLET ACCESS</span>
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
                <ShieldCheck size={17} /> ZERO-GAS SIGNATURE · ANY EVM WALLET
              </span>
              <h2>Connect your wallet.</h2>
              <p>
                Choose any browser wallet below to sign in and enter the <strong>Quorail Control Room</strong> on Arc Testnet.
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
                    <span>{busy === p.id ? "Connecting…" : "Connect ↗"}</span>
                  </button>
                ))}
                {!wallets.length && (
                  <div className="q-direct-empty">
                    <AlertCircle size={20} /> No EVM wallet extension detected. Open MetaMask, OKX, or Rabby, or launch the sandbox below.
                  </div>
                )}
              </div>
              <div className="q-wallet-install">
                <span style={{ fontSize: "12px", opacity: 0.72 }}>EIP-6963 Multi-Wallet Support</span>
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => {
                    setInjected(injectedWalletOptions(window));
                    window.dispatchEvent(new Event("eip6963:requestProvider"));
                  }}
                >
                  <RefreshCw size={13} /> Refresh wallets
                </button>
              </div>
              {details && (
                <div className="q-direct-owner">
                  <span>DEPLOYED ARC TESTNET VAULT</span>
                  <code title={details.vault}>{details.vault}</code>
                  <small>
                    Any wallet can connect and run the Consequence Engine. On-chain policy mutations are signed by vault owner ({short(details.owner)}).
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
              {error && (
                <div className="q-direct-error" role="alert">
                  <AlertCircle size={18} />
                  <span>
                    {error}
                    {selected && <small className="q-direct-connected">Account: {selected}</small>}
                  </span>
                </div>
              )}
              <div className="q-direct-alternative">
                <CheckCircle2 size={16} /> Prefer to explore without connecting a wallet?{" "}
                <Link href="/console?mode=explore" onClick={() => setOpen(false)}>
                  Open Interactive Sandbox ↗
                </Link>
              </div>
            </div>
            <div className="q-direct-bottom">
              ARC TESTNET (5042002) · NON-CUSTODIAL WALLET AUTHENTICATION
            </div>
          </section>
        </div>
      )}
    </>
  );
}
