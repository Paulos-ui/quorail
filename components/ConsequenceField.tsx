"use client";
import {useMemo,useState} from "react";
import {AnimatePresence,motion,useReducedMotion} from "framer-motion";
import {ArrowUpRight} from "lucide-react";

type Entry={label:string;amount:number;urgency?:string};
const example:Entry[]=[
 {label:"CONTRACTORS",amount:850,urgency:"DUE / 02 DAYS"},
 {label:"INFRASTRUCTURE",amount:420,urgency:"DUE / 05 DAYS"},
 {label:"NEW REQUEST",amount:610,urgency:"AWAITING DECISION"},
 {label:"OPERATIONS",amount:320,urgency:"DUE / 12 DAYS"}
];
const money=(amount:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:2}).format(Math.abs(amount));
/** Financial diagram as an interactive ledger, never an orbit or fictional settlement. */
export default function ConsequenceField({entries,capital,reserve,interactive=true,compact=false}:{entries?:Entry[];capital?:number;reserve?:number;interactive?:boolean;compact?:boolean}){
 const items=useMemo(()=>entries!==undefined?entries.slice(0,5):example,[entries]);
 const cash=capital??3200, floor=reserve??600;
 const [selected,setSelected]=useState(0),[defer,setDefer]=useState(false);
 const activeIndex=Math.min(selected,Math.max(0,items.length-1));const active=items[activeIndex];
 const committed=items.reduce((sum,item)=>sum+item.amount,0);
 const planned=committed-(defer&&active?active.amount:0);
 const buffer=cash-planned-floor;
 const reduce=useReducedMotion();
 return <section className={`q4-field ${compact?"q4-field-compact":""}`} aria-label="Financial consequence comparison">
  <div className="q4-field-head"><span>CAPITAL / COMMITMENTS</span><span>{entries!==undefined?"TREASURY OBLIGATIONS":"PUBLIC EXAMPLE · NO FUNDS MOVED"}</span></div>
  <div className="q4-field-balance"><div><small>AVAILABLE CAPITAL</small><strong>{money(cash)}</strong></div><div><small>PROTECTED RESERVE</small><strong>{money(floor)}</strong></div></div>
  <div className="q4-field-track" aria-label={`Committed ${money(planned)}, reserve ${money(floor)}, projected free buffer ${money(buffer)}`} role="img"><motion.span animate={{width:`${Math.min(100,Math.max(0,cash>0?planned/cash*100:0))}%`}} transition={{duration:reduce?0:.35}}/><span style={{width:`${Math.max(0,cash>0?Math.min(100,floor/cash*100):0)}%`}}/><i/></div>
  <div className="q4-field-columns"><span>COMMITMENTS</span><span>DUE</span><span>AMOUNT</span></div>
  <div className="q4-field-entries">{items.length?items.map((item,index)=><button key={`${item.label}-${index}`} disabled={!interactive} aria-pressed={index===activeIndex} onClick={()=>{setSelected(index);setDefer(false)}} className={index===activeIndex?"active":""}><span>{item.label}</span><small>{item.urgency||"RECORDED"}</small><b>{money(item.amount)}</b></button>):<p className="q4-field-empty">There are no pending obligations yet. Add one to begin modeling your treasury.</p>}</div>
  <div className="q4-field-result"><div><small>MODEL AN ALTERNATIVE</small><strong>{active?.label??"NO COMMITMENT SELECTED"}</strong><div className="q4-field-switch"><button type="button" className={!defer?"selected":""} aria-pressed={!defer} onClick={()=>setDefer(false)}>Pay all</button><button type="button" disabled={!active} className={defer?"selected":""} aria-pressed={defer} onClick={()=>setDefer(true)}>Defer selected</button></div></div><div><small>PROJECTED FREE BUFFER</small><AnimatePresence mode="wait"><motion.strong key={buffer} initial={reduce?false:{y:8,opacity:0}} animate={{y:0,opacity:1}} exit={reduce?undefined:{y:-8,opacity:0}} className={buffer<0?"risk":""}>{buffer<0?"−":"+"}{money(buffer)}</motion.strong></AnimatePresence><span>{buffer<0?"Below protected reserve":"After obligations and reserve"}</span></div></div>
  <footer className="q4-field-foot"><span>ESTIMATE ONLY / NO PAYMENT SENT</span><ArrowUpRight size={15}/></footer>
 </section>;
}
