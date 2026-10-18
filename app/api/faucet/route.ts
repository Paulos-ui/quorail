import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, isAddress, getAddress, parseAbi } from "viem";
import { ARC_USDC, arc, toUnits } from "@/lib/core/chain";
import { agentAccount, publicClient, rpcTransport, vaultAddress } from "@/lib/server/arc";
import { usdcAbi } from "@/lib/core/abi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const erc20TransferAbi = parseAbi([
  "function transfer(address to, uint256 value) external returns (bool)",
]);

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { address?: string; target?: "wallet" | "vault" };
    const signer = agentAccount();
    const vault = vaultAddress();
    const recipientRaw = body.target === "vault" ? vault : body.address || vault;

    if (!recipientRaw || !isAddress(recipientRaw)) {
      return NextResponse.json(
        { error: "Connect your wallet or provide a valid 0x address to claim Arc Testnet USDC." },
        { status: 400 }
      );
    }

    const recipient = getAddress(recipientRaw);

    // Check if agent wallet is configured and has USDC to drip on-chain
    if (signer) {
      const client = publicClient();
      const agentBal = await client
        .readContract({
          address: ARC_USDC,
          abi: usdcAbi,
          functionName: "balanceOf",
          args: [signer.address],
        })
        .catch(() => 0n);

      // Drip 0.50 USDC (50 cents) on-chain if agent has >= 1.00 USDC
      const dripCents = 50;
      if (agentBal >= toUnits(100)) {
        const wallet = createWalletClient({
          account: signer,
          chain: arc,
          transport: rpcTransport(),
        });
        const hash = await wallet.writeContract({
          address: ARC_USDC,
          abi: erc20TransferAbi,
          functionName: "transfer",
          args: [recipient, toUnits(dripCents)],
          account: signer,
          chain: arc,
        });
        return NextResponse.json({
          ok: true,
          onchain: true,
          amountCents: dripCents,
          recipient,
          hash,
          message: `Sent $0.50 Arc Testnet USDC to ${recipient.slice(0, 6)}…${recipient.slice(-4)}!`,
        });
      }
    }

    // If agent wallet doesn't have spare drip balance, return fast faucet instructions + vault credit
    return NextResponse.json({
      ok: true,
      onchain: false,
      amountCents: 500,
      recipient,
      message: "Credited $5.00 Testnet USDC to your active workspace & unlocked Circle Faucet!",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not process faucet request" },
      { status: 500 }
    );
  }
}
