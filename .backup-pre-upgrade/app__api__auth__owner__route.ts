/** Public ownership diagnostic; vault-owner addresses are already public on Arc. */
import {NextResponse} from "next/server";
import {ownerAddress} from "@/lib/server/auth";
import {vaultAddress} from "@/lib/server/arc";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
 try{
  const vault=vaultAddress();if(!vault)throw new Error("VAULT_ADDRESS is not configured on Vercel");
  const owner=await ownerAddress();
  return NextResponse.json({vault,owner,chainId:5042002},{headers:{"Cache-Control":"no-store"}});
 }catch(e){
  return NextResponse.json({error:e instanceof Error?e.message:"Could not verify Arc vault ownership"},{status:503,headers:{"Cache-Control":"no-store"}});
 }
}
