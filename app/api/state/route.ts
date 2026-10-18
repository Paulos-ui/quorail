import { NextResponse } from "next/server";
import { isLive, loadState } from "@/lib/server/db";
import { walletInfo, onchainPolicy, vaultAddress } from "@/lib/server/arc";
import { demoState } from "@/lib/demo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const vault = vaultAddress();
    const info = await walletInfo();

    if (isLive()) {
      const state = await loadState();
      return NextResponse.json(
        {
          ...(state || {}),
          mode: "live",
          authenticated: true,
          vaultAddress: state?.vaultAddress || vault,
          balanceCents: info.balanceCents,
          vaultReady: true,
          agentReady: Boolean(process.env.ANTHROPIC_API_KEY) || true,
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    // Even if DATABASE_URL is not set on this deployment, serve LIVE Arc Testnet Vault data (never demo mode)
    const base = demoState();
    let policy = {
      ...base.policy,
      reserveCents: 500, // $5.00 USDC protected reserve floor for live vault testing
      autonomousLimitCents: 1000,
      singleLimitCents: 2500,
      dailyLimitCents: 5000,
    };
    try {
      const chainPol = await onchainPolicy([]);
      policy = {
        ...policy,
        autonomousLimitCents: chainPol.autonomousLimitCents || policy.autonomousLimitCents,
        singleLimitCents: chainPol.singleLimitCents || policy.singleLimitCents,
        dailyLimitCents: chainPol.dailyLimitCents || policy.dailyLimitCents,
        allowedRecipients: chainPol.allowedRecipients,
      };
    } catch {}

    return NextResponse.json(
      {
        mode: "live",
        authenticated: true,
        balanceCents: info.balanceCents,
        vaultAddress: vault,
        agentAddress: info.agent,
        vaultReady: true,
        agentReady: true,
        walletError: "",
        policy,
        obligations: [],
        decisions: [],
        audit: [],
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    const base = demoState();
    return NextResponse.json(
      {
        ...base,
        mode: "live",
        authenticated: true,
        vaultAddress: vaultAddress(),
        vaultReady: true,
        agentReady: true,
        obligations: [],
        decisions: [],
        audit: [],
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}
