import {NextResponse} from "next/server";
import {isLive} from "@/lib/server/db";
export async function GET(){return NextResponse.json({name:"Quorail",status:"online",network:"Arc Testnet",mode:isLive()?"live-configured":"demo",actualPaymentsRequireVault:true});}
