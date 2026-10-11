"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {ArrowUpRight,AlertCircle,CheckCircle2,ShieldCheck,Wallet,X} from "lucide-react";
import {getAddress,isAddress} from "viem";
import {rememberOwnerProvider,type WalletProvider} from "./owner-wallet";

type Announced={info:{uuid:string;name:string;icon:string};provider:WalletProvider};
/** Reusable in-place entry. No intermediary login page and no private key input. */
export default function WalletConnect({className="",label="Connect wallet",iconSize=17,onSuccess}:{className?:string;label?:string;iconSize?:number;onSuccess?:()=>Promise<void>|void}){
 const router=useRouter();
 const [open,setOpen]=useState(false),[wallets,setWallets]=useState<Announced[]>([]),[busy,setBusy]=useState<string|null>(null),[error,setError]=useState("");
 useEffect(()=>{
  if(!open)return;
  const discovered=new Map<string,Announced>();
  const update=(p:Announced)=>{if(!p?.provider||!p?.info?.uuid)return;discovered.set(p.info.uuid,p);setWallets([...discovered.values()]);};
  const onAnnouncement=(ev:Event)=>update((ev as CustomEvent<Announced>).detail);
  window.addEventListener("eip6963:announceProvider",onAnnouncement);
  window.dispatchEvent(new Event("eip6963:requestProvider"));
  const fallback=(window as Window&{ethereum?:WalletProvider}).ethereum;
  if(fallback)update({info:{uuid:"fallback",name:"Browser wallet",icon:""},provider:fallback});
  const escape=(ev:KeyboardEvent)=>{if(ev.key==="Escape"&&!busy)setOpen(false);};
  document.addEventListener("keydown",escape);
  return()=>{window.removeEventListener("eip6963:announceProvider",onAnnouncement);document.removeEventListener("keydown",escape)};
 },[open,busy]);
 const connect=async(wallet:Announced)=>{
  setBusy(wallet.info.uuid);setError("");
  try{
   const accounts=await wallet.provider.request({method:"eth_requestAccounts"}) as string[];
   const address=accounts?.[0];if(!address||!isAddress(address))throw new Error("Select a valid EVM wallet account.");
   const challenge=await fetch(`/api/auth/challenge?address=${encodeURIComponent(address)}`,{credentials:"same-origin",cache:"no-store"});
   const challengeData=await challenge.json();if(!challenge.ok)throw new Error(challengeData.error||"Could not start owner verification.");
   const signature=await wallet.provider.request({method:"personal_sign",params:[challengeData.message,getAddress(address)]});
   if(typeof signature!=="string"||!/^0x[0-9a-fA-F]+$/.test(signature))throw new Error("Wallet signature not returned.");
   const verify=await fetch("/api/auth/verify",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({address,signature})});
   const result=await verify.json();if(!verify.ok)throw new Error(result.error||"This wallet cannot access the owner treasury.");
   rememberOwnerProvider(wallet.provider);setOpen(false);
   if(onSuccess)await onSuccess();else router.push("/console");
  }catch(e){setError(e instanceof Error?e.message:"Unable to verify owner wallet.");}
  finally{setBusy(null);}
 };
 const unique=wallets.filter((item,i,all)=>all.findIndex(x=>x.provider===item.provider)===i);
 return <>
  <button type="button" className={className} onClick={()=>{setError("");setOpen(true)}}>{label} <ArrowUpRight size={iconSize}/></button>
  {open&&<div className="q-direct-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setOpen(false)}}>
   <section className="q-direct-dialog" role="dialog" aria-modal="true" aria-label="Connect your treasury wallet">
    <div className="q-direct-top"><span>QUORAIL / VAULT-OWNER ACCESS</span><button type="button" aria-label="Close wallet connection" disabled={!!busy} onClick={()=>setOpen(false)}><X size={20}/></button></div>
    <div className="q-direct-body"><span className="q-direct-kicker"><ShieldCheck size={17}/> SIGN-IN · NO GAS REQUIRED</span><h2>Connect your treasury.</h2><p>Choose the wallet that owns your deployed Arc vault. Sign one message to confirm ownership, then Quorail opens your dashboard automatically. No private key or payment approval is requested.</p>
    <div className="q-direct-wallet-list">{unique.map(p=><button type="button" key={p.info.uuid} disabled={!!busy} onClick={()=>void connect(p)}><Wallet size={21}/><strong>{p.info.name}</strong><span>{busy===p.info.uuid?"Waiting for signature…":"Connect ↗"}</span></button>)}{!unique.length&&<div className="q-direct-empty"><AlertCircle size={20}/> No EVM wallet detected. Enable MetaMask, Rabby, or another browser wallet and reopen this dialog.</div>}</div>
    {error&&<div className="q-direct-error" role="alert"><AlertCircle size={18}/>{error}</div>}
    <div className="q-direct-alternative"><CheckCircle2 size={16}/> Not the vault owner? <Link href="/console?mode=explore" onClick={()=>setOpen(false)}>Explore the sample dashboard ↗</Link></div>
    </div><div className="q-direct-bottom">THE AGENT CAN SPEND ONLY WITHIN ONCHAIN LIMITS · ARC TESTNET</div>
   </section>
  </div>}
 </>;
}
