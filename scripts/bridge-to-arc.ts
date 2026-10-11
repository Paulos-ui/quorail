/** Optional Circle App Kit CCTP funding workflow. Does not execute business payments. */
import {config} from "dotenv";config({path:".env.local"});config();
import {AppKit} from "@circle-fin/app-kit";
import {createViemAdapterFromPrivateKey} from "@circle-fin/adapter-viem-v2";
const key=process.env.BRIDGE_PRIVATE_KEY;
const amount=process.env.BRIDGE_AMOUNT_USDC;
if(!key||!/^0x[0-9a-fA-F]{64}$/.test(key)||!amount||!/^(0|[1-9]\d*)(\.\d{1,6})?$/.test(amount)||Number(amount)<=0)throw new Error("Set BRIDGE_PRIVATE_KEY and BRIDGE_AMOUNT_USDC (e.g. 1.00) in .env.local. Use a dedicated testnet account.");
console.log("Using Circle App Kit to bridge",amount,"test USDC from Ethereum Sepolia to Arc Testnet.");
console.log("This moves actual testnet tokens. Your SOURCE wallet requires Ethereum Sepolia USDC and ETH for gas.");
const kit=new AppKit();
const adapter=createViemAdapterFromPrivateKey({privateKey:key as `0x${string}`});
const result=await kit.bridge({from:{adapter,chain:"Ethereum_Sepolia"},to:{adapter,chain:"Arc_Testnet"},amount});
console.dir(result,{depth:7});
console.log("Inspect each returned explorer URL and confirm destination balance before funding a vault.");
