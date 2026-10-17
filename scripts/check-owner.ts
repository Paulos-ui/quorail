import "dotenv/config";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import dns from "dns";
import { publicClient, vaultAddress, configuredOwnerAddress } from "../lib/server/arc";
import { vaultAbi } from "../lib/core/abi";

dotenv.config({ path: ".env.local", override: true });

try {
  dns.setDefaultResultOrder("ipv4first");
  dns.setServers(["1.1.1.1", "8.8.8.8", "1.0.0.1"]);
} catch {}

async function main() {
  const vault = vaultAddress();
  if (!vault) {
    console.error("❌ VAULT_ADDRESS is not set in .env.local");
    process.exit(1);
  }
  console.log("🔍 Checking Arc Testnet Vault:", vault);

  try {
    const client = publicClient();
    const [chainId, owner, agent, paused] = await Promise.all([
      client.getChainId(),
      client.readContract({ address: vault, abi: vaultAbi, functionName: "owner" }),
      client.readContract({ address: vault, abi: vaultAbi, functionName: "agent" }),
      client.readContract({ address: vault, abi: vaultAbi, functionName: "paused" }),
    ]);

    console.log("✅ Connected to Arc Testnet (Chain ID:", chainId, ")");
    console.log("👑 On-Chain Vault Owner:", owner);
    console.log("🤖 Authorized Agent Signer:", agent);
    console.log("⏸️  Vault Paused:", paused);

    // Save VAULT_OWNER_ADDRESS into .env.local if not already present
    const envPath = path.join(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const envText = fs.readFileSync(envPath, "utf8");
      if (!envText.includes("VAULT_OWNER_ADDRESS=")) {
        fs.appendFileSync(envPath, `\nVAULT_OWNER_ADDRESS=${owner}\nNEXT_PUBLIC_VAULT_OWNER_ADDRESS=${owner}\n`);
        console.log("💾 Saved VAULT_OWNER_ADDRESS to .env.local for instant fallback!");
      }
    }
  } catch (err) {
    const fallbackOwner = configuredOwnerAddress();
    console.error("⚠️ On-chain RPC read failed:", err instanceof Error ? err.message : err);
    if (fallbackOwner) {
      console.log("✅ Using configured fallback owner address:", fallbackOwner);
    } else {
      console.log("\n💡 Tip: Ensure WSL2 has internet access (ping 1.1.1.1) or add VAULT_OWNER_ADDRESS=0xYourOwnerAddress to .env.local");
      process.exit(1);
    }
  }
}

main();
