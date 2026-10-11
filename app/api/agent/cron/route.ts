import {NextRequest,NextResponse} from "next/server";
import {runCycle} from "@/lib/server/agent";
export const runtime="nodejs";export const maxDuration=120;
export async function GET(req:NextRequest){
 if(!process.env.CRON_SECRET || req.headers.get("authorization")!==`Bearer ${process.env.CRON_SECRET}`)return NextResponse.json({error:"Unauthorized"},{status:401});
 try{return NextResponse.json(await runCycle());}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Cycle failed"},{status:500});}
}
