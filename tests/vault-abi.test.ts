import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { vaultAbi } from "../lib/core/abi";

const vault = readFileSync(new URL("../contracts/QuorailVault.sol", import.meta.url), "utf8").split("contract QuorailVault {")[1];
if (!vault) throw new Error("QuorailVault source not found");

test("vault ABI covers every external and public Solidity function", () => {
 const funcs = [...vault.matchAll(/\bfunction\s+(\w+)\s*\([^)]*\)\s*[^;{]*\b(?:external|public)\b/g)].map(m => m[1]);
 const known = new Set<string>(vaultAbi.filter(item => item.type === "function").map(item => item.name));
 assert.ok(funcs.length > 5, "expected Solidity functions");
 for (const name of funcs) assert.ok(known.has(name), `Missing vault ABI function: ${name}`);
});

test("owner pause selector accepts a boolean", () => {
 const pause = vaultAbi.find(item => item.type === "function" && item.name === "setPaused");
 assert.ok(pause, "setPaused missing from ABI");
 assert.deepEqual(pause.inputs.map(i => i.type), ["bool"]);
 assert.equal(pause.stateMutability, "nonpayable");
});

test("recipient allowlisting selector requires address and bool", () => {
 const setRecipient = vaultAbi.find(item => item.type === "function" && item.name === "setRecipient");
 assert.ok(setRecipient);
 assert.deepEqual(setRecipient.inputs.map(i => i.type), ["address", "bool"]);
});
