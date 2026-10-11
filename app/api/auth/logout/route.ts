import { NextRequest,NextResponse } from "next/server";
import {SESSION_COOKIE,sameOrigin} from "@/lib/server/auth";
export async function POST(req:NextRequest){if(!sameOrigin(req))return NextResponse.json({error:"Origin rejected"},{status:403});const res=NextResponse.json({ok:true});res.cookies.delete(SESSION_COOKIE);return res;}
