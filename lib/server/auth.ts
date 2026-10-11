import { createHmac, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { NextRequest } from "next/server";
import { isLive } from "./db";

const cookieName = "quorail_session";
function mac(input:string) {return createHmac("sha256",process.env.SESSION_SECRET!).update(input).digest("base64url");}
export function matchPassword(input: string) {
 const expected=createHash("sha256").update(process.env.ADMIN_PASSWORD||"").digest();
 const actual=createHash("sha256").update(input).digest();
 return !!process.env.ADMIN_PASSWORD && timingSafeEqual(expected,actual);
}
export function newToken() {
 const payload = Buffer.from(JSON.stringify({expires: Date.now()+1000*60*60*10,nonce:randomBytes(16).toString("hex")})).toString("base64url");
 return `${payload}.${mac(payload)}`;
}
export function verifyToken(token: string | undefined):boolean {
 if(!isLive() || !token) return false;
 const bits=token.split("."); if(bits.length!==2) return false;
 const a=Buffer.from(mac(bits[0])); const b=Buffer.from(bits[1]);
 if(a.length!==b.length || !timingSafeEqual(a,b)) return false;
 try {const value=JSON.parse(Buffer.from(bits[0],"base64url").toString()); return Number.isFinite(value.expires)&&value.expires>Date.now();} catch {return false;}
}
export async function authenticated() {return verifyToken((await cookies()).get(cookieName)?.value);}
export function cookieOptions() {return {httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict" as const,path:"/",maxAge:60*60*10};}
export const SESSION_COOKIE = cookieName;
/** Same-site cookie plus origin checks for mutation requests. */
export function sameOrigin(req:NextRequest) {
 const origin=req.headers.get("origin");
 if(!origin) return false;
 try {return new URL(origin).host===req.headers.get("host") || new URL(origin).host===req.headers.get("x-forwarded-host");}catch{return false;}
}
export async function ensureAuth(req:NextRequest) {
 if(!sameOrigin(req)) return {ok:false,error:"Invalid request origin"};
 if(!await authenticated()) return {ok:false,error:"Sign in to manage the live treasury"};
 return {ok:true,error:""};
}
