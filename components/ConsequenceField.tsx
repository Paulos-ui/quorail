"use client";
import {useMemo,useState} from "react";
import {motion,AnimatePresence} from "framer-motion";
import {ArrowUpRight,MoveRight} from "lucide-react";

type Entry={label:string;amount:number;urgency?:string};
export default function ConsequenceField({entries,capital,reserve,interactive=true,compact=false}:{entries?:Entry[],capital?:number,reserve?:number,interactive?:boolean,compact?:boolean}){
 const values=useMemo(()=>entries!==undefined?entries.slice(0,5):[
  {label:"CONTRACTORS",amount:850,urgency:"DUE / 02 DAYS"},
  {label:"INFRASTRUCTURE",amount:420,urgency:"DUE / 05 DAYS"},
  {label:"NEW REQUEST",amount:610,urgency:"AWAITING DECISION"},
  {label:"OPERATIONS",amount:320,urgency:"DUE / 12 DAYS"}
 ],[entries]);
 const cash=capital??3200;const floor=reserve??600;
 const [selected,setSelected]=useState(2);const active=values[Math.min(selected,values.length-1)];
 const committed=values.reduce((s,v)=>s+v.amount,0);const available=cash-committed-floor;
 const positioned=[[447,98],[633,220],[568,450],[232,420],[120,180]];
 return <div className={`qv2-field ${compact?"qv2-field-compact":""}`}>
  <div className="qv2-field-top"><span>CONSEQUENCE FIELD <span className="qv2-field-tick">/ 001</span></span><span><i/> {entries?"TREASURY MODEL":"ILLUSTRATIVE MODEL"}</span></div>
  <div className="qv2-field-canvas"><svg viewBox="0 0 760 550" role="img" aria-label="Interactive consequence graph showing how available capital connects to obligations" preserveAspectRatio="xMidYMid meet">
   <defs><pattern id="qv2-fine-grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0V28" fill="none" stroke="currentColor" strokeWidth=".55" opacity=".11"/></pattern><linearGradient id="qv2-flow" x1="0" x2="1"><stop stopColor="#e2ad70"/><stop offset="1" stopColor="#80bdba"/></linearGradient></defs>
   <rect x="0" y="0" width="760" height="550" fill="url(#qv2-fine-grid)"/>
   <g fill="none" stroke="currentColor" opacity=".22"><ellipse cx="350" cy="278" rx="214" ry="210" strokeDasharray="2 9"/><ellipse cx="350" cy="278" rx="160" ry="153"/><path d="M350 16V533M25 278H735" strokeDasharray="3 12"/></g>
   {values.map((ob,i)=>{const [x,y]=positioned[i];const chosen=i===Math.min(selected,values.length-1);return <g key={ob.label+i}>
    <motion.path d={`M350 278 Q${(350+x)/2+(i%2?-35:25)} ${(278+y)/2-55} ${x} ${y}`} fill="none" stroke={chosen?"#e8b776":"#8a8590"} strokeWidth={chosen?3:1.3} strokeDasharray={chosen?undefined:"5 8"} initial={{pathLength:0}} animate={{pathLength:1}} transition={{duration:1.1,delay:i*.11}}/>
    {chosen&&<motion.circle cx={x} cy={y} r={37} fill="none" stroke="#e7b477" strokeWidth="1" animate={{r:[37,52,37],opacity:[.55,.10,.55]}} transition={{duration:3,repeat:Infinity}}/>}
    <g className={interactive?"qv2-svg-target":""} role={interactive?"button":undefined} tabIndex={interactive?0:undefined} aria-label={`${ob.label}, ${ob.amount} USDC`} onClick={()=>interactive&&setSelected(i)} onKeyDown={e=>{if(interactive&&(e.key==="Enter"||e.key===" ")){e.preventDefault();setSelected(i)}}}>
    <circle cx={x} cy={y} r={chosen?31:26} fill={chosen?"#e8b776":"#342e3e"} stroke={chosen?"#e8b776":"#797280"} strokeWidth="1.5"/>
    <text x={x} y={y+4} textAnchor="middle" fontSize="13" fontFamily="monospace" fill={chosen?"#272130":"#e1ded4"}>{String(i+1).padStart(2,"0")}</text>
    <circle cx={x} cy={y} r="38" fill="transparent"/>
    </g>
    <text x={x} y={y-45} textAnchor="middle" fontSize="10" letterSpacing="1.2" fontFamily="monospace" fill="#e2dad0">{ob.label.slice(0,19)}</text>
    <text x={x} y={y+53} textAnchor="middle" fontSize="13" fontFamily="monospace" fill={chosen?"#e6bb88":"#a39ba6"}>{ob.amount.toLocaleString()} USDC</text>
   </g>})}
   <motion.circle cx="350" cy="278" r="83" fill="none" stroke="#e0bd89" strokeDasharray="2 7" animate={{rotate:360}} style={{transformOrigin:"350px 278px"}} transition={{duration:45,ease:"linear",repeat:Infinity}}/>
   <circle cx="350" cy="278" r="73" fill="#dcb67e"/><circle cx="350" cy="278" r="66" fill="#292334" stroke="#bd9269"/>
   <text x="350" y="251" textAnchor="middle" fill="#bfb5a6" fontSize="10" fontFamily="monospace" letterSpacing="1.7">OPERATING CAPITAL</text>
   <text x="350" y="289" textAnchor="middle" fill="#ffead0" fontSize="28" fontFamily="Arial" fontWeight="600">${cash.toLocaleString()}</text>
   <text x="350" y="311" textAnchor="middle" fill="#a4b6ad" fontSize="9" fontFamily="monospace">USDC / ARC</text>
   </svg>
  </div>
  <div className="qv2-field-inspector"><div><span className="qv2-label">SELECTED COMMITMENT</span><AnimatePresence mode="wait"><motion.strong key={active?.label} initial={{y:8,opacity:0}} animate={{y:0,opacity:1}} exit={{y:-8,opacity:0}}>{active?.label||"NONE"}</motion.strong></AnimatePresence><small>{active?.urgency||"REGISTERED OBLIGATION"}</small></div><div className="qv2-field-outlook"><span>POST-COMMITMENT BUFFER</span><strong className={available<0?"qv2-risk":""}>{available<0?"−":"+"}${Math.abs(available).toLocaleString()}</strong><small>Capital less commitments and reserve</small></div>{interactive&&<ArrowUpRight size={18}/>}</div>
 </div>;
}
