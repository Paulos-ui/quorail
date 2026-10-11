"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {ArrowRight,ArrowUpRight,Check,Compass,LockKeyhole,ShieldCheck,Wallet,AlertCircle} from "lucide-react";
import {Brand} from "./Brand";
import {rememberOwnerProvider} from "./owner-wallet";
import {getAddress,isAddress} from "viem";

type Provider={request:(options:{method:string;params?:unknown[]})=>Promise<unknown>};
type Announced={info:{uuid:string;name:string;icon:string};provider:Provider};
interface GateProps{onAuthenticated:()=>Promise<void>;onExplore:()=>void}
export default function WalletGate({onAuthenticated,onExplore}:GateProps){
 const [providers,setProviders]=useState<Announced[]>([]);const [connecting,setConnecting]=useState<string|null>(null);const [error,setError]=useState("");
 useEffect(()=>{
  const found=new Map<string,Announced>();
  const handle=(event:Event)=>{
   const item=(event as CustomEvent<Announced>).detail;
   if(item?.info?.uuid&&item.provider){found.set(item.info.uuid,item);setProviders([...found.values()]);}
  };
  window.addEventListener("eip6963:announceProvider",handle);
  window.dispatchEvent(new Event("eip6963:requestProvider"));
  const fallback=(window as Window&{ethereum?:Provider}).ethereum;
  if(fallback){found.set("injected",{info:{uuid:"injected",name:"Browser wallet",icon:""},provider:fallback});setProviders([...found.values()]);}
  return()=>window.removeEventListener("eip6963:announceProvider",handle);
 },[]);
 const connect=async(wallet:Announced)=>{
  setConnecting(wallet.info.uuid);setError("");
  try {
   const accounts=await wallet.provider.request({method:"eth_requestAccounts"}) as string[];
   const address=accounts?.[0];if(!address||!isAddress(address))throw new Error("No EVM wallet address was returned");
   const challenge=await fetch(`/api/auth/challenge?address=${encodeURIComponent(address)}`,{cache:"no-store",credentials:"same-origin"});
   const data=await challenge.json();if(!challenge.ok)throw new Error(data.error||"Unable to request sign-in");
   const signature=await wallet.provider.request({method:"personal_sign",params:[data.message,getAddress(address)]});
   if(typeof signature!=="string"||!signature.startsWith("0x"))throw new Error("Wallet signature was not returned");
   const result=await fetch("/api/auth/verify",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({address,signature})});
   const answer=await result.json();if(!result.ok)throw new Error(answer.error||"Owner verification failed");
   rememberOwnerProvider(wallet.provider);
   await onAuthenticated();
  }catch(e){setError(e instanceof Error?e.message:"Could not connect wallet");}
  finally{setConnecting(null);}
 };
 const wallets=providers.filter((p,i,a)=>a.findIndex(x=>x.info.name===p.info.name)===i);
 return <div className="qv2-gate">
  <header className="qv2-gate-nav"><Brand/><Link href="/">Explore Quorail <ArrowUpRight size={16}/></Link></header>
  <div className="qv2-gate-grid">
   <section className="qv2-gate-story"><span className="qv2-label">OWNER ACCESS / ARC TESTNET</span><h1>Your treasury.<br/>Your call.</h1><p>The live treasury belongs to the wallet that owns the Arc vault. Connect that wallet, sign a message, and carry on. Signing in costs no gas and does not move funds.</p><div className="q4-owner-steps" aria-label="How owner access works"><div><span>01 / IDENTIFY</span><strong>Connect the vault-owner wallet</strong></div><div><span>02 / VERIFY</span><strong>Sign a free authentication message</strong></div><div><span>03 / WORK</span><strong>Open the private treasury</strong></div></div><div className="qv2-gate-facts"><span><ShieldCheck size={17}/> OWNER VERIFIED ONCHAIN</span><span><LockKeyhole size={17}/> NO PRIVATE KEYS REQUESTED</span></div></section>
   <section className="qv2-gate-choose"><div className="qv2-gate-head"><span className="qv2-label">01 / IDENTIFY YOUR WALLET</span><span className="qv2-gate-live"><i/> ARC TESTNET</span></div><h2>Sign in to<br/>your treasury.</h2><p>Choose your browser wallet. We verify its signature against the owner recorded in the deployed vault. You never enter a private key here.</p>
    <div className="qv3-wallet-steps" aria-label="Wallet authentication steps"><span>01 / CONNECT</span><span>02 / SIGN MESSAGE</span><span>03 / ENTER</span></div><div className="qv2-wallet-list">{wallets.map(p=><button key={p.info.uuid} disabled={!!connecting} onClick={()=>void connect(p)}><span className="qv2-wallet-emblem"><Wallet size={21}/></span><span>{p.info.name}</span>{connecting===p.info.uuid?<span className="qv2-spinner"/>:<ArrowUpRight size={20}/>}</button>)}{!wallets.length&&<div className="qv2-no-wallet"><AlertCircle size={22}/><div><strong>No browser wallet detected.</strong><p>Install or enable an EVM wallet such as MetaMask, Rabby or Coinbase Wallet and refresh this page.</p></div></div>}</div>
    {error&&<div className="qv2-gate-error" role="alert"><AlertCircle size={18}/>{error}</div>}
    <div className="qv2-gate-divider"><span>JUST LOOKING AROUND?</span></div><button className="qv2-guest" onClick={onExplore}><Compass size={20}/><span><strong>Explore a sample treasury</strong><small>No wallet, permissions, or USDC required.</small></span><ArrowRight size={19}/></button>
    <div className="qv3-chain-note"><ShieldCheck size={19}/><span>Only the deployed vault owner can access live treasury records. Connecting an unrelated wallet never grants access. Arc Testnet is required for owner-signed onchain policy changes.</span></div><div className="qv2-gate-foot"><Check size={14}/> Owner access is validated against the onchain vault on every protected API request. <Link href="/docs#security">Security model ↗</Link></div>
   </section>
  </div>
 </div>;
}
