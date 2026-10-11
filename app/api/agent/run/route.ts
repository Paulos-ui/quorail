import {NextRequest,NextResponse} from "next/server";
import {ensureAuth} from "@/lib/server/auth";
import {runCycle} from "@/lib/server/agent";
export const runtime="nodejs";export const maxDuration=120;
export async function POST(req:NextRequest){
 const auth=await ensureAuth(req);if(!auth.ok)return NextResponse.json({error:auth.error},{status:401});
 try{return NextResponse.json({ok:true,...await runCycle()});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Agent failed"},{status:500});}
}
