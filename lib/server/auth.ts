import { configuredOwnerAddress, cleanRpcError } from "@/lib/server/arc";
/** Wallet-first authentication: signed one-use challenge, vault-owner allowlisting, signed HttpOnly session.
 * The wallet signature is not a transaction and never grants agent key access.
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { getAddress, isAddress, recoverMessageAddress } from "viem";
import { vaultAbi } from "@/lib/core/abi";
import { publicClient, vaultAddress } from "@/lib/server/arc";
import { isLive } from "@/lib/server/db";

export const SESSION_COOKIE="quorail_session";
const CHALLENGE_COOKIE="quorail_challenge";
const MAX_CHALLENGE_AGE=5*60*1000;
const SESSION_AGE=60*60*3;
type Challenge={address:string;message:string;expires:number};
type Session={address:string;expires:number;nonce:string;role:"owner"};
function key(){if(!process.env.SESSION_SECRET)throw new Error("SESSION_SECRET missing");return process.env.SESSION_SECRET;}
function mac(value:string){return createHmac("sha256",key()).update(value).digest("base64url");}
function seal(value:Challenge|Session){const raw=Buffer.from(JSON.stringify(value)).toString("base64url");return `${raw}.${mac(raw)}`;}
function unseal<T>(input:string|undefined):T|null{
 if(!input || !process.env.SESSION_SECRET)return null;
 const [value,tag,...extra]=input.split(".");if(!value||!tag||extra.length)return null;
 const a=Buffer.from(mac(value));const b=Buffer.from(tag);
 if(a.length!==b.length||!timingSafeEqual(a,b))return null;
 try{return JSON.parse(Buffer.from(value,"base64url").toString()) as T;}catch{return null;}
}
export function cookieOptions(maxAge=SESSION_AGE){return {httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict" as const,path:"/",maxAge};}
export function sameOrigin(req:NextRequest){const origin=req.headers.get("origin");if(!origin)return false;try{return [req.headers.get("x-forwarded-host"),req.headers.get("host")].includes(new URL(origin).host);}catch{return false;}}
export async function ownerAddress() {
  const vault = vaultAddress();
  if (!vault) throw new Error("VAULT_ADDRESS is not configured");
  try {
    const owner = await publicClient().readContract({ address: vault, abi: vaultAbi, functionName: "owner" });
    return getAddress(owner);
  } catch (e) {
    const fallbackOwner = configuredOwnerAddress();
    if (fallbackOwner) return fallbackOwner;
    throw new Error(cleanRpcError(e, "Could not read owner() from Arc Testnet vault"));
  }
}
export async function completeChallenge(address:string,signature:`0x${string}`){
 const store=await cookies();const challenge=unseal<Challenge>(store.get(CHALLENGE_COOKIE)?.value);
 if(!challenge||challenge.expires<Date.now()||!isAddress(address)||getAddress(address)!==challenge.address)throw new Error("Sign-in request expired. Connect again.");
 // Delete regardless of outcome to reject an accidental second use in this browser.
 store.delete(CHALLENGE_COOKIE);
 const recovered=getAddress(await recoverMessageAddress({message:challenge.message,signature}));
 if(recovered!==challenge.address)throw new Error("Signature does not match the selected wallet");
 const owner=await ownerAddress();
 if(owner!==recovered)throw new Error("This wallet is not the onchain vault owner. Explore the simulation instead.");
 const session:Session={address:owner,role:"owner",expires:Date.now()+SESSION_AGE*1000,nonce:randomBytes(16).toString("hex")};
 store.set(SESSION_COOKIE,seal(session),cookieOptions());
 return {address:owner,role:"owner" as const};
}
export async function authenticated(){
 if(!isLive())return false;
 const session=unseal<Session>((await cookies()).get(SESSION_COOKIE)?.value);
 if(!session||session.expires<Date.now()||session.role!=="owner"||!isAddress(session.address))return false;
 try {return getAddress(session.address)===await ownerAddress();}catch{return false;} // fail closed if owner changed / RPC failed
}
export async function ensureAuth(req:NextRequest){
 if(!sameOrigin(req))return {ok:false,error:"Invalid request origin"};
 if(!await authenticated())return {ok:false,error:"Connect and sign with the vault owner wallet"};
 return {ok:true,error:""};
}
