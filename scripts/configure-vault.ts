/**
 * Local OWNER-only configuration script.
 * Usage: npm run vault:configure -- allow 0xRecipientAddress
 *        npm run vault:configure -- deny 0xRecipientAddress
 *        npm run vault:configure -- pause
 *        npm run vault:configure -- unpause
 *        npm run vault:configure -- withdraw 0xMyOwnerAddress 10
 */
import {config} from "dotenv";config({path:".env.local"});config();
import {createPublicClient,createWalletClient,http,isAddress} from "viem";
import {privateKeyToAccount} from "viem/accounts";
import {vaultAbi} from "../lib/core/abi";
import {arc,vaultAddress,toUnits} from "../lib/server/arc";
import {toCents} from "../lib/core/finance";
const key=process.env.DEPLOYER_PRIVATE_KEY;
const vault=vaultAddress();
if(!key||!/^0x[\da-fA-F]{64}$/.test(key)||!vault)throw new Error("Set DEPLOYER_PRIVATE_KEY and VAULT_ADDRESS in .env.local first");
const signer=privateKeyToAccount(key as `0x${string}`);
const rpc=process.env.ARC_RPC_URL||"https://rpc.testnet.arc.network";
const client=createPublicClient({chain:arc,transport:http(rpc)});
if((await client.getChainId())!==5042002)throw new Error("Wrong chain");
const owner=await client.readContract({address:vault,abi:vaultAbi,functionName:"owner"});
if(owner.toLowerCase()!==signer.address.toLowerCase())throw new Error("DEPLOYER_PRIVATE_KEY is not the vault owner");
const [cmd,addr,amount]=process.argv.slice(2);
const wallet=createWalletClient({account:signer,chain:arc,transport:http(rpc)});
let hash:`0x${string}`;
if(cmd==="allow"||cmd==="deny"){
 if(!addr||!isAddress(addr))throw new Error("Provide a valid recipient address");
 hash=await wallet.writeContract({account:signer,chain:arc,address:vault,abi:vaultAbi,functionName:"setRecipient",args:[addr,cmd==="allow"]});
}else if(cmd==="pause"||cmd==="unpause"){
 hash=await wallet.writeContract({account:signer,chain:arc,address:vault,abi:vaultAbi,functionName:"setPaused",args:[cmd==="pause"]});
}else if(cmd==="withdraw"){
 if(!addr||!isAddress(addr)||!amount)throw new Error("Provide a recipient and USDC amount");
 hash=await wallet.writeContract({account:signer,chain:arc,address:vault,abi:vaultAbi,functionName:"ownerWithdraw",args:[addr,toUnits(toCents(amount))]});
}else throw new Error("Usage: allow <address> | deny <address> | pause | unpause | withdraw <address> <amount>");
const receipt=await client.waitForTransactionReceipt({hash});if(receipt.status!=="success")throw new Error("Arc transaction reverted");
console.log("CONFIRMED",`${cmd}`,`https://testnet.arcscan.app/tx/${hash}`);
