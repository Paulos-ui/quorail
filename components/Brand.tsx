import Link from "next/link";

/** Folio-style Q mark: a stamped ledger initial, not an orbit or blockchain coin. */
export function Mark({size=36}:{size?:number}){
 return <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" role="presentation"><rect x="1" y="1" width="46" height="46" fill="#173B59"/><path d="M14 15H34V32H14Z" fill="none" stroke="#fff" strokeWidth="2.1"/><path d="M20 21H28M20 26H28" fill="none" stroke="#fff" strokeWidth="2"/><path d="M28 31L37 40" stroke="#fff" strokeWidth="3"/></svg>
}
export function Brand({href="/",compact=false}:{href?:string;compact?:boolean}){
 return <Link href={href} className="brand" aria-label="Quorail home"><Mark size={compact?32:37}/><span>quorail<span className="brand-period">.</span></span></Link>;
}
