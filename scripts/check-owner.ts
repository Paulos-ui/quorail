/** Read-only local troubleshooting: compare the owner's private-key-derived PUBLIC
 * address to the owner already stored in the Arc vault. Never print a key.
 */
import {config} from "dotenv";
config({path:".env.local"});config();
import {createPublicClient,http,getAddress,isAddress} from "viem";
import {privateKeyToAccount} from "viem/accounts";
import {arc,ARC_CHAIN_ID} from "../lib/core/chain";
import {vaultAbi} from "../lib/core/abi";
const address=process.env.VAULT_ADDRESS||process.env.NEXT_PUBLIC_VAULT_ADDRESS||"";
if(!isAddress(address))throw new Error("Set VAULT_ADDRESS in .env.local to your deployed vault contract address.");
const rpc=process.env.ARC_RPC_URL||"https://rpc.testnet.arc.network";
const client=createPublicClient({chain:arc,transport:http(rpc,{timeout:15000,retryCount:1})});
const chain=await client.getChainId();
if(chain!==ARC_CHAIN_ID)throw new Error(`Wrong RPC chain ${chain}. Expected ${ARC_CHAIN_ID}.`);
const owner=getAddress(await client.readContract({address,abi:vaultAbi,functionName:"owner"}));
const agent=getAddress(await client.readContract({address,abi:vaultAbi,functionName:"agent"}));
console.log("Arc Testnet vault:",getAddress(address));
console.log("Onchain vault owner:",owner);
console.log("Onchain agent:",agent);
const key=process.env.DEPLOYER_PRIVATE_KEY;
if(!key||!/^0x[a-f\d]{64}$/i.test(key)){
 console.log("Local owner account: not configured. Use the onchain owner address above when selecting your OKX account.");
}else{
 const local=privateKeyToAccount(key as `0x${string}`).address;
 console.log("Local deployer account:",local);
 console.log("Matches onchain owner:",local===owner?"YES":"NO — check the original deployer wallet, not the agent wallet");
}
console.log("Only public wallet addresses are displayed. No funds were moved.");
