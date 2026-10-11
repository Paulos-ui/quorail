import {NextRequest,NextResponse} from "next/server";
import {issueChallenge} from "@/lib/server/auth";
import {isLive} from "@/lib/server/db";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 if(!isLive())return NextResponse.json({error:"Live treasury is not configured"},{status:503});
 const address=req.nextUrl.searchParams.get("address")||"";
 try {const message=await issueChallenge(req,address);return NextResponse.json({message});}
 catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Challenge unavailable"},{status:400});}
}
