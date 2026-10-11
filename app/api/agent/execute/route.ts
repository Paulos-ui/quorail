import {NextRequest,NextResponse} from "next/server";
import {ensureAuth} from "@/lib/server/auth";
import {executeDecision} from "@/lib/server/execute";
import {z} from "zod";
export const runtime="nodejs";export const maxDuration=120;
export async function POST(req:NextRequest){
 const auth=await ensureAuth(req);if(!auth.ok)return NextResponse.json({error:auth.error},{status:401});
 try {const {decisionId}=z.object({decisionId:z.uuid()}).parse(await req.json());return NextResponse.json({ok:true,...await executeDecision(decisionId)});}
 catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Execution failed"},{status:400});}
}
