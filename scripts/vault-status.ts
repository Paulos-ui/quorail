import {config} from "dotenv";
config({path:".env.local"}); config();
import {walletInfo,publicClient,vaultAddress,ARC_USDC} from "../lib/server/arc";
const info=await walletInfo();
console.log({vault:vaultAddress(),agent:info.agent,ready:info.ready,balanceUSDC:info.balanceCents/100,error:info.error||null,token:ARC_USDC,chainId:await publicClient().getChainId()});
