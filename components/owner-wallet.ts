"use client";
export type WalletProvider={request:(args:{method:string;params?:unknown[]})=>Promise<unknown>};
let ownerProvider:WalletProvider|undefined;
export function rememberOwnerProvider(value:WalletProvider){ownerProvider=value;}
export function selectedOwnerProvider():WalletProvider|undefined{
 if(typeof window==="undefined")return undefined;
 return ownerProvider || (window as Window&{ethereum?:WalletProvider}).ethereum;
}
