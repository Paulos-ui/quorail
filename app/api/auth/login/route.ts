import { NextRequest, NextResponse } from "next/server";
import { cookieOptions, matchPassword, newToken, sameOrigin, SESSION_COOKIE } from "@/lib/server/auth";
import { isLive } from "@/lib/server/db";
export const runtime="nodejs";
export async function POST(req:NextRequest) {
 if(!sameOrigin(req))return NextResponse.json({error:"Invalid request origin"},{status:403});
 if(!isLive())return NextResponse.json({error:"Live mode is not configured"},{status:503});
 let data;try{data=await req.json();}catch{return NextResponse.json({error:"Invalid JSON"},{status:400});}
 if(typeof data.password!=="string" || !matchPassword(data.password))return NextResponse.json({error:"Incorrect credentials"},{status:401});
 const res=NextResponse.json({ok:true});res.cookies.set(SESSION_COOKIE,newToken(),cookieOptions());return res;
}
