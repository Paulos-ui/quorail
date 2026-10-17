"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import Lenis from "lenis";
import {
  ArrowDown,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Menu,
  X,
} from "lucide-react";
import { Brand } from "./Brand";
import ConsequenceField from "./ConsequenceField";
import WalletConnect from "./WalletConnect";

const chapters = [
  {
    no: "01",
    short: "Map",
    title: "Weigh every invoice against what's already committed.",
    text: "A wallet balance is a snapshot, not a plan. Quorail maps your live USDC balance against payroll, infrastructure renewals, and your operating reserve floor before a single cent leaves the vault.",
    signal: "LIQUIDITY / COMMITMENTS",
  },
  {
    no: "02",
    short: "Model",
    title: "Simulate the downstream impact before approving.",
    text: "Every incoming obligation is stress-tested across three paths—Pay now, Hold for buffer, or Escalate to the owner—calculating exact post-payment runway over a 14-day window.",
    signal: "PAY / HOLD / ESCALATE",
  },
  {
    no: "03",
    short: "Enforce",
    title: "AI recommends. Smart contracts enforce the ceiling.",
    text: "Claude evaluates urgency and cash-flow consequences, but it never holds unchecked authority. QuorailVault.sol enforces recipient allowlists, per-tx caps, and daily USDC budgets on-chain.",
    signal: "CLAUDE REASONING + SOLIDITY POLICY",
  },
  {
    no: "04",
    short: "Settle",
    title: "Every approved payout settles with an Arcscan receipt.",
    text: "When a payment clears both consequence checks and vault guardrails, the agent settles in USDC on Arc Testnet and binds the transaction hash directly to the decision ledger.",
    signal: "VERIFIABLE USDC SETTLEMENT",
  },
];

