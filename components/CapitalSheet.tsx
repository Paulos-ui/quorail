"use client";

import {useMemo,useState} from "react";
import {AnimatePresence,motion,useReducedMotion} from "framer-motion";
import {ArrowDownRight,ArrowRight,ArrowUpRight} from "lucide-react";

type Commitment={id:string;name:string;description:string;value:number;due:string};
const commitments:Commitment[]=[
 {id:"c1",name:"Contractors",description:"October delivery milestone",value:850,due:"02 days"},
 {id:"c2",name:"Infrastructure",description:"Hosting and data services",value:420,due:"05 days"},
 {id:"c3",name:"New service request",description:"Proposed purchase",value:610,due:"Review"},
 {id:"c4",name:"Operations",description:"Recurring business costs",value:320,due:"12 days"}
];
const fmt=(n:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(Math.abs(n));
export default function CapitalSheet(){
 const [active,setActive]=useState("c3");
 const [deferred,setDeferred]=useState(false);
 const reduce=useReducedMotion();
 const selected=useMemo(()=>commitments.find(c=>c.id===active)!,[active]);
 const cash=3200,reserve=600,committed=commitments.reduce((sum,c)=>sum+c.value,0);
 const buffer=cash-reserve-committed+(deferred?selected.value:0);
 return <div className="q4-sheet" id="scenario" aria-label="Interactive illustrative capital allocation scenario">
   <div className="q4-sheet-caption"><span>FIG. 01 / A SMALL BUSINESS TREASURY</span><span>ILLUSTRATIVE NUMBERS · NO MONEY MOVES</span></div>
   <div className="q4-capital-line"><div><span className="q4-kicker">01 / AVAILABLE CAPITAL</span><strong>{fmt(cash)} <small>USDC</small></strong></div><div className="q4-capital-note">One balance. Four promises. A reserve that should stay untouched.</div></div>
   <div className="q4-capital-scale" role="img" aria-label={`3,200 USDC balance with 600 reserve, ${committed} obligations and ${buffer} projected discretionary buffer`}>
    <motion.div className="q4-scale-committed" animate={{width:`${(committed-(deferred?selected.value:0))/cash*100}%`}} transition={{duration:reduce?0:.55,type:"spring",bounce:0}}/>
    <div className="q4-scale-reserve" style={{width:`${reserve/cash*100}%`}}/>
    <div className="q4-scale-balance"/>
   </div>
   <div className="q4-scale-labels"><span>COMMITTED / {fmt(committed-(deferred?selected.value:0))}</span><span>PROTECTED / {fmt(reserve)}</span><span>BUFFER / {fmt(buffer)}</span></div>
   <div className="q4-sheet-heading"><span>02 / WHAT NEEDS TO BE PAID</span><span>SELECT A ROW TO TEST THE OUTCOME <ArrowDownRight size={14}/></span></div>
   <div className="q4-obligation-grid">
    {commitments.map((item,index)=><button type="button" onClick={()=>{setActive(item.id);setDeferred(false)}} key={item.id} className={`q4-obligation ${active===item.id?"is-active":""}`} aria-pressed={active===item.id}>
     <span className="q4-obligation-index">0{index+1}</span><span className="q4-obligation-name"><strong>{item.name}</strong><small>{item.description}</small></span><span className="q4-obligation-due">{item.due}</span><span className="q4-obligation-value">{fmt(item.value)}</span><ArrowUpRight size={16}/>
    </button>)}
   </div>
   <div className="q4-sheet-result"><div className="q4-result-left"><span className="q4-kicker">03 / TEST THE DECISION</span><h3>What happens if we {deferred?"wait?":"pay now?"}</h3><p>Change the treatment of <strong>{selected.name.toLowerCase()}</strong>. The buffer recalculates immediately. This is a scenario, not an agent decision or a transaction.</p><div className="q4-scenario-switch" role="group" aria-label="Scenario"><button onClick={()=>setDeferred(false)} className={!deferred?"selected":""} aria-pressed={!deferred}>Pay all</button><button onClick={()=>setDeferred(true)} className={deferred?"selected":""} aria-pressed={deferred}>Defer selected</button></div></div>
   <div className="q4-result-right"><span>PROJECTED FREE BUFFER</span><AnimatePresence mode="wait"><motion.strong key={buffer} initial={reduce?false:{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={reduce?undefined:{opacity:0,y:-10}} transition={{duration:.2}} className={buffer<0?"is-negative":""}>{buffer<0?"−":"+"}{fmt(buffer)}</motion.strong></AnimatePresence><span>{buffer<0?"This scenario reaches into protected capital.":deferred?"Waiting leaves more room for the other commitments.":"All commitments and the reserve remain accounted for."}</span></div></div>
   <div className="q4-sheet-foot"><span>Quorail considers the consequences before execution.</span><a href="#process">See the decision process <ArrowRight size={16}/></a></div>
  </div>
}
