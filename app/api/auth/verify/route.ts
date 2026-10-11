import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {sameOrigin,completeChallenge} from "@/lib/server/auth";
export const runtime="nodejs";
const schema=z.object({address:z.string(),signature:z.string().regex(/^0x[0-9a-fA-F]+$/)});
export async function POST(req:NextRequest){
 if(!sameOrigin(req))return NextResponse.json({error:"Invalid origin"},{status:403});
 try {const {address,signature}=schema.parse(await req.json());return NextResponse.json({ok:true,...await completeChallenge(address,signature as `0x${string}`)});}
 catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Wallet sign-in failed"},{status:401});}
}
