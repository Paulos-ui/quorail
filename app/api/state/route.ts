import {NextResponse} from "next/server";
import {authenticated} from "@/lib/server/auth";
import {isLive,getAudit,getDecisions,getObligations,getPolicy} from "@/lib/server/db";
import {onchainPolicy,vaultAddress,walletInfo} from "@/lib/server/arc";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){
 if(!isLive())return NextResponse.json({mode:"demo",authenticated: true,agentReady:false,vaultReady:false});
 if(!await authenticated())return NextResponse.json({mode:"live",authenticated: true});
 try {
  const [obligations,decisions,audit,local,wallet]=await Promise.all([getObligations(),getDecisions(),getAudit(),getPolicy(),walletInfo()]);
  const chain=wallet.ready?await onchainPolicy(obligations.map(o=>o.recipient)):null;
  return NextResponse.json({mode:"live",authenticated:true,balanceCents:wallet.balanceCents,agentAddress:wallet.agent,vaultAddress:vaultAddress(),agentReady:!!process.env.ANTHROPIC_API_KEY,vaultReady:wallet.ready,walletError:wallet.error,policy:{...local,...(chain?{autonomousLimitCents:chain.autonomousLimitCents,singleLimitCents:chain.singleLimitCents,dailyLimitCents:chain.dailyLimitCents,allowedRecipients:chain.allowedRecipients}: {})},obligations,decisions,audit});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Failed to load treasury"},{status:500});}
}
