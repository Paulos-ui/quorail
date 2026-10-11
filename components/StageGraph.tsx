"use client";
import {motion,MotionValue,useTransform} from "framer-motion";
const nodes=[{x:355,y:295,r:88,label:"OPERATING CAPITAL",value:"$10,000"},{x:118,y:114,r:48,label:"VENDORS",value:"$2,400"},{x:601,y:120,r:56,label:"PAYROLL",value:"$3,100"},{x:642,y:381,r:43,label:"RESERVE",value:"$1,800"},{x:159,y:427,r:46,label:"SYSTEMS",value:"$1,100"}];
export function StageGraph({progress}:{progress:MotionValue<number>}){
 const scale=useTransform(progress,[0,.42,1],[.86,1,1.08]);
 const rotate=useTransform(progress,[0,1],[-5,6]);
 const fade=useTransform(progress,[0,.12,.77,1],[.35,1,1,.3]);
 const lineProgress=useTransform(progress,[0,.35],[0,1]);
 return <motion.svg className="stage-graph" viewBox="0 0 740 540" role="img" aria-label="A dynamic map of an operating treasury and its financial commitments" style={{scale,rotate,opacity:fade}}>
  <defs><pattern id="griddots" width="21" height="21" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".8" fill="#adad9b" opacity=".26"/></pattern><radialGradient id="capital"><stop offset="0" stopColor="#34594e"/><stop offset="1" stopColor="#183a33"/></radialGradient></defs>
  <rect width="740" height="540" fill="url(#griddots)"/>
  <circle cx="355" cy="295" r="202" stroke="#b7b8a6" strokeWidth="1" strokeDasharray="2 12" fill="none"/>
  <circle cx="355" cy="295" r="148" stroke="#cacabc" strokeWidth="1" fill="none"/>
  {nodes.slice(1).map((n,i)=><motion.path key={i} d={`M355 295 Q ${((355+n.x)/2)+((i%2)?-45:40)} ${((295+n.y)/2)-35} ${n.x} ${n.y}`} stroke={i===0?"#be7349":"#81998e"} strokeWidth={i===0?2:1.6} fill="none" strokeDasharray="7 7" style={{pathLength:lineProgress}}/>)}
  {nodes.map((n,i)=><g key={n.label}>
    <motion.circle cx={n.x} cy={n.y} r={n.r+9} stroke={i===0?"#b6bca4":"#d3d1c2"} fill="none" strokeDasharray="2 7" initial={{opacity:.4}} animate={{opacity:[.25,.8,.25]}} transition={{repeat:Infinity,duration:4+i}}/>
    <circle cx={n.x} cy={n.y} r={n.r} fill={i===0?"url(#capital)":i===1?"#b7754b":i===3?"#d5ddc8":"#e6e3d5"} stroke={i===0?"#24483f":"#b7bba9"} strokeWidth="1.4"/>
    <text x={n.x} y={n.y-(i===0?12:4)} textAnchor="middle" fontSize={i===0?11:8.5} letterSpacing="1.5" fill={i<=1?"#f2efe3":"#566359"}>{n.label}</text>
    <text x={n.x} y={n.y+(i===0?27:18)} textAnchor="middle" fontSize={i===0?35:17} fontWeight="600" letterSpacing="-1" fill={i<=1?"#faf7ec":"#203a33"}>{n.value}</text>
  </g>)}
  <circle cx="444" cy="178" r="4.5" fill="#b7754b"/><circle cx="444" cy="178" r="11" fill="none" stroke="#b7754b" opacity=".5"/>
  <text x="468" y="175" fontSize="11" fontWeight="600" fill="#9e6849">DECISION POINT</text><text x="468" y="190" fontSize="10" fill="#7b8576">What happens next?</text>
 </motion.svg>;
}
export function MiniConstellation({tone="dark"}:{tone?:"dark"|"light"}){return <svg viewBox="0 0 420 245" className={`mini-constellation ${tone}`} aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="1"><path d="M211 122L71 51M211 122L349 57M211 122L339 208M211 122L72 198" opacity=".3" strokeDasharray="3 7"/><circle cx="211" cy="122" r="84" opacity=".14"/><circle cx="211" cy="122" r="49" opacity=".2"/><circle cx="211" cy="122" r="28"/></g><circle cx="211" cy="122" r="14" fill="#b97b54"/><circle cx="71" cy="51" r="21" fill="#b97b54"/><circle cx="349" cy="57" r="16" fill="#b4c4ad"/><circle cx="339" cy="208" r="26" fill="#c8ccb4"/><circle cx="72" cy="198" r="18" fill="#e1c2a5"/></svg>}
