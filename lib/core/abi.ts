/** Stable, reusable Arc/Quorail guardrail contract ABI. */
export const vaultAbi = [
 { type:"function",name:"pay",stateMutability:"nonpayable",inputs:[{name:"recipient",type:"address"},{name:"amount",type:"uint256"},{name:"paymentId",type:"bytes32"}],outputs:[] },
 { type:"function",name:"approvePayment",stateMutability:"nonpayable",inputs:[{name:"paymentId",type:"bytes32"},{name:"recipient",type:"address"},{name:"amount",type:"uint256"}],outputs:[] },
 { type:"function",name:"approvedPayments",stateMutability:"view",inputs:[{name:"paymentId",type:"bytes32"}],outputs:[{name:"",type:"bytes32"}] },
 { type:"function",name:"allowedRecipients",stateMutability:"view",inputs:[{name:"",type:"address"}],outputs:[{name:"",type:"bool"}] },
 { type:"function",name:"autonomousLimit",stateMutability:"view",inputs:[],outputs:[{name:"",type:"uint256"}] },
 { type:"function",name:"singleLimit",stateMutability:"view",inputs:[],outputs:[{name:"",type:"uint256"}] },
 { type:"function",name:"dailyLimit",stateMutability:"view",inputs:[],outputs:[{name:"",type:"uint256"}] },
 { type:"function",name:"agent",stateMutability:"view",inputs:[],outputs:[{name:"",type:"address"}] },
 { type:"function",name:"owner",stateMutability:"view",inputs:[],outputs:[{name:"",type:"address"}] },
 { type:"function",name:"paused",stateMutability:"view",inputs:[],outputs:[{name:"",type:"bool"}] },
 { type:"function",name:"completedPayments",stateMutability:"view",inputs:[{name:"paymentId",type:"bytes32"}],outputs:[{name:"",type:"bool"}] },
 { type:"function",name:"ownerWithdraw",stateMutability:"nonpayable",inputs:[{name:"recipient",type:"address"},{name:"amount",type:"uint256"}],outputs:[] },
 { type:"function",name:"setPolicy",stateMutability:"nonpayable",inputs:[{name:"autoCap",type:"uint256"},{name:"maxSingle",type:"uint256"},{name:"maxDaily",type:"uint256"}],outputs:[] },
 { type:"function",name:"setAgent",stateMutability:"nonpayable",inputs:[{name:"newAgent",type:"address"}],outputs:[] },
 { type:"function",name:"setRecipient",stateMutability:"nonpayable",inputs:[{name:"recipient",type:"address"},{name:"allowed",type:"bool"}],outputs:[] },
 { type:"function",name:"setPaused",stateMutability:"nonpayable",inputs:[{name:"value",type:"bool"}],outputs:[] },
 { type:"function",name:"vaultBalance",stateMutability:"view",inputs:[],outputs:[{name:"",type:"uint256"}] },
 { type:"event",name:"PaymentExecuted",inputs:[{name:"paymentId",type:"bytes32",indexed:true},{name:"recipient",type:"address",indexed:true},{name:"amount",type:"uint256",indexed:false}],anonymous:false }
] as const;
export const usdcAbi = [
 {type:"function",name:"balanceOf",stateMutability:"view",inputs:[{name:"account",type:"address"}],outputs:[{name:"",type:"uint256"}]},
 {type:"function",name:"decimals",stateMutability:"view",inputs:[],outputs:[{name:"",type:"uint8"}]},
 {type:"function",name:"transfer",stateMutability:"nonpayable",inputs:[{name:"to",type:"address"},{name:"value",type:"uint256"}],outputs:[{name:"",type:"bool"}]}
] as const;
