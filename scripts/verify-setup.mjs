/**
 * Read-only Quorail integration checker.
 * Usage: npm run verify:setup
 *        npm run verify:setup -- --claude    # makes one small, billable Anthropic API request
 *
 * Never sends a transaction or logs private credentials.
 */
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
config({ quiet: true });
import postgres from "postgres";
import Anthropic from "@anthropic-ai/sdk";
import { createPublicClient, http, isAddress, formatUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
// JS avoids adding compile-time types to the existing Next.js application.
const ARC_CHAIN_ID = 5042002;
const ARC_USDC = "0x3600000000000000000000000000000000000000";
const arc = {id: ARC_CHAIN_ID, name: "Arc Testnet", nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 }, rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } }, testnet: true};
const usdcAbi = [{ type:"function",name:"decimals",stateMutability:"view",inputs:[],outputs:[{type:"uint8"}] },{ type:"function",name:"balanceOf",stateMutability:"view",inputs:[{type:"address"}],outputs:[{type:"uint256"}] }];
const vaultAbi = ["owner", "agent", "paused"].map(name => ({type:"function",name,stateMutability:"view",inputs:[],outputs:[{type: name==="paused" ? "bool" : "address"}]}));

const lines = [];
let failed = 0;
function report(status, title, message) {
  lines.push(`${status.padEnd(4)}  ${title.padEnd(18)} ${message}`);
  if (status === "FAIL") failed++;
}

const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!databaseUrl) {
  report("WAIT", "PostgreSQL", "Neon is Vercel-connected. For local DB checks, set DATABASE_URL_UNPOOLED in .env.local.");
} else {
  let db;
  try {
    db = postgres(databaseUrl, { max: 1, connect_timeout: 8, idle_timeout: 5, prepare: false });
    const [{ settings, obligations }] = await db`
      SELECT to_regclass('public.treasury_settings')::text AS settings,
             to_regclass('public.obligations')::text AS obligations`;
    if (settings && obligations) {
      const [row] = await db`SELECT reserve_cents FROM treasury_settings WHERE id = 1`;
      report("PASS", "PostgreSQL", `Connected; schema exists; reserve ${row ? (Number(row.reserve_cents) / 100).toFixed(2) : "NOT CONFIGURED"} USDC`);
    } else {
      report("WAIT", "PostgreSQL", "Connected, but schema is missing. Run npm run db:init");
    }
  } catch (error) {
    report("FAIL", "PostgreSQL", error instanceof Error ? error.message : "Connection failed");
  } finally {
    if (db) await db.end().catch(() => undefined);
  }
}

const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";
if (!process.env.ANTHROPIC_API_KEY) {
  report("WAIT", "Claude", "Add ANTHROPIC_API_KEY; no autonomous settlement without it");
} else if (process.argv.includes("--claude")) {
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 18000, maxRetries: 0 });
    const answer = await client.messages.create({
      model, max_tokens: 12, messages: [{ role: "user", content: "Respond with the word READY only." }]
    });
    report("PASS", "Claude", `Authenticated and model responded (${answer.model}); this used API credits`);
  } catch (error) {
    report("FAIL", "Claude", error instanceof Error ? error.message : "Model request failed");
  }
} else {
  report("WAIT", "Claude", `Key present, untested. Run npm run verify:setup -- --claude to check ${model}`);
}

const client = createPublicClient({ chain: arc, transport: http(process.env.ARC_RPC_URL || "https://rpc.testnet.arc.network", { timeout: 12000, retryCount: 0 }) });
let chainReady = false;
try {
  const chainId = await client.getChainId();
  if (chainId !== ARC_CHAIN_ID) throw new Error(`Connected to chain ${chainId}, expected ${ARC_CHAIN_ID}`);
  const decimals = await client.readContract({ address: ARC_USDC, abi: usdcAbi, functionName: "decimals" });
  if (decimals !== 6) throw new Error(`Unexpected ERC-20 USDC decimals: ${decimals}`);
  chainReady = true;
  report("PASS", "Arc RPC", `Arc Testnet ${chainId}; USDC contract responds with 6 decimals`);
} catch (error) {
  report("FAIL", "Arc RPC", error instanceof Error ? error.message : "Connection failed");
}

let signer;
const key = process.env.AGENT_PRIVATE_KEY;
if (!key) {
  report("WAIT", "Agent signer", "Generate testnet wallet: npm run wallet:new -- agent");
} else if (!/^0x[0-9a-fA-F]{64}$/.test(key)) {
  report("FAIL", "Agent signer", "Invalid private key format; do not paste it into chat");
} else {
  signer = privateKeyToAccount(key).address;
  if (chainReady) {
    try {
      const native = await client.getBalance({ address: signer });
      report("PASS", "Agent signer", `${signer}; native gas balance ${formatUnits(native, 18)} USDC`);
    } catch {
      report("WAIT", "Agent signer", `${signer}; could not read gas balance`);
    }
  } else {
    report("WAIT", "Agent signer", `${signer}; waiting for Arc RPC`);
  }
}

const vault = process.env.VAULT_ADDRESS || process.env.NEXT_PUBLIC_VAULT_ADDRESS;
if (!vault) {
  report("WAIT", "Vault", "Deploy with npm run vault:deploy, then set VAULT_ADDRESS");
} else if (!isAddress(vault)) {
  report("FAIL", "Vault", "VAULT_ADDRESS is not a valid EVM address");
} else if (!chainReady) {
  report("WAIT", "Vault", "Cannot read contract until Arc RPC is connected");
} else {
  try {
    const bytecode = await client.getCode({ address: vault });
    if (!bytecode || bytecode === "0x") throw new Error("No contract code at VAULT_ADDRESS on Arc Testnet");
    const [owner, contractAgent, paused, balance] = await Promise.all([
      client.readContract({ address: vault, abi: vaultAbi, functionName: "owner" }),
      client.readContract({ address: vault, abi: vaultAbi, functionName: "agent" }),
      client.readContract({ address: vault, abi: vaultAbi, functionName: "paused" }),
      client.readContract({ address: ARC_USDC, abi: usdcAbi, functionName: "balanceOf", args: [vault] })
    ]);
    if (signer && contractAgent.toLowerCase() !== signer.toLowerCase()) throw new Error("Vault agent address differs from AGENT_PRIVATE_KEY signer");
    report("PASS", "Vault", `${vault}; owner ${owner}; funded ${formatUnits(balance, 6)} USDC; ${paused ? "PAUSED" : "active"}`);
    if (balance === 0n) report("WAIT", "Vault funds", "Fund the VAULT ADDRESS with Arc Testnet ERC-20 USDC before payment testing");
  } catch (error) {
    report("FAIL", "Vault", error instanceof Error ? error.message : "Unable to inspect vault");
  }
}

console.log("\nQUORAIL / READ-ONLY INTEGRATION CHECK\n");
for (const line of lines) console.log(line);
console.log("\nNo money was sent, no keys were printed, and no vault settings were changed.\n");
if (failed) process.exitCode = 1;
