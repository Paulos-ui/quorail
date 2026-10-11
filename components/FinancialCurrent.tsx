"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";

/**
 * A background notation of Quorail's financial reasoning, not a live chart.
 * Lines lead from available capital to obligations and a protected reserve.
 * No transaction animation suggests real money was sent.
 */
export default function FinancialCurrent(){
 const frame=useRef<HTMLDivElement|null>(null);
 const reduced=useReducedMotion();
 const {scrollYProgress}=useScroll({target:frame,offset:["start end","end start"]});
 const line=useSpring(useTransform(scrollYProgress,[0,.35,.8],[.65,1,.82]),{stiffness:65,damping:26});
 const drift=useTransform(scrollYProgress,[0,1],[14,-24]);
 return <motion.div className="q42-current" ref={frame} style={reduced?undefined:{y:drift}} aria-hidden="true">
  <svg viewBox="0 0 740 480" preserveAspectRatio="xMidYMid meet" role="presentation">
   <g className="q42-current-guides">
    {[100,195,290,385].map(y=><path key={y} d={`M30 ${y} H718`}/>)}
    {[78,214,350,486,622].map(x=><path key={x} d={`M${x} 36 V447`}/>)}
   </g>
   <g className="q42-current-lines">
    <motion.path d="M88 250 C224 250 255 114 389 114 S558 96 664 96" style={reduced?undefined:{pathLength:line}}/>
    <motion.path d="M88 250 C240 250 268 242 399 242 S560 244 664 244" style={reduced?undefined:{pathLength:line}}/>
    <motion.path d="M88 250 C231 250 265 386 396 386 S554 393 664 393" style={reduced?undefined:{pathLength:line}}/>
   </g>
   <g className="q42-current-dash">
    <path d="M88 250 C224 250 255 114 389 114 S558 96 664 96"/>
    <path d="M88 250 C240 250 268 242 399 242 S560 244 664 244"/>
    <path d="M88 250 C231 250 265 386 396 386 S554 393 664 393"/>
   </g>
   <circle cx="88" cy="250" r="20" className="q42-current-core"/>
   <circle cx="88" cy="250" r="4" className="q42-current-dot"/>
   {[[664,96],[664,244],[664,393]].map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r="18" className="q42-current-target"/><circle cx={x} cy={y} r="4" className="q42-current-dot"/></g>)}
   <g className="q42-current-type">
    <text x="48" y="212">CAPITAL</text><text x="544" y="65">OBLIGATIONS</text><text x="573" y="214">TIME</text><text x="567" y="364">RESERVE</text>
    <text x="62" y="302" className="q42-current-micro">01</text><text x="691" y="100" className="q42-current-micro">02</text><text x="691" y="248" className="q42-current-micro">03</text><text x="691" y="397" className="q42-current-micro">04</text>
   </g>
  </svg>
 </motion.div>;
}
