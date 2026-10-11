"use client";
import {useId,useMemo,useState} from "react";
import {motion,useReducedMotion,AnimatePresence} from "framer-motion";
import {ArrowUpRight} from "lucide-react";

type Entry={label:string;amount:number;urgency?:string};
const sample:Entry[]=[
 {label:"CONTRACTORS",amount:850,urgency:"DUE / 02 DAYS"},
 {label:"INFRASTRUCTURE",amount:420,urgency:"DUE / 05 DAYS"},
 {label:"NEW REQUEST",amount:610,urgency:"AWAITING DECISION"},
 {label:"OPERATIONS",amount:320,urgency:"DUE / 12 DAYS"}
];
const points=[[521,118],[663,279],[511,434],[179,369],[149,126]];
export default function ConsequenceField({entries,capital,reserve,interactive=true,compact=false}:{entries?:Entry[];capital?:number;reserve?:number;interactive?:boolean;compact?:boolean}){
 const items=useMemo(()=>entries!==undefined?entries.slice(0,5):sample,[entries]);
 const cash=capital??3200, floor=reserve??600;
 const [selected,setSelected]=useState(2);const [scenario,setScenario]=useState(false);
 const activeIndex=Math.min(selected,Math.max(0,items.length-1));const active=items[activeIndex];
 const spent=items.reduce((sum,item)=>sum+item.amount,0);
 // Highlight an alternative, illustrative payout but do not mutate actual capital or claim a payment was made.
 const projected= cash-spent-floor+(scenario&&active?active.amount:0);
 const gradientId=useId().replaceAll(":","");const reduce=useReducedMotion();
 return <div className={`qv2-field qv3-field ${compact?"qv2-field-compact":""}`}>
  <div className="qv2-field-top"><span><i className="qv3-live-pulse"/> LIQUIDITY CARTOGRAPHY <span className="qv2-field-tick">/ FIG 001</span></span><span>{entries!==undefined?"YOUR OBLIGATIONS":"ILLUSTRATIVE / INTERACTIVE"}</span></div>
  <div className="qv2-field-canvas"><svg viewBox="0 0 760 550" role="img" aria-label="Select an obligation node to inspect its cost and model a deferred payment" preserveAspectRatio="xMidYMid meet">
   <defs><pattern id={`grid-${gradientId}`} width="25" height="25" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".85" fill="#5c8f9e" opacity=".20"/></pattern><linearGradient id={`flow-${gradientId}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#3b5cd1"/><stop offset="1" stopColor="#4db6aa"/></linearGradient></defs>
   <rect width="760" height="550" fill={`url(#grid-${gradientId})`}/>
   <g fill="none" stroke="#91afbf" strokeWidth="1"><path d="M379 26V526M45 268H728" strokeDasharray="2 11" opacity=".55"/><circle cx="379" cy="277" r="157" opacity=".32"/><circle cx="379" cy="277" r="208" strokeDasharray="3 10" opacity=".65"/><path d="M40 460C175 410 210 515 365 453S570 403 730 462" opacity=".25"/></g>
   <path d="M76 308 Q220 180 379 277 T694 251" fill="none" stroke="#c3e7e3" strokeWidth="35" opacity=".24"/>
   {items.map((item,index)=>{const [x,y]=points[index];const chosen=index===activeIndex;return <g key={`${item.label}-${index}`}>
    <motion.path d={`M379 277 Q${(x+379)/2+(index%2?20:-26)} ${(y+277)/2-35} ${x} ${y}`} fill="none" stroke={chosen?`url(#flow-${gradientId})`:"#9fb8bd"} strokeWidth={chosen?4:1.8} strokeDasharray={chosen?undefined:"4 9"} initial={reduce?false:{pathLength:0}} animate={{pathLength:1,opacity:scenario && chosen ? 0.3 : 1}} transition={{duration:1,delay:index*.08}}/>
    {chosen&&<motion.circle cx={x} cy={y} r="39" fill="none" stroke="#436cce" strokeWidth="1.3" strokeDasharray="4 6" animate={reduce?undefined:{rotate:360}} style={{transformOrigin:`${x}px ${y}px`}} transition={{duration:24,repeat:Infinity,ease:"linear"}}/>}
    <g role={interactive?"button":undefined} tabIndex={interactive?0:undefined} className={interactive?"qv2-svg-target qv3-svg-node":""} aria-label={`${item.label}: ${item.amount} USDC. ${chosen?"Selected":"Select"}`} aria-pressed={interactive?chosen:undefined} onClick={()=>{if(interactive){setSelected(index);setScenario(false)}}} onKeyDown={e=>{if(interactive&&(e.key==="Enter"||e.key===" ")){e.preventDefault();setSelected(index);setScenario(false)}}}>
     <circle cx={x} cy={y} r={chosen?33:29} fill={chosen?"#3655b7":"#ecf5f4"} stroke={chosen?"#3655b7":"#9db8c4"} strokeWidth="2"/>
     <text x={x} y={y+4} textAnchor="middle" fontSize="13" fontFamily="monospace" fill={chosen?"#fff":"#23455c"}>{String(index+1).padStart(2,"0")}</text>
     <circle cx={x} cy={y} r="41" fill="transparent"/>
    </g>
    <text x={x} y={y-53} textAnchor="middle" fontSize="9" letterSpacing="1.3" fontWeight="600" fontFamily="monospace" fill="#476476">{item.label.slice(0,19)}</text>
    <text x={x} y={y+58} textAnchor="middle" fontSize="12" fontFamily="monospace" fill={chosen?"#3558bd":"#627d8b"}>{item.amount.toLocaleString()} USDC</text>
   </g>})}
   <circle cx="379" cy="277" r="83" fill="#d4eeee" opacity=".82"/>
   <circle cx="379" cy="277" r="72" fill="#12354c" stroke="#498fbe" strokeWidth="1.5"/>
   <circle cx="379" cy="277" r="65" fill="none" stroke="#91d9d2" strokeWidth="1" opacity=".45"/>
   <text x="379" y="254" textAnchor="middle" fontSize="9" fontFamily="monospace" letterSpacing="1.4" fill="#9ccac9">OPERATING CAPITAL</text>
   <text x="379" y="290" textAnchor="middle" fontSize="29" fontWeight="650" fontFamily="Arial" letterSpacing="-.8" fill="#f6ffff">${cash.toLocaleString()}</text>
   <text x="379" y="311" textAnchor="middle" fontSize="9" fontFamily="monospace" letterSpacing="1" fill="#8fbdc6">USDC / ARC</text>
   <text x="28" y="34" fontFamily="monospace" fontSize="9" fill="#91a7b4" letterSpacing="1">Q/R · CAPITAL TO COMMITMENTS</text>
   <text x="730" y="520" textAnchor="end" fontFamily="monospace" fontSize="9" fill="#91a7b4" letterSpacing="1">FIELD EXPERIMENT 001</text>
  </svg></div>
  <div className="qv3-field-options"><span>SCENARIO</span><button aria-pressed={!scenario} className={!scenario?"chosen":""} onClick={()=>setScenario(false)}>PAY ALL</button><button aria-pressed={scenario} className={scenario?"chosen":""} onClick={()=>setScenario(true)} disabled={!active}>DEFER SELECTED</button><span className="qv3-field-hint">MODEL ONLY / NO FUNDS MOVED</span></div>
  <div className="qv2-field-inspector"><div><span className="qv2-label">{scenario?"DEFERRED COMMITMENT":"SELECTED COMMITMENT"}</span><AnimatePresence mode="wait"><motion.strong key={active?.label??"empty"} initial={reduce?false:{y:8,opacity:0}} animate={{y:0,opacity:1}} exit={reduce?undefined:{y:-8,opacity:0}}>{active?.label||"NO PENDING OBLIGATIONS"}</motion.strong></AnimatePresence><small>{active?.urgency||"THE FIELD IS CLEAR"}</small></div><div className="qv2-field-outlook"><span>PROJECTED DISCRETIONARY BUFFER</span><strong className={projected<0?"qv2-risk":""}>{projected<0?"−":"+"}${Math.abs(projected).toLocaleString()}</strong><small>Cash less commitments and reserve</small></div>{interactive&&<ArrowUpRight size={18}/>}</div>
 </div>
}
