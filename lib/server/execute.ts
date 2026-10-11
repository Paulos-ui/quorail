import { db, getDecision, getObligations, getPolicy, logEvent } from "./db";
import { publicClient, sendVaultPayment, vaultAddress, paymentId, walletInfo, onchainPolicy, toUnits } from "./arc";
import { vaultAbi } from "@/lib/core/abi";
import { evaluateConsequences } from "@/lib/core/finance";
import { isAddress, keccak256, encodeAbiParameters } from "viem";

export async function executeDecision(id: string) {
 const sql=db();const decision=await getDecision(id);
 if(!decision) throw new Error("Decision not found");
 if(decision.source!=="claude" || (decision.action!=="pay" && decision.action!=="escalate")) throw new Error("Only reasoned payable/escalated decisions can settle");
 if(!["proposed","escalated"].includes(decision.status)) throw new Error("Decision already processed or held");
 const obligations=await getObligations();
 const obligation=obligations.find(o=>o.id===decision.obligationId);
 if(!obligation||obligation.status!=="pending") throw new Error("Obligation is not payable");
 if(!isAddress(obligation.recipient)) throw new Error("Recipient is not an EVM address");
 const wallet=await walletInfo(); if(!wallet.ready) throw new Error(wallet.error);
 const local=await getPolicy();const chain=await onchainPolicy([obligation.recipient]);
 if(chain.paused)throw new Error("Vault is paused by owner");
 const policy={...local,...chain};
 const guard=evaluateConsequences(wallet.balanceCents,obligations,obligation,policy);
 if(guard.availableAfterPay<0 || guard.exceedsSingleLimit || !guard.authorizedRecipient || obligation.amountCents>chain.dailyLimitCents) throw new Error("Fresh treasury evaluation blocks this transfer");
 if(obligation.amountCents>chain.autonomousLimitCents){
  const approval=await publicClient().readContract({address:vaultAddress()!,abi:vaultAbi,functionName:"approvedPayments",args:[paymentId(id)]});
  const expected=keccak256(encodeAbiParameters([{type:"address"},{type:"uint256"}],[obligation.recipient as `0x${string}`,toUnits(obligation.amountCents)]));
  if(approval!==expected) throw new Error("Owner has not approved this exact payment onchain");
 }
 const [claimed] = await sql`UPDATE decisions SET status='executing' WHERE id=${id} AND status IN ('proposed','escalated') RETURNING id`;
 if(!claimed) throw new Error("Decision already claimed");
 const [claimedObligation] = await sql`UPDATE obligations SET status='processing' WHERE id=${obligation.id} AND status='pending' RETURNING id`;
 if(!claimedObligation){await sql`UPDATE decisions SET status='failed' WHERE id=${id}`;throw new Error("Obligation already claimed by another payment");}
 try {
  // Important: write txHash immediately after broadcast; never automatically resubmit an ambiguous transaction.
  const hash=await sendVaultPayment(obligation.recipient,obligation.amountCents,id);
  await sql`UPDATE decisions SET tx_hash=${hash} WHERE id=${id}`;
  await sql`UPDATE obligations SET tx_hash=${hash} WHERE id=${obligation.id}`;
  await logEvent("payment.broadcast",`Payment broadcast for ${obligation.title}`,{decisionId:id,hash});
  const receipt=await publicClient().waitForTransactionReceipt({hash,timeout:90_000});
  if(receipt.status!=="success") throw new Error(`Arc transaction reverted: ${hash}`);
  await sql`UPDATE decisions SET status='executed' WHERE id=${id}`;
  await sql`UPDATE obligations SET status='paid' WHERE id=${obligation.id}`;
  await logEvent("payment.confirmed",`${obligation.title} paid on Arc`,{decisionId:id,txHash:hash,amountCents:obligation.amountCents});
  return {hash,status:"executed"};
 }catch(e){
  // A broadcast could have succeeded despite timeout; keep it locked in failed state for manual reconciliation.
  await sql`UPDATE decisions SET status='failed' WHERE id=${id}`;
  await logEvent("payment.uncertain",`Payment needs investigation: ${obligation.title}`,{decisionId:id,error:e instanceof Error?e.message:"Unknown",status:"Do not retry until onchain reconciliation"});
  throw e;
 }
}
