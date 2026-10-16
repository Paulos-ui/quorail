import {test} from "node:test";
import {strict as assert} from "node:assert";
import {announcedWalletOption,injectedWalletOptions,mergeWalletOptions,type WalletProvider} from "../components/wallet-providers";
const wallet=():WalletProvider=>({request:async()=>[]});
test("OKX provider in its dedicated namespace is available even when MetaMask owns window.ethereum",()=>{
 const okx=wallet(),metamask=wallet();metamask.isMetaMask=true;
 const options=injectedWalletOptions({ethereum:metamask,okxwallet:{ethereum:okx}});
 assert.equal(options.length,2);
 assert.equal(options[0].name,"OKX Wallet");
 assert.equal(options[0].provider,okx);
 assert.equal(options[1].name,"MetaMask");
});
test("OKX provider can be discovered from ethereum.providers",()=>{
 const okx=wallet();okx.isOkxWallet=true;
 const meta=wallet();meta.isMetaMask=true;
 const options=injectedWalletOptions({ethereum:Object.assign(meta,{providers:[okx,meta]})});
 assert.ok(options.some(w=>w.name==="OKX Wallet"&&w.provider===okx));
 assert.equal(options.filter(w=>w.provider===meta).length,1);
});
test("EIP-6963 announcements are preferred and duplicate injected providers are suppressed",()=>{
 const okx=wallet();
 const announced=announcedWalletOption({info:{uuid:"f8a0",name:"OKX Wallet",rdns:"com.okx.wallet"},provider:okx});
 assert.ok(announced);
 const merged=mergeWalletOptions([announced!],injectedWalletOptions({okxwallet:okx}));
 assert.equal(merged.length,1);
 assert.equal(merged[0].source,"announced");
});
test("no wallet injection produces no fake clickable connection",()=>{
 assert.deepEqual(injectedWalletOptions({}),[]);
});
