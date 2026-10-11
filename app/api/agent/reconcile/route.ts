import {NextRequest,NextResponse} from "next/server";
import {ensureAuth} from "@/lib/server/auth";
import {db,getDecision,logEvent} from "@/lib/server/db";
import {publicClient,vaultAddress,paymentId} from "@/lib/server/arc";
import {z} from "zod";
import {decodeEventLog,parseAbiItem} from "viem";
export const runtime="nodejs";
const paymentEvent=parseAbiItem("event PaymentExecuted(bytes32 indexed paymentId, address indexed recipient, uint256 amount)");
export async function POST(req:NextRequest){
 const auth=await ensureAuth(req);if(!auth.ok)return NextResponse.json({error:auth.error},{status:401});
 try{
  const {decisionId}=z.object({decisionId:z.uuid()}).parse(await req.json());
  const decision=await getDecision(decisionId);
  if(!decision||decision.status!=="failed"||!decision.txHash)throw new Error("Only failed broadcasts with known transaction hashes can be reconciled");
  const receipt=await publicClient().getTransactionReceipt({hash:decision.txHash as `0x${string}`});
  if(receipt.status!=="success")throw new Error("Transaction reverted on Arc. No payment confirmation.");
  const vault=vaultAddress();if(!vault)throw new Error("Vault missing");
  const found=receipt.logs.some(l=>{
   if(l.address.toLowerCase()!==vault.toLowerCase())return false;
   try{const decoded=decodeEventLog({abi:[paymentEvent],data:l.data,topics:l.topics});return (decoded.args as {paymentId:`0x${string}`}).paymentId===paymentId(decision.id);}catch{return false;}
  });
  if(!found)throw new Error("This transaction does not contain the expected vault PaymentExecuted event");
  await db()`UPDATE decisions SET status='executed' WHERE id=${decision.id} AND status='failed'`;
  await db()`UPDATE obligations SET status='paid' WHERE id=${decision.obligationId} AND tx_hash=${decision.txHash}`;
  await logEvent("payment.reconciled",`Owner reconciled onchain receipt for ${decision.obligationTitle}`,{decisionId,txHash:decision.txHash});
  return NextResponse.json({ok:true,hash:decision.txHash});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Reconciliation failed"},{status:400});}
}