export default function Landing() {
  const [menu, setMenu] = useState(false);
  const [chapter, setChapter] = useState(0);
  const reduce = useReducedMotion();
  const hero = useRef<HTMLElement | null>(null);
  const narrative = useRef<HTMLElement | null>(null);
  const { scrollYProgress: heroScroll } = useScroll({
    target: hero,
    offset: ["start start", "end start"],
  });
  const { scrollYProgress: chapterScroll } = useScroll({
    target: narrative,
    offset: ["start center", "end center"],
  });
  const progress = useSpring(heroScroll, { stiffness: 80, damping: 24 });
  const move = useTransform(progress, [0, 1], [0, reduce ? 0 : 90]);
  const rotate = useTransform(progress, [0, 1], [0, reduce ? 0 : 2.5]);

  useEffect(() => {
    if (reduce) return;
    const lenis = new Lenis({ duration: 1.02, anchors: true });
    let frame = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, [reduce]);

  useEffect(
    () => chapterScroll.on("change", (p) => setChapter(Math.min(3, Math.floor(p * 4)))),
    [chapterScroll]
  );

  return (
    <div className="qv2-site" id="top">
      <header className="qv2-header">
        <Brand />
        <nav className={menu ? "qv2-nav open" : "qv2-nav"} aria-label="Primary navigation">
          <a href="#idea" onClick={() => setMenu(false)}>
            Why Quorail
          </a>
          <a href="#engine" onClick={() => setMenu(false)}>
            Consequence Engine
          </a>
          <a href="#architecture" onClick={() => setMenu(false)}>
            Onchain Guardrails
          </a>
          <Link href="/console">Interactive Sandbox</Link>
          <Link href="/docs">Docs</Link>
        </nav>
        <div className="qv2-header-right">
          <span>
            <i /> ARC TESTNET · USDC
          </span>
          <WalletConnect className="qv2-header-action" label="Unlock Vault" iconSize={16} />
          <button
            className="qv2-menu"
            aria-label="Toggle navigation"
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </header>
      <main>
        <section className="qv2-hero" ref={hero}>
          <div className="qv2-hero-left">
            <div className="qv2-eyebrow">
              <span className="qv2-star">✳</span> QUORAIL V4.5 · THE FINANCIAL CONSEQUENCE ENGINE
            </div>
            <h1>
              Know what a<br />
              payment breaks
              <br />
              <em>before</em> it moves.
            </h1>
            <p>
              Wallets tell you if you have enough USDC for today&apos;s invoice. Quorail calculates
              whether paying it today compromises payroll, servers, or operating reserves
              tomorrow—then settles approved payouts through a policy-bounded vault on Arc.
            </p>
            <div className="qv2-hero-ctas">
              <WalletConnect className="qv2-primary" label="Connect Owner Wallet" iconSize={20} />
              <Link href="/console" className="qv2-text-action">
                Try Interactive Sandbox <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="qv2-hero-bottom">
              <span>DETERMINISTIC RUNWAY MATH + CLAUDE REASONING</span>
              <span>SETTLED IN USDC ON ARC TESTNET</span>
            </div>
          </div>
          <motion.div className="qv2-hero-right" style={{ y: move, rotate }}>
            <div className="qv2-hero-right-title">
              <span>LIVE CONSEQUENCE SIMULATOR</span>
              <span>INTERACTIVE / 14D HORIZON</span>
            </div>
            <ConsequenceField />
            <div className="qv2-hero-legend">
              <span>CLICK ANY COMMITMENT TO INSPECT BUFFER IMPACT</span>
              <span>↗</span>
            </div>
          </motion.div>
          <div className="qv2-hero-index">Q / V4.5</div>
        </section>

        <div className="qv2-marquee" aria-label="Map, model, enforce, settle">
          <div>
            MAP COMMITMENTS <span>◆</span> MODEL CONSEQUENCES <span>◆</span> ENFORCE POLICY{" "}
            <span>◆</span> SETTLE ON ARC <span>◆</span> MAP COMMITMENTS <span>◆</span> MODEL
            CONSEQUENCES <span>◆</span> ENFORCE POLICY <span>◆</span> SETTLE ON ARC <span>◆</span>
          </div>
        </div>

        <section className="qv2-thesis" id="idea">
          <div className="qv2-section-head">
            <span>01 / THE BLIND SPOT IN TREASURY OPS</span>
            <span>SOLVENCY IS ABOUT TIMING, NOT JUST BALANCE</span>
          </div>
          <div className="qv2-thesis-grid">
            <div>
              <span className="qv2-marker">A</span>
              <h2>
                Having $2,000 in
                <br />
                your wallet doesn&apos;t mean
                <br />
                you have <em>$600 to spend.</em>
              </h2>
            </div>
            <div className="qv2-thesis-right">
              <p className="qv2-thesis-intro">
                Small teams rarely go broke from a single bad invoice—they get squeezed when an
                early payout drains the buffer needed for Friday&apos;s critical obligations.
              </p>
              <p>
                Traditional dashboards show static balances. Quorail treats every pending payment as
                a trade-off against your upcoming commitments and minimum reserve floor.
              </p>
              <div className="qv2-thesis-note">
                <span>THE CORE SHIFT</span>
                <strong>From asking &ldquo;Can this wallet pay?&rdquo; to &ldquo;What happens if we do?&rdquo;</strong>
                <ArrowUpRight size={29} />
              </div>
            </div>
          </div>
        </section>

        <section className="qv2-engine" id="engine" ref={narrative}>
          <div className="qv2-engine-sticky">
            <div className="qv2-engine-head">
              <span>02 / HOW DECISIONS ARE MADE</span>
              <span>SELECT A STAGE OR SCROLL ↓</span>
            </div>
            <div className="qv2-engine-grid">
              <div className="qv2-engine-steps">
                <h2>
                  Autonomous judgment,
                  <br />
                  <em>bounded by code.</em>
                </h2>
                <div className="qv2-step-buttons">
                  {chapters.map((c, i) => (
                    <button
                      key={c.no}
                      className={i === chapter ? "selected" : ""}
                      onClick={() => setChapter(i)}
                    >
                      <span>{c.no}</span>
                      {c.short}
                      <ArrowUpRight size={15} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="qv2-engine-focus">
                <motion.div
                  key={chapter}
                  initial={reduce ? false : { opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  <span className="qv2-eyebrow">{chapters[chapter].signal}</span>
                  <div className="qv2-chapter-number">
                    {chapters[chapter].no}
                    <span>/04</span>
                  </div>
                  <h3>{chapters[chapter].title}</h3>
                  <p>{chapters[chapter].text}</p>
                  <div className="qv2-chapter-graphic">
                    <div className="qv2-loop-node active">MAP</div>
                    <span className={chapter >= 1 ? "lit" : ""} />
                    <div className={chapter >= 1 ? "qv2-loop-node active" : "qv2-loop-node"}>
                      MODEL
                    </div>
                    <span className={chapter >= 2 ? "lit" : ""} />
                    <div className={chapter >= 2 ? "qv2-loop-node active" : "qv2-loop-node"}>
                      ENFORCE
                    </div>
                    <span className={chapter >= 3 ? "lit" : ""} />
                    <div className={chapter >= 3 ? "qv2-loop-node active" : "qv2-loop-node"}>
                      SETTLE
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
            <div className="qv2-engine-bottom">
              <span>EXPLAINABLE AI REASONING · ENFORCEABLE SOLIDITY LIMITS</span>
              <span>{chapters[chapter].no} / 04</span>
            </div>
          </div>
        </section>

        <section className="qv2-proof" id="architecture">
          <div className="qv2-section-head">
            <span>03 / SEPARATION OF POWERS</span>
            <span>WHY THE AI CANNOT DRAIN YOUR VAULT</span>
          </div>
          <div className="qv2-proof-layout">
            <div className="qv2-proof-heading">
              <span className="qv2-asterisk">✳</span>
              <h2>
                Intelligence advises.
                <br />
                <em>The contract decides.</em>
              </h2>
              <p>
                We strictly separate AI evaluation from custody. Claude can recommend a payout, but{" "}
                <code>QuorailVault.sol</code> rejects any transfer to unapproved addresses or above
                your autonomous spending cap.
              </p>
              <Link href="/docs#security" className="qv2-primary qv2-secondary">
                Read the security model <ArrowUpRight size={18} />
              </Link>
            </div>
            <div
              className="qv2-stack"
              role="img"
              aria-label="Payment path from agent through treasury policy to Arc USDC receipt"
            >
              <div className="qv2-stack-item">
                <span>01</span>
                <strong>CONSEQUENCE ENGINE + CLAUDE</strong>
                <small>Evaluates runway & outputs PAY / HOLD / ESCALATE</small>
              </div>
              <div className="qv2-stack-link">
                ↓ <span>HARD ONCHAIN POLICY BOUNDARY</span>
              </div>
              <div className="qv2-stack-item amber">
                <span>02</span>
                <strong>QUORAILVAULT.SOL</strong>
                <small>Enforces allowlist, per-tx cap & daily USDC limit</small>
              </div>
              <div className="qv2-stack-link">
                ↓ <span>PERMITTED SETTLEMENT ONLY</span>
              </div>
              <div className="qv2-stack-item last">
                <span>03</span>
                <strong>ARC TESTNET RECEIPT</strong>
                <small>Immutable USDC transfer hash linked to decision log</small>
              </div>
            </div>
          </div>
        </section>

        <section className="qv2-product">
          <div className="qv2-product-left">
            <span>04 / THE TREASURY CONTROL ROOM</span>
            <h2>
              Built for operators,
              <br />
              <em>open to verify.</em>
            </h2>
            <p>
              Inspect operating capital, stress-test hypothetical expenses in the &ldquo;What
              if?&rdquo; simulator, review full AI reasoning paths, and verify real Arcscan settlement
              receipts in one workspace.
            </p>
            <div className="qv2-product-steps">
              <span>
                <CheckCircle2 size={18} /> Gasless EIP-1193 owner authentication
              </span>
              <span>
                <CheckCircle2 size={18} /> Instant sandbox mode for judges & visitors
              </span>
              <span>
                <CheckCircle2 size={18} /> Direct Arcscan transaction verification
              </span>
            </div>
            <div className="qv2-hero-ctas">
              <WalletConnect className="qv2-primary" label="Unlock Live Vault" iconSize={19} />
              <Link href="/console" className="qv2-text-action">
                Explore Sandbox <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
          <div className="qv2-product-preview">
            <div className="qv2-preview-bar">
              <span>QUORAIL / TREASURY MONITOR</span>
              <span>ARC · TESTNET</span>
            </div>
            <div className="qv2-preview-metrics">
              <div>
                <span>VAULT BALANCE</span>
                <strong>$3,200</strong>
              </div>
              <div>
                <span>14D COMMITTED</span>
                <strong>$2,200</strong>
              </div>
              <div>
                <span>FREE BUFFER</span>
                <strong>$400</strong>
              </div>
            </div>
            <div className="qv2-preview-chart">
              <div className="qv2-preview-track">
                RESERVE FLOOR <i />
                <span>LIQUIDITY COVERAGE CURVE</span>
              </div>
              <div className="qv2-preview-columns">
                {[42, 72, 56, 84, 68, 40, 62, 93, 76, 52, 86, 43, 66, 80, 57, 48, 71].map((v, i) => (
                  <motion.span
                    key={i}
                    initial={{ scaleY: 0.2 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: i * 0.025 }}
                    style={{ height: `${v}%` }}
                  />
                ))}
              </div>
              <div className="qv2-preview-bottom">SANDBOX PREVIEW · REAL SETTLEMENT IN CONSOLE</div>
            </div>
          </div>
        </section>

        <section className="qv2-manual">
          <div>
            <span>05 / OPEN SOURCE ARCSCAN SHOWCASE</span>
            <h2>
              Transparent code.
              <br />
              <em>Auditable decisions.</em>
            </h2>
            <p>
              Explore our deterministic consequence math, Solidity vault contract, typed Viem ABI,
              and operational runbooks built for the Arc ecosystem.
            </p>
            <div className="qv2-manual-links">
              <Link href="/docs">
                Read technical docs <BookOpen size={19} />
              </Link>
              <a
                href="https://github.com/paulos-ui/quorail"
                target="_blank"
                rel="noreferrer"
              >
                View GitHub repository <ExternalLink size={19} />
              </a>
            </div>
          </div>
          <div className="qv2-manual-art">
            <span>QUORAIL ARCHITECTURE</span>
            <strong>Q.</strong>
            <div>MAP / MODEL / ENFORCE / SETTLE</div>
          </div>
        </section>

        <section className="qv2-end">
          <div className="qv2-end-symbol">✳</div>
          <span>READY TO TEST THE ENGINE?</span>
          <h2>
            Give your treasury
            <br />
            <em>real foresight.</em>
          </h2>
          <div className="qv2-hero-ctas" style={{ justifyContent: "center" }}>
            <WalletConnect className="qv2-primary" label="Connect Owner Wallet" iconSize={20} />
            <Link href="/console" className="qv2-text-action">
              Open Interactive Sandbox <ArrowUpRight size={16} />
            </Link>
          </div>
        </section>
      </main>
      <footer className="qv2-footer">
        <Brand />
        <span>ENGINEERED BY JAYKING (@PAULOS-UI)</span>
        <div>
          <Link href="/console">Console</Link>
          <Link href="/docs">Documentation</Link>
          <a href="https://github.com/paulos-ui/quorail" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href="https://x.com/__official__1" target="_blank" rel="noreferrer">
            X / Updates
          </a>
        </div>
        <span>ARC TESTNET · USDC · V4.5</span>
      </footer>
    </div>
  );
}
