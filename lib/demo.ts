import type { AuditEntry, Obligation, Policy, TreasuryState } from "./core/types";
function future(days: number) { const d = new Date(); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0,10); }
const demoAddresses = ["0x4B2dc46C661F609BeAb83d33F01aB9B695431A19","0xACc49e2C2412a8b086c2df61CF1D87b0ddcF0412","0xcdd0e71d912b55cba651191d8e2cf79b2f3898df"];
const policy: Policy = { reserveCents: 180000, horizonDays: 14, autonomousLimitCents: 50000, singleLimitCents: 200000, dailyLimitCents: 400000, allowedRecipients: demoAddresses };
export function demoState(): TreasuryState {
 const now = new Date().toISOString();
 const obligations: Obligation[] = [
  {id:"ob-1",title:"Product engineering sprint",counterparty:"Northstar Studio",recipient:demoAddresses[0],amountCents:125000,dueDate:future(2),priority:"critical",category:"Contractors",status:"pending",createdAt:now},
  {id:"ob-2",title:"Cloud infrastructure",counterparty:"Atlas Cloud",recipient:demoAddresses[1],amountCents:42000,dueDate:future(5),priority:"high",category:"Infrastructure",status:"pending",createdAt:now},
  {id:"ob-3",title:"Brand identity delivery",counterparty:"Amara Design",recipient:demoAddresses[2],amountCents:76000,dueDate:future(8),priority:"normal",category:"Creative",status:"pending",createdAt:now},
  {id:"ob-4",title:"October API allowance",counterparty:"Atlas Cloud",recipient:demoAddresses[1],amountCents:28000,dueDate:future(16),priority:"normal",category:"Operations",status:"pending",createdAt:now}
 ];
 const audit: AuditEntry[] = [];
 return {mode:"demo",balanceCents:598000,vaultAddress:null,agentAddress:null,policy,obligations,decisions:[],audit,authenticated:false,agentReady:false,vaultReady:false};
}
