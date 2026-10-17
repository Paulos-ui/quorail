/** Public ownership diagnostic; vault-owner addresses are already public on Arc. */
import { NextResponse } from "next/server";
import { ownerAddress } from "@/lib/server/auth";
import { vaultAddress, configuredOwnerAddress, cleanRpcError } from "@/lib/server/arc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const vault = vaultAddress();
  if (!vault) {
    return NextResponse.json(
      { error: "VAULT_ADDRESS is not configured on this environment." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
  try {
    const owner = await ownerAddress();
    return NextResponse.json(
      { vault, owner, chainId: 5042002 },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    const fallbackOwner = configuredOwnerAddress();
    if (fallbackOwner) {
      return NextResponse.json(
        { vault, owner: fallbackOwner, chainId: 5042002, fallback: true },
        { headers: { "Cache-Control": "no-store" } }
      );
    }
    return NextResponse.json(
      {
        vault,
        chainId: 5042002,
        error: cleanRpcError(e, "Could not verify Arc vault ownership over server RPC"),
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
