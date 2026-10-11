"use client";
import {motion,useScroll,useSpring} from "framer-motion";
export default function DocsProgress(){const {scrollYProgress}=useScroll();const progress=useSpring(scrollYProgress,{stiffness:105,damping:28,restDelta:.002});return <div className="qv2-docs-progress" aria-hidden="true"><motion.div style={{scaleX:progress}}/></div>}
