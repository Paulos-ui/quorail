/** Generate a single Arc-compatible EVM signer for LOCAL TESTNET use only.
 * Printing the private key is intentional: copy it privately to .env.local, never to Git.
 */
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
const role = process.argv[2] || "test";
if (!["owner", "agent", "recipient", "test"].includes(role)) {
  throw new Error("Use: npm run wallet:new -- owner | agent | recipient");
}
const privateKey = generatePrivateKey();
const address = privateKeyToAccount(privateKey).address;
console.log(`\nQUORAIL / NEW ${role.toUpperCase()} WALLET — ARC TESTNET ONLY`);
console.log(`Public address: ${address}`);
console.log(`Private key (KEEP SECRET): ${privateKey}`);
console.log("Never share this key, commit it, or put it in a NEXT_PUBLIC_* variable.");
console.log("For owner: set DEPLOYER_PRIVATE_KEY locally. For agent: set AGENT_PRIVATE_KEY.");
console.log("Do not use this experimental wallet for mainnet or valuable assets.\n");
