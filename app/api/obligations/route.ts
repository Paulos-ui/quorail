import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {ensureAuth} from "@/lib/server/auth";
import {createObligation} from "@/lib/server/db";
import {isAddress} from "viem";
export const runtime="nodejs";
const schema=z.object({title:z.string().trim().min(3).max(120),counterparty:z.string().trim().min(2).max(90),recipient:z.string().refine(isAddress,"Valid EVM address required"),amountCents:z.number().int().min(1).max(100000000),dueDate:z.iso.date(),category:z.string().trim().min(2).max(60),priority:z.enum(["critical","high","normal"])});
export async function POST(req:NextRequest){
 const auth=await ensureAuth(req);if(!auth.ok)return NextResponse.json({error:auth.error},{status:401});
 try {const input=schema.parse(await req.json());const id=await createObligation(input);return NextResponse.json({ok:true,id},{status:201});}
 catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Invalid obligation"},{status:400});}
}
