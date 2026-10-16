"use client";
import {getAddress,isAddress} from "viem";
import {injectedWalletOptions,mergeWalletOptions,announcedWalletOption,type AnnouncedWallet,type WalletOption,type WalletProvider} from "./wallet-providers";
export type {WalletProvider} from "./wallet-providers";
const KEY="quorail-selected-wallet-v44";
let ownerProvider:WalletProvider|undefined;
let selectedName:string|undefined;
export function rememberOwnerProvider(value:WalletProvider,name="Browser wallet"){
 ownerProvider=value;selectedName=name;
 if(typeof window!=="undefined")try{window.sessionStorage.setItem(KEY,name);}catch{}
}
export function selectedOwnerProvider():WalletProvider|undefined{return ownerProvider;}
export function lastSelectedWalletName():string|undefined{
 if(selectedName)return selectedName;
 if(typeof window!=="undefined")try{return window.sessionStorage.getItem(KEY)||undefined;}catch{}
 return undefined;
}
export async function discoverWalletOptions(waitMs=240):Promise<WalletOption[]>{
 if(typeof window==="undefined")return [];
 const announced:WalletOption[]=[];
 const listen=(event:Event)=>{
  const item=announcedWalletOption((event as CustomEvent<AnnouncedWallet>).detail);
  if(item&&!announced.some(a=>a.provider===item.provider))announced.push(item);
 };
 window.addEventListener("eip6963:announceProvider",listen);
 try{
  window.dispatchEvent(new Event("eip6963:requestProvider"));
  await new Promise(resolve=>setTimeout(resolve,waitMs));
 }finally{window.removeEventListener("eip6963:announceProvider",listen);}
 return mergeWalletOptions(announced,injectedWalletOptions(window));
}
export async function ensureArcNetwork(provider:WalletProvider):Promise<void>{
 const desired="0x4cef52";
 const current=await provider.request({method:"eth_chainId"});
 if(typeof current==="string"&&Number(current)===5042002)return;
 try{await provider.request({method:"wallet_switchEthereumChain",params:[{chainId:desired}]});}
 catch(e){
  const err=e as {code?:number;data?:{originalError?:{code?:number}}};
  if(err?.code!==4902&&err?.data?.originalError?.code!==4902)throw new Error("Please switch your wallet to Arc Testnet (5042002) and try again. If you rejected the switch, reopen the wallet and approve it.");
  await provider.request({method:"wallet_addEthereumChain",params:[{
   chainId:desired,chainName:"Arc Testnet",rpcUrls:["https://rpc.testnet.arc.network"],nativeCurrency:{name:"USDC",symbol:"USDC",decimals:18},blockExplorerUrls:["https://testnet.arcscan.app"]
  }]});
  await provider.request({method:"wallet_switchEthereumChain",params:[{chainId:desired}]});
 }
 const after=await provider.request({method:"eth_chainId"});
 if(typeof after!=="string"||Number(after)!==5042002)throw new Error("Wallet is not on Arc Testnet. Select Arc Testnet (5042002) before continuing.");
}
export type OwnerDetails={owner:string;vault:string;chainId:number};
export async function readVaultOwner():Promise<OwnerDetails>{
 const response=await fetch("/api/auth/owner",{credentials:"same-origin",cache:"no-store"});
 const data=await response.json() as OwnerDetails&{error?:string};
 if(!response.ok||!isAddress(data.owner)||!isAddress(data.vault))throw new Error(data.error||"Quorail could not read the onchain vault owner. Check Vercel VAULT_ADDRESS and Arc RPC.");
 return data;
}
export function ownerMatches(wallet:string,owner:string):boolean{return isAddress(wallet)&&isAddress(owner)&&getAddress(wallet)===getAddress(owner);}
/** Resolve the real connected owner provider even after a page reload. Never default
 * to window.ethereum for owner actions when another extension owns the session.
 */
export async function requireOwnerProvider():Promise<{provider:WalletProvider;address:`0x${string}`}>{
 const {owner}=await readVaultOwner();
 const options=await discoverWalletOptions();
 const selected=ownerProvider?[{id:"selected",name:selectedName||"Selected wallet",provider:ownerProvider,source:"injected" as const}]:[];
 const preferred=lastSelectedWalletName();
 const candidates=[...selected,...options.sort((a,b)=>Number(b.name===preferred)-Number(a.name===preferred))];
 for(const item of candidates){
  let account:string|undefined;
  try{
   const accounts=await item.provider.request({method:"eth_accounts"}) as string[];
   account=accounts?.find(a=>ownerMatches(a,owner));
  }catch{continue;}
  if(!account)continue;
  // Once the correct account is found, network errors must be surfaced, not
  // misrepresented as "not the owner".
  await ensureArcNetwork(item.provider);
  rememberOwnerProvider(item.provider,item.name);
  return {provider:item.provider,address:getAddress(account)};
 }
 throw new Error(`The current wallet is not the Arc vault owner (${owner.slice(0,8)}…${owner.slice(-6)}). Reconnect with the owner account, using OKX, MetaMask, or Rabby. Do not import private keys into Quorail.`);
}
