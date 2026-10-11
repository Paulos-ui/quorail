import {NextResponse} from "next/server";
/** Removed the legacy password route: wallet signature of the vault owner is now mandatory. */
export async function POST(){return NextResponse.json({error:"Password access was retired. Connect and sign with the vault owner wallet."},{status:410});}
