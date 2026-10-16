/** EIP-6963 plus explicit OKX/legacy injected-provider discovery.
 * No network request is sent by discovery and no secret is ever read.
 */
export type WalletProvider={
 request:(args:{method:string;params?:unknown[]})=>Promise<unknown>;
 isOkxWallet?:boolean;
 isMetaMask?:boolean;
 isRabby?:boolean;
};
export type WalletOption={id:string;name:string;provider:WalletProvider;source:"announced"|"injected"};
export type AnnouncedWallet={info:{uuid:string;name:string;icon?:string;rdns?:string};provider:WalletProvider};
type WalletHost={ethereum?:WalletProvider&{providers?:WalletProvider[]};okxwallet?:WalletProvider|{ethereum?:WalletProvider};rabby?:WalletProvider};
export function isWalletProvider(value:unknown):value is WalletProvider{
 return !!value&&typeof value==="object"&&typeof (value as WalletProvider).request==="function";
}
export function injectedWalletOptions(source:unknown):WalletOption[]{
 const host=source as WalletHost;
 const options:WalletOption[]=[];
 const add=(provider:unknown,id:string,name:string)=>{
  if(isWalletProvider(provider)&&!options.some(item=>item.provider===provider))options.push({id,name,provider,source:"injected"});
 };
 const okx=host.okxwallet;
 if(okx){
  const candidate=isWalletProvider(okx)?okx:("ethereum" in okx?okx.ethereum:undefined);
  add(candidate,"okx","OKX Wallet");
 }
 // Several browser wallets maintain a distinct provider in ethereum.providers.
 for(const provider of host.ethereum?.providers||[]){
  if(provider.isOkxWallet)add(provider,"okx","OKX Wallet");
  else if(provider.isRabby)add(provider,"rabby","Rabby");
  else if(provider.isMetaMask)add(provider,"metamask","MetaMask");
  else add(provider,"injected","Browser wallet");
 }
 if(host.ethereum?.isOkxWallet)add(host.ethereum,"okx","OKX Wallet");
 else if(host.ethereum?.isRabby)add(host.ethereum,"rabby","Rabby");
 else if(host.ethereum?.isMetaMask)add(host.ethereum,"metamask","MetaMask");
 else add(host.ethereum,"injected","Browser wallet");
 add(host.rabby,"rabby","Rabby");
 return options;
}
export function mergeWalletOptions(announced:WalletOption[],injected:WalletOption[]):WalletOption[]{
 const options=[...announced,...injected];
 return options.filter((item,index)=>options.findIndex(option=>option.provider===item.provider)===index);
}
export function announcedWalletOption(item:AnnouncedWallet):WalletOption|null{
 if(!item?.info?.uuid||!item.info.name||!isWalletProvider(item.provider))return null;
 const isOkx=item.info.name.toLowerCase().includes("okx")||item.info.rdns?.toLowerCase().includes("okx");
 return {id:`eip6963:${item.info.uuid}`,name:isOkx?"OKX Wallet":item.info.name,provider:item.provider,source:"announced"};
}
export function walletLabel(value:WalletOption){return value.name==="Browser wallet"?"Injected EVM wallet":value.name;}
